import { togglePromoCodeAction } from "@/app/admin/dashboard/vouchers/actions";
import type { PromoCode } from "@/lib/admin/portal-types";

function statusOf(code: PromoCode): { label: string; className: string } {
  if (!code.isActive) {
    return { label: "Inactive", className: "bg-slate-100 text-slate-500" };
  }
  if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
    return { label: "Expired", className: "bg-red-100 text-red-700" };
  }
  if (code.usageLimit !== null && code.timesUsed >= code.usageLimit) {
    return { label: "Exhausted", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
}

export default function PromoCodesTable({ rows }: { rows: PromoCode[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Discount</th>
              <th className="px-5 py-3 font-medium">Usage</th>
              <th className="px-5 py-3 font-medium">Expires</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  No promo codes yet — generate one above.
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const status = statusOf(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono font-semibold tracking-wide text-slate-900">
                      {c.code}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}%`
                        : `RM ${c.discountValue.toFixed(2)}`}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.timesUsed}
                      {c.usageLimit !== null ? ` / ${c.usageLimit}` : " (unlimited)"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={togglePromoCodeAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="nextActive" value={(!c.isActive).toString()} />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {c.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
