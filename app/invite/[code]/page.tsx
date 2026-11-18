"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { rememberPlace } from "@/lib/place";

type Claim = { ok: true; points: number; company: string } | { ok: false; reason: "unknown" | "off" | "own" | "not_new" | "already" };

const WHY: Record<string, [string, string]> = {
  unknown: ["This invite link doesn't work", "Ask your friend to share it again."],
  off: ["Invites are paused here", "This restaurant isn't running refer-a-friend right now."],
  own: ["That's your own invite", "Share it with a friend instead. You both get points after their first visit."],
  not_new: ["You've already eaten here", "Invites are for first-time customers, but your points still count."],
  already: ["You've already accepted an invite here", "Your welcome points arrive after your first paid bill."],
};

// A friend's invite link: sign in or join, accept, and both get points once this
// person's first bill at the restaurant is paid.
export default function InvitePage({ params, searchParams }: { params: { code: string }; searchParams: { s?: string } }) {
  const [supabase] = useState(() => createClient());
  const [claim, setClaim] = useState<Claim | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const store = /^[0-9a-f-]{36}$/i.test(searchParams.s ?? "") ? searchParams.s! : null;
  const here = `/invite/${params.code}${store ? `?s=${store}` : ""}`;

  useEffect(() => {
    if (store) rememberPlace(store);
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setSignedIn(!!auth.user);
      if (!auth.user) return;
      const { data, error } = await supabase.rpc("wallet_referral_claim", { p_code: params.code });
      if (error) setError(error.message);
      else setClaim(data as Claim);
    })();
  }, [supabase, params.code, store]);

  const button = "mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]";
  const storeLink = store ? `/s/${store}` : "/customer";

  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <div className="rounded-3xl bg-white p-6 text-center">
          {signedIn === null || (signedIn && !claim && !error) ? (
            <div className="h-40 animate-pulse rounded-2xl bg-ink-50" aria-busy="true" />
          ) : signedIn === false ? (
            <>
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">You&apos;re invited</h1>
              <p className="mt-2 text-sm text-ink-600">A friend wants you to try their favourite place. Join free, and you both get bonus points after your first visit.</p>
              <Link href={`/login?redirect=${encodeURIComponent(here)}`} className={button}>Sign in or join free</Link>
            </>
          ) : error ? (
            <>
              <h1 className="text-xl font-semibold text-ink-900">Couldn&apos;t accept the invite</h1>
              <p role="alert" className="mt-2 text-sm text-ink-600">{error}</p>
              <Link href={storeLink} className={button}>Go to the restaurant</Link>
            </>
          ) : claim?.ok ? (
            <>
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">Welcome to {claim.company}</h1>
              <p className="mt-2 text-sm text-ink-600">
                After your first paid bill there, you and your friend each get {claim.points.toLocaleString()} points.
              </p>
              <Link href={storeLink} className={button}>See the menu</Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-ink-900">{WHY[claim!.reason]?.[0] ?? "This invite can't be used"}</h1>
              <p className="mt-2 text-sm text-ink-600">{WHY[claim!.reason]?.[1]}</p>
              <Link href={storeLink} className={button}>Go to the restaurant</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
