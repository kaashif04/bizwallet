import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currencySymbol } from "@/lib/format";
import { outletNames } from "@/lib/guest-order";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";

const KITCHEN: Record<string, string> = {
  queued: "In the queue",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
};

type MyBill = {
  id: string;
  outlet_id: string;
  status: "open" | "completed" | "voided" | "refunded";
  table_label: string | null;
  created_at: string;
  subtotal: number;
  discount: number;
  service_charge: number;
  sst: number;
  rounding: number;
  total: number;
  items: { id: string; name: string; quantity: number; line_total: number; options: string | null; kitchen_status: string | null }[];
  people: { name: string; you: boolean; ordered: number; paid: number }[];
  points: number;
};

// One bill you took part in, as the pad has it, with who was at the table.
export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, nameMap] = await Promise.all([supabase.rpc("wallet_my_bill", { p_id: params.id }), outletNames(supabase)]);
  const bill = data as MyBill | null;
  if (!bill) notFound();

  const sym = currencySymbol("MYR");
  const money = (n: unknown) => `${sym}${Number(n ?? 0).toFixed(2)}`;
  const shared = bill.people.length > 1;

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link
          href="/customer/orders"
          className="-ml-2 mb-4 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
          My orders
        </Link>

        <Chit
          band={
            <div className="flex items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="pad block truncate text-lg font-extrabold leading-tight text-ink-900">{nameMap.get(bill.outlet_id) ?? "Restaurant"}</span>
                <span className="block text-xs text-ink-700">
                  {new Date(bill.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
                </span>
              </span>
              {bill.table_label && (
                <span className="shrink-0 text-right">
                  <PadLabel>Table</PadLabel>
                  <span className="pad block text-3xl font-extrabold leading-none text-brand-700">{bill.table_label}</span>
                </span>
              )}
            </div>
          }
        >
          <ul className="ruled px-4">
            {bill.items.map((l) => (
              <li key={l.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-ink-900">
                    {Number(l.quantity)} × {l.name}
                  </span>
                  {l.options && <span className="block text-xs text-ink-500">{l.options}</span>}
                  {bill.status === "open" && l.kitchen_status && (
                    <span className="block text-xs font-semibold text-brand-700">{KITCHEN[l.kitchen_status] ?? l.kitchen_status}</span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-ink-700">{money(l.line_total)}</span>
              </li>
            ))}
          </ul>

          <dl className="total-rule mx-4 space-y-1.5 py-4 text-sm">
            <Line label="Subtotal" n={money(bill.subtotal)} />
            {Number(bill.discount) > 0 && <Line label="Discount" n={`−${money(bill.discount)}`} />}
            {Number(bill.service_charge) > 0 && <Line label="Service charge" n={money(bill.service_charge)} />}
            {Number(bill.sst) > 0 && <Line label="SST" n={money(bill.sst)} />}
            {Number(bill.rounding) !== 0 && <Line label="Rounding" n={money(bill.rounding)} />}
            <div className="flex items-end justify-between gap-3 pt-2">
              <dt className="flex items-center gap-3 text-sm font-bold text-ink-900">
                Total
                {bill.status === "completed" && <Stamp>Paid</Stamp>}
              </dt>
              <dd className="pad text-3xl font-extrabold leading-none text-ink-900">{money(bill.total)}</dd>
            </div>
          </dl>
        </Chit>

        {shared && (
          <section className="mt-7">
            <h2 className="pad mb-3 px-1 text-[1.0625rem] font-bold text-ink-900">Who was at the table</h2>
            <ul className="ruled overflow-hidden rounded-xl bg-white shadow-sm">
              {bill.people.map((p, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3.5 text-sm">
                  <span
                    className={`pad flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                      p.you ? "bg-brand-600 text-on" : "bg-paper-band text-ink-800"
                    }`}
                    aria-hidden="true"
                  >
                    {p.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-ink-900">{p.name}</span>
                    <span className="block text-xs text-ink-500">
                      {[p.ordered > 0 && `ordered ${p.ordered} item${p.ordered === 1 ? "" : "s"}`, p.paid > 0 && `paid ${money(p.paid)} in the app`]
                        .filter(Boolean)
                        .join(" · ") || "on the bill"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 text-xs text-ink-500">Only people who were part of this bill see this.</p>
          </section>
        )}

        <p className="mt-6 px-1 text-sm text-ink-600">
          {bill.status === "open"
            ? "This bill is still open. Pay at the counter or from the table page; points come once it's paid."
            : bill.points > 0
              ? `You earned ${bill.points.toLocaleString()} points on this bill.`
              : "No points were added to your card for this bill."}
        </p>
      </div>
    </div>
  );
}

function Line({ label, n }: { label: string; n: string }) {
  return (
    <div className="flex justify-between text-ink-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{n}</dd>
    </div>
  );
}
