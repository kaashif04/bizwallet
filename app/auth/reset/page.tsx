"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The recovery link routes through /auth/callback, which exchanges the code
  // for a session, then forwards here. So by now we should have a user.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setReady(true);
    });
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push("/customer/dashboard"), 1600);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-glass backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Set a new password
        </h1>

        {!ready ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : done ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            ✓ Password updated — taking you to your dashboard…
          </p>
        ) : !hasSession ? (
          <div className="mt-4">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This page must be opened from the password-reset link in your email.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                New password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
