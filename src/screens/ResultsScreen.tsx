import { useGame } from "@/state/GameProvider";
import { ChipCount } from "@/components/ChipCount";
import { StatusBadge } from "@/components/StatusBadge";
import { Leaderboard } from "@/components/Leaderboard";
import { colorForNumber } from "@/lib/roulette";
import { cn } from "@/lib/cn";

const COLOR_CLASS = {
  red: "bg-red-700",
  black: "bg-night-900",
  green: "bg-felt-700",
} as const;

export function ResultsScreen() {
  const { state } = useGame();
  const player = state.player;
  const winning = state.lastWinningNumber;
  if (!player || winning == null) return null;

  const net =
    state.chipsAtRoundStart != null
      ? player.chips - state.chipsAtRoundStart
      : 0;
  const won = net > 0;
  const color = colorForNumber(winning);

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center gap-8 p-6">
      <header className="flex w-full items-center justify-between">
        <p className="text-lg font-bold">{player.displayName}</p>
        <StatusBadge status={state.status} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-white/50">
            Winning Number
          </p>
          <div
            className={cn(
              "mx-auto mt-3 grid h-32 w-32 place-items-center rounded-full text-6xl font-black text-white ring-4 ring-white/20",
              COLOR_CLASS[color],
            )}
          >
            {winning}
          </div>
          <p className="mt-2 capitalize text-white/60">{color}</p>
        </div>

        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-white/50">
            This Round
          </p>
          <p
            className={cn(
              "text-4xl font-black tabular-nums",
              net === 0
                ? "text-white/70"
                : won
                  ? "text-emerald-400"
                  : "text-red-400",
            )}
          >
            {net > 0 ? "+" : ""}
            {net.toLocaleString()}
          </p>
        </div>

        <div className="text-center">
          <p className="mb-1 text-sm uppercase tracking-wide text-white/50">
            Chip Balance
          </p>
          <ChipCount chips={player.chips} className="text-xl" />
        </div>

        <Leaderboard entries={state.leaderboard} highlightId={player.id} />
      </div>

      <p className="text-white/50">Next round starting soon…</p>
    </div>
  );
}
