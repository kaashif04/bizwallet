import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import MyPlaces from "@/components/customer/MyPlaces";
import BottomNav from "@/components/customer/BottomNav";
import ActiveOrders from "@/components/customer/ActiveOrders";
import { screen } from "@/components/customer/ui";
import { groupBy, type Place, type Reward, type Voucher } from "@/lib/places";
import { outletLogos, outletNames } from "@/lib/guest-order";

// Your places: the restaurants you collect points at, each opening its own home
// page (/s/<outlet>). There's no app-wide dashboard; customers arrive from a
// restaurant's QR. ?rewards=<branch name> or ?voucher=<code>: from a notification.
export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { rewards?: string; voucher?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const [{ data: member }, { data: placeData }, logos, names] = await Promise.all([
    supabase.from("members").select("full_name").eq("id", uid).maybeSingle(),
    supabase.rpc("wallet_my_places"),
    outletLogos(supabase),
    outletNames(supabase),
  ]);
  const places = (placeData ?? []) as Place[];
  const companyIds = places.map((p) => p.company_id);
  const [{ data: rewardRows }, { data: voucherRows }] = companyIds.length
    ? await Promise.all([
        supabase
          .from("loyalty_rewards")
          .select("id,company_id,name,description,points_cost,kind,value")
          .eq("is_active", true)
          .in("company_id", companyIds)
          .order("points_cost"),
        supabase
          .from("vouchers")
          .select("id,company_id,code,title,created_at,status,kind,value,used_at")
          .eq("user_id", uid)
          // Unused, or used in the last 30 days.
          .or(`status.eq.active,used_at.gte."${new Date(Date.now() - 30 * 86_400_000).toISOString()}"`)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const openCompany =
    (voucherRows ?? []).find((v) => v.code === searchParams.voucher)?.company_id ??
    places.find((p) => p.branches.some((b) => b.name === searchParams.rewards))?.company_id ??
    (searchParams.rewards && places.length === 1 ? places[0].company_id : null);

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-6 space-y-8">
          <ActiveOrders names={Object.fromEntries(names)} />
          <MyPlaces
            places={places}
            rewards={groupBy((rewardRows ?? []) as Reward[])}
            vouchers={groupBy((voucherRows ?? []) as Voucher[])}
            logos={logos}
            userId={uid}
            openCompany={openCompany}
            title="Your places"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
