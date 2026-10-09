import { CartProvider } from "@/components/order/cart-context";
import GuestOrder from "@/components/order/GuestOrder";

// Pickup pre-order (no table). Only works when the outlet enabled pickup in BizPos.
export default function PickupOrderPage({ params }: { params: { outletId: string } }) {
  return (
    <CartProvider>
      <GuestOrder outletId={params.outletId} />
    </CartProvider>
  );
}
