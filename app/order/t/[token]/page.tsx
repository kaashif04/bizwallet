import TableHome from "@/components/order/TableHome";

// Table QR codes printed from BizPos open this page: the restaurant's welcome,
// then the menu. Works signed-out.
export default function TablePage({ params }: { params: { token: string } }) {
  return <TableHome token={params.token} />;
}
