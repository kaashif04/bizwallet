"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import { outletLogos } from "@/lib/guest-order";
import BranchLogo from "@/components/order/BranchLogo";
import { Chit, PadLabel, Stamp } from "@/components/ui/chit";
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
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        {!r && !error && <div className="h-96 animate-pulse rounded-xl bg-white" aria-busy="true" />}
        {!r && error && (
          <Chit band={<PadLabel>Receipt</PadLabel>}>
            <div className="p-5">
              <h1 className="pad text-xl font-extrabold text-ink-900">Couldn&apos;t open this receipt</h1>
              <p className="mt-2 text-sm text-ink-600">{error}</p>
            </div>
          </Chit>
        )}
        {r && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <Chit
              band={
                <div className="flex items-center gap-3">
                  <BranchLogo name={r.outlet.name} logoUrl={logo} className="h-10 w-10 rounded-lg text-base" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink-900">{r.outlet.name}</span>
                    <span className="block text-xs text-ink-700">
                      {new Date(r.paid_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                </div>
              }
            >
              <div className="ruled px-5">
                <div className="flex justify-between py-3.5 text-sm">
                  <span className="text-ink-600">Bill paid</span>
                  <span className="pad font-bold text-ink-900">
                    {sym}
                    {Number(r.total).toFixed(2)}
                  </span>
                </div>
                <div className="relative py-6">
                  <PadLabel>{r.state === "mine" ? "Added to your card" : "Points on this receipt"}</PadLabel>
                  <p className="pad mt-1 text-6xl font-extrabold leading-none text-brand-700">{r.points.toLocaleString()}</p>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {r.state === "mine" ? (
                      <Stamp ok thump className="!text-sm">
                        Collected
                      </Stamp>
                    ) : r.state === "claimed" ? (
                      <Stamp className="!text-sm">Taken</Stamp>
                    ) : r.state === "expired" ? (
                      <Stamp className="!text-sm">Expired</Stamp>
                    ) : r.state === "void" ? (
                      <Stamp className="!text-sm">Void</Stamp>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="total-rule mx-5 py-5">
                {r.state === "mine" ? (
                  <>
                    <p className="text-sm text-ink-600">
                      {balance != null ? `You now have ${balance.toLocaleString()} points here. ` : ""}Redeem rewards on your next visit.
                    </p>
                    <Link
                      href={`/s/${r.outlet.id}?rewards=1`}
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
                    >
                      See my rewards
                    </Link>
                  </>
                ) : r.state === "ready" ? (
                  <>
                    {error && <p role="alert" className="mb-3 text-sm text-rose-700">{error}</p>}
                    {signedIn === false && (
                      <>
                        <Link
                          href={back}
                          className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
                        >
                          Sign in or join free to collect
                        </Link>
                        <p className="mt-2 text-center text-xs text-ink-500">Expires in {left(r.expires_at)}</p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-ink-900">
                      {r.state === "claimed"
                        ? "These points were already collected."
                        : r.state === "expired"
                          ? "Points can be collected for 12 hours after paying."
                          : r.state === "unpaid"
                            ? "This bill isn't paid yet. Scan again after paying."
                            : "This bill was cancelled."}
                    </p>
                    <p className="mt-1 text-sm text-ink-600">
                      {r.state === "expired" ? "Join now and you'll earn on your next visit." : "Ask our staff if something looks wrong."}
                    </p>
                    {signedIn === false && r.state === "expired" && (
                      <Link
                        href={back}
                        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-on transition hover:bg-brand-700 active:scale-[0.98]"
                      >
                        Join free
                      </Link>
                    )}
                  </>
                )}
              </div>
            </Chit>
            <p className="mt-6 text-center text-xs text-ink-400">Powered by BizWallet</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
