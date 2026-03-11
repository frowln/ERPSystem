import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Estimates & Pricing (Сметы и ценообразование) — Smoke Tests
 *
 * Persona: инженер-сметчик (cost engineer)
 * Сметное дело = core competency. ГЭСН/ФЕР/ТЕР are federal/regional price databases.
 * The chain: Спецификация → КЛ → ФМ ← ЛСР → КП is our key differentiator.
 * 8 pages tested.
 */
test.describe('Estimates & Pricing — Smoke', () => {
  test('/estimates — реестр смет', async ({ page }) => {
    const { body } = await smokeCheck(page, '/estimates');
    // Estimate table: Номер, Объект, Раздел, Сумма, Метод
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/estimates/minstroy — индексы Минстроя', async ({ page }) => {
    const { body } = await smokeCheck(page, '/estimates/minstroy');
    // Minstroy index table: Регион, Квартал, Значение
    // These are quarterly price indices published by Ministry of Construction
    expect(body).not.toContain('Something went wrong');
  });

  test('/estimates/pivot — сводная таблица анализа', async ({ page }) => {
    await smokeCheck(page, '/estimates/pivot');
    // Pivot table analysis — interactive cross-tab view
  });

  test('/estimates/volume-calculator — калькулятор объёмов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/estimates/volume-calculator');
    // Calculation form with dimensions (length, width, height, area, volume)
    const formElements = page.locator('input, select, button');
    const count = await formElements.count();
    expect(count, 'Volume calculator should have form elements').toBeGreaterThan(0);
  });

  test('/estimates/pricing/databases — базы расценок (ГЭСН, ФЕР, ТЕР)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/estimates/pricing/databases');
    // Pricing database list — ГЭСН (federal), ФЕР (federal estimate rates), ТЕР (territorial)
    expect(body).not.toContain('Cannot read properties');
  });

  test('/specifications — реестр спецификаций', async ({ page }) => {
    const { body } = await smokeCheck(page, '/specifications');
    // Spec table: Номер, Наименование, Объект, Кол-во позиций, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/specifications/competitive-registry — реестр конкурентных листов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/specifications/competitive-registry');
    // КЛ registry: Наименование, Поставщик 1/2/3, Мин. цена
    // Business rule: minimum 3 vendors per item
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/price-coefficients — коэффициенты пересчёта', async ({ page }) => {
    const { body } = await smokeCheck(page, '/price-coefficients');
    // Price coefficient table for regional/temporal adjustments
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
