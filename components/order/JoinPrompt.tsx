"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// A signed-in member on a restaurant they haven't joined: join its rewards,
// optionally opting in to its offers (consent is per company).
export default function JoinPrompt({
  companyId,
  company,
  pointsPerRm,
  onJoined,
}: {
  companyId: string;
  company: string;
  pointsPerRm: number;
  onJoined: (points: number) => void;
}) {
  const [supabase] = useState(() => createClient());
  const [offers, setOffers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("join_company", { p_company: companyId, p_marketing_consent: offers });
    setBusy(false);
    if (error) return setError(error.message);
    const pts = Number(data?.points_balance ?? 0);
    setDone(pts);
    onJoined(pts);
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <AnimatePresence mode="wait" initial={false}>
          {done !== null ? (
            <motion.p
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-emerald-700"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              You&apos;re in {company} rewards{done > 0 ? `, with ${done} welcome points` : ""}.
            </motion.p>
          ) : (
            <motion.div key="ask" exit={{ opacity: 0 }} className="p-4">
              <p className="font-bold text-ink-900">Join {company} rewards</p>
              <p className="mt-0.5 text-xs text-ink-500">
                Earn {pointsPerRm === 1 ? "1 point" : `${pointsPerRm} points`} per RM1 at {company}.
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={offers}
                  onChange={(e) => setOffers(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(var(--brand-600))]"
                />
                Send me offers from {company}
              </label>
              {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
              <button
                type="button"
                onClick={join}
                disabled={busy}
                className="mt-3 h-10 w-full rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? "Joining…" : "Join"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
