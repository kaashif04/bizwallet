"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import ProfileCompletionSheet from "./ProfileCompletionSheet";
import AppearancePicker from "./AppearancePicker";
import { SectionTitle } from "./ui";

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  places: { companyId: string; company: string; consent: boolean }[];
  memberSince: string;
  dateOfBirth: string | null;
  gender: string | null;
  dietaryPreferences: string[];
  address: string | null;
  marketingConsent: boolean | null;
};


export default function ProfileView({ data }: { data: ProfileData }) {
  const [supabase] = useState(() => createClient());
  const [name, setName] = useState(data.name);
  const [draft, setDraft] = useState(data.name);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  const completionFlags = [
    !!data.phone,
    !!data.dateOfBirth,
    !!data.gender,
    data.dietaryPreferences.length > 0,
    !!data.address,
    data.marketingConsent !== null,
  ];
  const completedCount = completionFlags.filter(Boolean).length;
  const totalFields = completionFlags.length;
  const completionPercent = Math.round((completedCount / totalFields) * 100);

  async function save() {
    const next = draft.trim();
    if (!next) {
      setEditing(false);
      setDraft(name);
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // RLS "profiles: update own" allows a user to update their own row.
      if (user) {
        await supabase.from("members").update({ full_name: next }).eq("id", user.id);
      }
    } catch {
      // Demo / no backend — just update locally.
    }
    setName(next);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="space-y-8">
      {/* Identity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-4 rounded-2xl bg-white p-4"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-50 text-2xl font-bold text-ink-700 shadow-well">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                autoFocus
                aria-label="Your name"
                className="w-full rounded-xl bg-ink-50 px-3 py-2 text-base font-semibold text-ink-900 shadow-pressed outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="h-9 rounded-full bg-brand-600 px-4 text-sm font-bold text-on disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(name);
                  }}
                  className="h-9 rounded-full px-3 text-sm font-bold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="truncate text-xl font-semibold tracking-[-0.02em] text-ink-900">{name}</h2>
              {data.memberSince && <p className="text-xs text-ink-500">Member since {data.memberSince}</p>}
              <button
                type="button"
                onClick={() => {
                  setDraft(name);
                  setEditing(true);
                }}
                className="-ml-2 mt-1 inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
              >
                <PencilIcon />
                Edit name
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Profile completion */}
      {completionPercent < 100 && (
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-900">Complete your profile</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {completedCount} of {totalFields} done · fill in once, used at every restaurant
              </p>
            </div>
            <span className="text-sm font-bold tabular-nums text-brand-700">{completionPercent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 shadow-well">
            <motion.div
              className="h-full rounded-full bg-marple"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCompletionSheet(true)}
            className="mt-4 w-full rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-on shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            Add details
          </button>
        </div>
      )}

      <section>
        <SectionTitle>Account</SectionTitle>
        <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
          <Row
            icon={<MailIcon />}
            label="Email"
            value={data.email || "—"}
            verified={data.email ? data.emailVerified : undefined}
          />
          <Row
            icon={<PhoneIcon />}
            label="Phone"
            value={data.phone || "Not added"}
            verified={data.phone ? data.phoneVerified : undefined}
          />
          <Link href="/customer/orders" className="block transition hover:bg-ink-50 active:bg-ink-50">
            <Row icon={<ReceiptIcon />} label="Orders" value="My orders" chevron />
          </Link>
          {completionPercent === 100 && (
            <button type="button" onClick={() => setShowCompletionSheet(true)} className="block w-full text-left transition hover:bg-ink-50">
              <Row icon={<CalendarIcon />} label="Details" value="Birthday, diet and address" chevron />
            </button>
          )}
        </div>
      </section>

      <section>
        <SectionTitle>Settings</SectionTitle>
        <div className="space-y-3">
          <AppearancePicker />
          <Link
            href="/customer/promotions"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 transition hover:shadow-md active:scale-[0.99]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink-900">Promotions</span>
              <span className="block text-xs text-ink-500">{promoSummary(data.places)}</span>
            </span>
            <span aria-hidden="true" className="text-lg text-ink-400">›</span>
          </Link>
        </div>
      </section>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 active:scale-[0.99]"
        >
          <SignOutIcon />
          Sign out
        </button>
      </form>

      <AnimatePresence>
        {showCompletionSheet && (
          <ProfileCompletionSheet
            data={{
              phone: data.phone,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              dietaryPreferences: data.dietaryPreferences,
              address: data.address,
              marketingConsent: data.marketingConsent,
            }}
            onClose={() => setShowCompletionSheet(false)}
            onSaved={() => setShowCompletionSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// "All stores", "2 of 5 stores" or "Off": who may send offers.
function promoSummary(places: ProfileData["places"]): string {
  if (!places.length) return "Choose who can send you offers";
  const n = places.filter((p) => p.consent).length;
  return n === 0 ? "Offers from stores: off" : n === places.length ? "Offers from all your stores" : `Offers from ${n} of ${places.length} stores`;
}

function Row({
  icon,
  label,
  value,
  verified,
  chevron,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
  chevron?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-brand-600 shadow-well">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="truncate text-sm font-bold text-ink-900">{value}</p>
      </div>
      {verified !== undefined && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold ${
            verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {verified ? "Verified" : "Unverified"}
        </span>
      )}
      {chevron && <span aria-hidden="true" className="text-lg text-ink-400">›</span>}
    </div>
  );
}

/* --------------------------------- icons --------------------------------- */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <Svg>
      <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </Svg>
  );
}
function PhoneIcon() {
  return (
    <Svg>
      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
    </Svg>
  );
}
function ReceiptIcon() {
  return (
    <Svg>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Svg>
  );
}
function CalendarIcon() {
  return (
    <Svg>
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </Svg>
  );
}
function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}
