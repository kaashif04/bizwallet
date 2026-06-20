import { redirect } from "next/navigation";
import { getCurrentUser, isSuperAdminEmail } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import SetupForm from "@/components/admin/SetupForm";
import OutletsTable, { type OutletRow } from "@/components/admin/OutletsTable";

export default async function AdminSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isSuperAdminEmail(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
            🔒
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Access restricted
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This page is for Super Admins only.
          </p>
        </div>
      </div>
    );
  }

  // Fetch outlets + their owners via the service-role client (joins across
  // outlets -> profiles aren't FK-linked, so we map in two queries).
  let rows: OutletRow[] = [];
  try {
    const admin = createAdminClient();
    const { data: outlets } = await admin
      .from("outlets")
      .select("id,name,address,is_active,created_at,owner_id")
      .order("created_at", { ascending: false });

    const ownerIds = Array.from(
      new Set((outlets ?? []).map((o) => o.owner_id).filter(Boolean))
    ) as string[];

    let ownersById: Record<string, { full_name: string | null; email: string | null }> =
      {};
    if (ownerIds.length) {
      const { data: owners } = await admin
        .from("profiles")
        .select("id,full_name,email")
        .in("id", ownerIds);
      ownersById = Object.fromEntries(
        (owners ?? []).map((o) => [o.id, { full_name: o.full_name, email: o.email }])
      );
    }

    rows = (outlets ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      location: o.address,
      isActive: o.is_active,
      ownerName: o.owner_id ? ownersById[o.owner_id]?.full_name ?? null : null,
      ownerEmail: o.owner_id ? ownersById[o.owner_id]?.email ?? null : null,
    }));
  } catch {
    rows = [];
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-brand-600">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Outlet setup</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create outlets and assign managers across the network.
          </p>
        </header>

        <SetupForm />

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            All outlets ({rows.length})
          </h2>
          <OutletsTable rows={rows} />
        </section>
      </div>
    </div>
  );
}
