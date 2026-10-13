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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-white p-5"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">
            Available store credit
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-50 shadow-well">
            <WalletIcon className="h-5 w-5 text-brand-600" />
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1 text-ink-900">
          <span className="text-lg font-semibold opacity-80">
            {currencySymbol(currency)}
          </span>
          {/* Re-animates from old -> new balance whenever a top-up lands. */}
          <AnimatedNumber
            value={balance}
            decimals={2}
            className="text-5xl font-semibold tracking-[-0.03em]"
          />
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Your BizWallet store credit.
        </p>
      </div>
    </motion.div>
  );
}
