"use client";

import { useEffect, useState } from "react";
import CustomerLogin from "@/components/auth/CustomerLogin";

export default function LoginPage() {
  // Set by middleware when a BizPos staff account opens the customer app.
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    setStaff(new URLSearchParams(window.location.search).get("account") === "staff");
  }, []);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-50 px-4 py-12">
      {/* Decorative ambient blobs for depth. */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 animate-blob rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 animate-blob rounded-full bg-brand-300/30 blur-3xl [animation-delay:4s]" />

      <div className="relative w-full max-w-md">
        {staff && (
          <p role="alert" className="mb-4 rounded-2xl bg-slate-900 px-5 py-4 text-sm text-brand-50 shadow-lg">
            That&apos;s a staff account. Rewards need a separate customer account: sign up below with a
            different email. Manage your business in the BizPos dashboard.
          </p>
        )}
        <CustomerLogin />
      </div>
    </main>
  );
}
