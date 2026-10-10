export type WalletTxn = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string; // ISO timestamp
};

// No payment gateway yet, so a top-up would be free money. Server-only check:
// allowed only when WALLET_TOPUP_DEMO=1 is set for local testing.
export const topUpEnabled = () => process.env.WALLET_TOPUP_DEMO === "1";
