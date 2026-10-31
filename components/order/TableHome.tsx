"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { outletLogos, type TableCall, type TableHome as Home } from "@/lib/guest-order";
import ActiveOrders from "@/components/customer/ActiveOrders";
import { SectionTitle } from "@/components/customer/ui";
import AccountChip from "./AccountChip";
import BranchLogo from "./BranchLogo";

type Me = { name: string | null; points: number; joined: boolean; vouchers: number } | "guest" | null;

// The table QR start page: the restaurant's welcome, Start order, call staff /
// ask for the bill, Wi-Fi, feedback, and the diner's points here once signed in.
export default function TableHome({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [me, setMe] = useState<Me>(null);

  const load = useCallback(
    () =>
      supabase.rpc("guest_table_home", { p_token: token }).then(({ data, error }) => {
        if (error) setError(error.message);
        else setHome(data as Home);
        return data as Home | null;
      }),
    [supabase, token]
  );

  useEffect(() => {
    load().then(async (h) => {
      if (!h) return;
      outletLogos(supabase).then((l) => setLogo(l[h.outlet.id] ?? null));
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setMe("guest");
      const [{ data: m }, { data: acct }, { count }] = await Promise.all([
        supabase.from("members").select("full_name").maybeSingle(),
        supabase.from("loyalty_accounts").select("points_balance").eq("company_id", h.outlet.company_id).maybeSingle(),
        supabase
          .from("vouchers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.user.id)
          .eq("company_id", h.outlet.company_id)
          .eq("status", "active"),
      ]);
      if (!m) return setMe("guest"); // a BizPos staff login, not a member
      setMe({
        name: m.full_name?.trim().split(/\s+/)[0] || null,
        points: acct?.points_balance ?? 0,
        joined: !!acct,
        vouchers: count ?? 0,
      });
    });
  }, [supabase, load]);

  // While staff have an open call, check back so it clears when they pick it up.
  const open = (home?.calls.length ?? 0) > 0;
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(load, 15_000);
    return () => window.clearInterval(t);
  }, [open, load]);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [load]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">This QR code doesn&apos;t work</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-600">{error} Please ask our staff for help.</p>
      </main>
    );
  }

  if (!home) {
    return (
      <main className="mx-auto max-w-md" aria-busy="true" aria-label="Loading">
        <div className="h-56 animate-pulse bg-ink-100" />
        <div className="space-y-3 px-4 pt-16">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-ink-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-white" />
          <div className="h-16 animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  const menuHref = `/order/t/${token}/menu`;
  const signIn = `/login?redirect=${encodeURIComponent(`/order/t/${token}`)}`;

  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {/* Cover, logo, name, table */}
        <header className="relative">
          <div className="relative h-56 overflow-hidden bg-brand-100">
            {home.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.cover_url} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-900 shadow-sm">
                Table {home.table.label}
              </span>
              <AccountChip state={me === null ? null : me === "guest" ? "guest" : { points: me.points, joined: me.joined }} />
            </div>
          </div>
          <div className="px-4">
            <BranchLogo
              name={home.outlet.name}
              logoUrl={logo}
              className="relative -mt-10 h-20 w-20 rounded-3xl text-3xl shadow-md ring-4 ring-ink-50"
            />
            <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">
              {me && me !== "guest" && me.name ? `Welcome back, ${me.name}` : home.outlet.name}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {me && me !== "guest" && me.name ? home.outlet.name : home.tagline || "Order from your table, pay in the app or at the counter."}
            </p>
          </div>
        </header>

        <div className="mt-5 space-y-8 px-4">
          {/* An order on the go here: one tap to follow it. */}
          <ActiveOrders names={{}} outletId={home.outlet.id} variant="pill" />

          <CallStaff token={token} calls={home.calls} onCalled={load} />

          <Points me={me} companyId={home.outlet.company_id} signIn={signIn} />

          {home.wifi && <Wifi name={home.wifi.name} password={home.wifi.password} />}

          <Feedback token={token} reviewUrl={home.review_url} />
        </div>
      </main>

      {/* Start order, within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {home.ordering ? (
          <Link
            href={menuHref}
            className="flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:bg-brand-700 active:scale-[0.97]"
          >
            Start order
          </Link>
        ) : (
          <p className="rounded-full bg-white py-4 text-center text-sm font-semibold text-ink-700 shadow-lg">
            Please order with our staff today
          </p>
        )}
      </div>
    </div>
  );
}

const ago = (at: string) => {
  const m = Math.floor((Date.now() - new Date(at).getTime()) / 60_000);
  return m < 1 ? "just now" : `${m} min ago`;
};

function CallStaff({ token, calls, onCalled }: { token: string; calls: TableCall[]; onCalled: () => void }) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState<TableCall["kind"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(kind: TableCall["kind"]) {
    setBusy(kind);
    setError(null);
    const { error } = await supabase.rpc("guest_call_staff", { p_token: token, p_kind: kind });
    setBusy(null);
    if (error) return setError(error.message);
    onCalled();
  }

  return (
    <section>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["staff", "Call staff", "M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6ZM10 19a2 2 0 0 0 4 0"],
            ["bill", "Ask for the bill", "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6"],
          ] as const
        ).map(([kind, label, icon]) => {
          const sent = calls.find((c) => c.kind === kind);
          return (
            <button
              key={kind}
              type="button"
              disabled={busy !== null}
              onClick={() => call(kind)}
              aria-live="polite"
              className={`flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition active:scale-[0.97] ${
                sent ? "bg-brand-50 ring-1 ring-brand-200" : "bg-white hover:bg-ink-100"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={icon} />
              </svg>
              <span>
                <span className="block text-sm font-bold text-ink-900">{label}</span>
                <span className="block text-xs text-ink-500">
                  {busy === kind ? "Sending…" : sent ? `Staff notified · ${ago(sent.at)}` : "We'll come to your table"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 px-1 text-sm text-rose-700">{error}</p>}
    </section>
  );
}

function Points({ me, companyId, signIn }: { me: Me; companyId: string; signIn: string }) {
  if (!me) return null;
  if (me === "guest") {
    return (
      <Link href={signIn} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:bg-ink-100">
        <Star />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink-900">Collect points on this meal</span>
          <span className="block text-xs text-ink-500">Sign in or join free. You can also do it after you order.</span>
        </span>
        <span className="text-sm font-bold text-brand-700">Sign in</span>
      </Link>
    );
  }
  return (
    <section>
      <SectionTitle href="/customer/orders" action="My orders">
        Your points here
      </SectionTitle>
      <Link
        href={`/customer/dashboard?rewards=${companyId}`}
        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:bg-ink-100"
      >
        <Star />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink-900">
            {me.joined ? `${me.points.toLocaleString()} points` : "Start collecting points"}
          </span>
          <span className="block text-xs text-ink-500">
            {me.vouchers > 0 ? `${me.vouchers} voucher${me.vouchers > 1 ? "s" : ""} to use · ` : ""}Rewards and offers
          </span>
        </span>
        <span aria-hidden="true" className="text-ink-400">›</span>
      </Link>
    </section>
  );
}

function Star() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
      </svg>
    </span>
  );
}

// Phones don't let a web page join Wi-Fi, so: the name, and the password to copy.
function Wifi({ name, password }: { name: string; password: string | null }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(password!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard (old browser): the password is on screen to type.
    }
  }
  return (
    <section>
      <SectionTitle>Wi-Fi</SectionTitle>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
            <circle cx="12" cy="19.5" r="1" fill="currentColor" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink-900">{name}</span>
          <span className="block truncate font-mono text-xs text-ink-500">{password ?? "No password"}</span>
        </span>
        {password && (
          <button
            type="button"
            onClick={copy}
            className="h-9 shrink-0 rounded-full bg-brand-600 px-4 text-sm font-bold text-on transition active:scale-95"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </section>
  );
}

// Every rating goes privately to the owner first; then everyone, whatever they
// rated, may also post on Google (sending only happy diners there breaks Google's rules).
function Feedback({ token, reviewUrl }: { token: string; reviewUrl: string | null }) {
  const [supabase] = useState(() => createClient());
  const key = `bw_feedback:${token}`;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already rated this visit (the last 12 hours) on this phone: just say thanks.
  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(key));
      if (at && Date.now() - at < 12 * 3_600_000) setSent(true);
    } catch {}
  }, [key]);

  async function send() {
    setSending(true);
    setError(null);
    const { error } = await supabase.rpc("guest_send_feedback", { p_token: token, p_rating: rating, p_comment: comment });
    setSending(false);
    if (error) return setError(error.message);
    setSent(true);
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {}
  }

  return (
    <section>
      <SectionTitle>How was your visit?</SectionTitle>
      <div className="rounded-2xl bg-white p-4">
        {sent ? (
          <div>
            <p className="text-sm font-bold text-ink-900">Thank you. The owner reads every note.</p>
            {rating > 0 && rating <= 2 && (
              <p className="mt-1 text-sm text-ink-500">Want it sorted now? Tap Call staff and we&apos;ll come over.</p>
            )}
            {reviewUrl && (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center rounded-full bg-ink-100 px-4 text-sm font-bold text-ink-900 transition hover:bg-ink-200"
              >
                Also review us on Google
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 ${
                    n <= rating ? "text-amber-500" : "text-ink-200"
                  }`}
                >
                  <svg viewBox="0 0 20 20" className="h-9 w-9" fill="currentColor" aria-hidden="true">
                    <path d="M10 1.5l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.4l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.5Z" />
                  </svg>
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {rating > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                    rows={3}
                    placeholder={rating <= 3 ? "What could we do better? Only the owner sees this." : "Anything to add? (optional)"}
                    aria-label="Your note to the owner"
                    className="mt-3 w-full resize-none rounded-xl bg-ink-50 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                  />
                  {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending}
                    className="mt-3 h-11 w-full rounded-full bg-ink-900 text-sm font-bold text-ink-50 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send to the owner"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
}
