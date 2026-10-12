// Billplz (FPX online banking) for prepaid pickup orders. SERVER-ONLY.
// Env: BILLPLZ_API_KEY, BILLPLZ_COLLECTION_ID, BILLPLZ_SANDBOX=1 for testing.
// We never trust what the browser or a callback says about payment: every
// check re-reads the bill from Billplz with our secret key.

export type Bill = { id: string; url: string; paid: boolean; state: string; amount: number; paid_amount: number };

const base = () =>
  process.env.BILLPLZ_SANDBOX === "1" ? "https://www.billplz-sandbox.com/api/v3" : "https://www.billplz.com/api/v3";

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
  email: string;
  name: string;
  amountSen: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
  reference: string;
}) {
  const form = new URLSearchParams({
    collection_id: process.env.BILLPLZ_COLLECTION_ID!,
    email: p.email,
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
