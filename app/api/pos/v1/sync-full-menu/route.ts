import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizePos, unauthorized } from "@/lib/pos/auth";

// POST /api/pos/v1/sync-full-menu
// The POS pushes its complete current menu for one outlet — categories,
// items, and modifiers, nested. Everything is upserted by external_pos_id
// (scoped to its parent) inside sync_full_menu(), so re-syncs are idempotent.
// Anything POS-owned that's missing from the payload gets soft-deactivated,
// not deleted — see the migration / setup.sql PART 6 comment for the full
// payload shape and the soft-deactivate reasoning.
//
// Body: {
//   outlet_id: string,
//   categories: [{
//     external_pos_id, name, display_order?,
//     items: [{
//       external_pos_id, name, description?, price, stock_quantity?, is_available?,
//       modifier_groups: [{
//         external_pos_id, name, selection_type?, is_required?, display_order?,
//         options: [{ external_pos_id, name, price_delta?, is_available? }]
//       }]
//     }]
//   }]
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
  const categories = (body as { categories?: unknown })?.categories;
  if (typeof outletId !== "string" || !Array.isArray(categories)) {
    return NextResponse.json(
      { error: "outlet_id (string) and categories[] are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("sync_full_menu", {
    p_outlet_id: outletId,
    p_payload: { categories },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
