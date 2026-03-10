// ---------------------------------------------------------------------------
// Monte Carlo Risk Analysis — Pure client-side simulation library
// Uses triangular distribution to model uncertainty in cost/duration items
// ---------------------------------------------------------------------------

export interface TriangularInput {
  name: string;
  min: number;
  most_likely: number;
  max: number;
}

export interface MonteCarloResult {
  iterations: number;
  mean: number;
  stdDev: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  histogram: Array<{ binStart: number; binEnd: number; count: number }>;
  confidenceInterval: [number, number]; // 90% CI  (P5..P95)
}

/**
 * Sample a single value from a triangular distribution.
 *   min  — optimistic estimate
 *   mode — most likely estimate
 *   max  — pessimistic estimate
 */
function sampleTriangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/**
 * Run a Monte Carlo simulation that sums triangular-distributed inputs
 * over `iterations` trials and returns descriptive statistics + histogram.
 */
export function runMonteCarloSimulation(
  inputs: TriangularInput[],
  iterations: number = 10_000,
): MonteCarloResult {
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let total = 0;
    for (const input of inputs) {
      total += sampleTriangular(input.min, input.most_likely, input.max);
    }
    results.push(total);
  }

  results.sort((a, b) => a - b);

  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const variance =
    results.reduce((a, b) => a + (b - mean) ** 2, 0) / results.length;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number) =>
    results[Math.min(Math.floor((p * results.length) / 100), results.length - 1)];

  // Build histogram (20 bins)
  const binCount = 20;
  const minVal = results[0];
  const maxVal = results[results.length - 1];
  const range = maxVal - minVal;
  const binWidth = range === 0 ? 1 : range / binCount;

  const histogram = Array.from({ length: binCount }, (_, i) => ({
    binStart: minVal + i * binWidth,
    binEnd: minVal + (i + 1) * binWidth,
    count: 0,
  }));

  for (const val of results) {
    const binIdx = Math.min(
      Math.floor((val - minVal) / binWidth),
      binCount - 1,
    );
    histogram[binIdx].count++;
  }

  return {
    iterations,
    mean,
    stdDev,
    p10: percentile(10),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    histogram,
    confidenceInterval: [percentile(5), percentile(95)],
  };
}
