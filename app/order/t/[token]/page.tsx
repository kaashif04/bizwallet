import TableLanding from "@/components/order/TableLanding";
import { billplzEnabled } from "@/lib/billplz";

// Table QR codes printed from BizPos open this address: a start page with one
// big button per thing a diner may want (order, takeaway, games, waiter, bill, review).
export default function TableQr({ params }: { params: { token: string } }) {
  return <TableLanding token={params.token} pickupPaid={billplzEnabled()} />;
}
