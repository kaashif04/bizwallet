"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const KL = "Asia/Kuala_Lumpur";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-MY", { timeZone: KL, ...o }).format(new Date(iso));
const dayKey = (iso: string) => fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
export const pickupLabel = (iso: string) =>
  `${fmt(iso, { weekday: "short", day: "numeric", month: "short" })}, ${fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true })}`;

// "Now / Later" for pickup. Only shows when the outlet takes orders ahead (BizPos returns
// no slots otherwise). `value` is the chosen slot (ISO), null = as soon as possible.
export default function PickupTime({
  outletId,
  value,
  onChange,
  refresh,
}: {
  outletId: string;
  value: string | null;
  onChange: (slot: string | null) => void;
  refresh?: number; // bump to reload the slots (a taken slot after a failed order)
}) {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    // ponytail: a week of days in parallel (the server returns nothing past the outlet's limit); one call if it grows.
    const start = Date.now();
    const dates = Array.from({ length: 7 }, (_, i) => new Date(start + i * 86_400_000).toLocaleDateString("en-CA", { timeZone: KL }));
    Promise.all(dates.map((d) => supabase.rpc("guest_pickup_slots", { p_outlet: outletId, p_date: d }))).then((rs) => {
      const all = rs.flatMap((r) => ((r.data ?? []) as { slot: string }[]).map((x) => x.slot));
      setSlots(all);
      if (value && !all.includes(value)) onChange(null); // gone or full: back to Now
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open and when asked to refresh
  }, [supabase, outletId, refresh]);

  const days = useMemo(() => Array.from(new Set(slots.map(dayKey))), [slots]);
  if (slots.length === 0) return null;

  // Later always has a time picked (the first one of the day), so value alone says Now or Later.
  const firstOf = (d: string) => slots.find((s) => dayKey(s) === d)!;
  const later = value !== null;
  const shownDay = value ? dayKey(value) : days[0];
  const chip = (on: boolean) =>
    `rounded-xl px-3 py-2 text-sm font-bold transition active:scale-[0.97] ${on ? "bg-brand-600 text-on shadow-sm" : "bg-ink-50 text-ink-800 shadow-well"}`;

  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Pickup time</legend>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={chip(!later)} onClick={() => onChange(null)}>
          Now
        </button>
        <button type="button" className={chip(later)} onClick={() => onChange(firstOf(shownDay))}>
          Later
        </button>
      </div>
      {later && (
        <>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => {
              return (
                <button key={d} type="button" className={`${chip(d === shownDay)} shrink-0`} onClick={() => onChange(firstOf(d))}>
                  {d === dayKey(new Date().toISOString()) ? "Today" : fmt(firstOf(d), { weekday: "short", day: "numeric", month: "short" })}
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid max-h-40 grid-cols-4 gap-2 overflow-y-auto">
            {slots.filter((s) => dayKey(s) === shownDay).map((s) => (
              <button key={s} type="button" className={chip(s === value)} onClick={() => onChange(s)}>
                {fmt(s, { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "")}
              </button>
            ))}
          </div>
        </>
      )}
    </fieldset>
  );
}
