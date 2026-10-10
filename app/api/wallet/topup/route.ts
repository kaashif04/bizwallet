import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { topUpEnabled } from "@/lib/wallet-types";

const MAX_TOPUP = 1000;

export async function POST(request: Request) {
  if (!topUpEnabled()) {
    return NextResponse.json({ error: "Top-ups aren't available yet." }, { status: 503 });
  }

  // 1. Identify the caller from their session cookies (anon/authenticated).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Validate the amount.
  let body: { amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than zero" },
      { status: 400 }
    );
  }
  if (amount > MAX_TOPUP) {
    return NextResponse.json(
      { error: `Maximum top-up is RM ${MAX_TOPUP.toLocaleString()}` },
      { status: 400 }
    );
  }

  // 3. PAYMENT GATEWAY (integrate later): in production you'd create a charge
  //    with SenangPay/Fiuu here and only credit the wallet after the gateway's
  //    server-to-server callback confirms success. For now we treat it as paid.

  // 4. Credit the wallet via the service-role RPC (top_up_wallet is
  //    service_role-only by design — clients can't call it directly).
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("top_up_wallet", {
    p_user_id: user.id,
    p_amount: amount,
    p_description: "Top-up (demo gateway)",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // data = { wallet_id, transaction_id, amount, new_balance }
  return NextResponse.json(data);
}
