import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import WalletLoyaltyCard from "@/components/customer/WalletLoyaltyCard";
import OrderAgain, { type RecentOrder } from "@/components/customer/OrderAgain";
import BottomNav from "@/components/customer/BottomNav";
import StorePicker from "@/components/order/StorePicker";
import { DEMO_TIERS, type Reward } from "@/lib/dashboard-demo";
import type { LoyaltyTier } from "@/lib/loyalty";
import { outletLogos, type PickupOutlet } from "@/lib/guest-order";

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
    { data: loyalty },
    { data: rewardRows },
    { data: tierRows },
    { data: orderRows },
    { data: branchData },
    logos,
  ] = await Promise.all([
    supabase.from("members").select("full_name").eq("id", uid).maybeSingle(),
    supabase.from("wallets").select("balance, currency").eq("user_id", uid).maybeSingle(),
    supabase.from("loyalty_accounts").select("points_balance, points_earned").eq("user_id", uid).maybeSingle(),
    supabase
      .from("loyalty_rewards")
      .select("id,name,description,points_cost,kind,value")
      .eq("is_active", true)
      .order("points_cost"),
    supabase
      .from("loyalty_tiers")
      .select("id,name,points_required,discount_percentage,theme_color")
      .order("points_required"),
    supabase
      .from("guest_orders")
      .select("id,subtotal,items,status,created_at,transaction_id,outlet_id")
      .eq("member_id", uid)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("guest_list_outlets"),
    outletLogos(supabase),
  ]);

  const branches = (branchData ?? []) as PickupOutlet[];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const tiers: LoyaltyTier[] = tierRows?.length
    ? tierRows.map((t) => ({ ...t, discount_percentage: Number(t.discount_percentage) }))
    : DEMO_TIERS;
  const currency = wallet?.currency ?? "MYR";
  const recent: RecentOrder[] = (orderRows ?? []).map((o) => ({
    id: o.id,
    outlet: branchName.get(o.outlet_id) ?? "Restaurant",
    items: summarizeItems(o.items),
    total: Number(o.subtotal),
    href: o.transaction_id ? `/customer/orders/${o.transaction_id}` : "/customer/orders",
    date: o.created_at,
  }));

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-5 space-y-6">
          <WalletLoyaltyCard
            balance={Number(wallet?.balance ?? 0)}
            currency={currency}
            points={loyalty?.points_balance ?? 0}
            lifetimePoints={loyalty?.points_earned ?? 0}
            tiers={tiers}
            rewards={(rewardRows ?? []) as Reward[]}
            userId={uid}
          />

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

          <NextReward points={loyalty?.points_balance ?? 0} rewards={(rewardRows ?? []) as Reward[]} />

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

          <section>
            <SectionHeader title="Stores" />
            {branches.length ? (
              <StorePicker branches={branches} logos={logos} />
            ) : (
              <p className="rounded-2xl bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                No store is taking online orders right now. Order with our staff at the restaurant.
              </p>
            )}
          </section>
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

// The nearest reward: ready to redeem, or how far there is to go.
function NextReward({ points, rewards }: { points: number; rewards: Reward[] }) {
  const ready = [...rewards].reverse().find((r) => r.points_cost <= points);
  const next = rewards.find((r) => r.points_cost > points);
  const target = ready ?? next;
  if (!target) return null;
  const pct = Math.min(100, Math.round((points / target.points_cost) * 100));

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-50 shadow-well ${ready ? "text-emerald-600" : "text-brand-600"}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" />
          <path d="M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1Z" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold leading-tight text-ink-900">
          {ready ? `${target.name} is ready` : target.name}
        </h2>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 shadow-well"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to ${target.name}`}
        >
          <div className={`h-full rounded-full ${ready ? "bg-emerald-500" : "bg-marple"}`} style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          {ready ? "Tap your points card to redeem" : `${(target.points_cost - points).toLocaleString()} more points to go`}
        </p>
      </div>
    </div>
  );
}
