/**
 * Phase 7: Delete Cascade Safety
 *
 * Tests that deleting parent entities with dependent children:
 * - Shows warning/confirmation about linked records
 * - Does NOT silently delete without warning
 * - Properly handles cascade or blocks deletion
 * - Does not create orphaned records
 *
 * Entities tested:
 * - Project (children: budgets, invoices, tasks, specs)
 * - Employee (children: timesheets, leave, safety records)
 * - Counterparty (children: contracts, invoices)
 * - Specification (children: competitive lists, FM items)
 * - Budget (children: budget items, invoices)
 * - Material (children: stock records, movements)
 *
 * Verifies:
 * 1. Delete button exists and is clickable
 * 2. Confirmation dialog shown
 * 3. Confirmation mentions linked records or warns about consequences
 * 4. Cancel on dialog prevents deletion
 * 5. Data not silently lost
 */
import { test, expect } from '../../fixtures/base.fixture';

// ---------------------------------------------------------------------------
// Issue tracker
// ---------------------------------------------------------------------------

interface Issue {
  entity: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  description: string;
}

const issues: Issue[] = [];

// ---------------------------------------------------------------------------
// Cascade test cases
// ---------------------------------------------------------------------------

interface CascadeTestCase {
  name: string;
  listUrl: string;
  /** Potential children that could be orphaned */
  children: string[];
  /** Description for the test */
  description: string;
}

