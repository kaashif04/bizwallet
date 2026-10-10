"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "@/components/order/QrScanner";

// Dine-in: scan the table QR, land on that table's menu. Public, so guests can use it too.
export default function ScanPage() {
  const router = useRouter();
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => setAt(new URLSearchParams(window.location.search).get("at")), []);
  const onToken = useCallback((token: string) => router.replace(`/order/t/${encodeURIComponent(token)}`), [router]);

  return (
    <main className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-md px-5 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/customer/dashboard"))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-brand-100"
          aria-label="Back"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>

        <h1 className="mt-5 text-[2rem] font-semibold leading-tight text-slate-900">Scan your table</h1>
        <p className="mt-2 text-sm text-slate-600">
          {at ? `At ${at}? ` : ""}Point your camera at the QR code on the table. The menu opens straight away.
        </p>

        <div className="mt-6">
          <QrScanner onToken={onToken} />
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Your order goes straight to the kitchen. Pay at the counter when you&apos;re done.
        </p>
      </div>
    </main>
  );
}
