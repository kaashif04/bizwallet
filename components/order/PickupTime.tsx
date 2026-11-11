"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSheet } from "./useSheet";
import { createClient } from "@/lib/supabase/client";
import { pickupSlots } from "@/lib/guest-order";

const KL = "Asia/Kuala_Lumpur";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-MY", { timeZone: KL, ...o }).format(new Date(iso));
const dayKey = (iso: string) => fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
export const pickupLabel = (iso: string) =>
  `${fmt(iso, { weekday: "short", day: "numeric", month: "short" })}, ${fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true })}`;

const clock = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "");
const today = () => dayKey(new Date().toISOString());
const dayName = (iso: string) => {
  const d = dayKey(iso);
  if (d === today()) return "Today";
  if (d === dayKey(new Date(Date.now() + 864e5).toISOString())) return "Tomorrow";
  return fmt(iso, { weekday: "short", day: "numeric", month: "short" });
};
const period = (iso: string) => {
  const h = Number(fmt(iso, { hour: "numeric", hour12: false }));
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
};

// Pickup time, as one quiet row in the checkout ("Now", or "Today, 1:30pm") that opens a
// sheet to change it. Only shows when the outlet takes orders ahead (BizPos returns no slots
// otherwise). `value` is the chosen slot (ISO), null = as soon as possible.
// Closed now: no "Now", a time is always picked (the first one to start with).
export default function PickupTime({
  outletId,
  value,
  onChange,
  refresh,
  closed,
  prepMinutes,
}: {
  outletId: string;
  value: string | null;
  onChange: (slot: string | null) => void;
  refresh?: number; // bump to reload the slots (a taken slot after a failed order)
  closed?: boolean; // the branch is closed now, so only later times
  prepMinutes?: number | null; // shown on Now: "ready in about 20 min"
}) {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    pickupSlots(supabase, outletId).then((all) => {
      setSlots(all);
      // Gone or full: back to Now, or (closed now) the first time there is.
      if (closed ? !value || !all.includes(value) : value && !all.includes(value)) onChange(closed ? all[0] ?? null : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open and when asked to refresh
  }, [supabase, outletId, refresh, closed]);

  if (slots.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-ink-50 px-4 py-3 text-left shadow-well transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-ink-500">Pickup time</span>
          <span className="block truncate text-[15px] font-bold text-ink-900">
            {value ? `${dayName(value)}, ${clock(value)}` : "As soon as possible"}
          </span>
          {!value && prepMinutes ? <span className="block text-xs text-ink-500">Ready in about {prepMinutes} min</span> : null}
        </span>
        <span className="text-sm font-bold text-brand-700">Change</span>
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <TimeSheet
              key="pickup-time"
              slots={slots}
              value={value}
              closed={!!closed}
              prepMinutes={prepMinutes}
              onPick={(s) => {
                onChange(s);
                setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function TimeSheet({
  slots,
  value,
  closed,
  prepMinutes,
  onPick,
  onClose,
}: {
  slots: string[];
  value: string | null;
  closed: boolean;
  prepMinutes?: number | null;
  onPick: (slot: string | null) => void;
  onClose: () => void;
}) {
  useSheet(onClose);
  const days = useMemo(() => Array.from(new Set(slots.map(dayKey))), [slots]);
  const [day, setDay] = useState(value ? dayKey(value) : days[0]);
  const times = slots.filter((s) => dayKey(s) === day);
  const periods = Array.from(new Set(times.map(period)));
  const pick = (on: boolean) =>
    `rounded-xl px-2 py-2.5 text-sm font-bold transition active:scale-[0.97] ${on ? "bg-accent-600 text-on shadow-sm" : "bg-ink-50 text-ink-800 shadow-well"}`;

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Pickup time"
        className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-sheet bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="flex-1 text-xl font-semibold text-ink-900">Pickup time</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-700 active:scale-90">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {closed ? (
          <p className="mt-2 text-sm text-ink-600">We&apos;re closed now. Choose when you&apos;ll pick it up.</p>
        ) : (
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-pressed={value === null}
            className={`mt-4 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99] ${value === null ? "bg-accent-600 text-on shadow-sm" : "bg-ink-50 text-ink-900 shadow-well"}`}
          >
            <span className="text-[15px] font-bold">As soon as possible</span>
            {prepMinutes ? <span className="text-xs font-medium opacity-80">about {prepMinutes} min</span> : null}
          </button>
        )}

        {days.length > 1 && (
          <div role="tablist" aria-label="Day" className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {days.map((d) => (
              <button key={d} type="button" role="tab" aria-selected={d === day} onClick={() => setDay(d)} className={`${pick(d === day)} shrink-0 px-4`}>
                {dayName(slots.find((s) => dayKey(s) === d)!)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pb-1">
          {periods.map((p) => (
            <div key={p}>
              {periods.length > 1 && <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">{p}</p>}
              <div className="grid grid-cols-3 gap-2 min-[360px]:grid-cols-4">
                {times.filter((s) => period(s) === p).map((s) => (
                  <button key={s} type="button" aria-pressed={s === value} className={pick(s === value)} onClick={() => onPick(s)}>
                    {clock(s)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
