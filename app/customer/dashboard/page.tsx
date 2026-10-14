import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import MyPlaces from "@/components/customer/MyPlaces";
import OrderAgain, { type RecentOrder } from "@/components/customer/OrderAgain";
import BottomNav from "@/components/customer/BottomNav";
import Reveal from "@/components/Reveal";
import ActiveOrders from "@/components/customer/ActiveOrders";
import { SectionTitle, screen } from "@/components/customer/ui";
import BannerCarousel from "@/components/order/BannerCarousel";
import { billplzEnabled } from "@/lib/billplz";
import { groupBy, type Place, type Reward, type Voucher } from "@/lib/places";
import { outletLogos, type Banner, type PickupOutlet } from "@/lib/guest-order";

/* eslint-disable @typescript-eslint/no-explicit-any */
function summarizeItems(items: any): string {
  if (!Array.isArray(items) || items.length === 0) return "Items";
  const names = items.map((it) => it?.name).filter(Boolean) as string[];
  const head = names.slice(0, 2).join(", ");
  const extra = names.length > 2 ? ` +${names.length - 2}` : "";
  return head ? head + extra : "Items";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Middleware guarantees a signed-in member here, so everything is real data.
// ?rewards=<branch> or ?voucher=<code>: from a rewards notification.
export default async function CustomerDashboardPage({
  searchParams,
}: {
  searchParams: { rewards?: string; voucher?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const [
    { data: member },
    { data: wallet },
    { data: placeData },
    { data: orderRows },
    { data: branchData },
    logos,
    { data: bannerData },
    { data: orderedGuest },
    { data: orderedBills },
  ] = await Promise.all([
    supabase.from("members").select("full_name").eq("id", uid).maybeSingle(),
    supabase.from("wallets").select("balance, currency").eq("user_id", uid).maybeSingle(),
    supabase.rpc("wallet_my_places"),
    supabase
      .from("guest_orders")
      .select("id,subtotal,items,status,created_at,transaction_id,outlet_id")
      .eq("member_id", uid)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("guest_list_outlets"),
    outletLogos(supabase),
    supabase.rpc("wallet_banners"),
    // Branches I've ordered from: QR/pickup orders and counter bills.
    supabase.from("guest_orders").select("outlet_id").eq("member_id", uid).neq("status", "rejected").limit(500),
    supabase.from("transactions").select("outlet_id").eq("member_id", uid).limit(500),
  ]);
  const orderedAt = new Set([...(orderedGuest ?? []), ...(orderedBills ?? [])].map((r) => r.outlet_id as string));
  const pickupOpen = billplzEnabled();

  const branches = (branchData ?? []) as PickupOutlet[];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  // Loyalty is per company: rewards and vouchers of the companies I've joined.
  // Home shows only the branches I've ordered from; the Order tab lists them all.
  const places = ((placeData ?? []) as Place[]).map((p) => ({
    ...p,
    branches: p.branches.filter((b) => orderedAt.has(b.id)),
  }));
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
  const named = branches.filter((b) => b.name === searchParams.rewards);
  const openCompany =
    (voucherRows ?? []).find((v) => v.code === searchParams.voucher)?.company_id ??
    (named.find((b) => companyIds.includes(b.company_id)) ?? named[0])?.company_id ??
    (searchParams.rewards && places.length === 1 ? places[0].company_id : null);
  const currency = wallet?.currency ?? "MYR";
  const recent: RecentOrder[] = (orderRows ?? []).map((o) => ({
    id: o.id,
    outlet: branchName.get(o.outlet_id) ?? "Restaurant",
    items: summarizeItems(o.items),
    total: Number(o.subtotal),
    href: o.transaction_id ? `/customer/orders/${o.transaction_id}` : `/order/status/${o.id}`,
    date: o.created_at,
  }));

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-6 space-y-8">
          <ActiveOrders names={Object.fromEntries(branchName)} />

          {/* Quick actions: dine in, order ahead, wallet */}
          <div className="grid grid-cols-3 gap-3">
            <Tile href="/scan" title="Scan table" note="Dine in">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
              <path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3" />
            </Tile>
            <Tile href="/customer/order" title="Order ahead" note="Pickup">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </Tile>
            <Tile href="/customer/wallet" title={`RM${Number(wallet?.balance ?? 0).toFixed(2)}`} note="Top-up bonus">
              <rect x="3" y="6" width="18" height="13" rx="3" />
              <path d="M3 10h18M16 15h2" />
            </Tile>
          </div>

          <BannerCarousel banners={(bannerData ?? []) as Banner[]} branches={branches} pickupOpen={pickupOpen} storesHref="/customer/order" />

          <MyPlaces
            places={places}
            rewards={groupBy((rewardRows ?? []) as Reward[])}
            vouchers={groupBy((voucherRows ?? []) as Voucher[])}
            logos={logos}
            userId={uid}
            pickupOpen={pickupOpen}
            openCompany={openCompany}
          />

          <Reveal>
            <section>
              <SectionTitle href={recent.length ? "/customer/orders" : undefined}>Recent orders</SectionTitle>
              {recent.length ? (
                <OrderAgain orders={recent} currency={currency} />
              ) : (
                <p className="rounded-2xl bg-white px-5 py-6 text-sm text-ink-500">
                  Scan the QR code on your table to order. Your orders and points show up here.
                </p>
              )}
            </section>
          </Reveal>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Tile({ href, title, note, children }: { href: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {children}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tabular-nums text-ink-900">{title}</span>
        <span className="block text-xs text-ink-500">{note}</span>
      </span>
    </Link>
  );
}
