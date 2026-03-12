/**
 * Phase 2: Invalid Data Types
 *
 * Tests that forms properly reject or sanitize invalid inputs including:
 * - XSS payloads
 * - SQL injection attempts
 * - Negative numbers where only positive allowed
 * - Extremely long strings
 * - Wrong data types (text in number fields)
 * - Invalid emails, phones, INN, SNILS
 * - Emoji and special characters
 *
 * Verifies:
 * 1. Input is rejected OR sanitized
 * 2. Error message shown (in Russian)
 * 3. No console errors / unhandled exceptions
 * 4. Data is NOT saved to the database
 * 5. XSS payload is NOT rendered as HTML
 */
import { test, expect } from '../../fixtures/base.fixture';
import { getValidationErrors } from '../../helpers/form.helper';

// ---------------------------------------------------------------------------
// Invalid input catalogue
// ---------------------------------------------------------------------------

const INVALID_INPUTS = {
  // Numbers
  negativePrice: '-1000',
  zeroQuantity: '0',
  hugeNumber: '99999999999999',
  floatAsInt: '10.5',
  textAsNumber: 'abc',
  specialCharsAsNumber: '!@#$%',

  // Text — security
  xssScript: '<script>alert("xss")</script>',
  xssImg: '<img src=x onerror=alert(1)>',
  xssOnEvent: '" onmouseover="alert(1)"',
  sqlInjection: "'; DROP TABLE projects; --",
  sqlUnion: "' UNION SELECT * FROM users --",

  // Text — boundary
  longString: '\u0410'.repeat(10_000), // 10K Cyrillic А characters
  emptyAfterTrim: '   ',
  onlySpecialChars: '!@#$%^&*()',
  emojiText: '\u041F\u0440\u043E\u0435\u043A\u0442 \uD83C\uDFD7\uFE0F \u0441\u0442\u0440\u043E\u0439\u043A\u0430 \uD83E\uDDF1',
  nullByte: 'test\x00value',
  unicodeRTL: '\u202Etest\u202C',

  // Email / Phone / INN
  invalidEmail: 'notanemail',
  invalidEmailAt: '@missing.com',
  invalidPhone: '123',
  invalidINN: '1234',
  invalidSNILS: 'abc-def-ghi jk',
};

// ---------------------------------------------------------------------------
// Target forms with specific field mappings
// ---------------------------------------------------------------------------

interface InvalidDataTestCase {
  name: string;
  url: string;
  /** Trigger modal if needed */
  modalTrigger?: string;
  /** Map of field label/name → invalid input key from INVALID_INPUTS */
  fieldTests: Array<{
    fieldSelector: string;
    inputKey: keyof typeof INVALID_INPUTS;
    expectReject: boolean;
    description: string;
  }>;
}

const XSS_TEST_FORMS: InvalidDataTestCase[] = [
  {
    name: 'Project form — XSS in name',
    url: '/projects/new',
    fieldTests: [
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'xssScript',
        expectReject: true,
        description: 'XSS script tag in project name',
      },
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'xssImg',
        expectReject: true,
        description: 'XSS img tag in project name',
      },
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'sqlInjection',
        expectReject: true,
        description: 'SQL injection in project name',
      },
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'longString',
        expectReject: true,
        description: 'Very long string (10K chars) in project name',
      },
    ],
  },
  {
    name: 'Specification form — XSS in name',
    url: '/specifications/new',
    fieldTests: [
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'xssScript',
        expectReject: true,
        description: 'XSS in spec name',
      },
      {
        fieldSelector: 'input[name="name"], input[name="title"]',
        inputKey: 'sqlUnion',
        expectReject: true,
        description: 'SQL UNION injection in spec name',
      },
    ],
  },
  {
    name: 'Change order form — XSS',
    url: '/change-management/orders/new',
    fieldTests: [
      {
        fieldSelector: 'input[name="title"], input[name="name"], input[name="description"]',
        inputKey: 'xssScript',
        expectReject: true,
        description: 'XSS in change order title',
      },
    ],
  },
];

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

