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

export type OwnerMenuItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
};

export type OwnerOutlet = { id: string; name: string; address: string | null };

// Shape accepted by menu_items updates.
export type MenuPatch = Partial<{
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_available: boolean;
}>;
