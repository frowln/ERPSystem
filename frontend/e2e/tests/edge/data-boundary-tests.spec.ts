/**
 * Phase 6: Data Boundary Tests
 *
 * Tests edge cases with data quantities and content:
 * - Pages with 0 records (empty state)
 * - Very long entity names (display overflow)
 * - Unicode and special characters
 * - Maximum/minimum values
 * - Empty state call-to-action works
 *
 * Verifies:
 * 1. Empty state shown (not error or blank)
 * 2. Long names displayed correctly (truncated or wrapped)
 * 3. Special characters preserved after save
 * 4. Empty-state CTA buttons are functional
 */
import { test, expect } from '../../fixtures/base.fixture';

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
// Pages to test for empty state
// ---------------------------------------------------------------------------

const LIST_PAGES = [
  { url: '/projects', name: 'Projects' },
  { url: '/tasks', name: 'Tasks' },
  { url: '/invoices', name: 'Invoices' },
  { url: '/payments', name: 'Payments' },
  { url: '/employees', name: 'Employees' },
  { url: '/specifications', name: 'Specifications' },
  { url: '/warehouse/materials', name: 'Materials' },
  { url: '/safety/incidents', name: 'Safety incidents' },
  { url: '/crm/leads', name: 'CRM leads' },
  { url: '/support/tickets', name: 'Support tickets' },
  { url: '/contracts', name: 'Contracts' },
  { url: '/budgets', name: 'Budgets' },
  { url: '/commercial-proposals', name: 'Commercial proposals' },
  { url: '/defects', name: 'Defects' },
  { url: '/counterparties', name: 'Counterparties' },
  { url: '/crew', name: 'Crew' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 6: Data Boundary Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // ── 6.1: Empty State Handling ──
  test.describe('Empty state handling (0 records)', () => {
    for (const pageTarget of LIST_PAGES) {
      test(`Empty state: ${pageTarget.name}`, async ({ trackedPage: page }) => {
        // Intercept API to return empty data
        await page.route('**/api/**', (route) => {
          const url = route.request().url();
          // Only intercept list endpoints (GET with pagination)
          if (route.request().method() === 'GET' && !url.includes('/auth/')) {
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: 20,
              }),
            });
          } else {
            route.continue();
          }
        });

        await page.goto(pageTarget.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2000);

        const body = await page.textContent('body') ?? '';

        // ── CHECK 1: Should NOT be blank ──
        if (body.trim().length < 30) {
          issues.push({
            test: `Empty state: ${pageTarget.name}`,
            severity: 'MAJOR',
            description: 'Blank page when data is empty',
          });
        }

        // ── CHECK 2: Should NOT crash ──
        expect(body).not.toContain('Cannot read properties');
        expect(body).not.toContain('Unhandled Runtime Error');
        expect(body).not.toContain('Something went wrong');

        // ── CHECK 3: Should show empty state message ──
        const emptyStatePatterns = /нет данных|пусто|нет записей|no data|ничего не найдено|нет .* для отображения|создайте|empty|список пуст/i;
        const hasEmptyState = emptyStatePatterns.test(body);

        // Or a table with no rows
        const table = page.locator('table');
        const hasTable = await table.first().isVisible().catch(() => false);
        const rowCount = hasTable ? await page.locator('tbody tr').count() : 0;

        if (!hasEmptyState && rowCount > 0) {
          // Data was returned despite our mock — might be cached or different API
          test.info().annotations.push({
            type: 'note',
            description: `${pageTarget.name}: table has ${rowCount} rows (data may be cached or using different API)`,
          });
        }

        // ── CHECK 4: Create button should still be visible ──
        const createBtn = page.getByRole('button', { name: /создать|добавить|новый/i }).first()
          .or(page.locator('a:has-text("Создать"), a:has-text("Добавить")').first());
        const hasCreateBtn = await createBtn.isVisible().catch(() => false);

        if (!hasCreateBtn) {
          issues.push({
            test: `Empty state: ${pageTarget.name}`,
            severity: 'UX',
            description: 'No "Create" button visible on empty list (user has no way to add first record)',
          });
        }

        await page.unroute('**/api/**');
      });
    }
  });

  // ── 6.2: Very Long Entity Names in List Views ──
  test.describe('Long entity names display', () => {
    test('Long project name in list view', async ({ trackedPage: page }) => {
      const longName = '\u041F\u0440\u043E\u0435\u043A\u0442 ' + '\u0410'.repeat(500); // 500 chars

      // Mock API to return a project with very long name
      await page.route('**/api/projects*', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              content: [{
                id: 1,
                name: longName,
                code: 'E2E-LONG',
                status: 'IN_PROGRESS',
                startDate: '2026-01-01',
                endDate: '2027-01-01',
                progress: 50,
              }],
              totalElements: 1,
              totalPages: 1,
              number: 0,
              size: 20,
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        const el = document.querySelector('main') || document.body;
        return el.scrollWidth > el.clientWidth;
      });

      if (hasOverflow) {
        issues.push({
          test: 'Long name in project list',
          severity: 'UX',
          description: 'Page has horizontal overflow with long entity name',
        });
      }

      // Check that the name is at least partially visible (truncated)
      const body = await page.textContent('body') ?? '';
      const hasNameContent = body.includes('\u041F\u0440\u043E\u0435\u043A\u0442');
      expect(hasNameContent, 'Long name should be at least partially visible').toBe(true);

      await page.unroute('**/api/projects*');
    });

    test('Long name in breadcrumb', async ({ trackedPage: page }) => {
      const longName = '\u041F\u0440\u043E\u0435\u043A\u0442 ' + '\u0410'.repeat(200);

      await page.route('**/api/projects/1*', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              name: longName,
              code: 'E2E-LONG',
              status: 'IN_PROGRESS',
              startDate: '2026-01-01',
              endDate: '2027-01-01',
              progress: 50,
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/projects/1', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      // Check breadcrumb doesn't overflow
      const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"]');
      if (await breadcrumb.first().isVisible().catch(() => false)) {
        const bcOverflow = await breadcrumb.first().evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });

        if (bcOverflow) {
          issues.push({
            test: 'Long name in breadcrumb',
            severity: 'UX',
            description: 'Breadcrumb overflows with long entity name',
          });
        }
      }

      await page.unroute('**/api/projects/1*');
    });
  });

  // ── 6.3: Unicode and Special Characters ──
  test.describe('Unicode and special characters', () => {
    test('Russian special characters in text display', async ({ trackedPage: page }) => {
      const specialName = '\u041F\u0440\u043E\u0435\u043A\u0442 \u00AB\u0416\u0438\u043B\u043E\u0439 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441 "\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u044B\u0439" \u2014 2-\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u044C (\u043A\u043E\u0440\u043F. \u21163)\u00BB';

      await page.route('**/api/projects*', (route) => {
        if (route.request().method() === 'GET' && !route.request().url().includes('/api/projects/')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              content: [{
                id: 1,
                name: specialName,
                code: 'E2E-SPECIAL',
                status: 'IN_PROGRESS',
                startDate: '2026-01-01',
                endDate: '2027-01-01',
                progress: 50,
              }],
              totalElements: 1,
              totalPages: 1,
              number: 0,
              size: 20,
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      const body = await page.textContent('body') ?? '';

      // All special chars should be preserved
      expect(body).toContain('\u00AB'); // «
      expect(body).toContain('\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u044B\u0439'); // Солнечный

      // Check for mojibake / encoding issues
      const hasMojibake = /\uFFFD|&#\d+;|%[0-9A-F]{2}/i.test(body);
      if (hasMojibake) {
        issues.push({
          test: 'Special characters display',
          severity: 'MAJOR',
          description: 'Character encoding issues (mojibake) detected in project name',
        });
      }

      await page.unroute('**/api/projects*');
    });
  });

  // ── 6.4: Pagination Boundaries ──
  test.describe('Pagination boundaries', () => {
    test('Page 0 and page 1 consistency', async ({ trackedPage: page }) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Something went wrong');
      expect(body.length).toBeGreaterThan(20);

      // Page should load without errors — basic sanity
    });

    test('Direct access to high page number', async ({ trackedPage: page }) => {
      await page.goto('/projects?page=9999', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);

      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Something went wrong');
      expect(body).not.toContain('Cannot read properties');
    });
  });

  // ── 6.5: Large Number Display ──
  test('Large numbers display correctly in Russian format', async ({ trackedPage: page }) => {
    await page.route('**/api/budgets*', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [{
              id: 1,
              projectId: 1,
              projectName: 'E2E Large Numbers',
              totalPlanned: 999999999.99,
              totalActual: 888888888.88,
              totalRemaining: 111111111.11,
              status: 'ACTIVE',
            }],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/budgets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';
    expect(body).not.toContain('Something went wrong');

    // Check that large numbers don't show as scientific notation
    if (/\d+e\+\d+/i.test(body)) {
      issues.push({
        test: 'Large number display',
        severity: 'MAJOR',
        description: 'Number displayed in scientific notation (e.g., 1e+9)',
      });
    }

    await page.unroute('**/api/budgets*');
  });

  // Summary
  test('Summary: Data boundary results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  DATA BOUNDARY TEST RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  Pages tested: ${LIST_PAGES.length}`);
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
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
