"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WalletBalanceCard from "./WalletBalanceCard";
import TopUpPanel from "./TopUpPanel";
import TransactionList from "./TransactionList";
import type { WalletTxn } from "@/lib/wallet-types";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function WalletExperience({
  initialBalance,
  currency,
  initialTxns,
  topUpEnabled,
}: {
  initialBalance: number;
  currency: string;
  initialTxns: WalletTxn[];
  topUpEnabled: boolean;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [txns, setTxns] = useState<WalletTxn[]>(initialTxns);

  function applyCredit(amount: number, newBalance: number, txnId?: string) {
    setBalance(newBalance);
    setTxns((prev) => [
      {
        id: txnId ?? newId(),
        type: "credit",
        amount,
        balanceAfter: newBalance,
        description: "Top-up (demo gateway)",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  async function handleTopUp(
    amount: number
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        const data = await res.json();
        applyCredit(amount, Number(data.new_balance), data.transaction_id);
        // Invalidate cached server renders (e.g. the dashboard) so they show
        // the new balance on the next visit.
        router.refresh();
        return { ok: true };
      }

      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error ?? "Top-up failed. Please try again." };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
    }
  }

  return (
    <div className="space-y-5">
      <WalletBalanceCard balance={balance} currency={currency} />
      {topUpEnabled ? (
        <TopUpPanel currency={currency} onTopUp={handleTopUp} />
      ) : (
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Top-ups are coming soon</h2>
          <p className="mt-1 text-sm text-slate-600">
            For now, pay at the counter. Every RM1 you spend still earns a point.
          </p>
        </div>
      )}
      <TransactionList txns={txns} currency={currency} />
    </div>
  );
}
