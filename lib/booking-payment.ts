import { createAdminClient } from "@/lib/supabase/admin";
import { getBill } from "@/lib/billplz";

export const BOOKING_TOKEN = /^[\w-]{1,64}$/;

// Re-read a deposit bill from Billplz and, if it's paid, tell the DB the deposit
// is in. The bill's reference_1 is the booking token. Idempotent: the callback
// and the return page can both call it.
export async function confirmBookingBill(billId: string): Promise<{ paid: boolean; token: string | null }> {
  const bill = await getBill(billId);
  const token = bill.reference_1;
  if (!bill.paid || !token || !BOOKING_TOKEN.test(token)) return { paid: false, token };
  const { error } = await createAdminClient().rpc("booking_confirm_deposit", {
    p_token: token,
    p_ref: bill.id,
    p_paid: bill.paid_amount / 100,
  });
  if (error) throw new Error(error.message);
  return { paid: true, token };
}
