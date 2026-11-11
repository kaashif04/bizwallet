// Guest ordering against BizPos's RPCs (guest_get_menu / guest_place_order /
// guest_order_status / claim_guest_order). Works signed-out.
import type { CartLine, MenuItem } from "./order-types";
import type { VariantGroup } from "./menu-variants";

export type GuestMenu = {
  outlet: { id: string; name: string };
  table: { id: string; label: string } | null;
  tax: {
    sst_enabled: boolean;
    sst_rate: number;
    service_charge_enabled: boolean;
    service_charge_rate: number;
    rounding_step?: number | null; // the bill is rounded up to this step (e.g. 0.05)
  };
  categories: { id: string; name: string; menu_group?: string | null }[]; // menu_group: top-level tab (Chinese / Steamboat / Beverages); null = no tabs
  items: {
    id: string;
    name: string;
    description: string | null;
    is_vegetarian?: boolean;
    is_available?: boolean; // false = sold out today: shown greyed, can't be added
    price: number; // the deal price while a menu deal runs
    regular_price?: number | null; // set while a deal runs: the normal price, struck out
    image_url: string | null;
    category_id: string | null;
    free_from_spend: number | null;
    free_spend_category_ids: string[] | null;
    modifier_groups: GuestGroup[];
    combos?: { id: string; name: string; price: number; regular_price?: number | null; is_available: boolean; modifier_groups: GuestGroup[] }[];
  }[];
};
type GuestGroup = {
  id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number | null;
  modifiers: { id: string; name: string; price_delta: number; is_default: boolean }[];
};

// One cart line as guest_place_order wants it: a combo goes as combo_id on its dish.
export const toOrderItem = (l: CartLine) => ({
  menu_item_id: l.item.comboOf ?? l.item.id,
  combo_id: l.item.comboOf ? l.item.id : undefined,
  quantity: l.quantity,
  modifier_ids: l.selections.map((s) => s.modifierId),
});

// The table QR start page (guest_table_home).
export type TableHome = {
  outlet: { id: string; name: string; company_id: string };
  table: { id: string; label: string };
  ordering: boolean; // online ordering switched on in BizPos
  cover_url: string | null;
  tagline: string | null;
  wifi: { name: string; password: string | null } | null;
  review_url: string | null; // Google review link, else the maps link
  calls: TableCall[]; // open "call staff" / "bill" requests, newest first
  hide?: { staff: boolean; bill: boolean; feedback: boolean }; // owner's switches in BizPos
};
export type TableCall = { kind: "staff" | "bill"; at: string };

// The table's open bill as the phones at the table see it (guest_table_bill).
export type BillShare = { mode: "all" } | { mode: "equal"; of: number } | { mode: "items"; items: string[] };
export type TableBill =
  | { table: string; open: false }
  | {
      table: string;
      open: true;
      id: string;
      subtotal: number;
      rounding_step?: number; // shares round up to this (BizPos outlet setting)
      discount: number;
      service_charge: number;
      sst: number;
      rounding: number;
      total: number;
      paid: number; // paid in the app
      remaining: number;
      held: number; // someone is at the payment page right now
      // parent_id: this line is a part of another line (a set's dishes, or made at another counter); the POS nests it.
      items: { id: string; name: string; quantity: number; line_total: number; options: string | null; paid: boolean; parent_id?: string | null }[];
      // booking: a booking deposit paid before the bill (taken off it), not a share.
      payments: { amount: number; at: string; share?: BillShare; mine: boolean; booking?: boolean }[];
      booking_credit?: number; // booking deposits already taken off this bill
      // Who ordered what. Missing until the server has it: then nobody counts as "others".
      rounds?: { id: string; who: string | null; mine: boolean; items: { name: string; quantity: number; options: string | null }[] }[];
    };

// Today's game board at the table's outlet (guest_game_board / guest_game_submit).
export type GameBoard = {
  table: string; // this table's label
  best: number | null; // this table's best today
  rank: number | null;
  tables: number; // tables on the board today
  top: { table: string; score: number }[]; // top 10
  players?: { name: string; score: number }[]; // each player's best at this table, this visit
};

