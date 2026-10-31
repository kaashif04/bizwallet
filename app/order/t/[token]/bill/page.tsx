import BillSplit from "@/components/order/BillSplit";
import { billplzEnabled } from "@/lib/billplz";

export default function TableBillPage({ params }: { params: { token: string } }) {
  return <BillSplit token={params.token} canPay={billplzEnabled() && process.env.BILL_SPLIT === "1"} />;
}
