"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { tableOrders } from "@/lib/guest-order";
import { Mascot } from "@/components/Mascot";

// Scanning the table's QR starts a visit; nothing else does. A reopened tab,
// a reload, the back button or a link inside the app carries on the visit this
// phone already has, and once that party has gone (paid and left, cleared, a new
// party sat down) the table's pages are replaced by "scan the QR code on your
// table" (wallet_table_visit). Same idea as QR systems that end the table's
// session at payment, without reprinting the codes.
type Pass = { id: string | null; at: number }; // id: the party (table session) once known; at: when scanned
const key = (token: string) => `bw_visit:${token}`;
const MAX_AGE = 12 * 3_600_000; // a scan this old is never still the same visit
const UNSEATED = 3 * 3_600_000; // scanned, but no party ever formed at the table: ends after this

function load(token: string): Pass | null {
  try {
    const p = JSON.parse(localStorage.getItem(key(token)) ?? "null") as Pass | null;
    return p && Date.now() - p.at < MAX_AGE ? p : null;
  } catch {
    return null;
  }
}
function save(token: string, p: Pass) {
  try {
    localStorage.setItem(key(token), JSON.stringify(p));
  } catch {}
}

// Our own scanner (/scan) opens the table inside the app, so it starts the visit itself.
export function startVisit(path: string) {
  const token = /^\/order\/t\/([^/?#]+)\/?$/.exec(path)?.[1];
  if (token) save(token, { id: null, at: Date.now() });
}

// A phone camera scan opens the table's address as a brand-new page load from
// outside the app. Checked once per page load, so moving around inside the app
// (or coming back from the order page) never counts as a scan.
let landingChecked = false;
function arrivedByScan(token: string) {
  if (landingChecked) return false;
  landingChecked = true;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav || nav.type !== "navigate") return false; // reload, back/forward, restored tab
  if (document.referrer.startsWith(location.origin)) return false; // a link inside the app
  return new URL(nav.name).pathname.replace(/\/$/, "") === `/order/t/${token}`;
}

// Resolves true when this phone may order here. Pickup has no gate.
const Ctx = createContext<() => Promise<boolean>>(async () => true);
export const useVisitCheck = () => useContext(Ctx);

type Ended = { table: string | null; hadVisit: boolean };

export default function TableVisit({ token, children }: { token: string; children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [ended, setEnded] = useState<Ended | null>(null);

  const check = useCallback(async () => {
    const pass = load(token);
    if (!pass) setEnded((e) => e ?? { table: null, hadVisit: false }); // show it at once; the label follows
    // Orders from before this scan belong to an earlier visit.
    const order = pass ? tableOrders(token).filter((o) => o.at >= pass.at).pop() : undefined;
    const { data, error } = await supabase.rpc("wallet_table_visit", {
      p_token: token,
      p_visit: pass?.id ?? null,
      p_order: order?.id ?? null,
      p_since: pass ? new Date(pass.at).toISOString() : null,
    });
    if (error || !data) {
      if (pass) return true; // bad token or offline: the page shows its own error
      setEnded(null);
      return true;
    }
    const v = data as { table: string; visit: string | null; ended: boolean };
    if (!pass || v.ended || (!pass.id && !v.visit && Date.now() - pass.at > UNSEATED)) {
      setEnded({ table: v.table, hadVisit: !!pass });
      return false;
    }
    if (v.visit && v.visit !== pass.id) save(token, { id: v.visit, at: pass.at });
    setEnded(null);
    return true;
  }, [supabase, token]);

  useEffect(() => {
    if (arrivedByScan(token)) save(token, { id: null, at: Date.now() });
    check();
    const onShow = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onShow);
    // Ties this phone to its party as soon as one forms (staff seat them or someone orders).
    const t = window.setInterval(onShow, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.clearInterval(t);
    };
  }, [check, token]);

  // Back from paying the bill online: show them it's paid, even if that just closed the table.
  // Read once: the bill page strips ?paid= from the address straight away.
  const [paidReturn] = useState(() => typeof window !== "undefined" && location.pathname.endsWith("/bill") && location.search.includes("paid="));
  if (ended && !paidReturn) {
    const at = ended.table ? `Table ${ended.table}` : "your table";
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-ink-50 px-6 text-center">
        <Mascot pose={ended.hadVisit ? "bye" : "scan"} className="mb-2 h-40 w-40" />
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          {ended.hadVisit ? "Thanks for visiting" : "Scan to order"}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-ink-600">
          {ended.hadVisit ? `Your visit at ${at} has ended. ` : ""}
          To order, scan the QR code on {ended.table ? `Table ${ended.table}` : "your table"} with your phone camera.
        </p>
        <Link
          href={`/scan${ended.table ? `?at=${encodeURIComponent(`Table ${ended.table}`)}` : ""}`}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-bold text-on shadow-sm transition active:scale-95"
        >
          Scan QR code
        </Link>
      </main>
    );
  }
  return <Ctx.Provider value={check}>{children}</Ctx.Provider>;
}
