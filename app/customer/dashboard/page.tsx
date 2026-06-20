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
  type PastOrder,
  type Reward,
} from "@/lib/dashboard-demo";

const DEMO = { name: "Aisyah", balance: 128.5, currency: "MYR", points: 350 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function outletName(o: any): string {
  const rel = o.outlet;
  if (Array.isArray(rel)) return rel[0]?.name ?? "Outlet";
  return rel?.name ?? "Outlet";
}
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
  let popular = POPULAR;
  let rewards: Reward[] = DEMO_REWARDS;
  let pastOrders: PastOrder[] = PAST_ORDERS;
  let userId: string | null = null;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Public reads — work even when signed out.
    const [{ data: items }, { data: rewardRows }] = await Promise.all([
      supabase
        .from("menu_items")
        .select("id,name,price,image_url")
        .eq("is_available", true)
        .limit(4),
      supabase
        .from("loyalty_rewards")
        .select("id,name,description,points_cost,kind,value")
        .eq("is_active", true)
        .order("points_cost"),
    ]);

    if (items && items.length > 0) {
      popular = items.map((m, i) => ({
        id: m.id,
        name: m.name,
        price: Number(m.price),
        image: m.image_url ?? POPULAR[i % POPULAR.length].image,
      }));
    }
    if (rewardRows && rewardRows.length > 0) rewards = rewardRows as Reward[];

    if (user) {
      userId = user.id;
      const [{ data: profile }, { data: wallet }, { data: loyalty }, { data: orderRows }] =
        await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
          supabase
            .from("wallets")
            .select("balance, currency")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("loyalty_accounts")
            .select("points_balance")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("orders")
            .select("id,total,items,outlet:outlets(name)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

      name = profile?.full_name ?? user.email?.split("@")[0] ?? DEMO.name;
      balance = wallet ? Number(wallet.balance) : DEMO.balance;
      currency = wallet?.currency ?? DEMO.currency;
      points = loyalty ? loyalty.points_balance : DEMO.points;

      if (orderRows && orderRows.length > 0) {
        pastOrders = orderRows.map((o, i) => ({
          id: o.id,
          outlet: outletName(o),
          items: summarizeItems(o.items),
          total: Number(o.total),
          image: PAST_ORDERS[i % PAST_ORDERS.length].image,
        }));
      }
    }
  } catch {
    // Supabase not configured -> demo data.
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/40">
      <div className="mx-auto max-w-md px-5 pb-36 pt-6">
        <DashboardHeader name={name} />

        <div className="mt-5 space-y-6">
          <HeroCarousel slides={PROMOS} />

          <WalletLoyaltyCard
            balance={balance}
            currency={currency}
            points={points}
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
