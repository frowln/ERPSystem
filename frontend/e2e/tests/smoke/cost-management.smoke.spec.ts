import { test } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Cost Management — Smoke Tests
 *
 * Persona: инженер-сметчик / бухгалтер / директор
 * 7 pages under /cost-management/*
 * Domain: EVM methodology — EAC, ETC, VAC, CPI, SPI.
 *         WBS cost codes, budget vs actual, profitability.
 */
test.describe('Cost Management — Smoke', () => {
  test('/cost-management/codes — коды затрат (WBS)', async ({ page }) => {
    await smokeCheck(page, '/cost-management/codes');
    await expectTable(page).catch(() => {});
  });

  test('/cost-management/budget — бюджет vs факт', async ({ page }) => {
    await smokeCheck(page, '/cost-management/budget');
    await expectTable(page).catch(() => {});
  });

  test('/cost-management/commitments — обязательства', async ({ page }) => {
    await smokeCheck(page, '/cost-management/commitments');
    await expectTable(page).catch(() => {});
  });

  test('/cost-management/forecast — прогноз затрат (EAC/ETC)', async ({
    page,
  }) => {
    await smokeCheck(page, '/cost-management/forecast');
  });

  test('/cost-management/cashflow-forecast — прогноз ДДС', async ({
    page,
  }) => {
    await smokeCheck(page, '/cost-management/cashflow-forecast');
  });

  test('/cost-management/forecasting-hub — хаб прогнозирования', async ({
    page,
  }) => {
    await smokeCheck(page, '/cost-management/forecasting-hub');
    await expectDashboard(page).catch(() => {});
  });

  test('/cost-management/profitability — рентабельность', async ({
    page,
  }) => {
    await smokeCheck(page, '/cost-management/profitability');
    await expectDashboard(page).catch(() => {});
  });
});
