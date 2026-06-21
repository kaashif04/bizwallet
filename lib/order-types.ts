// Shared types for the ordering flow (used by both server and client).

export type Outlet = {
  id: string;
  name: string;
  address?: string | null;
  kind?: string; // e.g. "Bistro" | "Steamboat" (display label)
  emoji?: string;
  // "HH:MM" or "HH:MM:SS" (PostgREST shape for a `time` column). Null means
  // hours aren't configured yet — callers should treat that as "always open".
  open_time?: string | null;
  close_time?: string | null;
  prep_time_minutes?: number;
  // Null until the owner configures coordinates — callers should treat that
  // as "distance unknown", not 0.
  latitude?: number | null;
  longitude?: number | null;
  // Manual kill switch; defaults true at the DB level for existing outlets.
  is_accepting_orders?: boolean;
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
  externalPosId?: string | null;
};

export type ServiceType = "dine_in" | "takeaway";

export type VariantSelection = {
  group: string; // e.g. "Sugar level"
  option: string; // e.g. "50%"
  priceDelta: number;
  // POS identifiers so a placed order tells the kitchen exactly which
  // modifier was picked, not just its display label.
  groupExternalPosId?: string | null;
  optionExternalPosId?: string | null;
};

export type CartLine = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selections: VariantSelection[];
  unitPrice: number; // base price + selection deltas
};
