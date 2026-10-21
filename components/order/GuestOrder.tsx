"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { MenuItem } from "@/lib/order-types";
import { outletLogos, saveClaimToken, toMenu, type Banner, type GuestMenu, type PickupOutlet } from "@/lib/guest-order";
import type { AccountState } from "./AccountChip";
import { storeNames } from "@/lib/places";
import JoinPrompt from "./JoinPrompt";
import { useCart } from "./cart-context";
import MenuView from "./MenuView";
import AddToCartSheet from "./AddToCartSheet";
import ViewCartBar from "./ViewCartBar";
import { useSheet } from "./useSheet";
import ActiveOrders from "@/components/customer/ActiveOrders";
import BannerCarousel from "./BannerCarousel";
import { CartUpsell, PairNudge, PopularRow, goesWith, type Suggestions } from "./Upsell";

// ponytail: BizPos's guest_get_menu doesn't return a currency yet; every outlet is MYR today.
const CURRENCY = "MYR";

export default function GuestOrder(
  props: ({ token: string; outletId?: never } | { outletId: string; token?: never }) & {
    onlinePay?: boolean; // FPX is set up (Billplz); wallet credit works regardless
  }
) {
  const router = useRouter();
  const cart = useCart();
  const [supabase] = useState(() => createClient());
  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [nudge, setNudge] = useState<{ item: MenuItem; after: string } | null>(null);
  // Loyalty is per company: this branch's company, its points rate, and
  // whether the signed-in member has joined it.
  const [loyalty, setLoyalty] = useState<{
    companyId: string;
    company: string;
    pointsPerRm: number | null; // null = the company runs no points programme
    member: boolean;
    joined: boolean;
    points: number;
  } | null>(null);

  useEffect(() => {
    supabase
      .rpc("guest_get_menu", props.token ? { p_token: props.token } : { p_outlet: props.outletId })
      .then(({ data, error }) => {
        if (error) return setLoadError(error.message);
        const m = data as GuestMenu;
        setMenu(m);
        outletLogos(supabase).then((logos) => setLogoUrl(logos[m.outlet.id] ?? null));
        // This outlet's offers (guests too); no "order" tap, they're already on its menu.
        supabase
          .rpc("wallet_banners", { p_outlet: m.outlet.id })
          .then(({ data }) => setBanners((data ?? []) as Banner[]));
        supabase
          .rpc("guest_menu_suggestions", { p_outlet: m.outlet.id })
          .then(({ data }) => data && setSuggestions(data as Suggestions));
        loadLoyalty(m.outlet.id);
      });

    async function loadLoyalty(outletId: string) {
      const [{ data: outlets }, { data: auth }] = await Promise.all([
        supabase.rpc("guest_list_outlets"),
        supabase.auth.getUser(),
      ]);
      const all = (outlets ?? []) as PickupOutlet[];
      const o = all.find((x) => x.id === outletId);
      if (!o) return;
      const { data: prog } = await supabase
        .from("loyalty_programs")
        .select("is_enabled, points_per_rm")
        .eq("company_id", o.company_id)
        .maybeSingle();
      const base = {
        companyId: o.company_id,
        company: storeNames(all.filter((x) => x.company_id === o.company_id).map((x) => x.name), o.company),
        pointsPerRm: prog?.is_enabled === false ? null : Number(prog?.points_per_rm ?? 1),
        member: false,
        joined: false,
        points: 0,
      };
      if (!auth.user) return setLoyalty(base);
      const [{ data: m }, { data: cm }, { data: acct }] = await Promise.all([
        supabase.from("members").select("id").maybeSingle(),
        supabase.from("company_members").select("company_id").eq("company_id", o.company_id).maybeSingle(),
        supabase.from("loyalty_accounts").select("points_balance").eq("company_id", o.company_id).maybeSingle(),
      ]);
      setLoyalty({ ...base, member: !!m, joined: !!cm, points: acct?.points_balance ?? 0 });
    }
  }, [supabase, props.token, props.outletId]);

  const { items, groupsByItem } = useMemo(
    () => (menu ? toMenu(menu) : { items: [], groupsByItem: {} }),
    [menu]
  );

  // A dish just went into the cart: suggest the one most often ordered with it
  // here, for a few seconds. Lines already in the cart on arrival don't count.
  const counted = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    const now: Record<string, number> = {};
    cart.lines.forEach((l) => (now[l.item.id] = (now[l.item.id] ?? 0) + l.quantity));
    const before = counted.current;
    counted.current = now;
    if (!before || !suggestions) return;
    const added = cart.lines.find((l) => now[l.item.id] > (before[l.item.id] ?? 0))?.item;
    const partner = added && (suggestions.pairs[added.id] ?? []).map((id) => items.find((i) => i.id === id)).find((i) => i && !now[i.id]);
    if (added && partner) setNudge({ item: partner, after: added.name });
  }, [cart.lines, suggestions, items]);
  useEffect(() => {
    if (!nudge) return;
    const t = window.setTimeout(() => setNudge(null), 7000);
    return () => window.clearTimeout(t);
  }, [nudge]);

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
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-[15px] font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
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

  const byId = new Map(items.map((i) => [i.id, i]));
  const oneTap = new Map(items.filter((i) => !groupsByItem[i.id]?.length).map((i) => [i.id, i]));
  const popular = (suggestions?.popular ?? []).map((id) => byId.get(id)).filter((i): i is MenuItem => !!i);
  const addSuggested = (item: MenuItem) => {
    setNudge(null);
    // Dishes with choices (size, sugar…) open their sheet; the rest go straight in.
    if (groupsByItem[item.id]?.length) setSheetItem(item);
    else cart.add(item, 1, []);
  };

  const account: AccountState = !loyalty
    ? null
    : loyalty.member
      ? { points: loyalty.points, joined: loyalty.joined }
      : "guest";

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Came back to the menu with an order on the go: one tap to follow it. */}
      <ActiveOrders names={{}} outletId={menu.outlet.id} variant="pill" />
      {loyalty?.member && !loyalty.joined && loyalty.pointsPerRm !== null && (
        <JoinPrompt
          companyId={loyalty.companyId}
          company={loyalty.company}
          pointsPerRm={loyalty.pointsPerRm}
          onJoined={(points) => setLoyalty({ ...loyalty, joined: true, points })}
        />
      )}
      <MenuView
        title={menu.outlet.name}
        subtitle={menu.table ? `Table ${menu.table.label}` : "Pickup order"}
        logoUrl={logoUrl}
        account={account}
        items={items}
        currency={CURRENCY}
        onItemClick={setSheetItem}
        intro={
          (banners.length > 0 || popular.length >= 3) && (
            <>
              <BannerCarousel banners={banners} branches={[]} pickupOpen={false} outletId={menu.outlet.id} browseOnly />
              <PopularRow items={popular} currency={CURRENCY} onPick={addSuggested} />
            </>
          )
        }
      />

      <AnimatePresence>
        {nudge && !reviewing && !sheetItem && (
          <PairNudge
            key={nudge.item.id}
            item={nudge.item}
            after={nudge.after}
            currency={CURRENCY}
            onAdd={() => addSuggested(nudge.item)}
            onDismiss={() => setNudge(null)}
          />
        )}
      </AnimatePresence>

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
            onlinePay={props.onlinePay ?? true}
            pointsPerRm={loyalty?.pointsPerRm ?? null}
            upsell={goesWith(cart.lines.map((l) => l.item), suggestions, oneTap, 4)}
            onClose={() => setReviewing(false)}
            onPlaced={(id, paid) => {
              // The sheet would drop its history entry on close (history.back),
              // undoing this navigation; mark it gone first.
              history.replaceState({ ...history.state, sheet: false }, "");
              cart.clear();
              router.push(`/order/status/${id}?${paid ? "paid=1" : "placed=1"}`);
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
  onlinePay,
  upsell,
  pointsPerRm,
  onClose,
  onPlaced,
}: {
  menu: GuestMenu;
  token?: string;
  onlinePay: boolean;
  upsell: MenuItem[];
  pointsPerRm: number | null;
  onClose: () => void;
  onPlaced: (id: string, paid?: boolean) => void;
}) {
  const cart = useCart();
  const [supabase] = useState(() => createClient());
  const sym = currencySymbol(CURRENCY);
  useSheet(onClose);
  const [name, setName] = useState("");
  // Signed-in members order under the name they registered with.
  const [memberName, setMemberName] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from("members")
      .select("full_name")
      .maybeSingle()
      .then(({ data }) => {
        setSignedIn(!!data);
        setMemberName(data?.full_name?.trim() || null);
      });
    supabase
      .from("wallets")
      .select("balance")
      .maybeSingle()
      .then(({ data }) => {
        const b = Number(data?.balance ?? 0);
        setBalance(b);
        if (pickup && b > 0 && b >= (due ?? cart.totalPrice)) setPayWith("wallet");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, [supabase]);
  // Pickup is paid first (wallet or FPX); dine-in may pay now or at the counter.
  const [signedIn, setSignedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [payWith, setPayWith] = useState<"counter" | "wallet" | "fpx">(token ? "counter" : "fpx");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One id per submission, reused on retry so a flaky network never duplicates the order.
  const requestId = useRef<string | null>(null);

  const pickup = !token;
  // Service charge is for dine-in only. The total is exact without SST (BizPos rounds
  // the same way); SST depends on which dishes carry it, so then it's confirmed at payment.
  const service =
    !pickup && menu.tax.service_charge_enabled
      ? Math.round(cart.totalPrice * Number(menu.tax.service_charge_rate)) / 100
      : 0;
  const due = menu.tax.sst_enabled ? null : cart.totalPrice + service;
  const charges = [service > 0 && "service charge", menu.tax.sst_enabled && "SST"].filter(Boolean);
  const payNow = pickup || payWith !== "counter";
  const orderItems = cart.lines.map((l) => ({
    menu_item_id: l.item.id,
    quantity: l.quantity,
    modifier_ids: l.selections.map((s) => s.modifierId),
  }));

  // Promo code, for orders paid here (at the counter, staff apply it). The server
  // prices it exactly as the POS will (discount before service charge and SST).
  type Quote = { code: string; label: string; subtotal: number; discount: number; service: number; sst: number; total: number };
  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<Quote | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  async function applyPromo(code: string) {
    if (!code.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    const { data, error } = await supabase.rpc("guest_check_promo", {
      p_payload: { ...(token ? { table_token: token } : { outlet_id: menu.outlet.id }), code, items: orderItems },
    });
    setPromoBusy(false);
    if (error) {
      setPromo(null);
      return setPromoError(error.message);
    }
    setPromo(data as Quote);
    setCodeInput("");
  }
  // The cart or how they pay changed: re-price the code, or drop it for the counter.
  useEffect(() => {
    if (!promo) return;
    if (!payNow) return setPromo(null);
    applyPromo(promo.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.totalPrice, payNow]);
  const shown = promo
    ? { sub: Number(promo.subtotal), disc: Number(promo.discount), service: Number(promo.service), sst: Number(promo.sst), total: Number(promo.total) as number | null }
    : { sub: cart.totalPrice, disc: 0, service, sst: 0, total: due };
  const methods = (
    [
      !pickup && (["counter", "Pay at counter", "When you're done"] as const),
      balance > 0 && (["wallet", "Wallet credit", `${sym}${balance.toFixed(2)} available`] as const),
      onlinePay && (["fpx", "Online banking", "FPX"] as const),
    ] as const
  ).filter((m) => !!m) as (readonly ["counter" | "wallet" | "fpx", string, string])[];

  async function place() {
    setPlacing(true);
    setError(null);
    requestId.current ??= crypto.randomUUID();
    const { data, error } = await supabase.rpc("guest_place_order", {
      p_payload: {
        request_id: requestId.current,
        ...(token ? { table_token: token } : { outlet_id: menu.outlet.id }),
        customer_name: memberName ?? (name.trim() || undefined),
        note: note.trim() || undefined,
        pay_now: payNow || undefined,
        promo_code: promo?.code,
        items: orderItems,
      },
    });
    if (error) {
      setPlacing(false);
      return setError(error.message);
    }
    requestId.current = null;
    saveClaimToken(data.id, data.claim_token, window.location.pathname);
    if (data.status !== "awaiting_payment") return onPlaced(data.id);

    // Paying now (pickup always): the kitchen only sees it once paid.
    if (payWith === "wallet") {
      const { error: payError } = await supabase.rpc("wallet_pay_order", {
        p_id: data.id,
        p_claim_token: data.claim_token,
      });
      // Short after SST/rounding, or any hiccup: the order page offers FPX too.
      if (!payError) return onPlaced(data.id, true);
      return onPlaced(data.id);
    }
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: data.id, claim_token: data.claim_token }),
    });
    const pay = await res.json().catch(() => ({}));
    if (pay.url) {
      cart.clear();
      return window.location.assign(pay.url);
    }
    // Couldn't open payment: the order page has a Pay button to retry.
    onPlaced(data.id);
  }

  useEffect(() => {
    if (cart.totalItems === 0) onClose();
  }, [cart.totalItems, onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] max-w-md overflow-y-auto overscroll-contain rounded-t-sheet bg-white px-5 pt-5 shadow-sheet"
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

        {memberName ? (
          <p className="mt-4 text-sm text-ink-500">
            Ordering as <span className="font-bold text-ink-900">{memberName}</span>
          </p>
        ) : (
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
        )}
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

        <CartUpsell items={upsell} currency={CURRENCY} onAdd={(i) => cart.add(i, 1, [])} />

        {payNow && signedIn && (
          <div className="mt-5">
            {promo ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-2.5">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-mono font-bold tracking-wider text-emerald-800">{promo.code}</span>
                  <span className="text-emerald-700"> · {promo.label}</span>
                </span>
                <button type="button" onClick={() => setPromo(null)} className="shrink-0 text-sm font-bold text-emerald-800">
                  Remove
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyPromo(codeInput);
                }}
                className="flex gap-2"
              >
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl bg-ink-50 px-4 py-2.5 font-mono text-[15px] uppercase tracking-wider text-ink-900 shadow-pressed outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400"
                />
                <button
                  type="submit"
                  disabled={!codeInput.trim() || promoBusy}
                  className="shrink-0 rounded-xl bg-ink-900 px-4 text-sm font-bold text-ink-50 transition active:scale-95 disabled:opacity-40"
                >
                  {promoBusy ? "…" : "Apply"}
                </button>
              </form>
            )}
            {promoError && (
              <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-700">
                {promoError}
              </p>
            )}
          </div>
        )}

        {(shown.disc > 0 || shown.service > 0) && (
          <div className="mt-5 space-y-1 text-sm text-ink-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {sym}
                {shown.sub.toFixed(2)}
              </span>
            </div>
            {shown.disc > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Promo {promo?.code}</span>
                <span className="tabular-nums">
                  −{sym}
                  {shown.disc.toFixed(2)}
                </span>
              </div>
            )}
            {shown.service > 0 && (
              <div className="flex justify-between">
                <span>Service charge ({Number(menu.tax.service_charge_rate)}%)</span>
                <span className="tabular-nums">
                  {sym}
                  {shown.service.toFixed(2)}
                </span>
              </div>
            )}
            {shown.sst > 0 && (
              <div className="flex justify-between">
                <span>SST</span>
                <span className="tabular-nums">
                  {sym}
                  {shown.sst.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
        <div className={`flex items-baseline justify-between ${shown.disc > 0 || shown.service > 0 ? "mt-2" : "mt-5"}`}>
          <span className="text-sm text-ink-600">{shown.total !== null ? "Total" : "Subtotal"}</span>
          <span className="text-2xl font-bold tabular-nums text-ink-900">
            {sym}
            {(shown.total ?? shown.sub).toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {shown.total === null && `${charges.join(" and ")} added to the total. `}
          {pickup
            ? "Paid before it's made. The kitchen starts once you've paid."
            : payNow
              ? "Pay now and you can leave when you're done eating."
              : "Pay at the counter when you're done. Have a promo code? Give it to staff when you pay."}
        </p>

        {!pickup && !signedIn && (
          <p className="mt-3 text-xs text-ink-500">
            Want to pay from your phone?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`}
              className="font-bold text-brand-700"
            >
              Sign in
            </Link>
          </p>
        )}

        {(pickup ? methods.length > 1 : signedIn && methods.length > 1) && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Pay with</legend>
            <div className={`grid gap-2 ${methods.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
              {methods.map(([value, label, hint]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 transition ${
                    payWith === value ? "bg-brand-600 text-on shadow-sm" : "bg-ink-50 text-ink-800 shadow-well"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay-with"
                    value={value}
                    checked={payWith === value}
                    onChange={() => setPayWith(value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-bold">{label}</span>
                  <span className={`block text-xs ${payWith === value ? "text-on/80" : "text-ink-500"}`}>{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {!pickup && pointsPerRm !== null && Math.floor(cart.totalPrice * pointsPerRm) > 0 && (
          <p className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700 shadow-well">
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand-600" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
            </svg>
            <span>
              This order earns{" "}
              <strong className="font-bold">{Math.floor(cart.totalPrice * pointsPerRm).toLocaleString()} points</strong>
              {memberName ? "." : " with a free BizWallet account. You can join after you order."}
            </span>
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Pinned to the bottom of the sheet, however long the order gets. */}
        <div className="sticky bottom-0 -mx-5 mt-5 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_16px_-12px_rgb(0_0_0/0.18)]">
        <button
          type="button"
          onClick={place}
          disabled={placing}
          className="h-14 w-full rounded-full bg-brand-600 px-5 text-base font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97] disabled:opacity-60"
        >
          {placing
            ? payNow
              ? payWith === "wallet"
                ? "Paying…"
                : "Opening payment…"
              : "Sending…"
            : error
              ? "Try again"
              : payNow
                ? `Pay${shown.total !== null ? ` ${sym}${shown.total.toFixed(2)}` : ""} and place order`
                : "Place order"}
        </button>
        </div>
      </motion.div>
    </>
  );
}
