"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import {
  outletLogos,
  tableOrders,
  type GuestOrderStatus,
  type TableBill,
  type TableCall,
  type TableHome as Home,
  type PickupOutlet,
} from "@/lib/guest-order";
import { SectionTitle } from "@/components/customer/ui";
import { orderingStatus, type StoreHours } from "@/lib/hours";
import AccountChip from "./AccountChip";
import { rememberPlace } from "@/lib/place";
import BranchLogo from "./BranchLogo";
import { useSheet } from "./useSheet";

type Me = { name: string | null; points: number; joined: boolean; vouchers: number } | "guest" | null;

// Finished: nothing more will happen to it, and nothing is owed on it.
const finished = (o: GuestOrderStatus) =>
  o.status === "cancelled" ||
  (o.status === "accepted" && o.paid && o.table_due == null && ["ready", "served"].includes(o.kitchen_status ?? ""));

// The table's Home, where the QR lands and the bottom bar's Home tab: one big
// button per thing a diner wants (order, takeaway, waiter, bill, games, review),
// then this phone's rounds, the bill, points, Wi-Fi and feedback.
export default function TableHome({
  token,
  billSplit = false,
  pickupPaid = false,
}: {
  token: string;
  billSplit?: boolean;
  pickupPaid?: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [home, setHome] = useState<Home | null>(null);
  // Takeaway is always shown; greyed out (and says so when tapped) unless the
  // outlet takes pickup orders, online payment is on, and it's open.
  const [takeaway, setTakeaway] = useState(false);
  const [shut, setShut] = useState<string | null>(null); // "Closed · opens 10am" / "Last orders were 9:30pm"
  const [wifiOpen, setWifiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [me, setMe] = useState<Me>(null);
  const [orders, setOrders] = useState<GuestOrderStatus[]>([]);

  // This phone's rounds at this table. Finished ones drop off 3 hours after ordering,
  // so the page is a plain start page again on the next visit.
  // The table's open bill, whoever ordered it (counter or app).
  const [billLeft, setBillLeft] = useState<number | null>(null);
  const loadOrders = useCallback(async () => {
    supabase.rpc("guest_table_bill", { p_token: token }).then(({ data }) => {
      const b = data as TableBill | null;
      setBillLeft(b?.open ? Number(b.remaining) : null);
    });
    const mine = tableOrders(token);
    const res = await Promise.all(
      mine.map(async (o) => {
        const { data } = await supabase.rpc("guest_order_status", { p_id: o.id, p_claim_token: o.claimToken });
        const s = data as GuestOrderStatus | null;
        if (!s || s.status === "rejected" || (finished(s) && Date.now() - o.at > 3 * 3_600_000)) return null;
        return s;
      })
    );
    setOrders(res.filter((o): o is GuestOrderStatus => !!o));
  }, [supabase, token]);

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
      rememberPlace(h.outlet.id);
      outletLogos(supabase).then((l) => setLogo(l[h.outlet.id] ?? null));
      supabase.rpc("guest_store", { p_outlet: h.outlet.id }).then(({ data }) => {
        const o = data as (PickupOutlet & StoreHours) | null;
        const st = o && orderingStatus(o);
        // Closed or past last orders: no ordering from the table (staff can still help).
        setShut(st && !st.open ? st.text : null);
        setTakeaway(pickupPaid && !!o?.pickup && st?.open !== false);
      });
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
  }, [supabase, load, pickupPaid]);

  // Follow the kitchen and the bill while anything is still going on.
  const live = orders.some((o) => !finished(o));
  useEffect(() => {
    loadOrders();
    if (!live) return;
    const t = window.setInterval(loadOrders, 10_000);
    return () => window.clearInterval(t);
  }, [loadOrders, live]);

  // While staff have an open call, check back so it clears when they pick it up.
  const open = (home?.calls.length ?? 0) > 0;
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(load, 15_000);
    return () => window.clearInterval(t);
  }, [open, load]);
  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState !== "visible") return;
      load();
      loadOrders();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [load, loadOrders]);

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

  const signIn = `/login?redirect=${encodeURIComponent(`/order/t/${token}`)}`;

  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {/* Cover with sign-in; logo overlapping its edge; name and table below. */}
        <header className="relative">
          <div className="relative mx-3 mt-3 h-36 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-50 to-ink-50 shadow-md">
            {home.cover_url && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={home.cover_url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
              </>
            )}
            <div className="absolute right-4 top-4">
              <AccountChip state={me === null ? null : me === "guest" ? "guest" : { points: me.points, joined: me.joined, href: `/s/${home.outlet.id}?rewards=1` }} />
            </div>
          </div>
          <div className="flex items-center gap-3 px-5">
            <BranchLogo
              name={home.outlet.name}
              logoUrl={logo}
              className="relative -mt-9 h-[4.5rem] w-[4.5rem] shrink-0 rounded-[1.4rem] text-2xl shadow-md ring-4 ring-ink-50"
            />
            <div className="min-w-0 pt-2">
              <h1 className="truncate text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink-900">{home.outlet.name}</h1>
              <p className="text-sm font-semibold text-brand-700">
                Table {home.table.label}
                {me && me !== "guest" && me.name ? <span className="font-normal text-ink-500"> · Hi {me.name}</span> : null}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-5 px-4">
          {/* Ordering: the two big, coloured buttons. */}
          {home.ordering ? (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {shut ? (
                  <BigButton icon={TILE.menu} title={orders.length ? "Order more" : "Order now"} sub={shut} className="bg-ink-100 text-ink-400 shadow-none" />
                ) : (
                  <BigButton href={`/order/t/${token}/menu`} icon={TILE.menu} title={orders.length ? "Order more" : "Order now"} sub="Eat here" className="bg-brand-600 text-on" />
                )}
                {takeaway ? (
                  <BigButton href={`/order/p/${home.outlet.id}`} icon={TILE.takeaway} title="Takeaway" sub="Pay & collect" className="bg-ink-900 text-ink-50" />
                ) : (
                  <BigButton icon={TILE.takeaway} title="Takeaway" sub="Unavailable now" className="bg-ink-100 text-ink-400 shadow-none" />
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-full bg-white py-4 text-center text-sm font-semibold text-ink-700 shadow-sm">
              Please order with our staff today
            </p>
          )}

          {/* Staff come to the table: amber, so they stand apart from ordering. */}
          <CallStaff token={token} calls={home.calls} hide={home.hide} onCalled={load} />

          {/* Extras, always there so people know about them; white, quieter than ordering and staff. */}
          <nav aria-label="More" className="grid grid-cols-2 gap-3">
            <Extra href={`/order/t/${token}/play`} icon={TILE.play} img="/tiles/games.png" title="Play games" sub="While you wait" />
            <Extra onClick={() => setWifiOpen(true)} icon={TILE.wifi} img="/tiles/wifi.png" title="Wi-Fi" sub={home.wifi ? home.wifi.name : "Ask our staff"} />
          </nav>


          {orders.length > 0 && <YourTable orders={orders} canCallBill={!home.hide?.bill} />}

          {/* Your table already shows what's owed; this card only adds the way to pay it. */}
          {billLeft !== null && billLeft > 0 && (orders.length === 0 || billSplit) && (
            <Link
              href={`/order/t/${token}/bill`}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm transition hover:bg-ink-100 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink-900">{currencySymbol("MYR")}{billLeft.toFixed(2)} left to pay</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-brand-700">{billSplit ? "Pay ›" : "View ›"}</span>
            </Link>
          )}

          <Points me={me} outletId={home.outlet.id} signIn={signIn} />


          {!home.hide?.feedback ? (
            <Feedback token={token} reviewUrl={home.review_url} canCallStaff={!home.hide?.staff} />
          ) : (
            home.review_url && (
              <a
                href={home.review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-ink-900 transition hover:bg-ink-100"
              >
                Review us on Google
                <span aria-hidden="true" className="text-ink-400">›</span>
              </a>
            )
          )}
        </div>
      </main>
      <AnimatePresence>
        {wifiOpen && (
          <WifiSheet key="wifi" wifi={home.wifi} token={token} canCallStaff={!home.hide?.staff} onCalled={load} onClose={() => setWifiOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

const KITCHEN: Record<string, [string, number]> = {
  queued: ["Sent to the kitchen", 0],
  preparing: ["Being prepared", 1],
  ready: ["Ready", 2],
  served: ["Served", 2],
};

// After ordering: each round's progress, and what's left to pay.
function YourTable({ orders, canCallBill }: { orders: GuestOrderStatus[]; canCallBill: boolean }) {
  const sym = currencySymbol("MYR");
  const money = (n: number | null) => `${sym}${Number(n ?? 0).toFixed(2)}`;
  const unpaid = orders.find((o) => o.status === "awaiting_payment");
  // Every round at a table goes on one bill; the newest round knows it best.
  const due = [...orders].reverse().find((o) => o.table_due != null)?.table_due ?? null;
  const allPaid = !unpaid && due == null && orders.every((o) => o.paid || o.status === "cancelled");

  return (
    <section>
      <SectionTitle>Your table</SectionTitle>
      <div className="divide-y divide-ink-100 rounded-2xl bg-white">
        {orders.map((o, i) => {
          const [label, step] =
            o.status === "awaiting_payment"
              ? ["Waiting for your payment", -1]
              : o.status === "pending"
                ? ["Waiting for the restaurant", -1]
                : o.status === "cancelled"
                  ? ["Cancelled by the restaurant", -1]
                  : KITCHEN[o.kitchen_status ?? "queued"];
          const count = o.items.reduce((n, it) => n + it.quantity, 0);
          return (
            <Link key={o.id} href={`/order/status/${o.id}`} className="block px-4 py-3.5 transition hover:bg-ink-50">
              <span className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    o.status === "cancelled" ? "bg-ink-300" : step === 2 ? "bg-emerald-500" : step < 0 ? "bg-amber-500" : "bg-brand-500"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink-900">{label}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {orders.length > 1 ? `Round ${i + 1} · ` : ""}
                    {count} item{count === 1 ? "" : "s"}
                    {o.paid ? " · Paid" : ""}
                  </span>
                </span>
                <span aria-hidden="true" className="text-ink-400">›</span>
              </span>
              {o.status !== "cancelled" && (
                <span className="mt-2.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <motion.span
                        className="block h-full rounded-full bg-marple"
                        initial={false}
                        animate={{ width: n <= step ? "100%" : "0%" }}
                        transition={{ duration: 0.4, delay: n * 0.05 }}
                      />
                    </span>
                  ))}
                </span>
              )}
            </Link>
          );
        })}
        {unpaid ? (
          <div className="p-4">
            <Link
              href={`/order/status/${unpaid.id}`}
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97]"
            >
              Pay {money(unpaid.amount_due)}
            </Link>
            <p className="mt-2 text-center text-xs text-ink-500">The kitchen starts once you&apos;ve paid.</p>
          </div>
        ) : due != null ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink-900">To pay at the counter</span>
              <span className="block text-xs text-ink-500">
                {canCallBill ? "Tap Get the bill when you're ready" : "When you're done"}
              </span>
            </span>
            <span className="shrink-0 text-lg font-bold tabular-nums text-ink-900">{money(due)}</span>
          </div>
        ) : (
          allPaid && (
            <p className="px-4 py-3.5 text-sm font-medium text-ink-800">All paid. Leave whenever you&apos;re ready.</p>
          )
        )}
      </div>
    </section>
  );
}

const ago = (at: string) => {
  const m = Math.floor((Date.now() - new Date(at).getTime()) / 60_000);
  return m < 1 ? "just now" : `${m} min ago`;
};

const TILE = {
  menu: "M5 4v7a2 2 0 0 0 2 2v7M9 4v7M7 4v3M15 20V4c-2 1-3 4-3 7s1 3 3 3M19 4v16",
  takeaway: "M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2",
  play: "M5 19h14M7 15h10M9 11h6M11 7h2",
  wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
};
function Extra({ href, onClick, icon, img, title, sub }: { href?: string; onClick?: () => void; icon: string; img?: string; title: string; sub: string }) {
  const cls = "flex min-w-0 flex-col items-start gap-2.5 rounded-3xl bg-white p-4 text-left shadow-sm transition hover:bg-ink-100 active:scale-[0.97]";
  const body = (
    <>
      {img ? (
        <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Glyph d={icon} className="h-6 w-6" />
        </span>
      )}
      <span className="w-full min-w-0">
        <span className="block truncate text-base font-bold leading-tight text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-500">{sub}</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{body}</button>
  );
}
function Glyph({ d, className }: { d: string; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function BigButton({
  href,
  onClick,
  icon,
  title,
  sub,
  className,
}: {
  href?: string;
  onClick?: () => void;
  icon: string;
  title: string;
  sub: string;
  className: string;
}) {
  const cls = `flex h-28 flex-col items-start justify-between rounded-3xl p-4 text-left shadow-md transition active:scale-[0.97] ${className}`;
  const body = (
    <>
      <Glyph d={icon} className="h-7 w-7" />
      <span>
        <span className="block text-lg font-bold leading-tight">{title}</span>
        <span className="block text-xs opacity-80">{sub}</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={`${cls} hover:brightness-95`}>{body}</Link>
  ) : (
    <button type="button" onClick={onClick} disabled={!onClick} className={cls}>{body}</button>
  );
}


// Call a waiter / ask for the bill, sent from here.
function CallStaff({
  token,
  calls,
  hide,
  onCalled,
}: {
  token: string;
  calls: TableCall[];
  hide?: Home["hide"];
  onCalled: () => void;
}) {
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

  const buttons = (
    [
      ["staff", "Call waiter", "M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6ZM10 19a2 2 0 0 0 4 0"],
      ["bill", "Get the bill", "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6"],
    ] as const
  ).filter(([kind]) => !hide?.[kind]);
  if (!buttons.length) return null;

  return (
    <section>
      <div className={`grid gap-3 ${buttons.length > 1 ? "grid-cols-2" : ""}`}>
        {buttons.map(([kind, label, icon]) => {
          const sent = calls.find((c) => c.kind === kind);
          return (
            <button
              key={kind}
              type="button"
              disabled={busy !== null}
              onClick={() => call(kind)}
              aria-live="polite"
              className={`flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 text-left ring-1 transition active:scale-[0.97] ${
                sent ? "ring-2 ring-amber-300" : "ring-amber-200"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-amber-700" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={icon} />
              </svg>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-amber-800">{label}</span>
                {(busy === kind || sent) && (
                  <span className="block text-xs text-amber-700">{busy === kind ? "Sending…" : `Coming · ${ago(sent!.at)}`}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 px-1 text-sm text-rose-700">{error}</p>}
    </section>
  );
}

function Points({ me, outletId, signIn }: { me: Me; outletId: string; signIn: string }) {
  if (!me) return null;
  if (me === "guest") {
    return (
      <Link href={signIn} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:bg-ink-100">
        <Star />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink-900">Collect points on this meal</span>
          <span className="block text-xs text-ink-500">Free to join</span>
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
        href={`/s/${outletId}?rewards=1`}
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
// Wi-Fi in a bottom sheet: name, password and Copy; or, if the restaurant hasn't added it, ask a waiter.
function WifiSheet({
  wifi,
  token,
  canCallStaff,
  onCalled,
  onClose,
}: {
  wifi: { name: string; password: string | null } | null;
  token: string;
  canCallStaff: boolean;
  onCalled: () => void;
  onClose: () => void;
}) {
  useSheet(onClose);
  const [supabase] = useState(() => createClient());
  const [copied, setCopied] = useState(false);
  const [asked, setAsked] = useState<"idle" | "busy" | "sent" | string>("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(wifi!.password!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard: the password is on screen to type.
    }
  }
  async function askWaiter() {
    setAsked("busy");
    const { error } = await supabase.rpc("guest_call_staff", { p_token: token, p_kind: "staff" });
    setAsked(error ? error.message : "sent");
    if (!error) onCalled();
  }
  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Wi-Fi"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-sheet bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Glyph d={TILE.wifi} className="h-6 w-6" />
          </span>
          <h2 className="flex-1 text-xl font-semibold text-ink-900">Wi-Fi</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-700 active:scale-90">
            <Glyph d="M6 6l12 12M18 6L6 18" className="h-5 w-5" />
          </button>
        </div>
        {wifi ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-ink-50 px-4 py-3">
              <p className="text-xs font-semibold text-ink-500">Network</p>
              <p className="break-all text-base font-bold text-ink-900">{wifi.name}</p>
            </div>
            <div className="rounded-2xl bg-ink-50 px-4 py-3">
              <p className="text-xs font-semibold text-ink-500">Password</p>
              <p className="break-all font-mono text-base font-bold text-ink-900">{wifi.password ?? "No password needed"}</p>
            </div>
            {wifi.password && (
              <button type="button" onClick={copy} className="h-12 w-full rounded-full bg-brand-600 text-sm font-bold text-on transition active:scale-[0.97]">
                {copied ? "Copied" : "Copy password"}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-ink-600">The Wi-Fi details aren&apos;t on the app yet. Our staff can give you the password.</p>
            {canCallStaff && (
              <button
                type="button"
                onClick={askWaiter}
                disabled={asked === "busy" || asked === "sent"}
                className="mt-4 h-12 w-full rounded-full bg-brand-600 text-sm font-bold text-on transition active:scale-[0.97] disabled:opacity-60"
              >
                {asked === "busy" ? "Sending…" : asked === "sent" ? "A waiter is coming" : "Ask a waiter"}
              </button>
            )}
            {asked !== "idle" && asked !== "busy" && asked !== "sent" && <p className="mt-2 text-sm text-rose-700">{asked}</p>}
          </div>
        )}
      </motion.div>
    </>
  );
}

// Every rating goes privately to the owner first; then everyone, whatever they
// rated, may also post on Google (sending only happy diners there breaks Google's rules).
function Feedback({ token, reviewUrl, canCallStaff }: { token: string; reviewUrl: string | null; canCallStaff: boolean }) {
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
    <section id="feedback" className="scroll-mt-4">
      <SectionTitle>How was your visit?</SectionTitle>
      <div className="rounded-2xl bg-white p-4">
        {sent ? (
          <div>
            <p className="text-sm font-bold text-ink-900">Thank you. The owner reads every note.</p>
            {canCallStaff && rating > 0 && rating <= 2 && (
              <p className="mt-1 text-sm text-ink-500">Want it sorted now? Tap Call waiter and we&apos;ll come over.</p>
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
                    className="mt-3 w-full resize-none rounded-xl bg-ink-50 px-3 py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-400"
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
