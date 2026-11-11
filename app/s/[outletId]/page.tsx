import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { billplzEnabled } from "@/lib/billplz";
import { googleWalletEnabled } from "@/lib/google-wallet";
import { currencySymbol } from "@/lib/format";
import { DAYS, clock, klNow, openLabel, orderingStatus, type StoreHours } from "@/lib/hours";
import { outletLogos, pickupSlots, type Banner, type PickupOutlet } from "@/lib/guest-order";
import type { Place, Reward, Voucher } from "@/lib/places";
import BranchLogo from "@/components/order/BranchLogo";
import BannerCarousel from "@/components/order/BannerCarousel";
import RememberPlace from "@/components/order/RememberPlace";
import PointsCard from "@/components/store/PointsCard";
import DishRails, { type Dish } from "@/components/store/DishRails";
import DealsRow from "@/components/order/DealsRow";
import type { Deal } from "@/lib/deals";
import NotificationBell from "@/components/customer/NotificationBell";
import { SectionTitle } from "@/components/customer/ui";

type Store = PickupOutlet & StoreHours & { ordering: boolean };

const sym = currencySymbol("MYR");
const money = (n: number) => `${sym}${Number(n).toFixed(2)}`;

// A restaurant's own home: what customers reach from the link the owner shares
// or a receipt QR (a table QR opens the table's menu instead). Order, offers, dishes, and (signed in) points,
// rewards and past orders here, and a way to scan a table for dine-in. Nothing
// links to other restaurants. ?rewards=1 opens the rewards sheet.
export default async function StorePage({
  params,
  searchParams,
}: {
  params: { outletId: string };
  searchParams: { rewards?: string };
}) {
  if (!/^[0-9a-f-]{36}$/i.test(params.outletId)) notFound();
  const supabase = createClient();
  const [{ data }, logos, { data: bannerData }, { data: dishData }, { data: auth }, { data: bookingCfg }, { data: deliveryInfo }, { data: dealData }] = await Promise.all([
    supabase.rpc("guest_store", { p_outlet: params.outletId }),
    outletLogos(supabase),
    supabase.rpc("wallet_banners", { p_outlet: params.outletId }),
    supabase.rpc("guest_store_dishes", { p_outlet: params.outletId }),
    supabase.auth.getUser(),
    supabase.rpc("booking_config", { p_outlet: params.outletId }),
    supabase.rpc("guest_delivery_info", { p_outlet: params.outletId }), // null = no delivery here
    supabase.rpc("wallet_deals", { p_outlet: params.outletId }),
  ]);
  const store = data as Store | null;
  if (!store) notFound();
  const dishes = (dishData ?? { popular: [], mine: [] }) as { popular: Dish[]; mine: Dish[] };

  const user = auth.user;
  const [{ data: member }, { data: rewardRows }, { data: program }] = await Promise.all([
    user ? supabase.from("members").select("full_name").maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("loyalty_rewards")
      .select("id,company_id,name,description,points_cost,kind,value")
      .eq("is_active", true)
      .eq("company_id", store.company_id)
      .order("sort_order")
      .order("points_cost"),
    supabase.from("loyalty_programs").select("is_enabled,points_per_rm").eq("company_id", store.company_id).maybeSingle(),
  ]);
  const rewards = (rewardRows ?? []) as Reward[];
  const [{ data: placeData }, { data: voucherRows }, { data: orders }, { data: lastOrder }] = member
    ? await Promise.all([
        supabase.rpc("wallet_my_places"),
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
          .limit(3),
        // Their last order from the app here, for "Order again" (RLS: own orders only).
        supabase
          .from("guest_orders")
          .select("created_at, items")
          .eq("outlet_id", store.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];
  const again = lastOrder as { created_at: string; items: { name: string; quantity: number }[] } | null;
  const place = ((placeData ?? []) as Place[]).find((p) => p.company_id === store.company_id) ?? null;
  const loyaltyOn = program?.is_enabled !== false;

  const canPickup = store.pickup && billplzEnabled();
  const canDeliver = canPickup && !!deliveryInfo;
  const kl = klNow();
  const status = openLabel(store.open_now, store.today, store.hours, kl);
  const todayIdx = (kl.getDay() + 6) % 7; // Monday = 0
  // Closed (or past last orders): pickup only for a later time (if the branch takes orders ahead), no delivery.
  const ordering = orderingStatus(store, kl);
  const closed = !!ordering && !ordering.open;
  const ahead = canPickup && closed && (await pickupSlots(supabase, store.id)).length > 0;
  const here = `/s/${store.id}`;
  const signIn = `/login?redirect=${encodeURIComponent(here)}`;
  const dishHref = canPickup ? `/order/p/${store.id}` : null;

  const actions = [
    store.ordering && {
      href: `/scan?at=${encodeURIComponent(store.name)}`,
      label: "Scan QR",
      icon: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 8h3v3H8zM13 13h3v3h-3z",
    },
    (bookingCfg as { enabled?: boolean } | null)?.enabled && {
      href: `/booking?outlet=${store.id}`,
      label: "Book",
      icon: "M4 6h16v14H4zM4 10h16M8 4v4M16 4v4",
    },
    store.maps_url && { href: store.maps_url, label: "Directions", icon: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z", external: true },
    store.phone && {
      href: `tel:${store.phone.replace(/\s/g, "")}`,
      label: "Call",
      icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
    },
  ].filter(Boolean) as { href: string; label: string; icon: string; external?: boolean }[];

  return (
    <div className="min-h-dvh bg-ink-50">
      <RememberPlace outletId={store.id} />
      <main className={`mx-auto max-w-md ${!canPickup ? "pb-16" : closed ? "pb-[calc(9.5rem+env(safe-area-inset-bottom))]" : "pb-[calc(7rem+env(safe-area-inset-bottom))]"}`}>
        {/* Cover, logo, name, open now */}
        <header className="relative">
          {/* No photo: a soft Marple wash, not a scrim over nothing. */}
          <div className="relative h-60 overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-ink-50">
            {store.cover_url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.cover_url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/10" />
              </>
            )}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              {member ? (
                <>
                  <Link
                    href="/customer/profile"
                    aria-label="My account"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-base font-bold text-ink-700 shadow-sm transition hover:bg-brand-100"
                  >
                    {(member.full_name?.trim() || user?.email || "U").charAt(0).toUpperCase()}
                  </Link>
                  <NotificationBell />
                </>
              ) : (
                <>
                  <span />
                  <Link href={signIn} className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-brand-100">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="px-4">
            <BranchLogo
              name={store.name}
              logoUrl={logos[store.id]}
              className="relative -mt-10 h-20 w-20 rounded-[1.5rem] text-3xl shadow-md ring-4 ring-ink-50"
            />
            <h1 className="mt-3 text-[1.875rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">
              {member?.full_name ? `Hi ${member.full_name.trim().split(/\s+/)[0]}${(orders ?? []).length > 0 || again ? ", welcome back" : ""}` : store.name}
            </h1>
            <p className="mt-1 text-sm text-ink-500">{member?.full_name ? store.name : store.tagline}</p>
            {status && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-ink-400"}`} aria-hidden="true" />
                {status.text}
              </p>
            )}
          </div>
        </header>

        <div className="mt-5 space-y-8 px-4">
          {actions.length > 0 && (
            // Ordering lives in the bottom bar; these are the extras: one row of equal tiles, never an orphan on a second line.
            <nav aria-label="Quick actions" className="grid auto-cols-fr grid-flow-col gap-2">
              {actions.map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-white px-1 text-center text-[12px] font-semibold leading-none text-ink-800 shadow-sm transition hover:bg-brand-50 active:scale-[0.97]"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={a.icon} />
                  </svg>
                  {a.label}
                </a>
              ))}
            </nav>
          )}

          {/* Deals first: tapping one opens that dish (or category) on the menu. */}
          <DealsRow
            deals={(dealData ?? []) as Deal[]}
            href={dishHref}
            scanHref={store.ordering ? `/scan?at=${encodeURIComponent(store.name)}` : null}
          />

          {/* Points: the member's card, or what joining gets you */}
          {loyaltyOn &&
            (member && place ? (
              <PointsCard
                place={place}
                rewards={rewards}
                vouchers={(voucherRows ?? []) as Voucher[]}
                userId={user!.id}
                googleWallet={googleWalletEnabled() ? `/api/wallet/google?outlet=${store.id}` : undefined}
                open={!!searchParams.rewards}
              />
            ) : (
              <JoinCard
                signedIn={!!member}
                signIn={signIn}
                perRm={Number(program?.points_per_rm ?? 1)}
                rewards={rewards.slice(0, 3)}
              />
            ))}

          {(bannerData ?? []).length > 0 && (
            <section>
              <SectionTitle>Offers</SectionTitle>
              <BannerCarousel banners={bannerData as Banner[]} branches={[store]} pickupOpen={canPickup} outletId={store.id} />
            </section>
          )}

          {canPickup && again?.items?.length ? (
            // Pickup opens with this order in the cart (GuestOrder reads ?again=1).
            <Link
              href={`/order/p/${store.id}?again=1`}
              className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm transition active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-ink-900">Order again</span>
                <span className="block truncate text-sm text-ink-600">
                  {again.items.map((l) => (l.quantity > 1 ? `${l.quantity}× ${l.name}` : l.name)).join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-brand-700">{canDeliver ? "Order ›" : "Pickup ›"}</span>
            </Link>
          ) : null}
          <DishRails mine={dishes.mine} popular={dishes.popular} href={dishHref} />

          {member && (orders ?? []).length > 0 && (
            <section>
              <SectionTitle href="/customer/orders" action="All orders">
                Your recent orders
              </SectionTitle>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
                {orders!.map((o) => (
                  <li key={o.id}>
                    <Link href={`/customer/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {new Date(o.created_at).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {o.table_label ? `Table ${o.table_label}` : "Counter or pickup"}
                          {o.status === "open" ? " · Open bill" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">{money(o.total)}</span>
                      <span aria-hidden="true" className="text-ink-400">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hours and location */}
          {(store.hours || store.address) && (
            <section>
              <SectionTitle>Hours &amp; location</SectionTitle>
              <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
                {store.hours && (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm">
                      <span className="font-bold text-ink-900">
                        Today{" "}
                        <span className="font-normal text-ink-600">
                          {store.hours[todayIdx] ? `${clock(store.hours[todayIdx]!.open)} – ${clock(store.hours[todayIdx]!.close)}` : "Closed"}
                        </span>
                        {store.hours[todayIdx] && store.last_order_at && (
                          <span className="block text-xs font-medium text-ink-500">Last orders {clock(store.last_order_at)}</span>
                        )}
                      </span>
                      <span aria-hidden="true" className="text-ink-400 transition group-open:rotate-90">›</span>
                    </summary>
                    <ul className="px-4 pb-3.5 text-sm">
                      {store.hours.map((d, i) => (
                        <li key={i} className={`flex justify-between py-1 ${i === todayIdx ? "font-bold text-ink-900" : "text-ink-600"}`}>
                          <span>{DAYS[i]}</span>
                          <span className="tabular-nums">{d ? `${clock(d.open)} – ${clock(d.close)}` : "Closed"}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {store.address && (
                  <a
                    href={store.maps_url ?? `https://maps.google.com/?q=${encodeURIComponent(store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3.5 text-sm text-ink-700 transition hover:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1">{store.address}</span>
                    <span className="shrink-0 font-bold text-brand-700">Map ›</span>
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {canPickup && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {closed && (
            <p className="mb-2 text-center text-xs font-semibold text-ink-600">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                {ordering!.text}
              </span>
            </p>
          )}
          <div className="flex gap-2">
            <Link
              href={`/order/p/${store.id}`}
              className={`flex h-14 flex-1 items-center justify-center rounded-full text-base font-bold shadow-lg transition active:scale-[0.97] ${
                closed && !ahead ? "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50" : "bg-brand-600 text-on hover:brightness-95"
              }`}
            >
              {closed ? (ahead ? "Pickup later" : "See the menu") : canDeliver ? "Pickup" : "Order pickup"}
            </Link>
            {canDeliver &&
              (closed ? (
                // No drivers while the kitchen is closed.
                <span
                  aria-disabled="true"
                  className="flex h-14 flex-1 flex-col items-center justify-center rounded-full bg-ink-100 text-base font-bold leading-tight text-ink-500"
                >
                  Delivery
                  {ordering!.opens && <span className="text-xs font-medium">from {ordering!.opens}</span>}
                </span>
              ) : (
                // GuestOrder starts checkout on Delivery when the URL has ?delivery=1.
                <Link
                  href={`/order/p/${store.id}?delivery=1`}
                  className="flex h-14 flex-1 items-center justify-center rounded-full bg-white text-base font-bold text-brand-700 shadow-lg ring-1 ring-brand-200 transition hover:bg-brand-50 active:scale-[0.97]"
                >
                  Delivery
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JoinCard({
  signedIn,
  signIn,
  perRm,
  rewards,
}: {
  signedIn: boolean;
  signIn: string;
  perRm: number;
  rewards: Reward[];
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white">
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Rewards here</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink-900">
          Earn {perRm === 1 ? "1 point" : `${perRm} points`} for every {sym}1
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          {signedIn ? "Your first order or receipt here starts your points." : "Free to join. Scan your receipt or order here to collect."}
        </p>
      </div>
      {rewards.length > 0 && (
        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {rewards.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="font-semibold text-ink-900">{r.name}</span>
              <span className="shrink-0 tabular-nums text-ink-500">{r.points_cost.toLocaleString()} pts</span>
            </li>
          ))}
        </ul>
      )}
      {!signedIn && (
        <div className="p-4 pt-1">
          <Link
            href={signIn}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
          >
            Join free or sign in
          </Link>
        </div>
      )}
    </section>
  );
}

