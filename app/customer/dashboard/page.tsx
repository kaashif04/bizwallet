import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PLACE_COOKIE, placeHome } from "@/lib/place";
import type { Place } from "@/lib/places";

// No page lists restaurants: each one stands alone. This old address now only
// forwards: ?rewards=<branch name> or ?voucher=<code> (from a notification) to
// that restaurant's rewards, anything else to the restaurant this phone came from.
export default async function PlacesRedirect({
  searchParams,
}: {
  searchParams: { rewards?: string; voucher?: string };
}) {
  const home = placeHome(cookies().get(PLACE_COOKIE)?.value);
  if (!searchParams.rewards && !searchParams.voucher) redirect(home);

  const supabase = createClient();
  const [{ data: placeData }, { data: voucher }] = await Promise.all([
    supabase.rpc("wallet_my_places"),
    searchParams.voucher
      ? supabase.from("vouchers").select("company_id").eq("code", searchParams.voucher).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const places = (placeData ?? []) as Place[];
  const place =
    places.find((p) => p.company_id === voucher?.company_id) ??
    places.find((p) => p.branches.some((b) => b.name === searchParams.rewards));
  const outlet = place?.branches[0]?.id;
  redirect(outlet ? `/s/${outlet}?rewards=1` : home.startsWith("/s/") ? `${home}?rewards=1` : home);
}
