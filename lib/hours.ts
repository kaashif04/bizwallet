import type { DayHours, Hours } from "./guest-order";

// "02:00" -> "2am", "19:30" -> "7:30pm", "12:00" -> "12pm".
export function clock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 || h === 24 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

// Malaysia wall-clock time, for "opens tomorrow 10am" on a UTC server.
const kl = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
export const klNow = () => kl(new Date());

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// A deal's end: "Ends 7pm" today, "Ends tonight" at midnight, "Ends Sun" this week, else "Ends 20 Nov" (KL time).
export function endsLabel(endsAt: string | null, now = new Date()): string | null {
  if (!endsAt) return null;
  const e = kl(new Date(endsAt));
  const n = kl(now);
  const days = Math.round(
    (new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 86_400_000
  );
  const hhmm = `${e.getHours()}:${String(e.getMinutes()).padStart(2, "0")}`;
  if (days <= 0) return `Ends ${clock(hhmm)}`;
  if (days === 1 && hhmm === "0:00") return "Ends tonight";
  if (days < 7) return `Ends ${DAYS[(e.getDay() + 6) % 7]}`;
  return `Ends ${e.getDate()} ${MONTHS[e.getMonth()]}`;
}

// What guest_store says about hours. ordering_open / last_order_at come from BizPos's optional
// "last orders" cut-off; until it's set (or shipped) they're missing and open_now decides.
export type StoreHours = {
  open_now: boolean | null;
  today: DayHours;
  hours: Hours | null;
  ordering_open?: boolean | null;
  last_order_at?: string | null; // "HH:MM"
  prep_minutes?: number | null; // kitchen's prep time, for "ready in about 20 min"
};

export async function loadStore(
  supabase: { rpc: (fn: "guest_store", args: { p_outlet: string }) => PromiseLike<{ data: unknown }> },
  outletId: string
) {
  const { data } = await supabase.rpc("guest_store", { p_outlet: outletId });
  return data as StoreHours | null;
}

// Can the branch take orders for now? null = no hours set (always open). Closed, or past
// last orders, gives open: false with when it opens next.
export function orderingStatus(s: StoreHours, now = klNow()) {
  const l = openLabel(s.open_now, s.today, s.hours, now);
  if (l?.open && s.ordering_open === false) {
    const opens = nextOpening(s.hours, now);
    // Same wording as guest_place_order's refusal.
    return { open: false, text: s.last_order_at ? `Last orders were at ${clock(s.last_order_at)}.` : "Not taking orders now", opens };
  }
  return l;
}

export async function storeStatus(supabase: Parameters<typeof loadStore>[0], outletId: string) {
  const s = await loadStore(supabase, outletId);
  return s ? orderingStatus(s) : null;
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// The pill text for a branch. open_now comes from the server (it knows about
// hours that run past midnight); we only work out when a closed branch opens.
export function openLabel(openNow: boolean | null, today: DayHours, hours: Hours | null, now = new Date()) {
  if (openNow === null) return null;
  if (openNow) return { open: true, text: today ? `Open now · closes ${clock(today.close)}` : "Open now" };
  const next = nextOpening(hours, now);
  return { open: false, text: next ? `Closed · opens ${next}` : "Closed", opens: next };
}

export function nextOpening(hours: Hours | null, now = new Date()): string | null {
  if (!hours?.length) return null;
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = hours[day];
  if (today && nowMin < minutes(today.open)) return clock(today.open);
  for (let i = 1; i <= 7; i++) {
    const d = hours[(day + i) % 7];
    if (d) return i === 1 ? `tomorrow ${clock(d.open)}` : `${DAYS[(day + i) % 7]} ${clock(d.open)}`;
  }
  return null;
}
