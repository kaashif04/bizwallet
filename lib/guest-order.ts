// Guest ordering against BizPos's RPCs (guest_get_menu / guest_place_order /
// guest_order_status / claim_guest_order). Works signed-out.
import type { MenuItem } from "./order-types";
import type { VariantGroup } from "./menu-variants";

export type GuestMenu = {
  outlet: { id: string; name: string };
  table: { id: string; label: string } | null;
  tax: {
    sst_enabled: boolean;
    sst_rate: number;
    service_charge_enabled: boolean;
    service_charge_rate: number;
  };
  categories: { id: string; name: string }[];
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category_id: string | null;
    free_from_spend: number | null;
    free_spend_category_ids: string[] | null;
    modifier_groups: {
      id: string;
      name: string;
      is_required: boolean;
      min_select: number;
      max_select: number | null;
      modifiers: { id: string; name: string; price_delta: number; is_default: boolean }[];
    }[];
  }[];
};

export type GuestOrderStatus = {
  // cancelled: accepted, then staff voided every item (or the whole bill) in BizPos
  status: "awaiting_payment" | "pending" | "accepted" | "rejected" | "cancelled";
  amount_due: number | null;
  reject_reason: string | null;
  table_label: string | null;
  subtotal: number;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    modifier_delta: number;
    modifier_summary: string;
  }[];
  // Items staff voided from this order (the rest of the order goes ahead).
  cancelled_items?: { name: string; quantity: number; options: string | null; reason: string | null; at: string }[];
  kitchen_status: "queued" | "preparing" | "ready" | "served" | null;
  paid: boolean;
  member_linked: boolean;
};

// Flatten the RPC payload into MenuView's shape, items in category order.
export function toMenu(menu: GuestMenu): {
  items: MenuItem[];
  groupsByItem: Record<string, VariantGroup[]>;
} {
  const catName = new Map(menu.categories.map((c, i) => [c.id, { name: c.name, i }]));
  const rank = (id: string | null) => (id ? catName.get(id)?.i : undefined) ?? 1e9;

  const sorted = [...menu.items].sort((a, b) => rank(a.category_id) - rank(b.category_id));
  const items: MenuItem[] = sorted.map((i) => ({
    id: i.id,
    outletId: menu.outlet.id,
    name: i.name,
    description: i.description,
    category: (i.category_id && catName.get(i.category_id)?.name) || "Other",
    categoryId: i.category_id,
    price: Number(i.price),
    imageUrl: i.image_url,
    freeFromSpend: i.free_from_spend == null ? null : Number(i.free_from_spend),
    freeSpendCategoryIds: i.free_spend_category_ids ?? [],
    freeHint:
      i.free_from_spend == null
        ? undefined
        : `Free with RM${Number(i.free_from_spend).toFixed(0)} of ${
            // "Steamboat · Meat & Seafood", "Steamboat · Vegetable" -> "Steamboat"
            Array.from(
              new Set(
                (i.free_spend_category_ids ?? [])
                  .map((id) => catName.get(id)?.name.split(" · ")[0])
                  .filter(Boolean)
              )
            ).join(" or ") || "selected items"
          }`,
  }));

  const groupsByItem = Object.fromEntries(
    menu.items.map((i) => [
      i.id,
      i.modifier_groups.map<VariantGroup>((g) => ({
        id: g.id,
        label: g.name,
        required: g.is_required,
        selectionType: g.max_select === 1 ? "single" : "multiple",
        maxSelect: g.max_select,
        options: g.modifiers.map((m) => ({
          id: m.id,
          label: m.name,
          priceDelta: Number(m.price_delta),
          isDefault: m.is_default,
        })),
      })),
    ])
  );

  return { items, groupsByItem };
}

// The claim token proves "I placed this order" for the status page and for
// claiming it after sign-up. It only lives on the device that ordered.
const key = (id: string) => `bw_guest_order:${id}`;

export function saveClaimToken(id: string, claimToken: string, menuPath: string) {
  try {
    localStorage.setItem(key(id), claimToken);
    localStorage.setItem(`${key(id)}:menu`, menuPath);
  } catch {
    // Private mode: the status page will say it can't find the order.
  }
}

// Where this order was placed from (/order/t/<token> or /order/p/<outlet>),
// so the status page can offer "Order more".
export function loadMenuPath(id: string): string | null {
  try {
    return localStorage.getItem(`${key(id)}:menu`);
  } catch {
    return null;
  }
}

export function loadClaimToken(id: string): string | null {
  try {
    return localStorage.getItem(key(id));
  } catch {
    return null;
  }
}

export type PickupOutlet = {
  id: string;
  name: string;
  address: string | null;
  company_id: string;
  company: string;
  pickup: boolean; // false = table QR ordering only
  cover_url: string | null;
  tagline: string | null;
  phone: string | null;
  maps_url: string | null;
  hours: Hours | null; // 7 entries, Monday first; null entry = closed that day
  open_now: boolean | null; // null when hours aren't set
  today: DayHours;
  lat?: number | null; // branch location, when the owner has set it
  lng?: number | null;
};
export type DayHours = { open: string; close: string } | null; // "HH:MM"; close may be after midnight
export type Hours = DayHours[];

// Owner-managed banners and offers (BizPos), live ones only.
export type Banner = {
  id: string;
  company_id: string;
  company: string;
  outlet_id: string | null;
  outlet: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  promo_code: string | null;
  action: "order" | "none";
  ends_on: string | null; // YYYY-MM-DD
};

// `outlets` is company-private in BizPos, so members can't read it directly.
// guest_list_outlets lists every branch with online ordering on.
export async function outletNames(
  supabase: { rpc: (fn: "guest_list_outlets") => PromiseLike<{ data: unknown }> }
): Promise<Map<string, string>> {
  const { data } = await supabase.rpc("guest_list_outlets");
  return new Map(((data ?? []) as PickupOutlet[]).map((o) => [o.id, o.name]));
}

// Branch logos from BizEazy Hub (outlet_id -> image URL). Empty until the
// wallet_outlet_logos migration is live; callers fall back to a monogram.
export async function outletLogos(
  supabase: { rpc: (fn: "wallet_outlet_logos") => PromiseLike<{ data: unknown }> }
): Promise<Record<string, string>> {
  const { data } = await supabase.rpc("wallet_outlet_logos");
  return Object.fromEntries(
    ((data ?? []) as { outlet_id: string; logo_url: string }[]).map((r) => [r.outlet_id, r.logo_url])
  );
}
