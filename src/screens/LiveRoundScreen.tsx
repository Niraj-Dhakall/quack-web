import { useGame } from "@/state/GameProvider";
import { ChipCount } from "@/components/ChipCount";
import { StatusBadge } from "@/components/StatusBadge";

export function LiveRoundScreen() {
  const { state } = useGame();
  const player = state.player;
  if (!player) return null;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center gap-8 p-6">
      <header className="flex w-full items-center justify-between">
        <p className="text-lg font-bold">{player.displayName}</p>
        <div className="flex items-center gap-3">
          <ChipCount chips={player.chips} />
          <StatusBadge status={state.status} />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative grid h-56 w-56 place-items-center">
          <div className="absolute inset-0 animate-spin rounded-full border-8 border-felt-700 border-t-duck [animation-duration:1.2s]" />
          <div className="grid h-40 w-40 place-items-center rounded-full bg-night-800 text-center ring-1 ring-white/10">
            <div>
              <div className="text-4xl">🎡</div>
              <p className="mt-1 text-sm font-semibold text-white/70">
                Spinning…
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/60">
          The wheel is in motion. No more bets.
        </p>
      </div>

      
    </div>
  );
}
