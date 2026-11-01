import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billplzEnabled, createBill, getBill } from "@/lib/billplz";
import { BOOKING_TOKEN, confirmBookingBill } from "@/lib/booking-payment";

// Open Billplz for a booking's deposit. Guests don't need an account: the token is
// the secret, and the amount is what the DB says is due. Returns the Billplz page,
// or { paid: true } if the booking is already booked.
export async function POST(request: Request) {
  if (!billplzEnabled()) {
    return NextResponse.json({ error: "Online payment isn't set up yet. Please call the restaurant to book." }, { status: 503 });
  }
  const { token, mobile } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || !BOOKING_TOKEN.test(token)) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const supabase = createClient();
  const { data: b, error } = await supabase.rpc("booking_get", { p_token: token });
  if (error || !b) return NextResponse.json({ error: error?.message ?? "Booking not found." }, { status: 404 });
  if (b.status === "booked") return NextResponse.json({ paid: true });
  if (b.status !== "awaiting_deposit" || !(Number(b.deposit_due) > 0)) {
    return NextResponse.json({ error: "This slot was released. Please pick another time." }, { status: 410 });
  }

  const bills = createAdminClient().from("wallet_booking_bills");
  // The bill already made for this booking, from any phone: send the guest back to
  // it (or say it's paid), so one booking never has two live bills.
  const reuse = async (billId: string) => {
    if ((await confirmBookingBill(billId)).paid) return NextResponse.json({ paid: true });
    return NextResponse.json({ url: (await getBill(billId)).url });
  };

  try {
    const { data: old } = await bills.select("bill_id").eq("token", token).maybeSingle();
    if (old) return await reuse(old.bill_id);

    const { data: auth } = await supabase.auth.getUser();
    const email = auth.user?.email ?? undefined;
    const phone = typeof mobile === "string" ? mobile.replace(/\D/g, "") : "";
    if (!email && phone.length < 9) {
      return NextResponse.json({ error: "Add your phone number to pay the deposit." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const bill = await createBill({
      email,
      mobile: email ? undefined : phone,
      name: String(b.name ?? "Guest").slice(0, 255),
      amountSen: Math.round(Number(b.deposit_due) * 100),
      description: `Booking deposit at ${b.outlet?.name ?? "the restaurant"}`,
      callbackUrl: `${origin}/api/booking/billplz/callback`,
      redirectUrl: `${origin}/api/booking/billplz/return?token=${encodeURIComponent(token)}`,
      reference: token,
    });
    // Two phones at the same moment: the first bill saved wins, the other is never shown.
    const { error: dup } = await bills.insert({ token, bill_id: bill.id });
    if (dup?.code === "23505") {
      const { data: won } = await bills.select("bill_id").eq("token", token).single();
      if (won) return await reuse(won.bill_id);
    }
    if (dup) throw new Error(dup.message);
    return NextResponse.json({ url: bill.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
