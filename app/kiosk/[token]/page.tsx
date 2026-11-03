import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/order/cart-context";
import Kiosk from "@/components/kiosk/Kiosk";

// The in-store self-order kiosk. Owners open /kiosk/<token> (from the BizPos
// dashboard) on a tablet, ideally locked with Guided Access.
export const metadata: Metadata = { title: "Order here", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default function KioskPage({ params }: { params: { token: string } }) {
  return (
    <CartProvider>
      <Kiosk token={params.token} />
    </CartProvider>
  );
}
