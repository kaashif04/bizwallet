"use client";

import { useState } from "react";

// Refer a friend: share a link; when the friend's first bill here is paid, both get points.
export default function InviteCard({
  code,
  points,
  invited,
  rewarded,
  outletId,
  storeName,
}: {
  code: string;
  points: number;
  invited: number;
  rewarded: number;
  outletId: string;
  storeName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/invite/${code}?s=${outletId}`;
    const text = `Join me at ${storeName} on BizWallet. We both get ${points} points after your first visit.`;
    try {
      if (navigator.share) return await navigator.share({ title: storeName, text, url });
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* share sheet closed */
    }
  }

  return (
    <section className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-600" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 8v6M22 11h-6" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-ink-900">Invite a friend</span>
        <span className="block text-sm text-ink-600">
          You both get {points.toLocaleString()} points after their first visit.
          {invited > 0 && ` ${rewarded} of ${invited} visited so far.`}
        </span>
      </span>
      <button
        type="button"
        onClick={share}
        className="h-11 shrink-0 rounded-full bg-brand-600 px-4 text-sm font-bold text-on transition active:scale-95"
      >
        {copied ? "Copied" : "Share"}
      </button>
    </section>
  );
}
