import { NextResponse } from "next/server";
import { hookAuthorized } from "@/lib/hook-auth";
import { syncDelivery } from "@/lib/lalamove";

// The DB asks us to book / cancel / re-read a delivery (fn_delivery_sync): order paid + accepted,
// order cancelled, or a button on the Deliveries page.
export async function POST(request: Request) {
  if (!(await hookAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { delivery_id } = await request.json().catch(() => ({}));
  if (typeof delivery_id !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await syncDelivery(delivery_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
