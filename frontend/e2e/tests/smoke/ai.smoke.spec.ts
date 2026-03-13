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
    const { body } = await smokeCheck(page, '/ai/photo-analysis');
    // Should have upload area, analysis results, or at least render content
    // AI pages may show placeholder UI if no ML backend configured
    expect(body.length).toBeGreaterThan(50);
  });

  test('/ai/risk-dashboard — ИИ оценка рисков', async ({ page }) => {
    await smokeCheck(page, '/ai/risk-dashboard');
  });
});
