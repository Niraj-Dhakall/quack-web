import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/cn";

export function Leaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-night-800/70 p-4 ring-1 ring-white/10">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">
        Leaderboard
      </h2>
      <ol className="flex flex-col gap-1">
        {entries.map((e, i) => (
          <li
            key={e.playerId}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
              e.playerId === highlightId ? "bg-duck/20" : "bg-night-900/50",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 text-white/40">{i + 1}.</span>
              <span className="font-medium">{e.displayName}</span>
            </span>
            <span className="font-bold tabular-nums text-duck">
              {e.chips.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
