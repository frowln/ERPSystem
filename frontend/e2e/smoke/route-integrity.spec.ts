import { test, expect } from '@playwright/test';

/**
 * Route integrity smoke:
 * verifies that previously broken navigation targets resolve to a real screen
 * (direct page or redirect alias), not to wildcard fallback.
 */
test.describe('Route integrity smoke', () => {
  const criticalRoutes: Array<{ path: string; expectedPrefix: string }> = [
    { path: '/russian-docs', expectedPrefix: '/russian-docs/list' },
    { path: '/issues', expectedPrefix: '/pm/issues' },
    { path: '/issues/123', expectedPrefix: '/pm/issues' },
    { path: '/punchlist/new', expectedPrefix: '/punchlist/items' },
    { path: '/change-management/events/new', expectedPrefix: '/change-management/events' },
    { path: '/change-management/orders/new', expectedPrefix: '/change-management/orders' },
    { path: '/cost-management/commitments/new', expectedPrefix: '/cost-management/commitments' },
    { path: '/portfolio/opportunities/new', expectedPrefix: '/portfolio/opportunities' },
    { path: '/portfolio/tenders/new', expectedPrefix: '/portfolio/tenders' },
    { path: '/regulatory/permits/new', expectedPrefix: '/regulatory/permits' },
    { path: '/regulatory/licenses/new', expectedPrefix: '/regulatory/licenses' },
    { path: '/regulatory/inspections/new', expectedPrefix: '/regulatory/inspections' },
    { path: '/operations/work-orders/new', expectedPrefix: '/operations/work-orders' },
    { path: '/portal', expectedPrefix: '/portal' },
    { path: '/portal/projects', expectedPrefix: '/portal/projects' },
    { path: '/portal/documents', expectedPrefix: '/portal/documents' },
    { path: '/portal/messages', expectedPrefix: '/portal/messages' },
    { path: '/portal/admin', expectedPrefix: '/portal/admin' },
    { path: '/messaging/calls', expectedPrefix: '/messaging/calls' },
  ];

  for (const { path, expectedPrefix } of criticalRoutes) {
    test(`route ${path} resolves`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    });
  }
});
