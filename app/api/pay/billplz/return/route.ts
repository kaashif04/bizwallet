import { NextResponse } from "next/server";
import { cancelBillPayment, confirmBill } from "@/lib/pickup-payment";

// The customer comes back from Billplz here after paying for an order or a
// share of a table bill.
// Confirm straight away (the callback may be slower), then show it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bill = url.searchParams.get("billplz[id]");
  const result = bill ? await confirmBill(bill).catch(() => null) : null;
  let paid = result?.paid ? 1 : 0;

  const table = url.searchParams.get("table") ?? "";
  if (/^[\w-]{1,64}$/.test(table)) {
    // Back from the bank without paying: free their share now, or the bill shows
    // "Someone is paying" (them) until the 10-minute cleanup. Voids at Billplz first,
    // and Billplz can say "paid" by then (it lags the redirect), which settles it.
    if (bill && result && !result.paid && (await cancelBillPayment(bill).catch(() => null))?.paid) paid = 1;
    const refund = result?.refundToken ? `&refund=${result.refundToken}` : "";
    return NextResponse.redirect(new URL(`/order/t/${table}/bill?paid=${paid}${refund}`, url.origin), 303);
  }
  const order = url.searchParams.get("order") ?? "";
  const to = /^[0-9a-f-]{36}$/i.test(order) ? `/order/status/${order}` : "/customer/orders";
  return NextResponse.redirect(new URL(`${to}?paid=${paid}`, url.origin), 303);
}
