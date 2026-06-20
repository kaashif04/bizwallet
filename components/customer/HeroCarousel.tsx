"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Promo } from "@/lib/dashboard-demo";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.4 }),
};

export default function HeroCarousel({ slides }: { slides: Promo[] }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const current = slides[index];

  function go(target: number, direction: number) {
    setState([(target + slides.length) % slides.length, direction]);
  }
  function paginate(d: number) {
    setState(([i]) => [(i + d + slides.length) % slides.length, d]);
  }

  useEffect(() => {
    const t = setInterval(() => paginate(1), 4500);
    return () => clearInterval(t);
  }, [index]);

  return (
    <div className="relative h-44 overflow-hidden rounded-3xl bg-slate-800 shadow-sm">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 32 },
            opacity: { duration: 0.25 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) paginate(1);
            else if (info.offset.x > 60) paginate(-1);
          }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.image}
            alt={current.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t ${current.accent} via-black/25 to-transparent`}
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
              Promo
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-white drop-shadow">
              {current.title}
            </h3>
            <p className="text-sm text-white/90">{current.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* dots */}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i, i > index ? 1 : -1)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
