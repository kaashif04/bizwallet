"use client";

import { useEffect, useState } from "react";

const KEY = "bizwallet.vegOnly";
// Fixed colours: the veg mark is a standard symbol, the same in light and dark.
const GREEN = "#008A62";

// The green-square-and-dot vegetarian mark.
export function VegMark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Vegetarian"
      title="Vegetarian"
      className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] bg-[#fff] align-[-2px] ${className}`}
      style={{ border: `1.5px solid ${GREEN}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
    </span>
  );
}

// "Vegetarian only", remembered on this phone (menu and restaurant page share it).
export function useVegOnly() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem(KEY) === "1");
    } catch {
      // Blocked storage: the switch still works for this visit.
    }
  }, []);
  const set = (v: boolean) => {
    setOn(v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      // Same as above.
    }
  };
  return [on, set] as const;
}

export function VegToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-11 w-fit items-center gap-2.5 rounded-full bg-white pl-4 pr-1.5 text-sm font-semibold text-ink-800 shadow-sm transition active:scale-[0.97]"
    >
      <VegMark />
      Vegetarian only
      <span className={`relative ml-1 h-8 w-[3.25rem] rounded-full transition-colors ${on ? "bg-emerald-600" : "bg-ink-200"}`}>
        <span
          className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-on shadow-sm transition-transform ${on ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
