import GuestOrder from "@/components/order/GuestOrder";
import { billplzEnabled } from "@/lib/billplz";

export default function TableMenuPage({ params }: { params: { token: string } }) {
  return <GuestOrder token={params.token} onlinePay={billplzEnabled()} />;
}
