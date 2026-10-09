"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItem } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";
import { useCart } from "./cart-context";
import ItemMark from "./ItemMark";

export default function MenuView({
  title,
  subtitle,
  items,
  currency,
  onItemClick,
}: {
  title: string;
  subtitle: string;
  items: MenuItem[]; // already in category display order
  currency: string;
  onItemClick: (item: MenuItem) => void;
}) {
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  );

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
      <div className="sticky top-0 z-20 border-b border-slate-200/60 bg-brand-50/90 backdrop-blur-xl">
        <div className="flex items-end justify-between gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <h1 className="min-w-0 truncate text-[1.65rem] font-semibold leading-tight text-slate-900">
            {title}
          </h1>
          <span className="mb-1 shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-brand-50">
            {subtitle}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => jumpTo(c)}
              aria-current={active === c ? "true" : undefined}
              className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active === c
                  ? "text-white"
                  : "bg-white text-slate-600 shadow-sm hover:text-slate-900"
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
      <div className="space-y-9 px-5 pb-44 pt-6">
        {categories.map((cat) => (
          <section
            key={cat}
            data-category={cat}
            ref={(el) => {
              sectionRefs.current[cat] = el;
            }}
            className="scroll-mt-32"
          >
            <h2 className="mb-3 px-1 text-xl font-semibold text-slate-900">{cat}</h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm">
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
            Nothing on the menu right now.
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
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-brand-50/60 active:bg-brand-50"
    >
      <ItemMark
        name={item.name}
        className="h-16 w-16 rounded-2xl text-[1.75rem] transition-transform duration-300 group-active:scale-95"
      />

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-slate-900">{item.name}</span>
        {item.description && (
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-slate-500">
            {item.description}
          </span>
        )}
        <span className="mt-1.5 block text-sm font-bold text-slate-900">
          {currencySymbol(currency)}
          {item.price.toFixed(2)}
        </span>
      </span>

      <span className="relative flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {count > 0 ? (
            <motion.span
              key={count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 26 }}
              className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-brand-600 px-2 text-sm font-bold text-white shadow-md shadow-brand-700/25"
              aria-label={`${count} in cart`}
            >
              {count}
            </motion.span>
          ) : (
            <motion.span
              key="add"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition-colors group-hover:bg-brand-600"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
