"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { MenuItem, VariantSelection } from "@/lib/order-types";
import { getVariantGroups } from "@/lib/menu-variants";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";

export default function AddToCartSheet({
  item,
  currency,
  onClose,
}: {
  item: MenuItem;
  currency: string;
  onClose: () => void;
}) {
  const cart = useCart();
  const sym = currencySymbol(currency);
  const groups = useMemo(() => getVariantGroups(item), [item]);

  const [qty, setQty] = useState(1);
  const [sel, setSel] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.options[0]?.label ?? ""]))
  );

  const selections: VariantSelection[] = groups.map((g) => {
    const optionLabel = sel[g.id];
    const opt = g.options.find((o) => o.label === optionLabel);
    return { group: g.label, option: optionLabel, priceDelta: opt?.priceDelta ?? 0 };
  });

  const unit = item.price + selections.reduce((s, v) => s + v.priceDelta, 0);
  const total = unit * qty;

  function addToCart() {
    cart.add(item, qty, selections);
    onClose();
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) onClose();
        }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 pb-6">
          <div className="flex items-start gap-4 pt-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-3xl">
              {item.emoji ?? "🍽️"}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900">{item.name}</h2>
              {item.description && (
                <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
              )}
              <p className="mt-1 text-sm font-semibold text-brand-700">
                {sym}
                {item.price.toFixed(2)}
              </p>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.id} className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{g.label}</h3>
                {g.required && (
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Required
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const isActive = sel[g.id] === o.label;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setSel((s) => ({ ...s, [g.id]: o.label }))}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {o.label}
                      {o.priceDelta ? ` +${sym}${o.priceDelta.toFixed(2)}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center text-base font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={addToCart}
            className="mt-6 flex w-full items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.99]"
          >
            <span>Add to cart</span>
            <span>
              {sym}
              {total.toFixed(2)}
            </span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
