import type { CSSProperties } from "react";

/**
 * Stagger offset for the entrance animations. Read as `--d` by `.wipe`,
 * `.rise` and the coverage bars.
 */
export function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

/** Clamp a 0–1 ratio to a CSS percentage. */
export function ratioToPct(ratio: number): string {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  return `${Math.min(100, Math.max(0, safe * 100))}%`;
}
