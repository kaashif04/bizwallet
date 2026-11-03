"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { MenuItem, VariantSelection } from "@/lib/order-types";
import type { VariantGroup } from "@/lib/menu-variants";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";
import ItemMark from "./ItemMark";
import { VegMark } from "./Veg";
import { useSheet } from "./useSheet";

// Owner defaults first. One page of choices pre-picks the first required option
// (fewest taps); the step-by-step builder asks instead, like a kiosk.
function defaultSelection(groups: VariantGroup[], ask: boolean): Record<string, string[]> {
  return Object.fromEntries(
    groups.map((g) => {
      const defaults = g.options.filter((o) => o.isDefault).map((o) => o.id);
      if (defaults.length) return [g.id, defaults];
      return [g.id, !ask && g.selectionType === "single" && g.required && g.options[0] ? [g.options[0].id] : []];
    })
  );
}

// "Choice of style" -> "Choose style"
const choose = (label: string) => {
  const rest = label.replace(/^(choice of|choose( your)?)\s+/i, "");
  return `Choose ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
};

const needLabel = (g: VariantGroup) =>
  g.required
    ? g.selectionType === "multiple" ? "Pick at least 1" : "Required"
    : g.maxSelect && g.maxSelect > 1 ? `Up to ${g.maxSelect}` : "Optional";

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
  // Two or more choices (a set: dish, side, drink…): one step at a time.
  const stepped = groups.length >= 2;
  const [sel, setSel] = useState<Record<string, string[]>>(() => defaultSelection(groups, stepped));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [qty, setQty] = useState(1);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const advance = useRef<number>();
  const [shakeId, setShakeId] = useState<string | null>(null);
  useEffect(() => () => window.clearTimeout(advance.current), []);

  const last = step === groups.length - 1;
  const current = groups[step];
  const isMet = (g: VariantGroup) => !g.required || (sel[g.id]?.length ?? 0) > 0;

  function go(to: number) {
    window.clearTimeout(advance.current);
    setDir(to > step ? 1 : -1);
    setStep(to);
    scroller.current?.scrollTo({ top: 0 });
  }

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
    // A single pick answers the step: move on, with a beat to see the tick.
    if (stepped && group.selectionType === "single" && !last) {
      window.clearTimeout(advance.current);
      advance.current = window.setTimeout(() => go(step + 1), 280);
    }
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

  const unmetGroup = groups.find((g) => !isMet(g));

  function shake(g: VariantGroup) {
    setShakeId(g.id);
    window.setTimeout(() => setShakeId(null), 600);
  }

  function handleAddClick() {
    if (unmetGroup) {
      if (stepped) {
        go(groups.indexOf(unmetGroup));
      } else {
        groupRefs.current[unmetGroup.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      shake(unmetGroup);
      return;
    }
    cart.add(item, qty, selections);
    navigator.vibrate?.(12);
    onClose();
  }

  const money = (n: number) => `${sym}${n.toFixed(2)}`;
  const totalTag = (
    <motion.span key={total.toFixed(2)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      {money(total)}
    </motion.span>
  );

  // Big photo (edge to edge) on the first look; later steps keep a small one.
  const hero = item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt={item.name} decoding="async" className="-mx-5 aspect-[4/3] w-[calc(100%+2.5rem)] max-w-none bg-slate-100 object-cover" />
  ) : null;
  const title = (
    <h2 id="dish-title" className="text-2xl leading-tight text-slate-900">
      {item.vegetarian && <VegMark className="mr-2 align-[3px]" />}
      {item.name}
    </h2>
  );

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
        aria-labelledby="dish-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-md flex-col overflow-hidden rounded-t-sheet bg-white shadow-sheet"
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
          className="absolute inset-x-0 top-0 z-10 flex touch-none justify-center pb-2 pt-3"
          onPointerDown={(e) => drag.start(e)}
        >
          <span className={`h-1.5 w-12 rounded-full ${hero && (!stepped || step === 0) ? "bg-white/80 shadow-sm" : "bg-slate-200"}`} />
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close"
            className="absolute right-3 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 active:scale-90"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div ref={scroller} className={`flex-1 overflow-y-auto overscroll-contain px-5 pb-4 ${hero && (!stepped || step === 0) ? "" : "pt-12"}`}>
          {!stepped ? (
            <>
              {hero}
              <div className="flex items-start gap-4 pr-10 pt-4">
                {!item.imageUrl && <ItemMark name={item.name} className="h-16 w-16 rounded-2xl text-3xl" />}
                <div className="min-w-0 flex-1">
                  {title}
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                  <p className="mt-1.5 text-base font-bold text-slate-900">{money(item.price)}</p>
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
                    <NeedPill g={g} alert={shakeId === g.id} />
                  </div>
                  <div className="space-y-2">
                    {g.options.map((o) => (
                      <OptionRow
                        key={o.id}
                        group={g}
                        label={o.label}
                        price={o.priceDelta ? `+${money(o.priceDelta)}` : null}
                        selected={(sel[g.id] ?? []).includes(o.id)}
                        onToggle={() => toggleOption(g, o.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              {step === 0 ? (
                <>
                  {hero}
                  <div className="flex items-start gap-4 pr-10 pt-4">
                    {!item.imageUrl && <ItemMark name={item.name} className="h-16 w-16 rounded-2xl text-3xl" />}
                    <div className="min-w-0 flex-1">
                      {title}
                      {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                      <p className="mt-1.5 text-base font-bold text-slate-900">{money(item.price)}</p>
                    </div>
                  </div>
                </>
              ) : (
                // Later steps: the dish and what's been picked so far, small.
                <div className="flex items-center gap-3 pr-10">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 object-cover" />
                  ) : (
                    <ItemMark name={item.name} className="h-12 w-12 shrink-0 rounded-xl text-xl" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-slate-900">{item.name}</p>
                    <p className="truncate text-xs text-ink-500">{selections.map((s) => s.option).join(", ") || money(item.price)}</p>
                  </div>
                </div>
              )}

              {/* Progress: one segment per choice */}
              <div className="mt-5" aria-hidden="true">
                <div className="flex gap-1.5">
                  {groups.map((g, i) => (
                    <button
                      key={g.id}
                      type="button"
                      tabIndex={-1}
                      onClick={() => i < step && go(i)}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-brand-600" : i === step ? "bg-brand-400" : "bg-ink-100"}`}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.section
                  key={current.id}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  aria-label={`Step ${step + 1} of ${groups.length}: ${current.label}`}
                >
                  <motion.div
                    className="mt-4 flex items-end justify-between gap-3"
                    animate={shakeId === current.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-500">
                        Step {step + 1} of {groups.length}
                      </p>
                      <h3 className="mt-0.5 text-xl font-bold leading-tight text-ink-900">{current.label}</h3>
                    </div>
                    <NeedPill g={current} alert={shakeId === current.id} />
                  </motion.div>

                  <div role={current.selectionType === "single" ? "radiogroup" : "group"} aria-label={current.label} className="mt-3 grid grid-cols-2 gap-2.5">
                    {current.options.map((o) => {
                      const on = (sel[current.id] ?? []).includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role={current.selectionType === "single" ? "radio" : "checkbox"}
                          aria-checked={on}
                          onClick={() => toggleOption(current, o.id)}
                          className={`relative flex min-h-[4rem] flex-col justify-center rounded-2xl border-2 p-3 text-left transition active:scale-[0.97] ${
                            on ? "border-brand-500 bg-brand-50" : "border-ink-100 bg-white"
                          }`}
                        >
                          <span className="pr-6 text-[15px] font-semibold leading-snug text-ink-900">{o.label}</span>
                          {!!o.priceDelta && <span className="mt-1 text-sm font-bold text-ink-700">+{money(o.priceDelta)}</span>}
                          <AnimatePresence>
                            {on && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                                className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-on"
                              >
                                <svg viewBox="0 0 12 10" className="h-2.5 w-3 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M1 5l3.5 3.5L11 1.5" />
                                </svg>
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {stepped && step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              aria-label="Back"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition active:scale-90"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>
          )}

          {stepped && !last ? (
            <button
              type="button"
              onClick={() => (isMet(current) ? go(step + 1) : shake(current))}
              className={`flex h-12 flex-1 items-center justify-between rounded-full px-5 text-[15px] font-bold transition active:scale-[0.97] ${
                isMet(current) ? "bg-brand-600 text-on shadow-sm hover:brightness-95" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className="truncate">
                {!isMet(current) ? choose(current.label) : (sel[current.id]?.length ?? 0) === 0 ? "Skip" : "Next"}
              </span>
              {totalTag}
            </button>
          ) : (
            <>
              {!stepped && (
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
              )}

              <button
                type="button"
                onClick={handleAddClick}
                className={`flex h-12 flex-1 items-center justify-between rounded-full px-5 text-[15px] font-bold transition active:scale-[0.97] ${
                  unmetGroup ? "bg-slate-100 text-slate-600" : "bg-brand-600 text-on shadow-sm hover:brightness-95"
                }`}
              >
                <span className="truncate">{unmetGroup ? choose(unmetGroup.label) : "Add"}</span>
                {totalTag}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

function NeedPill({ g, alert }: { g: VariantGroup; alert: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold transition-colors ${
        alert ? "bg-rose-50 text-rose-700" : g.required ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {needLabel(g)}
    </span>
  );
}

function OptionRow({
  group,
  label,
  price,
  selected,
  onToggle,
}: {
  group: VariantGroup;
  label: string;
  price: string | null;
  selected: boolean;
  onToggle: () => void;
}) {
  const single = group.selectionType === "single";
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition active:scale-[0.98] ${
        selected ? "border-brand-500 bg-brand-50" : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <input type={single ? "radio" : "checkbox"} name={group.id} checked={selected} onChange={onToggle} className="sr-only" />
      <span
        className={`relative flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
          single ? "rounded-full" : "rounded-lg"
        } ${selected ? "border-brand-500 bg-brand-500" : "border-slate-300"}`}
      >
        <AnimatePresence>
          {selected &&
            (single ? (
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
      <span className="min-w-0 flex-1 text-[15px] font-semibold text-slate-800">{label}</span>
      {price && <span className="shrink-0 text-sm font-bold text-slate-600">{price}</span>}
    </label>
  );
}
