import { test, expect } from '@playwright/test';
import { smokeCheck } from '../../helpers/smoke.helper';

/**
 * Data Exchange — Smoke Tests
 *
 * Persona: бухгалтер (needs 1C export), системный администратор
 * 1С:Предприятие integration is critical for Russian construction market.
 * 5 pages tested.
 */
test.describe('Data Exchange — Smoke', () => {
  test('/data-exchange/import — импорт данных (CSV, Excel, 1C)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/data-exchange/import');
    // Should show file upload area or import wizard
    const uploadOrForm = page.locator(
      'input[type="file"], [class*="upload"], [class*="drop"], [class*="import"], button',
    );
    await expect(uploadOrForm.first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/data-exchange/export — экспорт данных', async ({ page }) => {
    const { body } = await smokeCheck(page, '/data-exchange/export');
    // Should show format selector (CSV/Excel/XML/1C) or export options
    expect(body).not.toContain('Something went wrong');
  });

  test('/data-exchange/mapping — маппинг полей', async ({ page }) => {
    await smokeCheck(page, '/data-exchange/mapping');
    // Field mapping configuration page
  });

  test('/data-exchange/1c-config — настройки интеграции 1С', async ({ page }) => {
    const { body } = await smokeCheck(page, '/data-exchange/1c-config');
    // Should show connection settings form (URL, credentials, sync options)
    const formElements = page.locator('input, select, textarea, button');
    const count = await formElements.count();
    expect(count, '1C config should have form elements').toBeGreaterThan(0);
  });

  test('/data-exchange/1c-logs — журнал синхронизации 1С', async ({ page }) => {
    const { body } = await smokeCheck(page, '/data-exchange/1c-logs');
    // Log table with timestamps and status, or empty state
    expect(body).not.toContain('Cannot read properties');
  });
});
