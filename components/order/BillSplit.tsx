"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { BillShare, TableBill } from "@/lib/guest-order";
import HomeButton from "./HomeButton";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";

const sym = currencySymbol("MYR");
const money = (n: number) => `${sym}${Number(n).toFixed(2)}`;
type Mode = BillShare["mode"];

// Pay or split the table's open bill: all of what's left, an equal share, or
// the items you had. The server sets the amount; this only previews it. Every
// phone at the table refreshes, so everyone sees what's paid and what's left.
export default function BillSplit({ token, canPay }: { token: string; canPay: boolean }) {
  const [supabase] = useState(() => createClient());
  const [bill, setBill] = useState<TableBill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("equal");
  const [of, setOfState] = useState(2);
  // Join the table's split: once someone paid 1 of 4, the next phone starts at 4.
  const ofTouched = useRef(false);
  const setOf = (f: (n: number) => number) => {
    ofTouched.current = true;
    setOfState(f);
  };
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);
  const [arrival, setArrival] = useState<"paid" | "unpaid" | null>(null);

  const load = useCallback(
    () =>
      supabase.rpc("guest_table_bill", { p_token: token }).then(({ data, error }) => {
        if (error) setError(error.message);
        else setBill(data as TableBill);
      }),
    [supabase, token]
  );

  useEffect(() => {
    load();
    supabase
      .from("members")
      .select("id")
      .maybeSingle()
      .then(({ data }) => setSignedIn(!!data));
    const q = new URLSearchParams(window.location.search).get("paid");
    if (q) {
      setArrival(q === "1" ? "paid" : "unpaid");
      history.replaceState(history.state, "", window.location.pathname);
    }
    const t = window.setInterval(load, 5000);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [supabase, load]);

  // Items someone else just paid for drop out of my selection.
  useEffect(() => {
    if (!bill?.open) return;
    const split = [...bill.payments].reverse().find((p) => p.share.mode === "equal")?.share;
    if (split?.mode === "equal" && !ofTouched.current) setOfState(split.of);
    setPicked((s) => new Set(Array.from(s).filter((id) => bill.items.some((i) => i.id === id && !i.paid))));
  }, [bill]);

  const back = `/order/t/${token}`;
  if (error || !bill) {
    return (
      <Shell back={back} title="Bill">
        {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <div className="h-64 animate-pulse rounded-3xl bg-white" />}
      </Shell>
    );
  }
  if (!bill.open) {
    return (
      <Shell back={back} title={`Table ${bill.table}`}>
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-ink-900">{arrival === "paid" ? "All paid. Thank you!" : "No open bill at this table"}</h2>
          <p className="mt-2 text-sm text-ink-500">
            {arrival === "paid" ? "Your payment closed the bill. Enjoy the rest of your day." : "Once you've ordered, your bill shows up here."}
          </p>
        </div>
      </Shell>
    );
  }

  const left = Math.max(0, bill.remaining - bill.held);
  const ratio = bill.subtotal > 0 ? bill.total / bill.subtotal : 1;
  const amount = Math.min(
    left,
    mode === "all"
      ? left
      : mode === "equal"
        ? Math.ceil((bill.total * 100) / of) / 100
        : Math.round(bill.items.filter((i) => picked.has(i.id)).reduce((n, i) => n + Number(i.line_total), 0) * ratio * 100) / 100
  );
  const equalPaid = bill.payments.filter((p) => p.share.mode === "equal" && p.share.of === of).length;
  const pct = bill.total > 0 ? Math.min(100, (bill.paid / bill.total) * 100) : 0;
  const share: BillShare = mode === "equal" ? { mode, of } : mode === "items" ? { mode, items: Array.from(picked) } : { mode };

  async function pay() {
    setPaying(true);
    setError(null);
    const { data, error } = await supabase.rpc("wallet_bill_pay_start", { p_token: token, p_share: share });
    if (error) {
      setPaying(false);
      setError(error.message);
      return load();
    }
    const res = await fetch("/api/pay/bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: (data as { id: string }).id, token }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.url) return window.location.assign(body.url);
    setPaying(false);
    if (body.paid) load();
    else setError(body.error ?? "Couldn't open payment. Please try again.");
  }

  return (
    <Shell back={back} title="Your bill" pad>
      <AnimatePresence>
        {arrival && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              arrival === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {arrival === "paid"
              ? "Payment received. Points for your share are in your account."
              : "The payment wasn't completed. Nothing was charged."}
          </motion.p>
        )}
      </AnimatePresence>

      {/* The bill, as the pad has it */}
      <Chit
        band={
          <div className="flex items-baseline justify-between gap-3">
            <PadLabel>Bill · Table {bill.table}</PadLabel>
            <span className="text-xs tabular-nums text-ink-700">of {money(bill.total)}</span>
          </div>
        }
      >
        <div className="px-4 pb-4 pt-4">
          <div className="flex items-end justify-between gap-3">
            <span className="text-sm font-semibold text-ink-600">Left to pay</span>
            {bill.remaining <= 0 ? (
              <Stamp thump>Paid</Stamp>
            ) : (
              <span className="pad text-[2.5rem] font-extrabold leading-none text-ink-900">{money(bill.remaining)}</span>
            )}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-rule" aria-hidden="true">
            <motion.div className="h-full rounded-full bg-brand-600" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
          </div>
          {bill.held > 0 && <p className="mt-3 text-xs font-semibold text-amber-700">Someone is paying {money(bill.held)} right now…</p>}
        </div>
        {bill.payments.length > 0 && (
          <ul className="ruled total-rule mx-4">
            {bill.payments.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 text-ink-700">
                  <span className="font-bold text-ink-900">{p.mine ? "You" : "Someone"}</span>{" "}
                  {p.share.mode === "equal" ? `· 1 of ${p.share.of} shares` : p.share.mode === "items" ? "· their items" : "· the rest"}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="pad font-bold text-ink-900">{money(p.amount)}</span>
                  <Stamp className="!text-[0.625rem]">Paid</Stamp>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Chit>

      {bill.remaining > 0 && (
        <>
          {/* How to pay */}
          <div role="radiogroup" aria-label="How to pay" className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
            {(
              [
                ["equal", "Split equally"],
                ["items", "My items"],
                ["all", "Pay all"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`relative h-10 rounded-lg text-sm font-bold transition ${mode === m ? "text-ink-900" : "text-ink-500"}`}
              >
                {mode === m && (
                  <motion.span layoutId="bill-mode" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {mode === "equal" && (
            <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">How many people?</span>
                <span className="flex items-center gap-3">
                  <Step label="Fewer people" onClick={() => setOf((n) => Math.max(2, n - 1))} disabled={of <= 2}>
                    −
                  </Step>
                  <span className="pad w-7 text-center text-2xl font-extrabold text-ink-900" aria-live="polite">
                    {of}
                  </span>
                  <Step label="More people" onClick={() => setOf((n) => Math.min(20, n + 1))} disabled={of >= 20}>
                    +
                  </Step>
                </span>
              </div>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {Array.from({ length: of }, (_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded-sm ${i < equalPaid ? "bg-brand-600" : "bg-paper-rule"}`} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-500">
                {equalPaid > 0 ? `${equalPaid} of ${of} shares paid. ` : ""}Each share is {money(Math.ceil((bill.total * 100) / of) / 100)}.
              </p>
            </section>
          )}

          {mode === "items" && (
            <ul className="ruled mt-4 overflow-hidden rounded-xl bg-white shadow-sm">
              {bill.items.map((i) => {
                const on = picked.has(i.id);
                return (
                  <li key={i.id}>
                    <label className={`flex items-center gap-3 px-4 py-3.5 ${i.paid ? "opacity-50" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={on || i.paid}
                        disabled={i.paid}
                        onChange={() =>
                          setPicked((s) => {
                            const n = new Set(s);
                            if (n.has(i.id)) n.delete(i.id);
                            else n.add(i.id);
                            return n;
                          })
                        }
                        className="h-5 w-5 shrink-0 accent-[rgb(var(--brand-600))]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-900">
                          {i.quantity} × {i.name}
                        </span>
                        {i.options && <span className="block truncate text-xs text-ink-500">{i.options}</span>}
                      </span>
                      {i.paid ? <Stamp className="!text-[0.625rem]">Paid</Stamp> : <span className="pad shrink-0 text-sm font-bold text-ink-900">{money(i.line_total)}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {mode === "items" && ratio !== 1 && (
            <p className="mt-2 px-1 text-xs text-ink-500">Includes your part of the service charge, tax and rounding.</p>
          )}
        </>
      )}

      {/* The whole bill */}
      <details className="group mt-6 rounded-xl bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-ink-900">
          Full bill · {bill.items.length} item{bill.items.length === 1 ? "" : "s"}
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-400 transition group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </summary>
        <div className="space-y-1.5 px-5 pb-5 text-sm">
          {mode !== "items" &&
            bill.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 text-ink-700">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span className="tabular-nums">{money(i.line_total)}</span>
              </div>
            ))}
          <div className={`space-y-1 ${mode !== "items" ? "mt-3 border-t border-ink-100 pt-3" : ""} text-ink-500`}>
            <Row label="Subtotal" n={bill.subtotal} />
            {bill.discount > 0 && <Row label="Discount" n={-bill.discount} />}
            {bill.service_charge > 0 && <Row label="Service charge" n={bill.service_charge} />}
            {bill.sst > 0 && <Row label="SST" n={bill.sst} />}
            {bill.rounding !== 0 && <Row label="Rounding" n={bill.rounding} />}
            <div className="total-rule mt-2 flex justify-between pt-2 font-bold text-ink-900">
              <span>Total</span>
              <span className="tabular-nums">{money(bill.total)}</span>
            </div>
          </div>
        </div>
      </details>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Pay, within thumb reach */}
      {bill.remaining > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-ink-50/90 backdrop-blur-md">
          <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {!canPay ? (
              <p className="py-3 text-center text-sm font-semibold text-ink-700">Please pay at the counter. Ask for the bill on the table page.</p>
            ) : signedIn === false ? (
              <Link
                href={`/login?redirect=${encodeURIComponent(`${back}/bill`)}`}
                className="flex w-full items-center justify-between rounded-xl bg-brand-600 px-5 py-4 text-base font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
              >
                <span>Sign in to pay</span>
                <span className="pad">{money(amount)}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={pay}
                disabled={paying || amount <= 0 || signedIn === null}
                className="flex w-full items-center justify-between rounded-xl bg-brand-600 px-5 py-4 text-base font-bold text-on transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
              >
                <span>
                  {paying
                    ? "Opening payment…"
                    : amount <= 0
                      ? mode === "items"
                        ? "Tick what you had"
                        : "Someone is paying the rest"
                      : "Pay · earn points"}
                </span>
                {amount > 0 && <span className="pad">{money(amount)}</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ back, title, pad, children }: { back: string; title: string; pad?: boolean; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-ink-50">
      <div className={`mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] ${pad ? "pb-[calc(7rem+env(safe-area-inset-bottom))]" : "pb-12"}`}>
        <div className="mb-5 flex items-center gap-3">
          <HomeButton href={back} />
          <h1 className="pad text-xl font-extrabold text-ink-900">{title}</h1>
        </div>
        {children}
      </div>
    </main>
  );
}

function Row({ label, n }: { label: string; n: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="tabular-nums">{money(n)}</span>
    </div>
  );
}

function Step({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-xl font-bold text-ink-900 transition active:scale-90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
