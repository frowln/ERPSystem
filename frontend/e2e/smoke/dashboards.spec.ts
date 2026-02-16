import { test, expect } from '@playwright/test';

/**
 * Smoke tests for dashboard and analytics pages.
 * Verifies that dashboards load, display metrics, and render without errors.
 */
test.describe('Dashboard smoke tests', () => {

  // =========================================================================
  // Main Dashboard
  // =========================================================================

  test('main dashboard loads with content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Dashboard should have visible metric cards, charts, or summary content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Look for dashboard elements
    const metricElements = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('[class*="card"]'))
      .or(page.locator('[class*="metric"]'))
      .or(page.locator('[class*="stat"]'));

    const count = await metricElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('main dashboard shows charts or visualizations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Look for SVG charts (Recharts renders to SVG) or canvas elements
    const charts = page.locator('svg').or(page.locator('canvas'));
    const chartCount = await charts.count();

    // Dashboard should have at least one visualization
    expect(chartCount).toBeGreaterThan(0);
  });

  // =========================================================================
  // Analytics Dashboard
  // =========================================================================

  test('analytics dashboard page loads', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('body')).toBeVisible();
  });

  test('analytics page has visual content', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should have charts, tables, or cards
    const visuals = page.locator('svg').or(page.locator('canvas')).or(page.locator('table'));
    const cardElements = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('[class*="card"]'));

    const visualCount = await visuals.count();
    const cardCount = await cardElements.count();
    expect(visualCount + cardCount).toBeGreaterThan(0);
  });

  // =========================================================================
  // Safety Dashboard (via safety page)
  // =========================================================================

  test('safety page loads', async ({ page }) => {
    await page.goto('/safety');
    await expect(page).toHaveURL('/safety');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Operations Dashboard
  // =========================================================================

  test('operations dashboard page loads', async ({ page }) => {
    await page.goto('/operations/dashboard');
    await expect(page).toHaveURL('/operations/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Closeout Dashboard
  // =========================================================================

  test('closeout dashboard page loads', async ({ page }) => {
    await page.goto('/closeout/dashboard');
    await expect(page).toHaveURL('/closeout/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Punchlist Dashboard
  // =========================================================================

  test('punchlist dashboard page loads', async ({ page }) => {
    await page.goto('/punchlist/dashboard');
    await expect(page).toHaveURL('/punchlist/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Regulatory Dashboard
  // =========================================================================

  test('regulatory dashboard page loads', async ({ page }) => {
    await page.goto('/regulatory/dashboard');
    await expect(page).toHaveURL('/regulatory/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Support Dashboard
  // =========================================================================

  test('support dashboard page loads', async ({ page }) => {
    await page.goto('/support/dashboard');
    await expect(page).toHaveURL('/support/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Monitoring Dashboard
  // =========================================================================

  test('monitoring dashboard page loads', async ({ page }) => {
    await page.goto('/monitoring');
    await expect(page).toHaveURL('/monitoring');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // EVM Dashboard
  // =========================================================================

  test('EVM dashboard page loads', async ({ page }) => {
    await page.goto('/planning/evm');
    await expect(page).toHaveURL('/planning/evm');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Revenue Dashboard
  // =========================================================================

  test('revenue dashboard page loads', async ({ page }) => {
    await page.goto('/revenue/dashboard');
    await expect(page).toHaveURL('/revenue/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // KPI and Reports
  // =========================================================================

  test('KPI page loads', async ({ page }) => {
    await page.goto('/kpi');
    await expect(page).toHaveURL('/kpi');
    await expect(page.locator('body')).toBeVisible();
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL('/reports');
    await expect(page.locator('body')).toBeVisible();
  });
});
