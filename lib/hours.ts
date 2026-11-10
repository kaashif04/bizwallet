import type { DayHours, Hours } from "./guest-order";

// "02:00" -> "2am", "19:30" -> "7:30pm", "12:00" -> "12pm".
export function clock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 || h === 24 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

// Malaysia wall-clock time, for "opens tomorrow 10am" on a UTC server.
export const klNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));

// The branch's open/closed pill from guest_store; null = no hours set (treated as always open).
export async function storeStatus(
  supabase: { rpc: (fn: "guest_store", args: { p_outlet: string }) => PromiseLike<{ data: unknown }> },
  outletId: string
) {
  const { data } = await supabase.rpc("guest_store", { p_outlet: outletId });
  const s = data as { open_now: boolean | null; today: DayHours; hours: Hours | null } | null;
  return s ? openLabel(s.open_now, s.today, s.hours, klNow()) : null;
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
