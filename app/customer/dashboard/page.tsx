import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import HeroCarousel from "@/components/customer/HeroCarousel";
import WalletLoyaltyCard from "@/components/customer/WalletLoyaltyCard";
import OrderAgain from "@/components/customer/OrderAgain";
import PopularNow from "@/components/customer/PopularNow";
import OrderNowFab from "@/components/customer/OrderNowFab";
import BottomNav from "@/components/customer/BottomNav";
import {
  PROMOS,
  POPULAR,
  PAST_ORDERS,
  DEMO_REWARDS,
  DEMO_TIERS,
  type PastOrder,
  type Reward,
} from "@/lib/dashboard-demo";
import type { LoyaltyTier } from "@/lib/loyalty";
import { outletNames } from "@/lib/guest-order";

const DEMO = {
  name: "Aisyah",
  balance: 128.5,
  currency: "MYR",
  points: 350,
  lifetimePoints: 350,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function summarizeItems(items: any): string {
  if (!Array.isArray(items) || items.length === 0) return "Items";
  const names = items.map((it) => it?.name).filter(Boolean) as string[];
  const head = names.slice(0, 2).join(", ");
  const extra = names.length > 2 ? ` +${names.length - 2}` : "";
  return head ? head + extra : "Items";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function CustomerDashboardPage() {
  let name = DEMO.name;
  let balance = DEMO.balance;
  let currency = DEMO.currency;
  let points = DEMO.points;
  let lifetimePoints = DEMO.lifetimePoints;
  const popular = POPULAR;
  let rewards: Reward[] = DEMO_REWARDS;
  let tiers: LoyaltyTier[] = DEMO_TIERS;
  let pastOrders: PastOrder[] = PAST_ORDERS;
  let userId: string | null = null;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Public reads — work even when signed out. (BizPos menu_items isn't
    // readable by members, so "Popular now" stays on its placeholder content.)
    const [{ data: rewardRows }, { data: tierRows }] = await Promise.all([
      supabase
        .from("loyalty_rewards")
        .select("id,name,description,points_cost,kind,value")
        .eq("is_active", true)
        .order("points_cost"),
      supabase
        .from("loyalty_tiers")
        .select("id,name,points_required,discount_percentage,theme_color")
        .order("points_required"),
    ]);

    // Note: intentionally `if (rewardRows)`, not `.length > 0` — an empty
    // real result must produce a real empty list (RewardsCatalog already
    // shows "No rewards available yet."), not the non-redeemable DEMO_REWARDS
    // fallback (its ids like "r1" aren't UUIDs and crash redeem_reward).
    if (rewardRows) rewards = rewardRows as Reward[];
    if (tierRows && tierRows.length > 0) {
      tiers = tierRows.map((t) => ({
        id: t.id,
        name: t.name,
        points_required: t.points_required,
        discount_percentage: Number(t.discount_percentage),
        theme_color: t.theme_color,
      }));
    }

    if (user) {
      userId = user.id;
      const [{ data: profile }, { data: wallet }, { data: loyalty }, { data: orderRows }, names] =
        await Promise.all([
          supabase.from("members").select("full_name").eq("id", user.id).single(),
          supabase
            .from("wallets")
            .select("balance, currency")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("loyalty_accounts")
            .select("points_balance, points_earned")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("guest_orders")
            .select("id,subtotal,items,outlet_id")
            .eq("member_id", user.id)
            .neq("status", "rejected")
            .order("created_at", { ascending: false })
            .limit(6),
          outletNames(supabase),
        ]);

      name = profile?.full_name ?? user.email?.split("@")[0] ?? DEMO.name;
      balance = wallet ? Number(wallet.balance) : DEMO.balance;
      currency = wallet?.currency ?? DEMO.currency;
      points = loyalty ? loyalty.points_balance : DEMO.points;
      lifetimePoints = loyalty ? loyalty.points_earned : DEMO.lifetimePoints;

      if (orderRows && orderRows.length > 0) {
        pastOrders = orderRows.map((o, i) => ({
          id: o.id,
          outlet: names.get(o.outlet_id) ?? "BizCafé",
          items: summarizeItems(o.items),
          total: Number(o.subtotal),
          image: PAST_ORDERS[i % PAST_ORDERS.length].image,
        }));
      }
    }
  } catch {
    // Supabase not configured -> demo data.
  }

  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-36 pt-6">
        <DashboardHeader name={name} />

        <div className="mt-5 space-y-6">
          <HeroCarousel slides={PROMOS} />

          <WalletLoyaltyCard
            balance={balance}
            currency={currency}
            points={points}
            lifetimePoints={lifetimePoints}
            tiers={tiers}
            rewards={rewards}
            userId={userId}
          />

          <section>
            <SectionHeader title="Order again" actionHref="/customer/orders" />
            <OrderAgain orders={pastOrders} currency={currency} />
          </section>

          <section>
            <SectionHeader title="Popular now" actionHref="/customer/order" />
            <PopularNow items={popular} currency={currency} />
          </section>
        </div>
      </div>

      <OrderNowFab />
      <BottomNav />
    </div>
  );
}

function SectionHeader({
  title,
  actionHref,
}: {
  title: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {actionHref && (
        <Link
          href={actionHref}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          See all
        </Link>
      )}
    </div>
  );
}
