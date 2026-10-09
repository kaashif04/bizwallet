"use client";

import { MotionConfig } from "framer-motion";

// Respect the OS "reduce motion" setting in every Framer animation.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
