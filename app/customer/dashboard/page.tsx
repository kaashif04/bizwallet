import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import ActiveOrders from "@/components/customer/ActiveOrders";
import BranchLogo from "@/components/order/BranchLogo";
import { SectionTitle, screen } from "@/components/customer/ui";
import { groupBy, storeNames, type Place, type Reward } from "@/lib/places";
import { outletLogos, outletNames } from "@/lib/guest-order";

// Your places: the restaurants you collect points at. Each opens its own home
// page (/s/<outlet>), where ordering, rewards and orders live; there's no
// app-wide dashboard. ?rewards=<branch name> or ?voucher=<code> come from a
// notification and jump to that restaurant's rewards.
export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { rewards?: string; voucher?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const [{ data: member }, { data: placeData }, logos, names] = await Promise.all([
    supabase.from("members").select("full_name").eq("id", uid).maybeSingle(),
    supabase.rpc("wallet_my_places"),
    outletLogos(supabase),
    outletNames(supabase),
  ]);
  const places = (placeData ?? []) as Place[];
  const companyIds = places.map((p) => p.company_id);
  const [{ data: rewardRows }, { data: voucherRows }] = companyIds.length
    ? await Promise.all([
        supabase
          .from("loyalty_rewards")
          .select("id,company_id,name,description,points_cost,kind,value")
          .eq("is_active", true)
          .in("company_id", companyIds)
          .order("points_cost"),
        supabase.from("vouchers").select("company_id,code").eq("user_id", uid).eq("status", "active"),
      ])
    : [{ data: [] }, { data: [] }];

  const home = (p: Place) => (p.branches[0] ? `/s/${p.branches[0].id}` : null);
  const notified =
    places.find((p) => p.company_id === (voucherRows ?? []).find((v) => v.code === searchParams.voucher)?.company_id) ??
    places.find((p) => p.branches.some((b) => b.name === searchParams.rewards)) ??
    (searchParams.rewards && places.length === 1 ? places[0] : null);
  if (notified && home(notified)) redirect(`${home(notified)}?rewards=1`);

  const rewards = groupBy((rewardRows ?? []) as Reward[]);
  const vouchers = groupBy((voucherRows ?? []) as { company_id: string; code: string }[]);
  const cards = places.map((p) => {
    const pts = p.points_balance ?? 0;
    const list = rewards[p.company_id] ?? [];
    return {
      p,
      pts,
      ready: [...list].reverse().find((r) => r.points_cost <= pts),
      next: list.find((r) => r.points_cost > pts),
      vouchers: vouchers[p.company_id]?.length ?? 0,
      href: home(p),
    };
  });
  const ready = cards.filter((c) => (c.ready || c.vouchers) && c.href);

  return (
    <div className="min-h-dvh bg-ink-50">
      <div className={screen}>
        <DashboardHeader name={member?.full_name ?? user?.email?.split("@")[0] ?? "there"} />

        <div className="mt-6 space-y-8">
          <ActiveOrders names={Object.fromEntries(names)} />

          {ready.length > 0 && (
            <section>
              <SectionTitle>Ready for you</SectionTitle>
              <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {ready.map((c) => (
                  <li key={c.p.company_id} className="w-60 shrink-0">
                    <Link
                      href={`${c.href}?rewards=1`}
                      className="flex h-full items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition active:scale-[0.98]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg" aria-hidden="true">
                        🎁
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {c.ready ? `${c.ready.name} is ready` : `${c.vouchers} voucher${c.vouchers > 1 ? "s" : ""} to use`}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          at {storeNames(c.p.branches.map((b) => b.name), c.p.company)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle>Your places</SectionTitle>
            {cards.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center">
                <h2 className="font-bold text-ink-900">No places yet</h2>
                <p className="mx-auto mt-1 max-w-[30ch] text-sm text-ink-500">
                  Scan the QR on your table or receipt to start earning at that restaurant.
                </p>
                <Link
                  href="/scan"
                  className="mt-5 block rounded-full bg-brand-600 py-3 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700"
                >
                  Scan a QR
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {cards.map(({ p, pts, ready, next, href }) => {
                  const cover = p.branches.find((b) => b.cover_url)?.cover_url;
                  const open = p.branches.find((b) => b.open_now !== null)?.open_now ?? null;
                  const pct = next ? Math.max(3, Math.min(100, Math.round((pts / next.points_cost) * 100))) : 100;
                  const body = (
                    <>
                      <span className="relative block h-28 bg-brand-100">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {open !== null && (
                          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-2xs font-bold text-ink-800 backdrop-blur">
                            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-ink-400"}`} />
                            {open ? "Open now" : "Closed"}
                          </span>
                        )}
                      </span>
                      <span className="relative block px-4 pb-4">
                        <span className="-mt-7 flex items-end justify-between gap-3">
                          <BranchLogo
                            name={p.branches[0]?.name ?? p.company}
                            logoUrl={p.branches[0] ? logos[p.branches[0].id] : null}
                            className="h-14 w-14 rounded-2xl text-xl shadow-md ring-4 ring-white"
                          />
                          {p.tier.name && (
                            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-2xs font-bold text-ink-700">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.tier.color ?? "#CA2851" }} />
                              {p.tier.name}
                            </span>
                          )}
                        </span>
                        <span className="mt-2 flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-lg font-semibold tracking-[-0.02em] text-ink-900">
                            {storeNames(p.branches.map((b) => b.name), p.company)}
                          </span>
                          <span className="shrink-0 text-lg font-semibold tabular-nums text-ink-900">
                            {pts.toLocaleString()} <span className="text-xs font-bold text-ink-500">pts</span>
                          </span>
                        </span>
                        <span className="mt-2 block text-xs text-ink-500">
                          {ready
                            ? `${ready.name} is ready to redeem`
                            : next
                              ? `${(next.points_cost - pts).toLocaleString()} pts to ${next.name}`
                              : "Tap to see rewards"}
                        </span>
                        {next && (
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-ink-100">
                            <span className="block h-full rounded-full bg-marple" style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </span>
                    </>
                  );
                  return (
                    <li key={p.company_id}>
                      {href ? (
                        <Link href={href} className="block overflow-hidden rounded-3xl bg-white shadow-sm transition active:scale-[0.99]">
                          {body}
                        </Link>
                      ) : (
                        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">{body}</div>
                      )}
                      {p.branches.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-2 px-1">
                          {p.branches.map((b) => (
                            <Link
                              key={b.id}
                              href={`/s/${b.id}`}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-800 shadow-sm transition hover:bg-ink-100"
                            >
                              {b.name} ›
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <nav className="grid grid-cols-2 gap-3" aria-label="More">
            <Link href="/customer/orders" className="rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-ink-100">
              My orders
              <span className="block text-xs font-normal text-ink-500">Every bill and receipt</span>
            </Link>
            <Link href="/scan" className="rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-ink-100">
              Scan a QR
              <span className="block text-xs font-normal text-ink-500">Table or receipt</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
