"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Method = "email" | "phone";

// Where to land after auth: the ?redirect= set by middleware or the guest
// order page, same-origin paths only.
function nextPath(): string {
  const r = new URLSearchParams(window.location.search).get("redirect");
  return r && r.startsWith("/") && !r.startsWith("//") ? r : "/customer/dashboard";
}

export default function CustomerLogin() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function reset() {
    setError(null);
    setInfo(null);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(nextPath());
    router.refresh();
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Stored on auth.users.raw_user_meta_data — the Phase-1 trigger reads
        // these to provision the profile (and the wallet + loyalty account).
        data: { full_name: fullName, app: "bizwallet" },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);

    // Email confirmation OFF -> a session is returned, go straight in.
    if (data.session) {
      router.push(nextPath());
      router.refresh();
      return;
    }
    // Confirmation ON -> the account exists but must be verified by email first.
    setInfo("Account created! Check your email to confirm, then sign in.");
    setMode("signin");
  }

  async function handleGoogle() {
    reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}` },
    });
    if (error) setError(error.message);
  }

  async function handleForgotPassword() {
    reset();
    if (!email || !email.includes("@")) {
      return setError('Enter your email above first, then tap "Forgot password?".');
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setInfo("Password reset link sent — check your email.");
  }

  // --- MOCK phone OTP (UI only, per Phase 2 scope) ---------------------------
  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (phone.replace(/\D/g, "").length < 8)
      return setError("Enter a valid phone number.");
    // TODO (backend): await supabase.auth.signInWithOtp({ phone })
    setOtpSent(true);
    setInfo("Demo: a 6-digit code would be sent via SMS.");
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    // TODO (backend): await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" })
    setInfo("Demo: OTP verified ✓ — wire up Supabase phone auth to finish sign-in.");
  }

  return (
    <div className="rounded-[2rem] bg-white p-7 shadow-xl sm:p-8">
      {/* Brand */}
      <div className="mb-7 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="BizWallet" className="mx-auto h-20 w-20 drop-shadow-lg" />
        <h1 className="mt-5 text-3xl text-slate-900">
          Welcome to BizWallet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "signup"
            ? "Free account. Earn 1 point for every RM1."
            : "Sign in to your wallet and rewards"}
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-slate-100 bg-white px-4 py-3 text-[15px] font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.98]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          or
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Method toggle */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(["email", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              reset();
            }}
            className="relative rounded-lg py-2 text-sm font-medium capitalize text-slate-600 transition"
          >
            {method === m && (
              <motion.span
                layoutId="customer-method-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 ${
                method === m ? "text-slate-900" : ""
              }`}
            >
              {m}
            </span>
          </button>
        ))}
      </div>

      {/* Banners */}
      {error && <Banner tone="error">{error}</Banner>}
      {info && <Banner tone="info">{info}</Banner>}

      {/* Email / password */}
      {method === "email" && (
        <form
          onSubmit={mode === "signup" ? handleEmailSignUp : handleEmailLogin}
          className="space-y-3"
        >
          {mode === "signup" && (
            <Field
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={setFullName}
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            label="Password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            required
          />
          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="-mt-1 block w-full text-right text-xs font-medium text-slate-500 transition hover:text-brand-600"
            >
              Forgot password?
            </button>
          )}
          <PrimaryButton loading={loading}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </PrimaryButton>

          <p className="pt-1 text-center text-sm text-slate-500">
            {mode === "signup" ? "Already have an account? " : "New to BizWallet? "}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "signup" ? "signin" : "signup"));
                reset();
              }}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </form>
      )}

      {/* Phone OTP (mocked) */}
      {method === "phone" && (
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3">
          <Field
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+60 12 345 6789"
            value={phone}
            onChange={setPhone}
            disabled={otpSent}
            required
          />

          {otpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <Field
                label="Verification code"
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </motion.div>
          )}

          <PrimaryButton loading={loading}>
            {otpSent ? "Verify & continue" : "Send code"}
          </PrimaryButton>

          {otpSent && (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                reset();
              }}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Use a different number
            </button>
          )}
        </form>
      )}
    </div>
  );
}

/* ------------------------------- UI helpers ------------------------------- */

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:bg-white disabled:text-slate-400"
      />
    </label>
  );
}

function PrimaryButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex w-full items-center justify-center rounded-full bg-brand-600 px-4 py-3.5 text-base font-extrabold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "error" | "info";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-brand-200 bg-brand-50 text-brand-700";
  return (
    <div className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
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
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
