"use client";

import { useEffect, useRef, useState } from "react";
import { Arena, Overlay, buzz, type GameProps } from "./shared";

const FACES = ["☕", "🍜", "🍞", "🥟", "🍤", "🍧", "🥥", "🍛"];

// Seeded shuffle (mulberry32): a table's first deck in any 10 minutes is the same on every phone.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function deal(rand: () => number) {
  const d = [...FACES, ...FACES];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Match: find the 8 pairs in as few turns as you can. Score = 60 minus your turns,
// so fewer turns scores higher. Alone it's you against your best; at a table everyone's
// first deck is the same, so the "At your table" board is a fair race.
export default function MatchGame({ board, onEnd, seed }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [cards, setCards] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]); // face up, not matched yet
  const [done, setDone] = useState<number[]>([]); // matched
  const [turns, setTurns] = useState(0);
  const [score, setScore] = useState(0);
  const first = useRef(true);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function start() {
    // Replays reshuffle so you can't just remember the deck.
    setCards(deal(first.current && seed ? seeded(`${seed}:${Math.floor(Date.now() / 600_000)}`) : Math.random));
    first.current = false;
    setOpen([]);
    setDone([]);
    setTurns(0);
    setPhase("play");
  }

  function flip(i: number) {
    if (phase !== "play" || open.length === 2 || open.includes(i) || done.includes(i)) return;
    buzz(8);
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const t = turns + 1;
    setTurns(t);
    if (cards[next[0]] !== cards[next[1]]) {
      timer.current = window.setTimeout(() => setOpen([]), 700);
      return;
    }
    const d = [...done, ...next];
    setDone(d);
    setOpen([]);
    if (d.length === cards.length) {
      const s = Math.max(1, 60 - t);
      setScore(s);
      setPhase("over");
      buzz([30, 40, 60]);
      onEnd(s);
    }
  }

  return (
    <Arena>
      <p className="absolute inset-x-0 top-4 text-center text-sm font-semibold text-ink-500" aria-live="polite">
        Turns <span className="tabular-nums text-ink-900">{turns}</span> · Pairs <span className="tabular-nums text-ink-900">{done.length / 2}/8</span>
      </p>
      <div className="absolute inset-x-4 bottom-4 top-12 grid grid-cols-4 grid-rows-4 gap-2">
        {cards.map((f, i) => {
          const matched = done.includes(i);
          const up = matched || open.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-label={up ? f : "Hidden card"}
              onClick={() => flip(i)}
              className={`flex items-center justify-center rounded-xl text-3xl transition active:scale-95 ${
                matched ? "bg-brand-50" : up ? "bg-white ring-2 ring-brand-600" : "bg-brand-600"
              }`}
            >
              {up ? f : ""}
            </button>
          );
        })}
      </div>
      {phase !== "play" && (
        <Overlay over={phase === "over"} score={score} board={board} title="Match" hint="Find all 8 pairs in as few turns as you can." onStart={start} />
      )}
    </Arena>
  );
}
