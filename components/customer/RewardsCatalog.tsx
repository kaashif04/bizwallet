"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Reward } from "@/lib/dashboard-demo";

export default function RewardsCatalog({
  onClose,
  points,
  userId,
  rewards,
  onRedeemed,
}: {
  onClose: () => void;
  points: number;
  userId: string | null;
  rewards: Reward[];
  onRedeemed: (newPoints: number) => void;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [localPoints, setLocalPoints] = useState(points);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; reward: string } | null>(null);

  async function redeem(r: Reward) {
    setError(null);
    if (!userId) return setError("Sign in to redeem rewards.");
    if (localPoints < r.points_cost) return setError("Not enough points yet.");
    setBusyId(r.id);
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_user_id: userId,
      p_reward_id: r.id,
    });
    setBusyId(null);
    if (error) {
      return setError(
        error.message.toLowerCase().includes("not enough")
          ? "Not enough points yet."
          : error.message
      );
    }
    const nb = Number(data?.points_balance ?? localPoints - r.points_cost);
    setLocalPoints(nb);
    onRedeemed(nb);
    setSuccess({ code: data?.code ?? "—", reward: data?.reward ?? r.name });
    router.refresh();
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 pb-6 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Rewards</h2>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
              {localPoints.toLocaleString()} pts
            </span>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 220 }}
                className="text-5xl"
              >
                🎉
              </motion.p>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {success.reward} unlocked!
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Show this code at the counter:
              </p>
              <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-4 font-mono text-2xl font-bold tracking-widest text-brand-700">
                {success.code}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">Redeem your points for rewards.</p>
              {error && (
                <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-4 space-y-3">
                {rewards.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No rewards available yet.
                  </p>
                ) : (
                  rewards.map((r) => {
                    const affordable = localPoints >= r.points_cost;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-2xl">
                          {r.kind === "voucher" ? "🎟️" : "🎁"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                          {r.description && (
                            <p className="truncate text-xs text-slate-500">
                              {r.description}
                            </p>
                          )}
                          <p className="mt-0.5 text-sm font-bold text-brand-700">
                            {r.points_cost.toLocaleString()} pts
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => redeem(r)}
                          disabled={!affordable || busyId === r.id}
                          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                            affordable
                              ? "bg-brand-600 text-white hover:bg-brand-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {busyId === r.id ? "…" : affordable ? "Redeem" : "Locked"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
