"use client";

import { AnimatePresence, motion } from "framer-motion";

export type OrbStage = "pay" | "pending" | "queued" | "preparing" | "ready" | "served" | "rejected";

const ease = [0.22, 1, 0.36, 1] as const;

// The live centrepiece of the order page: one icon per stage, morphing as the
// kitchen moves, with a soft pulse while something is still happening.
export default function StatusOrb({ stage }: { stage: OrbStage }) {
  const live = stage !== "served" && stage !== "rejected";
  const tone =
    stage === "rejected"
      ? "bg-rose-50 text-rose-600"
      : stage === "pay"
        ? "bg-amber-50 text-amber-700"
        : stage === "ready" || stage === "served"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-brand-50 text-brand-600";

  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center" aria-hidden="true">
      {live && (
        <motion.span
          className={`absolute inset-0 rounded-full ${tone}`}
          animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.span
        layout
        className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-md ${tone}`}
        animate={stage === "ready" ? { y: [0, -6, 0] } : { y: 0 }}
        transition={stage === "ready" ? { duration: 0.9, repeat: Infinity, repeatDelay: 1.2, ease } : { duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          <motion.svg
            key={stage}
            viewBox="0 0 48 48"
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <Glyph stage={stage} />
          </motion.svg>
        </AnimatePresence>
      </motion.span>
    </div>
  );
}

function Glyph({ stage }: { stage: OrbStage }) {
  switch (stage) {
    case "pay": // card
      return (
        <>
          <rect x="8" y="13" width="32" height="22" rx="4" />
          <path d="M8 20h32M14 29h7" />
        </>
      );
    case "pending": // clock with a sweeping hand
      return (
        <>
          <circle cx="24" cy="24" r="15" />
          <motion.path
            d="M24 24V15"
            style={{ originX: "24px", originY: "24px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <path d="M24 24l6 4" />
        </>
      );
    case "queued": // ticket sent
      return (
        <>
          <path d="M9 23l29-12-9 27-6-11-14-4Z" />
          <path d="M23 27l15-16" />
        </>
      );
    case "preparing": // pot with rising steam
      return (
        <>
          <path d="M9 24h30v6a8 8 0 0 1-8 8H17a8 8 0 0 1-8-8v-6Z" />
          <path d="M6 24h36" />
          {[17, 24, 31].map((x, i) => (
            <motion.path
              key={x}
              d={`M${x} 18c-2-2 2-4 0-7`}
              animate={{ y: [2, -3], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
            />
          ))}
        </>
      );
    case "rejected":
      return <path d="M16 16l16 16M32 16L16 32" />;
    default: // ready / served: a drawn tick
      return (
        <motion.path
          d="M12 25l8 8 16-17"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease }}
        />
      );
  }
}
