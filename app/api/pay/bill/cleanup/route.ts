import { NextResponse } from "next/server";
import { hookAuthorized } from "@/lib/hook-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelBillPayment } from "@/lib/pickup-payment";

// Run every few minutes (same Bearer as the other hooks). Phone payments that opened a Billplz bill but
// weren't paid within 10 minutes are voided and cancelled; until then they block the till.
async function run(request: Request) {
  if (!(await hookAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await createAdminClient()
    .from("wallet_bill_payments")
    .select("payment_ref")
    .eq("status", "pending")
    .not("payment_ref", "is", null)
    .lt("created_at", new Date(Date.now() - 10 * 60_000).toISOString())
    .limit(50);
  let cancelled = 0;
  let failed = 0;
  for (const { payment_ref } of data ?? []) {
    try {
      if (!(await cancelBillPayment(payment_ref!)).paid) cancelled++;
    } catch {
      failed++; // retried on the next run
    }
  }
  return NextResponse.json({ cancelled, failed });
}
export { run as GET, run as POST };
