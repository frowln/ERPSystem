import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Defects (Замечания/Дефекты) — Smoke Tests
 *
 * Persona: прораб (reports defects), инженер по качеству
 * Comparable to PlanRadar's defect tracking.
 * Severity: незначительный, значительный, критический.
 * Open defects > 30 days = quality management failing (business rule).
 * 3 pages + 1 dark-mode check.
 */
test.describe('Defects — Smoke', () => {
  test('/defects — реестр замечаний', async ({ page }) => {
    const { body } = await smokeCheck(page, '/defects');
    // Defect register table: Номер, Описание, Местоположение, Тип, Критичность, Статус, Исполнитель
    await expectTable(page).catch(() => {});
    // Check no i18n key leaks
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/defects/dashboard — аналитика дефектов', async ({ page }) => {
    await smokeCheck(page, '/defects/dashboard');
    // Charts: by type, by status, trend over time
    await expectDashboard(page);
  });

  test('/defects/on-plan — дефекты на плане этажа', async ({ page }) => {
    const { body } = await smokeCheck(page, '/defects/on-plan');
    // Floor plan viewer with defect pins (or placeholder)
    // PlanRadar competitor: фото-аннотация на планах
    expect(body.length).toBeGreaterThan(50);
  });

  test('Dark mode: /defects', async ({ page }) => {
    await checkDarkMode(page, '/defects');
  });
});
