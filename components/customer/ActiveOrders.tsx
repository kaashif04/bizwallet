"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionTitle } from "./ui";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";

type Active = {
  id: string;
  outlet_id: string;
  table_label: string | null;
  created_at: string;
  amount: number;
  stage: "awaiting_payment" | "pending" | "queued" | "preparing" | "ready";
};

const LABEL: Record<Active["stage"], string> = {
  awaiting_payment: "Waiting for your payment",
  pending: "Waiting for the restaurant",
  queued: "Sent to the kitchen",
  preparing: "Being prepared",
  ready: "Ready",
};
// Same steps as the order page: Sent, Preparing, Ready (+ Collected for pickup); -1 = not accepted yet.
const STEP: Record<Active["stage"], number> = { awaiting_payment: -1, pending: -1, queued: 0, preparing: 1, ready: 2 };

// The member's orders still in motion, kept live (polls every 10s), each
// opening its order page. Renders nothing when there's nothing to follow.
export default function ActiveOrders({
  names,
  outletId,
  variant = "cards",
}: {
  names: Record<string, string>;
  outletId?: string;
  variant?: "cards" | "pill";
}) {
  const [supabase] = useState(() => createClient());
  const [orders, setOrders] = useState<Active[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      supabase.rpc("wallet_active_orders").then(({ data }) => {
        if (alive && Array.isArray(data)) setOrders(data as Active[]);
      });
    load();
    const t = window.setInterval(load, 10_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [supabase]);

  const shown = outletId ? orders.filter((o) => o.outlet_id === outletId) : orders;
  const sym = currencySymbol("MYR");

  if (variant === "pill") {
    const o = shown[0];
    return (
      <AnimatePresence>
        {o && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-5 pt-3"
          >
            <Link
              href={`/order/status/${o.id}`}
              className="flex items-center gap-3 rounded-full bg-white py-2 pl-3 pr-4 text-sm shadow-sm transition active:scale-[0.98]"
            >
              <LiveDot stage={o.stage} />
              <span className="min-w-0 flex-1 truncate font-bold text-ink-900">{LABEL[o.stage]}</span>
              <span className="shrink-0 font-bold text-brand-700">Track ›</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!shown.length) return null;
  return (
    <section>
      <SectionTitle>Happening now</SectionTitle>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {shown.map((o) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <Link
                href={`/order/status/${o.id}`}
                className="block rounded-2xl bg-white p-4 transition hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <LiveDot stage={o.stage} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink-900">
                      {o.stage === "ready" && !o.table_label ? "Ready to collect" : LABEL[o.stage]}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {names[o.outlet_id] ?? "Restaurant"} · {o.table_label ? `Table ${o.table_label}` : "Pickup"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                    {sym}
                    {Number(o.amount).toFixed(2)}
                  </span>
                </div>
                <div className={`mt-3 grid gap-1.5 ${o.table_label ? "grid-cols-3" : "grid-cols-4"}`} aria-hidden="true">
                  {(o.table_label ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => (
                    <span key={i} className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <motion.span
                        className="block h-full rounded-full bg-marple"
                        initial={false}
                        animate={{ width: i <= STEP[o.stage] ? "100%" : "0%" }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      />
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function LiveDot({ stage }: { stage: Active["stage"] }) {
  const tone = stage === "ready" ? "bg-emerald-500" : stage === "awaiting_payment" ? "bg-amber-500" : "bg-brand-500";
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${tone}`} />
      <span className={`relative h-2.5 w-2.5 rounded-full ${tone}`} />
    </span>
  );
}
