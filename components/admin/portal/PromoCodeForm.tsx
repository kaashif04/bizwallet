"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPromoCodeAction } from "@/app/admin/dashboard/vouchers/actions";
import type { PromoCodeState } from "@/lib/admin/portal-types";

const initialState: PromoCodeState = { status: "idle" };

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage", hint: "e.g. 20% off the order total" },
  { value: "fixed", label: "Fixed RM amount", hint: "e.g. RM 10 off the order total" },
] as const;

export default function PromoCodeForm() {
  const [state, formAction] = useFormState(createPromoCodeAction, initialState);
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
      <h2 className="text-base font-semibold text-slate-900">New promo code</h2>
      <p className="mt-1 text-sm text-slate-500">
        Generate a discount code customers can redeem at checkout.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Code <span className="text-red-500">*</span>
          </span>
          <input
            name="code"
            required
            maxLength={32}
            placeholder="MERDEKA2026"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono uppercase tracking-wide text-slate-900 shadow-sm outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Letters, numbers, dashes and underscores only. Saved in CAPS.
          </span>
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Discount type <span className="text-red-500">*</span>
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DISCOUNT_TYPES.map((t, i) => (
              <label
                key={t.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="discountType"
                  value={t.value}
                  defaultChecked={i === 0}
                  required
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{t.label}</span>
                  <span className="block text-xs text-slate-500">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Discount value <span className="text-red-500">*</span>
            </span>
            <input
              name="discountValue"
              type="number"
              required
              min={0.01}
              step={0.01}
              placeholder="20"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Percentage (0-100) or RM amount, matching the type above.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Expiry date</span>
            <input
              name="expiresAt"
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
            />
            <span className="mt-1 block text-xs text-slate-400">Optional — leave blank for no expiry.</span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Usage limit</span>
          <input
            name="usageLimit"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 100 (first 100 redemptions)"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
          <span className="mt-1 block text-xs text-slate-400">Optional — leave blank for unlimited redemptions.</span>
        </label>
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
      {pending ? "Creating…" : "Generate Code"}
    </button>
  );
}
