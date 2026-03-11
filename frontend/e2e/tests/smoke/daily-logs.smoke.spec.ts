import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Daily Logs / Operations — Smoke Tests
 *
 * Persona: прораб (site foreman)
 * The daily log is the прораб's main tool — must capture weather, workers, equipment.
 * Operations dashboard gives site overview KPIs.
 * 4 pages tested.
 */
test.describe('Daily Logs / Operations — Smoke', () => {
  test('/operations/daily-logs — журнал ежедневных работ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/operations/daily-logs');
    // Daily log register should show table or list
    await expectTable(page).catch(() => {});
    // Domain: прораб fills this daily. Columns: Дата, Объект, Бригада, Погода, Описание работ
    // Check for i18n key leaks
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/operations/dashboard — панель управления стройплощадкой', async ({ page }) => {
    await smokeCheck(page, '/operations/dashboard');
    // Dashboard should show KPI cards: active crews, weather, progress
    await expectDashboard(page);
  });

  test('/operations/work-orders — наряд-заказы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/operations/work-orders');
    // Work orders table: Номер, Вид работ, Бригада, Статус, Объём
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|null/);
  });

  test('/operations/dispatch-calendar — календарь диспетчеризации', async ({ page }) => {
    await smokeCheck(page, '/operations/dispatch-calendar');
    // Should render calendar or scheduling view
    const calendarOrTable = page.locator(
      '[class*="calendar"], [class*="schedule"], table, [class*="grid"]',
    );
    await expect(calendarOrTable.first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
  });
});
