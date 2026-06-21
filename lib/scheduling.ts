// Time-slot generation for "Schedule for Later" ordering. Pure wall-clock
// math — open_time/close_time are Postgres `time` values (no date or zone
// attached), so this assumes the caller's local clock matches the outlet's
// local time (true for a single-country app) and that hours don't cross
// midnight (close_time > open_time on the same day).

const SLOT_INTERVAL_MINUTES = 15;

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function roundUpToInterval(minutes: number, interval: number): number {
  return Math.ceil(minutes / interval) * interval;
}

// openTime/closeTime accept "HH:MM" or "HH:MM:SS" (PostgREST returns the
// latter for a `time` column). now defaults to the real clock but is
// injectable so callers (and tests) can pin it.
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  prepTimeMinutes: number,
  now: Date = new Date()
): string[] {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const earliestReady = roundUpToInterval(nowMinutes + prepTimeMinutes, SLOT_INTERVAL_MINUTES);
  // Never offer a slot before the store opens, even if "now + prep" is earlier.
  const firstSlot = Math.max(earliestReady, roundUpToInterval(openMinutes, SLOT_INTERVAL_MINUTES));

  const slots: string[] = [];
  for (let slot = firstSlot; slot < closeMinutes; slot += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToLabel(slot));
  }
  return slots;
}

// Whether the outlet is open right now (current wall-clock time falls
// within [openTime, closeTime)). Distinct from generateTimeSlots returning
// [] — that means "no slots fit today even though open"; this means "closed".
export function isStoreOpenNow(
  openTime: string,
  closeTime: string,
  now: Date = new Date()
): boolean {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

// Converts a "HH:MM" slot label (as produced by generateTimeSlots) into a
// full timestamp for storage in orders.scheduled_for. Assumes the slot is
// for "today" in the caller's local time — matches generateTimeSlots'
// same-day, no-overnight-hours assumption.
export function slotToTimestamp(slotLabel: string, now: Date = new Date()): string {
  const minutes = parseTimeToMinutes(slotLabel);
  const result = new Date(now);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result.toISOString();
}
