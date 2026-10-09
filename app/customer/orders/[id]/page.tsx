import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currencySymbol } from "@/lib/format";
import { outletNames } from "@/lib/guest-order";

const KITCHEN: Record<string, string> = {
  queued: "In the queue",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tx }, { data: lines }, { data: rounds }, outletNameMap] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,status,subtotal,sst_amount,service_charge,total,table_label,created_at,outlet_id")
      .eq("id", params.id)
      .eq("member_id", user.id)
      .maybeSingle(),
    supabase
      .from("transaction_items")
      .select("id,menu_item_id,quantity,line_total,modifier_summary,kitchen_status")
      .eq("transaction_id", params.id)
      .order("created_at"),
    // Item names: members can't read BizPos menu_items, but guest orders
    // snapshot them. POS-only lines fall back to "Item".
    supabase.from("guest_orders").select("items").eq("transaction_id", params.id),
    outletNames(supabase),
  ]);

  if (!tx) notFound();

  const names = new Map<string, string>();
  for (const r of rounds ?? []) {
    for (const i of (r.items ?? []) as { menu_item_id: string; name: string }[]) {
      names.set(i.menu_item_id, i.name);
    }
  }

  const outletName = outletNameMap.get(tx.outlet_id) ?? "BizCafé";
  const sym = currencySymbol("MYR");
  const money = (n: unknown) => `${sym}${Number(n ?? 0).toFixed(2)}`;

  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-12 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/customer/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Back to orders"
          >
            <span className="text-lg">←</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{outletName}</h1>
            <p className="text-xs text-slate-500">
              {new Date(tx.created_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
              {tx.table_label ? ` · Table ${tx.table_label}` : ""}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 rounded-2xl bg-white px-4 shadow-sm">
          {(lines ?? []).map((l) => (
            <li key={l.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-slate-900">
                  {Number(l.quantity)} × {names.get(l.menu_item_id) ?? "Item"}
                </span>
                {l.modifier_summary && <span className="block text-xs text-slate-500">{l.modifier_summary}</span>}
                {tx.status === "open" && l.kitchen_status && (
                  <span className="block text-xs text-brand-700">{KITCHEN[l.kitchen_status] ?? l.kitchen_status}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-slate-700">{money(l.line_total)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 px-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money(tx.subtotal)}</dd>
          </div>
          {Number(tx.service_charge) > 0 && (
            <div className="flex justify-between text-slate-600">
              <dt>Service charge</dt>
              <dd className="tabular-nums">{money(tx.service_charge)}</dd>
            </div>
          )}
          {Number(tx.sst_amount) > 0 && (
            <div className="flex justify-between text-slate-600">
              <dt>SST</dt>
              <dd className="tabular-nums">{money(tx.sst_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <dt>{tx.status === "completed" ? "Paid" : "Total"}</dt>
            <dd className="tabular-nums">{money(tx.total)}</dd>
          </div>
        </dl>
        {tx.status === "open" && (
          <p className="mt-4 text-sm text-slate-600">Pay at the counter when you&apos;re done. Points are added once it&apos;s paid.</p>
        )}
      </div>
    </div>
  );
}
