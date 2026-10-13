"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Banner, PickupOutlet } from "@/lib/guest-order";
import { STORES_EVENT } from "./StorePicker";

// Owner banners and offers from BizPos: swipe (native scroll-snap), auto-
// advance every 5s unless touched or the person prefers reduced motion.
export default function BannerCarousel({
  banners,
  branches,
  pickupOpen,
}: {
  banners: Banner[];
  branches: PickupOutlet[];
  pickupOpen: boolean;
}) {
  const router = useRouter();
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
    if (b.action !== "order") return;
    const branch = b.outlet_id ? branches.find((x) => x.id === b.outlet_id) : null;
    if (branch?.pickup && pickupOpen && branch.open_now !== false) return router.push(`/order/p/${branch.id}`);
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
            {b.action === "order" && (
              <button type="button" onClick={() => open(b)} className="absolute inset-0" aria-label={`${b.title}. Order now`} />
            )}
            {endsSoon(b.ends_on) && (
              <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-2xs font-bold text-on backdrop-blur-sm">
                Ends {endsSoon(b.ends_on)}
              </span>
            )}
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
