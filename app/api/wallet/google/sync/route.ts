import { NextResponse } from "next/server";
import { googleWalletEnabled, pushPoints } from "@/lib/google-wallet";

// Called by the database (trigger wallet_card_points_changed, via pg_net) when a
// member's points change, so a saved Google Wallet card shows the new balance.
export async function POST(request: Request) {
  const secret = process.env.WALLET_HOOK_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!googleWalletEnabled()) return NextResponse.json({ skipped: true });
  const { user_id, company_id, points } = await request.json().catch(() => ({}));
  if (typeof user_id !== "string" || typeof company_id !== "string" || typeof points !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await pushPoints(user_id, company_id, points);
  return NextResponse.json({ ok: true });
}
