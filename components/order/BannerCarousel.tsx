"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import type { Banner, PickupOutlet } from "@/lib/guest-order";
import { STORES_EVENT } from "./StorePicker";

// Owner banners and offers from BizPos: swipe (native scroll-snap), auto-
// advance every 5s unless touched or the person prefers reduced motion.
export default function BannerCarousel({
  banners: initial,
  branches,
  pickupOpen,
  storesHref,
  outletId,
  browseOnly,
}: {
  banners: Banner[];
  branches: PickupOutlet[];
  pickupOpen: boolean;
  storesHref?: string; // no store list on this page: open it there instead
  outletId?: string; // only this outlet's banners (the menu)
  browseOnly?: boolean; // on the menu already: no "order" tap
}) {
  const router = useRouter();
  // Happy-hour banners come and go: re-read when the app returns to the
  // foreground, and when the earliest shown window ends.
  const [banners, setBanners] = useState(initial);
  useEffect(() => setBanners(initial), [initial]);
  const reload = useCallback(() => {
    createClient()
      .rpc("wallet_banners", outletId ? { p_outlet: outletId } : {})
      .then(({ data }) => Array.isArray(data) && setBanners(data as Banner[]));
  }, [outletId]);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onShow);
    const ends = banners.filter((b) => b.show_until).map((b) => minutesUntil(b.show_until!));
    const t = ends.length ? window.setTimeout(reload, Math.min(...ends) * 60_000 + 5_000) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.clearTimeout(t);
    };
  }, [banners, reload]);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pausedUntil = useRef(0);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (banners.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (Date.now() < pausedUntil.current || document.hidden) return;
      const el = track.current;
      if (!el) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      go((i + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [banners.length, go]);

  if (!banners.length) return null;

  const pause = () => (pausedUntil.current = Date.now() + 8000);
  const open = (b: Banner) => {
    if (b.action !== "order" || browseOnly) return;
    const branch = b.outlet_id ? branches.find((x) => x.id === b.outlet_id) : null;
    if (branch?.pickup && pickupOpen && branch.open_now !== false) return router.push(`/order/p/${branch.id}`);
    if (storesHref) {
      return router.push(`${storesHref}?${b.outlet_id ? `store=${b.outlet_id}` : `company=${b.company_id}`}`);
    }
    window.dispatchEvent(new CustomEvent(STORES_EVENT, { detail: { outletId: b.outlet_id, companyId: b.company_id } }));
  };

  return (
    <section aria-roledescription="carousel" aria-label="Offers">
      <div
        ref={track}
        onPointerDown={pause}
        onTouchStart={pause}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl shadow-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${banners.length}`}
            className="relative aspect-video w-full shrink-0 snap-center overflow-hidden bg-marple-card"
          >
            {b.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.image_url}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" />
            {b.action === "order" && !browseOnly && (
              <button type="button" onClick={() => open(b)} className="absolute inset-0" aria-label={`${b.title}. Order now`} />
            )}
            <span className="pointer-events-none absolute right-3 top-3 flex gap-1.5">
              {b.show_from && b.show_until && (
                <span className="rounded-full bg-[#FFE3B3] px-2.5 py-1 text-2xs font-bold text-[#7A2E12]">
                  {clock12(b.show_from)}–{clock12(b.show_until)}
                </span>
              )}
              {endsSoon(b.ends_on) && (
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-2xs font-bold text-on backdrop-blur-sm">
                  Ends {endsSoon(b.ends_on)}
                </span>
              )}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-on">
              {b.outlet && <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-on/80">{b.outlet}</p>}
              <p className="mt-0.5 text-xl font-bold leading-tight [text-wrap:balance]">{b.title}</p>
              {b.subtitle && <p className="mt-1 line-clamp-2 text-sm text-on/85">{b.subtitle}</p>}
              {b.promo_code && <PromoChip code={b.promo_code} />}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                pause();
                go(i);
              }}
              aria-label={`Show offer ${i + 1}`}
              aria-current={i === index}
              className="flex h-6 items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-brand-600" : "w-1.5 bg-ink-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function PromoChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked: the code is on screen to type.
        }
      }}
      className="pointer-events-auto relative mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-on/70 bg-white/15 px-3 text-xs font-bold tracking-wider text-on backdrop-blur-sm"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "copied" : "code"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? "Copied" : code}
        </motion.span>
      </AnimatePresence>
      {!copied && <span className="font-medium normal-case tracking-normal text-on/80">Tap to copy</span>}
    </button>
  );
}

// "15:00" -> "3pm", "18:30" -> "6:30pm".
export function clock12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

// Minutes from now (Malaysia time) until a daily "HH:MM", wrapping past midnight.
function minutesUntil(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date(Date.now() + 8 * 3_600_000); // Malaysia is UTC+8 all year
  const diff = (h * 60 + m - (now.getUTCHours() * 60 + now.getUTCMinutes()) + 1440) % 1440;
  return diff || 1440;
}

// "5 Apr" when the offer ends within a week, else null.
function endsSoon(endsOn: string | null): string | null {
  if (!endsOn) return null;
  const [y, m, d] = endsOn.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = (end.getTime() - today.getTime()) / 86_400_000;
  return days >= 0 && days <= 7 ? end.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) : null;
}