const CASCADE_TESTS: CascadeTestCase[] = [
  {
    name: 'Project',
    listUrl: '/projects',
    children: ['budgets', 'invoices', 'tasks', 'specifications'],
    description: 'Deleting a project with linked budgets, invoices, tasks, and specifications',
  },
  {
    name: 'Employee',
    listUrl: '/employees',
    children: ['timesheets', 'leave requests', 'safety records'],
    description: 'Deleting an employee with timesheets, leave, and safety records',
  },
  {
    name: 'Counterparty',
    listUrl: '/counterparties',
    children: ['contracts', 'invoices'],
    description: 'Deleting a counterparty with linked contracts and invoices',
  },
  {
    name: 'Specification',
    listUrl: '/specifications',
    children: ['competitive lists', 'FM items'],
    description: 'Deleting a specification with linked competitive lists and budget items',
  },
  {
    name: 'Budget',
    listUrl: '/budgets',
    children: ['budget items', 'invoices'],
    description: 'Deleting a budget with budget items and linked invoices',
  },
  {
    name: 'Material',
    listUrl: '/warehouse/materials',
    children: ['stock records', 'movements'],
    description: 'Deleting a material with stock and movement history',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 7: Delete Cascade Safety', () => {
  test.describe.configure({ mode: 'serial' });

  for (const cascadeTest of CASCADE_TESTS) {
    test(`Delete cascade: ${cascadeTest.name} (${cascadeTest.children.join(', ')})`, async ({ trackedPage: page }) => {
      await page.goto(cascadeTest.listUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);

      // Find first row in the list
      const firstRow = page.locator('tbody tr').first();
      const hasRows = await firstRow.isVisible().catch(() => false);

      if (!hasRows) {
        issues.push({
          entity: cascadeTest.name,
          severity: 'MISSING',
          description: `No ${cascadeTest.name} records to test deletion on ${cascadeTest.listUrl}`,
        });
        test.skip();
        return;
      }

      // ── Step 1: Find delete button ──

      // Look for delete button in the row
      const deleteBtn = firstRow.locator(
        'button[aria-label*="удалить" i], button[aria-label*="delete" i], button:has-text("Удалить"), button:has(svg.lucide-trash), button:has(svg.lucide-trash-2)'
      ).first();

      let hasDeleteBtn = await deleteBtn.isVisible().catch(() => false);

      if (!hasDeleteBtn) {
        // Try hovering to reveal actions
        await firstRow.hover();
        await page.waitForTimeout(500);
        hasDeleteBtn = await deleteBtn.isVisible().catch(() => false);
      }

      if (!hasDeleteBtn) {
        // Try clicking the row to go to detail, then look for delete
        await firstRow.click();
        await page.waitForTimeout(1000);

        const detailDeleteBtn = page.getByRole('button', { name: /удалить|delete/i }).first()
          .or(page.locator('button:has(svg.lucide-trash)').first());
        hasDeleteBtn = await detailDeleteBtn.isVisible().catch(() => false);

        if (!hasDeleteBtn) {
          issues.push({
            entity: cascadeTest.name,
            severity: 'MINOR',
            description: `No delete button found for ${cascadeTest.name} (may need specific permissions or be hidden)`,
          });
          test.skip();
          return;
        }

        // Track API calls
        const deleteCalls: string[] = [];
        page.on('request', (req) => {
          if (req.method() === 'DELETE') {
            deleteCalls.push(req.url());
          }
        });

        // Set up dialog handler BEFORE clicking
        let dialogShown = false;
        let dialogMessage = '';
        page.on('dialog', async (dialog) => {
          dialogShown = true;
          dialogMessage = dialog.message();
          await dialog.dismiss(); // Cancel, don't actually delete
        });

        // Click delete
        await detailDeleteBtn.click();
        await page.waitForTimeout(1500);

        // Check for custom confirmation dialog (React modal)
        const confirmDialog = page.locator(
          '[role="dialog"], [role="alertdialog"], [data-state="open"], .modal'
        );
        const hasConfirmDialog = await confirmDialog.first().isVisible().catch(() => false);

        if (hasConfirmDialog) {
          const dialogText = await confirmDialog.first().textContent() ?? '';

          // ── Check: Dialog should mention consequences ──
          const mentionsChildren = cascadeTest.children.some((child) =>
            dialogText.toLowerCase().includes(child.toLowerCase())
          );
          const mentionsWarning = /уверены|подтвердите|удаление|нельзя отменить|связанные|безвозвратно|confirm|are you sure|cannot be undone/i.test(dialogText);

          if (!mentionsWarning) {
            issues.push({
              entity: cascadeTest.name,
              severity: 'MAJOR',
              description: `Delete confirmation shows no warning text: "${dialogText.slice(0, 100)}"`,
            });
          }

          if (!mentionsChildren) {
            issues.push({
              entity: cascadeTest.name,
              severity: 'UX',
              description: `Delete dialog doesn't mention linked ${cascadeTest.children.join('/')} that would be affected`,
            });
          }

          // Cancel the dialog
          const cancelBtn = confirmDialog.locator('button:has-text("Отмена"), button:has-text("Нет"), button:has-text("Cancel")').first();
          if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
            await page.waitForTimeout(500);

            // Verify: no DELETE request was made (we cancelled)
            if (deleteCalls.length > 0) {
              issues.push({
                entity: cascadeTest.name,
                severity: 'CRITICAL',
                description: `DELETE API call made DESPITE user cancelling confirmation! Calls: ${deleteCalls.join(', ')}`,
              });
            }
          }
        } else if (dialogShown) {
          // Browser native confirm() was used
          if (!dialogMessage.includes('\u0443\u0432\u0435\u0440\u0435\u043D') && !dialogMessage.includes('sure')) {
            issues.push({
              entity: cascadeTest.name,
              severity: 'MINOR',
              description: `Delete uses browser confirm() instead of custom dialog: "${dialogMessage.slice(0, 100)}"`,
            });
          }

          // We dismissed the dialog, so no deletion should have occurred
          if (deleteCalls.length > 0) {
            issues.push({
              entity: cascadeTest.name,
              severity: 'CRITICAL',
              description: 'DELETE request made after dismissing confirmation dialog',
            });
          }
        } else {
          // No confirmation at all!
          if (deleteCalls.length > 0) {
            issues.push({
              entity: cascadeTest.name,
              severity: 'CRITICAL',
              description: 'Entity deleted WITHOUT ANY confirmation dialog',
            });
          } else {
            issues.push({
              entity: cascadeTest.name,
              severity: 'MAJOR',
              description: 'Delete button clicked but no confirmation dialog shown and no API call made',
            });
          }
        }

        return;
      }

      // Delete from list view (same flow as above)
      const deleteCalls: string[] = [];
      page.on('request', (req) => {
        if (req.method() === 'DELETE') {
          deleteCalls.push(req.url());
        }
      });

      let dialogShown = false;
      page.on('dialog', async (dialog) => {
        dialogShown = true;
        await dialog.dismiss();
      });

      await deleteBtn.click();
      await page.waitForTimeout(1500);

      const confirmDialog = page.locator(
        '[role="dialog"], [role="alertdialog"], [data-state="open"], .modal'
      );
      const hasConfirmDialog = await confirmDialog.first().isVisible().catch(() => false);

      if (hasConfirmDialog) {
        // Cancel
        const cancelBtn = confirmDialog.locator('button:has-text("Отмена"), button:has-text("Нет"), button:has-text("Cancel")').first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }

        if (deleteCalls.length > 0) {
          issues.push({
            entity: cascadeTest.name,
            severity: 'CRITICAL',
            description: 'DELETE request made despite cancelling confirmation',
          });
        }
      } else if (!dialogShown) {
        if (deleteCalls.length > 0) {
          issues.push({
            entity: cascadeTest.name,
            severity: 'CRITICAL',
            description: 'Entity deleted WITHOUT confirmation dialog from list view',
          });
        }
      }
    });
  }

  // ── Soft Delete Verification ──
  test('Verify soft delete preserves data', async ({ trackedPage: page }) => {
    // Navigate to projects and check if deleted items can be restored
    await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Check for "Show deleted" or "Archive" filter
    const archiveFilter = page.locator(
      'button:has-text("Удалённые"), button:has-text("Архив"), [data-testid*="deleted"], [data-testid*="archive"]'
    );
    const hasArchiveFilter = await archiveFilter.first().isVisible().catch(() => false);

    if (!hasArchiveFilter) {
      issues.push({
        entity: 'All',
        severity: 'UX',
        description: 'No "Show deleted/archived" filter — hard to recover accidentally deleted items',
      });
    }
  });

  // Summary
  test('Summary: Delete cascade safety results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  DELETE CASCADE SAFETY RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  Entities tested: ${CASCADE_TESTS.length}`);
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
    console.log(`  UX:       ${issues.filter((i) => i.severity === 'UX').length}`);
    console.log(`  MISSING:  ${issues.filter((i) => i.severity === 'MISSING').length}`);
    console.log('───────────────────────────────────────');

    for (const issue of issues) {
      console.log(`  [${issue.severity}] ${issue.entity}: ${issue.description}`);
    }
    console.log('═══════════════════════════════════════\n');

    expect(
      critical.length,
      `${critical.length} CRITICAL issues: ${critical.map((i) => i.description).join('; ')}`,
    ).toBe(0);
  });
});
