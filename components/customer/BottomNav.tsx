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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md">
        <div className="flex h-16 items-center justify-around">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-transform active:scale-95"
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
                    className={`relative h-5 w-5 transition-colors ${
                      active ? "text-brand-700" : "text-ink-500"
                    }`}
                  />
                </span>
                <span
                  className={`text-2xs font-bold transition-colors ${
                    active ? "text-brand-700" : "text-ink-500"
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
