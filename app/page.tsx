import { redirect } from "next/navigation";

// The default landing page is the customer login screen.
export default function Home() {
  redirect("/login");
}
