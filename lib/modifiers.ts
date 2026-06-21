import { createClient } from "@/lib/supabase/client";
import type { VariantGroup } from "./menu-variants";

type RawOption = {
  id: string;
  name: string;
  price_delta: number | string | null;
  is_available: boolean | null;
  display_order: number | null;
  external_pos_id: string | null;
};

type RawGroup = {
  id: string;
  name: string;
  selection_type: string | null;
  is_required: boolean | null;
  display_order: number | null;
  external_pos_id: string | null;
  modifier_options: RawOption[] | null;
};

// Fetches the live modifier_groups/modifier_options tree for one menu item —
// the data POS syncs write via sync_full_menu(). Both tables are public-read,
// so this reads straight off the browser client, same as other customer-facing
// fetches in this app (RewardsCatalog, OrderTracker, etc).
export async function fetchModifierGroups(itemId: string): Promise<VariantGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("modifier_groups")
    .select(
      "id,name,selection_type,is_required,display_order,external_pos_id,modifier_options(id,name,price_delta,is_available,display_order,external_pos_id)"
    )
    .eq("item_id", itemId)
    .eq("is_active", true)
    .order("display_order");

  if (error || !data) return [];

  return (data as unknown as RawGroup[])
    .map((g) => ({
      id: g.id,
      label: g.name,
      required: g.is_required ?? false,
      selectionType: g.selection_type === "multiple" ? ("multiple" as const) : ("single" as const),
      externalPosId: g.external_pos_id,
      options: (g.modifier_options ?? [])
        .filter((o) => o.is_available !== false)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((o) => ({
          id: o.id,
          label: o.name,
          priceDelta: Number(o.price_delta ?? 0),
          externalPosId: o.external_pos_id,
        })),
    }))
    .filter((g) => g.options.length > 0);
}
