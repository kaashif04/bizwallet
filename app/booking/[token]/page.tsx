import { notFound } from "next/navigation";
import BookingStatus from "@/components/booking/BookingStatus";

// A booking's own page. Works without signing in: the link (token) is the secret.
export default function BookingPage({ params, searchParams }: { params: { token: string }; searchParams: { paid?: string } }) {
  if (!/^[\w-]{1,64}$/.test(params.token)) notFound();
  return <BookingStatus token={params.token} justPaid={searchParams.paid === "1"} />;
}
