import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentOrder } from "@/lib/billplz";

// Billplz posts here when a refund payout finishes (set it as the Payment Order collection's callback_url).
// We only take the id from the POST and re-read the order from Billplz. Repeats are harmless.
export async function POST(request: Request) {
  const id = (await request.formData().catch(() => null))?.get("id");
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const order = await getPaymentOrder(id);
    const payout = order.reference_id;
    if (payout && /^[0-9a-f-]{36}$/i.test(payout) && ["completed", "refunded", "cancelled"].includes(order.status)) {
      const paid = order.status === "completed";
      const { error } = await createAdminClient().rpc("wallet_payout_update", {
        p_id: payout,
        p_status: paid ? "paid" : "failed",
        p_ref: order.id,
        p_error: paid ? null : order.status === "refunded" ? "The bank sent the money back." : "The payment was cancelled.",
      });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
