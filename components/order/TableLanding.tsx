"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { outletLogos, type TableHome, type PickupOutlet } from "@/lib/guest-order";
import { rememberPlace } from "@/lib/place";
import BranchLogo from "./BranchLogo";

const ICON = {
  order: "M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2",
  takeaway: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01",
  play: "M5 19h14M7 15h10M9 11h6M11 7h2",
  staff: "M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6ZM10 19a2 2 0 0 0 4 0",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  review: "M10 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L5.5 16.8l.9-5L2.8 8.3l5-.7L10 3Z",
  more: "M4 7h16M4 12h16M4 17h16",
};

const tile =
  "flex flex-col items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-ink-100 active:scale-[0.97]";

function Icon({ d, className = "h-6 w-6 text-brand-700" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Label({ title, hint }: { title: string; hint: string }) {
  return (
    <span>
      <span className="block text-sm font-bold text-ink-900">{title}</span>
      <span className="block text-xs text-ink-500">{hint}</span>
    </span>
  );
}

// Where the table QR lands: one big button per thing a diner might want, so
// nobody has to notice the bar at the bottom. Everything here is a shortcut
// to a page that already exists (the bottom bar takes over from there).
export default function TableLanding({ token, pickupPaid }: { token: string; pickupPaid: boolean }) {
  const [supabase] = useState(() => createClient());
  const [home, setHome] = useState<TableHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [takeaway, setTakeaway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      supabase.rpc("guest_table_home", { p_token: token }).then(({ data, error }) => {
        if (error) setError(error.message);
        else setHome(data as TableHome);
        return data as TableHome | null;
      }),
    [supabase, token]
  );

  useEffect(() => {
    load().then((h) => {
      if (!h) return;
      rememberPlace(h.outlet.id);
      outletLogos(supabase).then((l) => setLogo(l[h.outlet.id] ?? null));
      if (pickupPaid)
        supabase.rpc("guest_store", { p_outlet: h.outlet.id }).then(({ data }) => setTakeaway(!!(data as PickupOutlet | null)?.pickup));
    });
  }, [supabase, load, pickupPaid]);

  if (error)
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">This QR code doesn&apos;t work</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-600">{error} Please ask our staff for help.</p>
      </main>
    );

  if (!home)
    return (
      <main className="mx-auto max-w-md space-y-3 px-4 pt-24" aria-busy="true" aria-label="Loading">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-ink-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </main>
    );

  const base = `/order/t/${token}`;
  const waiter = home.calls.find((c) => c.kind === "staff");

  async function callWaiter() {
    setBusy(true);
    setCallError(null);
    const { error } = await supabase.rpc("guest_call_staff", { p_token: token, p_kind: "staff" });
    setBusy(false);
    if (error) return setCallError(error.message);
    load();
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8">
        <header className="flex items-center gap-4">
          <BranchLogo name={home.outlet.name} logoUrl={logo} className="h-16 w-16 shrink-0 rounded-[1.25rem] text-2xl shadow-md" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Table {home.table.label}</p>
            <h1 className="truncate text-[1.6rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">{home.outlet.name}</h1>
          </div>
        </header>
        <p className="mt-4 text-base text-ink-600">What would you like to do?</p>

        <div className="mt-4 space-y-3">
          {home.ordering ? (
            <Link href={`${base}/menu`} className="flex h-20 items-center gap-4 rounded-2xl bg-brand-600 px-5 text-on shadow-md transition hover:brightness-95 active:scale-[0.98]">
              <Icon d={ICON.order} className="h-8 w-8" />
              <span>
                <span className="block text-lg font-bold">Order now</span>
                <span className="block text-sm opacity-90">Eat here, we&apos;ll bring it to your table</span>
              </span>
            </Link>
          ) : (
            <p className="rounded-2xl bg-white py-4 text-center text-sm font-semibold text-ink-700 shadow-sm">Please order with our staff today</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {takeaway && (
              <Link href={`/order/p/${home.outlet.id}`} className={tile}>
                <Icon d={ICON.takeaway} />
                <Label title="Takeaway" hint="Order ahead, pay online" />
              </Link>
            )}
            <Link href={`${base}/play`} className={tile}>
              <Icon d={ICON.play} />
              <Label title="Play games" hint="While you wait" />
            </Link>
            {!home.hide?.staff && (
              <button type="button" disabled={busy} onClick={callWaiter} aria-live="polite" className={`${tile} ${waiter ? "!bg-brand-50 ring-1 ring-brand-200" : ""}`}>
                <Icon d={ICON.staff} />
                <Label title="Call waiter" hint={busy ? "Sending…" : waiter ? "Staff notified" : "We'll come over"} />
              </button>
            )}
            <Link href={`${base}/bill`} className={tile}>
              <Icon d={ICON.bill} />
              <Label title="Bill" hint="See it, pay or split" />
            </Link>
            {(!home.hide?.feedback || home.review_url) && (
              <Link href={`${base}/table`} className={tile}>
                <Icon d={ICON.review} />
                <Label title="Review us" hint="Tell us how it was" />
              </Link>
            )}
            <Link href={`${base}/table`} className={`${tile} last:odd:col-span-2`}>
              <Icon d={ICON.more} />
              <Label title="Wi-Fi & more" hint="Points, your orders" />
            </Link>
          </div>
          {callError && <p className="px-1 text-sm text-rose-700">{callError}</p>}
        </div>
      </main>
    </div>
  );
}
