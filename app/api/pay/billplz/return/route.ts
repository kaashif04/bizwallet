import { NextResponse } from "next/server";
import { confirmBill } from "@/lib/pickup-payment";

// The customer comes back from Billplz here after paying for an order.
// Confirm straight away (the callback may be slower), then show it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bill = url.searchParams.get("billplz[id]");
  const result = bill ? await confirmBill(bill).catch(() => null) : null;
  const paid = result?.paid ? 1 : 0;

  const order = url.searchParams.get("order") ?? "";
  const to = /^[0-9a-f-]{36}$/i.test(order) ? `/order/status/${order}` : "/customer/orders";
  return NextResponse.redirect(new URL(`${to}?paid=${paid}`, url.origin), 303);
}
