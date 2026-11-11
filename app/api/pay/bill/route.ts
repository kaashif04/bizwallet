import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billplzEnabled, createBill, deleteBill, getBill } from "@/lib/billplz";
import { cancelBillPayment, confirmBill } from "@/lib/pickup-payment";

// Open Billplz for a share of a table bill (wallet_bill_pay_start made it and set
// the amount). Returns the Billplz page, or { paid: true } if it's already paid.
export async function POST(request: Request) {
  if (!billplzEnabled() || process.env.BILL_SPLIT !== "1") {
    return NextResponse.json({ error: "Paying the bill from your phone isn't on here yet. Please pay at the counter." }, { status: 503 });
  }
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in to pay." }, { status: 401 });

  const { payment_id, token, cancel } = await request.json().catch(() => ({}));
  if (typeof payment_id !== "string" || typeof token !== "string" || !/^[\w-]{1,64}$/.test(token)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pay } = await admin
    .from("wallet_bill_payments")
    .select("id, member_id, amount, status, payment_ref, outlet_id, created_at")
    .eq("id", payment_id)
    .maybeSingle();
  if (!pay || pay.member_id !== user.id) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (pay.status === "paid") return NextResponse.json({ paid: true });
  if (pay.status !== "pending") return NextResponse.json({ error: "That payment was cancelled.", gone: true }, { status: 410 });

  // The diner gave up on their own payment: free the amount now instead of after the 10-minute cleanup.
  if (cancel === true) {
    try {
      if (pay.payment_ref) return NextResponse.json(await cancelBillPayment(pay.payment_ref));
      // No Billplz bill yet: nothing can be paid. The DB refuses a bill link on a cancelled row.
      await admin.from("wallet_bill_payments").update({ status: "cancelled" }).eq("id", pay.id).eq("status", "pending").is("payment_ref", null);
      return NextResponse.json({ paid: false });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }
  // Same 30 minutes the amount is held for (fn_bill_held).
  if (!pay.payment_ref && Date.now() - Date.parse(pay.created_at) > 30 * 60_000) {
    return NextResponse.json({ error: "This took too long. Please check the bill and try again." }, { status: 410 });
  }

  try {
    if (pay.payment_ref) {
      if ((await confirmBill(pay.payment_ref)).paid) return NextResponse.json({ paid: true });
      return NextResponse.json({ url: (await getBill(pay.payment_ref)).url });
    }
    const origin = new URL(request.url).origin;
    const [{ data: outlet }, { data: member }] = await Promise.all([
      admin.from("outlets").select("name").eq("id", pay.outlet_id).maybeSingle(),
      admin.from("members").select("full_name").eq("id", user.id).maybeSingle(),
    ]);
    const bill = await createBill({
      kind: "dinein",
      outlet: outlet?.name,
      email: user.email,
      name: member?.full_name || user.email.split("@")[0],
      amountSen: Math.round(Number(pay.amount) * 100),
      description: `Your share of the bill at ${outlet?.name ?? "the restaurant"}`,
      callbackUrl: `${origin}/api/pay/billplz/callback`,
      redirectUrl: `${origin}/api/pay/billplz/return?table=${encodeURIComponent(token)}`,
      reference: pay.id,
    });
    // Only the first bill sticks, so two taps can't leave two live bills.
    const { data: saved, error: saveError } = await admin
      .from("wallet_bill_payments")
      .update({ payment_ref: bill.id })
      .eq("id", pay.id)
      .is("payment_ref", null)
      .select("payment_ref")
      .maybeSingle();
    if (saveError) {
      // The database refused (cancelled or too old): kill the new bill and show why.
      await deleteBill(bill.id).catch(() => {});
      return NextResponse.json({ error: saveError.message }, { status: 410 });
    }
    if (saved) return NextResponse.json({ url: bill.url });
    const { data: winner } = await admin.from("wallet_bill_payments").select("payment_ref").eq("id", pay.id).single();
    return NextResponse.json({ url: (await getBill(winner!.payment_ref!)).url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
