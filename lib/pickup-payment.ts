import { createAdminClient } from "@/lib/supabase/admin";
import { getBill } from "@/lib/billplz";

// Re-read the bill from Billplz and, if it's paid, release the order to the
// POS. Safe to call any number of times (callback and redirect both do).
export async function confirmBill(billId: string): Promise<boolean> {
  const bill = await getBill(billId);
  if (!bill.paid) return false;
  const { error } = await createAdminClient().rpc("wallet_confirm_order_payment", {
    p_ref: bill.id,
    p_paid: bill.paid_amount / 100,
  });
  if (error) throw new Error(error.message);
  return true;
}
