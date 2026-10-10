"use client";

import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#f26419", "#ffc21a", "#22b07d", "#2f9be8", "#f2477a"];

// One celebratory burst (order ready). Fixed pseudo-random layout so server
// and client agree; skipped entirely for reduced-motion users.
export default function Confetti() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 120 + ((i * 37) % 90);
        return (
          <motion.span
            key={i}
            className="absolute top-40 block h-2.5 w-2.5"
            style={{ background: COLORS[i % COLORS.length], borderRadius: i % 3 ? 3 : 999 }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: [0, Math.sin(angle) * dist - 40, Math.sin(angle) * dist + 220],
              opacity: [1, 1, 0],
              rotate: (i % 2 ? 1 : -1) * 360,
              scale: 1,
            }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
