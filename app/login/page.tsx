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
    <main className="relative flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-12">

      <div className="relative w-full max-w-md">
        {staff && (
          <p role="alert" className="mb-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
            That&apos;s a staff account. Rewards need a separate customer account: sign up below with a
            different email. Manage your business in the BizPos dashboard.
          </p>
        )}
        <CustomerLogin />
      </div>
    </main>
  );
}
