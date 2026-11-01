import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleWalletEnabled, pushPoints } from "@/lib/google-wallet";

// Called by the database (trigger wallet_card_points_changed, via pg_net) when a
// member's points change, so a saved Google Wallet card shows the new balance.
// The Bearer is checked against the secret in Vault; BizWallet keeps no copy.
export async function POST(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const { data: ok } = bearer
    ? await createAdminClient().rpc("wallet_hook_secret_ok", { p_secret: bearer })
    : { data: false };
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!googleWalletEnabled()) return NextResponse.json({ skipped: true });
  const { user_id, company_id, points } = await request.json().catch(() => ({}));
  if (typeof user_id !== "string" || typeof company_id !== "string" || typeof points !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await pushPoints(user_id, company_id, points);
  return NextResponse.json({ ok: true });
}
