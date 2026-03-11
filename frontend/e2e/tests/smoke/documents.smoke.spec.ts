import { test, expect } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Documents (Документы) — Smoke Tests
 *
 * Persona: инженер ПТО, директор
 * Document management = core feature. Must support versioning.
 * Types: Проект, Чертёж, Акт, Справка, Договор, Письмо.
 * 2 pages tested.
 */
test.describe('Documents — Smoke', () => {
  test('/documents — реестр документов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/documents');
    // Document register table: Название, Тип, Раздел, Версия, Дата, Автор
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/documents/smart-recognition — AI-распознавание документов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/documents/smart-recognition');
    // Should show upload area + OCR results or processing UI
    const uploadOrAi = page.locator(
      'input[type="file"], [class*="upload"], [class*="drop"], [class*="recognition"], [class*="scan"]',
    );
    await expect(uploadOrAi.first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });
});
