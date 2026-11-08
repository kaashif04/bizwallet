import { notFound } from "next/navigation";
import RefundForm from "@/components/refund/RefundForm";

// Where a customer says where to send their refund. Works without signing in: the link (token) is the secret.
export default function RefundPage({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.token)) notFound();
  return <RefundForm token={params.token} />;
}
