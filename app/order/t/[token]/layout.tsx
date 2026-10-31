import { CartProvider } from "@/components/order/cart-context";

// One cart for the table's start page and its menu, so hopping between them keeps it.
export default function TableLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
