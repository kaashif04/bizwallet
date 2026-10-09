import { redirect } from "next/navigation";
import { getCurrentUser, isSuperAdminEmail } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import SetupForm from "@/components/admin/SetupForm";

export default async function AdminSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isSuperAdminEmail(user.email)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-6">
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

  let owners: { id: string; full_name: string | null; email: string | null }[] = [];
  try {
    const { data } = await createAdminClient()
      .from("members")
      .select("id,full_name,email")
      .eq("role", "owner")
      .order("created_at", { ascending: false });
    owners = data ?? [];
  } catch {
    owners = [];
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-brand-600">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Owners</h1>
          <p className="mt-1 text-sm text-slate-500">
            Owners can use the BizWallet CRM portal.
          </p>
        </header>

        <SetupForm />

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Owners ({owners.length})
          </h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {owners.map((o) => (
              <li key={o.id} className="px-5 py-3 text-sm">
                <span className="font-medium text-slate-900">{o.full_name ?? "—"}</span>
                <span className="ml-2 text-slate-500">{o.email}</span>
              </li>
            ))}
            {owners.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-slate-500">No owners yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
