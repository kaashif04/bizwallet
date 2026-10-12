"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { MenuItem } from "@/lib/order-types";
import { outletLogos, saveClaimToken, toMenu, type GuestMenu } from "@/lib/guest-order";
import { useCart } from "./cart-context";
import MenuView from "./MenuView";
import AddToCartSheet from "./AddToCartSheet";
import ViewCartBar from "./ViewCartBar";
import { useSheet } from "./useSheet";

// ponytail: BizPos's guest_get_menu doesn't return a currency yet; every outlet is MYR today.
const CURRENCY = "MYR";

export default function GuestOrder(
  props: { token: string; outletId?: never } | { outletId: string; token?: never }
) {
  const router = useRouter();
  const cart = useCart();
  const [supabase] = useState(() => createClient());
  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .rpc("guest_get_menu", props.token ? { p_token: props.token } : { p_outlet: props.outletId })
      .then(({ data, error }) => {
        if (error) return setLoadError(error.message);
        const m = data as GuestMenu;
        setMenu(m);
        outletLogos(supabase).then((logos) => setLogoUrl(logos[m.outlet.id] ?? null));
      });
  }, [supabase, props.token, props.outletId]);

  const { items, groupsByItem } = useMemo(
    () => (menu ? toMenu(menu) : { items: [], groupsByItem: {} }),
    [menu]
  );

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-700 shadow-md">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
            <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-slate-900">Can&apos;t order here right now</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-600">{loadError}</p>
        <Link
          href="/customer/dashboard"
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
        >
          Go to my wallet
        </Link>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="mx-auto max-w-md px-5 pt-6" aria-busy="true" aria-label="Loading menu">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-white" />
          ))}
        </div>
        <div className="mt-8 divide-y divide-slate-100 rounded-3xl bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      <MenuView
        title={menu.outlet.name}
        subtitle={menu.table ? `Table ${menu.table.label}` : "Pickup order"}
        logoUrl={logoUrl}
        items={items}
        currency={CURRENCY}
        onItemClick={setSheetItem}
      />

      {!reviewing && <ViewCartBar currency={CURRENCY} onClick={() => setReviewing(true)} />}

      <AnimatePresence>
        {sheetItem && (
          <AddToCartSheet
            key="sheet"
            item={sheetItem}
            groups={groupsByItem[sheetItem.id] ?? []}
            currency={CURRENCY}
            onClose={() => setSheetItem(null)}
          />
        )}
        {reviewing && (
          <CartReview
            key="review"
            menu={menu}
            token={props.token}
            onClose={() => setReviewing(false)}
            onPlaced={(id, claimToken) => {
              saveClaimToken(id, claimToken, window.location.pathname);
              cart.clear();
              router.push(`/order/status/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CartReview({
  menu,
  token,
  onClose,
  onPlaced,
}: {
  menu: GuestMenu;
  token?: string;
  onClose: () => void;
  onPlaced: (id: string, claimToken: string) => void;
}) {
  const cart = useCart();
  const [supabase] = useState(() => createClient());
  const sym = currencySymbol(CURRENCY);
  useSheet(onClose);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One id per submission, reused on retry so a flaky network never duplicates the order.
  const requestId = useRef<string | null>(null);

  const charges = [
    menu.tax.service_charge_enabled && "service charge",
    menu.tax.sst_enabled && "SST",
  ].filter(Boolean);

  async function place() {
    setPlacing(true);
    setError(null);
    requestId.current ??= crypto.randomUUID();
    const { data, error } = await supabase.rpc("guest_place_order", {
      p_payload: {
        request_id: requestId.current,
        ...(token ? { table_token: token } : { outlet_id: menu.outlet.id }),
        customer_name: name.trim() || undefined,
        note: note.trim() || undefined,
        items: cart.lines.map((l) => ({
          menu_item_id: l.item.id,
          quantity: l.quantity,
          modifier_ids: l.selections.map((s) => s.modifierId),
        })),
      },
    });
    setPlacing(false);
    if (error) return setError(error.message);
    requestId.current = null;
    onPlaced(data.id, data.claim_token);
  }

  useEffect(() => {
    if (cart.totalItems === 0) onClose();
  }, [cart.totalItems, onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-ink-950/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] max-w-md overflow-y-auto overscroll-contain rounded-t-sheet bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex items-center justify-between">
          <h2 id="cart-title" className="text-2xl text-slate-900">
            Your order
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close and keep browsing"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-90"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {cart.lines.map((l) => (
            <li key={l.lineId} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-slate-900">{l.item.name}</p>
                {l.selections.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {l.selections.map((s) => s.option).join(", ")}
                  </p>
                )}
                {cart.lineTotal(l.lineId) === 0 && l.unitPrice > 0 ? (
                  <p className="mt-1 text-sm font-bold text-mint-700">
                    Free <span className="font-normal text-slate-400 line-through">{sym}{(l.unitPrice * l.quantity).toFixed(2)}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm tabular-nums text-slate-700">
                    {sym}
                    {cart.lineTotal(l.lineId).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cart.dec(l.lineId)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-800 transition active:scale-90 disabled:opacity-40"
                  aria-label={`One less ${l.item.name}`}
                >
                  −
                </button>
                <span className="w-6 text-center text-base font-bold">{l.quantity}</span>
                <button
                  type="button"
                  onClick={() => cart.inc(l.lineId)}
                  disabled={l.quantity >= 50}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-800 transition active:scale-90 disabled:opacity-40"
                  aria-label={`One more ${l.item.name}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Your name <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="given-name"
            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-[15px] outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Note for the kitchen <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-[15px] outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </label>

        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-sm text-slate-600">Subtotal</span>
          <span className="text-2xl font-bold text-slate-900">
            {sym}
            {cart.totalPrice.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {charges.length ? `Final price with ${charges.join(" and ")} is confirmed at the counter. ` : ""}
          Pay at the counter when you&apos;re done.
        </p>

        {Math.floor(cart.totalPrice) > 0 && (
          <p className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700 shadow-well">
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand-600" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
            </svg>
            <span>
              This order earns <strong className="font-bold">{Math.floor(cart.totalPrice)} points</strong> with a free
              BizWallet account. You can join after you order.
            </span>
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={place}
          disabled={placing}
          className="mt-5 h-14 w-full rounded-full bg-brand-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.97] disabled:opacity-60"
        >
          {placing ? "Sending…" : error ? "Try again" : "Place order"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-12 w-full rounded-full text-[15px] font-bold text-slate-700 transition hover:bg-slate-100"
        >
          Keep browsing
        </button>
      </motion.div>
    </>
  );
}
