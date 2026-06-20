import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizePos, unauthorized } from "@/lib/pos/auth";

// POST /api/pos/v1/sync-menu
// The POS pushes menu items (new items + price/detail changes) to Supabase.
// Items are upserted by (outlet_id, external_pos_id) so the POS stays the
// source of truth and re-syncs are idempotent.
//
// Body: {
//   outlet_id: string,
//   items: [{ external_pos_id, name, price, description?, category?,
//             stock_quantity?, is_available? }, ...]
// }
export async function POST(request: Request) {
  if (!authorizePos(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outletId = (body as { outlet_id?: unknown })?.outlet_id;
  const items = (body as { items?: unknown })?.items;
  if (typeof outletId !== "string" || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "outlet_id (string) and a non-empty items[] are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const rows = [];
  for (const raw of items as Record<string, unknown>[]) {
    const external = raw.external_pos_id;
    const name = raw.name;
    const price = Number(raw.price);
    if (typeof external !== "string" || typeof name !== "string" || !Number.isFinite(price)) {
      return NextResponse.json(
        { error: "each item needs external_pos_id, name and a numeric price" },
        { status: 400 }
      );
    }
    rows.push({
      outlet_id: outletId,
      external_pos_id: external,
      name,
      description: typeof raw.description === "string" ? raw.description : null,
      category: typeof raw.category === "string" ? raw.category : null,
      price,
      stock_quantity:
        raw.stock_quantity != null ? Number(raw.stock_quantity) : 0,
      is_available: raw.is_available != null ? Boolean(raw.is_available) : true,
      last_synced_at: now,
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("menu_items")
    .upsert(rows, { onConflict: "outlet_id,external_pos_id" })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ synced: data?.length ?? 0 });
}
