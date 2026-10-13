"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BranchLogo from "./BranchLogo";
import type { PickupOutlet } from "@/lib/guest-order";
import { openLabel } from "@/lib/hours";

// A banner tap asks the picker to show a branch or a company's branches.
export const STORES_EVENT = "bizwallet:stores";
export type StoresEvent = CustomEvent<{ outletId?: string | null; companyId?: string }>;

// Branch cards: dine in (scan the table QR) or order ahead for pickup.
// pickupOpen: pickup is paid online, so it's offered only once payment is set up.
export default function StorePicker({
  branches,
  logos = {},
  pickupOpen = true,
}: {
  branches: PickupOutlet[];
  logos?: Record<string, string>;
  pickupOpen?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  // Nearest first. The position stays on the phone: it's only used to sort.
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [noLocation, setNoLocation] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) return setNoLocation(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lng: p.coords.longitude });
        setNoLocation(false);
      },
      () => setNoLocation(true),
      { maximumAge: 600_000, timeout: 15_000 }
    );
  };
  useEffect(locate, []);

  useEffect(() => {
    const onPick = (e: Event) => {
      const { outletId, companyId } = (e as StoresEvent).detail;
      setQuery("");
      setCompany(outletId ? null : (companyId ?? null));
      setHighlight(outletId ?? null);
      requestAnimationFrame(() =>
        (outletId ? document.getElementById(`store-${outletId}`) : list.current)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      );
    };
    window.addEventListener(STORES_EVENT, onPick);
    // Arrived from a banner on another page: ?store=<outlet> or ?company=<company>.
    const q = new URLSearchParams(window.location.search);
    if (q.get("store") || q.get("company")) {
      onPick(new CustomEvent(STORES_EVENT, { detail: { outletId: q.get("store"), companyId: q.get("company") ?? undefined } }));
    }
    return () => window.removeEventListener(STORES_EVENT, onPick);
  }, []);

  const km = useMemo(
    () => new Map(branches.map((b) => [b.id, here && b.lat != null && b.lng != null ? distanceKm(here, b.lat, b.lng) : null])),
    [branches, here]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = (b: PickupOutlet) => (b.open_now === true ? 0 : b.open_now === null ? 1 : 2);
    const far = (b: PickupOutlet) => km.get(b.id) ?? Infinity;
    return branches
      .filter((b) => !company || b.company_id === company)
      .filter((b) => !q || b.name.toLowerCase().includes(q) || (b.address ?? "").toLowerCase().includes(q))
      .sort((a, b) => far(a) - far(b) || rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [branches, query, company, km]);

  return (
    <div>
      {noLocation && (
        <button
          type="button"
          onClick={locate}
          className="mb-3 flex w-full items-center gap-2 rounded-xl bg-white px-4 py-3 text-left text-sm text-ink-600"
        >
          <PinIcon />
          <span className="flex-1">Turn on location to see what&apos;s nearest</span>
        </button>
      )}
      {branches.length >= 4 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or area"
          aria-label="Search stores"
          className="mb-3 w-full rounded-xl bg-white px-4 py-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
        />
      )}
      {company && (
        <button
          type="button"
          onClick={() => setCompany(null)}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"
        >
          {branches.find((b) => b.company_id === company)?.company}
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Show all stores</span>
        </button>
      )}

      <ul ref={list} className="space-y-4">
        {shown.map((b, i) => (
          <motion.li
            key={b.id}
            id={`store-${b.id}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: Math.min(i, 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className={`scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow ${
              highlight === b.id ? "ring-2 ring-brand-500" : ""
            }`}
          >
            <BranchCard b={b} logo={logos[b.id]} pickupOpen={pickupOpen} km={km.get(b.id) ?? null} />
          </motion.li>
        ))}
        {shown.length === 0 && (
          <li className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-ink-500">No store matches “{query}”.</li>
        )}
      </ul>
    </div>
  );
}

function BranchCard({ b, logo, pickupOpen, km }: { b: PickupOutlet; logo?: string; pickupOpen: boolean; km: number | null }) {
  const status = openLabel(b.open_now, b.today, b.hours);
  const pickupState: { href?: string; note: string } = !b.pickup
    ? { note: "Not offered here" }
    : !pickupOpen
      ? { note: "Coming soon" }
      : b.open_now === false
        ? { note: status?.opens ? `Opens ${status.opens}` : "Closed now" }
        : { href: `/order/p/${b.id}`, note: "Order ahead, collect" };

  const directions =
    b.maps_url || (b.lat != null && b.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}` : null);

  return (
    <>
      <div className={`relative bg-brand-50 ${b.cover_url ? "aspect-[16/7]" : "aspect-[16/5]"}`}>
        {b.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BranchLogo name={b.name} logoUrl={logo} className="h-16 w-16 rounded-2xl text-2xl" />
          </div>
        )}
        {status && (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold shadow-sm ${
              status.open ? "bg-emerald-50 text-emerald-700" : "bg-white text-ink-600"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-emerald-500" : "bg-ink-400"}`} />
            {status.text}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {b.cover_url && <BranchLogo name={b.name} logoUrl={logo} className="h-10 w-10 rounded-xl text-base" />}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-bold leading-tight text-ink-900">{b.name}</h3>
            <p className="truncate text-xs text-ink-500">{b.company}</p>
          </div>
          {km !== null && (
            <span className="shrink-0 pt-0.5 text-xs font-bold text-ink-600">
              {km < 1 ? `${Math.max(10, Math.round(km * 100) * 10)} m` : `${km.toFixed(1)} km`}
            </span>
          )}
        </div>
        {b.tagline && <p className="mt-2 line-clamp-2 text-sm text-ink-700">{b.tagline}</p>}
        {b.address && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
            <PinIcon />
            <span className="truncate">{b.address}</span>
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/scan?at=${encodeURIComponent(b.name)}`}
            className="flex flex-col gap-0.5 rounded-xl bg-brand-600 px-4 py-3 text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <span className="flex items-center gap-2 text-[15px] font-bold">
              <ScanIcon />
              Dine in
            </span>
            <span className="text-xs text-on/80">Scan your table QR</span>
          </Link>
          {pickupState.href ? (
            <Link
              href={pickupState.href}
              className="flex flex-col gap-0.5 rounded-xl bg-ink-50 px-4 py-3 text-ink-900 shadow-well transition hover:bg-ink-100 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 text-[15px] font-bold">
                <BagIcon />
                Pickup
              </span>
              <span className="text-xs text-ink-500">{pickupState.note}</span>
            </Link>
          ) : (
            <div aria-disabled="true" className="flex flex-col gap-0.5 rounded-xl bg-ink-50 px-4 py-3 text-ink-400 shadow-well">
              <span className="flex items-center gap-2 text-[15px] font-bold">
                <BagIcon />
                Pickup
              </span>
              <span className="text-xs">{pickupState.note}</span>
            </div>
          )}
        </div>

        {(directions || b.phone) && (
          <div className="mt-2 flex gap-2">
            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold text-brand-700 transition hover:bg-brand-50"
              >
                <PinIcon />
                Directions
              </a>
            )}
            {b.phone && (
              <a
                href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold text-brand-700 transition hover:bg-brand-50"
              >
                <PhoneIcon />
                Call
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Straight-line distance (haversine), in km.
function distanceKm(from: { lat: number; lng: number }, lat: number, lng: number) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat - from.lat) * rad) / 2) ** 2 +
    Math.cos(from.lat * rad) * Math.cos(lat * rad) * Math.sin(((lng - from.lng) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function ScanIcon() {
  return (
    <svg {...icon} className="h-5 w-5">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg {...icon} className="h-5 w-5">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...icon} className="h-4 w-4 shrink-0">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg {...icon} className="h-4 w-4 shrink-0">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}
