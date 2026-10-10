// Shared types for the ordering flow (used by both server and client).

export type MenuItem = {
  id: string;
  outletId: string;
  name: string;
  description?: string | null;
  category: string;
  categoryId?: string | null;
  price: number;
  // BizPos "free with spend" rule, see lib/free-items.ts.
  freeFromSpend?: number | null;
  freeSpendCategoryIds?: string[];
  freeHint?: string; // e.g. "Free with RM20 of Steamboat"
  imageUrl?: string | null;
  emoji?: string;
  isAvailable?: boolean;
  externalPosId?: string | null;
};

export type VariantSelection = {
  modifierId: string; // BizPos modifiers.id — the only thing sent when ordering
  group: string; // e.g. "Sugar level"
  option: string; // e.g. "50%"
  priceDelta: number; // display only; the server prices the order
};

export type CartLine = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: VariantSelection[];
  unitPrice: number; // base price + selection deltas
};
