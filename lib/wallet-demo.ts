import type { WalletTxn } from "./wallet-types";

// Demo ledger shown when Supabase isn't configured yet. The most recent entry's
// balanceAfter (128.50) matches the demo wallet balance for consistency.
export const DEMO_TXNS: WalletTxn[] = [
  {
    id: "demo-1",
    type: "debit",
    amount: 27.8,
    balanceAfter: 128.5,
    description: "Order #1042 · BizCafé Bistro",
    createdAt: "2026-06-19T12:30:00+08:00",
  },
  {
    id: "demo-2",
    type: "credit",
    amount: 50,
    balanceAfter: 156.3,
    description: "Top-up (demo gateway)",
    createdAt: "2026-06-18T09:15:00+08:00",
  },
  {
    id: "demo-3",
    type: "debit",
    amount: 14.0,
    balanceAfter: 106.3,
    description: "Order #1031 · BizCafé Steamboat",
    createdAt: "2026-06-16T19:05:00+08:00",
  },
  {
    id: "demo-4",
    type: "credit",
    amount: 100,
    balanceAfter: 120.3,
    description: "Top-up (demo gateway)",
    createdAt: "2026-06-14T14:20:00+08:00",
  },
  {
    id: "demo-5",
    type: "debit",
    amount: 12.9,
    balanceAfter: 20.3,
    description: "Order #1020 · BizCafé Bistro",
    createdAt: "2026-06-12T08:45:00+08:00",
  },
];