export type GuestOrderStatus = {
  id: string;
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
    added_by_staff?: boolean; // put on the bill by staff in BizPos
  }[];
  // Items staff voided from this order (the rest of the order goes ahead).
  cancelled_items?: { name: string; quantity: number; options: string | null; reason: string | null; at: string }[];
  kitchen_status: "queued" | "preparing" | "ready" | "served" | null;
  paid: boolean;
  table_due?: number | null; // still to pay at the counter for this table (open bill)
  member_linked: boolean;
  pickup_at?: string | null; // order ahead: the time the customer chose
  // Delivery orders (Lalamove): the driver's progress. status: waiting | booking | assigning |
  // on_going (driver heading to the restaurant) | picked_up | completed | cancelled
  delivery?: {
    status: string;
    fee: number | null;
    address: string;
    unit: string | null;
    share_link: string | null;
    driver: { name: string; phone: string; plate: string } | null;
  } | null;
};

// Flatten the RPC payload into MenuView's shape, items in category order.
export function toMenu(menu: GuestMenu): {
  items: MenuItem[];
  groupsByItem: Record<string, VariantGroup[]>;
} {
  const catName = new Map(menu.categories.map((c, i) => [c.id, { name: c.name, i, group: c.menu_group ?? null }]));
  const rank = (id: string | null) => (id ? catName.get(id)?.i : undefined) ?? 1e9;

  const sorted = [...menu.items].sort((a, b) => rank(a.category_id) - rank(b.category_id));
  const items: MenuItem[] = sorted.map((i) => ({
    id: i.id,
    outletId: menu.outlet.id,
    name: i.name,
    description: i.description,
    vegetarian: !!i.is_vegetarian,
    isAvailable: i.is_available !== false,
    category: (i.category_id && catName.get(i.category_id)?.name) || "Other",
    categoryId: i.category_id,
    menuGroup: (i.category_id && catName.get(i.category_id)?.group) || null,
    price: Number(i.price),
    regularPrice: i.regular_price == null ? null : Number(i.regular_price),
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

  const band = (g: { name: string; is_required: boolean }) =>
    g.name.toLowerCase().includes("vegetarian") ? 0 : g.is_required ? 1 : 2;
  // Same order as the POS: the "Vegetarian" option first (unticked = the normal,
  // non-veg dish), then required groups, then add-ons
  // (stable sort keeps the menu's order within each band).
  const toGroups = (gs: GuestGroup[]) =>
    [...gs].sort((a, b) => band(a) - band(b)).map<VariantGroup>((g) => ({
      id: g.id,
      label: g.name,
      required: g.is_required,
      selectionType: g.max_select === 1 ? "single" : "multiple",
      minSelect: g.min_select,
      maxSelect: g.max_select,
      options: g.modifiers.map((m) => ({
        id: m.id,
        label: m.name,
        priceDelta: Number(m.price_delta),
        isDefault: m.is_default,
      })),
    }));
  const groupsByItem: Record<string, VariantGroup[]> = {};
  for (const i of menu.items) {
    groupsByItem[i.id] = toGroups(i.modifier_groups);
    const dish = items.find((d) => d.id === i.id)!;
    // Sold-out combos are simply not offered.
    const combos = (i.combos ?? []).filter((c) => c.is_available !== false);
    if (combos.length) {
      dish.combos = combos.map((c) => ({
        ...dish,
        id: c.id,
        name: c.name,
        price: Number(c.price),
        regularPrice: c.regular_price == null ? null : Number(c.regular_price),
        combos: undefined,
        comboOf: i.id,
      }));
      for (const c of combos) groupsByItem[c.id] = toGroups(c.modifier_groups);
    }
  }

  return { items, groupsByItem };
}

// The claim token proves "I placed this order" for the status page and for
// claiming it after sign-up. It only lives on the device that ordered.
const key = (id: string) => `bw_guest_order:${id}`;

export function saveClaimToken(id: string, claimToken: string, menuPath: string, points = 0) {
  try {
    localStorage.setItem(key(id), claimToken);
    localStorage.setItem(`${key(id)}:menu`, menuPath);
    localStorage.setItem(`${key(id)}:at`, String(Date.now()));
    // What it earns once linked to an account, for the status page's "sign in for N points".
    if (points > 0) localStorage.setItem(`${key(id)}:pts`, String(points));
  } catch {
    // Private mode: the status page will say it can't find the order.
  }
}

export function loadOrderPoints(id: string): number {
  try {
    return Number(localStorage.getItem(`${key(id)}:pts`)) || 0;
  } catch {
    return 0;
  }
}

// A signed-out diner's details for paying online (Billplz needs a phone or an
// email). Kept on this phone so they type them once.
export type GuestContact = { mobile: string; name?: string; email?: string };
export const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 9;
export function loadContact(): GuestContact | null {
  try {
    const c = JSON.parse(localStorage.getItem("bw_guest_contact") ?? "null");
    return c && typeof c.mobile === "string" ? c : null;
  } catch {
    return null;
  }
}
export function saveContact(c: GuestContact) {
  try {
    localStorage.setItem("bw_guest_contact", JSON.stringify(c));
  } catch {}
}

// "Guest 4F2A": this phone's name when the diner gives none, kept so every round it
// orders is the same person (and the table can tell guests apart).
export function guestLabel(): string {
  try {
    let id = localStorage.getItem("bw_guest_id");
    if (!id) {
      id = crypto.randomUUID().slice(0, 4).toUpperCase();
      localStorage.setItem("bw_guest_id", id);
    }
    return `Guest ${id}`;
  } catch {
    return `Guest ${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
  }
}

// Orders this phone placed from this table's menu in the last 12 hours, oldest first.
export function tableOrders(token: string): { id: string; claimToken: string; at: number }[] {
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const id = /^bw_guest_order:(.+):menu$/.exec(localStorage.key(i) ?? "")?.[1];
      if (!id || localStorage.getItem(`${key(id)}:menu`) !== `/order/t/${token}/menu`) continue;
      const at = Number(localStorage.getItem(`${key(id)}:at`));
      const claimToken = localStorage.getItem(key(id));
      if (claimToken && at && Date.now() - at < 12 * 3_600_000) out.push({ id, claimToken, at });
    }
    return out.sort((a, b) => a.at - b.at);
  } catch {
    return [];
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
  show_from?: string | null; // "HH:MM" Malaysia time, daily window (may cross midnight); null = all day
  show_until?: string | null;
};

// `outlets` is company-private in BizPos, so members can't read it directly.
// guest_list_outlets lists every branch with online ordering on.
export async function outletNames(
  supabase: { rpc: (fn: "guest_list_outlets") => PromiseLike<{ data: unknown }> }
): Promise<Map<string, string>> {
  const { data } = await supabase.rpc("guest_list_outlets");
  return new Map(((data ?? []) as PickupOutlet[]).map((o) => [o.id, o.name]));
}

// Order-ahead pickup times for the next week (ISO). Empty when the branch doesn't take orders ahead.
// ponytail: a week of days in parallel (the server returns nothing past the outlet's limit); one call if it grows.
export async function pickupSlots(
  supabase: { rpc: (fn: "guest_pickup_slots", args: { p_outlet: string; p_date: string }) => PromiseLike<{ data: unknown }> },
  outletId: string
): Promise<string[]> {
  const start = Date.now();
  const dates = Array.from({ length: 7 }, (_, i) => new Date(start + i * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }));
  const rs = await Promise.all(dates.map((d) => supabase.rpc("guest_pickup_slots", { p_outlet: outletId, p_date: d })));
  return rs.flatMap((r) => ((r.data ?? []) as { slot: string }[]).map((x) => x.slot));
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
