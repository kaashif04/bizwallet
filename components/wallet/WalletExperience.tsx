"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WalletBalanceCard from "./WalletBalanceCard";
import TopUpPanel from "./TopUpPanel";
import TransactionList from "./TransactionList";
import PayAtCounter from "./PayAtCounter";
import type { WalletTxn } from "@/lib/wallet-types";

export default function WalletExperience({
  initialBalance,
  currency,
  initialTxns,
  topUpEnabled,
  counterPay,
}: {
  initialBalance: number;
  currency: string;
  initialTxns: WalletTxn[];
  topUpEnabled: boolean;
  counterPay: boolean;
}) {
  // Back from Billplz: ?topup=1 paid (already credited by the return route), 0 not paid.
  const [returned, setReturned] = useState<"paid" | "unpaid" | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topup");
    if (t === null) return;
    setReturned(t === "1" ? "paid" : "unpaid");
    history.replaceState(history.state, "", window.location.pathname);
  }, []);

  // Pays on Billplz's page; the wallet is credited when Billplz confirms.
  async function handleTopUp(amount: number): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.assign(data.url);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Top-up failed. Please try again." };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
    }
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {returned && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              returned === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${returned === "paid" ? "bg-emerald-500" : "bg-amber-500"}`} />
            {returned === "paid"
              ? "Top-up received. Your balance is updated."
              : "The top-up wasn't completed. Nothing was charged."}
          </motion.p>
        )}
      </AnimatePresence>
      <WalletBalanceCard balance={initialBalance} currency={currency} />
      {counterPay && <PayAtCounter balance={initialBalance} />}
      {topUpEnabled ? (
        <TopUpPanel currency={currency} onTopUp={handleTopUp} />
      ) : (
        <div className="rounded-2xl bg-white p-5">
          <h2 className="font-bold text-ink-900">Top-ups are coming soon</h2>
          <p className="mt-1 text-sm text-ink-500">
            For now, pay at the counter. Your orders still earn points.
          </p>
        </div>
      )}
      <TransactionList txns={initialTxns} currency={currency} />
    </div>
  );
}
