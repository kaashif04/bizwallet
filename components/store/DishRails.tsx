"use client";

import Link from "next/link";
import { currencySymbol } from "@/lib/format";
import ItemMark from "@/components/order/ItemMark";
import { SectionTitle } from "@/components/customer/ui";
import { VegMark, VegToggle, useVegOnly } from "@/components/order/Veg";

export type Dish = { id: string; name: string; price: number; image_url: string | null; times?: number; is_vegetarian?: boolean };

const money = (n: number) => `${currencySymbol("MYR")}${Number(n).toFixed(2)}`;

// "Your usuals" and "Popular here" on the restaurant's home, with the same
// Vegetarian only switch as the menu (shared on this phone).
export default function DishRails({ mine, popular, href }: { mine: Dish[]; popular: Dish[]; href: string | null }) {
  const [vegOnly, setVegOnly] = useVegOnly();
  const hasVeg = [...mine, ...popular].some((d) => d.is_vegetarian);
  const pick = (list: Dish[]) => (vegOnly && hasVeg ? list.filter((d) => d.is_vegetarian) : list);
  const usual = pick(mine);
  const pop = pick(popular);
  if (!mine.length && !popular.length) return null;

  return (
    <>
      {hasVeg && <VegToggle on={vegOnly} onChange={setVegOnly} />}
      {usual.length > 0 && <DishRail title="Your usuals" dishes={usual} href={href} mine />}
      {pop.length > 0 && <DishRail title="Popular here" dishes={pop} href={href} />}
    </>
  );
}

function DishRail({ title, dishes, href, mine }: { title: string; dishes: Dish[]; href: string | null; mine?: boolean }) {
  return (
    <section>
      <SectionTitle href={href ?? undefined} action="Order">
        {title}
      </SectionTitle>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {dishes.map((d) => {
          const card = (
            <>
              {d.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt="" className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
              ) : (
                <ItemMark name={d.name} className="aspect-square w-full rounded-2xl text-3xl" />
              )}
              <span className="mt-2 block line-clamp-2 text-sm font-bold leading-snug text-ink-900">
                {d.is_vegetarian && <VegMark className="mr-1" />}
                {d.name}
              </span>
              <span className="block text-xs text-ink-500">
                {money(d.price)}
                {mine && d.times && d.times > 1 ? ` · ordered ${d.times}×` : ""}
              </span>
            </>
          );
          return (
            <li key={d.id} className="w-32 shrink-0 snap-start">
              {href ? (
                <Link href={href} className="block transition active:scale-[0.97]">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
