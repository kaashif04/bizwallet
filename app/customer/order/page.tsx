import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import StorePicker from "@/components/order/StorePicker";
import { billplzEnabled } from "@/lib/billplz";
import { outletLogos, type PickupOutlet } from "@/lib/guest-order";

// Order tab: pick a store, then dine in (scan the table QR) or pickup.
export default async function OrderPage() {
  const supabase = createClient();
  const [{ data }, logos] = await Promise.all([supabase.rpc("guest_list_outlets"), outletLogos(supabase)]);
  const branches = (data ?? []) as PickupOutlet[];

  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <h1 className="text-[1.75rem] leading-tight tracking-[-0.03em] text-ink-900">Order</h1>
        <p className="mt-2 text-sm text-slate-600">Every order earns points. Pay at the counter.</p>

        <Link
          href="/scan"
          className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
              <path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block font-bold text-ink-900">At a table?</span>
            <span className="block text-xs text-ink-500">Scan its QR and order from your phone</span>
          </span>
        </Link>

        <h2 className="mb-3 mt-8 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Choose a store</h2>
        {branches.length ? (
          <StorePicker branches={branches} logos={logos} pickupOpen={billplzEnabled()} />
        ) : (
          <p className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            No store is taking online orders right now.
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
