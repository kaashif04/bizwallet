"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import HomeButton from "@/components/order/HomeButton";
import { loadClaimToken, loadMenuPath, type GuestOrderStatus } from "@/lib/guest-order";

const STEPS: Record<string, string> = {
  pending: "Waiting for the outlet to confirm",
  queued: "Sent to the kitchen",
  preparing: "Being prepared",
  ready: "Your order is ready",
  served: "Served. Enjoy your meal.",
};

const TRACK = [
  { key: "queued", label: "Sent" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "served", label: "Served" },
] as const;

// Progress through the kitchen as a 0-based step; -1 = not accepted yet.
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
  useEffect(() => {
    setClaimToken(loadClaimToken(params.id));
    setMenuPath(loadMenuPath(params.id));
  }, [params.id]);

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
  const done = order?.status === "rejected" || (order?.paid && order.member_linked);
  useEffect(() => {
    refresh();
    if (done) return;
    const t = window.setInterval(refresh, 5000);
    return () => window.clearInterval(t);
  }, [refresh, done]);

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
    order.status === "rejected"
      ? "The outlet couldn't take this order"
      : order.status === "pending"
        ? STEPS.pending
        : STEPS[order.kitchen_status ?? "queued"];

  return (
    <Shell>
      <span className="flex items-center gap-2">
        <HomeButton />
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-2xs font-bold text-brand-700">
          {order.table_label ? `Table ${order.table_label}` : "Pickup order"}
        </span>
      </span>
      <motion.h1
        key={headline}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 text-[1.75rem] leading-tight tracking-[-0.03em] text-ink-900"
        aria-live="polite"
      >
        {headline}
      </motion.h1>

      {order.status !== "rejected" && <Track step={step} />}
      {order.status === "rejected" && order.reject_reason && (
        <p className="mt-2 text-sm text-slate-600">{order.reject_reason}</p>
      )}

      {order.status !== "rejected" && (
        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink-800">
          {order.paid ? "Paid. Thank you." : "Pay at the counter when you're done."}
        </p>
      )}

      {/* Orders placed before the menu path was saved fall back to the
          previous page, which is the menu the order came from. */}
      <button
        type="button"
        onClick={() => {
          if (menuPath) window.location.assign(menuPath);
          else if (window.history.length > 1) window.history.back();
          else window.location.assign("/customer/order");
        }}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <path d="M8 3v10M3 8h10" />
        </svg>
        {order.status === "rejected" ? "Back to the menu" : order.paid ? "Order again" : "Order more"}
      </button>

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
            </span>
            <span className="shrink-0 tabular-nums text-slate-700">
              {sym}
              {((Number(i.unit_price) + Number(i.modifier_delta)) * i.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between px-4 text-sm font-bold">
        <span>Subtotal</span>
        <span className="tabular-nums">
          {sym}
          {Number(order.subtotal).toFixed(2)}
        </span>
      </div>

      {order.status !== "rejected" && !order.member_linked && !signedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-2xl bg-white p-5"
        >
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Points on this order</p>
          <p className="mt-1 text-4xl font-semibold tracking-[-0.03em] text-ink-900">
            +{Math.floor(Number(order.subtotal))} pts
          </p>
          <p className="mt-3 font-bold text-ink-900">
            {order.paid ? "You can still claim points for this order" : "Join to earn points on this order"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            1 point for every RM1. Redeem them for free drinks and vouchers.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/order/status/${params.id}`)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
          >
            Create a free account
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
            href="/customer/dashboard"
            className="shrink-0 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            My account
          </Link>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
      )}
    </Shell>
  );
}

function Track({ step }: { step: number }) {
  return (
    <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Order progress">
      {TRACK.map((t, i) => {
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
              {current && i < TRACK.length - 1 && (
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
