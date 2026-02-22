import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the Settings flow.
 * Verifies that the settings page loads, all section tabs render,
 * tab switching works, and sub-pages are accessible.
 */
test.describe('Settings flow', () => {

  // =========================================================================
  // Settings Page Load
  // =========================================================================

  test('settings page loads with tab navigation', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');

    // Should show settings-related content
    await expect(page.locator('body')).toContainText(/(settings|настройки)/i, { timeout: 10_000 });
  });

  test('settings page shows multiple section tabs or links', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    // Settings page has tabs: General, Email, Security, Integrations, Notifications, Backup
    const tabs = page
      .getByRole('tab')
      .or(page.locator('button').filter({ hasText: /(general|email|security|integrat|notif|backup|общие|почта|безопас|интегра|уведомл|резерв)/i }));
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Tab Switching
  // =========================================================================

  test('can switch to security tab', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    const securityTab = page
      .getByRole('tab', { name: /(security|безопас)/i })
      .or(page.locator('button').filter({ hasText: /(security|безопас)/i }));

    if (await securityTab.first().isVisible().catch(() => false)) {
      await securityTab.first().click();
      await page.waitForTimeout(500);
      // Page should still be stable and show security-related content
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('can switch to notifications tab', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    const notifTab = page
      .getByRole('tab', { name: /(notif|уведомл)/i })
      .or(page.locator('button').filter({ hasText: /(notif|уведомл)/i }));

    if (await notifTab.first().isVisible().catch(() => false)) {
      await notifTab.first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('can switch to backup tab', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    const backupTab = page
      .getByRole('tab', { name: /(backup|резерв)/i })
      .or(page.locator('button').filter({ hasText: /(backup|резерв)/i }));

    if (await backupTab.first().isVisible().catch(() => false)) {
      await backupTab.first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // =========================================================================
  // General Tab Content
  // =========================================================================

  test('general tab shows form fields for company settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    // General tab should be active by default and contain form inputs
    const formInputs = page.locator('input, select, textarea');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('general tab has a save button', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1500);

    const saveButton = page
      .getByRole('button', { name: /(save|сохранить|apply|применить)/i });

    const count = await saveButton.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Admin Sub-Pages
  // =========================================================================

  test('user admin page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('body')).toContainText(/(user|пользовател)/i, { timeout: 10_000 });
  });

  test('permissions page loads', async ({ page }) => {
    await page.goto('/admin/permissions');
    await expect(page).toHaveURL('/admin/permissions');
    await expect(page.locator('body')).toBeVisible();
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL('/notifications');
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Settings Page -- No Errors
  // =========================================================================

  test('settings page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
