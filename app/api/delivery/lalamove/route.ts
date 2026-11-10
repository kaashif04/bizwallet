import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncDelivery } from "@/lib/lalamove";

// Lalamove's webhook (driver assigned, picked up, delivered, cancelled...). We only take the order id
// from it and re-read the order from Lalamove with the company's keys, so a forged call changes nothing.
// Always 200: Lalamove retries otherwise, and it tests the URL with an empty call when it's set.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const orderId = body?.data?.order?.orderId ?? body?.data?.orderId;
  if (typeof orderId === "string" && /^\d{1,30}$/.test(orderId)) {
    const { data } = await createAdminClient().from("deliveries").select("id").eq("lalamove_order_id", orderId).maybeSingle();
    if (data) await syncDelivery(data.id).catch((e) => console.error("lalamove webhook", e));
  }
  return NextResponse.json({ ok: true });
}
