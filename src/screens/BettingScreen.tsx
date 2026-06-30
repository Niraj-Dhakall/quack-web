import { useState } from "react";
import { useGame } from "@/state/GameProvider";
import { RouletteBoard } from "@/components/RouletteBoard";
import { ChipCount } from "@/components/ChipCount";
import { StatusBadge } from "@/components/StatusBadge";
import type { BetType } from "@/types";

const DENOMINATIONS = [25, 50, 100, 500];

interface PendingBet {
  id: string;
  betType: BetType;
  target: number | string;
  amount: number;
}

function describe(bet: { betType: BetType; target: number | string }): string {
  switch (bet.betType) {
    case "number":
      return `Number ${bet.target}`;
    case "color":
      return `${String(bet.target)[0].toUpperCase()}${String(bet.target).slice(1)}`;
    case "parity":
      return String(bet.target) === "even" ? "Even" : "Odd";
    case "dozen":
      return `Dozen ${bet.target}`;
  }
}

export function BettingScreen() {
  const { state, secondsLeft, placeBet } = useGame();
  const [denom, setDenom] = useState(DENOMINATIONS[2]);
  const [pending, setPending] = useState<PendingBet[]>([]);

  const player = state.player;
  if (!player) return null;

  const pendingTotal = pending.reduce((sum, b) => sum + b.amount, 0);
  const available = player.chips - pendingTotal;
  const bettingOpen = state.round.status === "betting";

  function addBet(betType: BetType, target: number | string) {
    if (!bettingOpen || denom > available) return;
    setPending((p) => [
      ...p,
      { id: crypto.randomUUID(), betType, target, amount: denom },
    ]);
  }

  function removeBet(id: string) {
    setPending((p) => p.filter((b) => b.id !== id));
  }

  function confirm() {
    for (const bet of pending) {
      placeBet({ betType: bet.betType, target: bet.target, amount: bet.amount });
    }
    setPending([]);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">{player.displayName}</p>
          <p className="text-xs text-white/50">Seat {player.seat}</p>
        </div>
        <div className="flex items-center gap-3">
          <ChipCount chips={available} />
          <StatusBadge status={state.status} />
        </div>
      </header>

      <div className="flex items-center justify-between rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
        <span className="text-sm uppercase tracking-wide text-white/50">
          {bettingOpen ? "Betting closes in" : "Betting closed"}
        </span>
        <span
          className={
            "text-3xl font-black tabular-nums " +
            (secondsLeft <= 5 && bettingOpen ? "text-red-400" : "text-duck")
          }
        >
          {bettingOpen ? `${secondsLeft}s` : "—"}
        </span>
      </div>

      <RouletteBoard onPlace={addBet} disabled={!bettingOpen} />

      <div className="flex flex-wrap gap-2">
        {DENOMINATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDenom(d)}
            className={
              "rounded-full px-4 py-2 text-sm font-bold ring-1 transition " +
              (denom === d
                ? "bg-duck text-night-950 ring-duck"
                : "bg-night-800 text-white/80 ring-white/10")
            }
          >
            ${d}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Bet Slip
          </h2>
          <span className="text-sm text-white/50">
            Staked ${pendingTotal.toLocaleString()}
          </span>
        </div>

        {pending.length === 0 && state.bets.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">
            Tap the board to add a bet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.bets.map((bet, i) => (
              <li
                key={`confirmed-${i}`}
                className="flex items-center justify-between rounded-lg bg-night-900/60 px-3 py-2 text-sm"
              >
                <span className="text-emerald-400">
                  ✓ {describe(bet)} · ${bet.amount}
                </span>
                <span className="text-xs text-white/40">confirmed</span>
              </li>
            ))}
            {pending.map((bet) => (
              <li
                key={bet.id}
                className="flex items-center justify-between rounded-lg bg-night-900/60 px-3 py-2 text-sm"
              >
                <span>
                  {describe(bet)} · ${bet.amount}
                </span>
                <button
                  type="button"
                  onClick={() => removeBet(bet.id)}
                  className="rounded-md bg-red-700/70 px-2 py-1 text-xs font-semibold hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={!bettingOpen || pending.length === 0}
          className="mt-3 w-full rounded-xl bg-emerald-500 py-3 text-lg font-bold text-night-950 transition active:scale-[0.98] disabled:opacity-40"
        >
          Confirm {pending.length > 0 ? `(${pending.length})` : ""}
        </button>
      </div>
    </div>
  );
}
