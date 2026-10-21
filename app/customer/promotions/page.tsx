import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import PromotionSettings from "@/components/customer/PromotionSettings";
import { PageHeader, screen } from "@/components/customer/ui";
import { outletLogos } from "@/lib/guest-order";
import { storeNames, type Place } from "@/lib/places";

// Who may send this member offers: BizWallet itself, and each store they've joined.
export default async function PromotionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: member }, { data: placeData }, logos] = await Promise.all([
    supabase.from("members").select("marketing_consent").eq("id", user!.id).maybeSingle(),
    supabase.rpc("wallet_my_places"),
    outletLogos(supabase),
  ]);

  const stores = ((placeData ?? []) as Place[])
    .map((p) => ({
      companyId: p.company_id,
      name: storeNames(p.branches.map((b) => b.name), p.company),
      logos: p.branches.map((b) => ({ name: b.name, url: logos[b.id] ?? null })).slice(0, 3),
      consent: p.marketing_consent,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="Promotions" subtitle="Choose who can send you offers. Change it any time." back="/customer/profile" />
        <PromotionSettings userId={user!.id} news={member?.marketing_consent ?? false} stores={stores} />
      </div>
      <BottomNav />
    </div>
  );
}
