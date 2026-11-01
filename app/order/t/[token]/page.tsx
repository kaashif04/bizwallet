import { redirect } from "next/navigation";

// Table QR codes printed from BizPos open this address: straight to ordering.
// Calling staff, the bill, the game and feedback live on the Table tab.
export default function TableQr({ params }: { params: { token: string } }) {
  redirect(`/order/t/${params.token}/menu`);
}
