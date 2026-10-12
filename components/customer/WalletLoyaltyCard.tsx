"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import RewardsCatalog from "./RewardsCatalog";
import PerksModal from "./PerksModal";
import { currencySymbol } from "@/lib/format";
import { computeTierProgress, type LoyaltyTier } from "@/lib/loyalty";
import type { Reward } from "@/lib/dashboard-demo";

export default function WalletLoyaltyCard({
  balance,
  currency,
  points: initialPoints,
  lifetimePoints,
  tiers,
  rewards,
  userId,
}: {
  balance: number;
  currency: string;
  points: number; // spendable points_balance — drives the ring + redemptions
  lifetimePoints: number; // points_earned — drives tier status, never decreases
  tiers: LoyaltyTier[];
  rewards: Reward[];
  userId: string | null;
}) {
  const sym = currencySymbol(currency);
  const [points, setPoints] = useState(initialPoints);
  const [showRewards, setShowRewards] = useState(false);
  const [showPerks, setShowPerks] = useState(false);

  const tier = computeTierProgress(tiers, lifetimePoints);
  const progressPct = Math.round(tier.progress * 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setShowRewards(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowRewards(true)}
        role="button"
        tabIndex={0}
        aria-label={`${points} points. Open rewards`}
        className="cursor-pointer rounded-2xl bg-white p-5 transition hover:shadow-md active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Your points</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPerks(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-2xs font-bold text-brand-700 transition hover:bg-brand-100 active:scale-95"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.currentTier.theme_color }} />
            {tier.current}
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <AnimatedNumber
          value={points}
          decimals={0}
          className="mt-2 block text-5xl font-semibold leading-none tracking-[-0.03em] text-ink-900"
        />

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">
              {tier.nextTier ? (
                <>
                  <span className="font-bold text-ink-900">{tier.pointsToNext.toLocaleString()} pts</span> to {tier.next}
                </>
              ) : (
                "Top tier. Every perk is yours."
              )}
            </span>
            <span className="font-bold text-ink-700">{progressPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100 shadow-well">
            <motion.div
              className="h-full rounded-full bg-brand-600"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progressPct, 3)}%` }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/customer/wallet"
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl bg-ink-50 px-3 py-2.5 shadow-well transition hover:bg-ink-100"
          >
            <span className="block text-lg font-semibold tracking-[-0.025em] text-ink-900">
              {sym}
              {balance.toFixed(2)}
            </span>
            <span className="block text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Credit</span>
          </Link>
          <span className="flex items-center justify-center gap-1 rounded-full bg-brand-600 px-4 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700">
            Rewards <span aria-hidden="true">›</span>
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showRewards && (
          <RewardsCatalog
            onClose={() => setShowRewards(false)}
            points={points}
            userId={userId}
            rewards={rewards}
            onRedeemed={(nb) => setPoints(nb)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPerks && (
          <PerksModal
            tier={tier.currentTier}
            allTiers={tiers}
            onClose={() => setShowPerks(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
