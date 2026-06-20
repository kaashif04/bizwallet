import type { Campaign } from "@/lib/admin/portal-types";

const AUDIENCE_LABEL: Record<Campaign["audience"], string> = {
  all: "All Users",
  high_points: "> 500 points",
  inactive_30d: "Inactive 30d",
};

export default function CampaignsTable({ rows }: { rows: Campaign[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Campaign</th>
              <th className="px-5 py-3 font-medium">Audience</th>
              <th className="px-5 py-3 font-medium">Recipients</th>
              <th className="px-5 py-3 font-medium">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                  No campaigns sent yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="line-clamp-1 text-xs text-slate-500">{c.message}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {AUDIENCE_LABEL[c.audience]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {c.recipientCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(c.createdAt).toLocaleString()}
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
