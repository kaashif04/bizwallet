"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { BellIcon } from "./icons";

type Notif = {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [supabase] = useState(() => createClient());
  const [notifs, setNotifs] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("id,title,message,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifs(data as Notif[]);
      setUnread(data.filter((n) => !n.is_read).length);
    } else {
      setNotifs([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openPanel() {
    setOpen(true);
    if (notifs === null) await load();
    if (unread > 0) {
      setUnread(0);
      setNotifs((prev) => (prev ? prev.map((n) => ({ ...n, is_read: true })) : prev));
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={openPanel}
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-700 shadow-sm"
      >
        <motion.span
          style={{ transformOrigin: "50% 4px" }}
          animate={{ rotate: [0, -12, 10, -8, 6, -4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3.5 }}
        >
          <BellIcon className="h-6 w-6" />
        </motion.span>
        {unread > 0 && (
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink-950/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-900">Notifications</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4">
                {notifs === null ? (
                  <Skeleton />
                ) : notifs.length === 0 ? (
                  <p className="py-16 text-center text-sm text-slate-400">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {notifs.map((n) => (
                      <li
                        key={n.id}
                        className={`rounded-2xl border p-3.5 ${
                          n.is_read
                            ? "border-slate-100 bg-white"
                            : "border-brand-100 bg-brand-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                          )}
                        </div>
                        {n.message && (
                          <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                        )}
                        <p
                          className="mt-1.5 text-[11px] text-slate-400"
                          suppressHydrationWarning
                        >
                          {timeAgo(n.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Skeleton() {
  return (
    <ul className="space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="rounded-2xl border border-slate-100 p-3.5">
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}
