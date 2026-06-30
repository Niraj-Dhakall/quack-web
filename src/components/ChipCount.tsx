import { cn } from "@/lib/cn";

export function ChipCount({
  chips,
  className,
}: {
  chips: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl bg-night-800/80 px-4 py-2 ring-1 ring-white/10",
        className,
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-duck text-night-950 text-sm font-black shadow-inner">
        $
      </span>
      <span className="text-2xl font-bold tabular-nums text-duck">
        {chips.toLocaleString()}
      </span>
    </div>
  );
}
