"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { MenuItem, Outlet } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";

const CATEGORY_ORDER = ["Mains", "Drinks", "Add-ons"];
function orderIndex(c: string): number {
  const i = CATEGORY_ORDER.indexOf(c);
  return i === -1 ? 99 : i;
}

export default function MenuView({
  outlet,
  items,
  currency,
  onChangeOutlet,
  onItemClick,
}: {
  outlet: Outlet;
  items: MenuItem[];
  currency: string;
  onChangeOutlet: () => void;
  onItemClick: (item: MenuItem) => void;
}) {
  const categories = useMemo(() => {
    const set = Array.from(new Set(items.map((i) => i.category)));
    return set.sort((a, b) => orderIndex(a) - orderIndex(b));
  }, [items]);

  const [active, setActive] = useState(categories[0] ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const clickScrolling = useRef(false);

  // Scroll-spy: highlight the category nearest the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target as HTMLElement | undefined;
        if (top?.dataset.category) setActive(top.dataset.category);
      },
      { rootMargin: "-128px 0px -60% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  function jumpTo(cat: string) {
    setActive(cat);
    clickScrolling.current = true;
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (clickScrolling.current = false), 700);
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Sticky header + category chips */}
      <div className="sticky top-0 z-20 bg-brand-50/85 backdrop-blur-lg">
        <div className="flex items-center gap-3 px-5 pb-3 pt-5">
          <button
            type="button"
            onClick={onChangeOutlet}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Change outlet"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-600">{outlet.kind ?? "Outlet"}</p>
            <h1 className="truncate text-lg font-bold text-slate-900">{outlet.name}</h1>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => jumpTo(c)}
              className={`relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === c
                  ? "text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {active === c && (
                <motion.span
                  layoutId="menu-cat-pill"
                  className="absolute inset-0 rounded-full bg-brand-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-7 px-5 pb-44 pt-4">
        {categories.map((cat) => (
          <section
            key={cat}
            data-category={cat}
            ref={(el) => {
              sectionRefs.current[cat] = el;
            }}
            className="scroll-mt-32"
          >
            <h2 className="mb-3 text-base font-bold text-slate-900">{cat}</h2>
            <div className="space-y-3">
              {items
                .filter((i) => i.category === cat)
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    currency={currency}
                    onClick={() => onItemClick(item)}
                  />
                ))}
            </div>
          </section>
        ))}

        {items.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">
            No items available for this outlet yet.
          </p>
        )}
      </div>
    </div>
  );
}

function MenuItemCard({
  item,
  currency,
  onClick,
}: {
  item: MenuItem;
  currency: string;
  onClick: () => void;
}) {
  const { lines } = useCart();
  const count = lines
    .filter((l) => l.item.id === item.id)
    .reduce((n, l) => n + l.quantity, 0);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
    >
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-3xl">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          item.emoji ?? "🍽️"
        )}
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
            {count}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">
          {item.name}
        </span>
        {item.description && (
          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">
            {item.description}
          </span>
        )}
        <span className="mt-1 block text-sm font-semibold text-brand-700">
          {currencySymbol(currency)}
          {item.price.toFixed(2)}
        </span>
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg leading-none text-white shadow-sm">
        +
      </span>
    </motion.button>
  );
}
