import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/components/order/cart-context";
import OrderExperience from "@/components/order/OrderExperience";
import { DEMO_OUTLETS, DEMO_MENU_BY_OUTLET } from "@/lib/order-demo";
import type { MenuItem, Outlet } from "@/lib/order-types";

export default async function OrderPage() {
  // Demo fallbacks so the flow is fully explorable before Supabase is wired up.
  let outlets: Outlet[] = DEMO_OUTLETS;
  let menuByOutlet: Record<string, MenuItem[]> = DEMO_MENU_BY_OUTLET;
  let walletBalance = 88.0;
  let currency = "MYR";
  let userId: string | null = null;
  let discountPercentage = 0;
  let tierName: string | null = null;

  try {
    const supabase = createClient();
    const [{ data: outletRows }, { data: itemRows }, userResult] =
      await Promise.all([
        supabase
          .from("outlets")
          .select(
            "id,name,address,open_time,close_time,prep_time_minutes,latitude,longitude,is_accepting_orders"
          )
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("menu_items")
          .select("id,outlet_id,name,description,category,price,image_url,is_available,external_pos_id")
          .eq("is_available", true),
        supabase.auth.getUser(),
      ]);

    if (outletRows && outletRows.length > 0) {
      outlets = outletRows.map((o) => ({
        id: o.id,
        name: o.name,
        address: o.address,
        open_time: o.open_time,
        close_time: o.close_time,
        prep_time_minutes: o.prep_time_minutes,
        latitude: o.latitude != null ? Number(o.latitude) : null,
        longitude: o.longitude != null ? Number(o.longitude) : null,
        is_accepting_orders: o.is_accepting_orders,
      }));

      const grouped: Record<string, MenuItem[]> = {};
      (itemRows ?? []).forEach((r) => {
        const item: MenuItem = {
          id: r.id,
          outletId: r.outlet_id,
          name: r.name,
          description: r.description,
          category: r.category ?? "Others",
          price: Number(r.price),
          imageUrl: r.image_url,
          isAvailable: r.is_available,
          externalPosId: r.external_pos_id,
        };
        (grouped[r.outlet_id] ??= []).push(item);
      });
      menuByOutlet = grouped;
    }

    const user = userResult.data.user;
    if (user) {
      userId = user.id;
      const [{ data: wallet }, { data: loyalty }] = await Promise.all([
        supabase
          .from("wallets")
          .select("balance,currency")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("loyalty_accounts")
          .select("tier:loyalty_tiers(name, discount_percentage)")
          .eq("user_id", user.id)
          .single(),
      ]);
      if (wallet) {
        walletBalance = Number(wallet.balance);
        currency = wallet.currency;
      }
      // PostgREST embeds a to-one FK relation as an object, but some client
      // typings/configs surface it as a 1-element array — handle both.
      type TierRow = { name: string; discount_percentage: number };
      const rel = loyalty?.tier as unknown as TierRow | TierRow[] | null | undefined;
      const tier = Array.isArray(rel) ? rel[0] : rel;
      if (tier) {
        tierName = tier.name;
        discountPercentage = Number(tier.discount_percentage);
      }
    }
  } catch {
    // Supabase not configured / unreachable -> keep demo data.
  }

  return (
    <CartProvider>
      <OrderExperience
        outlets={outlets}
        menuByOutlet={menuByOutlet}
        walletBalance={walletBalance}
        currency={currency}
        userId={userId}
        discountPercentage={discountPercentage}
        tierName={tierName}
      />
    </CartProvider>
  );
}
