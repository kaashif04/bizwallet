"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSheet } from "./useSheet";
import { createClient } from "@/lib/supabase/client";
import { pickupSlots } from "@/lib/guest-order";

import { clock, dayKey, dayName, fmt, DayTabs, TimeGrid } from "./TimePicker";

export const pickupLabel = (iso: string) => `${fmt(iso, { weekday: "short", day: "numeric", month: "short" })}, ${clock(iso)}`;

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
  const title = closed ? "Schedule pickup" : "Pickup time";
  // The one big choice at the top: as soon as possible, or (closed now) the earliest time there is.
  const quick = closed
    ? { on: value === slots[0], label: "Earliest", hint: `${dayName(slots[0])}, ${clock(slots[0])}`, pick: slots[0] }
    : { on: value === null, label: "As soon as possible", hint: prepMinutes ? `about ${prepMinutes} min` : "", pick: null };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-sheet bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex items-center gap-3">
          <h2 className="flex-1 text-xl font-semibold text-ink-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-700 active:scale-90">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onPick(quick.pick)}
          aria-pressed={quick.on}
          className={`mt-4 flex min-h-[3.25rem] w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.99] ${quick.on ? "bg-accent-600 text-on shadow-sm" : "bg-ink-50 text-ink-900 shadow-well"}`}
        >
          <span className="text-[15px] font-bold">{quick.label}</span>
          {quick.hint ? <span className="text-sm font-medium tabular-nums opacity-80">{quick.hint}</span> : null}
        </button>
        {closed && <p className="mt-2 px-1 text-xs text-ink-500">We&apos;re closed now. It&apos;ll be ready at the time you pick.</p>}

        {days.length > 1 && (
          <div className="mt-4">
            <DayTabs id="pickup" days={days.map((d) => ({ key: d, label: dayName(slots.find((s) => dayKey(s) === d)!) }))} value={day} onPick={setDay} />
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-1">
          <TimeGrid key={day} times={times} value={value} onPick={onPick} />
        </div>
      </motion.div>
    </>
  );
}
