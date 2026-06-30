import type { ConnectionStatus } from "@/types";
import { cn } from "@/lib/cn";

const LABELS: Record<ConnectionStatus, string> = {
  disconnected: "Offline",
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
};

const DOT: Record<ConnectionStatus, string> = {
  disconnected: "bg-red-500",
  connecting: "bg-amber-400 animate-pulse",
  connected: "bg-emerald-400",
  reconnecting: "bg-amber-400 animate-pulse",
};

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-night-800/80 px-3 py-1 text-sm font-medium ring-1 ring-white/10">
      <span className={cn("h-2.5 w-2.5 rounded-full", DOT[status])} />
      {LABELS[status]}
    </span>
  );
}
