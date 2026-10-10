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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setShowRewards(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowRewards(true)}
        role="button"
        tabIndex={0}
        aria-label={`${points} points. Open rewards`}
        className="relative cursor-pointer overflow-hidden rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-600/30 transition active:scale-[0.99]"
      >
        {/* Playful shapes */}
        <span className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-sun-500/35" />
        <span className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-berry-500/30" />
        <span className="pointer-events-none absolute left-1/2 top-6 h-3 w-3 rounded-full bg-sun-300" />
        <span className="pointer-events-none absolute right-24 top-16 h-2 w-2 rounded-full bg-white/70" />

        <div className="relative flex items-center justify-between">
          <span className="text-sm font-bold text-brand-100">Your points</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPerks(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-brand-800 shadow-md transition active:scale-95"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tier.currentTier.theme_color }}
            />
            {tier.current}
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="relative mt-3 flex items-center gap-3">
          <motion.svg
            viewBox="0 0 20 20"
            className="h-11 w-11 text-sun-300 drop-shadow"
            fill="currentColor"
            aria-hidden="true"
            initial={{ rotate: -30, scale: 0.4 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.2 }}
          >
            <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
          </motion.svg>
          <AnimatedNumber value={points} decimals={0} className="font-display text-6xl font-semibold leading-none" />
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-50">
              {tier.nextTier ? (
                <>
                  <span className="font-extrabold text-white">{tier.pointsToNext.toLocaleString()} pts</span> to {tier.next}
                </>
              ) : (
                "Top tier. Every perk is yours."
              )}
            </span>
            <span className="font-extrabold">{progressPct}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/25">
            <motion.div
              className="h-full rounded-full bg-sun-300"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progressPct, 3)}%` }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between">
          <Link
            href="/customer/wallet"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-brand-50 underline-offset-4 hover:underline"
          >
            {sym}
            {balance.toFixed(2)} credit
          </Link>
          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-extrabold">Rewards →</span>
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
