import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OwnerWorkspace from "@/components/admin/OwnerWorkspace";
import OutletManager from "@/components/admin/OutletManager";
import type {
  OwnerMenuItem,
  OwnerOrder,
  OwnerOutlet,
} from "@/lib/admin/owner-types";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { outlet?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "owner") redirect("/customer/dashboard");

  const { data: outletRows } = await supabase
    .from("outlets")
    .select("id,name,address")
    .eq("owner_id", user.id)
    .order("name");
  const outlets: OwnerOutlet[] = (outletRows ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
  }));

  const selected =
    outlets.find((o) => o.id === searchParams.outlet) ?? outlets[0] ?? null;

  let menu: OwnerMenuItem[] = [];
  let orders: OwnerOrder[] = [];
  if (selected) {
    const [{ data: menuRows }, { data: orderRows }] = await Promise.all([
      supabase
        .from("menu_items")
        .select("id,name,description,category,price,stock_quantity,is_available")
        .eq("outlet_id", selected.id)
        .order("category", { nullsFirst: false })
        .order("name"),
      supabase
        .from("orders")
        .select("id,order_number,status,items,total,created_at,notes,payment_method")
        .eq("outlet_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    menu = (menuRows ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      price: Number(m.price),
      stockQuantity: m.stock_quantity,
      isAvailable: m.is_available,
    }));
    orders = (orderRows ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      items: Array.isArray(o.items) ? o.items : [],
      total: Number(o.total),
      createdAt: o.created_at,
      notes: o.notes,
      paymentMethod: o.payment_method,
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600">Owner portal</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile?.full_name ? `${profile.full_name}'s outlets` : "Your outlets"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard/customers"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              Owner Dashboard →
            </Link>
            <Link
              href="/customer/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Customer view
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <OutletManager outlets={outlets} selectedId={selected?.id ?? null} />

        {selected ? (
          <>
            <p className="mt-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{selected.name}</span>
              {selected.address ? ` · ${selected.address}` : ""}
            </p>
            <OwnerWorkspace
              outletId={selected.id}
              initialMenu={menu}
              initialOrders={orders}
            />
          </>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            Create your first store above to start managing its menu and live orders.
          </p>
        )}
      </div>
    </div>
  );
}
