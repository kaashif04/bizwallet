import GuestOrder from "@/components/order/GuestOrder";
import { billplzEnabled } from "@/lib/billplz";
import { createClient } from "@/lib/supabase/server";
import type { GuestMenu } from "@/lib/guest-order";
import { loadStore, orderingStatus } from "@/lib/hours";

// The menu is fetched here, with the page, so it shows on arrival. If this
// fails, GuestOrder fetches it from the phone and shows the error.
export default async function TableMenuPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("guest_get_menu", { p_token: params.token });
  const menu = (data as GuestMenu | null) ?? null;
  // Closed (or past last orders): the menu can be browsed, but not ordered from.
  const store = menu && (await loadStore(supabase, menu.outlet.id));
  const status = store && orderingStatus(store);
  const closed = status && !status.open ? { text: status.text, opens: status.opens ?? null, ahead: false } : null;
  return <GuestOrder token={params.token} onlinePay={billplzEnabled()} initialMenu={menu} closed={closed} />;
}
