import TableHome from "@/components/order/TableHome";
import { billplzEnabled } from "@/lib/billplz";

// The Table tab: call staff, ask for the bill, this phone's rounds, the game,
// Wi-Fi and feedback. Works signed-out.
export default function TablePage({ params }: { params: { token: string } }) {
  return <TableHome token={params.token} billSplit={billplzEnabled() && process.env.BILL_SPLIT === "1"} />;
}
