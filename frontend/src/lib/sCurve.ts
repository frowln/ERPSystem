// ---------------------------------------------------------------------------
// S-Curve Cash Flow — pure computation functions (no React / no side-effects)
// ---------------------------------------------------------------------------

export interface SCurveDataPoint {
  month: string;            // "2024-01", "2024-02", etc.
  planned: number;
  actual: number;
  cumulativePlanned: number;
  cumulativeActual: number;
}

export interface SCurveInput {
  startDate: string;        // ISO date, e.g. "2024-01-01"
  endDate: string;          // ISO date, e.g. "2025-12-31"
  totalBudget: number;
  monthlyPlanned: Record<string, number>; // month key -> amount
  monthlyActual: Record<string, number>;  // month key -> amount
}

/**
 * Compute S-Curve data points from input parameters.
 * Returns one point per calendar month between start and end (inclusive).
 */
export function computeSCurve(input: SCurveInput): SCurveDataPoint[] {
  const points: SCurveDataPoint[] = [];
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= limit) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const planned = input.monthlyPlanned[monthKey] ?? 0;
    const actual = input.monthlyActual[monthKey] ?? 0;

    cumulativePlanned += planned;
    cumulativeActual += actual;

    points.push({
      month: monthKey,
      planned,
      actual,
      cumulativePlanned,
      cumulativeActual,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return points;
}

/**
 * Generate a default S-curve (bell-shaped) distribution of a total budget
 * across the given number of months starting from `startDate`.
 *
 * Uses sin^1.5(pi*x) as the weighting function to approximate the typical
 * construction spending profile: slow ramp-up, peak in the middle, taper off.
 */
export function generatePlannedDistribution(
  startDate: string,
  months: number,
  totalBudget: number,
): Record<string, number> {
  if (months <= 0 || totalBudget <= 0) return {};
  if (months === 1) {
    const d = new Date(startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { [key]: totalBudget };
  }

  const weights: number[] = [];
  for (let i = 0; i < months; i++) {
    const x = i / (months - 1); // 0 → 1
    weights.push(Math.pow(Math.sin(Math.PI * x), 1.5));
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const result: Record<string, number> = {};
  const start = new Date(startDate);

  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result[key] = Math.round((weights[i] / totalWeight) * totalBudget);
  }

  return result;
}

/**
 * Generate demo "actual" spending that trails the planned distribution
 * with some random variance — useful for demo / preview purposes.
 */
export function generateActualDistribution(
  planned: Record<string, number>,
  completedMonths: number,
): Record<string, number> {
  const keys = Object.keys(planned).sort();
  const result: Record<string, number> = {};
  const count = Math.min(completedMonths, keys.length);

  for (let i = 0; i < count; i++) {
    const key = keys[i];
    const base = planned[key] ?? 0;
    // Variance: 85%–115% of planned
    const factor = 0.85 + Math.random() * 0.30;
    result[key] = Math.round(base * factor);
  }

  return result;
}
