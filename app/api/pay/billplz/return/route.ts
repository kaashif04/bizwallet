import { NextResponse } from "next/server";
import { confirmBill } from "@/lib/pickup-payment";

// The customer comes back from Billplz here. Confirm straight away (the
// callback may be slower), then show the order.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const order = url.searchParams.get("order") ?? "";
  const bill = url.searchParams.get("billplz[id]");
  let paid = false;
  if (bill) paid = await confirmBill(bill).catch(() => false);
  const to = /^[0-9a-f-]{36}$/i.test(order) ? `/order/status/${order}` : "/customer/orders";
  return NextResponse.redirect(new URL(`${to}?paid=${paid ? 1 : 0}`, url.origin), 303);
}
