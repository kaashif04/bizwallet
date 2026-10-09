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
            className="flex w-full items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-xl transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <motion.span
                key={totalItems}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-sm font-bold"
              >
                {totalItems}
              </motion.span>
              <span className="text-[15px] font-semibold">Review order</span>
            </span>
            <span className="text-[15px] font-bold">
              {sym}
              {totalPrice.toFixed(2)}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
