import { NextResponse } from "next/server";
import { BOOKING_TOKEN, confirmBookingBill } from "@/lib/booking-payment";

// The guest comes back from Billplz here. Confirm straight away (the callback may
// be slower), then the booking page polls until it shows as booked.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bill = url.searchParams.get("billplz[id]");
  const result = bill ? await confirmBookingBill(bill).catch(() => null) : null;
  const token = url.searchParams.get("token") ?? "";
  if (!BOOKING_TOKEN.test(token)) return NextResponse.redirect(new URL("/booking", url.origin), 303);
  return NextResponse.redirect(new URL(`/booking/${token}?paid=${result?.paid ? 1 : 0}`, url.origin), 303);
}
