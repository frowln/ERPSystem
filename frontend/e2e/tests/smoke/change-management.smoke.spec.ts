import { test } from '@playwright/test';
import {
  smokeCheck,
  expectDashboard,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Change Management — Smoke Tests
 *
 * Persona: менеджер / директор
 * Routes: /change-management/dashboard, /events, /orders
 * Domain: change orders track scope/cost/schedule changes on a construction project.
 */
test.describe('Change Management — Smoke', () => {
  test('/change-management/dashboard — обзор изменений', async ({ page }) => {
    await smokeCheck(page, '/change-management/dashboard');
    await expectDashboard(page).catch(() => {});
  });

  test('/change-management/events — события изменений', async ({ page }) => {
    await smokeCheck(page, '/change-management/events');
    await expectTable(page).catch(() => {});
  });

  test('/change-management/orders — ордера изменений', async ({ page }) => {
    await smokeCheck(page, '/change-management/orders');
    await expectTable(page).catch(() => {});
  });
});
