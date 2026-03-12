/**
 * Phase 1: Empty Form Submissions
 *
 * Tests that every form in the system properly validates required fields
 * when submitted empty. No form should submit without required data.
 *
 * Verifies:
 * 1. Form does NOT submit (no API call made)
 * 2. Required fields show error messages
 * 3. Error messages are in Russian (not English or raw i18n keys)
 * 4. No console errors / unhandled exceptions
 * 5. Page doesn't crash
 */
import { test, expect } from '../../fixtures/base.fixture';
import { getValidationErrors } from '../../helpers/form.helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormTestCase {
  /** Human-readable name */
  name: string;
  /** URL of the form page */
  url: string;
  /** Optional: selector for the submit button if non-standard */
  submitSelector?: string;
  /** Optional: minimum expected validation error count */
  minErrors?: number;
  /** Whether the form is a modal (needs a trigger click first) */
  modalTrigger?: string;
}

// ---------------------------------------------------------------------------
// Form catalogue — all create/edit forms in the system
// ---------------------------------------------------------------------------

const FORM_TESTS: FormTestCase[] = [
  // 1. Project create
  {
    name: 'Project create',
    url: '/projects/new',
    minErrors: 1,
  },
  // 2. Task create (modal on /tasks)
  {
    name: 'Task create',
    url: '/tasks',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новая задача")',
    minErrors: 1,
  },
  // 3. Invoice create
  {
    name: 'Invoice create',
    url: '/invoices',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый счёт")',
    minErrors: 1,
  },
  // 4. Payment create
  {
    name: 'Payment create',
    url: '/payments',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый платёж")',
    minErrors: 1,
  },
  // 5. Employee create
  {
    name: 'Employee create',
    url: '/employees',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый сотрудник")',
    minErrors: 1,
  },
  // 6. Material create
  {
    name: 'Material create',
    url: '/warehouse/materials',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый материал")',
    minErrors: 1,
  },
  // 7. Safety incident
  {
    name: 'Safety incident create',
    url: '/safety/incidents',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Зарегистрировать")',
    minErrors: 1,
  },
  // 8. Defect report
  {
    name: 'Defect report create',
    url: '/defects',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый дефект")',
    minErrors: 1,
  },
  // 9. Purchase request
  {
    name: 'Purchase request create',
    url: '/procurement',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новая заявка")',
    minErrors: 1,
  },
  // 10. Contract create
  {
    name: 'Contract create',
    url: '/contracts',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый договор")',
    minErrors: 1,
  },
  // 11. Budget create
  {
    name: 'Budget create',
    url: '/budgets',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый бюджет")',
    minErrors: 1,
  },
  // 12. Specification create
  {
    name: 'Specification create',
    url: '/specifications/new',
    minErrors: 1,
  },
  // 13. Change order create
  {
    name: 'Change order create',
    url: '/change-management/orders/new',
    minErrors: 1,
  },
  // 14. Support ticket
  {
    name: 'Support ticket create',
    url: '/support/tickets',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый тикет")',
    minErrors: 1,
  },
  // 15. CRM lead create
  {
    name: 'CRM lead create',
    url: '/crm/leads',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый лид")',
    minErrors: 1,
  },
  // 16. Counterparty create
  {
    name: 'Counterparty create',
    url: '/counterparties',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новый контрагент")',
    minErrors: 1,
  },
  // 17. Work permit create
  {
    name: 'Work permit create',
    url: '/pto/work-permits',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новое разрешение")',
    minErrors: 1,
  },
  // 18. Crew create
  {
    name: 'Crew create',
    url: '/crew',
    modalTrigger: 'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Новая бригада")',
    minErrors: 1,
  },
];

// ---------------------------------------------------------------------------
// Issue tracker
// ---------------------------------------------------------------------------

interface Issue {
  form: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  description: string;
}

