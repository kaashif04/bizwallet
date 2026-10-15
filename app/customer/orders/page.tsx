import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import { currencySymbol } from "@/lib/format";
import { outletNames } from "@/lib/guest-order";
import ActiveOrders from "@/components/customer/ActiveOrders";
import { PageHeader, SectionTitle, screen } from "@/components/customer/ui";

// BizPos transaction_status: open | completed | voided | refunded
const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "Open bill", cls: "bg-amber-50 text-amber-700" },
  completed: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  voided: { label: "Voided", cls: "bg-rose-50 text-rose-700" },
  refunded: { label: "Refunded", cls: "bg-ink-100 text-ink-600" },
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

  const orders = rows ?? [];
  const nameMap = await names;
  const outletName = (o: { outlet_id: string }) => nameMap.get(o.outlet_id) ?? "Restaurant";
  const sym = currencySymbol("MYR");

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="My orders" subtitle="Bills from every restaurant" back="/customer/profile" />

        <div className="mb-8">
          <ActiveOrders names={Object.fromEntries(nameMap)} />
        </div>

        <SectionTitle>Past orders</SectionTitle>
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-ink-500">
            No orders yet.{" "}
            <Link href="/customer/order" className="font-bold text-brand-700">
              Start one ›
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.open;
              return (
                <li key={o.id}>
                  <Link
                    href={`/customer/orders/${o.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50 active:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink-900">{outletName(o)}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {new Date(o.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
                        {o.table_label ? ` · Table ${o.table_label}` : " · Pickup"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-ink-900">
                        {sym}
                        {Number(o.total).toFixed(2)}
                      </span>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-2xs font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
