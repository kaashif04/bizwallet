"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusIcon } from "./icons";
import { currencySymbol } from "@/lib/format";
import type { PopularItem } from "@/lib/dashboard-demo";

export default function PopularNow({
  items,
  currency = "MYR",
}: {
  items: PopularItem[];
  currency?: string;
}) {
  const router = useRouter();
  const sym = currencySymbol(currency);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it, i) => (
        <motion.div
          key={it.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35 }}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="relative h-28 w-full bg-brand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.image}
              alt={it.name}
              className="h-full w-full object-cover"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => router.push("/customer/order")}
              aria-label={`Add ${it.name}`}
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg"
            >
              <PlusIcon className="h-4 w-4" />
            </motion.button>
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {it.name}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-brand-700">
              {sym}
              {it.price.toFixed(2)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
