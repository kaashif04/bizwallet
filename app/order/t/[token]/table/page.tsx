import { redirect } from "next/navigation";

// The old Table tab is now the table's Home; keeps saved links and logins working.
export default function TablePage({ params }: { params: { token: string } }) {
  redirect(`/order/t/${params.token}`);
}
