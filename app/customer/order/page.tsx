import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PickupOutlet } from "@/lib/guest-order";

// Pickup pre-orders. BizPos's outlets table is company-private, so the list
// comes from guest_list_outlets, narrowed to branches that accept pickup.
export default async function OrderPage() {
  const { data } = await createClient().rpc("guest_list_outlets");
  const outlets = ((data ?? []) as PickupOutlet[]).filter((o) => o.pickup);

  // Already sorted by company, then branch.
  const byCompany = new Map<string, PickupOutlet[]>();
  for (const o of outlets) byCompany.set(o.company, [...(byCompany.get(o.company) ?? []), o]);
  const showCompany = byCompany.size > 1;

  return (
    <main className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
        <h1 className="text-[2rem] font-semibold leading-tight text-slate-900">Order for pickup</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick a branch. At a table? Scan the QR code on it instead.
        </p>

        {Array.from(byCompany, ([company, branches]) => (
          <section key={company} className="mt-8">
            {showCompany && <h2 className="mb-3 px-1 text-xl font-semibold text-slate-900">{company}</h2>}
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm">
              {branches.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/order/p/${o.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-50/60 active:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-slate-900">{o.name}</span>
                      {o.address && <span className="mt-0.5 block text-[13px] text-slate-500">{o.address}</span>}
                    </span>
                    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {outlets.length === 0 && (
          <p className="mt-10 rounded-3xl bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            No branches are taking pickup orders right now.
          </p>
        )}
      </div>
    </main>
  );
}
