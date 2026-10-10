"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NotificationBell from "./NotificationBell";

export default function DashboardHeader({
  name,
  hasNotifications = true,
}: {
  name: string;
  hasNotifications?: boolean;
}) {
  // Computed after mount to avoid SSR/client time mismatches.
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sun-300 font-display text-xl font-semibold text-slate-900">
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{greeting}</p>
          <h1 className="text-2xl leading-tight text-slate-900">
            Hi, {name}
          </h1>
        </div>
      </div>

      <NotificationBell />
    </motion.header>
  );
}
