"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { GameBoard } from "@/lib/guest-order";
import HomeButton from "./HomeButton";

type Block = { x: number; w: number }; // % of the field's width
const BASE: Block = { x: 20, w: 60 };
const ROW = 26; // px per block
const SHOWN = 9; // rows below the moving block before the stack scrolls
const speed = (n: number) => Math.min(0.12, 0.045 + n * 0.0025); // % per ms
const color = (i: number) => `hsl(${(350 + 40 * Math.sin(i / 3) + 360) % 360} 80% 62%)`;

// Stack: a block slides across; tap to drop it on the one below. Whatever hangs
// over is cut off, so it gets harder. Score = blocks stacked. Best per table
// goes on today's board for the restaurant.
export default function StackGame({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [stack, setStack] = useState<Block[]>([BASE]);
  const [x, setX] = useState(0);
  const [perfect, setPerfect] = useState(0); // bumps on each perfect drop, keys the pop
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stackRef = useRef<Block[]>([BASE]);
  const mover = useRef({ x: 0, w: BASE.w, dir: 1 });

  useEffect(() => {
    supabase.rpc("guest_game_board", { p_token: token }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setBoard(data as GameBoard);
    });
  }, [supabase, token]);

  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const m = mover.current;
      m.x += m.dir * speed(stackRef.current.length) * Math.min(50, now - last);
      last = now;
      if (m.x > 100 - m.w) (m.x = 100 - m.w), (m.dir = -1);
      else if (m.x < 0) (m.x = 0), (m.dir = 1);
      setX(m.x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function start() {
    stackRef.current = [BASE];
    setStack([BASE]);
    mover.current = { x: 0, w: BASE.w, dir: 1 };
    setX(0);
    setError(null);
    setPhase("playing");
  }

  const end = useCallback(
    async (score: number) => {
      setPhase("over");
      navigator.vibrate?.([40, 40, 80]);
      if (score < 1) return;
      const { data, error } = await supabase.rpc("guest_game_submit", { p_token: token, p_game: "stack", p_score: score });
      if (error) setError(error.message);
      else setBoard(data as GameBoard);
    },
    [supabase, token]
  );

  const drop = useCallback(() => {
    const s = stackRef.current;
    const top = s[s.length - 1];
    const m = mover.current;
    // Within a hair counts as perfect: no cut, so a steady hand keeps its width.
    const snap = Math.abs(m.x - top.x) < 1.2;
    const left = snap ? top.x : Math.max(m.x, top.x);
    const right = snap ? top.x + top.w : Math.min(m.x + m.w, top.x + top.w);
    if (right - left < 0.5) return end(s.length - 1);
    const next = [...s, { x: left, w: right - left }];
    stackRef.current = next;
    setStack(next);
    // Next block comes in from alternate sides.
    const fromLeft = next.length % 2 === 1;
    mover.current = { x: fromLeft ? 0 : 100 - (right - left), w: right - left, dir: fromLeft ? 1 : -1 };
    if (snap) setPerfect((p) => p + 1);
    navigator.vibrate?.(snap ? [15, 30, 15] : 10);
  }, [end]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      drop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, drop]);

  const score = stack.length - 1;
  const cam = Math.max(0, stack.length - SHOWN); // rows scrolled out of view
  const y = (i: number) => (i - cam) * ROW + 16;

  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <HomeButton href={`/order/t/${token}`} />
          <h1 className="flex-1 text-xl font-semibold tracking-[-0.02em] text-ink-900">Stack</h1>
          <span className="text-sm text-ink-500">
            {board?.table ? `Table ${board.table}` : ""}
            {board?.best ? ` · best ${board.best}` : ""}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label={phase === "playing" ? "Drop the block" : "Start the game"}
          onPointerDown={(e) => {
            e.preventDefault();
            if (phase === "playing") drop();
            else if (phase === "ready") start();
          }}
          className="relative mt-4 h-[min(60dvh,30rem)] touch-none select-none overflow-hidden rounded-3xl bg-white"
        >
          <p
            className="absolute inset-x-0 top-5 text-center text-5xl font-bold tabular-nums text-ink-900"
            aria-live="polite"
          >
            {score}
          </p>
          <AnimatePresence>
            {perfect > 0 && phase === "playing" && (
              <motion.p
                key={perfect}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-x-0 top-20 text-center text-sm font-bold text-brand-700"
              >
                Perfect!
              </motion.p>
            )}
          </AnimatePresence>

          {stack.map((b, i) =>
            i < cam - 1 ? null : (
              <div
                key={i}
                className={`absolute rounded-md transition-[bottom] duration-200 ${i ? "" : "bg-ink-200"}`}
                style={{ left: `${b.x}%`, width: `${b.w}%`, height: ROW - 2, bottom: y(i), background: i ? color(i) : undefined }}
              />
            )
          )}
          {phase === "playing" && (
            <div
              className="absolute rounded-md"
              style={{ left: `${x}%`, width: `${mover.current.w}%`, height: ROW - 2, bottom: y(stack.length), background: color(stack.length) }}
            />
          )}

          {phase !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-50/75 px-8 text-center backdrop-blur-[2px]">
              {phase === "ready" ? (
                <>
                  <p className="text-lg font-bold text-ink-900">Tap to drop each block</p>
                  <p className="mt-1 text-sm text-ink-600">Whatever hangs over is cut off. How high can your table go?</p>
                  <span className="mt-5 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-on shadow-sm">Tap to start</span>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">Game over</p>
                  <p className="mt-1 text-4xl font-bold tabular-nums text-ink-900">{score}</p>
                  <p className="mt-1 text-sm text-ink-600">
                    {score < 1
                      ? "Missed! Try again."
                      : board?.rank
                        ? `Table ${board.table} is #${board.rank} of ${board.tables} today`
                        : "Saving…"}
                  </p>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={start}
                    className="mt-5 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-on shadow-sm transition active:scale-95"
                  >
                    Play again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Today&apos;s top tables</h2>
          <ol className="divide-y divide-ink-100 rounded-2xl bg-white">
            {board && board.top.length === 0 && (
              <li className="px-4 py-3.5 text-sm text-ink-500">No scores yet today. Be the first table on the board.</li>
            )}
            {board?.top.map((r, i) => (
              <li
                key={r.table}
                className={`flex items-center gap-3 px-4 py-3 text-sm ${r.table === board.table ? "bg-brand-50 font-bold" : ""}`}
              >
                <span className="w-6 tabular-nums text-ink-500">{i + 1}</span>
                <span className="flex-1 text-ink-900">
                  Table {r.table}
                  {r.table === board.table ? " (you)" : ""}
                </span>
                <span className="tabular-nums text-ink-900">{r.score}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 px-1 text-xs text-ink-500">Each table&apos;s best score. Starts fresh every day.</p>
        </section>
      </div>
    </main>
  );
}
