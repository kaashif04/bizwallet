"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import RewardsCatalog from "@/components/customer/RewardsCatalog";
import { storeNames, type Place, type Reward, type Voucher } from "@/lib/places";

// A member's points at this restaurant: how close the next reward is, and the
// rewards sheet one tap away. Points are per company, so sister outlets are named.
export default function PointsCard({
  place,
  rewards,
  vouchers,
  userId,
  googleWallet,
  open: openAtStart = false,
}: {
  place: Place;
  rewards: Reward[];
  vouchers: Voucher[];
  userId: string;
  googleWallet?: string; // "Add to Google Wallet" link, when it's set up
  open?: boolean; // ?rewards=1: a notification or "See my rewards" was tapped
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [points, setPoints] = useState(place.points_balance ?? 0);
  const [open, setOpen] = useState(openAtStart);
  const [ios, setIos] = useState(false); // no Google Wallet on iPhone
  useEffect(() => setIos(/iPhone|iPad|iPod/.test(navigator.userAgent)), []);

  const ready = [...rewards].reverse().find((r) => r.points_cost <= points);
  const next = rewards.find((r) => r.points_cost > points);
  const pct = next ? Math.min(100, Math.round((points / next.points_cost) * 100)) : 100;
  const unused = vouchers.filter((v) => v.status === "active").length;
  const shared = place.branches.length > 1 ? storeNames(place.branches.map((b) => b.name), place.company) : null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full overflow-hidden rounded-3xl bg-marple-card p-5 text-left text-on shadow-sm transition active:scale-[0.99]"
        aria-label={`${points} points. Open rewards`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFE3B3]/30 blur-3xl" />
        <span className="relative flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on/80">Your points</span>
          {place.tier.name && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-2xs font-bold backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ backgroundColor: place.tier.color ?? "#FBFAF7" }} />
              {place.tier.name}
              {!!place.tier.discount && ` · ${Number(place.tier.discount)}% off`}
            </span>
          )}
        </span>
        <span className="relative mt-2 block text-5xl font-semibold leading-none tracking-[-0.03em] tabular-nums">
          {points.toLocaleString()}
        </span>

        <span className="relative mt-5 block">
          <span className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">
              {ready ? `${ready.name} is ready` : next ? `Next: ${next.name}` : "Rewards"}
            </span>
            {next && (
              <span className="shrink-0 text-xs text-on/85">
                {(next.points_cost - points).toLocaleString()} pts to {ready ? next.name : "go"}
              </span>
            )}
          </span>
          {next && (
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-black/20">
              <motion.span
                className="block h-full rounded-full bg-[#FFE3B3]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, 3)}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          )}
        </span>

        <span className="relative mt-5 flex items-center gap-2">
          <span className="rounded-full bg-on px-4 py-2 text-sm font-bold text-[#CA2851]">
            {ready ? "Redeem" : "See rewards"}
          </span>
          {unused > 0 && (
            <span className="rounded-full bg-black/20 px-3 py-2 text-sm font-bold">
              {unused} voucher{unused > 1 ? "s" : ""} to use
            </span>
          )}
        </span>
        {shared && <span className="relative mt-3 block text-xs text-on/80">Your points work at {shared}</span>}
      </button>

      {googleWallet && !ios && (
        <a
          href={googleWallet}
          className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="6" width="18" height="13" rx="3" />
            <path d="M3 10h18M16 14.5h2" strokeLinecap="round" />
          </svg>
          Add to Google Wallet
        </a>
      )}

      <AnimatePresence>
        {open && (
          <RewardsCatalog
            onClose={() => {
              setOpen(false);
              // Drop ?rewards=1 so a refresh doesn't reopen it.
              if (openAtStart) router.replace(pathname, { scroll: false });
            }}
            points={points}
            userId={userId}
            rewards={rewards}
            vouchers={vouchers}
            onRedeemed={setPoints}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
