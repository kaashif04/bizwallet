// Loyalty tier model. Thresholds are in lifetime/earned points; tweak freely.
export type Tier = { name: string; min: number };

export const TIERS: Tier[] = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 1500 },
  { name: "Elite", min: 3000 },
];

export type TierProgress = {
  points: number;
  current: string;
  next: string | null;
  pointsToNext: number;
  progress: number; // 0..1 toward the next tier
};

export function computeTierProgress(points: number): TierProgress {
  let current = TIERS[0];
  let next: Tier | null = TIERS[1] ?? null;

  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }

  if (!next) {
    return { points, current: current.name, next: null, pointsToNext: 0, progress: 1 };
  }

  const span = next.min - current.min;
  const progress = Math.min(1, Math.max(0, (points - current.min) / span));
  return {
    points,
    current: current.name,
    next: next.name,
    pointsToNext: Math.max(0, next.min - points),
    progress,
  };
}
