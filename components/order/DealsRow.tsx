"use client";

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
          const ends = endsLabel(d.ends_at);
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
                  // No photo: the offer itself is the picture.
                  <span className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl bg-marple-card text-on" aria-hidden="true">
                    <span className="text-[2rem] font-extrabold leading-none tracking-[-0.03em]">{dealBadge(d).replace(/ off$/, "")}</span>
                    <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-on/80">off</span>
                  </span>
                )}
                {dineIn && !onDish && ( // on a menu it goes without saying
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-2xs font-bold text-ink-800 shadow-sm">Dine in</span>
                )}
              </span>
              <span className="mt-2.5 block px-1">
                <span className="line-clamp-2 block text-[15px] font-bold leading-snug text-ink-900">{dealTitle(d)}</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm">
                  <span className="font-bold text-brand-700">
                    {!dish && d.items.length > 1 ? "From " : ""}
                    {money(shown.price)}
                  </span>
                  <s className="text-xs text-ink-400">
                    <span className="sr-only">was </span>
                    {money(shown.regular_price)}
                  </s>
                </span>
                {ends && <span className="mt-0.5 block text-xs font-semibold text-ink-500">{ends}</span>}
              </span>
            </>
          );
          const cls = "flex h-full flex-col rounded-3xl bg-white p-2 text-left shadow-sm transition active:scale-[0.97]";
          const go = dish ? onDish && (() => onDish(dish.id)) : d.category_id && onCategory && (() => onCategory(d.category_id!));
          const link = dineIn ? scanHref : href && (dish ? `${href}?item=${dish.id}` : d.category_id ? `${href}?cat=${d.category_id}` : href);
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
