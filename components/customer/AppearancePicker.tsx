"use client";

import { useEffect, useState } from "react";

type Theme = "auto" | "light" | "dark";
const OPTIONS: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Saved on this device only; the inline script in app/layout.tsx applies it
// before paint. Auto follows the phone's setting.
export default function AppearancePicker() {
  const [theme, setTheme] = useState<Theme>("auto");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    const root = document.documentElement;
    if (t === "auto") delete root.dataset.theme;
    else root.dataset.theme = t;
    try {
      if (t === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {}
  };

  return (
    <div className="rounded-2xl bg-white p-4">
      <p id="appearance-label" className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        Appearance
      </p>
      <div role="radiogroup" aria-labelledby="appearance-label" className="mt-3 flex rounded-full bg-ink-50 p-1 shadow-pressed">
        {OPTIONS.map((o) => {
          const on = o.value === theme;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(o.value)}
              className={`h-10 flex-1 rounded-full text-sm font-bold transition ${
                on ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
