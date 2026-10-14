// Loyalty is per company: one card per company the member has joined.

export type Place = {
  company_id: string;
  company: string;
  joined_at: string;
  marketing_consent: boolean;
  points_balance: number | null;
  points_earned: number | null;
  tier: { name: string | null; color: string | null; discount: number | null };
  next_tier: { name: string; points_required: number } | null;
  last_visit: string | null;
  branches: { id: string; name: string; cover_url: string | null; open_now: boolean | null; pickup: boolean }[];
};

export type Reward = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  kind: string;
  value: number | null;
};

export type Voucher = {
  id: string;
  company_id: string;
  code: string;
  title: string;
  created_at: string;
  status: string; // active | used
  kind: string | null; // voucher (RM off) | free_item
  value: number | null;
  used_at: string | null;
};

// Customers know the restaurants, not the company behind them: "A1 Bistro & Kiya's
// Restaurant". Points are shared across a company, so every restaurant is named.
export function storeNames(names: string[], fallback: string): string {
  const u = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (u.length <= 1) return u[0] ?? fallback;
  if (u.length === 2) return `${u[0]} & ${u[1]}`;
  return `${u[0]}, ${u[1]} +${u.length - 2} more`;
}

export const groupBy = <T extends { company_id: string }>(rows: T[]) =>
  rows.reduce<Record<string, T[]>>((m, r) => ((m[r.company_id] ??= []).push(r), m), {});
