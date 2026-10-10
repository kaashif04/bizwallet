"use client";

import { motion } from "framer-motion";
import { tierPerks, type LoyaltyTier } from "@/lib/loyalty";

export default function PerksModal({
  tier,
  allTiers,
  onClose,
}: {
  tier: LoyaltyTier;
  allTiers: LoyaltyTier[];
  onClose: () => void;
}) {
  const perks = tierPerks(tier, allTiers);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="px-5 pb-8 pt-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-inner"
              style={{ backgroundColor: tier.theme_color }}
            >
              {tier.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Your status
              </p>
              <h2 className="text-lg font-bold text-slate-900">{tier.name} Tier</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {perks.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm text-mint-700">
                  ✓
                </span>
                <p className="text-sm font-medium leading-snug text-slate-700">{perk}</p>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </>
  );
}
