"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

// Counts up from 0 to `value` on mount. Server renders the formatted 0, so it
// hydrates cleanly, then animates.
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.2,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    v.toLocaleString("en-MY", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
