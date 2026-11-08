"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { tableOrders } from "@/lib/guest-order";

// The table QR never changes, so a phone that has left still has a working link.
// This phone remembers its party (BizPos table session); once that party is gone
// (paid and left, cleared, a new party sat down) the table's pages are swapped for
// "your visit has ended" until the diner says they're at this table again, so an
// old phone can't order onto, or see, the next party's bill (wallet_table_visit).
type Saved = { id: string | null; at: number }; // at: when saved, or when they started a new visit
const key = (token: string) => `bw_visit:${token}`;
const DAY = 12 * 3_600_000; // older than this is a new day's visit, not this one

function load(token: string): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(key(token)) ?? "null") as Saved | null;
    return s && Date.now() - s.at < DAY ? s : { id: null, at: 0 };
  } catch {
    return { id: null, at: 0 };
  }
}
function save(token: string, s: Saved) {
  try {
    localStorage.setItem(key(token), JSON.stringify(s));
  } catch {}
}

// Resolves true when this phone may order here. Pickup has no gate.
const Ctx = createContext<() => Promise<boolean>>(async () => true);
export const useVisitCheck = () => useContext(Ctx);

export default function TableVisit({ token, children }: { token: string; children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [ended, setEnded] = useState<string | null>(null); // the table's label once this phone's visit has ended

  const check = useCallback(async () => {
    const saved = load(token);
    // Orders from before "I'm at this table again" belong to the old visit.
    const order = tableOrders(token).filter((o) => o.at > saved.at).pop();
    const { data, error } = await supabase.rpc("wallet_table_visit", {
      p_token: token,
      p_visit: saved.id,
      p_order: order?.id ?? null,
    });
    if (error || !data) return true; // bad token etc.: the page shows its own error
    const v = data as { table: string; visit: string | null; ended: boolean };
    if (v.ended) {
      setEnded(v.table);
      return false;
    }
    if (v.visit && v.visit !== saved.id) save(token, { id: v.visit, at: Date.now() });
    return true;
  }, [supabase, token]);

  useEffect(() => {
    check();
    const onShow = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [check]);

  if (ended !== null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-ink-50 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">Thanks for visiting</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-600">
          Your visit at Table {ended} has ended, so this phone can&apos;t order to it or see its bill any more.
        </p>
        <button
          type="button"
          onClick={() => {
            save(token, { id: null, at: Date.now() });
            setEnded(null);
          }}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-on shadow-sm transition active:scale-95"
        >
          I&apos;m at Table {ended} now
        </button>
      </main>
    );
  }
  return <Ctx.Provider value={check}>{children}</Ctx.Provider>;
}
