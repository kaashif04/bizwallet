import TableGames from "@/components/order/TableGames";

export default function TablePlayPage({ params }: { params: { token: string } }) {
  return <TableGames token={params.token} />;
}