const issues: Issue[] = [];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 1: Empty Form Submissions', () => {
  test.describe.configure({ mode: 'serial' });

  for (const formTest of FORM_TESTS) {
    test(`Empty submit: ${formTest.name}`, async ({ trackedPage: page, consoleErrors }) => {
      // Navigate to the form page
      await page.goto(formTest.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // If form is triggered by a modal button, click it first
      if (formTest.modalTrigger) {
        const triggerBtn = page.locator(formTest.modalTrigger).first();
        const hasTrigger = await triggerBtn.isVisible().catch(() => false);

        if (!hasTrigger) {
          // No create button found — record as MISSING
          issues.push({
            form: formTest.name,
            severity: 'MISSING',
            description: `No create button found on ${formTest.url} (looked for: ${formTest.modalTrigger})`,
          });
          test.skip();
          return;
        }

        await triggerBtn.click();
        // Wait for modal/form to appear
        await page.waitForTimeout(500);
      }

      // Verify form or input fields are visible
      const formEl = page.locator('form, [role="dialog"], .modal');
      const inputEls = page.locator('input:not([type="hidden"]), select, textarea');
      const hasForm = await formEl.first().isVisible().catch(() => false);
      const hasInputs = (await inputEls.count()) > 0;

      if (!hasForm && !hasInputs) {
        issues.push({
          form: formTest.name,
          severity: 'MISSING',
          description: `No form or input fields found on ${formTest.url}`,
        });
        test.skip();
        return;
      }

      // Track API calls to detect unwanted submissions
      const apiCalls: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method())) {
          apiCalls.push(`${req.method()} ${req.url()}`);
        }
      });

      // Click submit WITHOUT filling any fields
      const submitBtn = page
        .locator(formTest.submitSelector || 'button[type="submit"]')
        .or(page.getByRole('button', {
          name: /submit|save|create|ok|сохранить|создать|отправить|добавить/i,
        }))
        .first();

      const hasSubmit = await submitBtn.isVisible().catch(() => false);
      if (!hasSubmit) {
        issues.push({
          form: formTest.name,
          severity: 'MINOR',
          description: `No visible submit button found on ${formTest.url}`,
        });
        test.skip();
        return;
      }

      await submitBtn.click();
      await page.waitForTimeout(1000);

      // ── CHECK 1: Form should NOT have made a POST/PUT API call ──
      const submissionCalls = apiCalls.filter((c) =>
        !c.includes('/api/auth/') && !c.includes('/api/settings/')
      );

      if (submissionCalls.length > 0) {
        issues.push({
          form: formTest.name,
          severity: 'CRITICAL',
          description: `Empty form submitted! API calls: ${submissionCalls.join(', ')}`,
        });
      }

      // ── CHECK 2: Validation errors should be shown ──
      const validationErrors = await getValidationErrors(page);

      // Also check for HTML5 validation via :invalid pseudo-class
      const html5InvalidCount = await page.evaluate(() => {
        return document.querySelectorAll(':invalid:not(form):not(fieldset)').length;
      });

      const totalErrorIndicators = validationErrors.length + html5InvalidCount;

      if (totalErrorIndicators === 0 && submissionCalls.length === 0) {
        // Form didn't submit but also shows no errors — might use HTML5 validation popups
        const requiredFields = await page.evaluate(() => {
          return document.querySelectorAll('[required], [aria-required="true"]').length;
        });

        if (requiredFields > 0) {
          // Has required fields but no visible error messages
          issues.push({
            form: formTest.name,
            severity: 'MINOR',
            description: `Form has ${requiredFields} required fields but shows no custom validation errors (may rely on browser defaults)`,
          });
        }
      }

      if (validationErrors.length > 0) {
        // ── CHECK 3: Error messages should be in Russian ──
        for (const err of validationErrors) {
          // Check for raw i18n keys (dotted paths like "common.required")
          if (/^[a-z]+(\.[a-z]+)+$/i.test(err)) {
            issues.push({
              form: formTest.name,
              severity: 'MAJOR',
              description: `Raw i18n key shown as error: "${err}"`,
            });
          }

          // Check for English-only errors when Russian is expected
          if (/^[a-zA-Z\s]+$/.test(err) && err.length > 3) {
            // Purely Latin text — could be English error
            const commonEnglish = /required|invalid|must|cannot|error|failed|field/i;
            if (commonEnglish.test(err)) {
              issues.push({
                form: formTest.name,
                severity: 'MINOR',
                description: `English error message shown: "${err}" (should be Russian)`,
              });
            }
          }
        }
      }

      // ── CHECK 4: No console errors ──
      const criticalConsoleErrors = consoleErrors.filter(
        (e) => !e.includes('Failed to load resource') && !e.includes('favicon')
      );

      if (criticalConsoleErrors.length > 0) {
        issues.push({
          form: formTest.name,
          severity: 'MAJOR',
          description: `Console errors on empty submit: ${criticalConsoleErrors.join(' | ')}`,
        });
      }

      // ── CHECK 5: Page should not crash ──
      const body = await page.textContent('body');
      expect(body).not.toContain('Something went wrong');
      expect(body).not.toContain('Cannot read properties');
      expect(body).not.toContain('Unhandled Runtime Error');

      // Record summary
      test.info().annotations.push({
        type: 'empty-form-result',
        description: JSON.stringify({
          form: formTest.name,
          validationErrors: validationErrors.length,
          html5Invalid: html5InvalidCount,
          apiCallsMade: submissionCalls.length,
          consoleErrors: criticalConsoleErrors.length,
        }),
      });
    });
  }

  // Summary test
  test('Summary: Empty form submission results', async () => {
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    const major = issues.filter((i) => i.severity === 'MAJOR');

    console.log('\n═══════════════════════════════════════');
    console.log('  EMPTY FORM SUBMISSION RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`  Forms tested: ${FORM_TESTS.length}`);
    console.log(`  CRITICAL: ${critical.length}`);
    console.log(`  MAJOR:    ${major.length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
    console.log(`  MISSING:  ${issues.filter((i) => i.severity === 'MISSING').length}`);
    console.log('───────────────────────────────────────');

    for (const issue of issues) {
      console.log(`  [${issue.severity}] ${issue.form}: ${issue.description}`);
    }
    console.log('═══════════════════════════════════════\n');

    // Fail if any CRITICAL issues
    expect(
      critical.length,
      `${critical.length} CRITICAL issues: ${critical.map((i) => i.description).join('; ')}`,
    ).toBe(0);
  });
});
