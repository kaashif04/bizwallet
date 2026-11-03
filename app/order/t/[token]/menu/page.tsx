import GuestOrder from "@/components/order/GuestOrder";
import { billplzEnabled } from "@/lib/billplz";
import { createClient } from "@/lib/supabase/server";
import type { GuestMenu } from "@/lib/guest-order";

// The menu is fetched here, with the page, so it shows on arrival. If this
// fails, GuestOrder fetches it from the phone and shows the error.
export default async function TableMenuPage({ params }: { params: { token: string } }) {
  const { data } = await createClient().rpc("guest_get_menu", { p_token: params.token });
  return <GuestOrder token={params.token} onlinePay={billplzEnabled()} initialMenu={(data as GuestMenu | null) ?? null} />;
}
