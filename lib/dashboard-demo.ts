// Fallbacks used only when the loyalty tables return nothing.

import type { LoyaltyTier } from "./loyalty";

// Mirrors the 4 default tiers seeded by
// supabase/migrations/20260621150000_loyalty_tiers.sql, so the demo path
// (Supabase unconfigured) looks identical to a fresh real database.
export const DEMO_TIERS: LoyaltyTier[] = [
  { id: "demo-member", name: "Member", points_required: 0, discount_percentage: 0, theme_color: "#94A3B8" },
  { id: "demo-silver", name: "Silver", points_required: 500, discount_percentage: 5, theme_color: "#C0C0C0" },
  { id: "demo-gold", name: "Gold", points_required: 1500, discount_percentage: 10, theme_color: "#D4AF37" },
  { id: "demo-elite", name: "Elite", points_required: 3000, discount_percentage: 15, theme_color: "#111827" },
];

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  kind: string; // 'free_item' | 'voucher'
  value: number | null;
};

// Fallback catalog shown only when Supabase isn't configured. Real rewards come
// from public.loyalty_rewards (with real UUIDs that redeem_reward accepts).
