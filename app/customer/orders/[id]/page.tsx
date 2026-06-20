import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderTracker from "@/components/customer/OrderTracker";

export default async function OrderTrackPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: o } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,items,total,order_type,table_number,outlet:outlets(name)"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!o) notFound();

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const rel = (o as any).outlet;
  const outletName = Array.isArray(rel) ? rel[0]?.name ?? null : rel?.name ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-rose-50/40">
      <div className="mx-auto max-w-md px-5 pb-12 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/customer/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Back to orders"
          >
            <span className="text-lg">←</span>
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Track order</h1>
        </div>

        <OrderTracker
          order={{
            id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            items: Array.isArray(o.items) ? o.items : [],
            total: Number(o.total),
            orderType: o.order_type,
            tableNumber: o.table_number,
            outletName,
            currency: "MYR",
          }}
        />
      </div>
    </div>
  );
}
