import { redirect } from "next/navigation";

// /customer is just an entry point — forward to this phone's restaurant.
export default function CustomerIndex() {
  redirect("/");
}
