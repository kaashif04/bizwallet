"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "@/components/order/QrScanner";

// Scan a table, receipt or restaurant QR and open it. Public, so guests can use it too.
export default function ScanPage() {
  const router = useRouter();
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => setAt(new URLSearchParams(window.location.search).get("at")), []);
  const onPath = useCallback((path: string) => router.replace(path), [router]);

  return (
    <main className="min-h-dvh bg-ink-50">
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

        <h1 className="mt-5 text-[2rem] font-semibold leading-tight text-slate-900">{at ? "Scan your table" : "Scan a QR"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {at
            ? `At ${at}? Point your camera at the QR code on the table. The menu opens straight away.`
            : "Point your camera at the QR on your table to order, or on your receipt to collect points."}
        </p>

        <div className="mt-6">
          <QrScanner onPath={onPath} />
        </div>

      </div>
    </main>
  );
}
