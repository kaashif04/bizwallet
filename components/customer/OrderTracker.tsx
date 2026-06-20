"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";

type Status = "pending" | "preparing" | "ready" | "completed" | "cancelled";

type TrackedOrder = {
  id: string;
  orderNumber: number;
  status: Status;
  items: { name?: string; quantity?: number; qty?: number }[];
  total: number;
  orderType: "dine_in" | "takeaway";
  tableNumber: string | null;
  outletName: string | null;
  currency: string;
};

const STEPS: { key: Status; label: string; icon: string; blurb: string }[] = [
  { key: "pending", label: "Order placed", icon: "📝", blurb: "We've received your order." },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳", blurb: "The kitchen is on it." },
  { key: "ready", label: "Ready", icon: "🛎️", blurb: "Ready for pickup / serving." },
  { key: "completed", label: "Completed", icon: "🎉", blurb: "Enjoy your meal!" },
];

export default function OrderTracker({ order }: { order: TrackedOrder }) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<Status>(order.status);
  const [live, setLive] = useState(false);
  const sym = currencySymbol(order.currency);

  // Live updates: the POS hits /api/pos/v1/order-status -> orders row updates
  // -> this fires (RLS limits it to the customer's own order).
  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const next = (payload.new as { status?: Status }).status;
          if (next) setStatus(next);
        }
      )
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, order.id]);

  const cancelled = status === "cancelled";
  const currentIndex = cancelled
    ? -1
    : Math.max(0, STEPS.findIndex((s) => s.key === status));
  const headline = STEPS[currentIndex] ?? STEPS[0];

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="rounded-3xl border border-brand-100 bg-white p-6 text-center shadow-sm">
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`}
          />
          <span className="text-xs font-medium text-slate-400">
            {live ? "Live" : "Connecting…"}
          </span>
        </div>

        {cancelled ? (
          <>
            <p className="mt-3 text-5xl">❌</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Order cancelled</h2>
          </>
        ) : (
          <>
            <motion.p
              key={headline.key}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 220 }}
              className="mt-3 text-5xl"
            >
              {headline.icon}
            </motion.p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{headline.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{headline.blurb}</p>
          </>
        )}
      </div>

      {/* Vertical stepper */}
      {!cancelled && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          {STEPS.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const reached = done || active;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={s.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {active && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-60" />
                    )}
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-base ${
                        reached ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : s.icon}
                    </div>
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 ${
                        i < currentIndex ? "bg-brand-500" : "bg-slate-100"
                      }`}
                      style={{ minHeight: "1.75rem" }}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p
                    className={`text-sm font-semibold ${
                      reached ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-400">{s.blurb}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order details */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Order #{order.orderNumber}</p>
            <p className="text-xs text-slate-500">{order.outletName ?? "Outlet"}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {order.orderType === "dine_in"
              ? `Dine-in · Table ${order.tableNumber ?? "—"}`
              : "Takeaway"}
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          {order.items.length === 0 ? (
            <li className="text-slate-400">No item details</li>
          ) : (
            order.items.map((it, i) => (
              <li key={i}>
                {it.quantity ?? it.qty ?? 1} × {it.name ?? "Item"}
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-base font-bold text-slate-900">
            {sym}
            {order.total.toFixed(2)}
          </span>
        </div>
      </div>

      <Link
        href="/customer/dashboard"
        className="block w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
      >
        Back to home
      </Link>
    </div>
  );
}
