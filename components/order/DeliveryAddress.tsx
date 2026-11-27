"use client";

import { useEffect, useRef, useState } from "react";

// Delivery: the customer types and picks their building, street or taman (suggestions as they type),
// or uses their current location, then adds house/unit no. as text for the rider, like Grab and
// foodpanda: the point only has to be close, the text gets the rider to the door. No map.
// ponytail: Photon (type-ahead) + Nominatim (on Find, if Photon has nothing) are free OpenStreetMap
// geocoders with patchy Malaysian house numbers; swap in Google Places Autocomplete (10k free/month,
// needs a billing account) if customers still can't find their street.

export type DeliveryInfo = { max_km: number; free_above: number | null; lat: number; lng: number };
export type DeliveryQuote = { id: string; fee: number; distance_km: number; expires_at: string; free_above: number | null; own?: boolean };
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
const PHOTON = "https://photon.komoot.io/api/";
type Place = { lat: number; lng: number; label: string };
const short = (s: string) => s.split(", ").filter((p) => !/^\d{5}$/.test(p) && p !== "Malaysia").slice(0, 4).join(", ");
// "No 12, Jalan PJU 7/3" / "A-3-1 The Rafflesia": geocoders rarely know Malaysian house numbers, so
// search without it and keep it for the unit field.
const HOUSE = /^\s*((?:no\.?|lot|unit)?\s*[a-z]?-?\d+[a-z]?(?:-\d+[a-z]?)*)\s*,?\s+(?=\D)/i;
const LAST = "bw-last-delivery-address"; // this phone's last address, one tap next time

