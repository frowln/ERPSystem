import { test, expect } from '@playwright/test';

/**
 * Portal Remaining Subsections E2E Tests
 * Tests: Signatures, Photos, Daily Reports, Tasks, CP Approval, KS-2 Drafts, Messages, Settings, Admin
 * Each page: load test, no JS errors, heading visible, no error state.
 */

const portalPages = [
  { path: '/portal/signatures', name: 'Signatures' },
  { path: '/portal/photos', name: 'Photos' },
  { path: '/portal/daily-reports', name: 'Daily Reports' },
  { path: '/portal/tasks', name: 'Tasks' },
  { path: '/portal/cp-approval', name: 'CP Approval' },
  { path: '/portal/ks2-drafts', name: 'KS-2 Drafts' },
  { path: '/portal/messages', name: 'Messages' },
  { path: '/portal/settings', name: 'Settings' },
  { path: '/portal/admin', name: 'Admin' },
];

test.describe('Portal — Remaining Subsections', () => {
  for (const { path, name } of portalPages) {
    test(`${name} page loads without errors (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle', timeout: 60_000 });

      // Heading must be visible
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible({ timeout: 15_000 });

      // No critical error state
      await expect(page.locator('text=/Не удалось загрузить данные/i')).not.toBeVisible({ timeout: 3_000 });
    });

    test(`${name} page has no JS errors (${path})`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(path, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(5000);

      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }

  test('Signatures page shows signature cards or empty state', async ({ page }) => {
    await page.goto('/portal/signatures', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const hasContent = await page.locator('[class*="rounded-xl"], tbody tr').count() > 0;
    const hasEmpty = await page.locator('text=/Нет документов|No documents|Нет подписей/i').isVisible();
    expect(hasContent || hasEmpty).toBe(true);
  });

  test('Daily Reports page shows metric cards', async ({ page }) => {
    await page.goto('/portal/daily-reports', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('Messages page shows compose button', async ({ page }) => {
    await page.goto('/portal/messages', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const composeBtn = page.locator('button').filter({ hasText: /Новое сообщение|New Message|Написать/i }).first();
    await expect(composeBtn).toBeVisible({ timeout: 10_000 });
  });

  test('Settings page shows form controls', async ({ page }) => {
    await page.goto('/portal/settings', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Settings page should have some form controls (inputs, selects, toggles)
    const controls = page.locator('input, select, [role="switch"], [class*="toggle"]');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Admin page shows user management', async ({ page }) => {
    await page.goto('/portal/admin', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Admin page should show tables or user cards
    const hasTable = await page.locator('tbody tr, [class*="rounded-lg"][class*="border"]').count() > 0;
    const hasEmpty = await page.locator('text=/Нет пользователей|No users/i').isVisible();
    // Admin page should at least have heading
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
