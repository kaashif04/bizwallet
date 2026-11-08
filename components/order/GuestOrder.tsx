"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { MenuItem } from "@/lib/order-types";
import { guestLabel, loadContact, outletLogos, phoneOk, saveClaimToken, saveContact, toMenu, toOrderItem, type Banner, type GuestMenu, type PickupOutlet } from "@/lib/guest-order";
import type { AccountState } from "./AccountChip";
import { rememberPlace } from "@/lib/place";
import { storeNames } from "@/lib/places";
import JoinPrompt from "./JoinPrompt";
import { useCart } from "./cart-context";
import MenuView from "./MenuView";
import AddToCartSheet from "./AddToCartSheet";
import PickupTime from "./PickupTime";
import { useSheet } from "./useSheet";
import ActiveOrders from "@/components/customer/ActiveOrders";
import BannerCarousel from "./BannerCarousel";
import ViewCartBar from "./ViewCartBar";
import { VegToggle, useVegOnly } from "./Veg";
import OrderAgain from "./OrderAgain";
import { rebuild, type PastOrder } from "@/lib/reorder";
import { CartUpsell, PairNudge, PopularRow, goesWith, type Suggestions } from "./Upsell";

// ponytail: BizPos's guest_get_menu doesn't return a currency yet; every outlet is MYR today.
const CURRENCY = "MYR";

