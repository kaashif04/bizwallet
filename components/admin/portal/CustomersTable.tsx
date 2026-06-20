import Link from "next/link";
import { currencySymbol } from "@/lib/format";
import type { AdminCustomer } from "@/lib/admin/portal-types";

export default function CustomersTable({ rows }: { rows: AdminCustomer[] }) {
  const sym = currencySymbol("MYR");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Wallet Balance</th>
              <th className="px-5 py-3 font-medium">Loyalty Points</th>
              <th className="px-5 py-3 font-medium">Lifetime Spent</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  No customers match this search.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {(c.fullName ?? c.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{c.fullName ?? "Unnamed"}</div>
                        <div className="text-xs text-slate-500">{c.email ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{c.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {sym}
                    {c.walletBalance.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {c.pointsBalance.toLocaleString()} pts
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {sym}
                    {c.lifetimeSpent.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/dashboard/customers/${c.id}`}
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
