import { test, expect } from '@playwright/test';

/**
 * Smoke tests for PM Workflow pages (RFI, Submittals, Issues).
 * Verifies that list pages load, creation forms open, and basic interactions work.
 */
test.describe('PM Workflow smoke tests', () => {

  // =========================================================================
  // RFI
  // =========================================================================

  test.describe('RFI', () => {
    test('RFI list page loads', async ({ page }) => {
      await page.goto('/pm/rfis');
      await expect(page).toHaveURL('/pm/rfis');
      // Page should render with RFI-related content
      await expect(page.locator('body')).toContainText(/(rfi|запрос)/i, { timeout: 10_000 });
    });

    test('RFI list shows table or card layout', async ({ page }) => {
      await page.goto('/pm/rfis');
      await page.waitForTimeout(1000);

      const contentArea = page
        .locator('table')
        .or(page.locator('[role="table"]'))
        .or(page.locator('[data-testid="rfi-list"]'))
        .or(page.locator('.grid'));
      await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
    });

    test('RFI creation button opens form', async ({ page }) => {
      await page.goto('/pm/rfis');

      const createButton = page
        .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
        .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

      const count = await createButton.count();
      if (count > 0) {
        await createButton.first().click();
        await page.waitForTimeout(500);

        // Should show a form (modal or new page)
        const formVisible = await page.locator('form').isVisible().catch(() => false);
        const dialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        expect(formVisible || dialogVisible || page.url().includes('new')).toBeTruthy();
      }
    });
  });

  // =========================================================================
  // Submittals
  // =========================================================================

  test.describe('Submittals', () => {
    test('submittal list page loads', async ({ page }) => {
      await page.goto('/pm/submittals');
      await expect(page).toHaveURL('/pm/submittals');
      await expect(page.locator('body')).toContainText(/(submittal|сабмитал|документ)/i, { timeout: 10_000 });
    });

    test('submittal list shows data area', async ({ page }) => {
      await page.goto('/pm/submittals');
      await page.waitForTimeout(1000);

      const contentArea = page
        .locator('table')
        .or(page.locator('[role="table"]'))
        .or(page.locator('[data-testid="submittal-list"]'))
        .or(page.locator('.grid'));
      await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
    });

    test('submittal creation button is available', async ({ page }) => {
      await page.goto('/pm/submittals');
      await page.waitForTimeout(1000);

      const createButton = page
        .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
        .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

      const count = await createButton.count();
      // Button should be present (at least one)
      expect(count).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Issues
  // =========================================================================

  test.describe('Issues', () => {
    test('issue list page loads', async ({ page }) => {
      await page.goto('/pm/issues');
      await expect(page).toHaveURL('/pm/issues');
      await expect(page.locator('body')).toContainText(/(issue|проблем|замечан)/i, { timeout: 10_000 });
    });

    test('issue list shows content area', async ({ page }) => {
      await page.goto('/pm/issues');
      await page.waitForTimeout(1000);

      const contentArea = page
        .locator('table')
        .or(page.locator('[role="table"]'))
        .or(page.locator('[data-testid="issue-list"]'))
        .or(page.locator('.grid'));
      await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
    });

    test('issue creation button is available', async ({ page }) => {
      await page.goto('/pm/issues');
      await page.waitForTimeout(1000);

      const createButton = page
        .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
        .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

      const count = await createButton.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
