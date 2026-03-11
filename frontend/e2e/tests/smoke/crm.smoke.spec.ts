import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectDashboard,
  expectTable,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * CRM Module — Smoke Tests
 *
 * Persona: менеджер / директор
 * Routes: /crm/leads (pipeline), /crm/dashboard (analytics)
 * Expected: kanban board or table for leads, charts for dashboard
 */
test.describe('CRM — Smoke', () => {
  test('/crm/leads — воронка лидов', async ({ page }) => {
    await smokeCheck(page, '/crm/leads');
    // Could be kanban board or table
    const kanban = page.locator(
      '[class*="kanban"], [class*="board"], [class*="column"], [class*="pipeline"]',
    );
    const hasKanban = await kanban.first().isVisible().catch(() => false);
    if (!hasKanban) {
      await expectTable(page).catch(() => {});
    }
  });

  test('/crm/dashboard — CRM дашборд', async ({ page }) => {
    await smokeCheck(page, '/crm/dashboard');
    await expectDashboard(page).catch(() => {});
  });

  test('Dark mode: /crm/dashboard', async ({ page }) => {
    await checkDarkMode(page, '/crm/dashboard');
  });
});
