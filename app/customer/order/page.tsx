import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/customer/BottomNav";
import { PageHeader, SectionTitle, screen } from "@/components/customer/ui";
import StorePicker from "@/components/order/StorePicker";
import BannerCarousel from "@/components/order/BannerCarousel";
import { billplzEnabled } from "@/lib/billplz";
import { outletLogos, type Banner, type PickupOutlet } from "@/lib/guest-order";

// Order tab: pick a store, then dine in (scan the table QR) or pickup.
export default async function OrderPage() {
  const supabase = createClient();
  const [{ data }, logos, { data: bannerData }] = await Promise.all([
    supabase.rpc("guest_list_outlets"),
    outletLogos(supabase),
    supabase.rpc("wallet_banners"),
  ]);
  const branches = (data ?? []) as PickupOutlet[];
  const pickupOpen = billplzEnabled();

  return (
    <main className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <PageHeader title="Order" subtitle="Dine in or order ahead. Every order earns points." />

        <BannerCarousel banners={(bannerData ?? []) as Banner[]} branches={branches} pickupOpen={pickupOpen} />

        <Link
          href="/scan"
          className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 transition hover:shadow-md active:scale-[0.99]"
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
          <span aria-hidden="true" className="text-lg text-ink-400">›</span>
        </Link>

        <div className="mt-8">
          <SectionTitle>Stores</SectionTitle>
        </div>
        {branches.length ? (
          <StorePicker branches={branches} logos={logos} pickupOpen={pickupOpen} />
        ) : (
          <p className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-ink-500">
            No store is taking online orders right now.
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
