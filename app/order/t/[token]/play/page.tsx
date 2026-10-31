import StackGame from "@/components/order/StackGame";

export default function TablePlayPage({ params }: { params: { token: string } }) {
  return <StackGame token={params.token} />;
}
