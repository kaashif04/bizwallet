import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import MyPlaces from "@/components/customer/MyPlaces";
import OrderAgain, { type RecentOrder } from "@/components/customer/OrderAgain";
import BottomNav from "@/components/customer/BottomNav";
import Reveal from "@/components/Reveal";
import ActiveOrders from "@/components/customer/ActiveOrders";
import StorePicker from "@/components/order/StorePicker";
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
export default async function CustomerDashboardPage() {
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
  ]);
  const pickupOpen = billplzEnabled();

  const branches = (branchData ?? []) as PickupOutlet[];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  // Loyalty is per company: rewards and vouchers of the companies I've joined.
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
          .select("id,company_id,code,title,created_at")
          .eq("user_id", uid)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
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
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-5 space-y-6">
          <BannerCarousel banners={(bannerData ?? []) as Banner[]} branches={branches} pickupOpen={pickupOpen} />
          <ActiveOrders names={Object.fromEntries(branchName)} />
          <MyPlaces
            places={places}
            rewards={groupBy((rewardRows ?? []) as Reward[])}
            vouchers={groupBy((voucherRows ?? []) as Voucher[])}
            logos={logos}
            userId={uid}
            pickupOpen={pickupOpen}
          />

          <Link
            href="/customer/wallet"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="13" rx="3" />
                <path d="M3 10h18M16 15h2" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Wallet credit</span>
              <span className="block text-lg font-semibold tracking-[-0.025em] text-ink-900">
                RM{Number(wallet?.balance ?? 0).toFixed(2)}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-brand-700">Top up ›</span>
          </Link>

          <Reveal delay={0.06}>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/scan"
              className="flex flex-col gap-3 rounded-2xl bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                  <path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3" />
                </svg>
              </span>
              <span>
                <span className="block font-bold text-ink-900">Scan table</span>
                <span className="block text-xs text-ink-500">Dine in, order here</span>
              </span>
            </Link>
            <Link
              href="/customer/order"
              className="flex flex-col gap-3 rounded-2xl bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 8h14l-1 12H6L5 8Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </span>
              <span>
                <span className="block font-bold text-ink-900">Order ahead</span>
                <span className="block text-xs text-ink-500">Pick a store</span>
              </span>
            </Link>
          </div>
          </Reveal>


          <Reveal delay={0.18}>
          <section>
            <SectionHeader title="Recent orders" actionHref={recent.length ? "/customer/orders" : undefined} />
            {recent.length ? (
              <OrderAgain orders={recent} currency={currency} />
            ) : (
              <p className="rounded-2xl bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                Scan the QR code on your table to order. Your orders and points show up here.
              </p>
            )}
          </section>
          </Reveal>

          <Reveal delay={0.24}>
          <section>
            <SectionHeader title="Stores" />
            {branches.length ? (
              <StorePicker branches={branches} logos={logos} pickupOpen={pickupOpen} />
            ) : (
              <p className="rounded-2xl bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                No store is taking online orders right now. Order with our staff at the restaurant.
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

function SectionHeader({ title, actionHref }: { title: string; actionHref?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">{title}</h2>
      {actionHref && (
        <Link href={actionHref} className="text-sm font-bold text-brand-700 hover:underline">
          See all
        </Link>
      )}
    </div>
  );
}
