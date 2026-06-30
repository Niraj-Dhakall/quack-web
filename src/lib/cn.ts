/** Tiny classnames joiner (no external dep needed for a scaffold). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
