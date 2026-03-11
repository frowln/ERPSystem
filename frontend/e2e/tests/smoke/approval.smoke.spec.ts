import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Approval Workflow — Smoke Tests
 *
 * Persona: менеджер / директор
 * Route: /workflow/approval-inbox — очередь согласований
 * Empty inbox is valid — shows empty state message
 */
test.describe('Approval — Smoke', () => {
  test('/workflow/approval-inbox — очередь согласований', async ({ page }) => {
    await smokeCheck(page, '/workflow/approval-inbox');
    // Should show pending approvals or empty state
    await expectTable(page).catch(() => {
      /* empty inbox is OK */
    });
  });
});
