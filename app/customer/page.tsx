import { redirect } from "next/navigation";

// /customer is just an entry point — forward to the real dashboard.
export default function CustomerIndex() {
  redirect("/customer/dashboard");
}
