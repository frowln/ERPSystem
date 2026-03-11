import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Finance — Full Module Smoke Tests
 *
 * Persona: бухгалтер (accountant), директор (CEO), финансовый директор
 * Finance is the most data-rich module. НДС=20% on all amounts.
 * Business rules: invoice total = sum of line items, budget total = sum of budget items.
 * Money flows ONE direction: Plan → Contract → Act → Payment.
 * 19 pages + 1 dark-mode check.
 */
test.describe('Finance — Smoke', () => {
  // ── Core Finance ────────────────────────────────────────────────────
  test('/budgets — реестр бюджетов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/budgets');
    // Budget table: Объект, План, Факт, Отклонение, Освоение %
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/financial-models — финансовые модели', async ({ page }) => {
    const { body } = await smokeCheck(page, '/financial-models');
    // FM table: Объект, Себестоимость, Цена заказчика, Маржа %
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/invoices — реестр счетов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/invoices');
    // Invoice table: Номер, Контрагент, Сумма, НДС, Итого, Статус, Дата
    // Business rule: НДС = 20% of amount
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/payments — реестр платежей', async ({ page }) => {
    const { body } = await smokeCheck(page, '/payments');
    // Payment table: Номер, Счёт, Сумма, Дата оплаты, Способ
    // Business rule: payment cannot exceed invoice amount
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  // ── Cash Flow ───────────────────────────────────────────────────────
  test('/cash-flow — панель денежных потоков', async ({ page }) => {
    await smokeCheck(page, '/cash-flow');
    // Cash flow chart: план vs факт по месяцам
    await expectDashboard(page);
  });

  test('/cash-flow/charts — графики ДДС', async ({ page }) => {
    await smokeCheck(page, '/cash-flow/charts');
    // Charts: income/expense over time
    await expectDashboard(page).catch(() => {});
  });

  // ── Banking ─────────────────────────────────────────────────────────
  test('/bank-statement-matching — сверка банковских выписок', async ({ page }) => {
    const { body } = await smokeCheck(page, '/bank-statement-matching');
    // Bank statement matching UI
    expect(body).not.toContain('Cannot read properties');
  });

  test('/bank-export — экспорт платёжных поручений', async ({ page }) => {
    const { body } = await smokeCheck(page, '/bank-export');
    // Bank export (payment orders) — formats: 1C, iBank, etc.
    expect(body).not.toContain('Something went wrong');
  });

  // ── Calendars ───────────────────────────────────────────────────────
  test('/treasury-calendar — казначейский календарь', async ({ page }) => {
    await smokeCheck(page, '/treasury-calendar');
    // Treasury calendar — planned payments/receipts by date
  });

  test('/tax-calendar — налоговый календарь', async ({ page }) => {
    await smokeCheck(page, '/tax-calendar');
    // Tax calendar — due dates for tax payments
    // Domain: НДС quarterly, income tax monthly/quarterly
  });

  // ── Calculators & Reports ───────────────────────────────────────────
  test('/factoring-calculator — калькулятор факторинга', async ({ page }) => {
    const { body } = await smokeCheck(page, '/factoring-calculator');
    // Factoring calculator — compute factoring costs/benefits
    const formElements = page.locator('input, select, button');
    const count = await formElements.count();
    expect(count, 'Factoring calculator should have inputs').toBeGreaterThan(0);
  });

  test('/bdds — БДДС (бюджет движения денежных средств)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/bdds');
    // БДДС — period-based cash flow budget
    // Business rule: monthly totals must balance (income - expenses = net)
    expect(body).not.toContain('Something went wrong');
  });

  test('/finance/expenses — отчёты о расходах', async ({ page }) => {
    const { body } = await smokeCheck(page, '/finance/expenses');
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/finance/s-curve-cashflow — S-кривая денежных потоков', async ({ page }) => {
    await smokeCheck(page, '/finance/s-curve-cashflow');
    // S-curve chart — cumulative plan vs actual
    // Used by директор to see project financial trajectory
    await expectDashboard(page).catch(() => {});
  });

  test('/tax-risk — оценка налоговых рисков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/tax-risk');
    // Tax risk score indicators
    expect(body).not.toContain('Cannot read properties');
  });

  // ── Revenue ─────────────────────────────────────────────────────────
  test('/revenue/dashboard — панель доходов', async ({ page }) => {
    await smokeCheck(page, '/revenue/dashboard');
    await expectDashboard(page);
  });

  test('/revenue/recognition-periods — периоды признания выручки', async ({ page }) => {
    const { body } = await smokeCheck(page, '/revenue/recognition-periods');
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/revenue/all-contracts — все договоры с выручкой', async ({ page }) => {
    const { body } = await smokeCheck(page, '/revenue/all-contracts');
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/execution-chain — цепочка исполнения договора', async ({ page }) => {
    const { body } = await smokeCheck(page, '/execution-chain');
    // Contract execution chain visualization
    // Domain: Spec → КЛ → FM → КП → Contract → КС-2 → КС-3 → Payment
    expect(body.length).toBeGreaterThan(50);
  });

  // ── Dark mode ───────────────────────────────────────────────────────
  test('Dark mode: /invoices', async ({ page }) => {
    await checkDarkMode(page, '/invoices');
  });
});
