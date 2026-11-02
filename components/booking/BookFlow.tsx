"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type BookingConfig,
  type SavedBooking,
  bookingMoney,
  depositFor,
  klDateTime,
  klTime,
  klToday,
  rememberBooking,
  savedBookings,
} from "@/lib/booking";

type Outlet = { id: string; name: string; address: string | null };
type Picked = { outlet: Outlet; cfg: BookingConfig };
type Step = "outlet" | "date" | "party" | "time" | "details";

// Book a table: outlet, date, party, time, then name and phone, then the deposit.
// Outlets come from the public list, kept only if their booking is switched on.
export default function BookFlow({ outletId }: { outletId?: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState<Picked[] | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [steps, setSteps] = useState<Step[]>([]); // where Back goes
  const [step, setStep] = useState<Step>("outlet");
  const [date, setDate] = useState("");
  const [party, setParty] = useState(0);
  const [slots, setSlots] = useState<{ slot: string; available: boolean }[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<SavedBooking[]>([]);

  useEffect(() => {
    setMine(savedBookings());
    (async () => {
      const { data } = await supabase.rpc("guest_list_outlets");
      const list = (data ?? []) as Outlet[];
      const cfgs = await Promise.all(list.map(async (o) => ({ outlet: o, cfg: (await supabase.rpc("booking_config", { p_outlet: o.id })).data as BookingConfig | null })));
      const on = cfgs.filter((x): x is Picked => !!x.cfg?.enabled);
      setOpen(on);
      const one = outletId ? on.find((x) => x.outlet.id === outletId) : undefined;
      if (one) choose(one, true);
    })();
    // Signed in: prefill the name and phone from the member profile.
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase.from("members").select("full_name, phone").eq("id", user.id).maybeSingle();
      if (!member) return;
      setName((n) => n || member.full_name?.trim() || "");
      setPhone((p) => p || member.phone?.trim() || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== "time" || !picked || !date || !party) return;
    setSlots(null);
    setSlot(null);
    supabase.rpc("booking_slots", { p_outlet: picked.outlet.id, p_date: date, p_party: party }).then(({ data, error }) => {
      if (error) setError(error.message);
      setSlots((data ?? []) as { slot: string; available: boolean }[]);
    });
  }, [step, picked, date, party, supabase]);

  function go(next: Step) {
    setError(null);
    setSteps((s) => [...s, step]);
    setStep(next);
  }

  function back() {
    const prev = steps[steps.length - 1];
    if (!prev) return router.back();
    setError(null);
    setSteps((s) => s.slice(0, -1));
    setStep(prev);
  }

  function choose(p: Picked, skipOutlet = false) {
    setPicked(p);
    setDate("");
    setParty(0);
    setSlot(null);
    setError(null);
    setStep("date");
    if (skipOutlet) setSteps([]);
    else setSteps(["outlet"]);
  }

  async function book() {
    if (!picked || !slot) return;
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 9) return setError("Please enter a phone number.");
    setBusy(true);
    const { data, error } = await supabase.rpc("booking_create", {
      p_outlet: picked.outlet.id,
      p_when: slot,
      p_party: party,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_note: note.trim() || null,
    });
    if (error || !data) {
      setBusy(false);
      return setError(error?.message ?? "Couldn't book that table. Please try again.");
    }
    const b = data as { token: string; code: string; status: string };
    const saved = { token: b.token, code: b.code, outlet: picked.outlet.name, when: slot, party, phone: phone.trim() };
    rememberBooking(saved);
    if (b.status === "booked") return router.push(`/booking/${b.token}`);

    // Deposit due: straight to Billplz. If that fails, the booking page can retry.
    const res = await fetch("/api/booking/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: b.token, mobile: phone.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (body.url) return window.location.assign(body.url);
    router.push(`/booking/${b.token}`);
  }

  const today = klToday();
  const maxDate = picked ? addDays(today, picked.cfg.days_ahead) : today;
  const title = { outlet: "Book a table", date: "Pick a date", party: "How many guests?", time: "Pick a time", details: "Your details" }[step];

  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-brand-100"
          aria-label="Back"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <h1 className="mt-5 text-[2rem] font-semibold leading-tight text-slate-900">{title}</h1>
        {picked && step !== "outlet" && <p className="mt-1 text-sm text-slate-600">{picked.outlet.name}</p>}

        {step === "outlet" && (
          <section className="mt-6 space-y-4">
            {mine.length > 0 && (
              <div>
                <h2 className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">My bookings</h2>
                <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
                  {mine.map((b) => (
                    <li key={b.token}>
                      <Link href={`/booking/${b.token}`} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition hover:bg-ink-50">
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-ink-900">{b.outlet}</span>
                          <span className="block truncate text-ink-500">
                            {klDateTime(b.when)} · {b.party} guest{b.party > 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold text-brand-700">View ›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {open === null && <p className="text-sm text-slate-500">Loading restaurants…</p>}
            {open?.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-600">No restaurant is taking table bookings right now.</p>}
            {open && open.length > 0 && (
              <ul className="space-y-3">
                {open.map((p) => (
                  <li key={p.outlet.id}>
                    <button
                      type="button"
                      onClick={() => choose(p)}
                      className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-brand-50 active:scale-[0.99]"
                    >
                      <span className="block font-bold text-slate-900">{p.outlet.name}</span>
                      {p.outlet.address && <span className="mt-0.5 block text-sm text-slate-500">{p.outlet.address}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {step === "date" && picked && (
          <section className="mt-6">
            <input
              type="date"
              value={date}
              min={today}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 w-full rounded-2xl bg-white px-4 text-base text-slate-900 shadow-sm"
            />
            <p className="mt-2 text-xs text-slate-500">Up to {picked.cfg.days_ahead} days ahead.</p>
            <Next disabled={!date} onClick={() => go("party")} />
          </section>
        )}

        {step === "party" && picked && (
          <section className="mt-6">
            <div className="grid grid-cols-4 gap-2">
              {range(picked.cfg.min_party, picked.cfg.max_party).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setParty(n)}
                  className={`h-14 rounded-2xl text-base font-bold shadow-sm transition ${party === n ? "bg-brand-600 text-on" : "bg-white text-slate-800"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Next disabled={!party} onClick={() => go("time")} />
          </section>
        )}

        {step === "time" && picked && (
          <section className="mt-6">
            {slots === null && <p className="text-sm text-slate-500">Checking times…</p>}
            {slots?.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-600">The restaurant is closed that day. Pick another date.</p>}
            {slots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.slot}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSlot(s.slot)}
                    className={`h-12 rounded-2xl text-sm font-bold shadow-sm transition ${
                      !s.available
                        ? "bg-ink-100 text-ink-400 line-through"
                        : slot === s.slot
                          ? "bg-brand-600 text-on"
                          : "bg-white text-slate-800"
                    }`}
                  >
                    {klTime(s.slot)}
                  </button>
                ))}
              </div>
            )}
            {slots && slots.length > 0 && !slots.some((s) => s.available) && (
              <p className="mt-3 text-sm text-slate-600">Sorry, that day is full. Try another date or party size.</p>
            )}
            <Next disabled={!slot} onClick={() => go("details")} />
          </section>
        )}

        {step === "details" && picked && slot && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
              <p className="font-bold text-slate-900">{klDateTime(slot)}</p>
              <p className="mt-0.5">
                {party} guest{party > 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-3 rounded-2xl bg-white p-4">
              <Field label="Name" value={name} onChange={setName} autoComplete="name" />
              <Field label="Phone" value={phone} onChange={setPhone} type="tel" autoComplete="tel" placeholder="e.g. 012 345 6789" />
              <Field label="Note (optional)" value={note} onChange={setNote} placeholder="Birthday, high chair, allergies" />
            </div>

            <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
              {picked.cfg.deposit_per_guest > 0 ? (
                <>
                  <p className="font-bold text-slate-900">
                    Deposit {bookingMoney(depositFor(picked.cfg, party))}
                  </p>
                  <p className="mt-1 text-slate-600">{picked.cfg.policy_text}</p>
                </>
              ) : (
                <p className="text-slate-600">No deposit needed. {picked.cfg.policy_text}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">The deposit counts toward your bill when you dine. SST and service charge are calculated on the full bill.</p>
            </div>

            {error && (
              <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={book}
              disabled={busy}
              className="flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60"
            >
              {busy ? "Booking…" : picked.cfg.deposit_per_guest > 0 ? `Pay deposit ${bookingMoney(depositFor(picked.cfg, party))}` : "Book table"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function Next({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-brand-600 text-base font-bold text-on shadow-lg transition hover:brightness-95 active:scale-[0.97] disabled:opacity-40"
    >
      Next
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-12 w-full rounded-xl bg-slate-50 px-3.5 text-base text-slate-900"
        {...rest}
      />
    </label>
  );
}

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

// YYYY-MM-DD plus n days, in Malaysia's calendar.
function addDays(ymd: string, n: number) {
  return new Date(new Date(`${ymd}T00:00:00+08:00`).getTime() + n * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}
