"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HomeIcon, BagIcon, WalletIcon, UserIcon } from "./icons";

const items = [
  { href: "/customer/dashboard", label: "Home", icon: HomeIcon },
  { href: "/customer/order", label: "Order", icon: BagIcon },
  { href: "/customer/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/customer/profile", label: "Profile", icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center justify-around rounded-2xl border border-slate-200/70 bg-white/95 px-2 py-2 shadow-lg backdrop-blur-xl">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-transform active:scale-90"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute -top-1 h-1 w-7 rounded-full bg-brand-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    active ? "text-brand-600" : "text-slate-500"
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    active ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
