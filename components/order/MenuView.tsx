"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItem } from "@/lib/order-types";
import { useCart } from "./cart-context";
import Price from "./Price";
import ItemMark from "./ItemMark";
import AccountChip, { type AccountState } from "./AccountChip";
import HomeButton from "./HomeButton";
import BranchLogo from "./BranchLogo";
import { VegMark } from "./Veg";

export default function MenuView({
  title,
  subtitle,
  logoUrl,
  account,
  items,
  currency,
  onItemClick,
  intro,
  filter,
  homeHref,
}: {
  homeHref?: string;
  title: string;
  subtitle: string;
  logoUrl?: string | null;
  account: AccountState;
  items: MenuItem[]; // already in category display order
  currency: string;
  onItemClick: (item: MenuItem) => void;
  intro?: React.ReactNode; // offers and best-sellers above the categories
  filter?: React.ReactNode; // the Vegetarian only switch, first thing on the menu
}) {
  // Top-level tabs (Chinese / Steamboat / Beverages) when BizPos groups the menu; none otherwise.
  const groups = useMemo(() => {
    const g = Array.from(new Set(items.map((i) => i.menuGroup ?? "Other")));
    return g.length > 1 && items.some((i) => i.menuGroup) ? g : [];
  }, [items]);
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  );
  const groupOf = (c: string) => items.find((i) => i.category === c)?.menuGroup ?? "Other";

  const [active, setActive] = useState(categories[0] ?? "");
  // A filter (Vegetarian only) can hide the highlighted category.
  useEffect(() => {
    if (!categories.includes(active)) setActive(categories[0] ?? "");
  }, [categories, active]);
  // The tab follows the section on screen; the pills show that tab's categories only.
  const tab = groups.length ? groupOf(active) : "";
  const pills = groups.length ? categories.filter((c) => groupOf(c) === tab) : categories;
  // Inside the Steamboat tab, "Steamboat · Sets" reads just "Sets".
  const label = (c: string) => (tab && c.startsWith(`${tab} · `) ? c.slice(tab.length + 3) : c);
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
      { rootMargin: `-${groups.length ? 192 : 128}px 0px -60% 0px`, threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories, groups.length]);

  // Keep the active category in view in the chip tray as the page scrolls.
  const chips = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    chips.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  function pickTab(g: string) {
    const first = categories.find((c) => groupOf(c) === g);
    if (first) jumpTo(first);
  }

  function jumpTo(cat: string) {
    setActive(cat);
    clickScrolling.current = true;
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (clickScrolling.current = false), 700);
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Sticky header + category chips */}
      <div className="sticky top-0 z-20 bg-ink-50">
        <div className="flex items-center gap-3 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {homeHref && <HomeButton href={homeHref} />}
          {/* Small phones: the name needs the room more than the logo. */}
          {logoUrl && <BranchLogo name={title} logoUrl={logoUrl} className="hidden h-11 w-11 rounded-xl min-[360px]:block" />}
          <span className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold leading-tight text-slate-900">{title}</h1>
            <span className="block truncate text-xs font-semibold text-brand-700">{subtitle}</span>
          </span>
          <AccountChip state={account} />
        </div>

        {groups.length > 0 && (
          <div role="tablist" className="mx-4 mb-2 flex gap-0.5 overflow-x-auto min-[360px]:mx-5 min-[360px]:gap-1 rounded-2xl bg-ink-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((g) => (
              <button
                key={g}
                ref={(el) => {
                  if (el && tab === g) el.scrollIntoView({ inline: "nearest", block: "nearest" });
                }}
                role="tab"
                aria-selected={tab === g}
                type="button"
                onClick={() => pickTab(g)}
                className={`flex-1 shrink-0 whitespace-nowrap rounded-xl px-1.5 py-2 text-xs font-bold min-[360px]:px-3 min-[360px]:text-sm transition-colors ${
                  tab === g ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="mx-5 mb-3 flex gap-1.5 overflow-x-auto rounded-full bg-white p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pills.map((c) => (
            <button
              key={c}
              ref={(el) => {
                chips.current[c] = el;
              }}
              type="button"
              onClick={() => jumpTo(c)}
              aria-current={active === c ? "true" : undefined}
              className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active === c
                  ? "text-on"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {active === c && (
                <motion.span
                  layoutId="menu-cat-pill"
                  className="absolute inset-0 rounded-full bg-brand-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{label(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="space-y-9 px-5 pb-44 pt-6">
        {filter}
        {intro}
        {categories.map((cat) => (
          <section
            key={cat}
            data-category={cat}
            ref={(el) => {
              sectionRefs.current[cat] = el;
            }}
            className={groups.length ? "scroll-mt-44" : "scroll-mt-28"}
          >
            <h2 className="mb-3 px-1 text-xl text-slate-900">{label(cat)}</h2>
            {(() => {
              const list = items.filter((i) => i.category === cat);
              // Photos lead where there are photos; dishes without one read better as plain rows.
              const cards = list.filter((i) => i.imageUrl).length * 2 >= list.length;
              return (
                <div className={cards ? "grid grid-cols-2 gap-3" : "divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white shadow-sm"}>
                  {list.map((item, i) => (
                    <MenuItemCard key={item.id} index={i} item={item} row={!cards} currency={currency} onClick={() => onItemClick(item)} />
                  ))}
                </div>
              );
            })()}
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
  index,
  row,
  currency,
  onClick,
}: {
  item: MenuItem;
  index: number;
  row: boolean;
  currency: string;
  onClick: () => void;
}) {
  const { lines } = useCart();
  const count = lines
    .filter((l) => l.item.id === item.id)
    .reduce((n, l) => n + l.quantity, 0);

  const soldOut = item.isAvailable === false;
  const badge = soldOut ? (
    <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-1 text-2xs font-bold text-ink-600">Sold out</span>
  ) : (
    <span className="relative flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
            className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-brand-50 px-2 text-sm font-bold text-brand-700 shadow-well"
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-on shadow-sm transition-colors group-hover:brightness-95"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
  const price = <Price price={item.price} regular={item.regularPrice} currency={currency} className="text-[15px] font-bold text-slate-900" />;
  const hint = item.freeHint && (
    <span className="mt-1 inline-block rounded-full bg-mint-100 px-2 py-0.5 text-2xs font-semibold text-mint-700">{item.freeHint}</span>
  );
  const enter = {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -40px 0px" },
    transition: { duration: 0.3, delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] as const },
  };

  if (row) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        disabled={soldOut}
        {...enter}
        className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          soldOut ? "" : "[@media(hover:hover)]:hover:bg-brand-50/60 active:bg-brand-50"
        }`}
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className={`h-16 w-16 shrink-0 rounded-2xl bg-slate-100 object-cover ${soldOut ? "opacity-50 grayscale" : ""}`} />
        )}
        <span className={`min-w-0 flex-1 ${soldOut ? "opacity-50" : ""}`}>
          <span className="block text-[15px] font-bold leading-snug text-slate-900">
            {item.vegetarian && <VegMark className="mr-1.5" />}
            {item.name}
          </span>
          {item.description && <span className="mt-0.5 block truncate text-[13px] leading-snug text-slate-500">{item.description}</span>}
          <span className="mt-1 block">{price}</span>
          {hint}
        </span>
        {badge}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={soldOut}
      {...enter}
      className={`group flex flex-col rounded-3xl bg-white p-2.5 text-left shadow-sm transition ${soldOut ? "" : "active:scale-[0.97]"}`}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className={`aspect-[4/3] w-full rounded-2xl bg-slate-100 object-cover ${soldOut ? "opacity-50 grayscale" : ""}`} />
      ) : (
        <ItemMark name={item.name} className="aspect-[4/3] w-full rounded-2xl text-4xl" />
      )}
      <span className={`mt-2.5 block min-w-0 flex-1 px-1 ${soldOut ? "opacity-50" : ""}`}>
        <span className="line-clamp-2 block text-[15px] font-bold leading-snug text-slate-900">
          {item.vegetarian && <VegMark className="mr-1.5" />}
          {item.name}
        </span>
        {item.description && <span className="mt-0.5 block truncate text-[13px] leading-snug text-slate-500">{item.description}</span>}
        {hint}
      </span>
      <span className="mt-1 flex items-center justify-between pl-1">
        {price}
        {badge}
      </span>
    </motion.button>
  );
}
