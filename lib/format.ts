/** Format a number for display (Indian numbering system) */
export function formatNumber(value: number, unit?: string): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "ratio") return value.toFixed(2);
  if (unit === "index") return value.toFixed(1);

  // Indian numbering: lakhs and crores
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return value.toLocaleString("en-IN");
  return value.toFixed(abs < 10 ? 1 : 0);
}

/** Format a score (0-100) for display */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

/** Format year/period */
export function formatPeriod(year: number, period?: string): string {
  if (period) return period;
  return `${year}-${(year + 1).toString().slice(-2)}`;
}
