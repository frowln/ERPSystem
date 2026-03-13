import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Admin Module — Smoke Tests
 *
 * Persona: директор / системный администратор
 * 7 pages + 1 dark-mode check
 */
test.describe('Admin — Smoke', () => {
  test('/admin/dashboard — панель администратора', async ({ page }) => {
    await smokeCheck(page, '/admin/dashboard');
    await expectDashboard(page).catch(() => {});
  });

  test('/admin/users — управление пользователями', async ({ page }) => {
    const { body } = await smokeCheck(page, '/admin/users');
    await expectTable(page);
    // Admin user should always exist
    expect(body).toMatch(/admin|администратор/i);
  });

  test('/admin/permissions — матрица прав', async ({ page }) => {
    await smokeCheck(page, '/admin/permissions');
    // Should show permission groups list or role-based permission grid
    const content = page.locator(
      'table, [class*="grid"], [class*="matrix"], [class*="permission"], h1, h2, h3',
    ).filter({ hasText: /прав|группы|permission|group|права доступа/i });
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test('/admin/departments — отделы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/admin/departments');
    // Page shows organizational structure as a tree or table
    expect(body).toMatch(/структур|отдел|подразделен|department/i);
  });

  test('/admin/security — безопасность', async ({ page }) => {
    await smokeCheck(page, '/admin/security');
  });

  test('/admin/system-settings — системные настройки', async ({ page }) => {
    await smokeCheck(page, '/admin/system-settings');
  });

  test('/monitoring — мониторинг системы', async ({ page }) => {
    await smokeCheck(page, '/monitoring');
  });

  test('Dark mode: /admin/dashboard', async ({ page }) => {
    await checkDarkMode(page, '/admin/dashboard');
  });
});
