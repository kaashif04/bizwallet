"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import { loadClaimToken, type GuestOrderStatus } from "@/lib/guest-order";

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

  useEffect(() => setClaimToken(loadClaimToken(params.id)), [params.id]);

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
        <h1 className="text-lg font-bold text-slate-900">Order not found on this device</h1>
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
      <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-brand-50">
        {order.table_label ? `Table ${order.table_label}` : "Pickup order"}
      </span>
      <motion.h1
        key={headline}
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 text-[2rem] font-semibold leading-[1.1] text-slate-900"
        aria-live="polite"
      >
        {headline}
      </motion.h1>

      {order.status !== "rejected" && <Track step={step} />}
      {order.status === "rejected" && order.reject_reason && (
        <p className="mt-2 text-sm text-slate-600">{order.reject_reason}</p>
      )}

      {order.status !== "rejected" && (
        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm">
          {order.paid ? "Paid. Thank you." : "Pay at the counter when you're done."}
        </p>
      )}

      <ul className="mt-6 divide-y divide-slate-200/70">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-4 py-2.5 text-sm">
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
      <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold">
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
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-8 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/30 blur-2xl" />
          <p className="relative font-display text-4xl font-semibold text-brand-300">
            +{Math.floor(Number(order.subtotal))} pts
          </p>
          <p className="relative mt-2 text-lg font-semibold">
            {order.paid ? "You can still claim points for this order" : "Join to earn points on this order"}
          </p>
          <p className="relative mt-1 text-sm text-slate-300">
            1 point for every RM1. Redeem them for free drinks and vouchers.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/order/status/${params.id}`)}`}
            className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 active:scale-[0.98]"
          >
            Create a free account
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </motion.div>
      )}
      {order.member_linked && (
        <p className="mt-6 text-sm text-slate-600">
          Linked to your BizCafé account. Points are added once the bill is paid.
        </p>
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
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-600"
                initial={false}
                animate={{ width: done ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
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
    <main className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-12 pt-[max(2rem,env(safe-area-inset-top))]">{children}</div>
    </main>
  );
}
