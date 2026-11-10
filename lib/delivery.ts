// Delivery maths shared by the quote and booking routes (and lib/delivery.check.mjs).

// Lalamove wants E.164: 012-345 6789 -> +60123456789.
export function e164(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return "+" + (d.startsWith("60") ? d : d.startsWith("0") ? "6" + d : "60" + d);
}

// Customer's fee: Lalamove's price + the branch's markup, rounded up to 10 sen.
export const customerFee = (price: number, markupRm: number, markupPct: number) =>
  Math.ceil(Math.round((price * (1 + markupPct / 100) + markupRm) * 100) / 10) / 10;

// Straight-line km, to turn away far addresses before asking Lalamove.
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Lalamove order status -> ours.
export const STATUS: Record<string, string> = {
  ASSIGNING_DRIVER: "assigning",
  ON_GOING: "on_going",
  PICKED_UP: "picked_up",
  COMPLETED: "completed",
};
