"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { currencySymbol } from "@/lib/format";
import ItemMark from "@/components/order/ItemMark";

export type RecentOrder = {
  id: string;
  outlet: string;
  items: string;
  total: number;
  href: string;
  date: string;
};

export default function OrderAgain({
  orders,
  currency = "MYR",
}: {
  orders: RecentOrder[];
  currency?: string;
}) {
  const sym = currencySymbol(currency);

  return (
    <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {orders.map((o, i) => (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
          className="w-64 shrink-0 snap-start"
        >
          <Link
            href={o.href}
            className="flex gap-3 rounded-2xl bg-white p-4 transition hover:shadow-md active:scale-[0.98]"
          >
            <ItemMark name={o.items} className="h-14 w-14 rounded-2xl text-2xl" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">{o.items}</span>
              <span className="block truncate text-xs text-ink-500">
                {o.outlet} · {new Date(o.date).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short" })}
              </span>
              <span className="mt-1 block text-sm font-bold text-ink-900">
                {sym}
                {o.total.toFixed(2)}
              </span>
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
