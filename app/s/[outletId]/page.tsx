import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { billplzEnabled } from "@/lib/billplz";
import { currencySymbol } from "@/lib/format";
import { DAYS, clock, openLabel } from "@/lib/hours";
import { outletLogos, type Banner, type PickupOutlet } from "@/lib/guest-order";
import type { Place, Reward, Voucher } from "@/lib/places";
import BranchLogo from "@/components/order/BranchLogo";
import BannerCarousel from "@/components/order/BannerCarousel";
import RememberPlace from "@/components/order/RememberPlace";
import ItemMark from "@/components/order/ItemMark";
import PointsCard from "@/components/store/PointsCard";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";
import { SectionTitle } from "@/components/customer/ui";

type Store = PickupOutlet & { ordering: boolean };
type Dish = { id: string; name: string; price: number; image_url: string | null; times?: number };

const sym = currencySymbol("MYR");
const money = (n: number) => `${sym}${Number(n).toFixed(2)}`;

// A restaurant's own home: what customers reach from its table QR, receipt QR
// or the link the owner shares. Order, offers, dishes, and (signed in) points,
// rewards and past orders here. ?rewards=1 opens the rewards sheet.
export default async function StorePage({
  params,
  searchParams,
}: {
  params: { outletId: string };
  searchParams: { rewards?: string };
}) {
  if (!/^[0-9a-f-]{36}$/i.test(params.outletId)) notFound();
  const supabase = createClient();
  const [{ data }, logos, { data: bannerData }, { data: dishData }, { data: auth }] = await Promise.all([
    supabase.rpc("guest_store", { p_outlet: params.outletId }),
    outletLogos(supabase),
    supabase.rpc("wallet_banners", { p_outlet: params.outletId }),
    supabase.rpc("guest_store_dishes", { p_outlet: params.outletId }),
    supabase.auth.getUser(),
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
      .order("points_cost"),
    supabase.from("loyalty_programs").select("is_enabled,points_per_rm").eq("company_id", store.company_id).maybeSingle(),
  ]);
  const rewards = (rewardRows ?? []) as Reward[];
  const [{ data: placeData }, { data: voucherRows }, { data: orders }] = member
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
      ])
    : [{ data: null }, { data: null }, { data: null }];
  const place = ((placeData ?? []) as Place[]).find((p) => p.company_id === store.company_id) ?? null;
  const loyaltyOn = program?.is_enabled !== false;

  const canPickup = store.pickup && billplzEnabled();
  // Malaysia wall-clock time, for "opens tomorrow 10am" on a UTC server.
  const klNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const status = openLabel(store.open_now, store.today, store.hours, klNow);
  const todayIdx = (klNow.getDay() + 6) % 7; // Monday = 0
  const here = `/s/${store.id}`;
  const signIn = `/login?redirect=${encodeURIComponent(here)}`;
  const dishHref = canPickup ? `/order/p/${store.id}` : null;

  const actions = [
    canPickup && { href: `/order/p/${store.id}`, label: "Order", icon: "M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" },
    store.ordering && {
      href: `/scan?at=${encodeURIComponent(store.name)}`,
      label: "Dine in",
      icon: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 8h3v3H8zM13 13h3v3h-3z",
    },
    store.maps_url && { href: store.maps_url, label: "Directions", icon: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z", external: true },
    store.phone && {
      href: `tel:${store.phone.replace(/\s/g, "")}`,
      label: "Call",
      icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
    },
  ].filter(Boolean) as { href: string; label: string; icon: string; external?: boolean }[];

  const firstName = member?.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="min-h-dvh bg-ink-50">
      <RememberPlace outletId={store.id} />
      <main className={`mx-auto max-w-md ${canPickup ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))]" : "pb-16"}`}>
        {/* The restaurant owns the top of the screen: its photo, logo and name. */}
        <header className="relative h-[min(46dvh,23rem)] overflow-hidden bg-ink-800">
          {store.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/75" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            {member ? (
              <Link
                href="/customer/dashboard"
                className="flex h-9 items-center gap-1.5 rounded-lg bg-black/35 px-3 text-xs font-bold text-on backdrop-blur-md transition hover:bg-black/50"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" />
                </svg>
                Your places
              </Link>
            ) : (
              <span />
            )}
            {!member && (
              <Link href={signIn} className="flex h-9 items-center rounded-lg bg-white px-3.5 text-xs font-bold text-ink-900 transition hover:bg-ink-100">
                Sign in
              </Link>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4 pb-10">
            <BranchLogo name={store.name} logoUrl={logos[store.id]} className="h-14 w-14 rounded-xl text-xl ring-2 ring-on/80" />
            <div className="min-w-0 pb-0.5 text-on">
              <h1 className="pad text-[1.75rem] font-extrabold leading-[1.05] drop-shadow">{store.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-on/85">
                {status && (
                  <span className={`h-2 w-2 shrink-0 rounded-full ${status.open ? "bg-emerald-500" : "bg-white/50"}`} aria-hidden="true" />
                )}
                {status ? status.text : store.tagline}
              </p>
            </div>
          </div>
        </header>

        <div className="relative -mt-6 space-y-7 px-4">
          {/* The member's card, or what joining gets you, on the pad. */}
          {loyaltyOn &&
            (member && place ? (
              <PointsCard
                place={place}
                rewards={rewards}
                vouchers={(voucherRows ?? []) as Voucher[]}
                userId={user!.id}
                name={firstName}
                open={!!searchParams.rewards}
              />
            ) : (
              <JoinCard signedIn={!!member} signIn={signIn} perRm={Number(program?.points_per_rm ?? 1)} rewards={rewards.slice(0, 3)} />
            ))}

          {actions.length > 0 && (
            <nav aria-label="Quick actions" className={`grid divide-x divide-paper-rule overflow-hidden rounded-xl bg-white shadow-sm`} style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
              {actions.map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex flex-col items-center gap-1.5 py-3.5 text-xs font-bold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={a.icon} />
                  </svg>
                  {a.label}
                </a>
              ))}
            </nav>
          )}

          {(bannerData ?? []).length > 0 && (
            <section>
              <SectionTitle>Offers</SectionTitle>
              <BannerCarousel banners={bannerData as Banner[]} branches={[store]} pickupOpen={canPickup} outletId={store.id} />
            </section>
          )}

          {dishes.mine.length > 0 && <DishRail title="Your usuals" dishes={dishes.mine} href={dishHref} mine />}
          {dishes.popular.length > 0 && <DishRail title="Popular here" dishes={dishes.popular} href={dishHref} />}

          {member && (orders ?? []).length > 0 && (
            <section>
              <SectionTitle href="/customer/orders" action="All orders">
                Your bills here
              </SectionTitle>
              <ul className="ruled overflow-hidden rounded-xl bg-white shadow-sm">
                {orders!.map((o) => (
                  <li key={o.id}>
                    <Link href={`/customer/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {new Date(o.created_at).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <span className="block truncate text-xs text-ink-500">{o.table_label ? `Table ${o.table_label}` : "Counter or pickup"}</span>
                      </span>
                      {o.status === "open" ? <Stamp>Open</Stamp> : <span className="pad text-sm font-bold text-ink-900">{money(o.total)}</span>}
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
              <div className="ruled overflow-hidden rounded-xl bg-white shadow-sm">
                {store.hours && (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm">
                      <span className="font-bold text-ink-900">
                        Today{" "}
                        <span className="font-normal text-ink-600">
                          {store.hours[todayIdx] ? `${clock(store.hours[todayIdx]!.open)} – ${clock(store.hours[todayIdx]!.close)}` : "Closed"}
                        </span>
                      </span>
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-400 transition group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <path d="m6 3 5 5-5 5" />
                      </svg>
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
                    <span className="shrink-0 font-bold text-brand-700">Map</span>
                  </a>
                )}
              </div>
            </section>
          )}

          <p className="pb-2 text-center text-xs text-ink-400">Powered by BizWallet</p>
        </div>
      </main>

      {canPickup && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-ink-50/90 backdrop-blur-md">
          <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <Link
              href={`/order/p/${store.id}`}
              className="flex w-full items-center justify-between rounded-xl bg-brand-600 px-5 py-4 text-base font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
            >
              <span>Order pickup</span>
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
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
    <Chit band={<PadLabel>Rewards here</PadLabel>}>
      <div className="px-4 pt-4">
        <p className="pad text-[1.375rem] font-extrabold leading-tight text-ink-900">
          {perRm === 1 ? "1 point" : `${perRm} points`} for every {sym}1
        </p>
        <p className="mt-1 text-sm text-ink-500">
          {signedIn ? "Your first order or receipt here starts your card." : "Free to join. Order here or scan your receipt."}
        </p>
      </div>
      {rewards.length > 0 && (
        <ul className="ruled mt-3 px-4">
          {rewards.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="font-semibold text-ink-900">{r.name}</span>
              <span className="pad shrink-0 font-bold text-brand-700">{r.points_cost.toLocaleString()} pts</span>
            </li>
          ))}
        </ul>
      )}
      {!signedIn && (
        <div className="total-rule mx-4 py-4">
          <Link
            href={signIn}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
          >
            Join free or sign in
          </Link>
        </div>
      )}
    </Chit>
  );
}

// Dishes at one fixed square scale, so a menu reads as a set.
function DishRail({ title, dishes, href, mine }: { title: string; dishes: Dish[]; href: string | null; mine?: boolean }) {
  return (
    <section>
      <SectionTitle href={href ?? undefined} action="Order">
        {title}
      </SectionTitle>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {dishes.map((d) => {
          const card = (
            <>
              {d.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
              ) : (
                <ItemMark name={d.name} className="aspect-square w-full rounded-lg text-2xl" />
              )}
              <span className="mt-2 block line-clamp-2 text-sm font-bold leading-snug text-ink-900">{d.name}</span>
              <span className="block text-xs text-ink-500">
                {money(d.price)}
                {mine && d.times && d.times > 1 ? ` · had ${d.times}×` : ""}
              </span>
            </>
          );
          return (
            <li key={d.id} className="w-[7.5rem] shrink-0 snap-start">
              {href ? (
                <Link href={href} className="block transition active:scale-[0.97]">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
