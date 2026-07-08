import { useRef, useState } from "react";
import { BET_ZONES, ZONE_BY_ID } from "@/lib/betZones";
import { Chip, ChipStack, CHIP_DENOMINATIONS } from "./Chip";
import { cn } from "@/lib/cn";

export interface ZoneStack {
  total: number;
  count: number;
  topDenom: number;
}

interface RouletteTableProps {
  stacks: Map<string, ZoneStack>;
  onPlace: (zoneId: string, denom: number) => void;
  onRemoveLast: (zoneId: string) => void;
  disabled?: boolean;
  available: number;
  /** Render the (portrait) board rotated 90° left to fill a landscape tablet. */
  rotate?: boolean;
}

interface DragState {
  denom: number;
  x: number;
  y: number;
}

function zoneAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  const zoneEl = el?.closest<HTMLElement>("[data-zone]");
  return zoneEl?.dataset.zone ?? null;
}

export function RouletteTable({
  stacks,
  onPlace,
  onRemoveLast,
  disabled,
  available,
  rotate = false,
}: RouletteTableProps) {
  const [selected, setSelected] = useState<number>(25);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const movedRef = useRef(false);

  function startDrag(denom: number, e: React.PointerEvent) {
    if (disabled) return;
    e.preventDefault();
    movedRef.current = false;
    const start = { x: e.clientX, y: e.clientY };
    setDrag({ denom, x: start.x, y: start.y });

    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
        movedRef.current = true;
      }
      setDrag({ denom, x: ev.clientX, y: ev.clientY });
      setHoverZone(zoneAt(ev.clientX, ev.clientY));
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const target = zoneAt(ev.clientX, ev.clientY);
      if (target && denom <= available) {
        onPlace(target, denom);
      } else if (!movedRef.current) {
        // Treat a tap without movement as selecting the active denomination.
        setSelected(denom);
      }
      setDrag(null);
      setHoverZone(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const board = (
    <>
      <img
        src="/Capture.PNG"
        alt="Monte Quacko roulette table"
        draggable={false}
        className="block w-full rounded-xl shadow-2xl ring-1 ring-black/40"
      />

      {BET_ZONES.map((z) => (
        <div
          key={z.id}
          data-zone={z.id}
          onClick={() => {
            if (!disabled && selected <= available) onPlace(z.id, selected);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onRemoveLast(z.id);
          }}
          className={cn(
            "absolute cursor-pointer rounded-sm transition",
            drag && "ring-1 ring-white/25",
            hoverZone === z.id && "bg-duck/25 ring-2 ring-duck",
            !drag && "hover:bg-white/10",
          )}
          style={{
            left: `${z.left}%`,
            top: `${z.top}%`,
            width: `${z.width}%`,
            height: `${z.height}%`,
          }}
        />
      ))}

      {[...stacks.entries()].map(([zoneId, stack]) => {
        const z = ZONE_BY_ID.get(zoneId);
        if (!z) return null;
        return (
          <button
            key={zoneId}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveLast(zoneId);
            }}
            title="Tap to remove a chip"
            className="absolute z-10"
            style={{
              left: `${z.left + z.width / 2}%`,
              top: `${z.top + z.height / 2}%`,
              // Counter-rotate placed chips so their totals stay upright.
              transform: `translate(-50%, -50%)${rotate ? " rotate(90deg)" : ""}`,
            }}
          >
            <ChipStack
              total={stack.total}
              topDenom={stack.topDenom}
              count={stack.count}
            />
          </button>
        );
      })}
    </>
  );

  return (
    <div className={cn("flex flex-col items-center gap-4", rotate && "h-full")}>
      {rotate ? (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div
            className="relative h-full max-w-full"
            style={{ aspectRatio: "1933 / 954" }}
          >
            <div
              className="absolute left-1/2 top-1/2 touch-none select-none"
              style={{
                // Width equals the outer box height; once rotated -90° the
                // portrait board fills the landscape frame exactly.
                width: "49.353%",
                transform: "translate(-50%, -50%) rotate(-90deg)",
                touchAction: "none",
              }}
            >
              {board}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative mx-auto w-full max-w-[440px] touch-none select-none"
          style={{ touchAction: "none" }}
        >
          {board}
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-white/40">
          Drag a chip onto the table — or tap a chip, then tap a spot
        </p>
        <div className="flex items-end justify-center gap-2">
          {CHIP_DENOMINATIONS.map((d) => {
            const tooRich = d > available;
            return (
              <button
                key={d}
                type="button"
                disabled={disabled || tooRich}
                onPointerDown={(e) => startDrag(d, e)}
                className={cn(
                  "touch-none rounded-full transition disabled:opacity-30",
                  selected === d &&
                    "-translate-y-1 ring-2 ring-duck ring-offset-2 ring-offset-night-950 rounded-full",
                )}
                style={{ touchAction: "none" }}
              >
                <Chip denom={d} size="lg" />
              </button>
            );
          })}
        </div>
      </div>

      {drag && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y }}
        >
          <Chip denom={drag.denom} size="lg" className="scale-110 opacity-90" />
        </div>
      )}
    </div>
  );
}
