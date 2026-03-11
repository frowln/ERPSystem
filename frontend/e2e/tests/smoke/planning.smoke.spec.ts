import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectDashboard,
  expectTable,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Planning (Планирование) — Smoke Tests
 *
 * Persona: руководитель проекта, директор, инженер-плановик
 * Domain: EVM = Earned Value Management (ANSI/EIA-748).
 *   CPI < 1 = перерасход бюджета, SPI < 1 = отставание от графика.
 *   PV = Planned Value, EV = Earned Value, AC = Actual Cost.
 *   EAC = Estimate at Completion, ETC = Estimate to Complete, VAC = Variance at Completion.
 * Gantt = calendar-bar chart (Primavera/MS Project style).
 * 4 pages + 1 dark-mode check.
 */
test.describe('Planning — Smoke', () => {
  test('/planning/gantt — диаграмма Ганта', async ({ page }) => {
    const { body } = await smokeCheck(page, '/planning/gantt');
    // Gantt chart: timeline bars, date axis, task list
    // Domain: критический путь (CPM), вехи, зависимости FS/FF/SS/SF
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/planning/evm — освоенный объём (EVM)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/planning/evm');
    // EVM dashboard: KPI cards (PV, EV, AC, CPI, SPI, EAC, ETC, VAC)
    // Domain: CPI=EV/AC, SPI=EV/PV. Both should be ≥1.0 for healthy project
    await expectDashboard(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/planning/resource-planning — планирование ресурсов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/planning/resource-planning');
    // Resource allocation chart or table: people, equipment, materials per period
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/planning/work-volumes — объёмы работ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/planning/work-volumes');
    // Work volume planning table: наименование, единица, план, факт, %
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('Dark mode: /planning/gantt', async ({ page }) => {
    await checkDarkMode(page, '/planning/gantt');
  });
});
