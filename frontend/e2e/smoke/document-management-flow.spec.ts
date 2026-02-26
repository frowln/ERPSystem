import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Document Management flow.
 * Verifies the general documents list, CDE containers, PTO documents,
 * filter interactions, and document detail pages.
 */
test.describe('Document management flow', () => {

  // =========================================================================
  // General Documents List
  // =========================================================================

  test('documents list page loads with content', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL('/documents');

    // Should show document-related content
    await expect(page.locator('body')).toContainText(/(document|документ|файл|file)/i, { timeout: 10_000 });
  });

  test('documents list has table or grid layout', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForTimeout(1500);

    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[data-testid="document-list"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  test('documents list has search or filter capability', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForTimeout(1000);

    const searchInput = page
      .getByPlaceholder(/(search|поиск|найти|filter|фильтр)/i)
      .or(page.locator('input[type="search"]'))
      .or(page.locator('[data-testid="search-input"]'));

    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('documents list has upload or create button', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForTimeout(1000);

    const createButton = page
      .getByRole('button', { name: /(create|new|add|upload|создать|добавить|загрузить)/i })
      .or(page.getByRole('link', { name: /(create|new|add|upload|создать|добавить|загрузить)/i }));

    const count = await createButton.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // CDE Documents
  // =========================================================================

  test('CDE document containers page loads', async ({ page }) => {
    await page.goto('/cde/documents');
    await expect(page).toHaveURL('/cde/documents');
    await expect(page.locator('body')).toContainText(/(document|документ|container|контейнер)/i, { timeout: 10_000 });

    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  test('CDE transmittals page loads', async ({ page }) => {
    await page.goto('/cde/transmittals');
    await expect(page).toHaveURL('/cde/transmittals');
    await expect(page.locator('body')).toContainText(/(transmittal|[Тт]рансмит|передач)/i, { timeout: 10_000 });
  });

  test('CDE revision sets page loads', async ({ page }) => {
    await page.goto('/cde/revision-sets');
    await expect(page).toHaveURL('/cde/revision-sets');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // PTO Documents
  // =========================================================================

  test('PTO document list has create/new button', async ({ page }) => {
    await page.goto('/pto/documents');
    await expect(page).toHaveURL('/pto/documents');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /(документация пто|документы пто|pto documents)/i }),
    ).toBeVisible({ timeout: 20_000 });

    const buttonCount = await page.getByRole('button', { name: /(новый документ|new document|create|new|add|создать|добавить)/i }).count();
    const linkCount = await page.getByRole('link', { name: /(новый документ|new document|create|new|add|создать|добавить)/i }).count();

    expect(buttonCount + linkCount).toBeGreaterThan(0);
  });

  test('PTO hidden work acts page loads', async ({ page }) => {
    await page.goto('/pto/hidden-work-acts');
    await expect(page).toHaveURL('/pto/hidden-work-acts');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Document Page -- No Errors
  // =========================================================================

  test('documents page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver')
        && !e.includes('state update') && !e.includes('ERR_CONNECTION_RESET') && !e.includes('Failed to fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('CDE documents page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/cde/documents');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver')
        && !e.includes('state update') && !e.includes('ERR_CONNECTION_RESET') && !e.includes('Failed to fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
