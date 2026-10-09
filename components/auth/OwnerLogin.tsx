"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/BrandMark";

export default function OwnerLogin({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    // Middleware enforces the role; non-owners get bounced to /customer.
    router.push("/admin");
    router.refresh();
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email || !email.includes("@")) {
      return setError("Enter your work email above first, then tap reset.");
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setInfo("Password reset link sent — check your email.");
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-300 ring-1 ring-white/15">
          <BrandMark className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Owner Portal
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Authorized personnel only
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {info}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">
            Work email
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="owner@bizcafe.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white shadow-sm outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white shadow-sm outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
        </label>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="block w-full text-right text-xs font-medium text-slate-400 transition hover:text-white"
        >
          Forgot password?
        </button>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            "Sign in to dashboard"
          )}
        </button>
      </form>

      <div className="mt-7 border-t border-white/10 pt-5 text-center">
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm font-medium text-slate-400 transition hover:text-white"
        >
          ← Back to Customer Login
        </button>
      </div>
    </div>
  );
}
