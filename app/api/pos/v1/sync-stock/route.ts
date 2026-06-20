import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizePos, unauthorized } from "@/lib/pos/auth";

// POST /api/pos/v1/sync-stock
// The POS instantly flips an item's availability/stock so web customers can't
// order something that just sold out in-store.
//
// Body: {
//   outlet_id: string,
//   external_pos_id: string,
//   sold_out?: boolean,        // convenience: true => is_available = false
//   is_available?: boolean,
//   stock_quantity?: number
// }
export async function POST(request: Request) {
  if (!authorizePos(request)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outletId = body.outlet_id;
  const externalId = body.external_pos_id;
  if (typeof outletId !== "string" || typeof externalId !== "string") {
    return NextResponse.json(
      { error: "outlet_id and external_pos_id are required" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { last_synced_at: new Date().toISOString() };
  if (body.sold_out === true) update.is_available = false;
  else if (typeof body.is_available === "boolean") update.is_available = body.is_available;
  if (body.stock_quantity != null) update.stock_quantity = Number(body.stock_quantity);

  if (!("is_available" in update) && !("stock_quantity" in update)) {
    return NextResponse.json(
      { error: "set sold_out, is_available or stock_quantity" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("menu_items")
    .update(update)
    .eq("outlet_id", outletId)
    .eq("external_pos_id", externalId)
    .select("id,name,is_available,stock_quantity");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "menu item not found" }, { status: 404 });
  }
  return NextResponse.json({ updated: data });
}
