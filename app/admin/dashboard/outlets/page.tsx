import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveOrders from "@/components/admin/LiveOrders";
import OutletManager from "@/components/admin/OutletManager";
import type { OwnerOrder, OwnerOutlet } from "@/lib/admin/owner-types";

export default async function OutletsPage({
  searchParams,
}: {
  searchParams: { outlet?: string };
}) {
  // Auth + owner-role gating already happened in the dashboard layout.
  // We still need the caller's id to scope outlets to this owner.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  let orders: OwnerOrder[] = [];
  if (selected) {
    const { data: orderRows } = await supabase
      .from("orders")
      .select("id,order_number,status,items,total,created_at,notes,payment_method")
      .eq("outlet_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(50);

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
    <div>
      <header>
        <p className="text-sm font-medium text-brand-600">Outlets</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Live orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your stores and watch orders come in from the POS in real time.
        </p>
      </header>

      <div className="mt-5">
        <OutletManager outlets={outlets} selectedId={selected?.id ?? null} />
      </div>

      {selected ? (
        <>
          <p className="mt-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{selected.name}</span>
            {selected.address ? ` · ${selected.address}` : ""}
          </p>
          <div className="mt-6">
            <LiveOrders outletId={selected.id} initial={orders} />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Create your first store above to start watching its live orders.
        </p>
      )}
    </div>
  );
}
