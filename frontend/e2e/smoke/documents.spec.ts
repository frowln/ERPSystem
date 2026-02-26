import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Document management pages (CDE, Russian Docs).
 * Verifies that list pages load and creation forms are accessible.
 */
test.describe('Documents smoke tests', () => {

  // =========================================================================
  // CDE (Common Data Environment)
  // =========================================================================

  test.describe('CDE', () => {
    test('document container list page loads', async ({ page }) => {
      await page.goto('/cde/documents');
      await expect(page).toHaveURL('/cde/documents');
      await expect(
        page.getByRole('heading', { name: /(среда общих данных|common data environment|cde)/i }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('body')).toContainText(/(cde|document|документ|container|контейнер)/i, { timeout: 20_000 });
    });

    test('document container list shows content area', async ({ page }) => {
      await page.goto('/cde/documents');
      await page.waitForTimeout(1000);

      const contentArea = page
        .locator('table')
        .or(page.locator('[role="table"]'))
        .or(page.locator('[data-testid="document-list"]'))
        .or(page.locator('.grid'));
      await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
    });

    test('transmittal list page loads', async ({ page }) => {
      await page.goto('/cde/transmittals');
      await expect(page).toHaveURL('/cde/transmittals');
      await expect(page.locator('body')).toContainText(/(transmittal|[Тт]рансмит|передач)/i, { timeout: 10_000 });
    });

    test('document creation button is present', async ({ page }) => {
      await page.goto('/cde/documents');
      await page.waitForTimeout(1000);

      const buttonCount = await page.getByRole('button', { name: /(upload|загрузить|create|new|add|создать|добавить)/i }).count();
      const linkCount = await page.getByRole('link', { name: /(upload|загрузить|create|new|add|создать|добавить)/i }).count();

      expect(buttonCount + linkCount).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Russian Documents
  // =========================================================================

  test.describe('Russian Docs', () => {
    test('Russian docs list page loads', async ({ page }) => {
      await page.goto('/russian-docs/list');
      await expect(page).toHaveURL('/russian-docs/list');
      await expect(page.locator('body')).toBeVisible();
    });

    test('KS-2 generator page loads', async ({ page }) => {
      await page.goto('/russian-docs/ks2');
      await expect(page).toHaveURL('/russian-docs/ks2');
      await expect(page.locator('body')).toContainText(/(ks-?2|кс-?2|акт)/i, { timeout: 10_000 });
    });

    test('KS-3 generator page loads', async ({ page }) => {
      await page.goto('/russian-docs/ks3');
      await expect(page).toHaveURL('/russian-docs/ks3');
      await expect(page.locator('body')).toContainText(/(ks-?3|кс-?3|справка)/i, { timeout: 10_000 });
    });
  });

  // =========================================================================
  // Data Exchange
  // =========================================================================

  test.describe('Data Exchange', () => {
    test('data import page loads', async ({ page }) => {
      await page.goto('/data-exchange/import');
      await expect(page).toHaveURL('/data-exchange/import');
      await expect(page.locator('body')).toBeVisible();
    });

    test('data export page loads', async ({ page }) => {
      await page.goto('/data-exchange/export');
      await expect(page).toHaveURL('/data-exchange/export');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // =========================================================================
  // PTO Documents
  // =========================================================================

  test.describe('PTO', () => {
    test('PTO document list page loads', async ({ page }) => {
      await page.goto('/pto/documents');
      await expect(page).toHaveURL('/pto/documents');
      await expect(page.locator('body')).toBeVisible();
    });

    test('work permit list page loads', async ({ page }) => {
      await page.goto('/pto/work-permits');
      await expect(page).toHaveURL('/pto/work-permits');
      await expect(page.locator('body')).toBeVisible();
    });

    test('lab test list page loads', async ({ page }) => {
      await page.goto('/pto/lab-tests');
      await expect(page).toHaveURL('/pto/lab-tests');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
