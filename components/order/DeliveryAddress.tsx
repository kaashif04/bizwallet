"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// Delivery: the customer moves the map under a fixed pin (or searches / uses their location),
// we fill the address from the pin, and get Lalamove's price for it from /api/delivery/quote.
// ponytail: OpenStreetMap tiles + Nominatim are free with fair use (search on submit, ~1 req/s);
// move to a paid geocoder if delivery volume grows.

export type DeliveryInfo = { max_km: number; free_above: number | null; lat: number; lng: number };
export type DeliveryQuote = { id: string; fee: number; distance_km: number; expires_at: string; free_above: number | null };
export type DeliveryState = {
  lat: number | null;
  lng: number | null;
  address: string;
  unit: string;
  name: string;
  phone: string;
  note: string;
  quote: DeliveryQuote | null;
  quoting: boolean;
  error: string | null;
};
export const emptyDelivery = (name = "", phone = ""): DeliveryState => ({
  lat: null, lng: null, address: "", unit: "", name, phone, note: "", quote: null, quoting: false, error: null,
});

export async function fetchQuote(outletId: string, d: { lat: number; lng: number; address: string }): Promise<DeliveryQuote> {
  const res = await fetch("/api/delivery/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outlet_id: outletId, ...d }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? "Couldn't get a delivery price.");
  return j as DeliveryQuote;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
type Place = { lat: string; lon: string; display_name: string };
const short = (s: string) => s.split(", ").filter((p) => !/^\d{5}$/.test(p) && p !== "Malaysia").slice(0, 4).join(", ");

export default function DeliveryAddress({
  outletId,
  info,
  value,
  onChange,
}: {
  outletId: string;
  info: DeliveryInfo;
  value: DeliveryState;
  onChange: (f: (d: DeliveryState) => DeliveryState) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [locating, setLocating] = useState(false);
  const typed = useRef(false); // the customer edited the address: don't overwrite it from the pin
  const latest = useRef(value); // the map's handlers are made once; they read the address from here
  latest.current = value;

  // The map, once. Moving it moves the pin; the pin's spot gets an address.
  useEffect(() => {
    let off = false;
    let timer: number | undefined;
    import("leaflet").then((L) => {
      if (off || !el.current || map.current) return;
      const start: [number, number] = value.lat != null && value.lng != null ? [value.lat, value.lng] : [info.lat, info.lng];
      const m = L.map(el.current, { zoomControl: false }).setView(start, value.lat != null ? 17 : 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
      L.circleMarker([info.lat, info.lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#0f766e", fillOpacity: 1 })
        .bindTooltip("Restaurant")
        .addTo(m);
      m.on("movestart", () => onChange((d) => ({ ...d, quote: null, error: null })));
      m.on("moveend", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => pinMoved(m.getCenter().lat, m.getCenter().lng), 700);
      });
      map.current = m;
    });
    return () => {
      off = true;
      window.clearTimeout(timer);
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the map is made once
  }, []);

  async function pinMoved(lat: number, lng: number) {
    let address = latest.current.address;
    if (!typed.current) {
      const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, { headers: { "Accept-Language": "en" } })
        .then((r) => r.json())
        .catch(() => null);
      address = r?.display_name ? short(r.display_name) : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    onChange((d) => ({ ...d, lat, lng, address: typed.current ? d.address : address }));
    getPrice(lat, lng, typed.current ? undefined : address);
  }

  async function getPrice(lat: number, lng: number, address?: string) {
    onChange((d) => ({ ...d, quoting: true, error: null, quote: null }));
    try {
      const q = await fetchQuote(outletId, { lat, lng, address: address ?? latest.current.address });
      onChange((d) => (d.lat === lat && d.lng === lng ? { ...d, quote: q, quoting: false } : d));
    } catch (e) {
      onChange((d) => ({ ...d, quoting: false, error: (e as Error).message }));
    }
  }

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim().length < 3) return;
    const r = await fetch(`${NOMINATIM}/search?format=jsonv2&countrycodes=my&limit=5&q=${encodeURIComponent(search.trim())}`, {
      headers: { "Accept-Language": "en" },
    })
      .then((r) => r.json())
      .catch(() => []);
    setResults(r);
  }

  function goTo(lat: number, lng: number) {
    typed.current = false;
    setResults(null);
    map.current?.setView([lat, lng], 18);
  }

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        goTo(p.coords.latitude, p.coords.longitude);
      },
      () => {
        setLocating(false);
        onChange((d) => ({ ...d, error: "Couldn't get your location. Search for your address instead." }));
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  const input = "w-full rounded-xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-400";
  return (
    <div className="mt-4 space-y-2 rounded-2xl bg-ink-50 p-4">
      <p className="text-sm font-bold text-ink-800">Deliver to</p>
      <form onSubmit={find} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your address or building"
          aria-label="Search your address"
          className={`${input} min-w-0 flex-1`}
        />
        <button type="submit" className="shrink-0 rounded-xl bg-ink-900 px-4 text-sm font-bold text-ink-50 active:scale-95">
          Find
        </button>
      </form>
      {results && (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl bg-white">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-ink-500">Nothing found. Try a building or street name.</li>}
          {results.map((r) => (
            <li key={r.lat + r.lon}>
              <button type="button" onClick={() => goTo(Number(r.lat), Number(r.lon))} className="block min-h-11 w-full px-4 py-2.5 text-left text-sm text-ink-800">
                {short(r.display_name)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <div ref={el} className="h-56 w-full overflow-hidden rounded-xl bg-ink-100" />
        {/* The pin stays in the middle; the map moves under it. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[500] h-9 w-9 -translate-x-1/2 -translate-y-full text-rose-600 drop-shadow">
          <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        <button
          type="button"
          onClick={locate}
          className="absolute bottom-2 right-2 z-[500] rounded-full bg-white px-3 py-2 text-xs font-bold text-ink-800 shadow-md active:scale-95"
        >
          {locating ? "Finding you…" : "Use my location"}
        </button>
      </div>
      <p className="text-xs text-ink-500">Move the map so the pin is on your door. We deliver up to {info.max_km} km.</p>
      <input
        value={value.address}
        onChange={(e) => {
          typed.current = true;
          onChange((d) => ({ ...d, address: e.target.value }));
        }}
        onBlur={() => typed.current && value.lat != null && value.lng != null && getPrice(value.lat, value.lng)}
        placeholder="Address"
        aria-label="Address"
        maxLength={300}
        className={input}
      />
      <input
        value={value.unit}
        onChange={(e) => onChange((d) => ({ ...d, unit: e.target.value }))}
        placeholder="Unit, floor or house no."
        aria-label="Unit, floor or house number"
        maxLength={100}
        className={input}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={value.name}
          onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
          placeholder="Name"
          aria-label="Name for the driver"
          autoComplete="name"
          maxLength={60}
          className={input}
        />
        <input
          value={value.phone}
          onChange={(e) => onChange((d) => ({ ...d, phone: e.target.value }))}
          placeholder="Phone"
          aria-label="Phone for the driver"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={input}
        />
      </div>
      <input
        value={value.note}
        onChange={(e) => onChange((d) => ({ ...d, note: e.target.value }))}
        placeholder="Note for the driver (optional)"
        aria-label="Note for the driver"
        maxLength={200}
        className={input}
      />
      {value.quoting && <p className="text-sm text-ink-500">Checking the delivery fee…</p>}
      {value.error && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {value.error}
        </p>
      )}
      {value.quote && (
        <p className="text-sm text-ink-700">
          Delivery by Lalamove · {value.quote.distance_km} km
        </p>
      )}
    </div>
  );
}
