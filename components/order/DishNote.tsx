"use client";

import { useState } from "react";

// A note for the kitchen on one dish ("no chilli"), the way Grab and Uber Eats do it:
// "Add a note" (or the note itself) until tapped, then a one-line field. Used in the dish sheet and the cart.
export default function DishNote({ value, onChange, name, className = "" }: { value: string; onChange: (v: string) => void; name: string; className?: string }) {
  const [editing, setEditing] = useState(false);
  if (!editing)
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={value ? `Note for ${name}: ${value}. Tap to change` : undefined}
        className={`flex h-11 max-w-full items-center gap-1.5 text-left text-sm transition active:opacity-60 ${value ? "text-ink-600" : "font-semibold text-accent-700"} ${className}`}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
        </svg>
        <span className="truncate">{value.trim() || "Add a note"}</span>
      </button>
    );
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      autoFocus
      maxLength={60}
      enterKeyHint="done"
      placeholder="e.g. No chilli, less oil"
      aria-label={`Note for the kitchen on ${name}`}
      className={`h-11 w-full rounded-xl bg-ink-50 px-3.5 text-base text-ink-900 shadow-well outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-accent-500 ${className}`}
    />
  );
}
