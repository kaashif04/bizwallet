"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Refund = {
  amount: number;
  reason: string | null;
  outlet: string;
  status: "waiting" | "ready" | "sending" | "paid" | "failed";
  needs_id_number: boolean;
  holder_name: string | null;
  bank_code: string | null;
  account_last4: string | null;
  paid_at: string | null;
  can_edit: boolean;
  banks: { code: string; name: string }[];
};

const field = "w-full rounded-xl bg-white px-4 py-3.5 text-base text-ink-900 outline-none ring-1 ring-ink-100 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600";

// Tell us where to send your refund: name on the account, bank, account number (and IC/passport if the bank needs it).
export default function RefundForm({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [r, setR] = useState<Refund | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (x: Refund) => {
    setR(x);
    setHolder((h) => h || x.holder_name || "");
    setBank((b) => b || x.bank_code || "");
  };
  useEffect(() => {
    supabase.rpc("refund_get", { p_token: token }).then(({ data, error }) => (error || !data ? setMissing(error?.message ?? "Refund not found.") : show(data as Refund)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("refund_submit", {
      p_token: token,
      p_holder: holder.trim(),
      p_bank: bank,
      p_account: account.replace(/\D/g, ""),
      p_id_number: idNumber.trim() || null,
    });
    setBusy(false);
    if (error || !data) return setError(error?.message ?? "Couldn't save. Please try again.");
    setAccount("");
    setIdNumber("");
    show(data as Refund);
  }

  if (missing) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-ink-900">We couldn&apos;t find this refund</h1>
        <p className="mt-2 text-sm text-ink-500">{missing} Check the link you were sent.</p>
      </Shell>
    );
  }
  if (!r) {
    return (
      <Shell>
        <p className="text-sm text-ink-500">Loading…</p>
      </Shell>
    );
  }

  const money = `RM${Number(r.amount).toFixed(2)}`;
  const bankName = r.banks.find((b) => b.code === r.bank_code)?.name ?? r.bank_code;
  const saved = r.account_last4 ? `${bankName ?? "Your bank"} account ending ${r.account_last4}` : null;

  return (
    <Shell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{r.outlet}</p>
      <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink-900">
        {r.status === "paid" ? "Your refund is paid" : r.status === "sending" ? "We're sending your refund" : `Your ${money} refund`}
      </h1>
      {r.reason && <p className="mt-1 text-sm text-ink-500">{r.reason}</p>}

      {r.status === "paid" && (
        <p className="mt-5 rounded-2xl bg-white p-5 text-sm text-ink-700">
          {money} was paid back{r.paid_at ? ` on ${new Date(r.paid_at).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium" })}` : ""}
          {saved ? ` to your ${saved}` : ""}. It can take a little while to show in your bank.
        </p>
      )}
      {r.status === "sending" && (
        <p className="mt-5 rounded-2xl bg-white p-5 text-sm text-ink-700">
          {money} is on its way{saved ? ` to your ${saved}` : ""}. You don&apos;t need to do anything.
        </p>
      )}
      {r.status === "failed" && r.can_edit && (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          The bank couldn&apos;t take the transfer. Please check your details below and send them again.
        </p>
      )}
      {r.status === "ready" && (
        <p className="mt-5 rounded-2xl bg-white p-5 text-sm text-ink-700">
          Thank you. We have your details{saved ? ` (${saved})` : ""} and the restaurant will send your {money} soon. You can change them below until it&apos;s sent.
        </p>
      )}

      {r.can_edit && (
        <form onSubmit={submit} className="mt-5 space-y-3">
          {r.status === "waiting" && <p className="text-sm text-ink-600">Tell us where to send your {money}. It goes to a bank account in your name.</p>}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-800">Name on the bank account</span>
            <input className={field} value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="name" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-800">Bank</span>
            <select className={field} value={bank} onChange={(e) => setBank(e.target.value)} required>
              <option value="" disabled>
                Choose your bank
              </option>
              {r.banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-800">Account number</span>
            <input
              className={field}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder={r.account_last4 ? `Ending ${r.account_last4}. Type it again to change` : undefined}
              required
            />
          </label>
          {r.needs_id_number && (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink-800">IC or passport number</span>
              <input className={field} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} autoComplete="off" required />
              <span className="mt-1 block text-xs text-ink-500">The bank needs it to send you the money.</span>
            </label>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-14 w-full rounded-full bg-brand-600 text-base font-bold text-on shadow-sm transition active:scale-[0.97] disabled:opacity-60"
          >
            {busy ? "Saving…" : r.status === "waiting" ? "Send my refund here" : "Save my details"}
          </button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto max-w-md px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">{children}</main>
    </div>
  );
}
