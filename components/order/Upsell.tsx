"use client";

import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";
import ItemMark from "./ItemMark";

// Upselling from the outlet's own sales (guest_menu_suggestions): best-sellers,
// and dishes often on the same bill. No AI, just what customers here order.
export type Suggestions = { popular: string[]; pairs: Record<string, string[]> };

// Up to n dishes that go with what's in the cart: their usual partners first,
// then best-sellers from categories the cart doesn't have yet, then (new outlets,
// little sales yet) the first dish of each such category.
export function goesWith(cart: MenuItem[], s: Suggestions | null, menu: Map<string, MenuItem>, n: number): MenuItem[] {
  s ??= { popular: [], pairs: {} };
  const inCart = new Set(cart.map((i) => i.id));
  const cats = new Set(cart.map((i) => i.category));
  const score = new Map<string, number>();
  for (const c of cart) (s.pairs[c.id] ?? []).forEach((p, r) => score.set(p, (score.get(p) ?? 0) + 3 - r));
  const paired = Array.from(score).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const other = s.popular.filter((id) => !cats.has(menu.get(id)?.category ?? ""));
  const firsts = new Map<string, string>();
  menu.forEach((i) => !cats.has(i.category) && !firsts.has(i.category) && firsts.set(i.category, i.id));
  return Array.from(new Set([...paired, ...other, ...Array.from(firsts.values())]))
    .map((id) => menu.get(id))
    .filter((i): i is MenuItem => !!i && !inCart.has(i.id))
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

const price = (item: MenuItem, currency: string) => `${currencySymbol(currency)}${item.price.toFixed(2)}`;

// "Popular here": a swipeable row at the top of the menu.
export function PopularRow({ items, currency, onPick }: { items: MenuItem[]; currency: string; onPick: (i: MenuItem) => void }) {
  if (items.length < 3) return null;
  return (
    <section>
      <h2 className="mb-3 px-1 text-xl text-ink-900">Popular here</h2>
      <div className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
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
            <span className="mt-2 block truncate text-sm font-bold text-ink-900">{item.name}</span>
            <span className="block text-xs font-semibold text-ink-500">{price(item, currency)}</span>
          </button>
        ))}
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
      className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-5"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-lg ring-1 ring-ink-100">
        <Thumb item={item} className="h-12 w-12 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2xs font-semibold text-ink-500">Goes well with {after}</span>
          <span className="block truncate text-sm font-bold text-ink-900">
            {item.name} · {price(item, currency)}
          </span>
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="h-9 shrink-0 rounded-full bg-brand-600 px-4 text-sm font-bold text-on shadow-sm transition active:scale-95"
        >
          Add
        </button>
        <button type="button" onClick={onDismiss} aria-label="No thanks" className="-mr-1 h-9 w-7 shrink-0 text-ink-400">
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// In the cart: "Add to your order", one tap each.
export function CartUpsell({ items, currency, onAdd }: { items: MenuItem[]; currency: string; onAdd: (i: MenuItem) => void }) {
  if (!items.length) return null;
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Add to your order</h3>
      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item)}
            className="flex w-56 shrink-0 items-center gap-3 rounded-2xl bg-ink-50 p-2.5 text-left shadow-well transition active:scale-[0.98]"
          >
            <Thumb item={item} className="h-12 w-12 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink-900">{item.name}</span>
              <span className="block text-xs font-semibold text-ink-500">{price(item, currency)}</span>
            </span>
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-on">
              +
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
