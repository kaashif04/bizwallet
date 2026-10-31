"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import RewardsCatalog from "@/components/customer/RewardsCatalog";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";
import { storeNames, type Place, type Reward, type Voucher } from "@/lib/places";

// A member's tab at this restaurant, written on the pad: points as the total,
// the next reward as the line under it, a READY stamp when one can be taken.
export default function PointsCard({
  place,
  rewards,
  vouchers,
  userId,
  name,
  open: openAtStart = false,
}: {
  place: Place;
  rewards: Reward[];
  vouchers: Voucher[];
  userId: string;
  name: string | null; // the member's first name, for the band
  open?: boolean; // ?rewards=1: a notification or "See my rewards" was tapped
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [points, setPoints] = useState(place.points_balance ?? 0);
  const [open, setOpen] = useState(openAtStart);

  const ready = [...rewards].reverse().find((r) => r.points_cost <= points);
  const next = rewards.find((r) => r.points_cost > points);
  const pct = next ? Math.min(100, Math.round((points / next.points_cost) * 100)) : 100;
  const unused = vouchers.filter((v) => v.status === "active").length;
  const shared = place.branches.length > 1 ? storeNames(place.branches.map((b) => b.name), place.company) : null;

  return (
    <>
      <Chit
        band={
          <div className="flex items-center justify-between gap-3">
            <PadLabel>{name ? `${name}'s card` : "Your card"}</PadLabel>
            {place.tier.name && (
              <span className="pad-label flex items-center gap-1.5 text-ink-800">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: place.tier.color ?? "currentColor" }} aria-hidden="true" />
                {place.tier.name}
                {!!place.tier.discount && ` · ${Number(place.tier.discount)}% off`}
              </span>
            )}
          </div>
        }
      >
        <div className="ruled px-4">
          <div className="flex items-end justify-between gap-3 py-4">
            <span className="text-sm font-semibold text-ink-600">Points</span>
            <motion.span
              key={points}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="pad text-5xl font-extrabold leading-none text-brand-700"
            >
              {points.toLocaleString()}
            </motion.span>
          </div>

          {ready && (
            <div className="flex items-center justify-between gap-3 py-3.5">
              <span className="min-w-0 truncate text-sm font-bold text-ink-900">{ready.name}</span>
              <Stamp ok>Ready</Stamp>
            </div>
          )}

          {next && (
            <div className="py-3.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-ink-900">Next: {next.name}</span>
                <span className="shrink-0 tabular-nums text-ink-500">{(next.points_cost - points).toLocaleString()} to go</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-rule" aria-hidden="true">
                <motion.div
                  className="h-full rounded-full bg-brand-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 3)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}

          {unused > 0 && (
            <div className="flex justify-between py-3.5 text-sm">
              <span className="font-semibold text-ink-900">Vouchers to use</span>
              <span className="pad font-bold text-brand-700">{unused}</span>
            </div>
          )}
        </div>

        <div className="total-rule mx-4 flex items-center justify-between gap-3 py-4">
          <span className="min-w-0 text-xs text-ink-500">{shared ? `Works at ${shared}` : "Earn on every bill here"}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-on transition hover:bg-brand-700 active:scale-[0.97]"
          >
            {ready ? "Redeem" : "Rewards"}
          </button>
        </div>
      </Chit>

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
    </>
  );
}
