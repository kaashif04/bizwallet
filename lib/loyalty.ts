// Loyalty tier model — driven by the real public.loyalty_tiers table, not a
// hardcoded ladder. Tier is determined by lifetime points (points_earned),
// never the spendable points_balance, so redeeming a reward can never make a
// user appear to lose status.

import { formatPercent } from "./format";

export type LoyaltyTier = {
  id: string;
  name: string;
  points_required: number;
  discount_percentage: number;
  theme_color: string;
};

export type TierProgress = {
  points: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  current: string; // currentTier.name — kept as a plain string for simple display
  next: string | null; // nextTier?.name ?? null
  pointsToNext: number;
  progress: number; // 0..1 toward the next tier
};

// Used only if the loyalty_tiers fetch ever comes back empty (RLS/config
// issue) so the UI degrades gracefully instead of crashing.
const FALLBACK_TIER: LoyaltyTier = {
  id: "fallback-member",
  name: "Member",
  points_required: 0,
  discount_percentage: 0,
  theme_color: "#94A3B8",
};

export function computeTierProgress(
  tiers: LoyaltyTier[],
  lifetimePoints: number
): TierProgress {
  const sorted =
    tiers.length > 0
      ? [...tiers].sort((a, b) => a.points_required - b.points_required)
      : [FALLBACK_TIER];

  let current = sorted[0];
  let next: LoyaltyTier | null = sorted[1] ?? null;

  for (let i = 0; i < sorted.length; i++) {
    if (lifetimePoints >= sorted[i].points_required) {
      current = sorted[i];
      next = sorted[i + 1] ?? null;
    }
  }

  if (!next) {
    return {
      points: lifetimePoints,
      currentTier: current,
      nextTier: null,
      current: current.name,
      next: null,
      pointsToNext: 0,
      progress: 1,
    };
  }

  const span = next.points_required - current.points_required;
  const progress = Math.min(
    1,
    Math.max(0, (lifetimePoints - current.points_required) / span)
  );
  return {
    points: lifetimePoints,
    currentTier: current,
    nextTier: next,
    current: current.name,
    next: next.name,
    pointsToNext: Math.max(0, next.points_required - lifetimePoints),
    progress,
  };
}

// Tailwind classes must appear as full literal strings somewhere under a
// content glob (see tailwind.config.ts) for the JIT compiler to generate
// them — this map is that literal source, keyed by tier name so an admin
// renaming/adding a tier degrades to DEFAULT_TIER_GRADIENT instead of
// silently rendering with no background.
const TIER_GRADIENTS: Record<string, string> = {
  member: "from-slate-500 via-slate-700 to-slate-900",
  silver: "from-slate-300 via-slate-500 to-slate-700",
  gold: "from-amber-400 via-yellow-600 to-amber-800",
  elite: "from-neutral-900 via-zinc-900 to-amber-600",
};
const DEFAULT_TIER_GRADIENT = "from-brand-600 via-brand-800 to-slate-900";

export function tierGradient(tierName: string): string {
  return TIER_GRADIENTS[tierName.toLowerCase()] ?? DEFAULT_TIER_GRADIENT;
}

// Perks copy, derived entirely from real loyalty_tiers columns (no
// fabricated benefits) — discount_percentage, points_required, and the
// tier's rank among its siblings.
export function tierPerks(tier: LoyaltyTier, allTiers: LoyaltyTier[]): string[] {
  const sorted =
    allTiers.length > 0
      ? [...allTiers].sort((a, b) => a.points_required - b.points_required)
      : [FALLBACK_TIER];
  const rank = sorted.findIndex((t) => t.id === tier.id);
  const isTop = rank === -1 || rank === sorted.length - 1;

  const perks: string[] = [];

  if (tier.discount_percentage > 0) {
    perks.push(`Enjoy an automatic ${formatPercent(tier.discount_percentage)}% off all orders`);
  } else {
    perks.push("Earn loyalty points automatically on every order");
  }

  perks.push(
    tier.points_required > 0
      ? `Unlocked by reaching ${tier.points_required.toLocaleString()} lifetime points`
      : "Your status from the moment you join — no points needed"
  );

  if (isTop) {
    perks.push("Our highest tier — you've unlocked every perk we offer");
  } else {
    const next = sorted[rank + 1];
    if (next) {
      perks.push(`Keep earning to reach ${next.name} and unlock even more savings`);
    }
  }

  return perks;
}
