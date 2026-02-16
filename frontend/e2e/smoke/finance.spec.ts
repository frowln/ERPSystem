import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Finance and Cost Management pages.
 * Verifies that cost codes, budget overview, and commitments pages load correctly.
 */
test.describe('Finance smoke tests', () => {

  // =========================================================================
  // Cost Codes
  // =========================================================================

  test('cost codes page loads', async ({ page }) => {
    await page.goto('/cost-management/codes');
    await expect(page).toHaveURL('/cost-management/codes');
    await expect(page.locator('body')).toContainText(/(cost|код|затрат|code)/i, { timeout: 10_000 });
  });

  test('cost codes page shows data area', async ({ page }) => {
    await page.goto('/cost-management/codes');
    await page.waitForTimeout(1000);

    // Should have a table, tree view, or list
    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[role="tree"]'))
      .or(page.locator('[data-testid="cost-code-list"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  // =========================================================================
  // Budget Overview
  // =========================================================================

  test('budget overview page loads', async ({ page }) => {
    await page.goto('/cost-management/budget');
    await expect(page).toHaveURL('/cost-management/budget');
    await expect(page.locator('body')).toContainText(/(budget|бюджет|overview|обзор)/i, { timeout: 10_000 });
  });

  test('budget overview renders charts or summary cards', async ({ page }) => {
    await page.goto('/cost-management/budget');
    await page.waitForTimeout(2000);

    // Look for chart elements (SVG, canvas) or metric/summary cards
    const charts = page.locator('svg').or(page.locator('canvas'));
    const metricCards = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('.metric-card'))
      .or(page.locator('[class*="card"]'));

    const chartCount = await charts.count();
    const cardCount = await metricCards.count();

    // At least one chart or card should be visible
    expect(chartCount + cardCount).toBeGreaterThan(0);
  });

  // =========================================================================
  // Commitments
  // =========================================================================

  test('commitments list page loads', async ({ page }) => {
    await page.goto('/cost-management/commitments');
    await expect(page).toHaveURL('/cost-management/commitments');
    await expect(page.locator('body')).toContainText(/(commitment|обязательств)/i, { timeout: 10_000 });
  });

  test('commitments page shows data area', async ({ page }) => {
    await page.goto('/cost-management/commitments');
    await page.waitForTimeout(1000);

    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[data-testid="commitment-list"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  // =========================================================================
  // Cost Forecast
  // =========================================================================

  test('forecast page loads', async ({ page }) => {
    await page.goto('/cost-management/forecast');
    await expect(page).toHaveURL('/cost-management/forecast');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Cash Flow
  // =========================================================================

  test('cost cashflow page loads', async ({ page }) => {
    await page.goto('/cost-management/cashflow');
    await expect(page).toHaveURL('/cost-management/cashflow');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Revenue Recognition
  // =========================================================================

  test('revenue contracts page loads', async ({ page }) => {
    await page.goto('/revenue/contracts');
    await expect(page).toHaveURL('/revenue/contracts');
    await expect(page.locator('body')).toContainText(/(revenue|выручк|contract|договор)/i, { timeout: 10_000 });
  });

  test('revenue periods page loads', async ({ page }) => {
    await page.goto('/revenue/periods');
    await expect(page).toHaveURL('/revenue/periods');
    await expect(page.locator('body')).toBeVisible();
  });

  test('revenue dashboard page loads', async ({ page }) => {
    await page.goto('/revenue/dashboard');
    await expect(page).toHaveURL('/revenue/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Legacy Finance Pages
  // =========================================================================

  test('budgets page loads', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page).toHaveURL('/budgets');
    await expect(page.locator('body')).toBeVisible();
  });

  test('invoices page loads', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL('/invoices');
    await expect(page.locator('body')).toBeVisible();
  });

  test('payments page loads', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL('/payments');
    await expect(page.locator('body')).toBeVisible();
  });
});
