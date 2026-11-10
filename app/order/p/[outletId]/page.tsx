import Link from "next/link";
import { CartProvider } from "@/components/order/cart-context";
import GuestOrder from "@/components/order/GuestOrder";
import { billplzEnabled } from "@/lib/billplz";
import { createClient } from "@/lib/supabase/server";
import { pickupSlots, type GuestMenu } from "@/lib/guest-order";
import { loadStore, orderingStatus } from "@/lib/hours";

// Pickup pre-order (no table). Only works when the outlet enabled pickup in
// BizPos, and only once online payment is set up (pickup is paid first).
export default async function PickupOrderPage({ params }: { params: { outletId: string } }) {
  if (!billplzEnabled()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl text-ink-900">Pickup is coming soon</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-500">
          You&apos;ll be able to order ahead and pay online here shortly. For now, scan the QR on your table to order.
        </p>
        <Link
          href={`/s/${params.outletId}`}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
        >
          Back to the restaurant
        </Link>
      </main>
    );
  }
  // Fetched with the page so the menu shows on arrival (GuestOrder retries from the phone if not).
  const supabase = createClient();
  const [{ data }, store] = await Promise.all([
    supabase.rpc("guest_get_menu", { p_outlet: params.outletId }),
    loadStore(supabase, params.outletId),
  ]);
  // Closed now: browse, and order for a later pickup time if the branch takes them.
  const status = store && orderingStatus(store);
  const closed =
    status && !status.open
      ? { text: status.text, opens: status.opens ?? null, ahead: (await pickupSlots(supabase, params.outletId)).length > 0 }
      : null;
  return (
    <CartProvider storageKey={`bw_cart:p:${params.outletId}`}>
      <GuestOrder outletId={params.outletId} initialMenu={(data as GuestMenu | null) ?? null} closed={closed} prepMinutes={store?.prep_minutes ?? null} />
    </CartProvider>
  );
}