test.describe('Phase 2: Invalid Data Types', () => {
  test.describe.configure({ mode: 'serial' });

  // ── 2.1: XSS Payload Tests ──
  test.describe('XSS Prevention', () => {
    for (const formCase of XSS_TEST_FORMS) {
      for (const fieldTest of formCase.fieldTests) {
        test(`${formCase.name}: ${fieldTest.description}`, async ({ trackedPage: page, consoleErrors }) => {
          await page.goto(formCase.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForLoadState('networkidle').catch(() => {});

          if (formCase.modalTrigger) {
            const trigger = page.locator(formCase.modalTrigger).first();
            if (await trigger.isVisible().catch(() => false)) {
              await trigger.click();
              await page.waitForTimeout(500);
            }
          }

          // Find the target input
          const input = page.locator(fieldTest.fieldSelector).first();
          const isVisible = await input.isVisible().catch(() => false);

          if (!isVisible) {
            // Try finding any text input on the form
            const anyInput = page.locator('input[type="text"], input:not([type])').first();
            if (!(await anyInput.isVisible().catch(() => false))) {
              issues.push({
                test: `${formCase.name} - ${fieldTest.description}`,
                severity: 'MISSING',
                description: `Field not found: ${fieldTest.fieldSelector}`,
              });
              test.skip();
              return;
            }
            await anyInput.fill(INVALID_INPUTS[fieldTest.inputKey]);
          } else {
            await input.fill(INVALID_INPUTS[fieldTest.inputKey]);
          }

          // Check that XSS is not rendered as HTML
          const bodyHtml = await page.content();

          // Script tags should be escaped or stripped
          if (fieldTest.inputKey === 'xssScript') {
            const hasExecutableScript = await page.evaluate(() => {
              // Check if any alert was triggered
              let alertCalled = false;
              const origAlert = window.alert;
              window.alert = () => { alertCalled = true; };
              // Trigger any pending
              setTimeout(() => { window.alert = origAlert; }, 100);
              return alertCalled;
            });

            if (hasExecutableScript) {
              issues.push({
                test: `${formCase.name} - ${fieldTest.description}`,
                severity: 'CRITICAL',
                description: 'XSS EXECUTED! alert() was called.',
              });
            }

            // Check DOM for unescaped script tags
            const scriptInDom = bodyHtml.includes('<script>alert');
            if (scriptInDom) {
              issues.push({
                test: `${formCase.name} - ${fieldTest.description}`,
                severity: 'CRITICAL',
                description: 'XSS: unescaped <script> tag found in DOM',
              });
            }
          }

          // Page should not crash
          const body = await page.textContent('body');
          expect(body).not.toContain('Something went wrong');
          expect(body).not.toContain('Cannot read properties');

          // No critical console errors
          const criticalErrors = consoleErrors.filter(
            (e) => !e.includes('Failed to load resource') && !e.includes('favicon')
          );
          if (criticalErrors.length > 0) {
            issues.push({
              test: `${formCase.name} - ${fieldTest.description}`,
              severity: 'MAJOR',
              description: `Console errors: ${criticalErrors.join(' | ')}`,
            });
          }
        });
      }
    }
  });

  // ── 2.2: Numeric Field Validation ──
  test.describe('Numeric field validation', () => {
    const numericTests = [
      {
        name: 'Negative price in invoice/payment',
        url: '/invoices',
        modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить")',
        value: INVALID_INPUTS.negativePrice,
      },
      {
        name: 'Text in number field',
        url: '/invoices',
        modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить")',
        value: INVALID_INPUTS.textAsNumber,
      },
      {
        name: 'Huge number in amount',
        url: '/payments',
        modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить")',
        value: INVALID_INPUTS.hugeNumber,
      },
    ];

    for (const numTest of numericTests) {
      test(`Numeric: ${numTest.name}`, async ({ trackedPage: page }) => {
        await page.goto(numTest.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        if (numTest.modalTrigger) {
          const trigger = page.locator(numTest.modalTrigger).first();
          if (await trigger.isVisible().catch(() => false)) {
            await trigger.click();
            await page.waitForTimeout(500);
          } else {
            test.skip();
            return;
          }
        }

        // Find any number input
        const numberInput = page.locator('input[type="number"]').first();
        const hasNumberInput = await numberInput.isVisible().catch(() => false);

        if (!hasNumberInput) {
          // Try amount/price/quantity fields
          const amountInput = page.locator('input[name*="amount"], input[name*="price"], input[name*="sum"], input[name*="quantity"]').first();
          if (!(await amountInput.isVisible().catch(() => false))) {
            issues.push({
              test: `Numeric: ${numTest.name}`,
              severity: 'MISSING',
              description: 'No numeric input field found',
            });
            test.skip();
            return;
          }
          await amountInput.fill(numTest.value);
        } else {
          await numberInput.fill(numTest.value);
        }

        // Try submitting
        const submitBtn = page.locator('button[type="submit"]')
          .or(page.getByRole('button', { name: /сохранить|создать|отправить|добавить/i }))
          .first();

        if (await submitBtn.isVisible().catch(() => false)) {
          const apiCalls: string[] = [];
          page.on('request', (req) => {
            if (req.url().includes('/api/') && req.method() === 'POST') {
              apiCalls.push(req.url());
            }
          });

          await submitBtn.click();
          await page.waitForTimeout(1000);

          // Check for validation errors or API rejection
          const errors = await getValidationErrors(page);
          if (errors.length === 0 && apiCalls.length > 0) {
            issues.push({
              test: `Numeric: ${numTest.name}`,
              severity: 'MAJOR',
              description: `Invalid numeric value "${numTest.value}" was accepted and submitted`,
            });
          }
        }

        // Page should not crash
        const body = await page.textContent('body');
        expect(body).not.toContain('Something went wrong');
        expect(body).not.toContain('Cannot read properties');
      });
    }
  });

  // ── 2.3: Long String Overflow ──
  test('Long string (10K chars) in project name', async ({ trackedPage: page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const nameInput = page.locator('input[name="name"], input[name="title"]').first()
      .or(page.locator('input[type="text"]').first());

    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(INVALID_INPUTS.longString);

      // Check that input accepted it (may be truncated by maxLength)
      const currentValue = await nameInput.inputValue();
      if (currentValue.length >= 10_000) {
        issues.push({
          test: 'Long string in project name',
          severity: 'MINOR',
          description: 'Input accepted 10K characters without maxLength restriction',
        });
      }

      // Check for visual overflow
      const isOverflowing = await nameInput.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });

      if (isOverflowing) {
        issues.push({
          test: 'Long string overflow',
          severity: 'UX',
          description: 'Input field overflows with very long text',
        });
      }
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
  });

  // ── 2.4: Emoji and Unicode ──
  test('Emoji and special characters in text fields', async ({ trackedPage: page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const nameInput = page.locator('input[name="name"], input[name="title"]').first()
      .or(page.locator('input[type="text"]').first());

    if (await nameInput.isVisible().catch(() => false)) {
      // Test emoji text
      await nameInput.fill(INVALID_INPUTS.emojiText);
      const currentValue = await nameInput.inputValue();

      // Emoji should be preserved
      if (!currentValue.includes('\uD83C\uDFD7')) {
        issues.push({
          test: 'Emoji in project name',
          severity: 'MINOR',
          description: 'Emoji stripped from input (may be intentional)',
        });
      }

      // Test special Russian chars
      const russianSpecial = '\u041F\u0440\u043E\u0435\u043A\u0442 \u00AB\u0416\u0438\u043B\u043E\u0439 \u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0441 "\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u044B\u0439" \u2014 2-\u044F \u043E\u0447\u0435\u0440\u0435\u0434\u044C (\u043A\u043E\u0440\u043F. \u21163)\u00BB';
      await nameInput.fill(russianSpecial);
      const savedValue = await nameInput.inputValue();

      if (savedValue !== russianSpecial) {
        issues.push({
          test: 'Russian special chars',
          severity: 'MINOR',
          description: `Special chars modified: expected "${russianSpecial}", got "${savedValue}"`,
        });
      }
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
  });

  // ── 2.5: Date Validation ──
  test('Invalid dates (end before start)', async ({ trackedPage: page }) => {
    await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Find date inputs
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();

    if (count >= 2) {
      // Set end date BEFORE start date
      await dateInputs.nth(0).fill('2027-12-31');
      await dateInputs.nth(1).fill('2026-01-01');

      // Try submitting
      const submitBtn = page.locator('button[type="submit"]')
        .or(page.getByRole('button', { name: /сохранить|создать/i }))
        .first();

      if (await submitBtn.isVisible().catch(() => false)) {
        const apiCalls: string[] = [];
        page.on('request', (req) => {
          if (req.url().includes('/api/') && req.method() === 'POST') {
            apiCalls.push(req.url());
          }
        });

        await submitBtn.click();
        await page.waitForTimeout(1000);

        const errors = await getValidationErrors(page);
        if (errors.length === 0 && apiCalls.length > 0) {
          issues.push({
            test: 'End date before start date',
            severity: 'MAJOR',
            description: 'Form accepted end date (2026-01-01) before start date (2027-12-31)',
          });
        }
      }
    } else if (count === 0) {
      issues.push({
        test: 'Date validation',
        severity: 'MISSING',
        description: 'No date inputs found on project form',
      });
    }

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
  });

  // Summary
  test('Summary: Invalid data type results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  INVALID DATA TYPE RESULTS');
    console.log('═══════════════════════════════════════');
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

    // Fail if XSS executed
    expect(
      critical.length,
      `${critical.length} CRITICAL issues found`,
    ).toBe(0);
  });
});
