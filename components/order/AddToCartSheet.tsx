"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItem, VariantSelection } from "@/lib/order-types";
import type { VariantGroup } from "@/lib/menu-variants";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";
import ItemMark from "./ItemMark";

function defaultSelection(groups: VariantGroup[]): Record<string, string[]> {
  return Object.fromEntries(
    groups.map((g) => {
      const defaults = g.options.filter((o) => o.isDefault).map((o) => o.id);
      if (defaults.length) return [g.id, defaults];
      return [g.id, g.selectionType === "single" && g.required && g.options[0] ? [g.options[0].id] : []];
    })
  );
}

export default function AddToCartSheet({
  item,
  groups,
  currency,
  onClose,
}: {
  item: MenuItem;
  groups: VariantGroup[];
  currency: string;
  onClose: () => void;
}) {
  const cart = useCart();
  const sym = currencySymbol(currency);
  const [sel, setSel] = useState<Record<string, string[]>>(() =>
    defaultSelection(groups)
  );

  const [qty, setQty] = useState(1);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [shakeId, setShakeId] = useState<string | null>(null);

  function toggleOption(group: VariantGroup, optionId: string) {
    setSel((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionType === "single") {
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      // At the max: drop the oldest pick rather than refusing the tap.
      const next = [...current, optionId].slice(-(group.maxSelect ?? Infinity));
      return { ...prev, [group.id]: next };
    });
  }

  const selections: VariantSelection[] = useMemo(() => {
    const out: VariantSelection[] = [];
    for (const g of groups) {
      for (const id of sel[g.id] ?? []) {
        const opt = g.options.find((o) => o.id === id);
        if (!opt) continue;
        out.push({
          modifierId: opt.id,
          group: g.label,
          option: opt.label,
          priceDelta: opt.priceDelta ?? 0,
        });
      }
    }
    return out;
  }, [groups, sel]);

  const unit = item.price + selections.reduce((s, v) => s + v.priceDelta, 0);
  const total = unit * qty;

  const unmetGroup = groups.find((g) => g.required && (sel[g.id]?.length ?? 0) === 0);

  function handleAddClick() {
    if (unmetGroup) {
      groupRefs.current[unmetGroup.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setShakeId(unmetGroup.id);
      window.setTimeout(() => setShakeId(null), 600);
      return;
    }
    cart.add(item, qty, selections);
    navigator.vibrate?.(12);
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
            <ItemMark name={item.name} className="h-20 w-20 rounded-3xl text-4xl" />
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold leading-tight text-slate-900">{item.name}</h2>
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
              <motion.div
                key={g.id}
                ref={(el) => {
                  groupRefs.current[g.id] = el;
                }}
                className="mt-5"
                animate={shakeId === g.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{g.label}</h3>
                  {g.required && (
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wide transition-colors ${
                        shakeId === g.id ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      {g.selectionType === "multiple" ? "Select at least 1" : "Required"}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {g.options.map((o) => {
                    const isSelected = (sel[g.id] ?? []).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition active:scale-[0.99] ${
                          isSelected
                            ? "border-brand-600 bg-brand-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <input
                          type={g.selectionType === "single" ? "radio" : "checkbox"}
                          name={g.id}
                          checked={isSelected}
                          onChange={() => toggleOption(g, o.id)}
                          className="sr-only"
                        />
                        <span
                          className={`relative flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
                            g.selectionType === "single" ? "rounded-full" : "rounded-md"
                          } ${isSelected ? "border-brand-600" : "border-slate-300"}`}
                        >
                          <AnimatePresence>
                            {isSelected &&
                              (g.selectionType === "single" ? (
                                <motion.span
                                  key="dot"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="h-2.5 w-2.5 rounded-full bg-brand-600"
                                />
                              ) : (
                                <motion.svg
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  viewBox="0 0 12 10"
                                  className="h-2.5 w-3 fill-none stroke-brand-600"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 5l3.5 3.5L11 1.5" />
                                </motion.svg>
                              ))}
                          </AnimatePresence>
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                          {o.label}
                        </span>
                        {!!o.priceDelta && (
                          <span className="shrink-0 text-sm font-semibold text-brand-700">
                            +{sym}
                            {o.priceDelta.toFixed(2)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </motion.div>
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
            onClick={handleAddClick}
            className={`mt-6 flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold transition active:scale-[0.99] ${
              unmetGroup
                ? "bg-slate-100 text-slate-500"
                : "bg-brand-600 text-white shadow-lg shadow-brand-700/30 hover:bg-brand-700"
            }`}
          >
            <span>{unmetGroup ? `Select ${unmetGroup.label}` : "Add to cart"}</span>
            <motion.span
              key={total.toFixed(2)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {sym}
              {total.toFixed(2)}
            </motion.span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
