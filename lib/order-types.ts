// Shared types for the ordering flow (used by both server and client).

export type Outlet = {
  id: string;
  name: string;
  address?: string | null;
  kind?: string; // e.g. "Bistro" | "Steamboat" (display label)
  emoji?: string;
};

export type MenuItem = {
  id: string;
  outletId: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  imageUrl?: string | null;
  emoji?: string;
  isAvailable?: boolean;
};

export type ServiceType = "dine_in" | "takeaway";

export type VariantSelection = {
  group: string; // e.g. "Sugar level"
  option: string; // e.g. "50%"
  priceDelta: number;
};

export type CartLine = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: VariantSelection[];
  unitPrice: number; // base price + selection deltas
};
