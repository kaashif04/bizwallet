"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import RewardsCatalog from "./RewardsCatalog";
import PerksModal from "./PerksModal";
import { PlusIcon } from "./icons";
import { currencySymbol } from "@/lib/format";
import { computeTierProgress, tierGradient, type LoyaltyTier } from "@/lib/loyalty";
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
  const gradient = tierGradient(tier.currentTier.name);
  const progressPct = Math.round(tier.progress * 100);

  const r = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setShowRewards(true)}
        role="button"
        tabIndex={0}
        className={`relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-glass transition-colors duration-700`}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.10)_48%,transparent_62%)]" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
              <span className="text-sm font-medium text-white/70">Store Credit</span>
            </div>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-lg font-medium text-white/80">{sym}</span>
              <AnimatedNumber
                value={balance}
                decimals={2}
                className="text-4xl font-bold tracking-tight"
              />
            </div>

            <Link
              href="/customer/wallet"
              onClick={(e) => e.stopPropagation()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-lg transition active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              Top Up
            </Link>
          </div>

          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
              />
              {/* Decorative reveal ring around the spendable balance — not a
                  progress indicator; tier progress lives in the bar below. */}
              <motion.circle
                cx="32"
                cy="32"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none">{points}</span>
              <span className="text-[10px] text-white/70">pts</span>
            </div>
          </div>
        </div>

        <div className="relative mt-5 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPerks(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm transition active:scale-95"
          >
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white/40"
              style={{ backgroundColor: tier.currentTier.theme_color }}
            />
            <span className="text-sm font-bold text-white">{tier.current} Tier</span>
            <span className="text-white/60">›</span>
          </button>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>
                {tier.nextTier ? (
                  <>
                    <span className="font-semibold text-white">
                      {tier.pointsToNext.toLocaleString()} pts
                    </span>{" "}
                    to unlock {tier.next} Tier
                  </>
                ) : (
                  "Top tier unlocked. Every perk is yours."
                )}
              </span>
              <span className="font-semibold text-white">{progressPct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <span className="mt-3 block text-right text-xs font-semibold text-white/80">
            View rewards →
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
