import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billplzEnabled, createBill, deleteBill, getBill } from "@/lib/billplz";
import { confirmBill } from "@/lib/pickup-payment";

// Start (or resume) paying for an order (pickup, or dine-in paid in the app). Returns the Billplz page to
// send the customer to, or { paid: true } if it's already paid.
export async function POST(request: Request) {
  if (!billplzEnabled()) {
    return NextResponse.json({ error: "Online payment isn't set up yet. Please order at the counter." }, { status: 503 });
  }
  const {
    data: { user },
  } = await createClient().auth.getUser();
  const { order_id, claim_token, mobile, name, email } = await request.json().catch(() => ({}));
  if (typeof order_id !== "string" || typeof claim_token !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Signed out (a guest at a table, pickup, or the kiosk): the claim token below
  // proves it's their order; Billplz needs their phone, name and email are optional.
  const phone = typeof mobile === "string" ? mobile.replace(/\D/g, "") : "";
  const guestEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : undefined;
  const guestName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!user?.email && phone.length < 9) {
    return NextResponse.json({ error: "Add your phone number to pay." }, { status: 400 });
  }

  const { data: order } = await admin
    .from("guest_orders")
    .select("id, claim_token, status, amount_due, payment_ref, outlet_id, created_at, table_id, kiosk_id, delivery_fee")
    .eq("id", order_id)
    .maybeSingle();
  if (!order || order.claim_token !== claim_token) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status === "rejected") {
    return NextResponse.json({ error: "This order was cancelled. Please order again." }, { status: 410 });
  }
  if (order.status !== "awaiting_payment") return NextResponse.json({ paid: true });
  // Same 30-minute window as fn_guest_payment_expired; an open bill can still be paid.
  if (!order.payment_ref && Date.now() - Date.parse(order.created_at) > 30 * 60_000) {
    return NextResponse.json({ error: "This order expired. Please order again." }, { status: 410 });
  }

  try {
    if (order.payment_ref) {
      if ((await confirmBill(order.payment_ref)).paid) return NextResponse.json({ paid: true });
      return NextResponse.json({ url: (await getBill(order.payment_ref)).url });
    }

    const origin = new URL(request.url).origin;
    const [{ data: outlet }, { data: member }] = await Promise.all([
      admin.from("outlets").select("name").eq("id", order.outlet_id).maybeSingle(),
      user ? admin.from("members").select("full_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const kind = order.table_id ? "dinein" : order.kiosk_id ? "kiosk" : order.delivery_fee != null ? "delivery" : "pickup";
    const bill = await createBill({
      kind,
      outlet: outlet?.name,
      email: user?.email ?? guestEmail,
      mobile: user?.email ? undefined : phone,
      name: member?.full_name || user?.email?.split("@")[0] || guestName || "Guest",
      amountSen: Math.round(Number(order.amount_due) * 100),
      description: `${{ dinein: "Dine-in", kiosk: "Kiosk", delivery: "Delivery", pickup: "Pickup" }[kind]} order at ${outlet?.name ?? "BizWallet"}`,
      callbackUrl: `${origin}/api/pay/billplz/callback`,
      redirectUrl: `${origin}/api/pay/billplz/return?order=${order.id}`,
      reference: order.id,
    });
    // Only the first bill sticks, so two taps can't leave two live bills.
    const { data: saved, error: saveError } = await admin
      .from("guest_orders")
      .update({ payment_ref: bill.id })
      .eq("id", order.id)
      .is("payment_ref", null)
      .select("payment_ref")
      .maybeSingle();
    if (saveError) {
      // The database refused (cancelled or too old): kill the new bill and show why.
      await deleteBill(bill.id).catch(() => {});
      return NextResponse.json({ error: saveError.message }, { status: 410 });
    }
    if (saved) return NextResponse.json({ url: bill.url });
    const { data: winner } = await admin.from("guest_orders").select("payment_ref").eq("id", order.id).single();
    return NextResponse.json({ url: (await getBill(winner!.payment_ref!)).url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
