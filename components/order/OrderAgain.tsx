"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/order-types";
import type { VariantGroup } from "@/lib/menu-variants";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";
import { rebuild, type PastOrder } from "@/lib/reorder";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" });

export default function OrderAgain({
  order,
  byId,
  groupsByItem,
  currency,
  onView,
}: {
  order: PastOrder;
  byId: Map<string, MenuItem>;
  groupsByItem: Record<string, VariantGroup[]>;
  currency: string;
  onView: () => void;
}) {
  const cart = useCart();
  const [done, setDone] = useState<{ added: number; missing: number } | null>(null);
  const { lines, missing, total } = rebuild(order, byId, groupsByItem);
  if (!lines.length) return null;

  const summary = order.items.map((l) => (l.quantity > 1 ? `${l.quantity}× ${l.name}` : l.name)).join(", ");
  const add = () => {
    lines.forEach((l) => cart.add(l.item, l.qty, l.sels));
    navigator.vibrate?.(12);
    setDone({ added: lines.reduce((n, l) => n + l.qty, 0), missing });
  };

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-ink-900">Order again</h2>
          <p className="text-xs font-semibold text-ink-500">Last time, {day(order.created_at)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-ink-700">{summary}</p>
        </div>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <button
            type="button"
            onClick={onView}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-[15px] font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
          >
            Added {done.added} {done.added === 1 ? "dish" : "dishes"} · View order
          </button>
          {done.missing > 0 && (
            <p className="mt-2 text-center text-xs text-ink-500">
              {done.missing === 1 ? "1 dish isn't" : `${done.missing} dishes aren't`} on today&apos;s menu, so we left {done.missing === 1 ? "it" : "them"} out.
            </p>
          )}
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={add}
          className="mt-3 flex h-12 w-full items-center justify-between rounded-full bg-brand-600 px-5 text-[15px] font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
        >
          <span>Add it all</span>
          <span>
            {currencySymbol(currency)}
            {total.toFixed(2)}
          </span>
        </button>
      )}
    </section>
  );
}
