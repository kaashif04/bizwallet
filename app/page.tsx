import { redirect } from "next/navigation";

// Middleware sends members to their dashboard and everyone else to login;
// this only runs if middleware is bypassed.
export default function Home() {
  redirect("/login");
}
