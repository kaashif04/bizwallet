import { NextResponse } from "next/server";
import { hookAuthorized } from "@/lib/hook-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentOrder, payoutEnabled } from "@/lib/billplz";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// BizPos says "send this refund": we create the Billplz Payment Order. Any failure marks the payout
// failed (with the reason) so the restaurant sees it; the bank result arrives at /api/refunds/callback.
export async function POST(request: Request) {
  if (!(await hookAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { payout_id } = await request.json().catch(() => ({}));
  if (typeof payout_id !== "string" || !UUID.test(payout_id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();
  const { data: d, error: detailsError } = await admin.rpc("wallet_payout_details", { p_id: payout_id });
  if (detailsError) return NextResponse.json({ error: detailsError.message }, { status: 500 });
  if (!d) return NextResponse.json({ skipped: true }); // not 'sending' (already handled)

  const fail = async (message: string) => {
    await admin.rpc("wallet_payout_update", { p_id: payout_id, p_status: "failed", p_ref: null, p_error: message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: message });
  };
  if (!payoutEnabled()) return fail("Refund payouts aren't set up yet.");

  let orderId: string;
  try {
    orderId = (
      await createPaymentOrder({
        bankCode: d.bank_code,
        account: d.account_number,
        name: d.holder_name,
        amountSen: d.amount_sen,
        description: d.description || "Refund",
        reference: d.reference || d.id,
      })
    ).id;
  } catch (e) {
    return fail((e as Error).message);
  }
  // Billplz has the order now. If this save fails, don't mark it failed (it would be paid twice on retry): say so.
  const { error } = await admin.rpc("wallet_payout_update", { p_id: payout_id, p_status: "sent", p_ref: orderId, p_error: null });
  if (error) return NextResponse.json({ error: `Sent to Billplz (${orderId}) but couldn't save: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, billplz_id: orderId });
}
