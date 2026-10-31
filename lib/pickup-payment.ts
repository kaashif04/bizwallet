import { createAdminClient } from "@/lib/supabase/admin";
import { getBill } from "@/lib/billplz";

// Re-read the bill from Billplz and, if it's paid, settle what it was for: a
// share of a table bill, or an order (released to the POS). Safe to call any
// number of times (callback and redirect both do).
export async function confirmBill(billId: string): Promise<{ paid: boolean }> {
  const bill = await getBill(billId);
  if (!bill.paid) return { paid: false };
  const admin = createAdminClient();
  const { data: share } = await admin.from("wallet_bill_payments").select("id").eq("payment_ref", bill.id).maybeSingle();
  const { error } = await admin.rpc(share ? "wallet_confirm_bill_payment" : "wallet_confirm_order_payment", {
    p_ref: bill.id,
    p_paid: bill.paid_amount / 100,
  });
  if (error) throw new Error(error.message);
  return { paid: true };
}
