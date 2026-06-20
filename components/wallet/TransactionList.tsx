"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { WalletTxn } from "@/lib/wallet-types";
import { currencySymbol } from "@/lib/format";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })
  );
}

export default function TransactionList({
  txns,
  currency,
}: {
  txns: WalletTxn[];
  currency: string;
}) {
  const sym = currencySymbol(currency);

  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-semibold text-slate-500">
        Transaction history
      </h2>

      {txns.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
          No transactions yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {txns.map((t) => {
              const credit = t.type === "credit";
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      credit
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {credit ? (
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      ) : (
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      )}
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {t.description ?? (credit ? "Top-up" : "Payment")}
                    </p>
                    <p
                      className="text-xs text-slate-400"
                      suppressHydrationWarning
                    >
                      {formatDate(t.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        credit ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {sym}
                      {t.amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {sym}
                      {t.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
