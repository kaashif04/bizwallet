import { createHmac, randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { e164, STATUS } from "@/lib/delivery";

// Lalamove API v3 (Malaysia). SERVER-ONLY. Each company has its own Lalamove account; the keys live
// in company_lalamove (service role only). Lalamove bills the company's prepaid Lalamove wallet.
// Like Billplz, we never trust a webhook body: we re-read the order from Lalamove with the keys.

export type Keys = { api_key: string; api_secret: string };

const host = (k: Keys) => (k.api_key.startsWith("pk_test_") ? "https://rest.sandbox.lalamove.com" : "https://rest.lalamove.com");

export class LalamoveError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function lalamove<T = Record<string, unknown>>(k: Keys, method: string, path: string, data?: unknown): Promise<T> {
  const body = data === undefined ? "" : JSON.stringify({ data });
  const t = Date.now().toString();
  const sig = createHmac("sha256", k.api_secret).update(`${t}\r\n${method}\r\n${path}\r\n\r\n${body}`).digest("hex");
  const res = await fetch(host(k) + path, {
    method,
    body: body || undefined,
    headers: {
      "Content-Type": "application/json",
      Authorization: `hmac ${k.api_key}:${t}:${sig}`,
      Market: "MY",
      "Request-ID": randomUUID(),
    },
    cache: "no-store",
  });
  const json = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json?.errors?.[0];
    throw new LalamoveError(e?.message || e?.id || `Lalamove error ${res.status}`, res.status, e?.id);
  }
  return (json.data ?? json) as T;
}

export async function companyKeys(companyId: string): Promise<Keys | null> {
  const { data } = await createAdminClient()
    .from("company_lalamove")
    .select("api_key, api_secret")
    .eq("company_id", companyId)
    .maybeSingle();
  return data;
}

export type Quote = {
  quotationId: string;
  expiresAt: string;
  priceBreakdown: { total: string };
  distance: { value: string };
  stops: { stopId: string }[];
};

export const quote = (k: Keys, from: { lat: number; lng: number; address: string }, to: { lat: number; lng: number; address: string }) =>
  lalamove<Quote>(k, "POST", "/v3/quotations", {
    serviceType: "MOTORCYCLE",
    language: "en_MY",
    stops: [from, to].map((s) => ({ coordinates: { lat: String(s.lat), lng: String(s.lng) }, address: s.address.slice(0, 300) })),
  });

const rm = (n: number) => `RM${n.toFixed(2)}`;

