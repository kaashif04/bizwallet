import { CartProvider } from "@/components/order/cart-context";
import TableNav from "@/components/order/TableNav";

// One cart for the table's start page and its menu, so hopping between them keeps it.
export default function TableLayout({ children, params }: { children: React.ReactNode; params: { token: string } }) {
  return (
    <CartProvider>
      {children}
      <TableNav token={params.token} />
    </CartProvider>
  );
}
