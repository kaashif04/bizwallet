import { createAdminClient } from "@/lib/supabase/admin";
import { getBill } from "@/lib/billplz";

// Re-read the bill from Billplz and, if it's paid, settle what it was for:
// a wallet top-up (credit the wallet) or a pickup order (release it to the
// POS). Safe to call any number of times (callback and redirect both do).
export async function confirmBill(billId: string): Promise<{ paid: boolean; kind: "order" | "topup" }> {
  const bill = await getBill(billId);
  const admin = createAdminClient();
  const { data: topup } = await admin.from("wallet_topups").select("id").eq("payment_ref", bill.id).maybeSingle();
  const kind = topup ? "topup" : "order";
  if (!bill.paid) return { paid: false, kind };
  const { error } = await admin.rpc(kind === "topup" ? "wallet_confirm_topup" : "wallet_confirm_order_payment", {
    p_ref: bill.id,
    p_paid: bill.paid_amount / 100,
  });
  if (error) throw new Error(error.message);
  return { paid: true, kind };
}
