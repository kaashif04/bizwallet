import { createAdminClient } from "@/lib/supabase/admin";
import { deleteBill, getBill } from "@/lib/billplz";

// Re-read the bill from Billplz and, if it's paid, settle what it was for: a
// share of a table bill, or an order (released to the POS). Safe to call any
// number of times (callback and redirect both do).
// refundToken: a share paid after staff had already closed the bill; the guest is owed it back.
export async function confirmBill(billId: string): Promise<{ paid: boolean; refundToken?: string }> {
  const bill = await getBill(billId);
  if (!bill.paid) return { paid: false };
  const admin = createAdminClient();
  const { data: share } = await admin.from("wallet_bill_payments").select("id").eq("payment_ref", bill.id).maybeSingle();
  const { data, error } = await admin.rpc(share ? "wallet_confirm_bill_payment" : "wallet_confirm_order_payment", {
    p_ref: bill.id,
    p_paid: bill.paid_amount / 100,
  });
  if (error) throw new Error(error.message);
  const refund = share && data?.refund_due && typeof data.refund_token === "string" ? data.refund_token : undefined;
  return { paid: true, refundToken: refund };
}

// Delete a still-unpaid Billplz bill so it can't be paid after we cancel what it was for.
// If Billplz says it was paid after all, settle it the normal way instead.
export async function voidBill(billId: string): Promise<{ paid: boolean }> {
  try {
    await deleteBill(billId);
    return { paid: false };
  } catch (e) {
    if ((await confirmBill(billId)).paid) return { paid: true };
    throw e; // not paid and not deleted: don't cancel, or it could still be paid
  }
}

// A phone payment the till (or the cleanup job) gave up on: void the bill, then cancel it in the DB.
export async function cancelBillPayment(ref: string): Promise<{ paid: boolean }> {
  if ((await voidBill(ref)).paid) return { paid: true };
  const { error } = await createAdminClient().rpc("wallet_cancel_bill_payment", { p_ref: ref });
  if (error) throw new Error(error.message);
  return { paid: false };
}
