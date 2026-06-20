"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./cart-context";
import { currencySymbol } from "@/lib/format";

// Floating "View cart" CTA that slides up whenever the cart has items.
export default function ViewCartBar({
  currency,
  onClick,
}: {
  currency: string;
  onClick: () => void;
}) {
  const { totalItems, totalPrice } = useCart();
  const sym = currencySymbol(currency);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
        >
          <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between rounded-2xl bg-brand-700 px-5 py-3.5 text-white shadow-xl shadow-brand-900/25 transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-sm font-bold">
                {totalItems}
              </span>
              <span className="text-sm font-semibold">View cart</span>
            </span>
            <span className="text-sm font-bold">
              {sym}
              {totalPrice.toFixed(2)}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
