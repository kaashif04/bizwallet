"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  onItemOpen,
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
  onItemClick: (item: MenuItem) => void; // the + button: quick add
  onItemOpen: (item: MenuItem) => void; // the card itself: photo, description, quantity
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

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // Inside the Steamboat menu, "Steamboat · Sets" reads just "Sets".
  const label = (c: string) => {
    const g = groupOf(c);
    return groups.length && c.startsWith(`${g} · `) ? c.slice(g.length + 3) : c;
  };

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
            <span className="block truncate text-xs font-semibold text-accent-700">{subtitle}</span>
          </span>
          <AccountChip state={account} />
        </div>

        <CategoryBar categories={categories} groups={groups} groupOf={groupOf} label={label} sectionRefs={sectionRefs} />
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
            {groups.length > 0 && categories.find((c) => groupOf(c) === groupOf(cat)) === cat && (
              <GroupBanner name={groupOf(cat)} />
            )}
            <h2 className="mb-3 px-1 text-xl text-slate-900">{label(cat)}</h2>
            {(() => {
              const list = items.filter((i) => i.category === cat);
              // Photos lead where there are photos; dishes without one read better as plain rows.
              const cards = list.filter((i) => i.imageUrl).length * 2 >= list.length;
              return (
                <div className={cards ? "grid grid-cols-2 gap-3" : "divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white shadow-sm"}>
                  {list.map((item, i) => (
                    <MenuItemCard key={item.id} item={item} row={!cards} currency={currency} onAdd={() => onItemClick(item)} onOpen={() => onItemOpen(item)} />
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

// Where one menu starts in the long scroll.
function GroupBanner({ name }: { name: string }) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-3xl bg-accent-50 px-5 py-3.5">
      <span aria-hidden="true" className="h-10 w-1.5 shrink-0 rounded-full bg-accent-600" />
      <span className="min-w-0 text-2xl font-bold leading-tight tracking-[-0.02em] text-ink-900">{name}</span>
    </div>
  );
}

function MenuItemCard({
  item,
  row,
  currency,
  onAdd,
  onOpen,
}: {
  item: MenuItem;
  row: boolean;
  currency: string;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const { lines } = useCart();
  const count = lines
    .filter((l) => l.item.id === item.id)
    .reduce((n, l) => n + l.quantity, 0);

  const soldOut = item.isAvailable === false;
  const badge = soldOut ? (
    <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-1 text-2xs font-bold text-ink-600">Sold out</span>
  ) : (
    <button
      type="button"
      onClick={onAdd}
      aria-label={count ? `Add another ${item.name}, ${count} in cart` : `Add ${item.name}`}
      className="pointer-events-auto relative z-10 flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center rounded-full transition active:scale-90"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
            className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-brand-50 px-2 text-sm font-bold text-brand-700 shadow-well"
          >
            {count}
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-on shadow-sm transition-colors [@media(hover:hover)]:hover:brightness-95"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
  // The whole card opens the dish (big photo, full description, quantity); the + adds one.
  // Content ignores taps so they land on this button; only the + sits above it.
  const open = (
    <button type="button" onClick={onOpen} disabled={soldOut} aria-label={item.name} className={`open pointer-events-auto absolute inset-0 ${row ? "" : "rounded-3xl"}`} />
  );
  // On a deal: "-26%" on the photo (cards), "Save RM5" beside the price (rows and cards without a photo).
  const pct = item.regularPrice && item.regularPrice > item.price ? Math.round((1 - item.price / item.regularPrice) * 100) : 0;
  const ribbon = !row && !!item.imageUrl && pct > 0;
  const price = <Price price={item.price} regular={item.regularPrice} currency={currency} tag={!ribbon} className="text-[15px] font-bold text-slate-900" />;
  const hint = item.freeHint && (
    <span className="mt-1 inline-block rounded-full bg-mint-100 px-2 py-0.5 text-2xs font-semibold text-mint-700">{item.freeHint}</span>
  );
  if (row) {
    return (
      <div
        className={`pointer-events-none relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          soldOut ? "" : "[@media(hover:hover)]:has-[.open:hover]:bg-brand-50/60 has-[.open:active]:bg-brand-50"
        }`}
      >
        {open}
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
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none relative flex flex-col rounded-3xl bg-white p-2.5 text-left shadow-sm transition ${soldOut ? "" : "has-[.open:active]:scale-[0.97]"}`}
    >
      {open}
      {item.imageUrl ? (
        <span className="relative block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className={`aspect-[4/3] w-full rounded-2xl bg-slate-100 object-cover ${soldOut ? "opacity-50 grayscale" : ""}`} />
          {ribbon && !soldOut && (
            <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold tabular-nums text-on shadow-sm">
              <span className="sr-only">Deal, </span>-{pct}%
            </span>
          )}
        </span>
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
    </div>
  );
}

// Scroll a tab to the middle of its own row, leaving the page alone.
function center(el: HTMLElement | null | undefined) {
  const row = el?.parentElement;
  if (!el || !row) return;
  const r = el.getBoundingClientRect();
  const p = row.getBoundingClientRect();
  row.scrollLeft += r.left - p.left - (p.width - r.width) / 2;
}

// Menu tabs + category chips. Its own component so the highlight changing re-renders
// only this bar, never the dish cards below (that re-render was the stutter).
//
// The pill is driven by the scroll itself: while the next section rises under the
// header (the last GLIDE px) it slides chip to chip in step with the finger, and the
// tray scrolls with it. Positions are measured once (and on resize / images loading),
// so a frame only reads scrollY and writes transforms. White labels sit on a copy of
// the row clipped to the pill, so text turns white exactly at its edge.
function CategoryBar({
  categories,
  groups,
  groupOf,
  label,
  sectionRefs,
}: {
  categories: string[];
  groups: string[];
  groupOf: (c: string) => string;
  label: (c: string) => string;
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}) {
  const [active, setActive] = useState(categories[0] ?? "");
  const tab = groups.length ? groupOf(active) : "";
  const pills = groups.length ? categories.filter((c) => groupOf(c) === tab) : categories;
  const tray = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const pillText = useRef<HTMLSpanElement>(null);
  const chips = useRef<Record<string, HTMLButtonElement | null>>({});
  const m = useRef({ tops: [] as number[], end: 0, chip: {} as Record<string, [number, number]>, trayW: 0 });

  const measure = useRef(() => {});
  measure.current = () => {
    const y = window.scrollY;
    m.current.tops = categories.map((c) => (sectionRefs.current[c]?.getBoundingClientRect().top ?? Infinity) + y);
    m.current.end = document.documentElement.scrollHeight - window.innerHeight - 2;
    m.current.chip = {};
    for (const c of pills) {
      const el = chips.current[c];
      if (el) m.current.chip[c] = [el.offsetLeft, el.offsetWidth];
    }
    m.current.trayW = tray.current?.clientWidth ?? 0;
  };

  const place = useRef(() => {});
  place.current = () => {
    const { tops, end, chip, trayW } = m.current;
    const y = window.scrollY;
    const line = y + (groups.length ? 192 : 128); // just under the sticky header
    const GLIDE = 96;
    let i = 0;
    while (i + 1 < tops.length && tops[i + 1] <= line) i++;
    const atEnd = y >= end; // short last sections never reach the header
    if (atEnd) i = categories.length - 1;
    const cur = categories[i];
    const next = atEnd ? undefined : categories[i + 1];
    const t = next ? Math.min(1, Math.max(0, 1 - (tops[i + 1] - line) / GLIDE)) : 0;
    if (cur !== undefined) setActive(t > 0.5 && next ? next : cur);

    const from = chip[cur ?? ""];
    const to = (next && chip[next]) || from; // next menu's chips aren't shown yet: hold
    if (!from || !to || !pill.current || !pillText.current || !tray.current) return;
    const x = from[0] + (to[0] - from[0]) * t;
    const w = from[1] + (to[1] - from[1]) * t;
    pill.current.style.transform = `translate3d(${x}px,0,0)`;
    pill.current.style.width = `${w}px`;
    pillText.current.style.transform = `translate3d(${-x}px,0,0)`;
    const left = Math.round(x + w / 2 - trayW / 2);
    if (Math.abs(tray.current.scrollLeft - left) >= 1) tray.current.scrollLeft = left;
  };

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), place.current()));
    };
    const remeasure = () => (measure.current(), frame());
    window.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", remeasure);
    // Photos, the best-sellers row and the vegetarian filter all move the sections.
    const ro = new ResizeObserver(remeasure);
    const list = Object.values(sectionRefs.current).find(Boolean)?.parentElement;
    if (list) ro.observe(list);
    return () => {
      window.removeEventListener("scroll", frame);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [categories, sectionRefs]);
  // New chips (another menu's tab, a filter): measure and place before the frame paints.
  useLayoutEffect(() => {
    measure.current();
    place.current();
  }, [tab, categories]);

  function pickTab(g: string) {
    const first = categories.find((c) => groupOf(c) === g);
    if (first) jumpTo(first);
  }
  // The page glides there and the pill rides along with it.
  function jumpTo(cat: string) {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionRefs.current[cat]?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
        {/* Menus (Chinese / Steamboat / Beverages): text tabs on an underline, so they read as
            the level above the category pills rather than a second row of pills. */}
        {groups.length > 0 && (
          <div
            role="tablist"
            aria-label="Menus"
            className="mx-4 mb-3 flex overflow-x-auto border-b border-ink-200 min-[360px]:mx-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {groups.map((g) => (
              <button
                key={g}
                ref={(el) => {
                  if (tab === g) center(el);
                }}
                role="tab"
                aria-selected={tab === g}
                type="button"
                onClick={() => pickTab(g)}
                className={`relative min-h-11 flex-1 shrink-0 whitespace-nowrap px-2 pb-2.5 pt-1 text-sm font-bold transition-colors min-[360px]:px-3 min-[360px]:text-[0.9375rem] ${
                  tab === g ? "text-ink-900" : "text-ink-500 hover:text-ink-700"
                }`}
              >
                {g}
                {tab === g && (
                  <motion.span
                    layoutId="menu-group-bar"
                    className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-accent-600"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div ref={tray} className="mx-5 mb-3 overflow-x-auto rounded-full bg-white p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative flex w-max gap-1.5">
            {pills.map((c) => (
              <button
                key={c}
                ref={(el) => {
                  chips.current[c] = el;
                }}
                type="button"
                onClick={() => jumpTo(c)}
                aria-current={active === c ? "true" : undefined}
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-slate-600 [@media(hover:hover)]:hover:text-slate-900"
              >
                {label(c)}
              </button>
            ))}
            <span ref={pill} aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-0 overflow-hidden rounded-full bg-accent-600 will-change-transform">
              <span ref={pillText} className="flex w-max gap-1.5 will-change-transform">
                {pills.map((c) => (
                  <span key={c} className="whitespace-nowrap px-4 py-2 text-sm font-semibold text-on">
                    {label(c)}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>
    </>
  );
}
