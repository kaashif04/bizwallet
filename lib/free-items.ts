// Mirrors BizPos fn_recompute_totals: an item with free_from_spend costs
// nothing once the cart has at least that much spend on items in its
// free_spend_category_ids (e.g. Kiya's steamboat soup base, free with RM20 of
// steamboat). Rule items never count toward spend. Display only: the server
// prices the real bill. Plain types, no path aliases, so the check below runs
// with `node lib/free-items.check.mjs`.
export type FreeRuleLine = {
  lineId: string;
  quantity: number;
  unitPrice: number; // base + modifiers
  item: {
    categoryId?: string | null;
    freeFromSpend?: number | null;
    freeSpendCategoryIds?: string[];
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineTotals(lines: FreeRuleLine[]): Map<string, number> {
  const full = (l: FreeRuleLine) => round2(l.unitPrice * l.quantity);
  const out = new Map<string, number>();
  for (const l of lines) {
    const threshold = l.item.freeFromSpend;
    if (threshold == null) {
      out.set(l.lineId, full(l));
      continue;
    }
    const cats = l.item.freeSpendCategoryIds ?? [];
    const spend = lines
      .filter((x) => x.item.freeFromSpend == null && !!x.item.categoryId && cats.includes(x.item.categoryId))
      .reduce((s, x) => s + full(x), 0);
    out.set(l.lineId, spend >= threshold ? 0 : full(l));
  }
  return out;
}
