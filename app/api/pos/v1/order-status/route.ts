import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizePos, unauthorized } from "@/lib/pos/auth";

const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];

// POST /api/pos/v1/order-status
// The POS advances an order's status (Pending -> Preparing -> Ready -> ...).
// Updating the row drives the customer's app UI via Supabase Realtime (enable
// it once: `alter publication supabase_realtime add table public.orders;`).
//
// Body: { order_id?: string, order_number?: number, status: <one of STATUSES> }
export async function POST(request: Request) {
  if (!authorizePos(request)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status;
  if (typeof status !== "string" || !STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const orderId = body.order_id;
  const orderNumber = body.order_number;
  if (typeof orderId !== "string" && orderNumber == null) {
    return NextResponse.json(
      { error: "order_id or order_number is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const base = admin.from("orders").update({ status });
  const filtered =
    typeof orderId === "string"
      ? base.eq("id", orderId)
      : base.eq("order_number", Number(orderNumber));

  const { data, error } = await filtered.select(
    "id,order_number,status,order_type,table_number"
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  return NextResponse.json({ updated: data });
}
