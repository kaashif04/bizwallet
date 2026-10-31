import TableHome from "@/components/order/TableHome";
import { billplzEnabled } from "@/lib/billplz";

// Table QR codes printed from BizPos open this page: the restaurant's welcome,
// then the menu. Works signed-out.
export default function TablePage({ params }: { params: { token: string } }) {
  return <TableHome token={params.token} billSplit={billplzEnabled() && process.env.BILL_SPLIT === "1"} />;
}
