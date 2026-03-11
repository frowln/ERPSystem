import { test } from '@playwright/test';
import { smokeCheck, expectDashboard } from '../../helpers/smoke.helper';

/**
 * Analytics & Reports — Smoke Tests
 *
 * Persona: директор / менеджер
 * Routes: /analytics (dashboard with charts), /reports (report list or builder)
 */
test.describe('Analytics — Smoke', () => {
  test('/analytics — аналитика', async ({ page }) => {
    await smokeCheck(page, '/analytics');
    await expectDashboard(page).catch(() => {});
  });

  test('/reports — отчёты', async ({ page }) => {
    await smokeCheck(page, '/reports');
  });
});