// Bring one delivery up to date with Lalamove: book it ('booking'), cancel it (order rejected), or
// re-read its status and driver. Safe to call any number of times (DB trigger, webhook, Refresh).
export async function syncDelivery(id: string): Promise<void> {
  const admin = createAdminClient();
  const { data: d } = await admin
    .from("deliveries")
    .select("*, guest_orders(status, number, note), outlets(name, company_id)")
    .eq("id", id)
    .maybeSingle();
  if (!d) return;
  const order = d.guest_orders as { status: string; number: number | null; note: string | null } | null;
  const outlet = d.outlets as { name: string; company_id: string };
  const set = (patch: Record<string, unknown>) =>
    admin.from("deliveries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  const keys = await companyKeys(outlet.company_id);
  if (!keys) {
    if (d.status === "booking") await set({ status: "problem", problem: "Lalamove isn't connected for this company." });
    return;
  }

  if (d.status === "booking") {
    if (order?.status !== "accepted") return void (await set({ status: "cancelled" }));
    // Claim it, so two syncs at once can't book two drivers.
    const { data: claimed } = await admin
      .from("deliveries")
      .update({ booked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "booking")
      .is("booked_at", null)
      .select("id");
    if (!claimed?.length) return;
    try {
      const { data: s } = await admin
        .from("outlet_settings")
        .select("store_lat, store_lng, store_address, store_phone")
        .eq("outlet_id", d.outlet_id)
        .single();
      let quotationId: string = d.quotation_id;
      let stops: { stopId: string }[];
      if (Date.parse(d.quote_expires_at) - Date.now() > 20_000) {
        stops = (await lalamove<Quote>(keys, "GET", `/v3/quotations/${quotationId}`)).stops;
      } else {
        // The price the customer saw has expired: the restaurant never pays more than was charged
        // (or than the quote, when delivery was free), unless staff press Book anyway.
        const q = await quote(
          keys,
          { lat: Number(s!.store_lat), lng: Number(s!.store_lng), address: s!.store_address || outlet.name },
          { lat: Number(d.lat), lng: Number(d.lng), address: d.address }
        );
        const price = Number(q.priceBreakdown.total);
        const limit = Math.max(Number(d.fee), Number(d.lalamove_price));
        if (price > limit && !d.force_price) {
          return void (await set({
            status: "problem",
            booked_at: null,
            problem: `Lalamove now charges ${rm(price)}; the customer paid ${rm(Number(d.fee))} for delivery. Book anyway, or cancel the order in the POS to refund it.`,
          }));
        }
        quotationId = q.quotationId;
        stops = q.stops;
      }
      const placed = await lalamove<{ orderId: string; status: string; shareLink: string; priceBreakdown: { total: string } }>(
        keys,
        "POST",
        "/v3/orders",
        {
          quotationId,
          sender: { stopId: stops[0].stopId, name: outlet.name.slice(0, 60), phone: e164(s!.store_phone ?? "") },
          recipients: [
            {
              stopId: stops[1].stopId,
              name: d.recipient_name ?? "Customer",
              phone: e164(d.recipient_phone ?? ""),
              remarks: [d.unit, d.driver_note, order.number ? `Order #${order.number}` : null].filter(Boolean).join(" · "),
            },
          ],
          isPODEnabled: false,
          metadata: { deliveryId: id },
        }
      );
      await set({
        status: STATUS[placed.status] ?? "assigning",
        problem: null,
        quotation_id: quotationId,
        lalamove_order_id: placed.orderId,
        share_link: placed.shareLink,
        cost: Number(placed.priceBreakdown?.total ?? d.lalamove_price),
      });
    } catch (e) {
      const err = e as LalamoveError;
      await set({
        status: "problem",
        booked_at: null,
        problem:
          err.status === 402 || /credit/i.test(err.code ?? "")
            ? "Your Lalamove wallet is out of credit. Top it up in Lalamove, then press Book again."
            : `Lalamove couldn't book it: ${err.message}`.slice(0, 300),
      });
    }
    return;
  }

  if (!d.lalamove_order_id) return;
  const o = await lalamove<{ status: string; driverId?: string; shareLink?: string; priceBreakdown?: { total: string } }>(
    keys,
    "GET",
    `/v3/orders/${d.lalamove_order_id}`
  );
  // The order was cancelled in the POS: call the driver off if Lalamove still lets us.
  if (order?.status === "rejected" && ["ASSIGNING_DRIVER", "ON_GOING"].includes(o.status)) {
    try {
      await lalamove(keys, "DELETE", `/v3/orders/${d.lalamove_order_id}`);
      return void (await set({ status: "cancelled", problem: null }));
    } catch (e) {
      return void (await set({
        status: "problem",
        problem: `The order was cancelled but Lalamove wouldn't cancel the driver (${(e as Error).message}). Cancel it in the Lalamove app.`,
      }));
    }
  }
  let driver = d.driver as { id: string; name: string; phone: string; plate: string } | null;
  if (o.driverId && driver?.id !== o.driverId) {
    const dr = await lalamove<{ name: string; phone: string; plateNumber: string }>(
      keys,
      "GET",
      `/v3/orders/${d.lalamove_order_id}/drivers/${o.driverId}`
    ).catch(() => null);
    if (dr) driver = { id: o.driverId, name: dr.name, phone: dr.phone, plate: dr.plateNumber };
  }
  const status = STATUS[o.status] ?? (order?.status === "rejected" ? "cancelled" : "problem");
  const now = new Date().toISOString();
  await set({
    status,
    problem:
      status !== "problem"
        ? null
        : o.status === "EXPIRED"
          ? "No Lalamove driver took it. Press Book again."
          : `Lalamove says ${o.status.toLowerCase().replace("_", " ")}. Press Book again, or cancel the order in the POS to refund it.`,
    share_link: o.shareLink ?? d.share_link,
    cost: o.priceBreakdown?.total ? Number(o.priceBreakdown.total) : d.cost,
    driver,
    picked_up_at: d.picked_up_at ?? (status === "picked_up" || status === "completed" ? now : null),
    completed_at: d.completed_at ?? (status === "completed" ? now : null),
  });
}
