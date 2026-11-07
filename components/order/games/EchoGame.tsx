"use client";

import { useEffect, useRef, useState } from "react";
import { Arena, Overlay, buzz, type GameProps } from "./shared";

const PADS = ["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400"];
const NAMES = ["Red", "Yellow", "Green", "Blue"];
const rand = () => Math.floor(Math.random() * 4);

// Echo: watch the pads light up, then repeat the pattern. Score = rounds you got right.
export default function EchoGame({ board, onEnd }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "show" | "input" | "over">("ready");
  const [lit, setLit] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const seq = useRef<number[]>([]);
  const pos = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => void timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function play() {
    setPhase("show");
    pos.current = 0;
    const gap = Math.max(260, 520 - seq.current.length * 20);
    seq.current.forEach((p, i) => {
      later(() => setLit(p), 600 + i * gap);
      later(() => setLit(null), 600 + i * gap + gap * 0.6);
    });
    later(() => setPhase("input"), 600 + seq.current.length * gap);
  }

  function start() {
    seq.current = [rand()];
    setScore(0);
    play();
  }

  function tap(p: number) {
    if (phase !== "input") return;
    setLit(p);
    later(() => setLit(null), 150);
    if (p !== seq.current[pos.current]) {
      setPhase("over");
      buzz([40, 40, 80]);
      return onEnd(score);
    }
    buzz(8);
    if (++pos.current < seq.current.length) return;
    setScore(seq.current.length);
    setPhase("show"); // block taps while the next round is queued
    seq.current = [...seq.current, rand()];
    later(play, 700);
  }

  return (
    <Arena>
      <p className="absolute inset-x-0 top-5 text-center text-5xl font-bold tabular-nums text-ink-900" aria-live="polite">{score}</p>
      <p className="absolute inset-x-0 top-[5.5rem] text-center text-sm font-semibold text-ink-500">
        {phase === "show" ? "Watch…" : phase === "input" ? "Your turn" : ""}
      </p>
      <div className="absolute inset-x-5 bottom-5 top-28 grid grid-cols-2 gap-3">
        {PADS.map((c, i) => (
          <button
            key={i}
            type="button"
            aria-label={NAMES[i]}
            onPointerDown={(e) => { e.preventDefault(); tap(i); }}
            className={`rounded-2xl transition-opacity duration-100 ${c} ${lit === i ? "opacity-100 ring-4 ring-ink-900/20" : "opacity-35"}`}
          />
        ))}
      </div>
      {(phase === "ready" || phase === "over") && (
        <Overlay over={phase === "over"} score={score} board={board} title="Echo" hint="Repeat the pattern. It grows by one every round." onStart={start} />
      )}
    </Arena>
  );
}
