import { NextResponse } from "next/server";
import { confirmBookingBill } from "@/lib/booking-payment";

// Billplz posts here (server to server) when a deposit bill changes. We take the
// bill id only; confirmBookingBill re-reads the bill before trusting it.
export async function POST(request: Request) {
  const id = (await request.formData().catch(() => null))?.get("id");
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "Missing bill id" }, { status: 400 });
  try {
    await confirmBookingBill(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 500 makes Billplz retry the callback.
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
