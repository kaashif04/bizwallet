import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleWalletEnabled, saveCardUrl } from "@/lib/google-wallet";
import { outletLogos, type PickupOutlet } from "@/lib/guest-order";
import { storeNames, type Place } from "@/lib/places";

// "Add to Google Wallet" on a restaurant's points card: makes (or refreshes) the
// member's card for that restaurant's company and sends them to Google to save it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const outlet = url.searchParams.get("outlet") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(outlet)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const back = new URL(`/s/${outlet}`, url.origin);
  if (!googleWalletEnabled()) return NextResponse.redirect(back, 303);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(back.pathname)}`, url.origin), 303);

  const { data: store } = await supabase.rpc("guest_store", { p_outlet: outlet });
  if (!store) return NextResponse.redirect(back, 303);
  const companyId = (store as PickupOutlet).company_id;
  const [{ data: places }, { data: branches }, { data: member }, logos] = await Promise.all([
    supabase.rpc("wallet_my_places"),
    supabase.rpc("guest_list_outlets", { p_company: companyId }),
    supabase.from("members").select("full_name").eq("id", user.id).maybeSingle(),
    outletLogos(supabase),
  ]);
  const place = ((places ?? []) as Place[]).find((p) => p.company_id === companyId);
  if (!place) return NextResponse.redirect(back, 303);
  const located = ((branches ?? []) as { lat: number | null; lng: number | null }[]).filter(
    (b): b is { lat: number; lng: number } => b.lat != null && b.lng != null
  );

  try {
    const save = await saveCardUrl(
      {
        companyId,
        title: storeNames(place.branches.map((b) => b.name), place.company),
        logoUrl: logos[outlet] ?? `${url.origin}/apple-icon.png`,
        locations: located.map((b) => ({ lat: Number(b.lat), lng: Number(b.lng) })),
        userId: user.id,
        memberName: member?.full_name || user.email?.split("@")[0] || "Member",
        points: place.points_balance ?? 0,
        tier: place.tier.name,
        rewardsUrl: `${back.href}?rewards=1`,
      },
      url.origin
    );
    return NextResponse.redirect(save, 303);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(back, 303);
  }
}
