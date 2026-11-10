"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import { pickupLabel } from "@/components/order/PickupTime";
import HomeButton from "@/components/order/HomeButton";
import StatusOrb, { type OrbStage } from "@/components/order/StatusOrb";
import { loadClaimToken, loadContact, loadMenuPath, loadOrderPoints, phoneOk, saveContact, type GuestContact, type GuestOrderStatus } from "@/lib/guest-order";

const STEPS: Record<string, string> = {
  awaiting_payment: "Waiting for your payment",
  pending: "Waiting for the outlet to confirm",
  queued: "Sent to the kitchen",
  preparing: "Being prepared",
  ready: "Your order is ready",
  served: "Collected. Enjoy your meal.",
};

const TRACK = [
  { key: "queued", label: "Sent" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "served", label: "Collected" },
] as const;

// Progress through the kitchen as a 0-based step; -1 = not accepted yet.
const DELIVERY: Record<string, string> = {
  waiting: "We book your driver once the kitchen has your order.",
  booking: "Finding you a driver…",
  assigning: "Finding you a driver…",
  on_going: "Your driver is on the way to the restaurant.",
  picked_up: "Your food is on its way to you.",
  completed: "Delivered. Enjoy!",
  cancelled: "Delivery cancelled.",
};

function stepOf(o: GuestOrderStatus): number {
  if (o.status !== "accepted") return -1;
  return Math.max(0, TRACK.findIndex((t) => t.key === (o.kitchen_status ?? "queued")));
}

