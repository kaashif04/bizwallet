"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createOutletAction } from "@/app/admin/setup/actions";
import type { SetupState } from "@/app/admin/setup/types";

const initialState: SetupState = { status: "idle" };

export default function SetupForm() {
  const [state, formAction] = useFormState(createOutletAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the inputs after a successful create.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">
        Create outlet &amp; assign manager
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        The manager must already have a BizCafé account (they sign up first).
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          name="name"
          label="Outlet name"
          placeholder="Bistro Branch 1"
          required
        />
        <Field name="location" label="Location" placeholder="Pavilion KL, Level 2" />
        <div className="sm:col-span-2">
          <Field
            name="email"
            type="email"
            label="Manager / owner email"
            placeholder="manager@example.com"
            required
          />
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
      {pending ? "Creating…" : "Create outlet & assign owner"}
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
      />
    </label>
  );
}
