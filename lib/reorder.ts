import type { MenuItem, VariantSelection } from "@/lib/order-types";
import type { VariantGroup } from "@/lib/menu-variants";

// One line of a past guest order, as the app sent it (guest_orders.items).
export type PastLine = { menu_item_id: string; name: string; quantity: number; modifier_ids?: string[] | null };
export type PastOrder = { id: string; created_at: string; items: PastLine[] };

// Rebuild a past order against today's menu: dishes that are gone, or whose
// required choice is gone, are skipped rather than guessed.
export function rebuild(order: PastOrder, byId: Map<string, MenuItem>, groupsByItem: Record<string, VariantGroup[]>) {
  const lines: { item: MenuItem; qty: number; sels: VariantSelection[] }[] = [];
  let missing = 0;
  for (const l of order.items) {
    const item = byId.get(l.menu_item_id);
    if (!item || item.isAvailable === false) {
      missing++;
      continue;
    }
    const groups = groupsByItem[item.id] ?? [];
    const sels: VariantSelection[] = [];
    for (const id of l.modifier_ids ?? []) {
      for (const g of groups) {
        const o = g.options.find((x) => x.id === id);
        if (o) sels.push({ modifierId: o.id, group: g.label, option: o.label, priceDelta: o.priceDelta ?? 0 });
      }
    }
    const unmet = groups.some((g) => g.required && !g.options.some((o) => sels.some((s) => s.modifierId === o.id)));
    if (unmet) {
      missing++;
      continue;
    }
    lines.push({ item, qty: Math.max(1, l.quantity), sels });
  }
  const total = lines.reduce((s, l) => s + (l.item.price + l.sels.reduce((d, v) => d + v.priceDelta, 0)) * l.qty, 0);
  return { lines, missing, total };
}
