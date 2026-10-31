import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { billplzEnabled } from "@/lib/billplz";
import { currencySymbol } from "@/lib/format";
import { openLabel } from "@/lib/hours";
import { outletLogos, type Banner, type PickupOutlet } from "@/lib/guest-order";
import type { Place, Reward, Voucher } from "@/lib/places";
import BranchLogo from "@/components/order/BranchLogo";
import BannerCarousel from "@/components/order/BannerCarousel";
import RememberPlace from "@/components/order/RememberPlace";
import AccountChip from "@/components/order/AccountChip";
import MyPlaces from "@/components/customer/MyPlaces";
import { SectionTitle } from "@/components/customer/ui";

type Store = PickupOutlet & { ordering: boolean };

// A restaurant's own home: what customers reach from its table QR, receipt QR
// or the link the owner shares. Order, offers, and (signed in) points, rewards
// and past orders here. ?rewards=1 opens the rewards sheet.
export default async function StorePage({
  params,
  searchParams,
}: {
  params: { outletId: string };
  searchParams: { rewards?: string };
}) {
  if (!/^[0-9a-f-]{36}$/i.test(params.outletId)) notFound();
  const supabase = createClient();
  const [{ data }, logos, { data: bannerData }, { data: auth }] = await Promise.all([
    supabase.rpc("guest_store", { p_outlet: params.outletId }),
    outletLogos(supabase),
    supabase.rpc("wallet_banners", { p_outlet: params.outletId }),
    supabase.auth.getUser(),
  ]);
  const store = data as Store | null;
  if (!store) notFound();

  const user = auth.user;
  const { data: member } = user ? await supabase.from("members").select("full_name").maybeSingle() : { data: null };
  const [{ data: placeData }, { data: rewardRows }, { data: voucherRows }, { data: orders }] = member
    ? await Promise.all([
        supabase.rpc("wallet_my_places"),
        supabase
          .from("loyalty_rewards")
          .select("id,company_id,name,description,points_cost,kind,value")
          .eq("is_active", true)
          .eq("company_id", store.company_id)
          .order("points_cost"),
        supabase
          .from("vouchers")
          .select("id,company_id,code,title,created_at,status,kind,value,used_at")
          .eq("user_id", user!.id)
          .eq("company_id", store.company_id)
          .or(`status.eq.active,used_at.gte."${new Date(Date.now() - 30 * 86_400_000).toISOString()}"`)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("id,status,total,table_label,created_at")
          .eq("member_id", user!.id)
          .eq("outlet_id", store.id)
          .neq("status", "voided")
          .order("created_at", { ascending: false })
          .limit(10),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];
  const place = ((placeData ?? []) as Place[]).find((p) => p.company_id === store.company_id) ?? null;

  const pickupOpen = billplzEnabled();
  const canPickup = store.pickup && pickupOpen;
  // Malaysia wall-clock time, for "opens tomorrow 10:00" on a UTC server.
  const klNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const status = openLabel(store.open_now, store.today, store.hours, klNow);
  const sym = currencySymbol("MYR");
  const here = `/s/${store.id}`;

  return (
    <div className="min-h-dvh bg-ink-50">
      <RememberPlace outletId={store.id} />
      <main className="mx-auto max-w-md pb-16">
        <header className="relative">
          <div className="relative h-56 overflow-hidden bg-brand-100">
            {store.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.cover_url} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />
            <div className="absolute inset-x-0 top-0 flex justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <AccountChip
                state={member ? { points: place?.points_balance ?? 0, joined: !!place } : "guest"}
              />
            </div>
          </div>
          <div className="px-4">
            <BranchLogo
              name={store.name}
              logoUrl={logos[store.id]}
              className="relative -mt-10 h-20 w-20 rounded-3xl text-3xl shadow-md ring-4 ring-ink-50"
            />
            <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">{store.name}</h1>
            {store.tagline && <p className="mt-1 text-sm text-ink-500">{store.tagline}</p>}
            {status && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-700">
                <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-ink-400"}`} aria-hidden="true" />
                {status.text}
              </p>
            )}
          </div>
        </header>

        <div className="mt-5 space-y-8 px-4">
          {/* Order */}
          {store.ordering && (
            <div className={`grid gap-3 ${canPickup ? "grid-cols-2" : ""}`}>
              {canPickup && (
                <Link
                  href={`/order/p/${store.id}`}
                  className="flex h-14 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
                >
                  Order pickup
                </Link>
              )}
              <Link
                href={`/scan?at=${encodeURIComponent(store.name)}`}
                className={`flex h-14 items-center justify-center rounded-full text-base font-bold transition active:scale-[0.97] ${
                  canPickup ? "bg-white text-ink-900 shadow-sm hover:bg-ink-100" : "bg-brand-600 text-on shadow-sm hover:bg-brand-700"
                }`}
              >
                At a table? Scan
              </Link>
            </div>
          )}

          {(bannerData ?? []).length > 0 && (
            <BannerCarousel banners={bannerData as Banner[]} branches={[store]} pickupOpen={pickupOpen} outletId={store.id} />
          )}

          {/* Points and rewards here */}
          {!member ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(here)}`}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:bg-ink-100"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink-900">Collect points here</span>
                <span className="block text-xs text-ink-500">Sign in or join free to see your points, rewards and orders.</span>
              </span>
              <span className="text-sm font-bold text-brand-700">Sign in</span>
            </Link>
          ) : place ? (
            <MyPlaces
              places={[place]}
              rewards={{ [store.company_id]: (rewardRows ?? []) as Reward[] }}
              vouchers={{ [store.company_id]: (voucherRows ?? []) as Voucher[] }}
              logos={logos}
              userId={user!.id}
              openCompany={searchParams.rewards ? store.company_id : null}
              title="Your points here"
            />
          ) : (
            <p className="rounded-2xl bg-white px-4 py-3.5 text-sm text-ink-600">
              Your first order or receipt here starts your points.
            </p>
          )}

          {member && (orders ?? []).length > 0 && (
            <section>
              <SectionTitle>Your orders here</SectionTitle>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
                {orders!.map((o) => (
                  <li key={o.id}>
                    <Link href={`/customer/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {new Date(o.created_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {o.table_label ? `Table ${o.table_label}` : "Counter or pickup"}
                          {o.status === "open" ? " · Open bill" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                        {sym}
                        {Number(o.total).toFixed(2)}
                      </span>
                      <span aria-hidden="true" className="text-ink-400">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Visit */}
          {(store.address || store.phone || store.maps_url) && (
            <section>
              <SectionTitle>Visit</SectionTitle>
              <div className="divide-y divide-ink-100 rounded-2xl bg-white">
                {store.address && <p className="px-4 py-3.5 text-sm text-ink-700">{store.address}</p>}
                {(store.maps_url || store.phone) && (
                  <div className="flex gap-2 px-4 py-3">
                    {store.maps_url && (
                      <a
                        href={store.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-ink-100 px-4 py-2 text-sm font-bold text-ink-900 transition hover:bg-ink-200"
                      >
                        Directions
                      </a>
                    )}
                    {store.phone && (
                      <a
                        href={`tel:${store.phone.replace(/\s/g, "")}`}
                        className="rounded-full bg-ink-100 px-4 py-2 text-sm font-bold text-ink-900 transition hover:bg-ink-200"
                      >
                        Call
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
