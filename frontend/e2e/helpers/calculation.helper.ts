import { expect } from '@playwright/test';

/**
 * Calculation helpers for verifying financial data in E2E tests.
 *
 * Construction ERP domain: all money is in RUB, VAT is always 20%,
 * margins should be 15-40% (healthy), numbers use Russian formatting.
 */

/**
 * Parse a Russian-formatted number: "1 234 567,89" -> 1234567.89
 *
 * Handles:
 * - Thin space / non-breaking space / regular space as thousands separator
 * - Comma as decimal separator
 * - Standard dot-decimal format as fallback
 * - Negative numbers: "-1 234,56"
 * - Numbers with percent suffix: "25,5%"
 */
export function parseRussianNumber(text: string): number {
  if (!text || typeof text !== 'string') return NaN;

  let cleaned = text.trim();

  // Remove percent sign
  cleaned = cleaned.replace(/%/g, '');

  // Remove all whitespace characters (regular, thin, non-breaking)
  cleaned = cleaned.replace(/[\s\u00A0\u2009\u202F]/g, '');

  // If comma is present and no dot — Russian format: comma = decimal
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    cleaned =
      cleaned.substring(0, lastComma) + '.' + cleaned.substring(lastComma + 1);
  }

  // Remove remaining commas (English thousands separators)
  cleaned = cleaned.replace(/,/g, '');

  return parseFloat(cleaned);
}

/**
 * Parse a currency string, stripping RUB symbols.
 * Handles: "₽ 1 234,56", "1 234,56 руб.", "1234.56 ₽"
 */
export function parseCurrency(text: string): number {
  if (!text || typeof text !== 'string') return NaN;

  // Strip currency symbols and words
  const stripped = text
    .replace(/[₽$€]/g, '')
    .replace(/руб\.?/gi, '')
    .replace(/RUB/gi, '')
    .trim();

  return parseRussianNumber(stripped);
}

/**
 * Assert that a list of values sums to the expected total.
 *
 * @param values - Array of numeric values
 * @param expected - Expected sum
 * @param tolerance - Allowed rounding difference (default 1 kopeck)
 */
export function assertSum(
  values: number[],
  expected: number,
  tolerance = 1,
): void {
  const actual = values.reduce((sum, v) => sum + v, 0);
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert that a VAT amount is exactly rate * base.
 *
 * Russian VAT (NDS) is always 20%. This is non-negotiable.
 * If the system shows 18% or anything else, it's a CRITICAL bug.
 *
 * @param base - Base amount (customerTotal or revenue)
 * @param vatAmount - The displayed VAT amount
 * @param rate - VAT rate (default 0.20 for Russia)
 */
export function assertVAT(
  base: number,
  vatAmount: number,
  rate = 0.20,
): void {
  const expectedVAT = base * rate;
  const diff = Math.abs(vatAmount - expectedVAT);
  // Allow 1 RUB tolerance for rounding
  expect(diff).toBeLessThanOrEqual(1);
}

/**
 * Assert margin percentage between revenue and cost.
 *
 * margin% = (revenue - cost) / revenue * 100
 *
 * Domain context:
 * - margin < 0%  -> RED: losing money
 * - margin 0-5%  -> YELLOW: barely breaking even
 * - margin 5-15% -> normal for materials
 * - margin 15-40% -> normal for works
 * - margin > 60% -> suspicious (check costPrice data)
 * - margin > 90% -> probably missing costPrice
 *
 * @param revenue - customerPrice or customerTotal
 * @param cost - costPrice or costTotal
 * @param expectedMarginPct - Expected margin percentage (e.g., 25 for 25%)
 * @param tolerance - Allowed difference in percentage points (default 0.01)
 */
export function assertMargin(
  revenue: number,
  cost: number,
  expectedMarginPct: number,
  tolerance = 0.01,
): void {
  if (revenue === 0) {
    throw new Error('Revenue is 0 — cannot compute margin');
  }

  const actualMarginPct = ((revenue - cost) / revenue) * 100;
  const diff = Math.abs(actualMarginPct - expectedMarginPct);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert that a part/whole ratio matches an expected percentage.
 *
 * percentage = (part / whole) * 100
 *
 * @param part - The partial amount
 * @param whole - The total amount
 * @param expectedPct - Expected percentage (e.g., 25 for 25%)
 * @param tolerance - Allowed difference in percentage points (default 0.01)
 */
export function assertPercentage(
  part: number,
  whole: number,
  expectedPct: number,
  tolerance = 0.01,
): void {
  if (whole === 0) {
    throw new Error('Whole is 0 — cannot compute percentage');
  }

  const actualPct = (part / whole) * 100;
  const diff = Math.abs(actualPct - expectedPct);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert CPI (Cost Performance Index) is within expected range.
 * CPI = earnedValue / actualCost
 *
 * CPI > 1.0 = under budget (good)
 * CPI = 1.0 = on budget
 * CPI < 1.0 = over budget
 * CPI < 0.8 = significantly over budget (RED FLAG)
 */
export function assertCPI(
  earnedValue: number,
  actualCost: number,
  expectedCPI: number,
  tolerance = 0.05,
): void {
  if (actualCost === 0) {
    throw new Error('Actual cost is 0 — cannot compute CPI');
  }

  const actualCPI = earnedValue / actualCost;
  const diff = Math.abs(actualCPI - expectedCPI);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert that customerPrice >= costPrice (we're making money).
 * This is a GOLDEN RULE from business-rules-construction-erp.md.
 */
export function assertProfitable(
  customerPrice: number,
  costPrice: number,
): void {
  expect(customerPrice).toBeGreaterThanOrEqual(costPrice);
}
