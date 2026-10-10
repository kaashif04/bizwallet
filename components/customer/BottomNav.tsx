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
        <div className="pointer-events-auto flex items-center justify-around rounded-[1.75rem] bg-white/95 px-2 py-2 shadow-xl backdrop-blur-xl">
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
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-full bg-brand-100"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative h-6 w-6 transition-colors ${
                      active ? "text-brand-700" : "text-slate-500"
                    }`}
                  />
                </span>
                <span
                  className={`text-xs font-bold transition-colors ${
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
