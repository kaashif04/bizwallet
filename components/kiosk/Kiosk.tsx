"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { outletLogos, toMenu, toOrderItem, type GuestMenu } from "@/lib/guest-order";
import type { MenuItem } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";
import { useCart } from "@/components/order/cart-context";
import AddToCartSheet from "@/components/order/AddToCartSheet";
import ItemMark from "@/components/order/ItemMark";
import BranchLogo from "@/components/order/BranchLogo";
import { VegMark } from "@/components/order/Veg";

// The in-store self-order kiosk (a tablet at the counter), against BizPos's
// guest_kiosk() and guest_place_order({ kiosk_token, dining }). Every customer
// starts from the welcome screen with an empty cart; walking away resets it.

type PayMode = "counter" | "online";
type KioskInfo = { kiosk: { id: string; name: string; pay_modes: PayMode[] }; menu: GuestMenu };
type Placed = { id: string; claim: string; number: string; due: number | null; online: boolean; paid: boolean };
type Stage = "welcome" | "menu" | "review" | "pay" | "done";

const sym = currencySymbol("MYR");
const money = (n: number) => `${sym}${n.toFixed(2)}`;
const IDLE_MS = 75_000; // no touch for this long: "Still ordering?"
const ASK_SECONDS = 15; // then start over
const DONE_MS = 20_000; // the order number stays up this long

