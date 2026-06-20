"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendBroadcastAction } from "@/app/admin/dashboard/marketing/actions";
import type { BroadcastState } from "@/lib/admin/portal-types";

const initialState: BroadcastState = { status: "idle" };

const AUDIENCES = [
  { value: "all", label: "All Users", hint: "Every customer with an account" },
  { value: "high_points", label: "Users with > 500 points", hint: "Your most loyal customers" },
  { value: "inactive_30d", label: "Has not ordered in 30 days", hint: "Win back lapsed customers" },
] as const;

export default function BroadcastForm() {
  const [state, formAction] = useFormState(sendBroadcastAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">New campaign</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sends an in-app notification to every customer in the target audience.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Title <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            required
            maxLength={80}
            placeholder="Merdeka Day Special 🇲🇾"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Message <span className="text-red-500">*</span>
          </span>
          <textarea
            name="message"
            required
            rows={3}
            maxLength={300}
            placeholder="Enjoy 20% off all signature drinks this weekend only!"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Target audience <span className="text-red-500">*</span>
          </span>
          <div className="space-y-2">
            {AUDIENCES.map((a, i) => (
              <label
                key={a.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="audience"
                  value={a.value}
                  defaultChecked={i === 0}
                  required
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {state.status === "error" && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send Broadcast"}
    </button>
  );
}
