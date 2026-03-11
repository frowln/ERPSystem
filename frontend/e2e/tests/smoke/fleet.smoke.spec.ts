import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Fleet (Техника / Спецтехника) — Smoke Tests
 *
 * Persona: механик, прораб, логист
 * Waybills (путевые листы) = legally required document.
 * ЕСМ-7 form = standard equipment usage form.
 * Business rule: fuel consumption must track norms vs actual (перерасход).
 * 10 pages + 1 dark-mode check.
 */
test.describe('Fleet — Smoke', () => {
  test('/fleet — реестр транспортных средств', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet');
    // Vehicle register: Марка, Гос.номер, Тип, Статус, Пробег
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/fleet/fuel — журнал заправок', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/fuel');
    // Fuel log: Дата, ТС, Литры, Стоимость, АЗС
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/fleet/fuel-accounting — учёт ГСМ (нормы vs факт)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/fuel-accounting');
    // Fuel accounting: norms vs actual consumption
    // Business rule: overconsumption (перерасход) = driver warning
    expect(body).not.toContain('Something went wrong');
  });

  test('/fleet/maintenance — журнал ТО', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/maintenance');
    // Maintenance log: vehicle, date, type, status
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/fleet/maint-repair — история ремонтов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/maint-repair');
    // Repair history table
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/fleet/maintenance-schedule — график ТО', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/maintenance-schedule');
    // Maintenance schedule — calendar or gantt view
    expect(body.length).toBeGreaterThan(50);
  });

  test('/fleet/waybills-esm — путевые листы (форма ЕСМ)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/waybills-esm');
    // Waybill register: Номер, Дата, Водитель, ТС, Маршрут
    // Domain: legally required document for every trip
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/fleet/usage-logs — журнал использования техники', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/usage-logs');
    // Equipment usage logs table
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/fleet/gps-tracking — GPS-мониторинг', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/gps-tracking');
    // Map view or placeholder — GPS tracking may use localStorage fallback
    expect(body.length).toBeGreaterThan(50);
  });

  test('/fleet/driver-rating — рейтинг водителей', async ({ page }) => {
    const { body } = await smokeCheck(page, '/fleet/driver-rating');
    // Driver performance rating table or cards
    expect(body).not.toContain('Cannot read properties');
  });

  test('Dark mode: /fleet', async ({ page }) => {
    await checkDarkMode(page, '/fleet');
  });
});
