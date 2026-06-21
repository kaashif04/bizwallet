export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderItem = {
  name?: string;
  quantity?: number;
  qty?: number;
  unit_price?: number;
};

export type OwnerOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  notes: string | null;
  paymentMethod: string | null;
};

export type OwnerOutlet = { id: string; name: string; address: string | null };
