"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OwnerOutlet } from "@/lib/admin/owner-types";

export default function OutletManager({
  outlets,
  selectedId,
}: {
  outlets: OwnerOutlet[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const empty = outlets.length === 0;

  const [open, setOpen] = useState(empty); // first-timers see the form expanded
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You're not signed in.");
      return;
    }

    // RLS "outlets: owner manage" lets an owner insert an outlet they own.
    const { data, error } = await supabase
      .from("outlets")
      .insert({
        name: name.trim(),
        address: location.trim() || null,
        owner_id: user.id,
        is_active: true,
      })
      .select("id")
      .single();

    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setLocation("");
    setOpen(false);
    router.push(`/admin?outlet=${data!.id}`);
    router.refresh();
  }

  return (
    <div className="mt-5">
      {!empty && (
        <div className="flex flex-wrap items-center gap-2">
          {outlets.map((o) => (
            <Link
              key={o.id}
              href={`/admin?outlet=${o.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                o.id === selectedId
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {o.name}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
          >
            {open ? "Close" : "+ New store"}
          </button>
        </div>
      )}

      {open && (
        <form
          onSubmit={create}
          className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            {empty ? "Open your first store" : "Create a new store"}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            It goes live for customers immediately — add menu items next.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Store name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Steamboat Outlet 1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Location
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Sunway Pyramid, LG Floor"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
              />
            </label>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {!empty && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Creating…" : "Create store"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
