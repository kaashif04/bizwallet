"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { MenuItem, VariantSelection } from "@/lib/order-types";
import type { VariantGroup } from "@/lib/menu-variants";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";
import ItemMark from "./ItemMark";
import { useSheet } from "./useSheet";

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
  const drag = useDragControls();
  useSheet(onClose);
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
        className="fixed inset-0 z-40 bg-ink-950/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-md flex-col rounded-t-sheet bg-white shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 34, stiffness: 380 }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >
        {/* Drag handle + close: the only drag target, so option lists scroll freely. */}
        <div
          className="relative flex touch-none justify-center pb-2 pt-3"
          onPointerDown={(e) => drag.start(e)}
        >
          <span className="h-1.5 w-12 rounded-full bg-slate-200" />
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close"
            className="absolute right-3 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-90"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              decoding="async"
              className="mt-1 aspect-[4/3] w-full rounded-3xl bg-slate-100 object-cover"
            />
          )}
          <div className="flex items-start gap-4 pr-10 pt-3">
            {!item.imageUrl && <ItemMark name={item.name} className="h-16 w-16 rounded-2xl text-3xl" />}
            <div className="min-w-0 flex-1">
              <h2 id="dish-title" className="text-2xl leading-tight text-slate-900">{item.name}</h2>
              {item.description && (
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              )}
              <p className="mt-1.5 text-base font-bold text-slate-900">
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
                className="mt-6"
                animate={shakeId === g.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-ink-900">{g.label}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-2xs font-bold transition-colors ${
                      shakeId === g.id
                        ? "bg-rose-50 text-rose-700"
                        : g.required
                          ? "bg-brand-50 text-brand-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {g.required
                      ? g.selectionType === "multiple" ? "Pick at least 1" : "Required"
                      : g.maxSelect && g.maxSelect > 1 ? `Up to ${g.maxSelect}` : "Optional"}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.options.map((o) => {
                    const isSelected = (sel[g.id] ?? []).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition active:scale-[0.98] ${
                          isSelected
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-100 bg-white hover:border-slate-200"
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
                          className={`relative flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                            g.selectionType === "single" ? "rounded-full" : "rounded-lg"
                          } ${isSelected ? "border-brand-500 bg-brand-500" : "border-slate-300"}`}
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
                                  className="h-2.5 w-2.5 rounded-full bg-white"
                                />
                              ) : (
                                <motion.svg
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  viewBox="0 0 12 10"
                                  className="h-2.5 w-3 fill-none stroke-white"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M1 5l3.5 3.5L11 1.5" />
                                </motion.svg>
                              ))}
                          </AnimatePresence>
                        </span>
                        <span className="min-w-0 flex-1 text-[15px] font-semibold text-slate-800">
                          {o.label}
                        </span>
                        {!!o.priceDelta && (
                          <span className="shrink-0 text-sm font-bold text-slate-600">
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

        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-800 shadow-sm transition active:scale-90 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-7 text-center text-base font-bold" aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(50, q + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-800 shadow-sm transition active:scale-90"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            className={`flex h-12 flex-1 items-center justify-between rounded-full px-5 text-[15px] font-bold transition active:scale-[0.97] ${
              unmetGroup
                ? "bg-slate-100 text-slate-600"
                : "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
            }`}
          >
            <span className="truncate">{unmetGroup ? `Choose ${unmetGroup.label}` : "Add"}</span>
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
