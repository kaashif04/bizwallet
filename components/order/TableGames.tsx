"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guestLabel, loadContact, type GameBoard } from "@/lib/guest-order";
import StackGame from "./StackGame";
import EchoGame from "./games/EchoGame";
import MatchGame from "./games/MatchGame";
import { Avatar } from "@/components/Mascot";

const GAMES = {
  stack: { name: "Stack", Game: StackGame, unit: "blocks" },
  echo: { name: "Echo", Game: EchoGame, unit: "rounds" },
  match: { name: "Match", Game: MatchGame, unit: "points" },
};
type Id = keyof typeof GAMES;

// Games to play while the food comes. One daily board of tables per game (guest_game_board / guest_game_submit).
export default function TableGames({ token }: { token: string }) {
  const [supabase] = useState(() => createClient());
  const [id, setId] = useState<Id>("stack");
  const [board, setBoard] = useState<GameBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = useRef(id);
  current.current = id;
  // The name this phone plays under: same as its orders (member's first name, the
  // name typed at checkout, else "Guest 4F2A"). The server uses a member's own name.
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from("members")
      .select("full_name")
      .maybeSingle()
      .then(({ data }) =>
        setMe(
          data?.full_name?.trim().split(/\s+/)[0] ||
            // as the server keeps it: spaces collapsed, 20 characters
            loadContact()?.name?.trim().replace(/\s+/g, " ").slice(0, 20) ||
            guestLabel()
        )
      );
  }, [supabase]);

  useEffect(() => {
    setBoard(null);
    setError(null);
    supabase.rpc("guest_game_board", { p_token: token, p_game: id }).then(({ data, error }) => {
      if (current.current !== id) return;
      if (error) setError(error.message);
      else setBoard(data as GameBoard);
    });
  }, [supabase, token, id]);

  async function submit(score: number) {
    if (score < 1) return;
    const game = id;
    const { data, error } = await supabase.rpc("guest_game_submit", { p_token: token, p_game: game, p_score: score, p_player: me });
    if (current.current !== game) return;
    if (error) setError(error.message);
    else setBoard(data as GameBoard);
  }

  const { name, Game, unit } = GAMES[id];
  return (
    <main className="min-h-dvh bg-ink-50">
      <div className="mx-auto max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex h-11 items-center gap-3">
          <h1 className="flex-1 text-xl font-semibold tracking-[-0.02em] text-ink-900">{name}</h1>
          <span className="text-sm text-ink-500">
            {board?.table ? `Table ${board.table}` : ""}
            {board?.best ? ` · best ${board.best}` : ""}
          </span>
        </div>

        <div role="tablist" aria-label="Games" className="mt-3 grid grid-cols-3 gap-2">
          {(Object.keys(GAMES) as Id[]).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={g === id}
              onClick={() => setId(g)}
              className={`flex flex-col items-center gap-1 rounded-2xl bg-white p-2 transition active:scale-95 ${g === id ? "ring-2 ring-brand-600" : ""}`}
            >
              <img src={`/games/${g}.png`} alt="" className="h-14 w-full object-contain" />
              <span className={`text-xs font-semibold ${g === id ? "text-brand-700" : "text-ink-700"}`}>{GAMES[g].name}</span>
            </button>
          ))}
        </div>

        <Game key={id} board={board} onEnd={submit} seed={token} />
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">At your table · {name}</h2>
          <ol className="divide-y divide-ink-100 rounded-2xl bg-white">
            {board && !board.players?.length && (
              <li className="px-4 py-3.5 text-sm text-ink-500">Nobody at your table has played yet. Everyone with the table QR can join in.</li>
            )}
            {board?.players?.map((p, i) => (
              <li key={p.name} className={`flex items-center gap-3 px-4 py-3 text-sm ${p.name === me ? "bg-brand-50 font-bold" : ""}`}>
                <span className="w-6 tabular-nums text-ink-500">{i + 1}</span>
                <Avatar name={p.name} />
                <span className="flex-1 truncate text-ink-900">
                  {p.name}
                  {p.name === me ? " (you)" : ""}
                </span>
                <span className="tabular-nums text-ink-900">{p.score} <span className="text-xs font-normal text-ink-500">{unit}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-500">Today&apos;s top tables · {name}</h2>
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
                <span className="tabular-nums text-ink-900">{r.score} <span className="text-xs font-normal text-ink-500">{unit}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-2 px-1 text-xs text-ink-500">Each table&apos;s best score. Starts fresh every day.</p>
        </section>
      </div>
    </main>
  );
}
