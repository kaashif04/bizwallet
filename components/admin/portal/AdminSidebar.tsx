"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UsersIcon, MegaphoneIcon, TicketIcon } from "@/components/customer/icons";

const NAV = [
  { href: "/admin/dashboard/customers", label: "Customer CRM", Icon: UsersIcon },
  { href: "/admin/dashboard/marketing", label: "Marketing & Broadcasts", Icon: MegaphoneIcon },
  { href: "/admin/dashboard/vouchers", label: "Voucher Engine", Icon: TicketIcon },
] as const;

export default function AdminSidebar({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
            <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <span className="text-sm font-bold text-slate-900">Owner Dashboard</span>
        <span className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <SidebarContent pathname={pathname} ownerName={ownerName} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <SidebarContent
                pathname={pathname}
                ownerName={ownerName}
                onNavigate={() => setOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname,
  ownerName,
  onNavigate,
}: {
  pathname: string;
  ownerName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <p className="text-xs font-medium text-brand-600">BizCafé</p>
        <h1 className="text-lg font-bold text-slate-900">Owner Dashboard</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-100 px-3 py-4">
        <Link
          href="/customer/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Customer view
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
        <div className="px-3 pt-2 text-xs text-slate-400">
          Signed in as <span className="font-medium text-slate-600">{ownerName}</span>
        </div>
      </div>
    </div>
  );
}
