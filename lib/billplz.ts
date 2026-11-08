import { createHmac } from "crypto";

// Billplz (FPX online banking) for prepaid pickup orders. SERVER-ONLY.
// Env: BILLPLZ_API_KEY, BILLPLZ_COLLECTION_ID, BILLPLZ_SANDBOX=1 for testing.
// We never trust what the browser or a callback says about payment: every
// check re-reads the bill from Billplz with our secret key.

export type Bill = {
  id: string;
  url: string;
  paid: boolean;
  state: string;
  amount: number;
  paid_amount: number;
  reference_1: string | null; // what we put in reference_1 when the bill was made (a booking's token)
};

const root = () => (process.env.BILLPLZ_SANDBOX === "1" ? "https://www.billplz-sandbox.com/api" : "https://www.billplz.com/api");
const base = () => root() + "/v3";

export const billplzEnabled = () => !!(process.env.BILLPLZ_API_KEY && process.env.BILLPLZ_COLLECTION_ID);

async function call(path: string, init?: RequestInit): Promise<Bill> {
  const res = await fetch(base() + path, {
    ...init,
    headers: { Authorization: "Basic " + Buffer.from(process.env.BILLPLZ_API_KEY + ":").toString("base64") },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message?.toString() ?? `Billplz error ${res.status}`);
  return body as Bill;
}

export function createBill(p: {
  email?: string; // Billplz needs an email or a mobile
  mobile?: string;
  name: string;
  amountSen: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
  reference: string;
}) {
  const form = new URLSearchParams({
    collection_id: process.env.BILLPLZ_COLLECTION_ID!,
    ...(p.email ? { email: p.email } : {}),
    ...(p.mobile ? { mobile: p.mobile } : {}),
    name: p.name.slice(0, 255),
    amount: String(p.amountSen),
    description: p.description.slice(0, 200),
    callback_url: p.callbackUrl,
    redirect_url: p.redirectUrl,
    reference_1_label: "Order",
    reference_1: p.reference,
  });
  return call("/bills", { method: "POST", body: form });
}

export const getBill = (id: string) => call(`/bills/${encodeURIComponent(id)}`);

// Kills an unpaid bill so it can never be paid later. Throws if Billplz refuses (e.g. it was paid).
export const deleteBill = (id: string) => call(`/bills/${encodeURIComponent(id)}`, { method: "DELETE" });

// ---- Payment Orders (v5): paying refunds out to a bank account. Signed with the X Signature key. ----
// Env: BILLPLZ_PAYOUT_COLLECTION_ID, BILLPLZ_X_SIGNATURE_KEY. The collection's callback_url is set in Billplz
// to <site>/api/refunds/callback.

export type PaymentOrder = { id: string; status: string; reference_id: string | null };

export const payoutEnabled = () =>
  !!(process.env.BILLPLZ_API_KEY && process.env.BILLPLZ_PAYOUT_COLLECTION_ID && process.env.BILLPLZ_X_SIGNATURE_KEY);

// HMAC-SHA512 over the values joined with no delimiter, in the order Billplz documents per endpoint.
const sign = (...parts: (string | number)[]) =>
  createHmac("sha512", process.env.BILLPLZ_X_SIGNATURE_KEY ?? "").update(parts.join("")).digest("hex");

async function payoutCall(path: string, init?: RequestInit): Promise<PaymentOrder> {
  const res = await fetch(root() + path, {
    ...init,
    headers: { Authorization: "Basic " + Buffer.from(process.env.BILLPLZ_API_KEY + ":").toString("base64") },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = body?.error?.message;
    throw new Error((Array.isArray(m) ? m.join(", ") : m?.toString()) ?? `Billplz error ${res.status}`);
  }
  return body as PaymentOrder;
}

export function createPaymentOrder(p: { bankCode: string; account: string; name: string; amountSen: number; description: string; reference: string }) {
  const collection = process.env.BILLPLZ_PAYOUT_COLLECTION_ID!;
  const epoch = Math.floor(Date.now() / 1000);
  const form = new URLSearchParams({
    payment_order_collection_id: collection,
    bank_code: p.bankCode,
    bank_account_number: p.account,
    name: p.name.slice(0, 255),
    description: p.description.replace(/[^A-Za-z0-9 ]/g, " ").slice(0, 200),
    total: String(p.amountSen),
    reference_id: p.reference,
    epoch: String(epoch),
    checksum: sign(collection, p.account, p.amountSen, epoch),
  });
  return payoutCall("/v5/payment_orders", { method: "POST", body: form });
}

export function getPaymentOrder(id: string) {
  const epoch = Math.floor(Date.now() / 1000);
  return payoutCall(`/v5/payment_orders/${encodeURIComponent(id)}?epoch=${epoch}&checksum=${sign(id, epoch)}`);
}
