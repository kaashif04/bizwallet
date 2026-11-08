import TableHome from "@/components/order/TableHome";
import { billplzEnabled } from "@/lib/billplz";

// Table QR codes printed from BizPos open this address: the table's Home (big
// buttons for order, takeaway, waiter, bill, games, review, then rounds, points,
// Wi-Fi and feedback). The bottom bar's Home tab comes back here. Works signed-out.
export default function TableQr({ params }: { params: { token: string } }) {
  return (
    <TableHome
      token={params.token}
      billSplit={billplzEnabled() && process.env.BILL_SPLIT === "1"}
      pickupPaid={billplzEnabled()}
    />
  );
}
