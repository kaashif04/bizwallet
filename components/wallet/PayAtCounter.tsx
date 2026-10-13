"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useSheet } from "@/components/order/useSheet";

type Code = { code: string; expires_at: string };
type Used = { amount: number; balance?: number };

// Pay with wallet credit at the counter: a 6-digit code, good for 90 seconds
// and one payment. Staff type it into the POS; we watch for it being used.
export default function PayAtCounter({ balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={balance <= 0}
        className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left transition hover:shadow-md active:scale-[0.99] disabled:opacity-60"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2.5" />
            <path d="M7 10h2M11 10h2M15 10h2M7 14h10" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block font-bold text-ink-900">Pay at counter</span>
          <span className="block text-xs text-ink-500">
            {balance > 0 ? "Show a code to the cashier to pay with your credit" : "Top up first to pay with credit"}
          </span>
        </span>
        <span aria-hidden="true" className="text-ink-400">›</span>
      </button>
      <AnimatePresence>{open && <CodeSheet onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function CodeSheet({ onClose }: { onClose: () => void }) {
  useSheet(onClose);
  const [supabase] = useState(() => createClient());
  const [code, setCode] = useState<Code | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<Used | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const fresh = useCallback(async () => {
    setError(null);
    setCode(null);
    const { data, error } = await supabase.rpc("wallet_pay_code");
    if (error) setError(error.message);
    else setCode(data as Code);
  }, [supabase]);
  useEffect(() => {
    fresh();
  }, [fresh]);

  // Tick the countdown, and watch for the cashier using the code.
  useEffect(() => {
    if (!code || used) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(async () => {
      const { data } = await supabase
        .from("wallet_pay_codes")
        .select("used_at, amount")
        .eq("code", code.code)
        .maybeSingle();
      if (data?.used_at) {
        setUsed({ amount: Number(data.amount) });
        navigator.vibrate?.([30, 60, 30]);
      }
    }, 2000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [supabase, code, used]);

  const left = code ? Math.max(0, Math.ceil((Date.parse(code.expires_at) - now) / 1000)) : 0;
  const expired = !!code && left === 0;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Pay at counter"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-sheet bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-center shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <AnimatePresence mode="wait">
          {used ? (
            <motion.div key="paid" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <motion.path d="M12 25l8 8 16-17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.1 }} />
                </svg>
              </span>
              <p className="mt-4 text-xl font-bold text-ink-900">Paid RM{used.amount.toFixed(2)}</p>
              <p className="mt-1 text-sm text-ink-500">From your wallet credit. Points are on their way.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 h-12 w-full rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Show this to the cashier</p>
              {error ? (
                <p role="alert" className="mt-6 text-sm text-rose-700">{error}</p>
              ) : (
                <p
                  className={`mt-4 font-semibold tabular-nums tracking-[0.25em] transition-opacity ${
                    expired ? "text-ink-300" : "text-ink-900"
                  } text-5xl`}
                  aria-live="polite"
                >
                  {code ? `${code.code.slice(0, 3)} ${code.code.slice(3)}` : "··· ···"}
                </p>
              )}
              {code && !expired && (
                <div className="mx-auto mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-marple transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(left / 90) * 100}%` }}
                  />
                </div>
              )}
              <p className="mt-3 text-sm text-ink-500">
                {expired ? "This code expired." : code ? `Works once, for ${left}s` : "Making your code…"}
              </p>
              <button
                type="button"
                onClick={fresh}
                className={`mt-6 h-12 w-full rounded-full text-sm font-bold transition active:scale-[0.97] ${
                  expired || error
                    ? "bg-brand-600 text-on shadow-sm hover:bg-brand-700"
                    : "bg-ink-50 text-ink-700 shadow-well hover:bg-ink-100"
                }`}
              >
                New code
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 h-11 w-full rounded-full text-sm font-bold text-ink-600 transition hover:bg-ink-50"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
