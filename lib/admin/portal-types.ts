// Shared types for the Owner Dashboard (/admin/dashboard/*).

export type AdminCustomer = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  walletBalance: number;
  pointsBalance: number;
  lifetimeSpent: number;
  createdAt: string;
};

export type CustomerOrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  outletName: string;
  createdAt: string;
};

export type CustomerLedgerRow = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

export type AdminCustomerDetail = {
  customer: AdminCustomer;
  orders: CustomerOrderRow[];
  ledger: CustomerLedgerRow[];
};

export type Audience = "all" | "high_points" | "inactive_30d";

export type Campaign = {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  recipientCount: number;
  createdAt: string;
};

// Kept separate from "use server" action files (which may only export async
// functions) so both the action and its form can share the type.
export type BroadcastState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type DiscountType = "percentage" | "fixed";

export type PromoCode = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit: number | null;
  timesUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PromoCodeState = {
  status: "idle" | "success" | "error";
  message?: string;
};
