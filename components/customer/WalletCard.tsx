"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import { currencySymbol } from "@/lib/format";
import { PlusIcon, WalletIcon } from "./icons";

export default function WalletCard({
  balance,
  currency = "MYR",
}: {
  balance: number;
  currency?: string;
}) {
  function handleTopUp() {
    // TODO: open the top-up sheet / route to /customer/wallet/top-up.
    // The server-side top_up_wallet() RPC (service role) does the real credit.
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-6 text-white shadow-glass"
    >
      {/* Ambient depth */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-brand-400/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">Store Credit</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <WalletIcon className="h-5 w-5 text-white" />
          </span>
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-xl font-medium text-white/80">
            {currencySymbol(currency)}
          </span>
          <AnimatedNumber
            value={balance}
            decimals={2}
            className="text-4xl font-bold tracking-tight"
          />
        </div>

        <motion.button
          type="button"
          onClick={handleTopUp}
          whileTap={{ scale: 0.96 }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg transition"
        >
          <PlusIcon className="h-4 w-4" />
          Top Up
        </motion.button>
      </div>
    </motion.div>
  );
}