export default function GuestOrder(
  props: ({ token: string; outletId?: never } | { outletId: string; token?: never }) & {
    onlinePay?: boolean; // FPX is set up (Billplz); wallet credit works regardless
    initialMenu?: GuestMenu | null; // fetched by the server page, so the menu shows without a second round trip
  }
) {
  const router = useRouter();
  const cart = useCart();
  const [supabase] = useState(() => createClient());
  const [menu, setMenu] = useState<GuestMenu | null>(props.initialMenu ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [nudge, setNudge] = useState<{ item: MenuItem; after: string } | null>(null);
  const [vegOnly, setVegOnly] = useVegOnly();
  const [lastOrder, setLastOrder] = useState<PastOrder | null>(null);
  const againDone = useRef(false);
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

  // The bottom bar's cart button (or ?cart=1 from another page) opens the order.
  useEffect(() => {
    const open = () => setReviewing(true);
    if (location.search.includes("cart=1")) {
      history.replaceState(history.state, "", location.pathname);
      open();
    }
    window.addEventListener("bw:cart", open);
    return () => window.removeEventListener("bw:cart", open);
  }, []);

  useEffect(() => {
    (props.initialMenu
      ? Promise.resolve({ data: props.initialMenu, error: null })
      : supabase.rpc("guest_get_menu", props.token ? { p_token: props.token } : { p_outlet: props.outletId })
    ).then(({ data, error }) => {
        if (error) return setLoadError(error.message);
        const m = data as GuestMenu;
        setMenu(m);
        rememberPlace(m.outlet.id);
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

  // Signed in: their last order at this outlet, for "Order again" (RLS: own orders only).
  const outletId = menu?.outlet.id;
  useEffect(() => {
    if (!loyalty?.member || !outletId) return;
    supabase
      .from("guest_orders")
      .select("id, created_at, items")
      .eq("outlet_id", outletId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data?.items?.length && setLastOrder(data as PastOrder));
  }, [supabase, loyalty?.member, outletId]);

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
    const partner = added && (suggestions.pairs[added.id] ?? []).map((id) => items.find((i) => i.id === id)).find((i) => i && !now[i.id] && i.isAvailable !== false);
    if (added && partner) setNudge({ item: partner, after: added.name });
  }, [cart.lines, suggestions, items]);
  useEffect(() => {
    if (!nudge) return;
    const t = window.setTimeout(() => setNudge(null), 7000);
    return () => window.clearTimeout(t);
  }, [nudge]);

  // From the restaurant page's "Order again" (?again=1): fill the cart once and open it.
  useEffect(() => {
    if (againDone.current || !lastOrder || !items.length || !location.search.includes("again=1")) return;
    againDone.current = true;
    const { lines } = rebuild(lastOrder, new Map(items.map((i) => [i.id, i])), groupsByItem);
    lines.forEach((l) => cart.add(l.item, l.qty, l.sels));
    history.replaceState(history.state, "", location.pathname);
    if (lines.length) setReviewing(true);
  }, [lastOrder, items, groupsByItem, cart]);

  if (loadError) {
    // ponytail: matches BizPos's "…QR code is not valid." wording; a code from guest_get_menu would be sturdier.
    const badQr = !!props.token && /not valid/i.test(loadError);
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white text-brand-700 shadow-md">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
            <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-slate-900">Can&apos;t order here right now</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-600">{loadError}</p>
        {/* A bad QR has no table page to go to: scan again instead. */}
        <Link
          href={badQr ? "/scan" : props.token ? `/order/t/${props.token}` : `/s/${props.outletId}`}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-[15px] font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
        >
          {badQr ? "Scan the QR again" : props.token ? "Call staff or see your table" : "Back to the restaurant"}
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
  const oneTap = new Map(items.filter((i) => !groupsByItem[i.id]?.length && !i.combos?.length).map((i) => [i.id, i]));
  // Vegetarian only (no switch when the menu has no vegetarian dishes, so it can't empty the page).
  const hasVeg = items.some((i) => i.vegetarian);
  const veg = vegOnly && hasVeg;
  const shown = veg ? items.filter((i) => i.vegetarian) : items;
  const popular = (suggestions?.popular ?? [])
    .map((id) => byId.get(id))
    .filter((i): i is MenuItem => !!i && i.isAvailable !== false && (!veg || !!i.vegetarian));
  const addSuggested = (item: MenuItem) => {
    if (item.isAvailable === false) return; // sold out
    setNudge(null);
    // Dishes with choices (size, sugar…) open their sheet; the rest go straight in.
    if (groupsByItem[item.id]?.length || item.combos?.length) setSheetItem(item);
    else {
      cart.add(item, 1, []);
      navigator.vibrate?.(12);
    }
  };

  const account: AccountState = !loyalty
    ? null
    : loyalty.member
      ? {
          points: loyalty.points,
          joined: loyalty.joined,
          // At a table the points live on its Home; pickup has the restaurant page.
          href: props.token ? `/order/t/${props.token}` : `/s/${menu.outlet.id}?rewards=1`,
        }
      : "guest";

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Came back to the menu with an order on the go: one tap to follow it. */}
      {loyalty?.member && <ActiveOrders names={{}} outletId={menu.outlet.id} variant="pill" />}
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
        homeHref={props.token ? `/order/t/${props.token}` : `/s/${props.outletId}`}
        subtitle={menu.table ? `Table ${menu.table.label}` : "Pickup order"}
        logoUrl={logoUrl}
        account={account}
        items={shown}
        currency={CURRENCY}
        onItemClick={addSuggested} // no choices: straight into the cart
        filter={
          (lastOrder || hasVeg) && (
            <>
              {lastOrder && (
                <OrderAgain order={lastOrder} byId={byId} groupsByItem={groupsByItem} currency={CURRENCY} onView={() => setReviewing(true)} />
              )}
              {hasVeg && <VegToggle on={vegOnly} onChange={setVegOnly} />}
            </>
          )
        }
        intro={
          (banners.length > 0 || popular.length >= 3) && (
            <>
              <BannerCarousel banners={banners} branches={[]} pickupOpen={false} outletId={menu.outlet.id} browseOnly />
              <PopularRow items={popular} currency={CURRENCY} onPick={addSuggested} />
            </>
          )
        }
      />

      {/* A table opens the cart from its bottom bar; pickup has no bar, so it gets this. */}
      {!props.token && !reviewing && <ViewCartBar currency={CURRENCY} onClick={() => setReviewing(true)} />}

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

      <AnimatePresence>
        {sheetItem && (
          <AddToCartSheet
            key="sheet"
            item={sheetItem}
            groupsByItem={groupsByItem}
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
  // Guests paying online: phone (Billplz needs it), email optional.
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    const c = loadContact();
    if (!c) return;
    setPhone(c.mobile);
    setEmail(c.email ?? "");
    setName((n) => n || c.name || "");
  }, []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, [supabase]);
  // Pickup is paid first (FPX); dine-in may pay now or at the counter.
  const [signedIn, setSignedIn] = useState(false);
  const [payWith, setPayWith] = useState<"counter" | "fpx">(token ? "counter" : "fpx");
  const [note, setNote] = useState("");
  const [pickupAt, setPickupAt] = useState<string | null>(null); // null = now
  const [slotsRefresh, setSlotsRefresh] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One id per submission, reused on retry so a flaky network never duplicates the order.
  const requestId = useRef<string | null>(null);

  const pickup = !token;
  // Service charge is for dine-in only. The total is exact without SST (BizPos rounds
  // the same way); SST depends on which dishes carry it, so then it's confirmed at payment.
  const service =
    !pickup && menu.tax.service_charge_enabled
      ? Math.round((Math.round(cart.totalPrice * 100) * Number(menu.tax.service_charge_rate)) / 100) / 100
      : 0;
  // BizPos rounds the bill up to the outlet's step (RM50.38 -> RM50.40): show what will be charged.
  const stepSen = Math.round(Number(menu.tax.rounding_step ?? 0) * 100);
  const roundUp = (n: number) => {
    const s = Math.round(n * 100);
    return (stepSen > 0 ? Math.ceil(s / stepSen) * stepSen : s) / 100;
  };
  const due = menu.tax.sst_enabled ? null : roundUp(cart.totalPrice + service);
  const charges = [service > 0 && "service charge", menu.tax.sst_enabled && "SST"].filter(Boolean);
  const payNow = pickup || payWith !== "counter";
  // A combo is an ordinary menu item, so the promo quote prices it by its own id.
  const quoteItems = cart.lines.map((l) => ({
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
      p_payload: { ...(token ? { table_token: token } : { outlet_id: menu.outlet.id }), code, items: quoteItems },
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
      onlinePay && (["fpx", "Online banking", "FPX"] as const),
    ] as const
  ).filter((m) => !!m) as (readonly ["counter" | "fpx", string, string])[];

  const guestPays = payNow && !signedIn;
  const earns = pointsPerRm !== null ? Math.floor(cart.totalPrice * pointsPerRm) : 0;

  async function place() {
    if (guestPays && !phoneOk(phone)) return setError("Add your phone number to pay.");
    setPlacing(true);
    setError(null);
    requestId.current ??= crypto.randomUUID();
    const { data, error } = await supabase.rpc("guest_place_order", {
      p_payload: {
        request_id: requestId.current,
        ...(token ? { table_token: token } : { outlet_id: menu.outlet.id }),
        customer_name: memberName ?? (name.trim() || (token ? guestLabel() : undefined)),
        note: note.trim() || undefined,
        pay_now: payNow || undefined,
        pickup_at: pickupAt ?? undefined,
        promo_code: promo?.code,
        items: cart.lines.map(toOrderItem),
      },
    });
    if (error) {
      setPlacing(false);
      if (pickupAt) setSlotsRefresh((n) => n + 1); // the time may have just filled up
      return setError(error.message);
    }
    requestId.current = null;
    saveClaimToken(data.id, data.claim_token, window.location.pathname, signedIn ? 0 : earns);
    if (data.status !== "awaiting_payment") return onPlaced(data.id);

    // Paying now (pickup always): the kitchen only sees it once paid.
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: data.id, claim_token: data.claim_token, ...(guestPays && contact()) }),
    });
    const pay = await res.json().catch(() => ({}));
    if (pay.url) {
      cart.clear();
      return window.location.assign(pay.url);
    }
    // Couldn't open payment: the order page has a Pay button to retry.
    onPlaced(data.id);
  }

  // Saved for next time, and sent to Billplz (the receipt goes to the phone or email).
  function contact() {
    const c = { mobile: phone.trim(), name: name.trim() || undefined, email: email.trim() || undefined };
    saveContact(c);
    return c;
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-800 transition active:scale-90 disabled:opacity-40"
                  aria-label={`One less ${l.item.name}`}
                >
                  −
                </button>
                <span className="w-6 text-center text-base font-bold">{l.quantity}</span>
                <button
                  type="button"
                  onClick={() => cart.inc(l.lineId)}
                  disabled={l.quantity >= 50}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-800 transition active:scale-90 disabled:opacity-40"
                  aria-label={`One more ${l.item.name}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>

        {memberName && (
          <p className="mt-4 text-sm text-ink-500">
            Ordering as <span className="font-bold text-ink-900">{memberName}</span>
          </p>
        )}
        {pickup && <PickupTime outletId={menu.outlet.id} value={pickupAt} onChange={setPickupAt} refresh={slotsRefresh} />}
        <details className="group mt-3 rounded-2xl bg-ink-50 px-4 py-1" open={!!(note || name)}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-800">
            {memberName || guestPays ? "Note for the kitchen" : "Your name or a note for the kitchen"}
            <span aria-hidden="true" className="text-ink-400 transition group-open:rotate-90">›</span>
          </summary>
          {!memberName && !guestPays && (
            <label className="block pb-3">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoComplete="given-name"
                placeholder={token ? "Leave blank and we'll call you a Guest number" : undefined}
                className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-400 focus:border-brand-400"
              />
            </label>
          )}
          <label className="block pb-3">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Note for the kitchen</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 text-base outline-none transition focus:border-brand-400"
            />
          </label>
        </details>

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
                  className="min-w-0 flex-1 rounded-xl bg-ink-50 px-4 py-2.5 font-mono text-base uppercase tracking-wider text-ink-900 shadow-pressed outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400"
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
        {shown.total !== null && Math.abs(shown.total - (shown.sub - shown.disc + shown.service + shown.sst)) >= 0.005 && (
          <div className="mt-2 flex justify-between px-0 text-sm text-ink-500">
            <span>Rounding</span>
            <span className="tabular-nums">
              {sym}
              {(shown.total - (shown.sub - shown.disc + shown.service + shown.sst)).toFixed(2)}
            </span>
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
            ? pickupAt
              ? "Paid now. The kitchen starts it shortly before your pickup time."
              : "Paid before it's made. The kitchen starts once you've paid."
            : payNow
              ? "Pay now and you can leave when you're done eating."
              : "Pay at the counter when you're done. Have a promo code? Give it to staff when you pay."}
        </p>

        {methods.length > 1 && (
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

        {guestPays && (
          <div className="mt-4 space-y-2 rounded-2xl bg-ink-50 p-4">
            <p className="text-sm font-bold text-ink-800">Your details for the receipt</p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="Phone number"
              aria-label="Phone number (required)"
              className="w-full rounded-xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-400"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              placeholder="Name (optional)"
              aria-label="Name (optional)"
              className="w-full rounded-xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-400"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Email (optional)"
              aria-label="Email (optional)"
              className="w-full rounded-xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-400"
            />
          </div>
        )}

        {earns > 0 && (
          <p className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700 shadow-well">
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand-600" fill="currentColor" aria-hidden="true">
              <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
            </svg>
            <span>
              This order earns{" "}
              <strong className="font-bold">{earns.toLocaleString()} points</strong>
              {memberName ? "." : ". Sign in after you order to keep them."}
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
          className="h-14 w-full rounded-full bg-brand-600 px-5 text-base font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60"
        >
          {placing
            ? payNow
              ? "Opening payment…"
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
