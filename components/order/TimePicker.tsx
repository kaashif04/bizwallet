"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// The pieces every "when" picker shares (pickup time, table booking), so a chosen day,
// time or party size looks the same everywhere: jade fill = your pick.

const KL = "Asia/Kuala_Lumpur";
export const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-MY", { timeZone: KL, ...o }).format(new Date(iso));
export const dayKey = (iso: string) => fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
export const clock = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, "").toLowerCase();
// "10:30", no am/pm: the group label carries it.
const hm = (iso: string) => clock(iso).replace(/[ap]m$/, "");
export const dayName = (iso: string) => {
  const d = dayKey(iso);
  if (d === dayKey(new Date().toISOString())) return "Today";
  if (d === dayKey(new Date(Date.now() + 864e5).toISOString())) return "Tomorrow";
  return fmt(iso, { weekday: "short", day: "numeric", month: "short" });
};
const PERIODS = ["Morning", "Afternoon", "Evening"] as const;
const period = (iso: string) => {
  const h = Number(fmt(iso, { hour: "numeric", hourCycle: "h23" }));
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
};

// One chip style for every pick. `page`: on the ivory page; otherwise inside a white sheet/card.
export const chip = (on: boolean, page = false) =>
  `min-h-11 rounded-xl px-2 text-sm font-semibold tabular-nums transition active:scale-[0.97] ${
    on ? "bg-accent-600 text-on shadow-sm" : page ? "bg-white text-ink-800 shadow-sm" : "bg-ink-50 text-ink-800 shadow-well"
  }`;

// Days as underline tabs (like the menu's), so they read as "which day", not as another pick.
export function DayTabs({ days, value, onPick, id }: { days: { key: string; label: string }[]; value: string; onPick: (key: string) => void; id: string }) {
  return (
    <div className="-mx-5 flex overflow-x-auto border-b border-ink-200 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d) => (
        <button
          key={d.key}
          type="button"
          aria-pressed={d.key === value}
          onClick={() => onPick(d.key)}
          ref={(el) => {
            if (el && d.key === value) el.scrollIntoView({ inline: "nearest", block: "nearest" });
          }}
          className={`relative min-h-11 shrink-0 whitespace-nowrap px-3 pb-2.5 pt-1 text-[0.9375rem] font-bold transition-colors ${
            d.key === value ? "text-ink-900" : "text-ink-500 hover:text-ink-700"
          }`}
        >
          {d.label}
          {d.key === value && (
            <motion.span layoutId={`${id}-day-bar`} className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-accent-600" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
          )}
        </button>
      ))}
    </div>
  );
}

// A day's times grouped Morning / Afternoon / Evening ("Afternoon · 12:00–4:30pm").
// A long day opens only the group with the pick in it; the others are one row each.
export function TimeGrid({ times, value, onPick, page = false }: { times: string[]; value: string | null; onPick: (iso: string) => void; page?: boolean }) {
  const groups = PERIODS.map((p) => ({ p, list: times.filter((t) => period(t) === p) })).filter((g) => g.list.length);
  const start = period(value && times.includes(value) ? value : times[0] ?? "");
  const [opened, setOpened] = useState<string[]>([start]);
  const fold = times.length > 12;

  return (
    <div className="space-y-3">
      {groups.map(({ p, list }) => {
        const range = `${hm(list[0])}–${clock(list[list.length - 1])}`;
        const open = !fold || opened.includes(p) || (value !== null && list.includes(value));
        if (!open)
          return (
            <button
              key={p}
              type="button"
              onClick={() => setOpened((o) => [...o, p])}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-4 text-left text-sm transition active:scale-[0.99] ${page ? "bg-white shadow-sm" : "bg-ink-50 shadow-well"}`}
            >
              <span>
                <span className="font-bold text-ink-900">{p}</span>
                <span className="text-ink-500"> · {range}</span>
              </span>
              <span aria-hidden="true" className="text-ink-400">›</span>
            </button>
          );
        return (
          <div key={p}>
            {groups.length > 1 && (
              <p className="mb-2 px-1 text-xs font-semibold text-ink-500">
                <span className="text-ink-800">{p}</span> · {range}
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {list.map((t) => (
                <button key={t} type="button" aria-pressed={t === value} aria-label={clock(t)} className={chip(t === value, page)} onClick={() => onPick(t)}>
                  {groups.length > 1 ? hm(t) : clock(t)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
