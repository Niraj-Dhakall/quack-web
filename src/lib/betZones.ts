import type { BetType } from "@/types";

/**
 * Clickable / droppable bet regions overlaid on `public/Capture.PNG`.
 *
 * All rectangles are expressed as percentages of the board image so they scale
 * with it. The values were measured from the source PNG (954x1933) by decoding
 * the image and locating the gold grid lines — see `scripts/analyze_board.py`.
 */
export interface BetZone {
  id: string;
  label: string;
  betType: BetType;
  target: number | string;
  left: number;
  top: number;
  width: number;
  height: number;
}

// Vertical edges of the three number columns (% of width).
const COL_EDGES = [35.42, 51.04, 66.67, 81.25] as const;
// Number grid vertical geometry (% of height).
const ROW_TOP = 19.79;
const ROW_H = 6.076;
const rowEdge = (i: number) => ROW_TOP + i * ROW_H;

function build(): BetZone[] {
  const zones: BetZone[] = [];

  // Inside bets: numbers 1..36 (3 columns, 12 rows, ascending downward).
  for (let n = 1; n <= 36; n++) {
    const idx = n - 1;
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    zones.push({
      id: `num-${n}`,
      label: String(n),
      betType: "number",
      target: n,
      left: COL_EDGES[col],
      top: rowEdge(row),
      width: COL_EDGES[col + 1] - COL_EDGES[col],
      height: ROW_H,
    });
  }

  // 0 and 00 pentagons above the grid.
  const gridLeft = COL_EDGES[0];
  const gridRight = COL_EDGES[3];
  const half = (gridRight - gridLeft) / 2;
  const zeroTop = 11.46;
  zones.push({
    id: "num-0",
    label: "0",
    betType: "number",
    target: 0,
    left: gridLeft,
    top: zeroTop,
    width: half,
    height: ROW_TOP - zeroTop,
  });
  zones.push({
    id: "num-00",
    label: "00",
    betType: "number",
    target: "00",
    left: gridLeft + half,
    top: zeroTop,
    width: half,
    height: ROW_TOP - zeroTop,
  });

  // Dozen column (1st/2nd/3rd 12), each spanning 4 number rows.
  const dozLeft = 20.83;
  const dozW = COL_EDGES[0] - dozLeft;
  const dozens: Array<[number, string]> = [
    [1, "1st 12"],
    [2, "2nd 12"],
    [3, "3rd 12"],
  ];
  dozens.forEach(([target, label], i) => {
    zones.push({
      id: `dozen-${target}`,
      label,
      betType: "dozen",
      target,
      left: dozLeft,
      top: rowEdge(i * 4),
      width: dozW,
      height: rowEdge(i * 4 + 4) - rowEdge(i * 4),
    });
  });

  // Far-left outside bets, each spanning 2 number rows.
  const outLeft = 8.33;
  const outW = dozLeft - outLeft;
  const twoRows = ROW_H * 2;
  const outside: Array<{
    id: string;
    label: string;
    betType: BetType;
    target: string;
  }> = [
    { id: "range-low", label: "1 to 18", betType: "range", target: "low" },
    { id: "parity-even", label: "EVEN", betType: "parity", target: "even" },
    { id: "color-red", label: "RED", betType: "color", target: "red" },
    { id: "color-black", label: "BLACK", betType: "color", target: "black" },
    { id: "parity-odd", label: "ODD", betType: "parity", target: "odd" },
    { id: "range-high", label: "19 to 36", betType: "range", target: "high" },
  ];
  outside.forEach((o, i) => {
    zones.push({
      ...o,
      left: outLeft,
      top: rowEdge(i * 2),
      width: outW,
      height: twoRows,
    });
  });

  // "2 to 1" column bets along the bottom.
  const botTop = rowEdge(12);
  const botH = 6.5;
  for (let c = 0; c < 3; c++) {
    zones.push({
      id: `column-${c + 1}`,
      label: "2 to 1",
      betType: "column",
      target: c + 1,
      left: COL_EDGES[c],
      top: botTop,
      width: COL_EDGES[c + 1] - COL_EDGES[c],
      height: botH,
    });
  }

  return zones;
}

export const BET_ZONES: BetZone[] = build();

export const ZONE_BY_ID: Map<string, BetZone> = new Map(
  BET_ZONES.map((z) => [z.id, z]),
);

export function labelForBet(betType: BetType, target: number | string): string {
  switch (betType) {
    case "number":
      return `Number ${target}`;
    case "color":
      return target === "red" ? "Red" : "Black";
    case "parity":
      return target === "even" ? "Even" : "Odd";
    case "dozen":
      return target === 1 ? "1st 12" : target === 2 ? "2nd 12" : "3rd 12";
    case "column":
      return `Column ${target}`;
    case "range":
      return target === "low" ? "1 to 18" : "19 to 36";
  }
}
