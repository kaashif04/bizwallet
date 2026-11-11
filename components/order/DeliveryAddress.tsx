"use client";

import { useRef, useState } from "react";

// Delivery: the customer searches their address or uses their current location, checks the
// address we read back, and we get Lalamove's price for it from /api/delivery/quote. No map.
// ponytail: Nominatim is free with fair use (search on submit only, ~1 req/s); move to a paid
// geocoder if delivery volume grows or house-level results aren't good enough.

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
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState<"search" | "locate" | null>(null);
  const seq = useRef(0); // only the latest address gets its price shown

  async function choose(lat: number, lng: number, address: string) {
    const n = ++seq.current;
    setResults(null);
    onChange((d) => ({ ...d, lat, lng, address, quote: null, quoting: true, error: null }));
    try {
      const q = await fetchQuote(outletId, { lat, lng, address });
      if (n === seq.current) onChange((d) => ({ ...d, quote: q, quoting: false }));
    } catch (e) {
      if (n === seq.current) onChange((d) => ({ ...d, quoting: false, error: (e as Error).message }));
    }
  }

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim().length < 3) return;
    setBusy("search");
    // Results near the restaurant first (not limited to it: the server checks the distance).
    const box = [info.lng - 0.15, info.lat + 0.15, info.lng + 0.15, info.lat - 0.15].join(",");
    const r = await fetch(
      `${NOMINATIM}/search?format=jsonv2&countrycodes=my&limit=5&viewbox=${box}&q=${encodeURIComponent(search.trim())}`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .catch(() => []);
    setBusy(null);
    setResults(r);
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
              placeholder="Or type your address or building"
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
              {results.length === 0 && <li className="px-4 py-3 text-sm text-ink-500">Nothing found. Try a building, street or area name.</li>}
              {results.map((r) => (
                <li key={r.lat + r.lon}>
                  <button
                    type="button"
                    onClick={() => choose(Number(r.lat), Number(r.lon), short(r.display_name))}
                    className="block min-h-11 w-full px-4 py-2.5 text-left text-sm text-ink-800"
                  >
                    {short(r.display_name)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-ink-500">We deliver up to {info.max_km} km.</p>
        </>
      )}
      {value.quoting && <p className="text-sm text-ink-500">Getting the Lalamove price… this takes a few seconds.</p>}
      {value.error && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {value.error}
        </p>
      )}
      {value.quote && <p className="text-sm text-ink-700">Delivery by Lalamove · {value.quote.distance_km} km</p>}
      {picked && (
        <input
          value={value.unit}
          onChange={(e) => onChange((d) => ({ ...d, unit: e.target.value }))}
          placeholder="Unit, floor or house no."
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
