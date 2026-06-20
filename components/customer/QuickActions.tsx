"use client";

import { motion } from "framer-motion";
import { CupIcon, ReceiptIcon, TicketIcon } from "./icons";

const actions = [
  {
    key: "order",
    label: "Order Now",
    aria: "Order now",
    icon: CupIcon,
    tint: "bg-brand-100 text-brand-700",
  },
  {
    key: "history",
    label: "History",
    aria: "Transaction history",
    icon: ReceiptIcon,
    tint: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "vouchers",
    label: "Vouchers",
    aria: "Vouchers",
    icon: TicketIcon,
    tint: "bg-violet-100 text-violet-700",
  },
] as const;

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.key}
            type="button"
            aria-label={a.aria}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.tint}`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-xs font-medium text-slate-700">{a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
