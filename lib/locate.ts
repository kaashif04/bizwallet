import { unstable_cache } from "next/cache";
import type { PickupOutlet } from "./guest-order";

type LatLng = { lat: number; lng: number };

// Coordinates inside a Google Maps URL: the pin (!3d..!4d..) beats the view (@lat,lng).
export function coordsFromMapsUrl(url: string): LatLng | null {
  const m =
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ??
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

const timeout = () => AbortSignal.timeout(4000);

// The branch's maps link (short links are followed once), else its address via OpenStreetMap.
// Cached a week per link/address, so OSM sees one request per branch, not one per visit.
const lookup = unstable_cache(
  async (
    mapsUrl: string | null,
    address: string | null,
  ): Promise<LatLng | null> => {
    if (mapsUrl) {
      const direct = coordsFromMapsUrl(mapsUrl);
      if (direct) return direct;
      const res = await fetch(mapsUrl, {
        redirect: "manual",
        signal: timeout(),
        cache: "no-store",
      });
      const found = coordsFromMapsUrl(res.headers.get("location") ?? "");
      if (found) return found;
    }
    if (address) {
      const q = new URLSearchParams({
        format: "json",
        limit: "1",
        countrycodes: "my",
        q: address,
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${q}`,
        {
          headers: { "User-Agent": "BizWallet/1.0 (store distances)" },
          signal: timeout(),
          cache: "no-store",
        },
      );
      const [hit] = (await res.json()) as { lat: string; lon: string }[];
      if (hit) return { lat: Number(hit.lat), lng: Number(hit.lon) };
    }
    return null; // a failed request throws instead, so it isn't cached
  },
  ["branch-location"],
  { revalidate: 7 * 24 * 3600 },
);

// Fills lat/lng for branches whose owner hasn't set a location in BizPos.
export async function withLocations(
  branches: PickupOutlet[],
): Promise<PickupOutlet[]> {
  return Promise.all(
    branches.map(async (b) => {
      if (b.lat != null && b.lng != null) return b;
      // ponytail: first uncached load geocodes all branches at once; OSM asks for 1 req/s, fine while there are a handful.
      const at = await lookup(b.maps_url, b.address).catch(() => null);
      return at ? { ...b, ...at } : b;
    }),
  );
}
