import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import { currencySymbol } from "@/lib/format";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  preparing: { label: "Preparing", cls: "bg-blue-100 text-blue-700" },
  ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-500" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-600" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function outletName(o: any): string {
  const rel = o.outlet;
  if (Array.isArray(rel)) return rel[0]?.name ?? "Outlet";
  return rel?.name ?? "Outlet";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function OrdersListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,total,order_type,table_number,created_at,outlet:outlets(name)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const orders = rows ?? [];
  const sym = currencySymbol("MYR");

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/40">
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500">Track current and past orders</p>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
            No orders yet.{" "}
            <Link href="/customer/order" className="font-semibold text-brand-600">
              Start one →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.pending;
              return (
                <Link
                  key={o.id}
                  href={`/customer/orders/${o.id}`}
                  className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      Order #{o.order_number}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {outletName(o)} ·{" "}
                    {o.order_type === "dine_in"
                      ? `Dine-in · Table ${o.table_number ?? "—"}`
                      : "Takeaway"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-700">
                    {sym}
                    {Number(o.total).toFixed(2)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
