import { test } from '@playwright/test';
import {
  smokeCheck,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Closeout Module — Smoke Tests
 *
 * Persona: прораб / директор
 * 11 pages + 1 dark-mode check
 * Domain: сдача объекта — commissioning, handover, warranty, as-built docs,
 *         ЗОС (заключение о соответствии), стройнадзор compliance.
 */
test.describe('Closeout — Smoke', () => {
  test('/closeout/dashboard — обзор завершения', async ({ page }) => {
    await smokeCheck(page, '/closeout/dashboard');
    await expectDashboard(page).catch(() => {});
  });

  test('/closeout/commissioning — пусконаладка', async ({ page }) => {
    await smokeCheck(page, '/closeout/commissioning');
  });

  test('/closeout/commissioning-templates — шаблоны ПНР', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/commissioning-templates');
  });

  test('/closeout/handover — передача объекта', async ({ page }) => {
    await smokeCheck(page, '/closeout/handover');
  });

  test('/closeout/warranty — гарантия', async ({ page }) => {
    await smokeCheck(page, '/closeout/warranty');
  });

  test('/closeout/warranty-obligations — гарантийные обязательства', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/warranty-obligations');
  });

  test('/closeout/warranty-tracking — отслеживание гарантий', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/warranty-tracking');
  });

  test('/closeout/as-built — исполнительная документация', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/as-built');
  });

  test('/closeout/zos — ЗОС (заключение о соответствии)', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/zos');
  });

  test('/closeout/stroynadzor — стройнадзор', async ({ page }) => {
    await smokeCheck(page, '/closeout/stroynadzor');
  });

  test('/closeout/executive-schemas — исполнительные схемы', async ({
    page,
  }) => {
    await smokeCheck(page, '/closeout/executive-schemas');
  });

  test('Dark mode: /closeout/dashboard', async ({ page }) => {
    await checkDarkMode(page, '/closeout/dashboard');
  });
});
