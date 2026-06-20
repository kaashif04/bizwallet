"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { currencySymbol } from "@/lib/format";
import type { PastOrder } from "@/lib/dashboard-demo";

export default function OrderAgain({
  orders,
  currency = "MYR",
}: {
  orders: PastOrder[];
  currency?: string;
}) {
  const router = useRouter();
  const sym = currencySymbol(currency);

  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {orders.map((o, i) => (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i }}
          className="w-64 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="flex gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={o.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl bg-brand-100 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {o.outlet}
              </p>
              <p className="truncate text-xs text-slate-500">{o.items}</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                {sym}
                {o.total.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/customer/order")}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 active:scale-[0.99]"
          >
            <RepeatIcon />
            Reorder
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function RepeatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H7a4 4 0 0 0-4 4v1" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h13a4 4 0 0 0 4-4v-1" />
    </svg>
  );
}
