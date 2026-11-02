"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import { outletLogos } from "@/lib/guest-order";
import BranchLogo from "@/components/order/BranchLogo";
import { rememberPlace } from "@/lib/place";

type Receipt = {
  outlet: { id: string; name: string; company_id: string };
  total: number;
  paid_at: string;
  points: number;
  expires_at: string;
  state: "ready" | "mine" | "claimed" | "expired" | "unpaid" | "void";
};

const left = (at: string) => {
  const m = Math.max(0, Math.round((new Date(at).getTime() - Date.now()) / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

// The QR on a printed BizPos receipt: "You've earned points, scan to claim".
// Signed in, the points are collected straight away; otherwise sign in or join
// first and come back here.
export default function ReceiptClaimPage({ params }: { params: { code: string } }) {
  const [supabase] = useState(() => createClient());
  const [r, setR] = useState<Receipt | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data, error }, { data: auth }] = await Promise.all([
        supabase.rpc("wallet_receipt_preview", { p_code: params.code }),
        supabase.auth.getUser(),
      ]);
      if (error) return setError(error.message);
      let rec = data as Receipt;
      rememberPlace(rec.outlet.id);
      setSignedIn(!!auth.user);
      outletLogos(supabase).then((l) => setLogo(l[rec.outlet.id] ?? null));
      if (auth.user && rec.state === "ready") {
        const claim = await supabase.rpc("wallet_claim_receipt", { p_code: params.code });
        if (claim.error) setError(claim.error.message);
        else {
          rec = claim.data as Receipt;
          navigator.vibrate?.([30, 60, 30]);
        }
      }
      setR(rec);
      if (rec.state === "mine") {
        const { data: acct } = await supabase
          .from("loyalty_accounts")
          .select("points_balance")
          .eq("company_id", rec.outlet.company_id)
          .maybeSingle();
        setBalance(acct?.points_balance ?? null);
      }
    })();
  }, [supabase, params.code]);

  const sym = currencySymbol("MYR");
  const back = `/login?redirect=${encodeURIComponent(`/r/${params.code}`)}`;

  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        {!r && !error && <div className="h-80 animate-pulse rounded-3xl bg-white" aria-busy="true" />}
        {!r && error && (
          <div className="rounded-3xl bg-white p-6 text-center">
            <h1 className="text-xl font-semibold text-ink-900">Couldn&apos;t open this receipt</h1>
            <p className="mt-2 text-sm text-ink-600">{error}</p>
            <Link
              href="/scan"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-bold text-on transition active:scale-95"
            >
              Scan the QR again
            </Link>
          </div>
        )}
        {r && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-6 text-center"
          >
            <BranchLogo name={r.outlet.name} logoUrl={logo} className="mx-auto h-16 w-16 rounded-2xl text-2xl shadow-sm" />
            <p className="mt-3 text-sm font-semibold text-ink-700">{r.outlet.name}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {sym}
              {Number(r.total).toFixed(2)} ·{" "}
              {new Date(r.paid_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
            </p>

            {r.state === "mine" ? (
              <>
                <span className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <motion.path d="M12 25l8 8 16-17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.15 }} />
                  </svg>
                </span>
                <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">
                  {r.points.toLocaleString()} points added
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  {balance != null ? `You now have ${balance.toLocaleString()} points here.` : "They're in your wallet."} Redeem rewards on
                  your next visit.
                </p>
                <Link
                  href={`/s/${r.outlet.id}?rewards=1`}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
                >
                  See my rewards
                </Link>
              </>
            ) : r.state === "ready" ? (
              <>
                <p className="mt-6 text-sm font-semibold text-ink-500">You&apos;ve earned</p>
                <h1 className="text-5xl font-bold tabular-nums tracking-[-0.03em] text-ink-900">{r.points.toLocaleString()}</h1>
                <p className="text-sm font-semibold text-ink-500">points</p>
                {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
                {signedIn === false && (
                  <>
                    <Link
                      href={back}
                      className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
                    >
                      Sign in or join free to collect
                    </Link>
                    <p className="mt-2 text-xs text-ink-500">Expires in {left(r.expires_at)}</p>
                  </>
                )}
              </>
            ) : (
              <>
                <h1 className="mt-6 text-xl font-semibold text-ink-900">
                  {r.state === "claimed"
                    ? "These points were already collected"
                    : r.state === "expired"
                      ? "This receipt has expired"
                      : r.state === "unpaid"
                        ? "This bill isn't paid yet"
                        : "This bill was cancelled"}
                </h1>
                <p className="mt-2 text-sm text-ink-600">
                  {r.state === "expired"
                    ? "Points can be collected for 12 hours after paying. Join now and you'll earn on your next visit."
                    : r.state === "unpaid"
                      ? "Scan again after paying."
                      : "Ask our staff if something looks wrong."}
                </p>
                {signedIn === false && r.state === "expired" && (
                  <Link
                    href={back}
                    className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
                  >
                    Join free
                  </Link>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
