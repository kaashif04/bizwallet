"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Reward, Voucher } from "@/lib/places";

// redeem_reward's p_reward_id is a strict Postgres uuid — reject anything
// else client-side instead of letting a raw "invalid input syntax" error
// through (e.g. if a non-UUID placeholder id ever ends up in `rewards`).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One company's rewards (spent from its points) and the vouchers to use there.
export default function RewardsCatalog({
  onClose,
  points,
  userId,
  rewards,
  vouchers,
  onRedeemed,
}: {
  onClose: () => void;
  points: number;
  userId: string | null;
  rewards: Reward[];
  vouchers: Voucher[];
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
    if (!UUID_RE.test(r.id)) {
      return setError("This reward isn't available for redemption right now.");
    }
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
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-sheet bg-white shadow-sheet"
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
            <h2 className="min-w-0 text-lg font-bold leading-tight text-ink-900">Rewards</h2>
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
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-on"
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.p>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {success.reward} unlocked
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
                className="mt-6 w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-on shadow-lg transition active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {vouchers.length > 0 && (
                <section className="mt-3">
                  <h3 className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Your vouchers</h3>
                  <ul className="mt-2 space-y-2">
                    {[...vouchers]
                      .sort((a, b) => Number(a.status !== "active") - Number(b.status !== "active"))
                      .map((v) => (
                        <VoucherCard key={v.id} v={v} />
                      ))}
                  </ul>
                </section>
              )}
              <h3 className="mt-6 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Spend your points</h3>
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
                        className="flex items-center gap-3 rounded-2xl bg-ink-50 p-4 shadow-well"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                          {r.kind === "voucher" ? (
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V8Z" />
                              <path d="M14 7v10" strokeDasharray="2 2" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" />
                              <path d="M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1Z" />
                            </svg>
                          )}
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
                              ? "bg-brand-600 text-on hover:bg-brand-700"
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

// Staff type the code at the counter (BizPos: Discount, Promo or voucher code).
function VoucherCard({ v }: { v: Voucher }) {
  const [copied, setCopied] = useState(false);
  const active = v.status === "active";
  const worth =
    v.kind === "free_item" ? "1 free item" : v.value ? `RM${Number(v.value).toFixed(2).replace(/\.00$/, "")} off` : null;

  return (
    <li className={`rounded-xl bg-ink-50 p-4 shadow-well ${active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900">{v.title}</p>
          {worth && worth.toLowerCase() !== v.title.toLowerCase() && (
            <p className="text-xs font-semibold text-brand-700">{worth}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold ${
            active ? "bg-emerald-50 text-emerald-700" : "bg-white text-ink-500"
          }`}
        >
          {active
            ? "Active"
            : v.used_at
              ? `Used on ${new Date(v.used_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}`
              : "Used"}
        </span>
      </div>
      <button
        type="button"
        disabled={!active}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(v.code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            // Clipboard blocked: the code is on screen to read out.
          }
        }}
        aria-label={`Voucher code ${v.code}. Tap to copy`}
        className={`mt-3 w-full rounded-xl border-2 border-dashed border-brand-300 bg-white py-3 text-center font-mono text-2xl font-bold tracking-widest text-brand-700 transition active:scale-[0.99] ${
          active ? "" : "line-through"
        }`}
      >
        {copied ? "Copied" : v.code}
      </button>
      <p className="mt-2 text-center text-xs text-ink-500">
        {active ? "Show this code at the counter" : "Already used"}
      </p>
    </li>
  );
}
