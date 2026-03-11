import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Table interaction helpers for E2E tests.
 *
 * Works with the project's DataTable component and standard HTML tables.
 * Handles Russian number formatting ("1 234 567,89") via parseRussianNumber.
 */

/**
 * Parse an HTML table into an array of objects.
 * Uses <thead> column headers as keys.
 *
 * @param page - Playwright Page
 * @param tableLocator - Optional specific table locator (defaults to first <table>)
 * @returns Array of row objects, keyed by column header text
 */
export async function getTableData(
  page: Page,
  tableLocator?: Locator,
): Promise<Record<string, string>[]> {
  const table = tableLocator ?? page.locator('table').first();
  await expect(table).toBeVisible({ timeout: 10_000 });

  // Get column headers
  const headers: string[] = [];
  const ths = table.locator('thead th');
  const thCount = await ths.count();
  for (let i = 0; i < thCount; i++) {
    const text = (await ths.nth(i).innerText()).trim();
    headers.push(text || `col_${i}`);
  }

  // Get data rows (skip section rows with colspan)
  const rows = table.locator('tbody tr').filter({
    hasNot: page.locator('td[colspan]'),
  });
  const rowCount = await rows.count();

  const data: Record<string, string>[] = [];
  for (let r = 0; r < rowCount; r++) {
    const cells = rows.nth(r).locator('td');
    const cellCount = await cells.count();
    const row: Record<string, string> = {};

    for (let c = 0; c < Math.min(cellCount, headers.length); c++) {
      row[headers[c]] = (await cells.nth(c).innerText()).trim();
    }

    data.push(row);
  }

  return data;
}

/**
 * Get all values from a specific column by header name.
 *
 * @param page - Playwright Page
 * @param columnName - The column header text to match
 * @param tableLocator - Optional specific table locator
 */
export async function getColumnValues(
  page: Page,
  columnName: string,
  tableLocator?: Locator,
): Promise<string[]> {
  const table = tableLocator ?? page.locator('table').first();
  await expect(table).toBeVisible({ timeout: 10_000 });

  // Find column index
  const ths = table.locator('thead th');
  const thCount = await ths.count();
  let colIndex = -1;

  for (let i = 0; i < thCount; i++) {
    const text = (await ths.nth(i).innerText()).trim();
    if (text === columnName || text.includes(columnName)) {
      colIndex = i;
      break;
    }
  }

  if (colIndex === -1) {
    throw new Error(
      `Column "${columnName}" not found in table headers`,
    );
  }

  // Get values from data rows (skip section rows)
  const rows = table.locator('tbody tr').filter({
    hasNot: page.locator('td[colspan]'),
  });
  const rowCount = await rows.count();

  const values: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    const cell = rows.nth(r).locator('td').nth(colIndex);
    const text = (await cell.innerText()).trim();
    values.push(text);
  }

  return values;
}

/**
 * Get total row count including pagination info.
 *
 * Looks for pagination text patterns like:
 * - "Showing 1-10 of 25"
 * - "Всего: 25"
 * - "1 - 10 из 25"
 *
 * Falls back to counting visible <tbody tr> if no pagination text found.
 */
export async function getRowCount(
  page: Page,
  tableLocator?: Locator,
): Promise<number> {
  // Try to find pagination total
  const paginationText = page
    .locator('[data-testid="pagination"]')
    .or(page.locator('.pagination'))
    .or(page.getByText(/(?:of|из|Всего[:\s])\s*\d+/i));

  try {
    const text = await paginationText.first().innerText({ timeout: 3_000 });
    // Extract the total number from patterns like "of 25", "из 25", "Всего: 25"
    const match = text.match(/(?:of|из|Всего[:\s]*)\s*(\d[\d\s]*)/i);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ''), 10);
    }
  } catch {
    // No pagination text found
  }

  // Fallback: count visible tbody rows
  const table = tableLocator ?? page.locator('table').first();
  const rows = table.locator('tbody tr').filter({
    hasNot: page.locator('td[colspan]'),
  });
  return rows.count();
}

/**
 * Sort table by clicking a column header.
 *
 * @param page - Playwright Page
 * @param columnName - Header text of the column to sort
 * @param tableLocator - Optional specific table locator
 */
export async function sortByColumn(
  page: Page,
  columnName: string,
  tableLocator?: Locator,
): Promise<void> {
  const table = tableLocator ?? page.locator('table').first();
  const header = table
    .locator('thead th')
    .filter({ hasText: columnName })
    .first();

  await expect(header).toBeVisible({ timeout: 5_000 });
  await header.click();

  // Wait for table to re-render after sort
  await page.waitForTimeout(500);
}

/**
 * Verify that a column's numeric values sum to an expected total.
 *
 * Handles Russian number formatting (spaces as thousands separators,
 * comma as decimal separator).
 *
 * @param page - Playwright Page
 * @param columnName - Header text of the numeric column
 * @param expected - Expected sum
 * @param tolerance - Allowed difference (default 1, for rounding)
 * @param tableLocator - Optional specific table locator
 */
export async function verifySum(
  page: Page,
  columnName: string,
  expected: number,
  tolerance = 1,
  tableLocator?: Locator,
): Promise<void> {
  const values = await getColumnValues(page, columnName, tableLocator);

  let sum = 0;
  for (const val of values) {
    const num = parseRussianNumber(val);
    if (!isNaN(num)) {
      sum += num;
    }
  }

  const diff = Math.abs(sum - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Parse a Russian-formatted number string into a JavaScript number.
 * Handles: "1 234 567,89" → 1234567.89
 *          "1234.56" → 1234.56 (also handles standard format)
 *          "-1 234,56" → -1234.56
 */
function parseRussianNumber(text: string): number {
  if (!text || !text.trim()) return NaN;

  // Remove currency symbols and whitespace-like separators
  let cleaned = text
    .replace(/[₽$€]/g, '')
    .replace(/руб\.?/gi, '')
    .replace(/\s/g, '')   // Remove all whitespace (thin space, nbsp, regular space)
    .trim();

  // Handle Russian decimal comma: replace LAST comma with dot
  // But only if there's no dot already (avoid breaking "1,234.56")
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const lastCommaIdx = cleaned.lastIndexOf(',');
    cleaned =
      cleaned.substring(0, lastCommaIdx) +
      '.' +
      cleaned.substring(lastCommaIdx + 1);
  }

  // Remove any remaining commas (thousands separators in English format)
  cleaned = cleaned.replace(/,/g, '');

  return parseFloat(cleaned);
}
