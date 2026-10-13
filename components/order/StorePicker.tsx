"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import BranchLogo from "./BranchLogo";
import type { PickupOutlet } from "@/lib/guest-order";

// Pick a store, then dine in (scan the table QR) or order ahead for pickup.
// pickupOpen: pickup is paid online, so it's offered only once payment is set up.
export default function StorePicker({
  branches,
  logos = {},
  pickupOpen = true,
}: {
  branches: PickupOutlet[];
  logos?: Record<string, string>;
  pickupOpen?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(branches.length === 1 ? branches[0].id : null);
  const showCompany = new Set(branches.map((b) => b.company_id)).size > 1;

  return (
    <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white shadow-sm">
      {branches.map((b) => {
        const isOpen = open === b.id;
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : b.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-ink-50"
            >
              <BranchLogo name={b.name} logoUrl={logos[b.id]} className="h-11 w-11 rounded-xl text-base" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink-900">{b.name}</span>
                <span className="block truncate text-[13px] text-slate-500">
                  {showCompany ? `${b.company} · ` : ""}
                  {b.pickup && pickupOpen ? "Dine in or pickup" : "Dine in"}
                </span>
              </span>
              <motion.svg
                animate={{ rotate: isOpen ? 90 : 0 }}
                viewBox="0 0 16 16"
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 3l5 5-5 5" />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                    <Link
                      href={`/scan?at=${encodeURIComponent(b.name)}`}
                      className="flex flex-col gap-1 rounded-xl bg-brand-600 p-4 text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
                    >
                      <ScanIcon />
                      <span className="mt-1 text-[15px] font-semibold">Dine in</span>
                      <span className="text-xs text-brand-100">Scan your table QR</span>
                    </Link>
                    {b.pickup && pickupOpen ? (
                      <Link
                        href={`/order/p/${b.id}`}
                        className="flex flex-col gap-1 rounded-xl bg-ink-50 p-4 text-ink-900 shadow-well transition hover:bg-ink-100 active:scale-[0.98]"
                      >
                        <BagIcon />
                        <span className="mt-1 text-[15px] font-semibold">Pickup</span>
                        <span className="text-xs text-ink-500">Order ahead, collect</span>
                      </Link>
                    ) : (
                      <div className="flex flex-col gap-1 rounded-xl bg-ink-50 p-4 text-ink-400 shadow-well">
                        <BagIcon />
                        <span className="mt-1 text-[15px] font-semibold">Pickup</span>
                        <span className="text-xs">{b.pickup ? "Coming soon" : "Not offered here yet"}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 16h3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