export default function Kiosk({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const cart = useCart();
  const [info, setInfo] = useState<KioskInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("welcome");
  const [dining, setDining] = useState<"eat_in" | "takeaway">("eat_in");
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [name, setName] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [ask, setAsk] = useState<number | null>(null); // seconds left on "Still ordering?"
  const requestId = useRef<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);

  // The menu (and sold-out dishes) can change during the day: reload it on the welcome screen.
  const load = useCallback(() => {
    supabase.rpc("guest_kiosk", { p_token: token }).then(({ data, error }) => {
      if (error) return setLoadError(error.message);
      setLoadError(null);
      setInfo(data as KioskInfo);
      outletLogos(supabase).then((l) => setLogo(l[(data as KioskInfo).menu.outlet.id] ?? null));
    });
  }, [supabase, token]);
  useEffect(() => {
    if (stage !== "welcome") return;
    load();
    const t = window.setInterval(load, 5 * 60_000);
    return () => window.clearInterval(t);
  }, [stage, load]);

  const { items, groupsByItem } = useMemo(() => (info ? toMenu(info.menu) : { items: [], groupsByItem: {} }), [info]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const [cat, setCat] = useState("");
  const shownCat = categories.includes(cat) ? cat : categories[0] ?? "";

  const reset = useCallback(() => {
    cart.clear();
    setSheetItem(null);
    setName("");
    setError(null);
    setPlaced(null);
    setAsk(null);
    requestId.current = null;
    setStage("welcome");
  }, [cart]);

  // Walked away: ask, then start over. Paying on a phone gets longer; the done screen resets itself.
  const lastTouch = useRef(Date.now());
  useEffect(() => {
    const touch = () => {
      lastTouch.current = Date.now();
      setAsk(null);
    };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    return () => {
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
    };
  }, []);
  useEffect(() => {
    if (stage === "welcome" || stage === "done") return;
    lastTouch.current = Date.now();
    const limit = stage === "pay" ? 5 * 60_000 : IDLE_MS;
    const t = window.setInterval(() => {
      const idle = Date.now() - lastTouch.current;
      if (idle < limit) return;
      const left = ASK_SECONDS - Math.floor((idle - limit) / 1000);
      if (left <= 0) reset();
      else setAsk(left);
    }, 500);
    return () => window.clearInterval(t);
  }, [stage, reset]);
  useEffect(() => {
    if (stage !== "done") return;
    const t = window.setTimeout(reset, DONE_MS);
    return () => window.clearTimeout(t);
  }, [stage, reset]);

  // Paying on the phone: wait for the payment to land.
  useEffect(() => {
    if (stage !== "pay" || !placed) return;
    const t = window.setInterval(async () => {
      const { data } = await supabase.rpc("guest_order_status", { p_id: placed.id, p_claim_token: placed.claim });
      const s = data as { status: string; paid: boolean; amount_due: number | null } | null;
      if (!s) return;
      if (s.status === "rejected") {
        setError("The restaurant couldn't take this order. Please order at the counter.");
        return setStage("review");
      }
      if (s.paid || s.status !== "awaiting_payment") {
        setPlaced({ ...placed, paid: true });
        setStage("done");
      }
    }, 3000);
    return () => window.clearInterval(t);
  }, [stage, placed, supabase]);

  function tapDish(item: MenuItem) {
    if (item.isAvailable === false) return;
    if (groupsByItem[item.id]?.length || item.combos?.length) setSheetItem(item);
    else cart.add(item, 1, []);
  }

  async function place(online: boolean) {
    setPlacing(true);
    setError(null);
    requestId.current ??= crypto.randomUUID();
    const { data, error } = await supabase.rpc("guest_place_order", {
      p_payload: {
        request_id: requestId.current,
        kiosk_token: token,
        dining,
        customer_name: name.trim() || undefined,
        pay_now: online || undefined,
        items: cart.lines.map(toOrderItem),
      },
    });
    setPlacing(false);
    if (error) return setError(error.message);
    requestId.current = null;
    const o = data as { id: string; claim_token: string; number?: number | string | null; amount_due?: number | null };
    setPlaced({
      id: o.id,
      claim: o.claim_token,
      number: String(o.number ?? o.id.slice(0, 4).toUpperCase()),
      due: o.amount_due == null ? null : Number(o.amount_due),
      online,
      paid: false,
    });
    cart.clear();
    setStage(online ? "pay" : "done");
  }

  async function cancelPayment() {
    if (placed) await supabase.rpc("guest_cancel_order", { p_id: placed.id, p_claim_token: placed.claim });
    reset();
  }

  if (loadError) {
    return (
      <Screen>
        <div className="m-auto max-w-md text-center">
          <h1 className="text-3xl font-semibold text-ink-900">Kiosk not available</h1>
          <p className="mt-3 text-lg text-ink-600">{loadError}</p>
          <p className="mt-2 text-base text-ink-500">Please order at the counter.</p>
        </div>
      </Screen>
    );
  }
  if (!info) {
    return (
      <Screen>
        <div className="m-auto h-16 w-16 animate-pulse rounded-full bg-ink-100" aria-label="Loading" />
      </Screen>
    );
  }

  const outlet = info.menu.outlet.name;
  const modes = info.kiosk.pay_modes.length ? info.kiosk.pay_modes : (["counter"] as PayMode[]);
  const shown = items.filter((i) => i.category === shownCat);

  return (
    <Screen>
      {stage === "welcome" && (
        <div className="m-auto flex w-full max-w-2xl flex-col items-center px-8 text-center">
          <BranchLogo name={outlet} logoUrl={logo} className="h-28 w-28 rounded-[2rem] text-5xl shadow-md" />
          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.03em] text-ink-900">{outlet}</h1>
          <p className="mt-3 text-xl text-ink-600">Order here, then collect at the counter.</p>
          <div className="mt-12 grid w-full grid-cols-2 gap-5">
            {(
              [
                ["eat_in", "Eat here", "M5 4v7a2 2 0 0 0 2 2v7M9 4v7M7 4v3M15 20V4c-2 1-3 4-3 7s1 3 3 3M19 4v16"],
                ["takeaway", "Take away", "M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2"],
              ] as const
            ).map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setDining(value);
                  setStage("menu");
                }}
                className="flex aspect-[5/4] flex-col items-center justify-center gap-5 rounded-[2rem] bg-white text-2xl font-bold text-ink-900 shadow-md transition active:scale-[0.97]"
              >
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={icon} />
                  </svg>
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "menu" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-ink-100 bg-white px-6 py-4">
            <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold text-ink-900">{outlet}</h1>
            <button
              type="button"
              onClick={() => setDining(dining === "eat_in" ? "takeaway" : "eat_in")}
              className="h-12 rounded-full bg-ink-100 px-5 text-base font-bold text-ink-800 transition active:scale-95"
            >
              {dining === "eat_in" ? "Eat here" : "Take away"} · Change
            </button>
          </header>
          <div className="grid min-h-0 flex-1 grid-cols-[13rem_1fr] md:grid-cols-[15rem_1fr]">
            <nav aria-label="Categories" className="min-h-0 overflow-y-auto border-r border-ink-100 bg-white p-3">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  aria-current={c === shownCat ? "true" : undefined}
                  className={`mb-1.5 block w-full rounded-2xl px-4 py-4 text-left text-lg font-semibold transition ${
                    c === shownCat ? "bg-brand-600 text-on" : "text-ink-700 active:bg-ink-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>
            <main className="min-h-0 overflow-y-auto p-6 pb-32">
              <h2 className="mb-5 text-3xl font-semibold text-ink-900">{shownCat}</h2>
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                {shown.map((item) => (
                  <DishTile key={item.id} item={item} count={cart.lines.filter((l) => l.item.id === item.id).reduce((n, l) => n + l.quantity, 0)} onTap={() => tapDish(item)} />
                ))}
              </div>
            </main>
          </div>
          <BottomBar>
            <button type="button" onClick={reset} className="h-16 rounded-full bg-ink-100 px-7 text-lg font-bold text-ink-800 transition active:scale-95">
              Start over
            </button>
            <button
              type="button"
              disabled={!cart.totalItems}
              onClick={() => setStage("review")}
              className="flex h-16 flex-1 items-center justify-between rounded-full bg-brand-600 px-8 text-xl font-bold text-on shadow-md transition active:scale-[0.98] disabled:bg-ink-200 disabled:text-ink-500 disabled:shadow-none"
            >
              <span>{cart.totalItems ? `Review order · ${cart.totalItems} ${cart.totalItems === 1 ? "item" : "items"}` : "Tap a dish to add it"}</span>
              {cart.totalItems > 0 && <span>{money(cart.totalPrice)}</span>}
            </button>
          </BottomBar>
        </div>
      )}

      {stage === "review" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-40 pt-8">
            <h1 className="text-4xl font-semibold text-ink-900">Your order</h1>
            <p className="mt-1 text-lg text-ink-600">{dining === "eat_in" ? "Eat here" : "Take away"}</p>
            <ul className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white shadow-sm">
              {cart.lines.map((l) => (
                <li key={l.lineId} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-ink-900">{l.item.name}</p>
                    {l.selections.length > 0 && <p className="text-sm text-ink-500">{l.selections.map((s) => s.option).join(", ")}</p>}
                    <p className="mt-0.5 text-base font-semibold text-ink-700">{money(cart.lineTotal(l.lineId))}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-ink-100 p-1.5">
                    <button type="button" onClick={() => cart.dec(l.lineId)} aria-label={`One less ${l.item.name}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-bold text-ink-800 shadow-sm active:scale-90">
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-bold" aria-live="polite">{l.quantity}</span>
                    <button type="button" onClick={() => cart.inc(l.lineId)} aria-label={`One more ${l.item.name}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-bold text-ink-800 shadow-sm active:scale-90">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!cart.lines.length && <p className="mt-6 text-lg text-ink-500">Your order is empty.</p>}

            <label className="mt-6 block">
              <span className="text-base font-semibold text-ink-700">Name for your order (optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="off"
                className="mt-2 h-14 w-full rounded-2xl bg-white px-5 text-lg text-ink-900"
                placeholder="So we can call you"
              />
            </label>

            <div className="mt-6 flex items-baseline justify-between">
              <span className="text-lg text-ink-600">Subtotal</span>
              <span className="text-3xl font-bold text-ink-900">{money(cart.totalPrice)}</span>
            </div>
            <p className="mt-1 text-sm text-ink-500">Service charge and SST, where they apply, are added at payment.</p>
            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-base font-semibold text-rose-700">
                {error}
              </p>
            )}
          </main>
          <BottomBar>
            <button type="button" onClick={() => setStage("menu")} className="h-16 rounded-full bg-ink-100 px-7 text-lg font-bold text-ink-800 transition active:scale-95">
              Add more
            </button>
            {modes.includes("counter") && (
              <button
                type="button"
                disabled={placing || !cart.totalItems}
                onClick={() => place(false)}
                className={`h-16 flex-1 rounded-full px-6 text-xl font-bold transition active:scale-[0.98] disabled:opacity-60 ${
                  modes.includes("online") ? "bg-white text-ink-900 shadow-md" : "bg-brand-600 text-on shadow-md"
                }`}
              >
                {placing ? "Sending…" : "Pay at counter"}
              </button>
            )}
            {modes.includes("online") && (
              <button
                type="button"
                disabled={placing || !cart.totalItems}
                onClick={() => place(true)}
                className="h-16 flex-1 rounded-full bg-brand-600 px-6 text-xl font-bold text-on shadow-md transition active:scale-[0.98] disabled:opacity-60"
              >
                {placing ? "Sending…" : "Pay with phone"}
              </button>
            )}
          </BottomBar>
        </div>
      )}

      {stage === "pay" && placed && <PayByPhone placed={placed} onCancel={cancelPayment} />}

      {stage === "done" && placed && (
        <div className="m-auto flex max-w-xl flex-col items-center px-8 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            <p className="text-xl font-semibold text-ink-600">Your order number</p>
            <p className="mt-2 text-[7rem] font-bold leading-none tracking-[-0.04em] text-brand-600 tabular-nums">{placed.number}</p>
          </motion.div>
          <p className="mt-8 text-2xl font-semibold text-ink-900">
            {placed.online ? "Paid. Thank you!" : placed.due != null ? `Please pay ${money(placed.due)} at the counter.` : "Please pay at the counter."}
          </p>
          <p className="mt-2 text-lg text-ink-600">
            {dining === "eat_in" ? "We'll call your number when it's ready." : "Collect your food at the counter when we call your number."}
          </p>
          <button type="button" onClick={reset} className="mt-12 h-16 rounded-full bg-brand-600 px-12 text-xl font-bold text-on shadow-md transition active:scale-95">
            Done
          </button>
        </div>
      )}

      <AnimatePresence>
        {sheetItem && (
          <AddToCartSheet key="sheet" item={sheetItem} groupsByItem={groupsByItem} currency="MYR" onClose={() => setSheetItem(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ask !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alertdialog"
            aria-label="Still ordering?"
          >
            <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl">
              <h2 className="text-3xl font-semibold text-ink-900">Still ordering?</h2>
              <p className="mt-3 text-lg text-ink-600">Starting over in {ask}s.</p>
              <button type="button" onClick={() => setAsk(null)} className="mt-8 h-16 w-full rounded-full bg-brand-600 text-xl font-bold text-on">
                Yes, keep going
              </button>
              <button type="button" onClick={reset} className="mt-3 h-14 w-full rounded-full text-lg font-bold text-ink-700">
                Start over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  // Full screen, no page scroll: each stage scrolls inside itself.
  return <div className="flex h-dvh select-none flex-col overflow-hidden bg-ink-50">{children}</div>;
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
      <div className="mx-auto flex max-w-5xl items-center gap-4">{children}</div>
    </div>
  );
}

function DishTile({ item, count, onTap }: { item: MenuItem; count: number; onTap: () => void }) {
  const soldOut = item.isAvailable === false;
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={soldOut}
      className={`relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition ${soldOut ? "" : "active:scale-[0.98]"}`}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" className={`aspect-[4/3] w-full bg-ink-100 object-cover ${soldOut ? "opacity-50 grayscale" : ""}`} />
      ) : (
        <ItemMark name={item.name} className={`aspect-[4/3] w-full text-5xl ${soldOut ? "opacity-50" : ""}`} />
      )}
      <span className={`flex flex-1 flex-col p-4 ${soldOut ? "opacity-50" : ""}`}>
        <span className="text-lg font-bold leading-snug text-ink-900">
          {item.vegetarian && <VegMark className="mr-1.5" />}
          {item.name}
        </span>
        {item.description && <span className="mt-1 line-clamp-2 text-sm text-ink-500">{item.description}</span>}
        <span className="mt-auto pt-3 text-xl font-bold text-ink-900">{money(item.price)}</span>
      </span>
      {soldOut ? (
        <span className="absolute right-3 top-3 rounded-full bg-ink-900/80 px-3 py-1.5 text-sm font-bold text-on">Sold out</span>
      ) : count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="absolute right-3 top-3 flex h-11 min-w-[2.75rem] items-center justify-center rounded-full bg-brand-600 px-3 text-lg font-bold text-on shadow-md"
          aria-label={`${count} in your order`}
        >
          {count}
        </motion.span>
      ) : null}
    </button>
  );
}

function PayByPhone({ placed, onCancel }: { placed: Placed; onCancel: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/k/${placed.id}?c=${placed.claim}`;
    QRCode.toDataURL(url, { width: 640, margin: 1 }).then(setQr);
  }, [placed]);
  return (
    <div className="m-auto flex max-w-xl flex-col items-center px-8 text-center">
      <h1 className="text-4xl font-semibold text-ink-900">Scan to pay on your phone</h1>
      <p className="mt-3 text-xl text-ink-600">
        Order #{placed.number}
        {placed.due != null ? ` · ${money(placed.due)}` : ""}
      </p>
      <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-md">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code to pay for this order" className="h-72 w-72" />
        ) : (
          <div className="h-72 w-72 animate-pulse rounded-2xl bg-ink-100" />
        )}
      </div>
      <p className="mt-6 text-lg text-ink-600">Open your camera and point it at the code. This screen updates when you&apos;ve paid.</p>
      <button type="button" onClick={onCancel} className="mt-10 h-14 rounded-full bg-ink-100 px-8 text-lg font-bold text-ink-800 transition active:scale-95">
        Cancel order
      </button>
    </div>
  );
}
