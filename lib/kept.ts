"use client";

import { useEffect, useState } from "react";

// Last value per key, kept in memory across page switches, so a tab you come back
// to shows what it had at once and refreshes quietly instead of flashing a skeleton.
// Written only in effects, so the server never fills it (no data shared between visitors).
export const kept = new Map<string, unknown>();

export function useKept<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => (kept.has(key) ? (kept.get(key) as T) : initial));
  useEffect(() => {
    kept.set(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
