"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Outlet } from "@/lib/order-types";
import { currencySymbol } from "@/lib/format";

export default function OrderConfirmation({
  outlet,
  currency,
  ticketId,
  orderId,
  total,
  pointsEarned,
  onDone,
}: {
  outlet: Outlet;
  currency: string;
  ticketId?: string;
  orderId?: string;
  total: number;
  pointsEarned?: number;
  onDone: () => void;
}) {
  const sym = currencySymbol(currency);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 220 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-12 w-12 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-2xl font-bold text-slate-900"
      >
        Order placed!
      </motion.h1>
      <p className="mt-2 text-sm text-slate-500">
        Sent to <span className="font-semibold text-slate-700">{outlet.name}</span>
        &apos;s kitchen.
      </p>
      {ticketId && (
        <p className="mt-1 text-sm text-slate-500">
          Ticket{" "}
          <span className="font-mono font-semibold text-slate-800">{ticketId}</span>
        </p>
      )}
      <p className="mt-4 text-3xl font-bold text-brand-700">
        {sym}
        {total.toFixed(2)}
      </p>
      {pointsEarned ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
          +{pointsEarned} loyalty points
        </p>
      ) : null}

      <div className="mt-8 w-full space-y-3">
        {orderId && (
          <Link
            href={`/customer/orders/${orderId}`}
            className="block w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
          >
            Track order
          </Link>
        )}
        <button
          type="button"
          onClick={onDone}
          className={`w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition active:scale-[0.99] ${
            orderId
              ? "border border-slate-200 bg-white text-slate-700"
              : "bg-brand-600 text-white shadow-lg"
          }`}
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}
