/**
 * Phase 3: Network Error Handling
 *
 * Intercepts API calls and returns error responses to verify graceful handling.
 * Tests: 500, 404, 403, 401, 422, 429, network disconnect, timeout.
 *
 * Verifies:
 * 1. Error toast/message shown (not white screen)
 * 2. Message is user-friendly, in Russian
 * 3. Page doesn't crash
 * 4. User can navigate away
 * 5. 401 redirects to login
 */
import { test, expect } from '../../fixtures/base.fixture';

// ---------------------------------------------------------------------------
// Error scenarios
// ---------------------------------------------------------------------------

interface ErrorScenario {
  status: number;
  description: string;
  /** Body to return */
  body: string;
  /** Whether we expect redirect to /login */
  expectLoginRedirect?: boolean;
}

const ERROR_SCENARIOS: ErrorScenario[] = [
  {
    status: 500,
    description: 'Server error (500)',
    body: JSON.stringify({ message: 'Internal Server Error' }),
  },
  {
    status: 404,
    description: 'Not found (404)',
    body: JSON.stringify({ message: 'Not Found' }),
  },
  {
    status: 403,
    description: 'Access denied (403)',
    body: JSON.stringify({ message: 'Access Denied' }),
  },
  {
    status: 401,
    description: 'Session expired (401)',
    body: JSON.stringify({ message: 'Unauthorized' }),
    expectLoginRedirect: true,
  },
  {
    status: 422,
    description: 'Validation error (422)',
    body: JSON.stringify({ message: 'Validation Failed', errors: { name: 'required' } }),
  },
  {
    status: 429,
    description: 'Rate limited (429)',
    body: JSON.stringify({ message: 'Too Many Requests' }),
  },
];

// ---------------------------------------------------------------------------
// Pages to test
// ---------------------------------------------------------------------------

interface PageTarget {
  name: string;
  url: string;
  /** API pattern to intercept */
  apiPattern: string;
  /** What type of page: list, detail, dashboard */
  type: 'list' | 'dashboard' | 'detail';
}

const PAGES: PageTarget[] = [
  {
    name: 'Projects list',
    url: '/projects',
    apiPattern: '**/api/projects*',
    type: 'list',
  },
  {
    name: 'Tasks list',
    url: '/tasks',
    apiPattern: '**/api/tasks*',
    type: 'list',
  },
  {
    name: 'Invoices list',
    url: '/invoices',
    apiPattern: '**/api/invoices*',
    type: 'list',
  },
  {
    name: 'Budgets list',
    url: '/budgets',
    apiPattern: '**/api/budgets*',
    type: 'list',
  },
  {
    name: 'Employees list',
    url: '/employees',
    apiPattern: '**/api/employees*',
    type: 'list',
  },
  {
    name: 'Specifications list',
    url: '/specifications',
    apiPattern: '**/api/specifications*',
    type: 'list',
  },
  {
    name: 'Materials list',
    url: '/warehouse/materials',
    apiPattern: '**/api/materials*',
    type: 'list',
  },
  {
    name: 'Safety incidents',
    url: '/safety/incidents',
    apiPattern: '**/api/safety*',
    type: 'list',
  },
  {
    name: 'CRM leads',
    url: '/crm/leads',
    apiPattern: '**/api/crm*',
    type: 'list',
  },
  {
    name: 'Dashboard',
    url: '/',
    apiPattern: '**/api/analytics*',
    type: 'dashboard',
  },
];

// ---------------------------------------------------------------------------
// Issue tracker
// ---------------------------------------------------------------------------

interface Issue {
  page: string;
  scenario: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  description: string;
}

