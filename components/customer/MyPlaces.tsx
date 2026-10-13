"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import RewardsCatalog from "./RewardsCatalog";
import BranchLogo from "@/components/order/BranchLogo";
import type { Place, Reward, Voucher } from "@/lib/places";

// Home: one card per company the member has joined. Points, tier and rewards
// belong to that company and are shared by all its branches.
export default function MyPlaces({
  places,
  rewards,
  vouchers,
  logos,
  userId,
  pickupOpen,
}: {
  places: Place[];
  rewards: Record<string, Reward[]>;
  vouchers: Record<string, Voucher[]>;
  logos: Record<string, string>;
  userId: string;
  pickupOpen: boolean;
}) {
  const [points, setPoints] = useState<Record<string, number>>(() =>
    Object.fromEntries(places.map((p) => [p.company_id, p.points_balance ?? 0]))
  );
  const [open, setOpen] = useState<Place | null>(null);

  if (!places.length) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3Z" />
          </svg>
        </span>
        <h2 className="mt-4 font-bold text-ink-900">No places yet</h2>
        <p className="mx-auto mt-1 max-w-[30ch] text-sm text-ink-500">
          Scan a table QR or pick a restaurant in Order to start earning.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/scan" className="rounded-full bg-brand-600 py-3 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700">
            Scan table QR
          </Link>
          <Link href="/customer/order" className="rounded-full bg-ink-50 py-3 text-sm font-bold text-ink-800 shadow-well transition hover:bg-ink-100">
            Pick a restaurant
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">My places</h2>
      <div className="space-y-4">
        {places.map((p, i) => {
          const pts = points[p.company_id] ?? 0;
          const earned = p.points_earned ?? 0;
          const pct = p.next_tier ? Math.min(100, Math.round((earned / p.next_tier.points_required) * 100)) : 100;
          const list = rewards[p.company_id] ?? [];
          const ready = [...list].reverse().find((r) => r.points_cost <= pts);
          const next = list.find((r) => r.points_cost > pts);
          const logo = p.branches.map((b) => logos[b.id]).find(Boolean);
          const unused = vouchers[p.company_id]?.length ?? 0;

          return (
            <motion.article
              key={p.company_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="relative block w-full overflow-hidden bg-marple-card p-5 text-left text-on"
                aria-label={`${p.company}: ${pts} points. Open rewards`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFE3B3]/30 blur-3xl" />
                <span className="relative flex items-center gap-3">
                  <BranchLogo name={p.company} logoUrl={logo} className="h-10 w-10 rounded-xl text-base" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{p.company}</span>
                    <span className="block text-xs text-on/80">
                      {p.branches.length
                        ? `${p.branches.length} ${p.branches.length === 1 ? "branch" : "branches"} you've ordered from`
                        : "Rewards member"}
                    </span>
                  </span>
                  {p.tier.name && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-2xs font-bold backdrop-blur-sm">
                      <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: p.tier.color ?? "#FBFAF7" }} />
                      {p.tier.name}
                    </span>
                  )}
                </span>
                <span className="relative mt-4 block text-4xl font-semibold leading-none tracking-[-0.03em]">
                  {pts.toLocaleString()}
                  <span className="ml-1.5 text-base font-semibold text-on/80">pts</span>
                </span>
                <span className="relative mt-4 block">
                  <span className="flex justify-between text-xs text-on/85">
                    <span>
                      {p.next_tier
                        ? `${Math.max(0, p.next_tier.points_required - earned).toLocaleString()} pts to ${p.next_tier.name}`
                        : "Top tier"}
                    </span>
                    {!!p.tier.discount && <span>{Number(p.tier.discount)}% off as {p.tier.name}</span>}
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-black/20">
                    <motion.span
                      className="block h-full rounded-full bg-[#FFE3B3]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 3)}%` }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                    />
                  </span>
                </span>
              </button>

              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="flex w-full items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-left shadow-well transition hover:bg-ink-100"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink-900">
                      {ready ? `${ready.name} is ready` : next ? next.name : "Rewards"}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {ready
                        ? "Tap to redeem"
                        : next
                          ? `${(next.points_cost - pts).toLocaleString()} more points`
                          : "See what you can redeem"}
                      {unused > 0 && ` · ${unused} voucher${unused > 1 ? "s" : ""} to use`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-brand-700">Rewards ›</span>
                </button>

                {p.branches.length > 0 && (
                  <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {p.branches.map((b) => {
                      const canPickup = b.pickup && pickupOpen && b.open_now !== false;
                      return (
                        <li key={b.id} className="w-40 shrink-0 snap-start">
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-50">
                            {b.cover_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center">
                                <BranchLogo name={b.name} logoUrl={logos[b.id]} className="h-11 w-11 rounded-xl text-lg" />
                              </span>
                            )}
                            {b.open_now !== null && (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-2xs font-bold text-ink-700 shadow-sm">
                                <span className={`h-1.5 w-1.5 rounded-full ${b.open_now ? "bg-emerald-500" : "bg-ink-400"}`} />
                                {b.open_now ? "Open" : "Closed"}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 truncate text-sm font-bold text-ink-900">{b.name}</p>
                          <Link
                            href={canPickup ? `/order/p/${b.id}` : `/scan?at=${encodeURIComponent(b.name)}`}
                            className="mt-1 flex h-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
                          >
                            {canPickup ? "Order pickup" : "Dine in"}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <RewardsCatalog
            onClose={() => setOpen(null)}
            company={open.company}
            points={points[open.company_id] ?? 0}
            userId={userId}
            rewards={rewards[open.company_id] ?? []}
            vouchers={vouchers[open.company_id] ?? []}
            onRedeemed={(nb) => setPoints((m) => ({ ...m, [open.company_id]: nb }))}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