type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> };
function photonLabel(p: PhotonFeature["properties"]) {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  return [...new Set([p.name, street, p.district ?? p.locality, p.city].filter(Boolean))].slice(0, 4).join(", ");
}
function dedupe(list: Place[]) {
  const seen = new Set<string>();
  return list.filter((p) => p.label && !seen.has(p.label) && seen.add(p.label));
}

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
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState<"search" | "locate" | null>(null);
  const [last, setLast] = useState<{ lat: number; lng: number; address: string; unit: string } | null>(null);
  const seq = useRef(0); // only the latest address gets its price shown
  const typed = useRef(0); // only the latest search's suggestions are shown

  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem(LAST) ?? "null");
      if (l && typeof l.lat === "number" && typeof l.lng === "number" && typeof l.address === "string") setLast({ unit: "", ...l });
    } catch {}
  }, []);

  async function choose(lat: number, lng: number, address: string, unit?: string) {
    const n = ++seq.current;
    typed.current++;
    setResults(null);
    onChange((d) => ({ ...d, lat, lng, address, unit: unit ?? d.unit, quote: null, quoting: true, error: null }));
    try {
      const q = await fetchQuote(outletId, { lat, lng, address });
      if (n === seq.current) onChange((d) => ({ ...d, quote: q, quoting: false }));
    } catch (e) {
      if (n === seq.current) onChange((d) => ({ ...d, quoting: false, error: (e as Error).message }));
    }
  }

  // Remember the address (with the unit typed later) once it has a price.
  useEffect(() => {
    if (!value.quote || value.lat == null || value.lng == null) return;
    try {
      localStorage.setItem(LAST, JSON.stringify({ lat: value.lat, lng: value.lng, address: value.address, unit: value.unit }));
    } catch {}
  }, [value.quote, value.lat, value.lng, value.address, value.unit]);

  const query = search.trim();
  const [house, setHouse] = useState<string | undefined>(); // stripped house no., when that's what found it

  // Suggestions as they type, nearest to the restaurant first (the server checks the distance).
  async function suggest(full: string, fallback: boolean) {
    const n = ++typed.current;
    const box = [info.lng - 0.3, info.lat - 0.3, info.lng + 0.3, info.lat + 0.3].join(",");
    const photon = (q: string): Promise<Place[]> =>
      fetch(`${PHOTON}?q=${encodeURIComponent(q)}&lat=${info.lat}&lon=${info.lng}&bbox=${box}&limit=6&lang=en`)
        .then((r) => r.json())
        .then((j: { features: PhotonFeature[] }) =>
          j.features.map((f) => ({ lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], label: photonLabel(f.properties) }))
        )
        .catch(() => []);
    let list = await photon(full);
    const m = full.match(HOUSE);
    let found: string | undefined;
    if (!list.length && m) {
      list = await photon(full.slice(m[0].length).trim());
      if (list.length) found = m[1];
    }
    if (!list.length && fallback) {
      const vb = [info.lng - 0.3, info.lat + 0.3, info.lng + 0.3, info.lat - 0.3].join(",");
      list = await fetch(`${NOMINATIM}/search?format=jsonv2&countrycodes=my&limit=5&viewbox=${vb}&q=${encodeURIComponent(full)}`, {
        headers: { "Accept-Language": "en" },
      })
        .then((r) => r.json())
        .then((r: { lat: string; lon: string; display_name: string }[]) =>
          r.map((p) => ({ lat: Number(p.lat), lng: Number(p.lon), label: short(p.display_name) }))
        )
        .catch(() => []);
    }
    if (n !== typed.current) return;
    setHouse(found);
    setResults(dedupe(list).slice(0, 5));
  }

  useEffect(() => {
    if (query.length < 3) return setResults(null);
    const t = setTimeout(() => suggest(query, false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 3) return;
    setBusy("search");
    await suggest(query, true);
    setBusy(null);
  }

  function locate() {
    if (!navigator.geolocation) return onChange((d) => ({ ...d, error: "Your phone can't share its location. Search for your address instead." }));
    setBusy("locate");
    onChange((d) => ({ ...d, error: null }));
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, { headers: { "Accept-Language": "en" } })
          .then((r) => r.json())
          .catch(() => null);
        setBusy(null);
        choose(lat, lng, r?.display_name ? short(r.display_name) : "My current location");
      },
      () => {
        setBusy(null);
        onChange((d) => ({ ...d, error: "Couldn't get your location. Search for your address instead." }));
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function change() {
    seq.current++;
    onChange((d) => ({ ...d, lat: null, lng: null, address: "", quote: null, quoting: false, error: null }));
  }

  const input = "w-full rounded-xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-400";
  const picked = value.lat != null && value.lng != null;
  return (
    <div className="mt-4 space-y-2 rounded-2xl bg-ink-50 p-4">
      <p className="text-sm font-bold text-ink-800">Deliver to</p>
      {picked ? (
        <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent-600">
            <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <p className="min-w-0 flex-1 text-sm font-semibold text-ink-900">{value.address}</p>
          <button type="button" onClick={change} className="shrink-0 text-sm font-bold text-brand-700">
            Change
          </button>
        </div>
      ) : (
        <>
          {last && (
            <button
              type="button"
              onClick={() => choose(last.lat, last.lng, last.address, last.unit)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink-500">Last time</span>
                <span className="block truncate text-sm font-bold text-ink-900">
                  {[last.unit, last.address].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-brand-700">Use</span>
            </button>
          )}
          <button
            type="button"
            onClick={locate}
            disabled={busy !== null}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-ink-900 shadow-sm active:scale-[0.98] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-accent-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {busy === "locate" ? "Finding your address…" : "Use my current location"}
          </button>
          <form onSubmit={find} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Or type your street, taman or building"
              aria-label="Search your address"
              autoComplete="street-address"
              className={`${input} min-w-0 flex-1`}
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="min-h-11 shrink-0 rounded-xl bg-white px-4 text-sm font-bold text-brand-700 ring-1 ring-brand-200 active:scale-95 disabled:opacity-60"
            >
              {busy === "search" ? "…" : "Find"}
            </button>
          </form>
          {results && (
            <ul aria-label="Addresses found" className="divide-y divide-ink-100 overflow-hidden rounded-xl bg-white">
              {results.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-500">Nothing found. Try just your street, taman or condo name, or use your current location.</li>
              )}
              {results.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button
                    type="button"
                    onClick={() => choose(r.lat, r.lng, r.label, house)}
                    className="block min-h-11 w-full px-4 py-2.5 text-left text-sm text-ink-800"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results && results.length > 0 && (
            <p className="text-xs text-ink-500">Can&apos;t see your house? Pick your street or taman, then add your house no. below.</p>
          )}
          <p className="text-xs text-ink-500">We deliver up to {info.max_km} km.</p>
        </>
      )}
      {value.quoting && <p className="text-sm text-ink-500">Getting the delivery price… this takes a few seconds.</p>}
      {value.error && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {value.error}
        </p>
      )}
      {value.quote && (
        <p className="text-sm text-ink-700">
          {value.quote.own ? "Delivered by our own rider" : "Delivery by Lalamove"} · {value.quote.distance_km} km
        </p>
      )}
      {picked && (
        <input
          value={value.unit}
          onChange={(e) => onChange((d) => ({ ...d, unit: e.target.value }))}
          placeholder="House no., unit or floor (and street if not above)"
          aria-label="Unit, floor or house number"
          maxLength={100}
          className={input}
        />
      )}
      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
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
    </div>
  );
}
