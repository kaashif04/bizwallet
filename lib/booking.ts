// Guest table booking, against the DB's booking_* RPCs. Client-safe: the token is
// the secret, so it's only ever sent to our own RPCs and routes.

export type BookingConfig = {
  enabled: boolean;
  min_party: number;
  max_party: number;
  days_ahead: number;
  slot_minutes: number;
  deposit_per_guest: number;
  deposit_cap: number;
  free_cancel_hours: number;
  hold_minutes: number;
  refund_excess: boolean;
  policy_text: string;
  hours: { open: string; close: string }[] | null;
};

export type Booking = {
  id: string;
  code: string;
  status: string; // awaiting_deposit | booked | expired | cancelled | ...
  when: string;
  party: number;
  name: string;
  note: string | null;
  deposit_due: number;
  deposit_status: string | null;
  deposit_applied: number;
  refund_amount: number;
  expires_at: string | null;
  free_cancel_until: string | null;
  can_cancel_free: boolean;
  can_cancel: boolean;
  outlet: { id: string; name: string; address: string | null; phone: string | null; maps_url: string | null };
};

// What this phone remembers about a booking, for "My bookings".
export type SavedBooking = { token: string; code: string; outlet: string; when: string; party: number; phone?: string; billId?: string };

const KL = "Asia/Kuala_Lumpur";
export const bookingMoney = (n: number) => `RM${Number(n).toFixed(0)}`;

// Dates and times are Malaysia time, whatever the phone's zone.
export const klToday = () => new Date().toLocaleDateString("en-CA", { timeZone: KL });
export const klDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-MY", { timeZone: KL, weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const klTime = (iso: string) => new Date(iso).toLocaleTimeString("en-MY", { timeZone: KL, hour: "numeric", minute: "2-digit" });
export const klDateTime = (iso: string) => `${klDate(iso)}, ${klTime(iso)}`;

// Deposit the DB will ask for, shown before the guest pays (the DB's number wins).
export const depositFor = (cfg: BookingConfig, party: number) => Math.min(cfg.deposit_per_guest * party, cfg.deposit_cap);

const KEY = "bizwallet.bookings";

export function savedBookings(): SavedBooking[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Add or update one booking (keyed by token), newest first.
export function rememberBooking(b: SavedBooking) {
  try {
    const all = savedBookings();
    const old = all.find((x) => x.token === b.token);
    const rest = all.filter((x) => x.token !== b.token);
    localStorage.setItem(KEY, JSON.stringify([{ ...old, ...b }, ...rest].slice(0, 20)));
  } catch {
    // Private mode or blocked storage: the booking page still works from its link.
  }
}

export function forgetBooking(token: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(savedBookings().filter((x) => x.token !== token)));
  } catch {
    // Same as above.
  }
}
