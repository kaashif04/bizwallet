"use client";

import { useEffect, useRef, useState } from "react";
import { Arena, Overlay, buzz, type GameProps } from "./shared";

const TOTAL = 20_000;

// Whack: tap the lit tile before it goes. 20 seconds, faster as you score. Score = hits.
export default function WhackGame({ board, onEnd }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [mole, setMole] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(TOTAL);
  const hitsRef = useRef(0);
  const moleRef = useRef<number | null>(null);
  const timer = useRef<{ hide?: number; next?: number }>({});
  const pop = useRef<() => void>(() => {});

  useEffect(() => {
    if (phase !== "playing") return;
    const t = timer.current;
    const endAt = Date.now() + TOTAL;
    let last = -1;
    const show = (cell: number | null) => ((moleRef.current = cell), setMole(cell));
    pop.current = () => {
      let c = Math.floor(Math.random() * 9);
      if (c === last) c = (c + 1 + Math.floor(Math.random() * 8)) % 9;
      last = c;
      show(c);
      t.hide = window.setTimeout(() => {
        show(null);
        t.next = window.setTimeout(pop.current, 150);
      }, Math.max(450, 900 - hitsRef.current * 15));
    };
    pop.current();
    const tick = window.setInterval(() => {
      const l = endAt - Date.now();
      if (l > 0) return setLeft(l);
      clearInterval(tick);
      clearTimeout(t.hide);
      clearTimeout(t.next);
      show(null);
      setLeft(0);
      setPhase("over");
      buzz([40, 40, 80]);
      onEnd(hitsRef.current);
    }, 100);
    return () => {
      clearInterval(tick);
      clearTimeout(t.hide);
      clearTimeout(t.next);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function start() {
    hitsRef.current = 0;
    setHits(0);
    setLeft(TOTAL);
    setPhase("playing");
  }

  function hit(i: number) {
    if (phase !== "playing" || moleRef.current !== i) return;
    const t = timer.current;
    clearTimeout(t.hide);
    moleRef.current = null;
    setMole(null);
    setHits((hitsRef.current += 1));
    buzz(10);
    t.next = window.setTimeout(pop.current, 100);
  }

  return (
    <Arena>
      <div className="absolute inset-x-5 top-5 flex items-baseline justify-between">
        <p className="text-5xl font-bold tabular-nums text-ink-900" aria-live="polite">{hits}</p>
        <p className="text-sm font-semibold tabular-nums text-ink-500">{Math.ceil(left / 1000)}s</p>
      </div>
      <div className="absolute inset-x-5 bottom-5 top-24 grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={mole === i ? "Tap!" : "Empty"}
            onPointerDown={(e) => { e.preventDefault(); hit(i); }}
            className={`rounded-2xl transition-colors duration-75 ${mole === i ? "bg-brand-600" : "bg-ink-100"}`}
          />
        ))}
      </div>
      {phase !== "playing" && (
        <Overlay over={phase === "over"} score={hits} board={board} title="Whack" hint="Tap each tile the moment it lights up. 20 seconds." onStart={start} />
      )}
    </Arena>
  );
}
