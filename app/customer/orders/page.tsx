import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import { currencySymbol } from "@/lib/format";
import { outletNames } from "@/lib/guest-order";

// BizPos transaction_status: open | completed | voided | refunded
const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "Open bill", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Paid", cls: "bg-mint-100 text-mint-700" },
  voided: { label: "Voided", cls: "bg-rose-100 text-rose-600" },
  refunded: { label: "Refunded", cls: "bg-slate-100 text-slate-500" },
};

export default async function OrdersListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // BizPos bills linked to this member (RLS: member_id = auth.uid()).
  const names = outletNames(supabase);
  const { data: rows } = await supabase
    .from("transactions")
    .select("id,status,total,table_label,created_at,outlet_id")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Placed but not on a POS bill yet: waiting for payment or for the outlet.
  const { data: waiting } = await supabase
    .from("guest_orders")
    .select("id,status,amount_due,subtotal,created_at,outlet_id")
    .eq("member_id", user.id)
    .in("status", ["awaiting_payment", "pending"])
    .order("created_at", { ascending: false })
    .limit(10);

  const orders = rows ?? [];
  const nameMap = await names;
  const outletName = (o: { outlet_id: string }) => nameMap.get(o.outlet_id) ?? "Restaurant";
  const sym = currencySymbol("MYR");

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500">Your bills from every outlet</p>
        </header>

        {!!waiting?.length && (
          <section className="mb-6">
            <h2 className="mb-2 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">In progress</h2>
            <div className="space-y-3">
              {waiting.map((g) => (
                <Link
                  key={g.id}
                  href={`/order/status/${g.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 transition hover:shadow-md active:scale-[0.99]"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-60" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-900">{outletName(g)}</span>
                    <span className="block text-xs text-ink-500">
                      {g.status === "awaiting_payment" ? "Waiting for your payment" : "Waiting for the outlet to confirm"}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink-900">
                    {sym}
                    {Number(g.amount_due ?? g.subtotal).toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
              const meta = STATUS_META[o.status] ?? STATUS_META.open;
              return (
                <Link
                  key={o.id}
                  href={`/customer/orders/${o.id}`}
                  className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{outletName(o)}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                    {o.table_label ? ` · Table ${o.table_label}` : " · Takeaway"}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-brand-700">
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