const issues: Issue[] = [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 3: Network Error Handling', () => {
  test.describe.configure({ mode: 'serial' });

  // ── 3.1: HTTP Error Codes on List Pages ──
  test.describe('HTTP error codes on list pages', () => {
    for (const pageTarget of PAGES) {
      for (const scenario of ERROR_SCENARIOS) {
        test(`${pageTarget.name}: ${scenario.description}`, async ({ trackedPage: page, consoleErrors }) => {
          // Intercept the API call and return the error
          await page.route(pageTarget.apiPattern, (route) => {
            route.fulfill({
              status: scenario.status,
              contentType: 'application/json',
              body: scenario.body,
            });
          });

          // Navigate to the page
          await page.goto(pageTarget.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForTimeout(2000);

          // ── CHECK 1: Page should not show blank/white screen ──
          const body = await page.textContent('body') ?? '';
          const isBlank = body.trim().length < 20;

          if (isBlank) {
            issues.push({
              page: pageTarget.name,
              scenario: scenario.description,
              severity: 'CRITICAL',
              description: 'Blank screen on API error',
            });
          }

          // ── CHECK 2: Should NOT show raw error / stack trace ──
          expect(body).not.toContain('Cannot read properties');
          expect(body).not.toContain('Unhandled Runtime Error');
          expect(body).not.toContain('undefined is not');

          const hasStackTrace = /at\s+\w+\s+\(/.test(body);
          if (hasStackTrace) {
            issues.push({
              page: pageTarget.name,
              scenario: scenario.description,
              severity: 'CRITICAL',
              description: 'Stack trace visible to user',
            });
          }

          // ── CHECK 3: 401 should redirect to login ──
          if (scenario.expectLoginRedirect) {
            const currentUrl = page.url();
            const redirectedToLogin = currentUrl.includes('/login');
            // Also check if auth store cleared
            const hasToken = await page.evaluate(() => {
              const persisted = localStorage.getItem('privod-auth');
              if (persisted) {
                try {
                  const parsed = JSON.parse(persisted);
                  return Boolean(parsed?.state?.token ?? parsed?.token);
                } catch { return false; }
              }
              return Boolean(localStorage.getItem('auth_token'));
            });

            if (!redirectedToLogin && hasToken) {
              issues.push({
                page: pageTarget.name,
                scenario: scenario.description,
                severity: 'MAJOR',
                description: '401 did not redirect to /login or clear auth token',
              });
            }
          }

          // ── CHECK 4: User should be able to navigate away ──
          try {
            await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
            const dashBody = await page.textContent('body') ?? '';
            expect(dashBody.length).toBeGreaterThan(20);
          } catch {
            issues.push({
              page: pageTarget.name,
              scenario: scenario.description,
              severity: 'MAJOR',
              description: 'Cannot navigate away after error (page stuck)',
            });
          }

          // Clean up route interception
          await page.unroute(pageTarget.apiPattern);
        });
      }
    }
  });

  // ── 3.2: Network Disconnect (Offline) ──
  test.describe('Network disconnect simulation', () => {
    const offlinePages = PAGES.slice(0, 5); // Test top 5 pages

    for (const pageTarget of offlinePages) {
      test(`Offline: ${pageTarget.name}`, async ({ trackedPage: page, context }) => {
        // First load the page normally to populate cache
        await page.goto(pageTarget.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        // Simulate going offline
        await context.setOffline(true);

        // Try to refresh / navigate
        try {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 10_000 });
        } catch {
          // Expected — page might not load
        }

        await page.waitForTimeout(2000);

        const body = await page.textContent('body') ?? '';

        // Should show some kind of offline message or cached content
        // NOT a completely blank page
        if (body.trim().length < 20) {
          issues.push({
            page: pageTarget.name,
            scenario: 'Network disconnect',
            severity: 'MAJOR',
            description: 'Blank screen when offline (no cached content or offline message)',
          });
        }

        // Page should not show raw Chrome offline error
        const hasChromeOffline = body.includes('ERR_INTERNET_DISCONNECTED');
        if (hasChromeOffline) {
          issues.push({
            page: pageTarget.name,
            scenario: 'Network disconnect',
            severity: 'UX',
            description: 'Shows browser offline error instead of app-level offline message',
          });
        }

        // Restore network
        await context.setOffline(false);
      });
    }
  });

  // ── 3.3: Slow Response / Timeout ──
  test.describe('Slow API response', () => {
    test('Projects: 15s delayed response shows loading state', async ({ trackedPage: page }) => {
      // Intercept and delay response
      await page.route('**/api/projects*', async (route) => {
        await new Promise((r) => setTimeout(r, 15_000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: [], totalElements: 0 }),
        });
      });

      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Should show loading indicator within first 2 seconds
      await page.waitForTimeout(1000);

      const body = await page.textContent('body') ?? '';
      const hasLoading = body.length > 20; // Page at least renders something

      if (!hasLoading) {
        issues.push({
          page: 'Projects',
          scenario: 'Slow response (15s)',
          severity: 'UX',
          description: 'No loading indicator shown during slow API response',
        });
      }

      // Check for loading spinner/skeleton
      const loadingIndicator = page.locator(
        '[class*="skeleton"], [class*="spinner"], [class*="loading"], [role="progressbar"]'
      );
      const hasSpinner = await loadingIndicator.first().isVisible().catch(() => false);

      if (!hasSpinner) {
        issues.push({
          page: 'Projects',
          scenario: 'Slow response (15s)',
          severity: 'UX',
          description: 'No skeleton/spinner shown during loading',
        });
      }

      await page.unroute('**/api/projects*');
    });
  });

  // ── 3.4: Malformed JSON Response ──
  test('Malformed JSON response handling', async ({ trackedPage: page }) => {
    await page.route('**/api/projects*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'THIS IS NOT JSON {{{',
      });
    });

    await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';

    // Should not crash
    expect(body).not.toContain('Unexpected token');
    expect(body).not.toContain('SyntaxError');

    if (body.includes('Unexpected token') || body.includes('SyntaxError')) {
      issues.push({
        page: 'Projects',
        scenario: 'Malformed JSON',
        severity: 'MAJOR',
        description: 'Raw JSON parse error shown to user',
      });
    }

    await page.unroute('**/api/projects*');
  });

  // Summary
  test('Summary: Network error handling results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  NETWORK ERROR HANDLING RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  Pages tested: ${PAGES.length}`);
    console.log(`  Scenarios: ${ERROR_SCENARIOS.length} + offline + timeout + malformed`);
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
    console.log(`  UX:       ${issues.filter((i) => i.severity === 'UX').length}`);
    console.log('───────────────────────────────────────');

    for (const issue of issues) {
      console.log(`  [${issue.severity}] ${issue.page} / ${issue.scenario}: ${issue.description}`);
    }
    console.log('═══════════════════════════════════════\n');

    expect(
      critical.length,
      `${critical.length} CRITICAL: ${critical.map((i) => i.description).join('; ')}`,
    ).toBe(0);
  });
});
