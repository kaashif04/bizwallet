"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// The way from a table/pickup order into the wallet: points + account for
// members, sign-in (coming back here) for guests.
export default function AccountChip() {
  const [state, setState] = useState<{ points: number } | "guest" | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setState("guest");
      const { data: acct } = await supabase
        .from("loyalty_accounts")
        .select("points_balance")
        .eq("user_id", data.user.id)
        .maybeSingle();
      // No loyalty account = not a member (e.g. a BizPos staff login).
      setState(acct ? { points: acct.points_balance } : "guest");
    })();
  }, []);

  if (!state) return <span className="h-8 w-20 animate-pulse rounded-full bg-white/70" aria-hidden="true" />;

  if (state === "guest") {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`}
        className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-brand-100"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/customer/dashboard"
      aria-label={`My account, ${state.points} points`}
      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-brand-100"
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-brand-600" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
      </svg>
      {state.points.toLocaleString()} pts
    </Link>
  );
}
