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

  // Any bill this member took part in (linked, ordered a round, or paid a share).
  const [{ data }, outletNameMap] = await Promise.all([
    supabase.rpc("wallet_my_bill", { p_id: params.id }),
    outletNames(supabase),
  ]);
  const bill = data as {
    status: string;
    subtotal: number;
    service_charge: number;
    sst: number;
    total: number;
    table_label: string | null;
    created_at: string;
    outlet_id: string;
    items: { id: string; name: string; quantity: number; line_total: number; options: string | null; kitchen_status: string | null }[];
    people: { name: string; you: boolean; ordered: number; paid: number }[];
    points: number;
  } | null;
  if (!bill) notFound();
  const tx = { ...bill, sst_amount: bill.sst };
  const lines = bill.items.map((i) => ({ ...i, menu_item_id: i.id, modifier_summary: i.options }));
  const names = new Map(bill.items.map((i) => [i.id, i.name]));

  const outletName = outletNameMap.get(tx.outlet_id) ?? "Restaurant";
  const sym = currencySymbol("MYR");
  const money = (n: unknown) => `${sym}${Number(n ?? 0).toFixed(2)}`;

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/customer/orders"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-700 shadow-sm transition active:scale-95"
            aria-label="Back to orders"
          >
            <span className="text-lg">←</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{outletName}</h1>
            <p className="text-xs text-slate-500">
              {new Date(tx.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
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
        {tx.status !== "open" && bill.points > 0 && (
          <p className="mt-4 text-sm text-slate-600">You earned {bill.points.toLocaleString()} points on this bill.</p>
        )}

        {bill.people.length > 1 && (
          <section className="mt-8">
            <h2 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Who was at the table</h2>
            <ul className="divide-y divide-slate-100 rounded-2xl bg-white px-4 shadow-sm">
              {bill.people.map((p, i) => (
                <li key={i} className="flex items-center gap-3 py-3 text-sm">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                      p.you ? "bg-brand-600 text-on" : "bg-brand-50 text-brand-700"
                    }`}
                    aria-hidden="true"
                  >
                    {p.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900">{p.name}</span>
                    <span className="block text-xs text-slate-500">
                      {[p.ordered > 0 && `ordered ${p.ordered} item${p.ordered === 1 ? "" : "s"}`, p.paid > 0 && `paid ${money(p.paid)} in the app`]
                        .filter(Boolean)
                        .join(" · ") || "on the bill"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 text-xs text-slate-500">Only people who were part of this bill see this.</p>
          </section>
        )}
      </div>
    </div>
  );
}
