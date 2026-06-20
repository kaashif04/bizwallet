"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  points: number;
  tier: string;
  memberSince: string;
};

export default function ProfileView({ data }: { data: ProfileData }) {
  const [supabase] = useState(() => createClient());
  const [name, setName] = useState(data.name);
  const [draft, setDraft] = useState(data.name);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const isOwner = data.role === "owner";

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
        await supabase.from("profiles").update({ full_name: next }).eq("id", user.id);
      }
    } catch {
      // Demo / no backend — just update locally.
    }
    setName(next);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      {/* Identity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center rounded-3xl border border-brand-100 bg-white p-6 text-center shadow-sm"
      >
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-semibold text-white shadow-md shadow-brand-600/30">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="mt-4 w-full max-w-[16rem] rounded-xl border border-slate-200 px-3 py-2 text-center text-base font-semibold text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
        ) : (
          <h2 className="mt-4 text-xl font-bold text-slate-900">{name}</h2>
        )}

        <span
          className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            isOwner ? "bg-slate-900 text-white" : "bg-brand-100 text-brand-700"
          }`}
        >
          {isOwner ? "Owner" : "Customer"}
        </span>

        {editing ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(name);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <PencilIcon />
            Edit name
          </button>
        )}
      </motion.div>

      {/* Membership */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-5 text-white shadow-glass">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Membership
            </p>
            <p className="mt-1 text-lg font-bold">{data.tier} tier</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{data.points.toLocaleString()}</p>
            <p className="text-xs text-white/60">points</p>
          </div>
        </div>
      </div>

      {/* Contact + verification */}
      <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
        <Row
          icon={<MailIcon />}
          label="Email"
          value={data.email || "—"}
          verified={data.email ? data.emailVerified : undefined}
        />
        <Divider />
        <Row
          icon={<PhoneIcon />}
          label="Phone"
          value={data.phone || "Not added"}
          verified={data.phone ? data.phoneVerified : undefined}
        />
        {data.memberSince && (
          <>
            <Divider />
            <Row icon={<CalendarIcon />} label="Member since" value={data.memberSince} />
          </>
        )}
      </div>

      {/* Orders */}
      <Link
        href="/customer/orders"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        My orders
      </Link>

      {/* Owners can jump to their store dashboard */}
      {isOwner && (
        <Link
          href="/admin"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Owner dashboard →
        </Link>
      )}

      {/* Sign out */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          <SignOutIcon />
          Sign out
        </button>
      </form>

      <p className="text-center text-[11px] text-slate-400">BizCafé · v0.1.0</p>
    </div>
  );
}

function Divider() {
  return <div className="mx-3 h-px bg-slate-100" />;
}

function Row({
  icon,
  label,
  value,
  verified,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
      {verified !== undefined &&
        (verified ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Unverified
          </span>
        ))}
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
