"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/order-types";
import ItemMark from "./ItemMark";
import { VegMark } from "./Veg";
import Price from "./Price";
import { useCart } from "./cart-context";

// Upselling from the outlet's own sales (guest_menu_suggestions): best-sellers,
// and dishes often on the same bill. No AI, just what customers here order.
export type Suggestions = { popular: string[]; pairs: Record<string, string[]> };

// Up to n dishes that go with what's in the cart: their usual partners first,
// then dishes on a deal right now, then best-sellers from categories the cart
// doesn't have yet, then (new outlets, little sales yet) the first dish of each such category.
export function goesWith(cart: MenuItem[], s: Suggestions | null, menu: Map<string, MenuItem>, n: number): MenuItem[] {
  s ??= { popular: [], pairs: {} };
  const inCart = new Set(cart.map((i) => i.id));
  const cats = new Set(cart.map((i) => i.category));
  const score = new Map<string, number>();
  for (const c of cart) (s.pairs[c.id] ?? []).forEach((p, r) => score.set(p, (score.get(p) ?? 0) + 3 - r));
  const paired = Array.from(score).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const onDeal: string[] = [];
  menu.forEach((i) => (i.regularPrice ?? 0) > i.price && onDeal.push(i.id));
  const other = s.popular.filter((id) => !cats.has(menu.get(id)?.category ?? ""));
  const firsts = new Map<string, string>();
  menu.forEach((i) => !cats.has(i.category) && !firsts.has(i.category) && firsts.set(i.category, i.id));
  return Array.from(new Set([...paired, ...onDeal, ...other, ...Array.from(firsts.values())]))
    .map((id) => menu.get(id))
    .filter((i): i is MenuItem => !!i && !inCart.has(i.id) && i.isAvailable !== false)
    .slice(0, n);
}

function Thumb({ item, className }: { item: MenuItem; className: string }) {
  return item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt="" loading="lazy" className={`${className} object-cover`} />
  ) : (
    <ItemMark name={item.name} className={`${className} text-2xl`} />
  );
}

const dealPrice = (item: MenuItem, currency: string, className: string, tag = false) => (
  <Price price={item.price} regular={item.regularPrice} currency={currency} tag={tag} className={className} />
);

// "Popular here": a swipeable row at the top of the menu.
export function PopularRow({ items, currency, onPick }: { items: MenuItem[]; currency: string; onPick: (i: MenuItem) => void }) {
  if (items.length < 3) return null;
  const photos = items.filter((i) => i.imageUrl).length * 2 >= items.length;
  return (
    <section>
      <h2 className="mb-3 px-1 text-xl text-ink-900">Popular here</h2>
      <div className="-mx-5 flex items-stretch snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) =>
          // Photos lead where there are photos; without most of them a big letter
          // square says nothing, so the row becomes compact rank cards.
          photos ? (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item)}
              className="w-36 shrink-0 snap-start text-left transition active:scale-[0.97]"
            >
              <span className="relative block">
                <Thumb item={item} className="aspect-square w-full rounded-2xl" />
                <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-2xs font-bold text-ink-800 shadow-sm">
                  #{i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-on shadow-md"
                >
                  +
                </span>
              </span>
              <span className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink-900">
                {item.vegetarian && <VegMark className="mr-1" />}
                {item.name}
              </span>
              {dealPrice(item, currency, "text-xs font-semibold text-ink-500", true)}
            </button>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item)}
              className="flex w-40 shrink-0 snap-start flex-col rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.97]"
            >
              <span className="flex items-center justify-between">
                <span className="text-2xs font-bold text-accent-700">#{i + 1}</span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-on"
                >
                  +
                </span>
              </span>
              <span className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-ink-900">
                {item.vegetarian && <VegMark className="mr-1" />}
                {item.name}
              </span>
              <span className="mt-auto block pt-1">{dealPrice(item, currency, "text-xs font-semibold text-ink-500", true)}</span>
            </button>
          )
        )}
      </div>
    </section>
  );
}

// After adding a dish: "Goes well with …", one tap to add. Sits above the cart bar.
export function PairNudge({
  item,
  after,
  currency,
  onAdd,
  onDismiss,
}: {
  item: MenuItem;
  after: string;
  currency: string;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-5"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-lg ring-1 ring-ink-100">
        <Thumb item={item} className="h-12 w-12 shrink-0 rounded-xl max-[359px]:hidden" />
        <span className="min-w-0 flex-1 max-[359px]:pl-1.5">
          <span className="block truncate text-2xs font-semibold text-ink-500">Goes well with {after}</span>
          <span className="block truncate text-sm font-bold text-ink-900">{item.name}</span>
          {dealPrice(item, currency, "text-xs font-semibold text-ink-500")}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="h-11 shrink-0 rounded-full bg-brand-600 px-4 text-sm font-bold text-on shadow-sm transition active:scale-95"
        >
          Add
        </button>
        <button type="button" onClick={onDismiss} aria-label="No thanks" className="-mr-2 h-11 w-11 shrink-0 text-ink-400">
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// In the cart: "Complete your meal", one tap each. The row holds still while you add
// (an added dish shows a tick instead of vanishing from under your thumb).
export function CartUpsell({ items, currency, onAdd }: { items: MenuItem[]; currency: string; onAdd: (i: MenuItem) => void }) {
  const { lines } = useCart();
  const [shown, setShown] = useState(items);
  useEffect(() => {
    if (!shown.length && items.length) setShown(items); // suggestions arrived after the cart opened
  }, [items, shown.length]);
  if (!shown.length) return null;
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-base font-bold text-ink-900">Complete your meal</h3>
      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shown.map((item) => {
          const added = lines.some((l) => l.item.id === item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAdd(item)}
              aria-label={`${added ? "Add another" : "Add"} ${item.name}`}
              className="flex w-56 shrink-0 items-center gap-3 rounded-2xl bg-ink-50 p-2.5 text-left shadow-well transition active:scale-[0.98]"
            >
              <Thumb item={item} className="h-12 w-12 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink-900">{item.name}</span>
                {added ? (
                  <span className="block text-xs font-bold text-accent-700">Added</span>
                ) : (
                  dealPrice(item, currency, "text-xs font-semibold text-ink-500")
                )}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-on transition-colors ${
                  added ? "bg-accent-600" : "bg-brand-600"
                }`}
              >
                {added ? (
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                ) : (
                  "+"
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
