import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currencySymbol } from "@/lib/format";
import { outletNames } from "@/lib/guest-order";
import ActiveOrders from "@/components/customer/ActiveOrders";
import { PageHeader, SectionTitle, screen } from "@/components/customer/ui";
import { Stamp } from "@/components/ui/chit";

type Bill = {
  id: string;
  outlet_id: string;
  status: "open" | "completed" | "voided" | "refunded";
  total: number;
  table_label: string | null;
  created_at: string;
  mine: boolean; // the bill is linked to you
  you_paid: number; // your shares paid in the app
  shared: boolean; // more than one person ordered on it
};

// Every bill you took part in: yours, ones you ordered a round on, ones you paid a share of.
export default async function OrdersListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, nameMap] = await Promise.all([supabase.rpc("wallet_my_bills"), outletNames(supabase)]);
  const bills = (data ?? []) as Bill[];
  const sym = currencySymbol("MYR");
  const money = (n: number) => `${sym}${Number(n).toFixed(2)}`;

  // Group by day, as a pad of chits would stack.
  const day = (at: string) =>
    new Date(at).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "long", day: "numeric", month: "long" });
  const groups = bills.reduce<[string, Bill[]][]>((g, b) => {
    const d = day(b.created_at);
    if (g.length && g[g.length - 1][0] === d) g[g.length - 1][1].push(b);
    else g.push([d, [b]]);
    return g;
  }, []);

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="My orders" subtitle="Every bill you were part of" back="/customer/dashboard" />

        <div className="mb-8">
          <ActiveOrders names={Object.fromEntries(nameMap)} />
        </div>

        {bills.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-ink-500 shadow-sm">
            No bills yet. Scan the QR on your table to order.
          </div>
        ) : (
          <div className="space-y-7">
            {groups.map(([d, list]) => (
              <section key={d}>
                <SectionTitle>{d}</SectionTitle>
                <ul className="ruled overflow-hidden rounded-xl bg-white shadow-sm">
                  {list.map((b) => (
                    <li key={b.id}>
                      <Link href={`/customer/orders/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50 active:bg-ink-100">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink-900">{nameMap.get(b.outlet_id) ?? "Restaurant"}</span>
                          <span className="block truncate text-xs text-ink-500">
                            {new Date(b.created_at).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", minute: "2-digit" })}
                            {b.table_label ? ` · Table ${b.table_label}` : " · Counter or pickup"}
                            {b.shared ? " · Shared table" : ""}
                            {b.you_paid > 0 ? ` · You paid ${money(b.you_paid)}` : ""}
                          </span>
                        </span>
                        {b.status === "open" ? (
                          <Stamp>Open</Stamp>
                        ) : b.status === "refunded" ? (
                          <Stamp>Refund</Stamp>
                        ) : (
                          <span className="pad shrink-0 text-sm font-bold text-ink-900">{money(b.total)}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
