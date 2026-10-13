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
  const valid = Number.isFinite(amount) && amount >= 1 && amount <= MAX;

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
    <div className="rounded-2xl bg-white p-5">
      <h2 className="font-bold text-ink-900">Top up your wallet</h2>
      <p className="mt-0.5 text-xs text-ink-500">
        Pay with FPX online banking. Your balance updates once the bank confirms.
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
              className={`rounded-full py-3 text-center text-base font-bold transition ${
                active
                  ? "bg-brand-600 text-on shadow-sm"
                  : "bg-ink-50 text-ink-700 shadow-well hover:bg-ink-100"
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
        <span className="mb-1.5 block text-xs font-medium text-ink-500">
          Or enter a custom amount
        </span>
        <div className="flex items-center rounded-xl bg-ink-50 px-4 shadow-pressed">
          <span className="text-sm font-semibold text-ink-500">{sym}</span>
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
            style={{ boxShadow: "none" }}
            className="w-full bg-transparent px-2 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
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
              Opening payment…
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
              Top up {sym}
              {valid ? amount.toFixed(2) : "0.00"}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <p className="mt-2 text-center text-2xs text-ink-400">
        Secured by Billplz. You confirm the payment with your bank.
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
