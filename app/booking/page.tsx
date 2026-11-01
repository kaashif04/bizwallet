import BookFlow from "@/components/booking/BookFlow";

// Book a table. ?outlet=<id> starts at that restaurant's date (when it takes bookings).
export default function BookingPage({ searchParams }: { searchParams: { outlet?: string } }) {
  const outlet = /^[0-9a-f-]{36}$/i.test(searchParams.outlet ?? "") ? searchParams.outlet : undefined;
  return <BookFlow outletId={outlet} />;
}
