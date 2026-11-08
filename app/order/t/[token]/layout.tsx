import { CartProvider } from "@/components/order/cart-context";
import TableNav from "@/components/order/TableNav";
import BookingClaim from "@/components/order/BookingClaim";
import TableVisit from "@/components/order/TableVisit";

// One cart for the table's start page and its menu, so hopping between them keeps it.
export default function TableLayout({ children, params }: { children: React.ReactNode; params: { token: string } }) {
  return (
    <CartProvider storageKey={`bw_cart:t:${params.token}`}>
      <TableVisit token={params.token}>
        {children}
        <TableNav token={params.token} />
        <BookingClaim token={params.token} />
      </TableVisit>
    </CartProvider>
  );
}
