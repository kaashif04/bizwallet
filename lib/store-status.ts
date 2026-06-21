// Live store status & proximity: distance to an outlet, its current
// open/closed/offline state, and a placeholder wait-time estimate.

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Great-circle distance between two lat/long points, in kilometers.
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export type StoreStatusLabel = "Open" | "Closing Soon" | "Closed" | "Offline";

export type StoreStatus = {
  status: StoreStatusLabel;
  // Tailwind color family, deliberately unprefixed (no "bg-"/"text-") so the
  // caller can compose whichever utility it needs, e.g. `text-${color}-600`
  // or `bg-${color}-50`. Not specified by the spec for "Offline" — slate
  // (neutral) chosen since it's a deliberate manual shutdown, not an alarm.
  color: string;
};

const CLOSING_SOON_WINDOW_MINUTES = 45;

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// open_time/close_time accept "HH:MM" or "HH:MM:SS" (PostgREST returns the
// latter for a `time` column), or null if the outlet hasn't configured hours
// yet — in which case it's treated as always open. is_accepting_orders is a
// manual kill switch that overrides hours entirely: an outlet can be within
// its hours and still "Offline" if the kitchen flips the switch off.
export function getStoreStatus(
  openTime: string | null,
  closeTime: string | null,
  isAcceptingOrders: boolean,
  now: Date = new Date()
): StoreStatus {
  if (!isAcceptingOrders) {
    return { status: "Offline", color: "slate" };
  }
  if (!openTime || !closeTime) {
    return { status: "Open", color: "emerald" };
  }

  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < openMinutes || nowMinutes >= closeMinutes) {
    return { status: "Closed", color: "red" };
  }
  if (closeMinutes - nowMinutes <= CLOSING_SOON_WINDOW_MINUTES) {
    return { status: "Closing Soon", color: "amber" };
  }
  return { status: "Open", color: "emerald" };
}

const BASE_WAIT_MINUTES = 15;
const MINUTES_PER_QUEUED_ORDER = 5;

// Placeholder until real POS queue data exists: base prep time plus a flat
// per-order penalty. mockQueueLength defaults to a plausible idle/mid queue
// so this doesn't need a real argument yet — swap it for a live count later.
export function estimateWaitMinutes(mockQueueLength: number = 3): number {
  return BASE_WAIT_MINUTES + MINUTES_PER_QUEUED_ORDER * mockQueueLength;
}
