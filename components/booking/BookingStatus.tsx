"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { type Booking, type BookingConfig, bookingMoney, forgetBooking, klDateTime, klTime, rememberBooking, savedBookings } from "@/lib/booking";

// One booking, by its link. Shows the code and details, takes the deposit if it's still due,
// and cancels with the refund rule spelled out first.
export default function BookingStatus({ token, justPaid }: { token: string; justPaid: boolean }) {
  const [supabase] = useState(() => createClient());
  const [b, setB] = useState<Booking | null>(null);
  const [cfg, setCfg] = useState<BookingConfig | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [needPhone, setNeedPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [polls, setPolls] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("booking_get", { p_token: token });
    if (error || !data) {
      setMissing(true);
      return;
    }
    const bk = data as Booking;
    setB(bk);
    rememberBooking({ token, code: bk.code, outlet: bk.outlet.name, when: bk.when, party: bk.party });
  }, [supabase, token]);

  useEffect(() => {
    load();
  }, [load]);

  const outletId = b?.outlet.id;
  useEffect(() => {
    if (!outletId) return;
    supabase.rpc("booking_config", { p_outlet: outletId }).then(({ data }) => setCfg((data as BookingConfig) ?? null));
  }, [supabase, outletId]);

  // Countdown while the deposit is due.
  const awaiting = b?.status === "awaiting_deposit";
  useEffect(() => {
    if (!awaiting) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [awaiting]);

  // Back from Billplz: the callback may land a few seconds after the redirect. Poll for a while.
  useEffect(() => {
    if (!justPaid || !awaiting || polls >= 10) return;
    const t = setTimeout(async () => {
      await load();
      setPolls((p) => p + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [justPaid, awaiting, polls, load]);

  async function pay() {
    setBusy(true);
    setError(null);
    const saved = savedBookings().find((x) => x.token === token);
    const mobile = phone.trim() || saved?.phone || "";
    const res = await fetch("/api/booking/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, mobile }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.url) return window.location.assign(body.url);
    setBusy(false);
    if (body.paid) return load();
    if (res.status === 400) setNeedPhone(true);
    if (res.status === 410) load();
    setError(body.error ?? "Couldn't open payment. Please try again.");
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("booking_cancel", { p_token: token });
    setBusy(false);
    if (error || !data) return setError(error?.message ?? "Couldn't cancel. Please try again.");
    setConfirming(false);
    setB(data as Booking);
  }

  if (missing) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-ink-900">We couldn&apos;t find this booking</h1>
        <p className="mt-2 text-sm text-ink-500">Check the link you were sent, or book a new table.</p>
        <Link href="/booking" className="mt-6 flex h-14 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on">
          Book a table
        </Link>
      </Shell>
    );
  }
  if (!b) {
    return (
      <Shell>
        <p className="text-sm text-ink-500">Loading your booking…</p>
      </Shell>
    );
  }

  const left = b.expires_at ? Math.max(0, Date.parse(b.expires_at) - now) : 0;
  const mm = Math.floor(left / 60_000);
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, "0");
  const deposit = Number(b.deposit_due) || 0;
  const pollingOut = justPaid && awaiting && polls >= 10;

  return (
    <Shell>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{b.outlet.name}</p>
        <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">{headline(b.status)}</h1>
      </header>

      {b.status === "awaiting_deposit" && (
        <section className="mt-5 rounded-3xl bg-white p-5">
          {pollingOut ? (
            <p className="text-sm text-ink-700">Your payment is still being confirmed. This page updates by itself; refresh in a moment.</p>
          ) : left > 0 ? (
            <p className="text-sm text-ink-700">
              Hold this table within <span className="font-bold tabular-nums text-ink-900">{mm}:{ss}</span>, or the slot is released.
            </p>
          ) : (
            <p className="text-sm text-ink-700">Your hold has ended. Refresh to check, or book a new time.</p>
          )}
          {needPhone && (
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-ink-500">Phone number</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl bg-ink-50 px-3.5 text-base text-ink-900"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={pay}
            disabled={busy || left <= 0}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:bg-brand-700 active:scale-[0.97] disabled:opacity-60"
          >
            {busy ? "Opening payment…" : `Pay deposit ${bookingMoney(deposit)}`}
          </button>
        </section>
      )}

      {b.status === "expired" && (
        <section className="mt-5 rounded-3xl bg-white p-5">
          <p className="text-sm text-ink-700">The deposit didn&apos;t come through in time, so the slot was released.</p>
          <Link
            href={`/booking?outlet=${b.outlet.id}`}
            className="mt-4 flex h-14 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg"
          >
            Pick another time
          </Link>
        </section>
      )}

      {(b.status === "booked" || b.status === "awaiting_deposit") && (
        <section className="mt-5 rounded-3xl bg-white p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">Booking code</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.12em] text-ink-900">{b.code}</p>
        </section>
      )}

      <section className="mt-5 divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white text-sm">
        <Row label="When" value={klDateTime(b.when)} />
        <Row label="Party" value={`${b.party} guest${b.party > 1 ? "s" : ""}`} />
        <Row label="Name" value={b.name} />
        {b.note && <Row label="Note" value={b.note} />}
        <div className="flex items-start justify-between gap-4 px-5 py-3.5">
          <span className="text-ink-500">Restaurant</span>
          <span className="text-right">
            {b.outlet.address && <span className="block text-ink-900">{b.outlet.address}</span>}
            <span className="mt-1 flex justify-end gap-3 font-bold">
              {b.outlet.maps_url && (
                <a href={b.outlet.maps_url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                  Directions
                </a>
              )}
              {b.outlet.phone && (
                <a href={`tel:${b.outlet.phone.replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
                  Call
                </a>
              )}
            </span>
          </span>
        </div>
      </section>

      {(deposit > 0 || b.deposit_applied > 0 || b.refund_amount > 0) && (
        <section className="mt-5 rounded-3xl bg-white p-5 text-sm text-ink-700">
          <p className="font-bold text-ink-900">Deposit {bookingMoney(deposit || b.deposit_applied)}</p>
          {b.deposit_applied > 0 && <p className="mt-1">{bookingMoney(b.deposit_applied)} is taken off your bill when you dine.</p>}
          {b.refund_amount > 0 && <p className="mt-1">Refund {bookingMoney(b.refund_amount)}, made by the restaurant by hand within a few working days.</p>}
          {b.can_cancel_free && b.free_cancel_until && <p className="mt-1">Free cancellation until {klDateTime(b.free_cancel_until)}.</p>}
          {!b.can_cancel_free && b.can_cancel && deposit > 0 && (
            <p className="mt-1">Cancelling now keeps the deposit{b.free_cancel_until ? `. Free cancellation ended ${klDateTime(b.free_cancel_until)}` : ""}.</p>
          )}
        </section>
      )}

      {cfg?.policy_text && <p className="mt-5 px-1 text-xs leading-relaxed text-ink-500">{cfg.policy_text}</p>}
      {b.status === "booked" && (
        <p className="mt-3 px-1 text-xs leading-relaxed text-ink-500">
          At the table, scan the table&apos;s QR code and enter the phone number you booked with, from 30 minutes before to 4 hours after {klTime(b.when)}. The deposit comes off your bill once.
        </p>
      )}

      {b.can_cancel && (b.status === "booked" || b.status === "awaiting_deposit") && (
        <section className="mt-8">
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="h-12 w-full rounded-full bg-white text-sm font-bold text-rose-700 shadow-sm">
              Cancel booking
            </button>
          ) : (
            <div className="rounded-3xl bg-white p-5">
              <p className="font-bold text-ink-900">Cancel this booking?</p>
              <p className="mt-1 text-sm text-ink-700">
                {deposit <= 0
                  ? "Nothing to refund."
                  : b.can_cancel_free
                    ? `Your ${bookingMoney(deposit)} deposit will be refunded by the restaurant by hand, within a few working days.`
                    : `Your ${bookingMoney(deposit)} deposit is kept, because free cancellation has ended.`}
              </p>
              {error && (
                <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  {error}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="h-12 rounded-full bg-ink-100 text-sm font-bold text-ink-800">
                  Keep booking
                </button>
                <button type="button" onClick={cancel} disabled={busy} className="h-12 rounded-full bg-rose-600 text-sm font-bold text-white disabled:opacity-60">
                  {busy ? "Cancelling…" : "Yes, cancel"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {(b.status === "cancelled" || b.status === "expired") && (
        <button
          type="button"
          onClick={() => {
            forgetBooking(token);
            window.location.assign("/booking");
          }}
          className="mt-8 h-12 w-full text-sm font-bold text-ink-500"
        >
          Remove from my bookings
        </button>
      )}
    </Shell>
  );
}

function headline(status: string) {
  switch (status) {
    case "awaiting_deposit":
      return "Pay the deposit to hold your table";
    case "booked":
      return "You're booked";
    case "expired":
      return "This slot was released";
    case "cancelled":
      return "Booking cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">{children}</main>
    </div>
  );
}
