import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currencySymbol } from "@/lib/format";
import type { CustomerLedgerRow, CustomerOrderRow } from "@/lib/admin/portal-types";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, role, avatar_url, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!profile) notFound();

  const [{ data: wallet }, { data: loyalty }, { data: orderRows }, { data: ledgerRows }, { data: allOrders }] =
    await Promise.all([
      admin.from("wallets").select("balance, currency").eq("user_id", params.id).maybeSingle(),
      admin
        .from("loyalty_accounts")
        .select("points_balance, points_earned, points_redeemed, tier")
        .eq("user_id", params.id)
        .maybeSingle(),
      admin
        .from("orders")
        .select("id, order_number, status, total, created_at, outlet:outlets(name)")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("wallet_transactions")
        .select("id, type, amount, balance_after, description, created_at")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })
        .limit(20),
      admin.from("orders").select("total, status").eq("user_id", params.id),
    ]);

  const lifetimeSpent = (allOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const orders: CustomerOrderRow[] = (orderRows ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: Number(o.total),
    outletName: Array.isArray(o.outlet) ? o.outlet[0]?.name ?? "Outlet" : o.outlet?.name ?? "Outlet",
    createdAt: o.created_at,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const ledger: CustomerLedgerRow[] = (ledgerRows ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    balanceAfter: Number(t.balance_after),
    description: t.description,
    createdAt: t.created_at,
  }));

  const sym = currencySymbol(wallet?.currency ?? "MYR");

  return (
    <div>
      <Link
        href="/admin/dashboard/customers"
        className="text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        ← Back to customers
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
          {(profile.full_name ?? profile.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.full_name ?? "Unnamed customer"}
            </h1>
            {profile.role === "owner" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-500">
                Owner
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {profile.email ?? "—"} · {profile.phone ?? "No phone"}
          </p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Wallet Balance" value={`${sym}${Number(wallet?.balance ?? 0).toFixed(2)}`} />
        <StatCard label="Loyalty Points" value={(loyalty?.points_balance ?? 0).toLocaleString()} />
        <StatCard label="Lifetime Spent" value={`${sym}${lifetimeSpent.toFixed(2)}`} />
        <StatCard label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Recent orders</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Outlet</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium text-slate-900">#{o.orderNumber}</td>
                      <td className="px-5 py-3 text-slate-600">{o.outletName}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {sym}
                        {o.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Wallet ledger</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Balance after</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      No wallet activity yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-3">
                        <span
                          className={`font-semibold ${
                            t.type === "credit" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {t.type === "credit" ? "↓ Credit" : "↑ Debit"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {sym}
                        {t.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {sym}
                        {t.balanceAfter.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{t.description ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-violet-100 text-violet-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}
