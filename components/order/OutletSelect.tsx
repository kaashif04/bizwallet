"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Outlet } from "@/lib/order-types";

export default function OutletSelect({
  outlets,
  onSelect,
}: {
  outlets: Outlet[];
  onSelect: (o: Outlet) => void;
}) {
  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-5">
      <div className="flex items-center gap-3">
        <Link
          href="/customer/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Back to dashboard"
        >
          <span className="text-lg">←</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5"
      >
        <p className="text-sm font-medium text-brand-600">Start an order</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Choose an outlet</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pick where you&apos;d like to dine or pick up.
        </p>
      </motion.div>

      <div className="mt-6 space-y-4">
        {outlets.map((o, i) => (
          <motion.button
            key={o.id}
            type="button"
            onClick={() => onSelect(o)}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="flex w-full items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-3xl">
              {o.emoji ?? "🏪"}
            </span>
            <span className="min-w-0 flex-1">
              {o.kind && (
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                  {o.kind}
                </span>
              )}
              <span className="block truncate text-base font-semibold text-slate-900">
                {o.name}
              </span>
              {o.address && (
                <span className="block truncate text-sm text-slate-500">
                  {o.address}
                </span>
              )}
            </span>
            <span className="text-slate-300">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
