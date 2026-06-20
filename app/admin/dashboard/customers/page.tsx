import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import CustomerSearchBar from "@/components/admin/portal/CustomerSearchBar";
import CustomersTable from "@/components/admin/portal/CustomersTable";
import type { AdminCustomer } from "@/lib/admin/portal-types";

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  let rows: AdminCustomer[] = [];
  let total = 0;

  try {
    const admin = createAdminClient();
    const { data } = await admin.rpc("admin_list_customers", {
      p_search: q || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    });

    if (data && data.length > 0) {
      total = Number(data[0].total_count);
      rows = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        fullName: r.full_name as string | null,
        email: r.email as string | null,
        phone: r.phone as string | null,
        avatarUrl: r.avatar_url as string | null,
        walletBalance: Number(r.wallet_balance),
        pointsBalance: Number(r.points_balance),
        lifetimeSpent: Number(r.lifetime_spent),
        createdAt: r.created_at as string,
      }));
    }
  } catch {
    rows = [];
    total = 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div>
      <header>
        <p className="text-sm font-medium text-brand-600">Customer CRM</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">User database</h1>
        <p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} customers</p>
      </header>

      <div className="mt-5 max-w-md">
        <CustomerSearchBar initialQuery={q} />
      </div>

      <div className="mt-4">
        <CustomersTable rows={rows} />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/admin/dashboard/customers?page=${Math.max(1, page - 1)}${qParam}`}
              aria-disabled={page <= 1}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 font-medium ${
                page <= 1
                  ? "pointer-events-none text-slate-300"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              ← Prev
            </Link>
            <Link
              href={`/admin/dashboard/customers?page=${Math.min(totalPages, page + 1)}${qParam}`}
              aria-disabled={page >= totalPages}
              className={`rounded-lg border border-slate-200 px-3 py-1.5 font-medium ${
                page >= totalPages
                  ? "pointer-events-none text-slate-300"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Next →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
