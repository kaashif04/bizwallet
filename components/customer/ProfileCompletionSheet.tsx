"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Gluten-free",
  "Nut allergy",
  "Seafood allergy",
  "Dairy-free",
];
const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const TODAY = new Date().toISOString().slice(0, 10);

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30";

export type ProfileCompletionData = {
  phone: string;
  dateOfBirth: string | null;
  gender: string | null;
  dietaryPreferences: string[];
  address: string | null;
  marketingConsent: boolean | null;
};

type FieldKey =
  | "phone"
  | "dateOfBirth"
  | "gender"
  | "dietaryPreferences"
  | "address"
  | "marketingConsent";

const STEP_ORDER: FieldKey[] = [
  "phone",
  "dateOfBirth",
  "gender",
  "dietaryPreferences",
  "address",
  "marketingConsent",
];

const STEP_COPY: Record<FieldKey, { question: string; hint?: string }> = {
  phone: { question: "What's your phone number?", hint: "For order updates and receipts." },
  dateOfBirth: { question: "When's your birthday?", hint: "We'll send you a treat." },
  gender: { question: "How do you identify?" },
  dietaryPreferences: {
    question: "Any dietary preferences or allergies?",
    hint: "Pick as many as apply.",
  },
  address: { question: "What's your delivery address?" },
  marketingConsent: { question: "Want news and updates from BizWallet?", hint: "Offers from each restaurant are set in Privacy." },
};

const DB_COLUMN: Record<FieldKey, string> = {
  phone: "phone",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  dietaryPreferences: "dietary_preferences",
  address: "address",
  marketingConsent: "marketing_consent",
};

function isFilled(key: FieldKey, data: ProfileCompletionData): boolean {
  switch (key) {
    case "phone":
      return !!data.phone;
    case "dateOfBirth":
      return !!data.dateOfBirth;
    case "gender":
      return !!data.gender;
    case "dietaryPreferences":
      return data.dietaryPreferences.length > 0;
    case "address":
      return !!data.address;
    case "marketingConsent":
      return data.marketingConsent !== null;
  }
}

export default function ProfileCompletionSheet({
  data,
  onClose,
  onSaved,
}: {
  data: ProfileCompletionData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Fixed at open time — only fields not yet filled get a turn in the wizard.
  const [steps] = useState<FieldKey[]>(() => STEP_ORDER.filter((k) => !isFilled(k, data)));
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(steps.length === 0);

  const [phone, setPhone] = useState(data.phone);
  const [dob, setDob] = useState(data.dateOfBirth ?? "");
  const [gender, setGender] = useState(data.gender ?? "");
  const [dietary, setDietary] = useState<string[]>(data.dietaryPreferences);
  const [address, setAddress] = useState(data.address ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);

  const currentField = steps[stepIndex];

  function toggleDietary(tag: string) {
    setDietary((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function advance() {
    setError(null);
    if (stepIndex + 1 >= steps.length) {
      setFinished(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function skip() {
    advance();
  }

  async function commit(field: FieldKey, value: string | string[] | boolean | null, filled: boolean) {
    if (!filled) {
      advance();
      return;
    }
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Please sign in again.");
      return;
    }
    const { error: saveErr } = await supabase
      .from("members")
      .update({ [DB_COLUMN[field]]: value })
      .eq("id", user.id);
    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    setSaved((n) => n + 1);
    advance();
  }

  function continueCurrent() {
    switch (currentField) {
      case "phone":
        return commit("phone", phone.trim() || null, !!phone.trim());
      case "dateOfBirth":
        return commit("dateOfBirth", dob || null, !!dob);
      case "gender":
        return commit("gender", gender || null, !!gender);
      case "dietaryPreferences":
        return commit("dietaryPreferences", dietary, dietary.length > 0);
      case "address":
        return commit("address", address.trim() || null, !!address.trim());
    }
  }

  function finish() {
    if (saved > 0) router.refresh();
    onSaved();
  }

  const isContinueEnabled = (() => {
    switch (currentField) {
      case "phone":
        return phone.trim().length > 0;
      case "dateOfBirth":
        return dob.length > 0;
      case "gender":
        return gender.length > 0;
      case "dietaryPreferences":
        return true; // 0 chips behaves like Skip — always tappable
      case "address":
        return address.trim().length > 0;
      default:
        return false;
    }
  })();

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88vh] max-w-md overflow-y-auto rounded-t-sheet bg-white shadow-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="relative px-5 pb-8 pt-3">

          {!finished ? (
            <>
              <div className="flex items-center justify-between">
                <button type="button" onClick={onClose} className="text-sm font-medium text-slate-400">
                  Close
                </button>
                <span className="text-xs font-semibold text-slate-400">
                  {stepIndex + 1} of {steps.length}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                  initial={false}
                  animate={{ width: `${(stepIndex / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentField}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5"
                >
                  <h2 className="text-lg font-bold text-slate-900">
                    {STEP_COPY[currentField].question}
                  </h2>
                  {STEP_COPY[currentField].hint && (
                    <p className="mt-1 text-sm text-slate-500">{STEP_COPY[currentField].hint}</p>
                  )}

                  {error && (
                    <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
                  )}

                  <div className="mt-4">
                    {currentField === "phone" && (
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+60 12-345 6789"
                        inputMode="tel"
                        autoFocus
                        className={inputClass}
                      />
                    )}
                    {currentField === "dateOfBirth" && (
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        max={TODAY}
                        autoFocus
                        className={inputClass}
                      />
                    )}
                    {currentField === "gender" && (
                      <div className="flex flex-col gap-2">
                        {GENDER_OPTIONS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${
                              gender === g
                                ? "border-brand-600 bg-brand-50 text-brand-700"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                    {currentField === "dietaryPreferences" && (
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map((tag) => {
                          const active = dietary.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleDietary(tag)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                  ? "bg-brand-600 text-on"
                                  : "border border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {currentField === "address" && (
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        placeholder="Street, city, postcode"
                        autoFocus
                        className={inputClass}
                      />
                    )}
                    {currentField === "marketingConsent" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => commit("marketingConsent", true, true)}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 disabled:opacity-60"
                        >
                          Yes, sign me up
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => commit("marketingConsent", false, true)}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 disabled:opacity-60"
                        >
                          No thanks
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={skip}
                  disabled={saving}
                  className="flex-1 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 disabled:opacity-60"
                >
                  Skip for now
                </button>
                {currentField !== "marketingConsent" && (
                  <button
                    type="button"
                    onClick={continueCurrent}
                    disabled={saving || !isContinueEnabled}
                    className="flex-1 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-on shadow-sm disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Continue"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="py-4 text-center"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-well">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <h2 className="mt-3 text-lg font-bold text-slate-900">All done</h2>
              <p className="mt-1 text-sm text-slate-500">
                {saved > 0 ? "Thanks, your details are saved." : "Come back anytime to add more details."}
              </p>
              <button
                type="button"
                onClick={finish}
                className="mt-6 w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-on shadow-sm"
              >
                Done
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
