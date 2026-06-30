import type { BetType } from "@/types";
import { colorForNumber } from "@/lib/roulette";
import { cn } from "@/lib/cn";

interface RouletteBoardProps {
  onPlace: (betType: BetType, target: number | string) => void;
  disabled?: boolean;
}

const COLOR_CLASS: Record<string, string> = {
  red: "bg-red-700/90 hover:bg-red-600",
  black: "bg-night-900 hover:bg-night-700",
  green: "bg-felt-700 hover:bg-felt-800",
};

// Standard roulette layout: 3 rows, columns ascending left-to-right.
const ROWS: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

export function RouletteBoard({ onPlace, disabled }: RouletteBoardProps) {
  const cellBtn =
    "rounded-md text-white font-semibold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ring-1 ring-white/10";

  return (
    <div className="select-none">
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPlace("number", 0)}
          className={cn(cellBtn, COLOR_CLASS.green, "w-12 text-lg")}
        >
          0
        </button>

        <div className="grid flex-1 grid-rows-3 gap-1.5">
          {ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-1.5">
              {row.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPlace("number", n)}
                  className={cn(
                    cellBtn,
                    COLOR_CLASS[colorForNumber(n)],
                    "aspect-square text-base",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => onPlace("dozen", d)}
            className={cn(cellBtn, "bg-felt-800 hover:bg-felt-700 py-2 text-sm")}
          >
            {d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"}
          </button>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPlace("parity", "even")}
          className={cn(cellBtn, "bg-felt-800 hover:bg-felt-700 py-2 text-sm")}
        >
          Even
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPlace("color", "red")}
          className={cn(cellBtn, COLOR_CLASS.red, "py-2 text-sm")}
        >
          Red
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPlace("color", "black")}
          className={cn(cellBtn, COLOR_CLASS.black, "py-2 text-sm")}
        >
          Black
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPlace("parity", "odd")}
          className={cn(cellBtn, "bg-felt-800 hover:bg-felt-700 py-2 text-sm")}
        >
          Odd
        </button>
      </div>
    </div>
  );
}
