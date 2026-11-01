"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import { tableOrders, type BillShare, type TableBill } from "@/lib/guest-order";
import HomeButton from "./HomeButton";

const sym = currencySymbol("MYR");
const money = (n: number) => `${sym}${Number(n).toFixed(2)}`;
// Money is worked in whole sen: 45.10 * 100 is 4510.000000000001 in floating point.
const sen = (n: number) => Math.round(Number(n) * 100);
type Mode = BillShare["mode"];

// The table's open bill. Everyone at the table sees everyone's orders and picks
// what to pay: their own items (or anyone else's), the rest, or, when more than
// one person ordered, an equal share. The server sets the amount; this only
// previews it. Every phone refreshes, so everyone sees what's paid and what's left.
export default function BillSplit({ token, canPay }: { token: string; canPay: boolean }) {
  const [supabase] = useState(() => createClient());
  const [bill, setBill] = useState<TableBill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [chosen, setMode] = useState<Mode>("items");
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
        <div className="rounded-3xl bg-white p-6 text-center">
          <h2 className="text-xl font-semibold text-ink-900">{arrival === "paid" ? "All paid. Thank you!" : "No open bill at this table"}</h2>
          <p className="mt-2 text-sm text-ink-500">
            {arrival === "paid" ? "Your payment closed the bill. Enjoy the rest of your day." : "Once you've ordered, your bill shows up here."}
          </p>
          {arrival !== "paid" && (
            <Link href={`${back}/menu`} className="mt-4 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-bold text-on transition active:scale-95">
              Start order
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  const left = Math.max(0, sen(bill.remaining) - sen(bill.held)) / 100;
  // People at the table: me (if I ordered) plus each other named diner or unnamed round.
  const myRounds = new Set(tableOrders(token).map((o) => o.id));
  const rounds = bill.rounds ?? [];
  const others = rounds.filter((r) => !r.mine && !myRounds.has(r.id));
  const people =
    new Set(others.filter((r) => r.who).map((r) => r.who!.toLowerCase())).size +
    others.filter((r) => !r.who).length +
    (rounds.length > others.length ? 1 : 0);
  // One person ordered: nothing to split, just pay. Equal shares need a table of 2 or more.
  const multi = people >= 2;
  const mode: Mode = multi ? chosen : "all";
  const of = Math.min(20, Math.max(2, people));
  // Shares round up to the outlet's step (RM0.05 at most outlets), like the bill itself.
  const step = Math.round((bill.rounding_step ?? 0) * 100);
  const up = (n: number) => (step > 0 ? Math.ceil(n / step) * step : Math.ceil(n));
  const shareSen = up(sen(bill.total) / of);
  const pickedSen = bill.items.filter((i) => picked.has(i.id)).reduce((n, i) => n + sen(i.line_total), 0);
  // Items carry their part of service charge, tax and rounding: x total / subtotal, as the server does.
  const itemsSen = up(sen(bill.subtotal) > 0 ? Math.round((pickedSen * sen(bill.total)) / sen(bill.subtotal) + 1e-9) : pickedSen);
  const amount = Math.min(left, (mode === "all" ? sen(left) : mode === "equal" ? shareSen : itemsSen) / 100);
  const tooSmall = amount > 0 && amount < 1 && amount < left;
  const equalPaid = bill.payments.filter((p) => p.share.mode === "equal" && p.share.of === of).length;
  const pct = bill.total > 0 ? Math.min(100, (bill.paid / bill.total) * 100) : 0;
  const share: BillShare = mode === "equal" ? { mode, of } : mode === "items" ? { mode, items: Array.from(picked) } : { mode };
  const ratio = sen(bill.subtotal) > 0 ? bill.total / bill.subtotal : 1;

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
    <Shell back={back} title={`Table ${bill.table}`} pad>
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

      {/* What's left */}
      <section className="rounded-3xl bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Left to pay</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-[-0.03em] text-ink-900">{money(bill.remaining)}</p>
        <p className="mt-1 text-sm text-ink-500">
          of {money(bill.total)}
          {bill.paid > 0 && ` · ${money(bill.paid)} paid in the app`}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
          <motion.div className="h-full rounded-full bg-marple" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        {bill.held > 0 && <p className="mt-3 text-xs font-semibold text-amber-700">Someone is paying {money(bill.held)} right now…</p>}
        {bill.payments.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-ink-100 pt-3 text-sm">
            {bill.payments.map((p, i) => (
              <li key={i} className="flex justify-between text-ink-600">
                <span>
                  {p.mine ? "You" : "Someone"} paid{" "}
                  {p.share.mode === "equal" ? `1 of ${p.share.of} shares` : p.share.mode === "items" ? "their items" : "the rest"}
                </span>
                <span className="tabular-nums">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {multi && (
        <section className="mt-4 rounded-3xl bg-white p-5">
          <h2 className="text-sm font-bold text-ink-900">Who ordered what</h2>
          <ul className="mt-3 space-y-3">
            {rounds.map((r, n) => (
              <li key={r.id}>
                <p className="text-xs font-semibold text-ink-500">
                  {r.mine || myRounds.has(r.id) ? "You" : r.who ?? `Diner ${n + 1}`}
                </p>
                <p className="mt-0.5 text-sm text-ink-800">
                  {r.items.map((it) => `${it.quantity} × ${it.name}`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">Pick your own items, or pay for someone else&apos;s. Whatever you pay is taken off the bill for everyone.</p>
        </section>
      )}

      {bill.remaining > 0 && (
        <>
          {/* How to pay */}
          {multi && (
          <div role="radiogroup" aria-label="How to pay" className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-ink-100 p-1">
            {(
              [
                ["items", "Pick items"],
                ["equal", "Split equally"],
                ["all", "Pay the rest"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`relative h-10 rounded-full text-sm font-bold transition ${mode === m ? "text-ink-900" : "text-ink-500"}`}
              >
                {mode === m && (
                  <motion.span layoutId="bill-mode" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          )}

          {mode === "equal" && (
            <section className="mt-4 rounded-3xl bg-white p-5">
              <p className="text-sm font-bold text-ink-900">Split between the {of} people who ordered</p>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {Array.from({ length: of }, (_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded-full ${i < equalPaid ? "bg-emerald-500" : "bg-ink-100"}`} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-500">
                {equalPaid > 0 ? `${equalPaid} of ${of} shares paid. ` : ""}Each share is {money(shareSen / 100)}.
              </p>
            </section>
          )}

          {mode === "items" && (
            <ul className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white">
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
                        className="h-5 w-5 shrink-0 accent-[#CA2851]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-900">
                          {i.quantity} × {i.name}
                        </span>
                        {i.options && <span className="block truncate text-xs text-ink-500">{i.options}</span>}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-ink-700">{i.paid ? "Paid" : money(i.line_total)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {mode === "items" && ratio !== 1 && (
            <p className="mt-2 px-1 text-xs text-ink-500">Includes their part of the service charge, tax and rounding.</p>
          )}
        </>
      )}

      {/* The whole bill */}
      <details className="group mt-6 rounded-3xl bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-ink-900">
          Full bill · {bill.items.length} item{bill.items.length === 1 ? "" : "s"}
          <span aria-hidden="true" className="text-ink-400 transition group-open:rotate-90">›</span>
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
            <div className="flex justify-between pt-1 font-bold text-ink-900">
              <span>Total</span>
              <span className="tabular-nums">{money(bill.total)}</span>
            </div>
          </div>
        </div>
      </details>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {/* Pay, within thumb reach */}
      {bill.remaining > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!canPay ? (
            <p className="rounded-full bg-white py-4 text-center text-sm font-semibold text-ink-700 shadow-lg">
              Please pay at the counter. Tap Ask for the bill on the table page.
            </p>
          ) : signedIn === false ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(`${back}/bill`)}`}
              className="flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:bg-brand-700 active:scale-[0.97]"
            >
              Sign in to pay {money(amount)}
            </Link>
          ) : (
            <button
              type="button"
              onClick={pay}
              disabled={paying || amount <= 0 || tooSmall || signedIn === null}
              className="h-14 w-full rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50"
            >
              {paying
                ? "Opening payment…"
                : amount <= 0
                  ? mode === "items"
                    ? "Tick what you had"
                    : "Someone is paying the rest"
                  : tooSmall
                    ? "The smallest payment is RM1.00"
                    : `Pay ${money(amount)} · earn points`}
            </button>
          )}
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
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-900">
            {title} · <span className="text-ink-500">Bill</span>
          </h1>
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
