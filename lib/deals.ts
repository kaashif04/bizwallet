// A running menu deal (BizPos wallet_deals). price is already the deal price everywhere.
export type DealItem = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  regular_price: number;
  dine_in_only?: boolean; // not sold for pickup (e.g. steamboat sets)
};
export type Deal = {
  id: string;
  title: string | null;
  kind: "percent" | "amount";
  value: number;
  ends_at: string | null;
  menu_item_id: string | null;
  category_id: string | null;
  category: string | null;
  items: DealItem[];
};

// "20% off", "RM5 off", "RM2.50 off"
export function dealBadge(d: Pick<Deal, "kind" | "value">): string {
  const v = Number(d.value);
  return d.kind === "percent" ? `${v}% off` : `RM${Number.isInteger(v) ? v : v.toFixed(2)} off`;
}

// The owner's title, else "20% off Tofu" (category) or "RM5 off Ma Po Tofu" (dish).
export const dealTitle = (d: Deal) => d.title ?? `${dealBadge(d)} ${d.category ?? d.items[0]?.name ?? ""}`.trim();
