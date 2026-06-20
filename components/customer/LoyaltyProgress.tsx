"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import type { TierProgress } from "@/lib/loyalty";

export default function LoyaltyProgress({ data }: { data: TierProgress }) {
  const r = 52;
  const stroke = 10;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - data.progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-5">
        {/* Circular progress ring */}
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="#f1e4d6"
              strokeWidth={stroke}
            />
            <motion.circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="url(#loyaltyGrad)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="loyaltyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d68f57" />
                <stop offset="100%" stopColor="#b15a29" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber
              value={data.points}
              className="text-2xl font-bold text-slate-900"
            />
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              points
            </span>
          </div>
        </div>

        {/* Tier copy */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {data.current} tier
          </span>

          {data.next ? (
            <p className="mt-3 text-sm leading-snug text-slate-600">
              <span className="font-semibold text-slate-900">
                {data.pointsToNext.toLocaleString()} points
              </span>{" "}
              to reach{" "}
              <span className="font-semibold text-brand-700">{data.next}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm font-medium text-slate-700">
              Top tier reached 🎉
            </p>
          )}

          {/* Slim linear bar echoes the ring */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(data.progress * 100)}%` }}
              transition={{ duration: 1.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
