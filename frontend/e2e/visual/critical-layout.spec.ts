import { test, expect } from '@playwright/test';

/**
 * Visual baselines for key enterprise layouts.
 * Keep dataset deterministic (seed/demo mode) to reduce flakiness.
 */
const viewports = [
  { width: 320, height: 800, label: 'mobile-320' },
  { width: 768, height: 1024, label: 'tablet-768' },
  { width: 1440, height: 900, label: 'desktop-1440' },
  { width: 1920, height: 1080, label: 'desktop-1920' },
];

const routes = [
  { id: 'dashboard', path: '/' },
  { id: 'projects-list', path: '/projects' },
  { id: 'workflow-templates', path: '/workflow/templates' },
  { id: 'mobile-reports-new', path: '/mobile/reports/new' },
];

test.describe('Visual regression: critical layouts', () => {
  for (const route of routes) {
    for (const viewport of viewports) {
      test(`${route.id} @ ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
        await page.waitForTimeout(400);

        await expect(page).toHaveScreenshot(
          `${route.id}-${viewport.label}.png`,
          {
            fullPage: true,
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.01,
          },
        );
      });
    }
  }
});