export default function GuestOrderStatusPage({ params }: { params: { id: string } }) {
  const [supabase] = useState(() => createClient());
  const [claimToken, setClaimToken] = useState<string | null | undefined>(undefined);
  const [order, setOrder] = useState<GuestOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const claimTried = useRef(false);

  const [menuPath, setMenuPath] = useState<string | null>(null);
  // Arrived from placing (?placed=1) or from the bank (?paid=1|0).
  const [arrival, setArrival] = useState<"placed" | "paid" | "unpaid" | null>(null);
  const [paying, setPaying] = useState(false);
  // Signed out: the details they paid with last time, else a phone to type here.
  const [contact, setContact] = useState<GuestContact | null>(null);
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState(0);
  useEffect(() => {
    setContact(loadContact());
    setPoints(loadOrderPoints(params.id));
    supabase.auth.getUser().then(({ data }) => data.user && setSignedIn(true));
  }, [params.id, supabase]);
  // A paid order the outlet cancelled: the owner pays it back in Billplz and marks it.
  const [paidBackAt, setPaidBackAt] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    // Another device, or local storage cleared: a signed-in member can still
    // open their own order (RLS lets them read its claim token).
    const local = loadClaimToken(params.id);
    if (local) setClaimToken(local);
    else
      supabase
        .from("guest_orders")
        .select("claim_token")
        .eq("id", params.id)
        .maybeSingle()
        .then(({ data }) => setClaimToken(data?.claim_token ?? null));
    setMenuPath(loadMenuPath(params.id));
    const q = new URLSearchParams(window.location.search);
    const a = q.get("paid") === "1" ? "paid" : q.get("paid") === "0" ? "unpaid" : q.get("placed") ? "placed" : null;
    setArrival(a);
    if (a) history.replaceState(history.state, "", window.location.pathname);
    if (a === "placed" || a === "paid") {
      const t = window.setTimeout(() => setArrival(null), 2200);
      return () => window.clearTimeout(t);
    }
  }, [params.id, supabase]);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Cancel, or switch a table order to pay-at-the-counter. The server kills any open bank bill first.
  async function change(action: "cancel" | "counter") {
    setCancelling(true);
    setError(null);
    const res = await fetch("/api/pay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: params.id, claim_token: claimToken, action }),
    });
    const body = await res.json().catch(() => ({}));
    setCancelling(false);
    setConfirmCancel(false);
    if (!res.ok) setError(body.error ?? "Something went wrong. Please try again.");
    refresh();
  }
  const cancel = () => change("cancel");

  async function pay() {
    const guest = signedIn ? null : contact ?? (phoneOk(phone) ? { mobile: phone.trim() } : null);
    if (!signedIn && !guest) return setError("Add your phone number to pay.");
    if (guest && !contact) saveContact(guest);
    setPaying(true);
    setError(null);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: params.id, claim_token: claimToken, ...guest }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.url) return window.location.assign(body.url);
    setPaying(false);
    if (body.paid) refresh();
    else setError(body.error ?? "Couldn't open payment. Please try again.");
  }

  const refresh = useCallback(async () => {
    if (!claimToken) return;
    const { data, error } = await supabase.rpc("guest_order_status", {
      p_id: params.id,
      p_claim_token: claimToken,
    });
    if (error) setError(error.message);
    else if (data) setOrder(data as GuestOrderStatus);
  }, [supabase, params.id, claimToken]);

  // Anon can't subscribe to realtime on BizPos tables, so poll.
  // Prepaid pickup is paid from the start, so keep following the kitchen until it's ready.
  const ended = order?.status === "rejected" || order?.status === "cancelled";
  const done =
    ended ||
    (order?.paid && order.member_linked && ["ready", "served"].includes(order.kitchen_status ?? "") &&
      // a delivery keeps following the driver until it arrives
      (!order.delivery || ["completed", "cancelled"].includes(order.delivery.status)));
  useEffect(() => {
    refresh();
    if (done) return;
    const t = window.setInterval(refresh, 5000);
    return () => window.clearInterval(t);
  }, [refresh, done]);
  // Back from another app or a locked phone: show the live order straight away.
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [refresh]);

  const refundOwed = order?.status === "rejected" && order.paid;
  useEffect(() => {
    if (!refundOwed) return;
    supabase
      .from("guest_orders")
      .select("paid_back_at")
      .eq("id", params.id)
      .maybeSingle()
      .then(({ data }) => setPaidBackAt(data?.paid_back_at ?? null));
  }, [supabase, params.id, refundOwed]);

  const step = order ? stepOf(order) : -1;
  useEffect(() => {
    if (step === 2) navigator.vibrate?.([30, 60, 30]);
  }, [step]);

  // Signed in (e.g. just came back from sign-up) but the order isn't linked
  // yet: claim it so the bill earns points.
  useEffect(() => {
    if (!claimToken || !order || order.member_linked || claimTried.current) return;
    claimTried.current = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setSignedIn(true);
      const { data: member } = await supabase.from("members").select("id").maybeSingle();
      if (!member) return; // e.g. a BizPos staff account
      const { error } = await supabase.rpc("claim_guest_order", {
        p_id: params.id,
        p_claim_token: claimToken,
      });
      if (error) setError(error.message);
      else refresh();
    })();
  }, [supabase, params.id, claimToken, order, refresh]);

  if (claimToken === null) {
    return (
      <Shell>
        <HomeButton />
        <h1 className="mt-5 text-2xl text-slate-900">Order not found on this device</h1>
        <p className="mt-2 text-sm text-slate-600">
          Order status can only be viewed on the phone that placed it. Ask our staff if you need help.
        </p>
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell>
        {error ? (
          <p role="alert" className="text-sm text-red-700">{error}</p>
        ) : (
          <div className="h-24 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        )}
      </Shell>
    );
  }

  const sym = currencySymbol("MYR");
  const headline =
    order.status === "cancelled"
      ? "Your order was cancelled by the restaurant"
      : order.status === "rejected"
      ? order.reject_reason === "Cancelled by customer"
        ? "Order cancelled"
        : "The outlet couldn't take this order"
      : order.status === "pending" && order.paid && order.pickup_at && new Date(order.pickup_at) > new Date()
        ? `Booked for ${pickupLabel(order.pickup_at)}. We start it just before.`
      : order.status === "awaiting_payment" || order.status === "pending"
        ? STEPS[order.status]
        : !order.table_label && order.kitchen_status === "ready"
          ? "Ready. Collect it at the counter."
          : STEPS[order.kitchen_status ?? "queued"];
  const stage: OrbStage =
    order.status === "rejected" || order.status === "cancelled"
      ? "rejected"
      : order.status === "awaiting_payment"
        ? "pay"
        : order.status === "pending"
          ? "pending"
          : (order.kitchen_status ?? "queued");

  return (
    <Shell>
      <AnimatePresence>
        {(arrival === "placed" || arrival === "paid") && order.status !== "awaiting_payment" && (
          <motion.div
            key="arrival"
            role="status"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-50/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setArrival(null)}
          >
            <motion.div
              className="w-72 rounded-2xl bg-white px-6 py-7 text-center shadow-xl"
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <motion.path d="M12 25l8 8 16-17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
                </svg>
              </span>
              <p className="mt-4 text-lg font-bold text-ink-900">{arrival === "paid" ? "Payment received" : "Order placed"}</p>
              <p className="mt-1 text-sm text-ink-500">{order.status === "pending" ? "Waiting for the outlet to confirm" : "Sent to the kitchen"}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="flex items-center gap-2">
        {/* Home is the table's Home, or the restaurant's page for pickup. */}
        <HomeButton
          href={
            menuPath?.startsWith("/order/t/")
              ? menuPath.replace(/\/menu$/, "")
              : menuPath?.startsWith("/order/p/")
                ? menuPath.replace("/order/p/", "/s/")
                : undefined
          }
        />
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-2xs font-bold text-brand-700">
          {order.table_label
            ? `Table ${order.table_label}`
            : order.delivery
              ? "Delivery"
              : order.pickup_at
                ? `Pickup · ${pickupLabel(order.pickup_at)}`
                : "Pickup order"}
        </span>
      </span>
      <div className="mt-6">
        <StatusOrb stage={stage} />
      </div>
      <motion.h1
        key={headline}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 text-center text-[1.75rem] leading-tight tracking-[-0.03em] text-ink-900"
        aria-live="polite"
      >
        {headline}
      </motion.h1>

      {order.status === "awaiting_payment" && (
        <div className="mt-5 rounded-2xl bg-white p-5 text-center">
          <p className="text-sm text-ink-500">
            {arrival === "unpaid"
              ? "The payment wasn't completed. Nothing was charged and the kitchen hasn't started."
              : "The kitchen starts once you've paid."}
          </p>
          {!signedIn && !contact && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Your phone number"
              aria-label="Your phone number"
              className="mt-4 w-full rounded-xl bg-ink-50 px-4 py-3 text-center text-base outline-none placeholder:text-ink-400"
            />
          )}
          <button
            type="button"
            onClick={pay}
            disabled={paying}
            className="mt-4 h-12 w-full rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60"
          >
            {paying ? "One moment…" : `Pay ${sym}${Number(order.amount_due ?? 0).toFixed(2)} with FPX`}
          </button>
          {order.table_label && (
            <button
              type="button"
              onClick={() => change("counter")}
              disabled={paying || cancelling}
              className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-ink-700 transition active:scale-[0.97] disabled:opacity-60"
            >
              Pay at the counter instead
            </button>
          )}
        </div>
      )}

      {!ended && <Track step={step} pickup={!order.table_label} />}
      {order.delivery && order.paid && (
        <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm">
          <p className="font-bold text-ink-900" aria-live="polite">
            {DELIVERY[order.delivery.status] ?? DELIVERY.booking}
          </p>
          <p className="mt-0.5 text-ink-500">
            {order.delivery.address}
            {order.delivery.unit ? ` · ${order.delivery.unit}` : ""}
          </p>
          {order.delivery.driver && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 text-ink-800">
              <span>
                {order.delivery.driver.name} · {order.delivery.driver.plate}
              </span>
              <a href={`tel:${order.delivery.driver.phone}`} className="font-bold text-brand-700">
                Call driver
              </a>
            </p>
          )}
          {order.delivery.share_link && order.delivery.status !== "completed" && (
            <a
              href={order.delivery.share_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-ink-50 active:scale-[0.97]"
            >
              Track on the map
            </a>
          )}
        </div>
      )}
      {order.status === "cancelled" && (
        <p className="mt-2 text-center text-sm text-ink-500">
          {order.paid ? "The restaurant will refund what you paid." : "No payment was taken."}
        </p>
      )}
      {order.status === "rejected" && order.reject_reason && order.reject_reason !== "Cancelled by customer" && (
        <p className="mt-2 text-center text-sm text-ink-500">{order.reject_reason}</p>
      )}
      {refundOwed && paidBackAt !== undefined && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-ink-800">
          <span className={`h-2 w-2 shrink-0 rounded-full ${paidBackAt ? "bg-emerald-500" : "bg-amber-500"}`} />
          {paidBackAt
            ? `Refunded ${sym}${Number(order.amount_due ?? 0).toFixed(2)} on ${new Date(paidBackAt).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium" })}.`
            : `Your ${sym}${Number(order.amount_due ?? 0).toFixed(2)} will be refunded to your bank account by the restaurant.`}
        </p>
      )}

      {!ended && order.status !== "awaiting_payment" && (
        <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink-800">
          {order.table_due != null && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
          )}
          <span>
            {order.table_due != null
              ? order.paid
                ? `This order is paid. Your table still has ${sym}${Number(order.table_due).toFixed(2)} to pay at the counter.`
                : `To pay at the counter: ${sym}${Number(order.table_due).toFixed(2)} for your table so far.`
              : order.paid
                ? order.table_label
                  ? "Paid. Your food comes to your table, and you can leave when you're done."
                  : order.delivery
                    ? "Paid. A Lalamove driver brings it to you."
                    : "Paid. Collect it at the counter when it's ready."
                : "Pay at the counter when you're done."}
          </span>
        </p>
      )}

      {order.status !== "awaiting_payment" && (
        <>
      {/* Orders placed before the menu path was saved fall back to the
          previous page, which is the menu the order came from. */}
      <button
        type="button"
        onClick={() => {
          if (menuPath) window.location.assign(menuPath);
          else if (window.history.length > 1) window.history.back();
          else window.location.assign("/");
        }}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <path d="M8 3v10M3 8h10" />
        </svg>
        {ended ? "Back to the menu" : order.paid ? "Order again" : "Order more"}
      </button>
        </>
      )}

      <ul className="mt-6 divide-y divide-ink-100 rounded-2xl bg-white px-4">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium text-slate-900">
                {i.quantity} × {i.name}
              </span>
              {i.modifier_summary && (
                <span className="block text-xs text-slate-500">{i.modifier_summary}</span>
              )}
              {i.added_by_staff && (
                <span className="mt-0.5 block text-xs font-semibold text-brand-700">Added by the restaurant</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-slate-700">
              {sym}
              {((Number(i.unit_price) + Number(i.modifier_delta)) * i.quantity).toFixed(2)}
            </span>
          </li>
        ))}
        {(order.cancelled_items ?? []).map((c, n) => (
          <li key={`x${n}`} className="py-3 text-sm">
            <span className="block text-ink-400 line-through">
              {c.quantity} × {c.name}
            </span>
            {c.options && <span className="block text-xs text-ink-400 line-through">{c.options}</span>}
            <span className="mt-0.5 block text-xs font-semibold text-rose-700">
              Cancelled by the restaurant{c.reason ? ` · ${c.reason}` : ""}
            </span>
          </li>
        ))}
      </ul>
      {Number(order.amount_due ?? 0) > Number(order.subtotal) ? (
        <div className="mt-3 space-y-1 px-4 text-sm">
          <div className="flex justify-between text-ink-500">
            <span>Subtotal</span>
            <span className="tabular-nums">
              {sym}
              {Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          {order.delivery && (
            <div className="flex justify-between text-ink-500">
              <span>Delivery</span>
              <span className="tabular-nums">
                {Number(order.delivery.fee ?? 0) === 0 ? "Free" : `${sym}${Number(order.delivery.fee).toFixed(2)}`}
              </span>
            </div>
          )}
          {Number(order.amount_due) - Number(order.subtotal) - Number(order.delivery?.fee ?? 0) > 0.004 && (
            <div className="flex justify-between text-ink-500">
              <span>Service charge &amp; tax</span>
              <span className="tabular-nums">
                {sym}
                {(Number(order.amount_due) - Number(order.subtotal) - Number(order.delivery?.fee ?? 0)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold">
            <span>Total</span>
            <span className="tabular-nums">
              {sym}
              {Number(order.amount_due).toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-between px-4 text-sm font-bold">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {sym}
            {Number(order.subtotal).toFixed(2)}
          </span>
        </div>
      )}

      {order.status !== "rejected" && !order.member_linked && !signedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-2xl bg-white p-5"
        >
          <p className="text-lg font-bold text-ink-900">
            {points > 0 ? `${points.toLocaleString()} points waiting for you` : "Earn points on this order"}
          </p>
          <p className="mt-1 text-sm text-ink-500">Sign in or join free and they go into your rewards here.</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/order/status/${params.id}`)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
          >
            Sign in or join
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </motion.div>
      )}
      {order.member_linked && (
        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
          <p className="text-sm text-slate-600">
            Linked to your account. Points are added once the bill is paid.
          </p>
          <Link
            href="/customer/dashboard?rewards=1"
            className="shrink-0 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.98]"
          >
            My account
          </Link>
        </div>
      )}
      {/* Until the outlet confirms, the customer can take it back. */}
      {(order.status === "awaiting_payment" || order.status === "pending") && (
        <div className="mt-8 text-center">
          <AnimatePresence mode="wait" initial={false}>
            {confirmCancel ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-2xl bg-white p-4"
              >
                <p className="text-sm font-bold text-ink-900">Cancel this order?</p>
                {order.paid && (
                  <p className="mt-1 text-xs text-ink-500">
                    The restaurant will refund {sym}
                    {Number(order.amount_due ?? 0).toFixed(2)} to your bank account.
                  </p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="h-11 rounded-full bg-ink-50 text-sm font-bold text-ink-700 shadow-well transition active:scale-[0.97]"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={cancelling}
                    className="h-11 rounded-full bg-rose-600 text-sm font-bold text-on shadow-sm transition active:scale-[0.97] disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling…" : "Yes, cancel"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="ask"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmCancel(true)}
                className="h-11 rounded-full px-5 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
              >
                Cancel order
              </motion.button>
            )}
          </AnimatePresence>
          <p className="mt-1 text-xs text-ink-500">You can cancel until the restaurant confirms it.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
      )}
    </Shell>
  );
}

// The kitchen stops at Ready; only pickups have a Collected step (POS staff tap it).
function Track({ step, pickup }: { step: number; pickup: boolean }) {
  const steps = pickup ? TRACK : TRACK.slice(0, 3);
  return (
    <ol className={`mt-6 grid gap-2 ${pickup ? "grid-cols-4" : "grid-cols-3"}`} aria-label="Order progress">
      {steps.map((t, i) => {
        const done = i <= step;
        const current = i === step;
        return (
          <li key={t.key} aria-current={current ? "step" : undefined}>
            <div className="relative h-2 overflow-hidden rounded-full bg-ink-100 shadow-well">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-marple"
                initial={false}
                animate={{ width: done ? "100%" : "0%" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
              />
              {current && i < steps.length - 1 && (
                <motion.div
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
            <p className={`mt-2 text-xs font-semibold ${done ? "text-slate-900" : "text-slate-500"}`}>{t.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">{children}</div>
    </main>
  );
}
