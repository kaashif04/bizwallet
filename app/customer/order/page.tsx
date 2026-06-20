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

  try {
    const supabase = createClient();
    const [{ data: outletRows }, { data: itemRows }, userResult] =
      await Promise.all([
        supabase
          .from("outlets")
          .select("id,name,address")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("menu_items")
          .select("id,outlet_id,name,description,category,price,image_url,is_available")
          .eq("is_available", true),
        supabase.auth.getUser(),
      ]);

    if (outletRows && outletRows.length > 0) {
      outlets = outletRows.map((o) => ({
        id: o.id,
        name: o.name,
        address: o.address,
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
        };
        (grouped[r.outlet_id] ??= []).push(item);
      });
      menuByOutlet = grouped;
    }

    const user = userResult.data.user;
    if (user) {
      userId = user.id;
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance,currency")
        .eq("user_id", user.id)
        .single();
      if (wallet) {
        walletBalance = Number(wallet.balance);
        currency = wallet.currency;
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
      />
    </CartProvider>
  );
}
