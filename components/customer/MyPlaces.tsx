"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionTitle } from "./ui";
import { useRouter } from "next/navigation";
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
  openCompany,
}: {
  places: Place[];
  rewards: Record<string, Reward[]>;
  vouchers: Record<string, Voucher[]>;
  logos: Record<string, string>;
  userId: string;
  pickupOpen: boolean;
  openCompany?: string | null; // a rewards notification was tapped: open that company's rewards
}) {
  const router = useRouter();
  const [points, setPoints] = useState<Record<string, number>>(() =>
    Object.fromEntries(places.map((p) => [p.company_id, p.points_balance ?? 0]))
  );
  const [open, setOpen] = useState<Place | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    if (openCompany) setOpen(places.find((p) => p.company_id === openCompany) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCompany]);

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
      <SectionTitle>My points</SectionTitle>
      <div className="space-y-4">
        {places.map((p, i) => {
          const pts = points[p.company_id] ?? 0;
          const earned = p.points_earned ?? 0;
          const pct = p.next_tier ? Math.min(100, Math.round((earned / p.next_tier.points_required) * 100)) : 100;
          const list = rewards[p.company_id] ?? [];
          const ready = [...list].reverse().find((r) => r.points_cost <= pts);
          const next = list.find((r) => r.points_cost > pts);
          const unused = vouchers[p.company_id]?.filter((v) => v.status === "active").length ?? 0;
          const shown = expanded === p.company_id;
          const n = p.branches.length;

          return (
            <motion.article
              key={p.company_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="relative overflow-hidden bg-marple-card p-5 text-on">
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFE3B3]/30 blur-3xl" />
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="relative block w-full text-left"
                  aria-label={`${pts} points. Open rewards`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex -space-x-2" aria-hidden="true">
                      {p.branches.slice(0, 3).map((b) => (
                        <BranchLogo
                          key={b.id}
                          name={b.name}
                          logoUrl={logos[b.id]}
                          className="h-9 w-9 rounded-full text-sm ring-2 ring-[#CA2851]"
                        />
                      ))}
                    </span>
                    {p.tier.name && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-2xs font-bold backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: p.tier.color ?? "#FBFAF7" }} />
                        {p.tier.name}
                      </span>
                    )}
                  </span>
                  <span className="mt-4 block text-4xl font-semibold leading-none tracking-[-0.03em]">
                    {pts.toLocaleString()}
                    <span className="ml-1.5 text-base font-semibold text-on/80">pts</span>
                  </span>
                  <span className="mt-4 block">
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
                {n > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(shown ? null : p.company_id)}
                    aria-expanded={shown}
                    className="relative -mx-2 mt-3 inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-bold text-on transition hover:bg-black/10"
                  >
                    Use these points at {n} {n === 1 ? "outlet" : "outlets"}
                    <motion.span aria-hidden="true" animate={{ rotate: shown ? 90 : 0 }} className="inline-block">
                      ›
                    </motion.span>
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {shown && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="divide-y divide-ink-100 overflow-hidden"
                  >
                    {p.branches.map((b) => {
                      const canPickup = b.pickup && pickupOpen && b.open_now !== false;
                      return (
                        <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                          <BranchLogo name={b.name} logoUrl={logos[b.id]} className="h-10 w-10 rounded-xl text-base" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-ink-900">{b.name}</span>
                            {b.open_now !== null && (
                              <span className="flex items-center gap-1 text-xs text-ink-500">
                                <span className={`h-1.5 w-1.5 rounded-full ${b.open_now ? "bg-emerald-500" : "bg-ink-400"}`} />
                                {b.open_now ? "Open now" : "Closed"}
                              </span>
                            )}
                          </span>
                          <Link
                            href={canPickup ? `/order/p/${b.id}` : `/scan?at=${encodeURIComponent(b.name)}`}
                            className="shrink-0 rounded-full bg-brand-600 px-3.5 py-2 text-xs font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.97]"
                          >
                            {canPickup ? "Order pickup" : "Dine in"}
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>

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
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <RewardsCatalog
            onClose={() => {
              setOpen(null);
              // Clear ?rewards so the same notification can open it again.
              if (openCompany) router.replace("/customer/dashboard", { scroll: false });
            }}
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
