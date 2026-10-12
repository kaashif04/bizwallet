"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { currencySymbol } from "@/lib/format";

const PRESETS = [20, 50, 100, 200];
const MAX = 1000;

type Status = "idle" | "loading" | "success";

export default function TopUpPanel({
  currency,
  onTopUp,
}: {
  currency: string;
  onTopUp: (amount: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const sym = currencySymbol(currency);
  const [preset, setPreset] = useState<number | null>(50);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastAmount, setLastAmount] = useState(0);

  const amount = custom ? parseFloat(custom) : preset ?? 0;
  const valid = Number.isFinite(amount) && amount > 0 && amount <= MAX;

  async function confirm() {
    if (!valid || status === "loading") return;
    setError(null);
    setLastAmount(amount);
    setStatus("loading");

    const res = await onTopUp(amount);

    if (res.ok) {
      setStatus("success");
      setCustom("");
      window.setTimeout(() => setStatus("idle"), 1800);
    } else {
      setStatus("idle");
      setError(res.error ?? "Top-up failed. Please try again.");
    }
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Top up your wallet</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Choose an amount to add as store credit.
      </p>

      {/* Preset amounts */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {PRESETS.map((p) => {
          const active = preset === p && !custom;
          return (
            <motion.button
              key={p}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setPreset(p);
                setCustom("");
              }}
              className={`rounded-2xl border py-3 text-center text-base font-semibold transition ${
                active
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              {sym}
              {p}
            </motion.button>
          );
        })}
      </div>

      {/* Custom amount */}
      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          Or enter a custom amount
        </span>
        <div className="flex items-center rounded-2xl border border-slate-200 px-4 transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30">
          <span className="text-sm font-semibold text-slate-500">{sym}</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={MAX}
            placeholder="0.00"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPreset(null);
            }}
            className="w-full bg-transparent px-2 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </label>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Confirm */}
      <button
        type="button"
        onClick={confirm}
        disabled={!valid || status === "loading"}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Spinner />
              Processing payment…
            </motion.span>
          ) : status === "success" ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              ✓ Added {sym}
              {lastAmount.toFixed(2)} to your wallet
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              Confirm Top Up · {sym}
              {valid ? amount.toFixed(2) : "0.00"}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <p className="mt-2 text-center text-[11px] text-slate-400">
        Demo gateway — funds are credited instantly via Supabase.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
