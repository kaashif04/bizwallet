"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import BranchLogo from "@/components/order/BranchLogo";
import { SectionTitle } from "./ui";

export type PromoStore = {
  companyId: string;
  name: string;
  logos: { name: string; url: string | null }[];
  consent: boolean;
};

type Mode = "all" | "some" | "none";

// Offers are opt-in per company (PDPA): set_company_consent per store. "All" and
// "None" are shortcuts that set every store the member has joined; stores they
// join later ask on their own (JoinPrompt).
export default function PromotionSettings({ userId, news: initialNews, stores }: { userId: string; news: boolean; stores: PromoStore[] }) {
  const [supabase] = useState(() => createClient());
  const [news, setNews] = useState(initialNews);
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(stores.map((s) => [s.companyId, s.consent])));
  const count = stores.filter((s) => on[s.companyId]).length;
  const [mode, setMode] = useState<Mode>(() =>
    stores.length && count === stores.length ? "all" : count === 0 ? "none" : "some"
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  // Saves what changed; rolls back on failure.
  async function apply(next: Record<string, boolean>) {
    const before = on;
    setOn(next);
    setError(null);
    const changed = stores.filter((s) => next[s.companyId] !== before[s.companyId]);
    const results = await Promise.all(
      changed.map((s) => supabase.rpc("set_company_consent", { p_company: s.companyId, p_consent: next[s.companyId] }))
    );
    const failed = results.find((r) => r.error);
    if (failed) {
      setOn(before);
      return setError(failed.error!.message);
    }
    if (changed.length) flash();
  }

  function choose(m: Mode) {
    setMode(m);
    if (m === "all") apply(Object.fromEntries(stores.map((s) => [s.companyId, true])));
    if (m === "none") apply(Object.fromEntries(stores.map((s) => [s.companyId, false])));
  }

  async function toggleNews() {
    const next = !news;
    setNews(next);
    const { error } = await supabase.from("members").update({ marketing_consent: next }).eq("id", userId);
    if (error) {
      setNews(!next);
      return setError(error.message);
    }
    flash();
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? stores.filter((s) => s.name.toLowerCase().includes(q)) : stores;
  }, [stores, query]);

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>From BizWallet</SectionTitle>
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink-900">BizWallet news</span>
            <span className="block text-xs text-ink-500">New features and app-wide offers</span>
          </span>
          <Switch on={news} label="BizWallet news" onClick={toggleNews} />
        </div>
      </section>

      <section>
        <SectionTitle>Offers from stores</SectionTitle>
        {stores.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-ink-500">
            Once you order from or join a store, you can choose here whether it may send you offers.
          </p>
        ) : (
          <>
            <div role="radiogroup" aria-label="Offers from stores" className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
              {(
                [
                  ["all", "All my stores", `Every store you've joined (${stores.length})`],
                  ["some", "Only stores I choose", mode === "some" ? `${count} of ${stores.length} chosen` : "Pick from the list"],
                  ["none", "None", "No offers from any store"],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => choose(value)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-ink-50"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      mode === value ? "border-brand-600" : "border-ink-300"
                    }`}
                  >
                    {mode === value && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-900">{label}</span>
                    <span className="block text-xs text-ink-500">{hint}</span>
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {mode === "some" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    {stores.length >= 6 && (
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your stores"
                        aria-label="Search your stores"
                        className="mb-3 w-full rounded-xl bg-white px-4 py-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                      />
                    )}
                    <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white">
                      {shown.map((s) => (
                        <li key={s.companyId}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-ink-50">
                            <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                              {s.logos.map((l) => (
                                <BranchLogo key={l.name} name={l.name} logoUrl={l.url} className="h-9 w-9 rounded-full text-sm ring-2 ring-white" />
                              ))}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-900">{s.name}</span>
                            <input
                              type="checkbox"
                              checked={!!on[s.companyId]}
                              onChange={() => apply({ ...on, [s.companyId]: !on[s.companyId] })}
                              className="h-5 w-5 shrink-0 accent-[rgb(var(--brand-600))]"
                            />
                          </label>
                        </li>
                      ))}
                      {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-500">No store matches “{query}”.</li>}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-3 px-1 text-xs text-ink-500">
              Each store only sees whether you said yes to it. New stores you join will ask you first.
            </p>
          </>
        )}
      </section>

      <AnimatePresence>
        {(saved || error) && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-x-0 bottom-24 z-30 mx-auto w-fit rounded-full px-4 py-2 text-sm font-bold shadow-lg ${
              error ? "bg-rose-50 text-rose-700" : "bg-ink-900 text-ink-50"
            }`}
          >
            {error ?? "Saved"}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Switch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full p-0 transition-colors ${on ? "bg-brand-600" : "bg-ink-200"}`}
    >
      <span className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-on shadow-sm transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
