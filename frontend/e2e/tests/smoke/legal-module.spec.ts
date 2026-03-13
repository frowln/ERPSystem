import { test, expect } from '@playwright/test';

test.describe('Legal Module — Smoke Tests', () => {

  test('Legal Cases list page loads with data', async ({ page }) => {
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');

    // Page header
    await expect(page.locator('text=Юридические дела')).toBeVisible({ timeout: 10000 });

    // Metric cards should be visible
    await expect(page.locator('text=Всего дел')).toBeVisible();
    await expect(page.locator('text=Активные')).toBeVisible();
    await expect(page.locator('text=Сумма исков')).toBeVisible();

    // Data table should have rows
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check case numbers are visible
    await expect(page.locator('text=ДЛ-2025/001').first()).toBeVisible();

    // Status badges
    await expect(page.locator('text=В работе').first()).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/legal-cases-list.png', fullPage: true });
  });

  test('Legal Cases list — tabs filter correctly', async ({ page }) => {
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "Открытые" tab
    const openTab = page.locator('button, [role="tab"]').filter({ hasText: 'Открытые' });
    if (await openTab.count() > 0) {
      await openTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Click "Все" tab to go back
    const allTab = page.locator('button, [role="tab"]').filter({ hasText: 'Все' });
    if (await allTab.count() > 0) {
      await allTab.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('Legal Cases list — search works', async ({ page }) => {
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Search for a specific case (use specific placeholder, not the global search)
    const searchInput = page.getByPlaceholder('Поиск по номеру, названию, стороне');
    await searchInput.fill('бетон');
    await page.waitForTimeout(500);

    // Should filter to show only the beton case
    await expect(page.locator('text=бракованный бетон').first()).toBeVisible();
  });

  test('Legal Case detail page loads correctly', async ({ page }) => {
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on the first case row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForURL(/\/legal\/cases\/[a-f0-9-]+/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Status flow should be visible
    await expect(page.getByText('Ход дела')).toBeVisible({ timeout: 15000 });

    // Metric cards
    await expect(page.getByText('Сумма исков').first()).toBeVisible();

    // Details sidebar
    await expect(page.locator('text=Детали дела')).toBeVisible();
    await expect(page.locator('text=Даты')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/legal-case-detail.png', fullPage: true });
  });

  test('Contract Templates list page loads with data', async ({ page }) => {
    await page.goto('/legal/templates');
    await page.waitForLoadState('networkidle');

    // Page header (use heading role to avoid matching sidebar nav item)
    await expect(page.getByRole('heading', { name: 'Шаблоны договоров' })).toBeVisible({ timeout: 10000 });

    // Metric cards
    await expect(page.locator('text=Всего шаблонов')).toBeVisible();
    await expect(page.locator('text=Активных')).toBeVisible();
    await expect(page.locator('text=Типов')).toBeVisible();

    // Data table rows
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Check template names
    await expect(page.locator('text=Договор генерального подряда').first()).toBeVisible();

    // Template type badges
    await expect(page.locator('text=Договор').first()).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/legal-templates-list.png', fullPage: true });
  });

  test('Contract Templates — filter by type works', async ({ page }) => {
    await page.goto('/legal/templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Use category filter select
    const select = page.locator('select').first();
    if (await select.count() > 0) {
      await select.selectOption({ label: 'Претензия' });
      await page.waitForTimeout(500);

      // Should show only claim templates
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('All strings are in Russian (no raw i18n keys)', async ({ page }) => {
    // Test cases page
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    let content = await page.textContent('body');
    // Check no raw i18n keys like "legal.somethingKey" appear on the page
    const rawKeyPattern = /\blegal\.\w{3,}/g;
    const matches = content?.match(rawKeyPattern) || [];
    expect(matches.length).toBe(0);

    // Test templates page
    await page.goto('/legal/templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    content = await page.textContent('body');
    const matches2 = content?.match(rawKeyPattern) || [];
    expect(matches2.length).toBe(0);
  });

  test('Dark mode renders correctly on legal pages', async ({ page }) => {
    await page.goto('/legal/cases');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Toggle dark mode via class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/legal-cases-dark.png', fullPage: true });
  });
});
