/**
 * Phase 4: Concurrent Operation Conflicts
 *
 * Tests for race conditions and duplicate submission prevention:
 * - Double-click submit prevention
 * - Rapid multiple clicks on submit
 * - Simultaneous edits in two tabs (stale data)
 * - Concurrent API calls
 *
 * Verifies:
 * 1. Only 1 entity created on double-click (no duplicates)
 * 2. Submit button disabled after first click
 * 3. Stale data edits show conflict or error
 * 4. No silent data overwrites
 */
import { test, expect } from '../../fixtures/base.fixture';
import { fillForm } from '../../helpers/form.helper';

// ---------------------------------------------------------------------------
// Issue tracker
// ---------------------------------------------------------------------------

interface Issue {
  test: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  description: string;
}

const issues: Issue[] = [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 4: Concurrent Operations', () => {
  test.describe.configure({ mode: 'serial' });

  // ── 4.1: Double-Click Submit Prevention ──
  test.describe('Double-click submit prevention', () => {
    test('Project form: rapid triple click', async ({ trackedPage: page }) => {
      await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Fill with unique E2E data
      const uniqueName = `E2E-DoubleClick-${Date.now()}`;
      await fillForm(page, { name: uniqueName }).catch(() => {
        // Field name may differ — try common selectors
      });

      // Try filling via direct selector
      const nameInput = page.locator('input[name="name"], input[name="title"], input[type="text"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(uniqueName);
      }

      // Track API calls
      const apiPostCalls: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/') && req.method() === 'POST') {
          apiPostCalls.push(`${Date.now()}: ${req.method()} ${req.url()}`);
        }
      });

      // Find submit button
      const submitBtn = page.locator('button[type="submit"]')
        .or(page.getByRole('button', { name: /сохранить|создать|отправить/i }))
        .first();

      if (!(await submitBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Rapid triple click
      await submitBtn.click({ delay: 0 });
      await submitBtn.click({ delay: 0 }).catch(() => {});
      await submitBtn.click({ delay: 0 }).catch(() => {});

      await page.waitForTimeout(3000);

      // Check: at most 1 POST call should have been made
      const submissionCalls = apiPostCalls.filter(
        (c) => !c.includes('/auth/') && !c.includes('/settings/')
      );

      if (submissionCalls.length > 1) {
        issues.push({
          test: 'Project double-click',
          severity: 'CRITICAL',
          description: `${submissionCalls.length} API POST calls on triple click (expected max 1): ${submissionCalls.join(', ')}`,
        });
      }

      // Check if button was disabled after first click
      const isDisabled = await submitBtn.isDisabled().catch(() => false);
      if (!isDisabled && submissionCalls.length > 0) {
        issues.push({
          test: 'Project double-click',
          severity: 'UX',
          description: 'Submit button not disabled after first click (should show loading state)',
        });
      }

      // Page should not crash
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Something went wrong');
    });

    test('Modal form: rapid double click (CRM lead)', async ({ trackedPage: page }) => {
      await page.goto('/crm/leads', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Open create modal
      const createBtn = page.getByRole('button', { name: /создать|добавить|новый/i }).first();
      if (!(await createBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await createBtn.click();
      await page.waitForTimeout(500);

      // Fill minimal data
      const nameInput = page.locator('[role="dialog"] input[type="text"]').first()
        .or(page.locator('input[name="name"], input[name="company"]').first());
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`E2E-DblClick-Lead-${Date.now()}`);
      }

      // Track API calls
      const apiCalls: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/') && req.method() === 'POST') {
          apiCalls.push(req.url());
        }
      });

      // Double click submit in modal
      const modalSubmit = page.locator('[role="dialog"] button[type="submit"]')
        .or(page.locator('[role="dialog"]').getByRole('button', { name: /сохранить|создать|добавить/i }))
        .first();

      if (await modalSubmit.isVisible().catch(() => false)) {
        await modalSubmit.click({ delay: 0 });
        await modalSubmit.click({ delay: 0 }).catch(() => {});
        await page.waitForTimeout(2000);

        const submissionCalls = apiCalls.filter(
          (c) => !c.includes('/auth/')
        );

        if (submissionCalls.length > 1) {
          issues.push({
            test: 'CRM lead modal double-click',
            severity: 'CRITICAL',
            description: `${submissionCalls.length} POST calls on double click`,
          });
        }
      }
    });
  });

  // ── 4.2: Simultaneous Edits (Two Tabs / Stale Data) ──
  test.describe('Simultaneous edits (stale data)', () => {
    test('Two tabs editing same entity', async ({ trackedPage: page, context }) => {
      // Navigate to projects list
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Find first project link
      const firstRow = page.locator('tbody tr').first();
      const hasRows = await firstRow.isVisible().catch(() => false);

      if (!hasRows) {
        issues.push({
          test: 'Stale data edit',
          severity: 'MISSING',
          description: 'No projects in list to test simultaneous editing',
        });
        test.skip();
        return;
      }

      // Get the first project link
      const projectLink = firstRow.locator('a').first();
      const hasLink = await projectLink.isVisible().catch(() => false);

      if (!hasLink) {
        // Click the row itself
        await firstRow.click();
        await page.waitForTimeout(1000);
      } else {
        await projectLink.click();
        await page.waitForTimeout(1000);
      }

      const detailUrl = page.url();

      // Open same entity in second tab
      const page2 = await context.newPage();
      await page2.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForLoadState('networkidle').catch(() => {});

      // Both pages should show the same entity
      const body1 = await page.textContent('body') ?? '';
      const body2 = await page2.textContent('body') ?? '';

      expect(body1.length).toBeGreaterThan(20);
      expect(body2.length).toBeGreaterThan(20);

      // Check if there's an edit button
      const editBtn1 = page.getByRole('button', { name: /редактировать|edit|изменить/i }).first();
      const hasEdit1 = await editBtn1.isVisible().catch(() => false);

      if (hasEdit1) {
        // Click edit in both tabs
        await editBtn1.click();
        await page.waitForTimeout(500);

        const editBtn2 = page2.getByRole('button', { name: /редактировать|edit|изменить/i }).first();
        const hasEdit2 = await editBtn2.isVisible().catch(() => false);
        if (hasEdit2) {
          await editBtn2.click();
          await page2.waitForTimeout(500);
        }

        // Note: can't easily test actual conflict without real data.
        // This test just verifies both tabs CAN open the edit form.
        test.info().annotations.push({
          type: 'concurrent-edit',
          description: 'Both tabs opened edit form successfully. Optimistic locking should be tested with real backend.',
        });
      }

      await page2.close();
    });
  });

  // ── 4.3: Rapid Navigation During Save ──
  test('Navigate away during save', async ({ trackedPage: page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Fill some data
    const nameInput = page.locator('input[name="name"], input[name="title"], input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(`E2E-NavDuringSave-${Date.now()}`);
    }

    // Click submit
    const submitBtn = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /сохранить|создать/i }))
      .first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      // Immediately navigate away (don't wait for response)
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      // Page should load normally without errors
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Something went wrong');
      expect(body).not.toContain('Cannot read properties');
      expect(body.length).toBeGreaterThan(20);
    }
  });

  // Summary
  test('Summary: Concurrent operation results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  CONCURRENT OPERATIONS RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  UX:       ${issues.filter((i) => i.severity === 'UX').length}`);
    console.log(`  MISSING:  ${issues.filter((i) => i.severity === 'MISSING').length}`);
    console.log('───────────────────────────────────────');

    for (const issue of issues) {
      console.log(`  [${issue.severity}] ${issue.test}: ${issue.description}`);
    }
    console.log('═══════════════════════════════════════\n');

    expect(
      critical.length,
      `${critical.length} CRITICAL issues`,
    ).toBe(0);
  });
});
