"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CustomerLogin from "@/components/auth/CustomerLogin";
import OwnerLogin from "@/components/auth/OwnerLogin";

type View = "customer" | "owner";

// Smooth, premium card-flip between the customer and owner sign-in views.
const flip = {
  enter: (dir: number) => ({ rotateY: dir * 90, opacity: 0 }),
  center: { rotateY: 0, opacity: 1 },
  exit: (dir: number) => ({ rotateY: dir * -90, opacity: 0 }),
};

export default function LoginPage() {
  const [view, setView] = useState<View>("customer");
  // direction drives which way the card flips (+1 to owner, -1 back).
  const dir = view === "owner" ? 1 : -1;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-50 px-4 py-12">
      {/* Decorative ambient blobs for depth. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 animate-blob rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 animate-blob rounded-full bg-brand-300/30 blur-3xl [animation-delay:4s]" />

      <div
        className="relative w-full max-w-md"
        style={{ perspective: "1600px" }}
      >
        <AnimatePresence initial={false} mode="wait" custom={dir}>
          <motion.div
            key={view}
            custom={dir}
            variants={flip}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {view === "customer" ? (
              <CustomerLogin onSwitch={() => setView("owner")} />
            ) : (
              <OwnerLogin onSwitch={() => setView("customer")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
