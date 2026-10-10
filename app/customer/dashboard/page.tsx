import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import WalletLoyaltyCard from "@/components/customer/WalletLoyaltyCard";
import OrderAgain, { type RecentOrder } from "@/components/customer/OrderAgain";
import OrderNowFab from "@/components/customer/OrderNowFab";
import BottomNav from "@/components/customer/BottomNav";
import ItemMark from "@/components/order/ItemMark";
import { DEMO_TIERS, type Reward } from "@/lib/dashboard-demo";
import type { LoyaltyTier } from "@/lib/loyalty";
import { type PickupOutlet } from "@/lib/guest-order";

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
  ]);

  const branches = (branchData ?? []) as PickupOutlet[];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const tiers: LoyaltyTier[] = tierRows?.length
    ? tierRows.map((t) => ({ ...t, discount_percentage: Number(t.discount_percentage) }))
    : DEMO_TIERS;
  const currency = wallet?.currency ?? "MYR";
  const recent: RecentOrder[] = (orderRows ?? []).map((o) => ({
    id: o.id,
    outlet: branchName.get(o.outlet_id) ?? "BizCafé",
    items: summarizeItems(o.items),
    total: Number(o.subtotal),
    href: o.transaction_id ? `/customer/orders/${o.transaction_id}` : "/customer/orders",
    date: o.created_at,
  }));

  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-6 space-y-8">
          <WalletLoyaltyCard
            balance={Number(wallet?.balance ?? 0)}
            currency={currency}
            points={loyalty?.points_balance ?? 0}
            lifetimePoints={loyalty?.points_earned ?? 0}
            tiers={tiers}
            rewards={(rewardRows ?? []) as Reward[]}
            userId={uid}
          />

          <section>
            <SectionHeader title="Recent orders" actionHref={recent.length ? "/customer/orders" : undefined} />
            {recent.length ? (
              <OrderAgain orders={recent} currency={currency} />
            ) : (
              <p className="rounded-3xl bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                Scan the QR code on your table to order. Your orders and points show up here.
              </p>
            )}
          </section>

          <section>
            <SectionHeader title="Branches" />
            {branches.length ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm">
                {branches.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/order/p/${b.id}`}
                      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-brand-50/60 active:bg-brand-50"
                    >
                      <ItemMark name={b.name} className="h-11 w-11 rounded-xl text-lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900">{b.name}</span>
                        <span className="block truncate text-[13px] text-slate-500">
                          {b.address ?? b.company} · Order ahead for pickup
                        </span>
                      </span>
                      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <path d="M6 3l5 5-5 5" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl bg-white px-5 py-6 text-sm text-slate-600 shadow-sm">
                No branch is taking pickup orders right now. At the restaurant, scan the QR code on your table.
              </p>
            )}
          </section>
        </div>
      </div>

      {branches.length > 0 && <OrderNowFab />}
      <BottomNav />
    </div>
  );
}

function SectionHeader({ title, actionHref }: { title: string; actionHref?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {actionHref && (
        <Link href={actionHref} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          See all
        </Link>
      )}
    </div>
  );
}
