"use client";

import { useEffect, useState } from "react";
import { currencySymbol } from "@/lib/format";
import { dealBadge, dealTitle, type Deal } from "@/lib/deals";
import { endsLabel } from "@/lib/hours";
import { SectionTitle } from "@/components/customer/ui";

const money = (n: number) => `${currencySymbol("MYR")}${Number(n).toFixed(2)}`;

// Grab-style "Deals" row: one card per running deal. A dish deal opens the dish; a category
// deal jumps to its category. On the menu that's onDish/onCategory; on the restaurant
// home it's a link to the pickup menu (?item= / ?cat=), or for dine-in-only dishes
// (steamboat sets) to the table scanner, or nothing when it can't take orders.
export default function DealsRow({
  deals,
  href,
  scanHref,
  onDish,
  onCategory,
}: {
  deals: Deal[];
  href?: string | null;
  scanHref?: string | null;
  onDish?: (id: string) => void;
  onCategory?: (id: string) => void;
}) {
  if (!deals.length) return null;
  return (
    <section>
      <SectionTitle>Deals</SectionTitle>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {deals.map((d) => {
          const dish = d.menu_item_id ? d.items.find((i) => i.id === d.menu_item_id) ?? d.items[0] : null;
          // A category deal leads with its cheapest dish (and a photo, if any has one).
          const cheapest = [...d.items].sort((a, b) => a.price - b.price)[0];
          const shown = dish ?? cheapest;
          const photo = dish?.image_url ?? d.items.find((i) => i.image_url)?.image_url ?? null;
          const dineIn = d.items.every((i) => i.dine_in_only);
          const card = (
            <>
              <span className="relative block">
                {photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-2xl bg-ink-100 object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-on shadow-sm">{dealBadge(d)}</span>
                  </>
                ) : (
                  // No photo: the offer itself is the picture. A soft tint, not the gradient:
                  // the points card owns that, and three gradient blocks in a row shout.
                  <span className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" aria-hidden="true">
                    <span className="text-[2rem] font-extrabold leading-none tracking-[-0.03em]">{dealBadge(d).replace(/ off$/, "")}</span>
                    <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700/80">off</span>
                  </span>
                )}
                {dineIn && scanHref !== undefined && ( // on a menu or at a table it goes without saying
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-2xs font-bold text-ink-800 shadow-sm">Dine in</span>
                )}
              </span>
              <span className="mt-2.5 block px-1">
                <span className="line-clamp-2 block text-[15px] font-bold leading-snug text-ink-900">{dealTitle(d)}</span>
                <span className="mt-1 flex items-baseline gap-x-1.5 overflow-hidden whitespace-nowrap text-sm tabular-nums">
                  <span className="font-bold text-brand-700">
                    {!dish && d.items.length > 1 ? "From " : ""}
                    {money(shown.price)}
                  </span>
                  {/* "From RM24.40" plus a struck price doesn't fit a card; the badge already says the saving. */}
                  {(dish || d.items.length === 1) && (
                    <s className="text-xs text-ink-500">
                      <span className="sr-only">was </span>
                      {money(shown.regular_price)}
                    </s>
                  )}
                </span>
                <Ends at={d.ends_at} />
              </span>
            </>
          );
          const cls = "flex h-full flex-col rounded-3xl bg-white p-2 text-left shadow-sm transition active:scale-[0.97]";
          const go = dish ? onDish && (() => onDish(dish.id)) : d.category_id && onCategory && (() => onCategory(d.category_id!));
          const link = dineIn && scanHref !== undefined ? scanHref : href && (dish ? `${href}?item=${dish.id}` : d.category_id ? `${href}?cat=${d.category_id}` : href);
          return (
            <li key={d.id} className="w-44 shrink-0 snap-start">
              {go ? (
                <button type="button" onClick={go} className={`${cls} w-full`}>
                  {card}
                </button>
              ) : link ? (
                <a href={link} className={cls}>
                  {card}
                </a>
              ) : (
                <div className="block h-full rounded-3xl bg-white p-2 shadow-sm">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// "Ends 31 Dec"; in its last 6 hours a live "Ends in 1h 42m", in crimson. Ticks every 30s
// (a ticking seconds counter would be noise on a menu).
function Ends({ at }: { at: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  const left = at ? new Date(at).getTime() - now : Infinity;
  const live = left > 0 && left < 6 * 3_600_000;
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [live]);
  if (!at) return null;
  if (!live) {
    const label = endsLabel(at);
    return label ? <span className="mt-0.5 block text-xs font-semibold text-ink-500">{label}</span> : null;
  }
  const mins = Math.max(1, Math.ceil(left / 60_000));
  const text = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return <span className="mt-0.5 block text-xs font-bold tabular-nums text-brand-700">Ends in {text}</span>;
}
