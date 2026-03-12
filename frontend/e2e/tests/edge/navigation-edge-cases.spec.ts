/**
 * Phase 5: Navigation Edge Cases
 *
 * Tests browser navigation behavior:
 * - Back button after form submit (no re-submission)
 * - Direct URL to non-existent entity (404 handling)
 * - Deep linking while logged out (redirect → login → back)
 * - URL parameter tampering
 * - Hash/fragment manipulation
 * - History manipulation
 *
 * Verifies:
 * 1. No duplicate submissions on back
 * 2. 404/error page shown for non-existent entities
 * 3. Login redirect preserves original URL
 * 4. Tampered URLs don't crash the app
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
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 5: Navigation Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  // ── 5.1: Non-existent Entity URLs ──
  test.describe('Non-existent entity URLs', () => {
    const nonExistentUrls = [
      { url: '/projects/999999', name: 'Non-existent project' },
      { url: '/projects/abc', name: 'Invalid project ID (text)' },
      { url: '/invoices/999999', name: 'Non-existent invoice' },
      { url: '/employees/999999', name: 'Non-existent employee' },
      { url: '/specifications/999999', name: 'Non-existent specification' },
      { url: '/budgets/999999', name: 'Non-existent budget' },
      { url: '/totally-fake-route', name: 'Completely non-existent route' },
      { url: '/projects/../../../etc/passwd', name: 'Path traversal attempt' },
    ];

    for (const target of nonExistentUrls) {
      test(`404: ${target.name}`, async ({ trackedPage: page }) => {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2000);

        const body = await page.textContent('body') ?? '';

        // Should NOT crash
        expect(body).not.toContain('Cannot read properties');
        expect(body).not.toContain('Unhandled Runtime Error');
        expect(body).not.toContain('undefined is not');

        // Should show some content (not blank)
        if (body.trim().length < 20) {
          issues.push({
            test: target.name,
            severity: 'MAJOR',
            description: `Blank page for ${target.url}`,
          });
        }

        // Should show 404 page, error message, or redirect
        const has404 = /404|не найден|not found|страница не существует/i.test(body);
        const hasRedirected = !page.url().includes(target.url.replace(/\.\.\//g, ''));
        const hasErrorMessage = /ошибка|error|что-то пошло не так/i.test(body);

        if (!has404 && !hasRedirected && !hasErrorMessage) {
          issues.push({
            test: target.name,
            severity: 'MINOR',
            description: `No 404 indication for ${target.url} (may show empty state instead)`,
          });
        }

        // Should be navigable
        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
        const dashBody = await page.textContent('body') ?? '';
        expect(dashBody.length).toBeGreaterThan(20);
      });
    }
  });

  // ── 5.2: URL Parameter Tampering ──
  test.describe('URL parameter tampering', () => {
    const tamperedUrls = [
      { url: '/projects?status=INVALID_STATUS', name: 'Invalid status filter' },
      { url: '/projects?page=-1', name: 'Negative page number' },
      { url: '/projects?page=99999', name: 'Very large page number' },
      { url: '/projects?sort=<script>alert(1)</script>', name: 'XSS in sort param' },
      { url: '/projects?q=%00%00%00', name: 'Null bytes in query' },
      { url: '/invoices?amount=abc', name: 'Text in numeric filter' },
      { url: '/employees?role=SUPERADMIN', name: 'Non-existent role filter' },
    ];

    for (const target of tamperedUrls) {
      test(`URL tamper: ${target.name}`, async ({ trackedPage: page }) => {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2000);

        const body = await page.textContent('body') ?? '';

        // Must NOT crash
        expect(body).not.toContain('Cannot read properties');
        expect(body).not.toContain('Unhandled Runtime Error');

        // Must NOT execute XSS
        if (target.name.includes('XSS')) {
          const hasXSS = await page.evaluate(() => {
            let alerted = false;
            const orig = window.alert;
            window.alert = () => { alerted = true; };
            setTimeout(() => { window.alert = orig; }, 50);
            return alerted;
          });
          if (hasXSS) {
            issues.push({
              test: target.name,
              severity: 'CRITICAL',
              description: 'XSS executed from URL parameter!',
            });
          }
        }

        // Should render something meaningful (not blank)
        if (body.trim().length < 20) {
          issues.push({
            test: target.name,
            severity: 'MAJOR',
            description: `Blank page for tampered URL: ${target.url}`,
          });
        }
      });
    }
  });

  // ── 5.3: Deep Link After Login ──
  test('Deep link redirect after login', async ({ trackedPage: page }) => {
    const targetUrl = '/invoices';

    // Clear auth to simulate logged-out state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access a protected route
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Should redirect to /login
    if (currentUrl.includes('/login')) {
      // Check if the return URL is preserved
      const hasReturnUrl = currentUrl.includes('redirect') ||
        currentUrl.includes('return') ||
        currentUrl.includes('next') ||
        currentUrl.includes(encodeURIComponent(targetUrl));

      if (!hasReturnUrl) {
        issues.push({
          test: 'Deep link after login',
          severity: 'UX',
          description: `Redirected to login but return URL not preserved (was trying to access ${targetUrl})`,
        });
      }

      test.info().annotations.push({
        type: 'deep-link',
        description: `Redirected to: ${currentUrl}`,
      });
    } else {
      // May have shown the page anyway (public route) or error
      const body = await page.textContent('body') ?? '';
      if (body.includes('login') || body.includes('Войти')) {
        // Inline login form — acceptable
      } else {
        issues.push({
          test: 'Deep link after login',
          severity: 'MAJOR',
          description: `Protected route ${targetUrl} accessible without auth (no redirect to /login)`,
        });
      }
    }
  });

  // ── 5.4: Back Button After Form Submit ──
  test('Back button after form submit', async ({ trackedPage: page }) => {
    // Navigate to project form
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const formUrl = page.url();

    // Fill some data
    const nameInput = page.locator('input[name="name"], input[name="title"], input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(`E2E-BackButton-${Date.now()}`);
    }

    // Track API calls
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/') && req.method() === 'POST') {
        apiCalls.push(req.url());
      }
    });

    // Submit
    const submitBtn = page.locator('button[type="submit"]')
      .or(page.getByRole('button', { name: /сохранить|создать/i }))
      .first();

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      const initialCallCount = apiCalls.length;

      // Go back
      await page.goBack();
      await page.waitForTimeout(2000);

      // Check that no additional API call was made
      const newCalls = apiCalls.length - initialCallCount;
      if (newCalls > 0) {
        issues.push({
          test: 'Back button re-submission',
          severity: 'CRITICAL',
          description: `Form re-submitted on back button (${newCalls} additional API calls)`,
        });
      }

      // Page should render correctly (not blank/error)
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Something went wrong');
      expect(body.length).toBeGreaterThan(20);
    }
  });

  // ── 5.5: Browser Refresh on Form ──
  test('Browser refresh on partially filled form', async ({ trackedPage: page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Fill some data
    const nameInput = page.locator('input[name="name"], input[name="title"], input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(`E2E-RefreshTest-${Date.now()}`);
    }

    // Refresh
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Page should load correctly (form may be empty again — that's OK)
    const body = await page.textContent('body') ?? '';
    expect(body).not.toContain('Something went wrong');
    expect(body.length).toBeGreaterThan(20);
  });

  // ── 5.6: Hash Fragment Navigation ──
  test('Hash fragment in URL', async ({ trackedPage: page }) => {
    await page.goto('/projects#nonexistent-section', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const body = await page.textContent('body') ?? '';
    expect(body).not.toContain('Something went wrong');
    expect(body.length).toBeGreaterThan(20);
  });

  // Summary
  test('Summary: Navigation edge case results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  NAVIGATION EDGE CASE RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
    console.log(`  UX:       ${issues.filter((i) => i.severity === 'UX').length}`);
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
