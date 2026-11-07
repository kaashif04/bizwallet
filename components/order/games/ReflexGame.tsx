"use client";

import { useEffect, useRef, useState } from "react";
import { Arena, Overlay, buzz, type GameProps } from "./shared";

const ROUNDS = 5;

// Reflex: wait for green, then tap. 5 rounds, up to 100 points each (faster = more;
// tapping early scores 0 for the round). Score = total.
export default function ReflexGame({ board, onEnd }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "wait" | "go" | "between" | "over">("ready");
  const [results, setResults] = useState<{ points: number; label: string }[]>([]);
  const t0 = useRef(0);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const total = results.reduce((a, r) => a + r.points, 0);

  function next() {
    setPhase("wait");
    timer.current = window.setTimeout(() => {
      t0.current = performance.now();
      setPhase("go");
    }, 1200 + Math.random() * 2500);
  }

  function start() {
    setResults([]);
    next();
  }

  function record(points: number, label: string) {
    const r = [...results, { points, label }];
    setResults(r);
    buzz(points ? 10 : [30, 30, 30]);
    if (r.length < ROUNDS) {
      setPhase("between");
      timer.current = window.setTimeout(next, 1000);
    } else {
      setPhase("over");
      onEnd(r.reduce((a, x) => a + x.points, 0));
    }
  }

  function tap() {
    if (phase === "wait") {
      clearTimeout(timer.current);
      record(0, "Too soon!");
    } else if (phase === "go") {
      const ms = Math.round(performance.now() - t0.current);
      record(Math.max(0, 100 - Math.round(ms / 10)), `${ms} ms`);
    }
  }

  const last = results[results.length - 1];
  return (
    <Arena>
      <button
        type="button"
        aria-label={phase === "go" ? "Tap now" : "Wait for green"}
        onPointerDown={(e) => { e.preventDefault(); tap(); }}
        className={`absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-ink-900 ${
          phase === "go" ? "bg-emerald-400" : phase === "wait" ? "bg-rose-300" : "bg-white"
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">
          Round {Math.min(results.length + (phase === "between" || phase === "over" ? 0 : 1), ROUNDS)} of {ROUNDS}
        </span>
        <span className="mt-2 text-4xl font-bold">
          {phase === "wait" ? "Wait…" : phase === "go" ? "TAP!" : last?.label ?? ""}
        </span>
        <span className="mt-2 text-sm font-semibold tabular-nums">{total} points</span>
      </button>
      {(phase === "ready" || phase === "over") && (
        <Overlay over={phase === "over"} score={total} board={board} title="Reflex" hint="Tap the moment the screen turns green. Too early scores nothing." onStart={start} />
      )}
    </Arena>
  );
}
