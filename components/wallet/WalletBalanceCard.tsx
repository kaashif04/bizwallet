"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "@/components/customer/AnimatedNumber";
import { WalletIcon } from "@/components/customer/icons";
import { currencySymbol } from "@/lib/format";

export default function WalletBalanceCard({
  balance,
  currency,
}: {
  balance: number;
  currency: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-6 text-white shadow-glass"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-brand-400/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">
            Available store credit
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <WalletIcon className="h-5 w-5 text-white" />
          </span>
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-xl font-medium text-white/80">
            {currencySymbol(currency)}
          </span>
          {/* Re-animates from old -> new balance whenever a top-up lands. */}
          <AnimatedNumber
            value={balance}
            decimals={2}
            className="text-5xl font-bold tracking-tight"
          />
        </div>

        <p className="mt-3 text-xs text-white/60">
          Use it to pay instantly at any outlet.
        </p>
      </div>
    </motion.div>
  );
}
