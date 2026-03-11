import { test, expect } from '@playwright/test';
import { smokeCheck } from '../../helpers/smoke.helper';

/**
 * AI Module — Smoke Tests
 *
 * Persona: инженер / директор
 * Routes: /ai/photo-analysis, /ai/risk-dashboard
 * Note: AI pages may show placeholder UI if no ML backend configured.
 */
test.describe('AI — Smoke', () => {
  test('/ai/photo-analysis — ИИ фотоанализ', async ({ page }) => {
    await smokeCheck(page, '/ai/photo-analysis');
    // Should have upload area or analysis results
    const upload = page.locator(
      'input[type="file"], [class*="upload"], [class*="dropzone"], button:has-text(/загрузить|upload/i)',
    );
    const content = page.locator(
      'table, [class*="card"], [class*="result"], [class*="analysis"]',
    );
    const hasUpload = await upload.first().isVisible().catch(() => false);
    const hasContent = await content.first().isVisible().catch(() => false);
    expect(
      hasUpload || hasContent,
      'Photo analysis should have upload area or results',
    ).toBe(true);
  });

  test('/ai/risk-dashboard — ИИ оценка рисков', async ({ page }) => {
    await smokeCheck(page, '/ai/risk-dashboard');
  });
});
