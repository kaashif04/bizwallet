import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billplzEnabled, createBill } from "@/lib/billplz";

const MIN_TOPUP = 1; // Billplz's smallest bill
const MAX_TOPUP = 1000;

// Start a wallet top-up: records it, opens a Billplz bill and returns its
// page. The wallet is credited only after Billplz confirms the payment
// (callback or return -> confirmBill -> wallet_confirm_topup).
export async function POST(request: Request) {
  if (!billplzEnabled()) {
    return NextResponse.json({ error: "Top-ups aren't available yet." }, { status: 503 });
  }
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in to top up." }, { status: 401 });

  const { amount: raw } = await request.json().catch(() => ({}));
  const amount = Math.round(Number(raw) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json({ error: `Top up between RM${MIN_TOPUP} and RM${MAX_TOPUP.toLocaleString()}.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: member } = await admin.from("members").select("full_name").eq("id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "Only BizWallet members can top up." }, { status: 403 });

  const { data: topup, error } = await admin
    .from("wallet_topups")
    .insert({ user_id: user.id, amount })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const origin = new URL(request.url).origin;
    const bill = await createBill({
      email: user.email,
      name: member.full_name || user.email.split("@")[0],
      amountSen: Math.round(amount * 100),
      description: "BizWallet top-up",
      callbackUrl: `${origin}/api/pay/billplz/callback`,
      redirectUrl: `${origin}/api/pay/billplz/return?topup=${topup.id}`,
      reference: topup.id,
    });
    await admin.from("wallet_topups").update({ payment_ref: bill.id }).eq("id", topup.id);
    return NextResponse.json({ url: bill.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
