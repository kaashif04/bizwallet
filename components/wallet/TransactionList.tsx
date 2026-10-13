"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { WalletTxn } from "@/lib/wallet-types";
import { currencySymbol } from "@/lib/format";
import { SectionTitle } from "@/components/customer/ui";

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
      <SectionTitle>History</SectionTitle>

      {txns.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-500">No transactions yet.</div>
      ) : (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
          <AnimatePresence initial={false}>
            {txns.map((t) => {
              const credit = t.type === "credit";
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      credit ? "bg-emerald-50 text-emerald-700" : "bg-ink-50 text-ink-600 shadow-well"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {credit ? <path d="M12 5v14M19 12l-7 7-7-7" /> : <path d="M12 19V5M5 12l7-7 7 7" />}
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{t.description ?? (credit ? "Top-up" : "Payment")}</p>
                    <p className="text-xs text-ink-500" suppressHydrationWarning>
                      {formatDate(t.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${credit ? "text-emerald-700" : "text-ink-900"}`}>
                      {credit ? "+" : "−"}
                      {sym}
                      {t.amount.toFixed(2)}
                    </p>
                    <p className="text-2xs tabular-nums text-ink-400">
                      Bal {sym}
                      {t.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
