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

// Menu tabs + category chips, in their own component so a highlight change
// re-renders only this bar, never the dish cards.
//
// Done the way Apple's category bars work: the highlight snaps to a category as its
// section reaches the header, and the pill slides there with a short CSS transition
// the GPU runs by itself. (Tracking the scroll pixel by pixel always trails the page
// on iPhone, where scrolling runs ahead of the page's code.) The chip row only moves
// when the active chip would leave view. Tapping a chip highlights it at once and
// holds it while the page glides there, rather than flicking through every category
// on the way.
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
  const chips = useRef<Record<string, HTMLButtonElement | null>>({});
  const tops = useRef<number[]>([]);
  const held = useRef(false); // a tapped chip holds until the page stops gliding
  const release = useRef(0);
  const shown = useRef({ tab: "", placed: false });

  const measure = useRef(() => {});
  measure.current = () => {
    const y = window.scrollY;
    tops.current = categories.map((c) => (sectionRefs.current[c]?.getBoundingClientRect().top ?? Infinity) + y);
  };

  // Which section sits under the header. Cheap: cached positions + scrollY only.
  const spy = useRef(() => {});
  spy.current = () => {
    const y = window.scrollY;
    const line = y + (groups.length ? 192 : 128);
    let i = 0;
    while (i + 1 < tops.current.length && tops.current[i + 1] <= line) i++;
    // Short last sections never reach the header: at the bottom, the last one is current.
    if (y >= document.documentElement.scrollHeight - window.innerHeight - 2) i = categories.length - 1;
    if (categories[i] !== undefined) setActive(categories[i]);
  };

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (held.current) {
        window.clearTimeout(release.current);
        release.current = window.setTimeout(() => ((held.current = false), spy.current()), 150);
        return;
      }
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), spy.current()));
    };
    const remeasure = () => (measure.current(), onScroll());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    // Photos, the best-sellers row and the vegetarian filter all move the sections.
    const ro = new ResizeObserver(remeasure);
    const list = Object.values(sectionRefs.current).find(Boolean)?.parentElement;
    if (list) ro.observe(list);
    measure.current();
    spy.current();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(release.current);
    };
  }, [categories, sectionRefs]);

  // Move the pill under the active chip before the frame paints. A new row of chips
  // (another menu tab) places it without sliding across from the old row.
  useLayoutEffect(() => {
    const el = chips.current[active];
    const p = pill.current;
    const row = tray.current;
    if (!el || !p || !row) return;
    const jump = !shown.current.placed || shown.current.tab !== tab;
    shown.current = { tab, placed: true };
    p.style.transition = jump ? "none" : "";
    p.style.transform = `translate3d(${el.offsetLeft}px,0,0)`;
    p.style.width = `${el.offsetWidth}px`;
    p.style.opacity = "1";
    // Keep the chip in view with room to spare; leave the row alone otherwise.
    const pad = 32;
    const l = el.offsetLeft - pad;
    const r = el.offsetLeft + el.offsetWidth + pad - row.clientWidth;
    if (l < row.scrollLeft || r > row.scrollLeft) {
      const still = jump || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      row.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - row.clientWidth / 2, behavior: still ? "auto" : "smooth" });
    }
  }, [active, tab, pills.length]);

  function pickTab(g: string) {
    const first = categories.find((c) => groupOf(c) === g);
    if (first) jumpTo(first);
  }
  function jumpTo(cat: string) {
    held.current = true;
    setActive(cat);
    // Released 150 ms after the glide stops (or at once if the page had nowhere to go).
    window.clearTimeout(release.current);
    release.current = window.setTimeout(() => ((held.current = false), spy.current()), 600);
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
            <span
              ref={pill}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-accent-600 opacity-0 shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
            />
            {pills.map((c) => (
              <button
                key={c}
                ref={(el) => {
                  chips.current[c] = el;
                }}
                type="button"
                onClick={() => jumpTo(c)}
                aria-current={active === c ? "true" : undefined}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  active === c ? "text-on" : "text-slate-600 [@media(hover:hover)]:hover:text-slate-900"
                }`}
              >
                {label(c)}
              </button>
            ))}
          </div>
        </div>
    </>
  );
}
