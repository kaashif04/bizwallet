import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billplzEnabled, createBill, getBill } from "@/lib/billplz";
import { confirmBill } from "@/lib/pickup-payment";

// Start (or resume) paying for a pickup order. Returns the Billplz page to
// send the customer to, or { paid: true } if it's already paid.
export async function POST(request: Request) {
  if (!billplzEnabled()) {
    return NextResponse.json({ error: "Online payment isn't set up yet. Please order at the counter." }, { status: 503 });
  }
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in to pay." }, { status: 401 });

  const { order_id, claim_token } = await request.json().catch(() => ({}));
  if (typeof order_id !== "string" || typeof claim_token !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("guest_orders")
    .select("id, claim_token, status, amount_due, payment_ref, outlet_id")
    .eq("id", order_id)
    .maybeSingle();
  if (!order || order.claim_token !== claim_token) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") return NextResponse.json({ paid: true });

  try {
    if (order.payment_ref) {
      if (await confirmBill(order.payment_ref)) return NextResponse.json({ paid: true });
      return NextResponse.json({ url: (await getBill(order.payment_ref)).url });
    }

    const origin = new URL(request.url).origin;
    const [{ data: outlet }, { data: member }] = await Promise.all([
      admin.from("outlets").select("name").eq("id", order.outlet_id).maybeSingle(),
      admin.from("members").select("full_name").eq("id", user.id).maybeSingle(),
    ]);
    const bill = await createBill({
      email: user.email,
      name: member?.full_name || user.email.split("@")[0],
      amountSen: Math.round(Number(order.amount_due) * 100),
      description: `Pickup order at ${outlet?.name ?? "BizWallet"}`,
      callbackUrl: `${origin}/api/pay/billplz/callback`,
      redirectUrl: `${origin}/api/pay/billplz/return?order=${order.id}`,
      reference: order.id,
    });
    // Only the first bill sticks, so two taps can't leave two live bills.
    const { data: saved } = await admin
      .from("guest_orders")
      .update({ payment_ref: bill.id })
      .eq("id", order.id)
      .is("payment_ref", null)
      .select("payment_ref")
      .maybeSingle();
    if (saved) return NextResponse.json({ url: bill.url });
    const { data: winner } = await admin.from("guest_orders").select("payment_ref").eq("id", order.id).single();
    return NextResponse.json({ url: (await getBill(winner!.payment_ref!)).url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
