export type OutletRow = {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
};

export default function OutletsTable({ rows }: { rows: OutletRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Outlet</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                  No outlets yet — create one above.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3 text-slate-600">{r.location ?? "—"}</td>
                  <td className="px-5 py-3">
                    {r.ownerEmail ? (
                      <div>
                        <div className="font-medium text-slate-900">
                          {r.ownerName ?? "—"}
                        </div>
                        <div className="text-xs text-slate-500">{r.ownerEmail}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {r.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        Inactive
                      </span>
                    )}
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
