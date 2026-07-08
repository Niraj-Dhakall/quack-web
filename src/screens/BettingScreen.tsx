import { useMemo, useState } from "react";
import { useGame } from "@/state/GameProvider";
import { RouletteTable, type ZoneStack } from "@/components/RouletteTable";
import { ChipCount } from "@/components/ChipCount";
import { StatusBadge } from "@/components/StatusBadge";
import { ZONE_BY_ID, labelForBet } from "@/lib/betZones";

interface Placement {
  id: string;
  zoneId: string;
  denom: number;
}

export function BettingScreen() {
  const { state, secondsLeft, placeBet } = useGame();
  const [placements, setPlacements] = useState<Placement[]>([]);

  const player = state.player;
  const bettingOpen = state.round.status === "betting";

  const staked = placements.reduce((sum, p) => sum + p.denom, 0);
  const available = (player?.chips ?? 0) - staked;

  // Aggregate placed chips per zone for board rendering + bet slip.
  const zoneStacks = useMemo(() => {
    const map = new Map<string, ZoneStack>();
    for (const p of placements) {
      const prev = map.get(p.zoneId);
      if (prev) {
        prev.total += p.denom;
        prev.count += 1;
        prev.topDenom = p.denom;
      } else {
        map.set(p.zoneId, { total: p.denom, count: 1, topDenom: p.denom });
      }
    }
    return map;
  }, [placements]);

  if (!player) return null;

  function place(zoneId: string, denom: number) {
    if (!bettingOpen || denom > available) return;
    setPlacements((p) => [...p, { id: crypto.randomUUID(), zoneId, denom }]);
  }

  function removeLast(zoneId: string) {
    setPlacements((p) => {
      for (let i = p.length - 1; i >= 0; i--) {
        if (p[i].zoneId === zoneId) return p.filter((_, idx) => idx !== i);
      }
      return p;
    });
  }

  function undo() {
    setPlacements((p) => p.slice(0, -1));
  }

  function clearAll() {
    setPlacements([]);
  }

  function confirm() {
    for (const [zoneId, stack] of zoneStacks) {
      const zone = ZONE_BY_ID.get(zoneId);
      if (!zone) continue;
      placeBet({
        betType: zone.betType,
        target: zone.target,
        amount: stack.total,
      });
    }
    clearAll();
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Everything sits in a compact bar on top; the table fills the rest. */}
      <header className="flex flex-wrap items-center gap-3 rounded-2xl bg-night-800/70 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <p className="text-base font-bold">{player.displayName}</p>
            <p className="text-xs text-white/50">Seat {player.seat}</p>
          </div>
          <ChipCount chips={available} />
          <StatusBadge status={state.status} />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-night-900/70 px-4 py-2">
          <span className="text-[10px] uppercase tracking-wide text-white/50">
            {bettingOpen ? "Closes in" : "Closed"}
          </span>
          <span
            className={
              "text-2xl font-black tabular-nums " +
              (secondsLeft <= 5 && bettingOpen ? "text-red-400" : "text-duck")
            }
          >
            {bettingOpen ? `${secondsLeft}s` : "—"}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {zoneStacks.size === 0 && state.bets.length === 0 ? (
            <span className="text-sm text-white/40">
              Drag chips onto the table to bet.
            </span>
          ) : (
            <>
              {state.bets.map((bet, i) => (
                <span
                  key={`confirmed-${i}`}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/30"
                >
                  ✓ {labelForBet(bet.betType, bet.target)} · ${bet.amount}
                </span>
              ))}
              {[...zoneStacks.entries()].map(([zoneId, stack]) => {
                const zone = ZONE_BY_ID.get(zoneId);
                if (!zone) return null;
                return (
                  <button
                    key={zoneId}
                    type="button"
                    onClick={() => removeLast(zoneId)}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-night-900/80 px-3 py-1 text-xs ring-1 ring-white/10 transition active:scale-[0.97]"
                  >
                    <span>
                      {labelForBet(zone.betType, zone.target)} · ${stack.total}
                    </span>
                    <span className="text-red-400">×</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={placements.length === 0}
            className="rounded-xl bg-night-700 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={placements.length === 0}
            className="rounded-xl bg-night-700 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 transition active:scale-[0.98] disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!bettingOpen || placements.length === 0}
            className="rounded-xl bg-emerald-500 px-5 py-2 text-base font-bold text-night-950 transition active:scale-[0.98] disabled:opacity-40"
          >
            Confirm ${staked.toLocaleString()}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <RouletteTable
          stacks={zoneStacks}
          onPlace={place}
          onRemoveLast={removeLast}
          disabled={!bettingOpen}
          available={available}
          rotate
        />
      </div>
    </div>
  );
}
