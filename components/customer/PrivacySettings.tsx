"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Offers are opt-in per restaurant (PDPA): each company only messages members
// who said yes to it. BizWallet's own news is the profile's marketing setting.
export default function PrivacySettings({
  places,
}: {
  places: { companyId: string; company: string; consent: boolean }[];
}) {
  const [supabase] = useState(() => createClient());
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(places.map((p) => [p.companyId, p.consent]))
  );
  const [error, setError] = useState<string | null>(null);

  async function toggle(companyId: string) {
    const next = !on[companyId];
    setOn((m) => ({ ...m, [companyId]: next }));
    setError(null);
    const { error } = await supabase.rpc("set_company_consent", { p_company: companyId, p_consent: next });
    if (error) {
      setOn((m) => ({ ...m, [companyId]: !next }));
      setError(error.message);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4">
      <h3 className="text-sm font-bold text-ink-900">Offers and privacy</h3>
      {places.length === 0 ? (
        <p className="mt-2 text-sm text-ink-500">
          Once you order from or join a restaurant, you can choose here whether it may send you offers.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-ink-100">
          {places.map((p) => (
            <li key={p.companyId} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink-900">Offers from {p.company}</span>
                <span className="block text-xs text-ink-500">Promos and news from this restaurant only</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on[p.companyId]}
                aria-label={`Offers from ${p.company}`}
                onClick={() => toggle(p.companyId)}
                className={`relative h-7 w-12 shrink-0 rounded-full p-0 transition-colors ${on[p.companyId] ? "bg-brand-600" : "bg-ink-200"}`}
              >
                <span
                  className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-on shadow-sm transition-transform ${
                    on[p.companyId] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
  );
}
