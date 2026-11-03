"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveClaimToken } from "@/lib/guest-order";
import { currencySymbol } from "@/lib/format";

// Opened from the kiosk's QR: pay for that kiosk order on your own phone, no
// account needed (just a mobile number for Billplz). The kiosk screen updates
// by itself once the payment lands.
type Status = {
  status: string;
  paid: boolean;
  amount_due: number | null;
  number?: number | string | null;
  items: { name: string; quantity: number }[];
};

export default function KioskPayPage({ params }: { params: { id: string } }) {
  const [supabase] = useState(() => createClient());
  const [claim, setClaim] = useState<string | null>(null);
  const [order, setOrder] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    if (!c) return setError("This payment link is incomplete. Scan the code on the kiosk again.");
    setClaim(c);
    // So the order page after Billplz can show this order on this phone.
    saveClaimToken(params.id, c, `/k/${params.id}`);
    supabase.rpc("guest_order_status", { p_id: params.id, p_claim_token: c }).then(({ data, error }) => {
      if (error || !data) return setError("We couldn't find this order. Please pay at the counter.");
      setOrder(data as Status);
    });
  }, [params.id, supabase]);

  async function pay() {
    if (!claim) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: params.id, claim_token: claim, mobile: phone }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.url) return window.location.assign(body.url);
    setBusy(false);
    if (body.paid) return setOrder((o) => (o ? { ...o, paid: true } : o));
    setError(body.error ?? "Payment couldn't start. Please pay at the counter.");
  }

  const sym = currencySymbol("MYR");
  const paid = order && (order.paid || order.status !== "awaiting_payment");
  const number = order?.number ?? params.id.slice(0, 4).toUpperCase();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-sm font-semibold text-ink-500">Kiosk order</p>
      <h1 className="mt-1 text-3xl font-semibold text-ink-900">#{number}</h1>

      {!order && !error && <div className="mt-6 h-40 animate-pulse rounded-3xl bg-white" aria-busy="true" />}

      {order && (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <ul className="space-y-1.5 text-[15px] text-ink-800">
            {order.items.map((i, k) => (
              <li key={k}>
                {i.quantity > 1 ? `${i.quantity}× ` : ""}
                {i.name}
              </li>
            ))}
          </ul>
          {order.amount_due != null && (
            <p className="mt-4 flex items-baseline justify-between border-t border-ink-100 pt-4">
              <span className="text-ink-600">To pay</span>
              <span className="text-2xl font-bold text-ink-900">
                {sym}
                {Number(order.amount_due).toFixed(2)}
              </span>
            </p>
          )}
        </section>
      )}

      {paid ? (
        <p className="mt-6 rounded-3xl bg-emerald-50 p-5 text-center text-lg font-semibold text-emerald-700">
          Paid. Thank you! Listen for #{number} at the counter.
        </p>
      ) : (
        order && (
          <>
            <label className="mt-6 block">
              <span className="text-sm font-semibold text-ink-700">Your phone number</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 012 345 6789"
                className="mt-1.5 h-12 w-full rounded-2xl bg-white px-4 text-base text-ink-900"
              />
              <span className="mt-1 block text-xs text-ink-500">For your payment receipt from Billplz.</span>
            </label>
            <button
              type="button"
              onClick={pay}
              disabled={busy || phone.replace(/\D/g, "").length < 9}
              className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-sm transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60"
            >
              {busy ? "Opening payment…" : `Pay${order.amount_due != null ? ` ${sym}${Number(order.amount_due).toFixed(2)}` : ""}`}
            </button>
          </>
        )
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </main>
  );
}
