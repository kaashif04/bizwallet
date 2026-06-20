export type WalletTxn = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string; // ISO timestamp
};
