/**
 * Scoring functions shared between pipeline and display.
 * Min-max normalization with outlier capping.
 */

/** Get percentile value from sorted array */
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

/** Cap outliers at 2nd and 98th percentile */
export function capOutliers(values: number[]): { capped: number[]; min: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const p2 = percentile(sorted, 2);
  const p98 = percentile(sorted, 98);
  const capped = values.map((v) => Math.max(p2, Math.min(p98, v)));
  return { capped, min: p2, max: p98 };
}

/** Normalize a single value to 0-100 scale */
export function normalize(
  value: number,
  min: number,
  max: number,
  polarity: "positive" | "negative"
): number {
  if (max === min) return 50; // All values identical
  const raw = (value - min) / (max - min);
  const score = polarity === "positive" ? raw : 1 - raw;
  return Math.round(score * 100 * 100) / 100; // 2 decimal places
}

/** Compute weighted average score */
export function weightedAverage(
  scores: { score: number; weight: number }[]
): number {
  if (scores.length === 0) return 0;
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}
