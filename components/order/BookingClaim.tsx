"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { bookingMoney } from "@/lib/booking";

type Claim = { matched: boolean; name: string | null; party: number | null; deposit: number | null; credit: number | null };

// At a table, find this visit's booking so the deposit comes off the bill. Signed-in
// members are matched by their own phone. Everyone else is asked for the phone they
// booked with, and can skip. Asked once per table per tab, and only while a booking is due here.
export default function BookingClaim({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [asking, setAsking] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<{ name: string; deposit: number } | null>(null);
  const key = `bizwallet.booking-claim.${token}`;

  const asked = () => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Blocked storage: the prompt may come back on the next page. Harmless.
    }
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // Carry on without remembering.
    }
    (async () => {
      // Only when the restaurant has a paid booking due around now; walk-ins aren't asked.
      const { data: due } = await supabase.rpc("wallet_booking_due", { p_table_token: token });
      if (!due) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("members").select("phone").eq("id", user.id).maybeSingle();
        if (member?.phone) {
          const { data, error } = await supabase.rpc("booking_claim", { p_table_token: token, p_phone: member.phone });
          if (!error && data) {
            asked();
            const r = data as Claim;
            if (r.matched) setWelcome({ name: r.name ?? "", deposit: Number(r.deposit ?? 0) });
            return;
          }
        }
      }
      setAsking(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function claim() {
    setError(null);
    if (phone.replace(/\D/g, "").length < 9) return setError("Enter the phone number you booked with.");
    setBusy(true);
    const { data, error } = await supabase.rpc("booking_claim", { p_table_token: token, p_phone: phone.trim() });
    setBusy(false);
    if (error || !data) return setError(error?.message ?? "Couldn't check that booking. Please try again.");
    const r = data as Claim;
    if (!r.matched) return setError("No booking found for that number.");
    asked();
    setAsking(false);
    setWelcome({ name: r.name ?? "", deposit: Number(r.deposit ?? 0) });
  }

  function skip() {
    asked();
    setAsking(false);
  }

  if (welcome) {
    return (
      <Card>
        <p className="text-lg font-semibold text-ink-900">Welcome{welcome.name ? `, ${welcome.name}` : ""}</p>
        <p className="mt-1 text-sm text-ink-600">
          Your {bookingMoney(welcome.deposit)} deposit is taken off the bill.
        </p>
        <button type="button" onClick={() => setWelcome(null)} className="mt-4 h-12 w-full rounded-full bg-brand-600 text-sm font-bold text-on">
          Got it
        </button>
      </Card>
    );
  }

  if (!asking) return null;

  return (
    <Card>
      <p className="text-lg font-semibold text-ink-900">Booked a table?</p>
      <p className="mt-1 text-sm text-ink-600">Enter the phone number you booked with, and your deposit comes off the bill.</p>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        className="mt-4 h-12 w-full rounded-xl bg-ink-50 px-3.5 text-base text-ink-900"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={skip} className="h-12 rounded-full bg-ink-100 text-sm font-bold text-ink-800">
          Skip
        </button>
        <button type="button" onClick={claim} disabled={busy} className="h-12 rounded-full bg-brand-600 text-sm font-bold text-on disabled:opacity-60">
          {busy ? "Checking…" : "Continue"}
        </button>
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    // Sits above the table's bottom bar, so Home / Menu / Cart stay reachable.
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <div role="dialog" aria-modal="false" className="rounded-3xl bg-white p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
