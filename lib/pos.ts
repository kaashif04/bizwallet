import type { CartLine, Outlet, ServiceType } from "./order-types";

// The order payload. `items` matches the JSONB shape that the Phase-1
// process_wallet_payment(p_items ...) RPC expects, so checkout can pass it
// straight through once payments are wired.
export type OrderPayloadItem = {
  menu_item_id: string;
  // The POS's own item id, so the kitchen ticket prints from its own catalog
  // rather than needing to look up our internal uuid.
  external_pos_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  variants: {
    group: string;
    option: string;
    group_external_pos_id: string | null;
    option_external_pos_id: string | null;
  }[];
};

export type OrderPayload = {
  outlet_id: string;
  // Fulfilment, clearly tagged for the POS:
  //   { type: "dine_in", table: "12" }  or  { type: "takeaway", table: null }
  type: ServiceType;
  table: string | null;
  items: OrderPayloadItem[];
  subtotal: number;
  // Post tier-discount — what the customer actually pays and what's charged
  // to the wallet (process_wallet_payment's p_order_total).
  total: number;
  discount_percentage: number;
  payment_method: "wallet" | "gateway";
  // ISO timestamp for "Schedule for Later", null for ASAP. The POS uses this
  // to time when it prints the kitchen ticket instead of firing immediately.
  scheduled_for: string | null;
};

export function buildOrderPayload(
  outlet: Outlet,
  lines: CartLine[],
  paymentMethod: "wallet" | "gateway",
  service: { type: ServiceType; table: string | null },
  discountPercentage: number = 0,
  scheduledFor: string | null = null
): OrderPayload {
  const items: OrderPayloadItem[] = lines.map((l) => ({
    menu_item_id: l.item.id,
    external_pos_id: l.item.externalPosId ?? null,
    name: l.item.name,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    variants: l.selections.map((s) => ({
      group: s.group,
      option: s.option,
      group_external_pos_id: s.groupExternalPosId ?? null,
      option_external_pos_id: s.optionExternalPosId ?? null,
    })),
  }));

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal * (1 - discountPercentage / 100));

  return {
    outlet_id: outlet.id,
    type: service.type,
    table: service.table,
    items,
    subtotal,
    total,
    discount_percentage: discountPercentage,
    payment_method: paymentMethod,
    scheduled_for: scheduledFor,
  };
}

/**
 * Sends a confirmed order to the chosen outlet's POS system.
 *
 * INTEGRATION TODO (later phase): each outlet runs its own POS instance. Resolve
 * the outlet's POS endpoint (e.g. an `outlets.pos_endpoint` column) and POST the
 * payload to it from a Server Action / Route Handler using that outlet's API key
 * — never from the browser. For now this mocks a successful kitchen ticket.
 */
export async function dispatchOrderToPOS(
  outlet: Outlet,
  payload: OrderPayload
): Promise<{ ok: boolean; ticketId?: string }> {
  if (typeof console !== "undefined") {
    console.info("[POS] would dispatch order to", outlet.name, payload);
  }
  return {
    ok: true,
    ticketId: "POS-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}
