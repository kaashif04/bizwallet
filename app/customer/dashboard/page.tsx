import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/customer/DashboardHeader";
import ActiveOrders from "@/components/customer/ActiveOrders";
import BranchLogo from "@/components/order/BranchLogo";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";
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

        <div className="mt-7 space-y-8">
          <ActiveOrders names={Object.fromEntries(names)} />

          {ready.length > 0 && (
            <section>
              <SectionTitle>Ready for you</SectionTitle>
              <ul className="ruled overflow-hidden rounded-xl bg-white shadow-sm">
                {ready.map((c) => (
                  <li key={c.p.company_id}>
                    <Link href={`${c.href}?rewards=1`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {c.ready ? c.ready.name : `${c.vouchers} voucher${c.vouchers > 1 ? "s" : ""} to use`}
                        </span>
                        <span className="block truncate text-xs text-ink-500">at {storeNames(c.p.branches.map((b) => b.name), c.p.company)}</span>
                      </span>
                      <Stamp ok>{c.ready ? "Ready" : "Use"}</Stamp>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <SectionTitle>Your places</SectionTitle>
            {cards.length === 0 ? (
              <Chit band={<PadLabel>No places yet</PadLabel>}>
                <div className="p-4">
                  <p className="text-sm text-ink-600">Scan the QR on your table or receipt to start a card at that restaurant.</p>
                  <Link
                    href="/scan"
                    className="mt-4 flex h-12 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-on transition hover:bg-brand-700"
                  >
                    Scan a QR
                  </Link>
                </div>
              </Chit>
            ) : (
              <ul className="space-y-5">
                {cards.map(({ p, pts, ready, next, href }) => {
                  const cover = p.branches.find((b) => b.cover_url)?.cover_url;
                  const open = p.branches.find((b) => b.open_now !== null)?.open_now ?? null;
                  const pct = next ? Math.max(3, Math.min(100, Math.round((pts / next.points_cost) * 100))) : 100;
                  const body = (
                    <>
                      <span className="relative block h-24 bg-ink-800">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                        <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4 pb-3">
                          <BranchLogo
                            name={p.branches[0]?.name ?? p.company}
                            logoUrl={p.branches[0] ? logos[p.branches[0].id] : null}
                            className="h-10 w-10 rounded-lg text-base ring-2 ring-on/80"
                          />
                          <span className="min-w-0 flex-1 text-on">
                            <span className="pad block truncate text-lg font-extrabold leading-tight">
                              {storeNames(p.branches.map((b) => b.name), p.company)}
                            </span>
                            {open !== null && <span className="block text-xs text-on/80">{open ? "Open now" : "Closed now"}</span>}
                          </span>
                        </span>
                      </span>
                      <span className="ruled block px-4">
                        <span className="flex items-end justify-between gap-3 py-3.5">
                          <span className="text-sm font-semibold text-ink-600">
                            Points{p.tier.name ? ` · ${p.tier.name}` : ""}
                          </span>
                          <span className="pad text-3xl font-extrabold leading-none text-brand-700">{pts.toLocaleString()}</span>
                        </span>
                        <span className="block py-3">
                          <span className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate font-semibold text-ink-900">
                              {ready ? ready.name : next ? `Next: ${next.name}` : "See rewards"}
                            </span>
                            {ready ? (
                              <Stamp ok>Ready</Stamp>
                            ) : next ? (
                              <span className="shrink-0 text-xs tabular-nums text-ink-500">{(next.points_cost - pts).toLocaleString()} to go</span>
                            ) : null}
                          </span>
                          {!ready && next && (
                            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-paper-rule">
                              <span className="block h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                            </span>
                          )}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={p.company_id}>
                      <div className="chit">
                        <div className="chit-paper">
                          {href ? (
                            <Link href={href} className="block transition active:opacity-90">
                              {body}
                            </Link>
                          ) : (
                            body
                          )}
                          {p.branches.length > 1 && (
                            <span className="flex flex-wrap gap-2 border-t border-dashed border-ink-300 px-4 py-3">
                              {p.branches.map((b) => (
                                <Link
                                  key={b.id}
                                  href={`/s/${b.id}`}
                                  className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-800 transition hover:bg-ink-200"
                                >
                                  {b.name}
                                </Link>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <nav className="ruled overflow-hidden rounded-xl bg-white shadow-sm" aria-label="More">
            {[
              ["/customer/orders", "My orders", "Every bill you were part of"],
              ["/scan", "Scan a QR", "On your table or receipt"],
              ["/customer/profile", "Profile", "Name, appearance, promotions"],
            ].map(([href, title, note]) => (
              <Link key={href} href={href} className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                <span>
                  <span className="block text-sm font-bold text-ink-900">{title}</span>
                  <span className="block text-xs text-ink-500">{note}</span>
                </span>
                <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
