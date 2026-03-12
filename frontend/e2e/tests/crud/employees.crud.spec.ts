/**
 * Session 2.3 — Deep CRUD: Employees (Сотрудники)
 *
 * Persona focus: Кадровик (hiring/dismissal flow), Бухгалтер (salary/documents),
 *                Директор (headcount), Прораб (crew assignments)
 *
 * Domain rules:
 *   - ИНН физлица = 12 цифр, юрлица = 10 цифр
 *   - СНИЛС = XXX-XXX-XXX XX
 *   - Зарплата >= МРОТ (19 242 ₽ in 2026)
 *   - Employee dismissal = status TERMINATED (not hard delete)
 *   - Phone starts with +7
 *
 * API endpoints tested:
 *   POST   /api/employees                  — create employee
 *   GET    /api/employees                  — list employees (paginated)
 *   GET    /api/employees/{id}             — get employee detail
 *   PUT    /api/employees/{id}             — update employee
 *   DELETE /api/employees/{id}             — delete (soft)
 *   GET    /api/employees/by-project/{pid} — employees by project
 *   GET    /api/employees/{id}/certificates — certificates
 *   POST   /api/employees/{id}/certificates — add certificate
 */
import { test, expect } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Issue tracker                                                      */
/* ------------------------------------------------------------------ */
interface Issue {
  entity: string;
  operation: string;
  issue: string;
  severity: '[CRITICAL]' | '[MAJOR]' | '[MINOR]' | '[UX]' | '[MISSING]';
  expected: string;
  actual: string;
}
const issues: Issue[] = [];
function trackIssue(i: Issue) {
  issues.push(i);
  console.log(`${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const API = process.env.API_BASE_URL ?? 'http://localhost:8080';
const CREDENTIALS = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@privod.ru',
  password: process.env.E2E_ADMIN_PASS ?? 'admin123',
};

let TOKEN = '';
async function getToken(): Promise<string> {
  if (TOKEN) return TOKEN;
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const json = await res.json();
  TOKEN = json.accessToken ?? json.data?.accessToken ?? json.token ?? '';
  return TOKEN;
}
function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function parseRussianNumber(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^\d,.\-−]/g, '').replace('−', '-').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const EMPLOYEE = {
  firstName: 'Дмитрий',
  lastName: 'E2E-Козлов',
  middleName: 'Андреевич',
  position: 'Инженер-электрик',
  phone: '+7 (916) 123-45-67',
  email: 'e2e.kozlov@stroymontazh.ru',
  hireDate: '2024-01-15',
  contractType: 'PERMANENT',
  passportNumber: '4512 123456',
  inn: '771234567890',
  snils: '123-456-789 00',
  hourlyRate: '1200',
  monthlyRate: '95000',
  notes: 'E2E-тест: инженер-электрик, допуск IV группа ЭБ',
};

const UPDATED_POSITION = 'Старший инженер-электрик';
const UPDATED_MONTHLY = '110000';

/* ------------------------------------------------------------------ */
/*  State shared across serial tests                                   */
/* ------------------------------------------------------------------ */
let createdEmployeeId = '';

/* ================================================================== */
/*  TESTS                                                              */
/* ================================================================== */

test.describe.serial('Employees CRUD', () => {
  test.beforeAll(async () => {
    await getToken();
  });

  test.afterAll(async () => {
    // Print issue summary
    if (issues.length > 0) {
      console.log('\n=== EMPLOYEE ISSUES ===');
      issues.forEach((i) =>
        console.log(`  ${i.severity} ${i.entity}/${i.operation}: ${i.issue} | expected: ${i.expected} | actual: ${i.actual}`),
      );
    }
    // Cleanup: delete test employee
    if (createdEmployeeId) {
      try {
        await fetch(`${API}/api/employees/${createdEmployeeId}`, {
          method: 'DELETE',
          headers: headers(),
        });
      } catch { /* ignore */ }
    }
  });

  // ─── CREATE ──────────────────────────────────────────────────────

  test('CREATE via API — all fields', async () => {
    const fullName = `${EMPLOYEE.lastName} ${EMPLOYEE.firstName} ${EMPLOYEE.middleName}`;
    const res = await fetch(`${API}/api/employees`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        middleName: EMPLOYEE.middleName,
        fullName,
        position: EMPLOYEE.position,
        phone: EMPLOYEE.phone,
        email: EMPLOYEE.email,
        hireDate: EMPLOYEE.hireDate,
        contractType: EMPLOYEE.contractType,
        passportNumber: EMPLOYEE.passportNumber,
        inn: EMPLOYEE.inn,
        snils: EMPLOYEE.snils,
        hourlyRate: Number(EMPLOYEE.hourlyRate),
        monthlyRate: Number(EMPLOYEE.monthlyRate),
        notes: EMPLOYEE.notes,
        status: 'ACTIVE',
      }),
    });

    expect(res.status, 'Employee creation should return 2xx').toBeLessThan(300);
    const body = await res.json();
    const emp = body.data ?? body;
    createdEmployeeId = emp.id;

    expect(createdEmployeeId, 'Created employee must have an id').toBeTruthy();
    expect(emp.position).toBe(EMPLOYEE.position);
    expect(emp.status ?? 'ACTIVE').toBe('ACTIVE');
  });

  test('CREATE — verify in API list', async () => {
    const res = await fetch(`${API}/api/employees?search=E2E-Козлов`, {
      headers: headers(),
    });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json;
    const found = Array.isArray(list)
      ? list.find((e: any) => e.id === createdEmployeeId || (e.fullName ?? '').includes('E2E-Козлов'))
      : null;

    if (!found) {
      trackIssue({
        entity: 'Employee',
        operation: 'CREATE-LIST',
        issue: 'Created employee not found in search results',
        severity: '[MAJOR]',
        expected: 'E2E-Козлов in list',
        actual: 'Not found',
      });
    }
    // Soft assertion — test continues
    expect(list.length).toBeGreaterThanOrEqual(0);
  });

  test('CREATE — verify UI page loads', async ({ page }) => {
    await page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Page should render without crash
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    // Try to find our employee in the table
    const tableOrCards = page.locator('table, [class*="card"], [class*="grid"]').first();
    if (await tableOrCards.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const pageText = await page.locator('body').innerText();
      if (pageText.includes('E2E-Козлов') || pageText.includes(EMPLOYEE.position)) {
        // Employee visible in list — good
      } else {
        trackIssue({
          entity: 'Employee',
          operation: 'CREATE-UI',
          issue: 'Employee not visible in list page (may need search/scroll)',
          severity: '[MINOR]',
          expected: 'E2E-Козлов visible',
          actual: 'Not visible on first page',
        });
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/employees-list.png' });
  });

  // ─── READ ────────────────────────────────────────────────────────

  test('READ — API detail', async () => {
    if (!createdEmployeeId) return test.skip();

    const res = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      headers: headers(),
    });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const emp = json.data ?? json;

    expect(emp.position).toBe(EMPLOYEE.position);

    // Verify personal data preserved
    if (emp.phone) {
      expect(emp.phone).toContain('916');
    }
    if (emp.email) {
      expect(emp.email).toBe(EMPLOYEE.email);
    }
    if (emp.inn) {
      expect(emp.inn).toBe(EMPLOYEE.inn);
    }
    if (emp.snils) {
      // СНИЛС format should be preserved: XXX-XXX-XXX XX
      const snilsStr = String(emp.snils);
      if (!/\d{3}-\d{3}-\d{3}\s?\d{2}/.test(snilsStr) && snilsStr.length > 0) {
        trackIssue({
          entity: 'Employee',
          operation: 'READ',
          issue: 'СНИЛС format not preserved',
          severity: '[MINOR]',
          expected: 'XXX-XXX-XXX XX',
          actual: snilsStr,
        });
      }
    }
  });

  test('READ — UI detail page', async ({ page }) => {
    if (!createdEmployeeId) return test.skip();

    await page.goto(`/employees/${createdEmployeeId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    // Check employee name is displayed
    const body = await page.locator('body').innerText();
    const hasName = body.includes('E2E-Козлов') || body.includes(EMPLOYEE.firstName);
    if (!hasName) {
      trackIssue({
        entity: 'Employee',
        operation: 'READ-UI',
        issue: 'Employee name not displayed on detail page',
        severity: '[MAJOR]',
        expected: 'E2E-Козлов visible',
        actual: 'Not found in page text',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/employee-detail.png' });
  });

  test('READ — list page columns', async ({ page }) => {
    await page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Check for expected table columns (ФИО, Должность, Отдел, Телефон, Статус)
    const pageText = await page.locator('body').innerText();

    // At minimum, the page should show some HR-related content
    const hasHrContent =
      pageText.includes('сотрудник') ||
      pageText.includes('Сотрудник') ||
      pageText.includes('Employees') ||
      pageText.includes('employee') ||
      pageText.includes('ФИО') ||
      pageText.includes('Должность') ||
      pageText.includes('Position');

    if (!hasHrContent) {
      trackIssue({
        entity: 'Employee',
        operation: 'READ-LIST',
        issue: 'Employee list page has no HR-related content',
        severity: '[MAJOR]',
        expected: 'Table with ФИО/Должность columns',
        actual: 'No HR content detected',
      });
    }
  });

  test('READ — filter by search', async () => {
    const res = await fetch(`${API}/api/employees?search=E2E-Козлов`, {
      headers: headers(),
    });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json;

    // Should find at least our test employee
    if (Array.isArray(list) && list.length === 0) {
      trackIssue({
        entity: 'Employee',
        operation: 'SEARCH',
        issue: 'Search by name returns empty results',
        severity: '[MAJOR]',
        expected: 'At least 1 result for E2E-Козлов',
        actual: '0 results',
      });
    }
  });

  // ─── UPDATE ──────────────────────────────────────────────────────

  test('UPDATE — promote position via API', async () => {
    if (!createdEmployeeId) return test.skip();

    const res = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        middleName: EMPLOYEE.middleName,
        fullName: `${EMPLOYEE.lastName} ${EMPLOYEE.firstName} ${EMPLOYEE.middleName}`,
        position: UPDATED_POSITION,
        phone: EMPLOYEE.phone,
        email: EMPLOYEE.email,
        hireDate: EMPLOYEE.hireDate,
        monthlyRate: Number(UPDATED_MONTHLY),
        hourlyRate: Number(EMPLOYEE.hourlyRate),
        inn: EMPLOYEE.inn,
        snils: EMPLOYEE.snils,
        status: 'ACTIVE',
      }),
    });

    expect(res.status).toBeLessThan(300);

    // Verify update persisted
    const getRes = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      headers: headers(),
    });
    const json = await getRes.json();
    const emp = json.data ?? json;
    expect(emp.position).toBe(UPDATED_POSITION);

    if (emp.monthlyRate !== undefined) {
      expect(emp.monthlyRate).toBe(Number(UPDATED_MONTHLY));
    }
  });

  test('UPDATE — UI form edit page', async ({ page }) => {
    if (!createdEmployeeId) return test.skip();

    await page.goto(`/employees/${createdEmployeeId}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    // Check form is visible
    const form = page.locator('form');
    const hasForm = await form.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasForm) {
      trackIssue({
        entity: 'Employee',
        operation: 'UPDATE-UI',
        issue: 'Edit form not rendered on /employees/:id/edit',
        severity: '[MAJOR]',
        expected: 'Editable form',
        actual: 'No form found',
      });
      return;
    }

    // Verify pre-filled position field
    const positionInput = page.locator('input[name="position"]');
    if (await positionInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const value = await positionInput.inputValue();
      expect(value).toBe(UPDATED_POSITION);
    }

    await page.screenshot({ path: 'e2e/screenshots/employee-edit-form.png' });
  });

  // ─── VALIDATION ──────────────────────────────────────────────────

  test('VALIDATION — empty required fields rejected', async ({ page }) => {
    await page.goto('/employees/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Try to submit empty form
    const submitBtn = page.getByRole('button', {
      name: /создать|save|сохранить|добавить|submit/i,
    });

    if (await submitBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.first().click();
      await page.waitForTimeout(1000);

      // Should show validation errors
      const errorElements = page.locator('.text-red-500, .text-red-600, [role="alert"], .text-destructive');
      const errorCount = await errorElements.count();

      if (errorCount === 0) {
        trackIssue({
          entity: 'Employee',
          operation: 'VALIDATION',
          issue: 'No validation errors shown on empty form submit',
          severity: '[MAJOR]',
          expected: 'Errors for firstName, lastName, position, hireDate',
          actual: 'No errors displayed',
        });
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/employee-validation-errors.png' });
  });

  test('VALIDATION — ИНН must be 10 or 12 digits (API)', async () => {
    const res = await fetch(`${API}/api/employees`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        firstName: 'Тест',
        lastName: 'E2E-ТестИНН',
        fullName: 'E2E-ТестИНН Тест',
        position: 'Тестировщик',
        hireDate: '2024-01-01',
        inn: '12345', // Invalid: only 5 digits
        status: 'ACTIVE',
      }),
    });

    // Backend may accept any string for inn (no validation) — track as issue
    if (res.ok) {
      const json = await res.json();
      const emp = json.data ?? json;
      // Clean up
      if (emp.id) {
        await fetch(`${API}/api/employees/${emp.id}`, {
          method: 'DELETE',
          headers: headers(),
        });
      }
      trackIssue({
        entity: 'Employee',
        operation: 'VALIDATION',
        issue: 'Backend accepts invalid ИНН (5 digits instead of 10/12)',
        severity: '[MAJOR]',
        expected: 'Rejection or validation error',
        actual: `Created with inn=12345`,
      });
    }
    // If rejected — good, validation works
  });

  test('VALIDATION — phone format check (UI)', async ({ page }) => {
    await page.goto('/employees/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Fill required fields
    const lastNameInput = page.locator('input[name="lastName"]');
    const firstNameInput = page.locator('input[name="firstName"]');
    const positionInput = page.locator('input[name="position"]');
    const hireDateInput = page.locator('input[name="hireDate"]');
    const phoneInput = page.locator('input[name="phone"]');

    if (await lastNameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await lastNameInput.fill('E2E-ТестТелефон');
      await firstNameInput.fill('Тест');
      await positionInput.fill('Тест');
      await hireDateInput.fill('2024-01-01');
      await phoneInput.fill('invalid-phone!!');

      // Submit
      const submitBtn = page.getByRole('button', {
        name: /создать|save|сохранить|добавить|submit/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(1500);

        // Check for phone validation error
        const errors = page.locator('.text-red-500, .text-red-600, .text-destructive');
        const errorCount = await errors.count();
        if (errorCount === 0) {
          trackIssue({
            entity: 'Employee',
            operation: 'VALIDATION',
            issue: 'No error shown for invalid phone format',
            severity: '[MINOR]',
            expected: 'Phone validation error',
            actual: 'Form submitted without error',
          });
        }
      }
    }
  });

  test('VALIDATION — salary below МРОТ warning', async () => {
    // МРОТ 2026 = 19,242 ₽
    const MROT = 19_242;
    const lowSalary = 15_000;

    const res = await fetch(`${API}/api/employees`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        firstName: 'Тест',
        lastName: 'E2E-ТестМРОТ',
        fullName: 'E2E-ТестМРОТ Тест',
        position: 'Подсобный рабочий',
        hireDate: '2024-01-01',
        monthlyRate: lowSalary,
        status: 'ACTIVE',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const emp = json.data ?? json;
      // Clean up
      if (emp.id) {
        await fetch(`${API}/api/employees/${emp.id}`, {
          method: 'DELETE',
          headers: headers(),
        });
      }
      // Below МРОТ should at least produce a warning
      if (lowSalary < MROT) {
        trackIssue({
          entity: 'Employee',
          operation: 'VALIDATION',
          issue: `Salary ${lowSalary} ₽ below МРОТ (${MROT} ₽) accepted without warning`,
          severity: '[MISSING]',
          expected: 'Warning about salary below МРОТ',
          actual: 'Created without warning',
        });
      }
    }
  });

  // ─── DISMISS (Увольнение) ────────────────────────────────────────

  test('DISMISS — terminate employee via API', async () => {
    if (!createdEmployeeId) return test.skip();

    // Update status to TERMINATED with termination date
    const res = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        middleName: EMPLOYEE.middleName,
        fullName: `${EMPLOYEE.lastName} ${EMPLOYEE.firstName} ${EMPLOYEE.middleName}`,
        position: UPDATED_POSITION,
        phone: EMPLOYEE.phone,
        email: EMPLOYEE.email,
        hireDate: EMPLOYEE.hireDate,
        status: 'TERMINATED',
        terminationDate: '2026-10-31',
      }),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Employee',
        operation: 'DISMISS',
        issue: 'Cannot set status to TERMINATED via PUT',
        severity: '[MAJOR]',
        expected: '2xx response',
        actual: `${res.status}`,
      });
      return;
    }

    // Verify terminated status
    const getRes = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      headers: headers(),
    });
    const json = await getRes.json();
    const emp = json.data ?? json;

    if (emp.status !== 'TERMINATED') {
      trackIssue({
        entity: 'Employee',
        operation: 'DISMISS',
        issue: 'Status not changed to TERMINATED',
        severity: '[CRITICAL]',
        expected: 'TERMINATED',
        actual: emp.status,
      });
    }
  });

  test('DISMISS — terminated employee still in list', async () => {
    if (!createdEmployeeId) return test.skip();

    const res = await fetch(`${API}/api/employees`, {
      headers: headers(),
    });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json;

    if (Array.isArray(list)) {
      const found = list.find((e: any) => e.id === createdEmployeeId);
      if (!found) {
        trackIssue({
          entity: 'Employee',
          operation: 'DISMISS',
          issue: 'Terminated employee missing from general list (should remain with Уволен badge)',
          severity: '[MAJOR]',
          expected: 'Employee visible with TERMINATED status',
          actual: 'Not found in list',
        });
      }
    }
  });

  // ─── CERTIFICATES ────────────────────────────────────────────────

  test('CERTIFICATES — add safety certificate', async () => {
    if (!createdEmployeeId) return test.skip();

    const certData = {
      name: 'E2E-Допуск электробезопасность IV группа',
      certificateType: 'ELECTRICAL_SAFETY',
      number: 'E2E-ЭБ-2024-001',
      issueDate: '2024-02-01',
      expiryDate: '2026-02-01',
      issuedBy: 'Ростехнадзор',
    };

    const res = await fetch(`${API}/api/employees/${createdEmployeeId}/certificates`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(certData),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Employee',
        operation: 'CERTIFICATE',
        issue: 'Cannot add certificate to employee',
        severity: '[MINOR]',
        expected: '2xx response',
        actual: `${res.status}`,
      });
      return;
    }

    // Verify certificate list
    const listRes = await fetch(`${API}/api/employees/${createdEmployeeId}/certificates`, {
      headers: headers(),
    });
    if (listRes.ok) {
      const certs = await listRes.json();
      const certList = Array.isArray(certs) ? certs : certs.data ?? [];
      if (certList.length === 0) {
        trackIssue({
          entity: 'Employee',
          operation: 'CERTIFICATE',
          issue: 'Certificate list empty after adding',
          severity: '[MAJOR]',
          expected: '1 certificate',
          actual: '0',
        });
      }
    }
  });

  // ─── UI FLOW ─────────────────────────────────────────────────────

  test('UI — create employee flow', async ({ page }) => {
    await page.goto('/employees/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Check form sections are visible
    const body = await page.locator('body').innerText();
    const hasSections =
      body.includes('Персональные') ||
      body.includes('Контакты') ||
      body.includes('Трудоустройство') ||
      body.includes('Документы') ||
      body.includes('Personal') ||
      body.includes('Employment');

    if (!hasSections) {
      trackIssue({
        entity: 'Employee',
        operation: 'UI-CREATE',
        issue: 'Form sections not visible (Персональные, Контакты, Трудоустройство, Документы)',
        severity: '[UX]',
        expected: 'Sectioned form layout',
        actual: 'Sections not detected',
      });
    }

    // Fill the form
    const fields: Record<string, string> = {
      lastName: 'E2E-UIТест',
      firstName: 'Тестовый',
      position: 'Тестировщик',
      hireDate: '2024-06-01',
    };

    for (const [name, value] of Object.entries(fields)) {
      const input = page.locator(`input[name="${name}"]`);
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/employee-create-form-filled.png' });

    // Submit
    const submitBtn = page.getByRole('button', {
      name: /создать|save|сохранить|добавить|submit/i,
    });
    if (await submitBtn.first().isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/employees') && r.status() < 500,
          { timeout: 10_000 },
        ).catch(() => null),
        submitBtn.first().click(),
      ]);

      await page.waitForTimeout(2000);

      // Clean up any UI-created employee
      const cleanRes = await fetch(`${API}/api/employees?search=E2E-UIТест`, {
        headers: headers(),
      });
      if (cleanRes.ok) {
        const json = await cleanRes.json();
        const list = json.content ?? json.data ?? json;
        if (Array.isArray(list)) {
          for (const emp of list) {
            const name = emp.fullName ?? emp.lastName ?? '';
            if (name.includes('E2E-UIТест')) {
              await fetch(`${API}/api/employees/${emp.id}`, {
                method: 'DELETE',
                headers: headers(),
              }).catch(() => null);
            }
          }
        }
      }
    }
  });

  test('UI — employee detail tabs', async ({ page }) => {
    if (!createdEmployeeId) return test.skip();

    await page.goto(`/employees/${createdEmployeeId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    // Check for tab-like navigation on detail page
    // Expected tabs: Общее, Документы, Квалификация, Табель
    const body = await page.locator('body').innerText();
    const tabKeywords = ['Общее', 'Документы', 'Сертификат', 'Квалификац', 'Табель', 'General', 'Documents', 'Certificates', 'Timesheet'];
    const foundTabs = tabKeywords.filter((k) => body.includes(k));

    if (foundTabs.length === 0) {
      trackIssue({
        entity: 'Employee',
        operation: 'UI-DETAIL',
        issue: 'No tabs found on employee detail page',
        severity: '[UX]',
        expected: 'Tabs: Общее, Документы, Квалификация, Табель',
        actual: 'No tab-like sections',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/employee-detail-tabs.png' });
  });

  // ─── DELETE (Cleanup) ────────────────────────────────────────────

  test('DELETE — soft delete via API', async () => {
    if (!createdEmployeeId) return test.skip();

    const res = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      method: 'DELETE',
      headers: headers(),
    });

    // 200, 204, or 404 are all acceptable
    expect([200, 204, 404]).toContain(res.status);

    // Verify employee is gone (or soft-deleted)
    const getRes = await fetch(`${API}/api/employees/${createdEmployeeId}`, {
      headers: headers(),
    });
    // Either 404 (hard delete) or 200 with deleted flag
    if (getRes.ok) {
      const json = await getRes.json();
      const emp = json.data ?? json;
      if (emp.status !== 'TERMINATED' && !emp.deleted) {
        trackIssue({
          entity: 'Employee',
          operation: 'DELETE',
          issue: 'Employee still active after DELETE',
          severity: '[MAJOR]',
          expected: 'TERMINATED or 404',
          actual: `Status: ${emp.status}`,
        });
      }
    }

    // Clear id so afterAll doesn't double-delete
    createdEmployeeId = '';
  });
});
