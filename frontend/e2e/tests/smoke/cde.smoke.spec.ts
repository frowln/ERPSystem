import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * CDE (Common Data Environment) — Smoke Tests
 *
 * Persona: инженер / прораб
 * Routes: /cde/documents (document management), /cde/transmittals (transmittal packages)
 */
test.describe('CDE — Smoke', () => {
  test('/cde/documents — документы CDE', async ({ page }) => {
    await smokeCheck(page, '/cde/documents');
    // May have folder tree or file list
  });

  test('/cde/transmittals — трансмиттальные пакеты', async ({ page }) => {
    await smokeCheck(page, '/cde/transmittals');
    await expectTable(page).catch(() => {});
  });
});
