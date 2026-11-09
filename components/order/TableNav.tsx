"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./cart-context";

const icons = {
  menu: "M5 4v7a2 2 0 0 0 2 2v7M9 4v7M7 4v3M15 20V4c-2 1-3 4-3 7s1 3 3 3M19 4v16",
  home: "M4 11l8-7 8 7M6 10v9h4v-5h4v5h4v-9",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  play: "M5 19h14M7 15h10M9 11h6M11 7h2",
};

// The table's bottom bar: Home (where the QR lands: every button, the waiter,
// the bill, feedback), Menu, a raised Cart, Bill, Play. On every tab, so no tab is a dead end.
export default function TableNav({ token }: { token: string }) {
  const path = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const base = `/order/t/${token}`;
  const menu = `${base}/menu`;
  if (![base, menu, `${base}/bill`, `${base}/play`].includes(path)) return null;

  // Empty cart: the button just takes you to the menu to fill it.
  const openCart = () =>
    path === menu
      ? totalItems > 0
        ? window.dispatchEvent(new Event("bw:cart"))
        : window.scrollTo({ top: 0, behavior: "smooth" })
      : router.push(totalItems > 0 ? `${menu}?cart=1` : menu);
  const tab = (href: string, label: string, icon: keyof typeof icons) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-2xs font-semibold transition active:scale-90 ${
        path === href ? "bg-brand-50 text-brand-700" : "text-ink-500"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={icons[icon]} />
      </svg>
      {label}
    </Link>
  );

  return (
    <nav
      aria-label="Table"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-1 rounded-full bg-white px-2.5 py-2 shadow-lg">
        {tab(base, "Home", "home")}
        {tab(menu, "Menu", "menu")}
        <button
          type="button"
          onClick={openCart}
          aria-label={`Cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
          className="relative -mt-9 mx-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-on shadow-lg ring-4 ring-ink-50 transition active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01" />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand-700 shadow-sm">
              {totalItems}
            </span>
          )}
        </button>
        {tab(`${base}/bill`, "Bill", "bill")}
        {tab(`${base}/play`, "Play", "play")}
      </div>
    </nav>
  );
}
