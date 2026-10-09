import { CartProvider } from "@/components/order/cart-context";
import GuestOrder from "@/components/order/GuestOrder";

// Table QR codes printed from BizPos open this page. Works signed-out.
export default function TableOrderPage({ params }: { params: { token: string } }) {
  return (
    <CartProvider>
      <GuestOrder token={params.token} />
    </CartProvider>
  );
}
