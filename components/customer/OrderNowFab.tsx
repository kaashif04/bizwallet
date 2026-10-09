"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function OrderNowFab() {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-5">
      <div className="flex justify-end">
        <Link href="/customer/order" className="pointer-events-auto relative rounded-full">
          <motion.span
            initial={{ scale: 0.6, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.35 }}
            whileTap={{ scale: 0.94 }}
            className="relative flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3.5 text-[15px] font-semibold text-white shadow-xl transition-colors hover:bg-brand-700"
          >
            <CartIcon />
            Order now
          </motion.span>
        </Link>
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.25 3h1.5l2.1 12.3a1.5 1.5 0 0 0 1.48 1.2h8.8a1.5 1.5 0 0 0 1.47-1.18L21 7.5H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  );
}
