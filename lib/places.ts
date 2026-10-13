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

export const groupBy = <T extends { company_id: string }>(rows: T[]) =>
  rows.reduce<Record<string, T[]>>((m, r) => ((m[r.company_id] ??= []).push(r), m), {});
