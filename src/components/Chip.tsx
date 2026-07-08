import { cn } from "@/lib/cn";

export const CHIP_DENOMINATIONS = [1, 5, 25, 100, 500] as const;
export type Denomination = (typeof CHIP_DENOMINATIONS)[number];

interface ChipStyle {
  face: string;
  ring: string;
  text: string;
}

const CHIP_STYLES: Record<number, ChipStyle> = {
  1: { face: "bg-slate-100", ring: "border-slate-400", text: "text-slate-800" },
  5: { face: "bg-red-600", ring: "border-red-200", text: "text-white" },
  25: { face: "bg-emerald-600", ring: "border-emerald-200", text: "text-white" },
  100: { face: "bg-night-950", ring: "border-white/60", text: "text-white" },
  500: { face: "bg-purple-600", ring: "border-purple-200", text: "text-white" },
};

function nearestDenom(denom: number): number {
  let best = CHIP_DENOMINATIONS[0] as number;
  for (const d of CHIP_DENOMINATIONS) if (d <= denom) best = d;
  return best;
}

function formatAmount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

const SIZE = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
} as const;

export function Chip({
  denom,
  label,
  size = "md",
  className,
}: {
  denom: number;
  label?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const style = CHIP_STYLES[denom] ?? CHIP_STYLES[nearestDenom(denom)];
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full border-2 border-dashed font-black shadow-lg ring-2 ring-black/30",
        SIZE[size],
        style.face,
        style.ring,
        style.text,
        className,
      )}
    >
      {label ?? formatAmount(denom)}
    </div>
  );
}

/** A placed-bet chip stack shown on the board, labelled with its total. */
export function ChipStack({
  total,
  topDenom,
  count,
}: {
  total: number;
  topDenom: number;
  count: number;
}) {
  return (
    <div className="relative">
      {count > 1 && (
        <>
          <div className="absolute -top-1.5 left-0.5 h-11 w-11 rounded-full bg-black/40" />
          <div className="absolute -top-0.5 left-0 h-11 w-11 rounded-full bg-black/30" />
        </>
      )}
      <div className="relative">
        <Chip denom={topDenom} label={formatAmount(total)} />
        {count > 1 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-duck px-1 text-[9px] font-bold text-night-950">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
