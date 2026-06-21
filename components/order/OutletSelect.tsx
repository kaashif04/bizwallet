"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { Outlet } from "@/lib/order-types";
import { getStoreStatus, estimateWaitMinutes, haversineDistanceKm } from "@/lib/store-status";

type Coords = { lat: number; lon: number };
type LocationState =
  | { status: "idle" | "loading" }
  | { status: "granted"; coords: Coords }
  | { status: "denied" | "unsupported" | "error" };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 5 * 60 * 1000,
};

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};
const cardTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

// Keyed by the unprefixed Tailwind color token getStoreStatus returns.
const DOT_GLOW: Record<string, string> = {
  emerald: "bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.55)]",
  amber: "bg-amber-500 shadow-[0_0_10px_2px_rgba(245,158,11,0.55)]",
  red: "bg-red-500 shadow-[0_0_8px_1px_rgba(239,68,68,0.45)]",
  slate: "bg-slate-400 shadow-[0_0_6px_1px_rgba(100,116,139,0.35)]",
};
const BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export default function OutletSelect({
  outlets,
  onSelect,
}: {
  outlets: Outlet[];
  onSelect: (o: Outlet) => void;
}) {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [search, setSearch] = useState("");

  function requestLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocation({ status: "unsupported" });
      return;
    }
    setLocation({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          status: "granted",
          coords: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        }),
      (err) =>
        setLocation({ status: err.code === 1 /* PERMISSION_DENIED */ ? "denied" : "error" }),
      GEO_OPTIONS
    );
  }

  useEffect(() => {
    requestLocation();
    // Only ever auto-request once, on mount — retries are user-initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No geocoding API wired up, so "Search by city" is a local filter over
  // each outlet's name/address/kind rather than a real location lookup.
  const showSearchFallback =
    location.status === "denied" || location.status === "unsupported" || location.status === "error";

  const sorted = useMemo(() => {
    const withDistance = outlets.map((o) => ({
      outlet: o,
      distanceKm:
        location.status === "granted" && o.latitude != null && o.longitude != null
          ? haversineDistanceKm(location.coords.lat, location.coords.lon, o.latitude, o.longitude)
          : null,
    }));
    // Closest first; outlets with unknown distance (no coords, or location
    // not granted) sink to the bottom instead of being treated as "0 km".
    withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return withDistance;
  }, [outlets, location]);

  const filtered = useMemo(() => {
    if (!showSearchFallback || !search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter(
      ({ outlet: o }) =>
        o.name.toLowerCase().includes(q) ||
        (o.address ?? "").toLowerCase().includes(q) ||
        (o.kind ?? "").toLowerCase().includes(q)
    );
  }, [sorted, search, showSearchFallback]);

  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-5">
      <div className="flex items-center gap-3">
        <Link
          href="/customer/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Back to dashboard"
        >
          <span className="text-lg">←</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5"
      >
        <p className="text-sm font-medium text-brand-600">Start an order</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Choose a store</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick where you&apos;d like to dine or pick up.
        </p>
      </motion.div>

      {/* Location status banner */}
      {location.status === "loading" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
          Finding stores near you…
        </p>
      )}
      {location.status === "granted" && (
        <p className="mt-4 text-sm text-slate-500">📍 Sorted by distance from you</p>
      )}
      {showSearchFallback && (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {location.status === "unsupported"
              ? "Location isn't available on this device."
              : location.status === "denied"
                ? "Location access denied — search to find a store instead."
                : "Couldn't get your location right now."}
          </p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-amber-700">
            Search by city or store
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Bangsar, KLCC, Steamboat…"
            className="mt-1.5 w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
          />
          {location.status !== "denied" && (
            <button
              type="button"
              onClick={requestLocation}
              className="mt-3 text-xs font-semibold text-amber-700 underline"
            >
              Try location again
            </button>
          )}
        </div>
      )}

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="mt-6 space-y-4"
      >
        {filtered.map(({ outlet: o, distanceKm }) => {
          const { status, color } = getStoreStatus(
            o.open_time ?? null,
            o.close_time ?? null,
            o.is_accepting_orders ?? true
          );
          const disabled = status === "Closed" || status === "Offline";
          const waitMinutes = estimateWaitMinutes();

          return (
            <motion.div
              key={o.id}
              variants={cardVariants}
              layout
              transition={cardTransition}
              className={`rounded-3xl border p-4 shadow-sm transition ${
                disabled
                  ? "border-slate-100 bg-slate-50/70 opacity-60"
                  : "border-slate-100 bg-white hover:border-brand-200 hover:shadow-md"
              }`}
            >
              <div className="flex gap-4">
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                    disabled
                      ? "bg-slate-200"
                      : "bg-gradient-to-br from-brand-100 to-brand-200"
                  }`}
                >
                  {o.emoji ?? "🏪"}
                </span>
                <div className="min-w-0 flex-1">
                  {o.kind && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      {o.kind}
                    </span>
                  )}
                  <p className="truncate text-base font-semibold text-slate-900">
                    {o.name}
                  </p>
                  {o.address && (
                    <p className="truncate text-sm text-slate-500">{o.address}</p>
                  )}
                  {distanceKm != null && (
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      📍{" "}
                      {distanceKm < 1
                        ? `${Math.round(distanceKm * 1000)} m away`
                        : `${distanceKm.toFixed(1)} km away`}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_CLASSES[color]}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${DOT_GLOW[color]} ${
                      status === "Open" || status === "Closing Soon" ? "animate-pulse" : ""
                    }`}
                  />
                  {status}
                  {!disabled ? ` · ${waitMinutes} min wait` : ""}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(o)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed bg-slate-200 text-slate-400"
                      : "bg-brand-600 text-white shadow-sm shadow-brand-600/25 active:scale-[0.98]"
                  }`}
                >
                  Select store
                </button>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            {search.trim() ? `No stores match “${search}”.` : "No stores available right now."}
          </p>
        )}
      </motion.div>
    </div>
  );
}
