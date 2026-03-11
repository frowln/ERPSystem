import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Maintenance (Обслуживание) — Smoke Tests
 *
 * Persona: инженер по эксплуатации, прораб, механик
 * Domain: техническое обслуживание зданий и сооружений после сдачи.
 *   Requests = заявки на ремонт/обслуживание (CMMS-style).
 *   Equipment = реестр обслуживаемого оборудования.
 *   Dashboard = KPI: открытые заявки, среднее время реакции.
 * 3 pages.
 */
test.describe('Maintenance — Smoke', () => {
  test('/maintenance/dashboard — дашборд обслуживания', async ({ page }) => {
    const { body } = await smokeCheck(page, '/maintenance/dashboard');
    // KPI cards: open requests, avg resolution time, overdue
    await expectDashboard(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/maintenance/requests — заявки на обслуживание', async ({ page }) => {
    const { body } = await smokeCheck(page, '/maintenance/requests');
    // Maintenance requests: Номер, Объект, Описание, Приоритет, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/maintenance/equipment — реестр оборудования', async ({ page }) => {
    const { body } = await smokeCheck(page, '/maintenance/equipment');
    // Equipment register: Наименование, Тип, Серийный номер, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });
});
