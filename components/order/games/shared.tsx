"use client";

import type { ReactNode } from "react";
import type { GameBoard } from "@/lib/guest-order";
import { Mascot } from "@/components/Mascot";

export type GameProps = { board: GameBoard | null; onEnd: (score: number) => void; seed?: string };

export const rankLine = (score: number, board: GameBoard | null) =>
  score < 1
    ? "No score this time. Try again!"
    : board?.rank
      ? `Table ${board.table} is #${board.rank} of ${board.tables} today`
      : "Saving…";

export const buzz = (p: number | number[]) => navigator.vibrate?.(p);

// The white play area every game draws in.
export function Arena({ children, pan }: { children: ReactNode; pan?: boolean }) {
  return <div className={`relative mt-4 h-[min(52dvh,30rem)] ${pan ? "touch-pan-y" : "touch-none"} select-none overflow-hidden rounded-3xl bg-white`}>{children}</div>;
}

// Ready / game-over card laid over the arena.
export function Overlay({
  over, score, board, title, hint, onStart,
}: { over: boolean; score: number; board: GameBoard | null; title: string; hint: string; onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink-50/80 px-8 text-center backdrop-blur-[2px]">
      {over ? (
        <>
          {score >= 1 && board?.rank === 1 && <Mascot pose="trophy" className="mb-1 h-24 w-24" />}
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500">Game over</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-ink-900">{score}</p>
          <p className="mt-1 text-sm text-ink-600">{rankLine(score, board)}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-ink-900">{title}</p>
          <p className="mt-1 text-sm text-ink-600">{hint}</p>
        </>
      )}
      <button
        type="button"
        onClick={onStart}
        className="mt-5 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-on shadow-sm transition active:scale-95"
      >
        {over ? "Play again" : "Start"}
      </button>
    </div>
  );
}
