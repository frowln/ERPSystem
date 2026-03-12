/**
 * Session 2.3 — Deep CRUD: Leave (Отпуска)
 *
 * Persona focus: Кадровик (leave management), Бухгалтер (leave accrual),
 *                Директор (headcount/availability), Прораб (crew scheduling)
 *
 * Domain rules:
 *   - Annual leave: 28 calendar days (ст. 115 ТК РФ)
 *   - Additional leave for hazardous work: varies (ст. 116-119 ТК РФ)
 *   - Leave cannot be negative (unless advance leave policy)
 *   - Overlapping leave → error
 *   - Leave during probation allowed after 6 months (ст. 122 ТК РФ)
 *   - One part of leave must be >= 14 days (ст. 125 ТК РФ)
 *
 * API endpoints tested:
 *   GET  /api/hr/seniority-report — seniority + leave balance data
 *
 * Note: Leave management may not have full CRUD API (managed through
 *       timesheet T-13 codes ОТ and seniority report). Tests adapt
 *       to actual backend capabilities.
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
/*  Constants — Russian Labor Code                                     */
/* ------------------------------------------------------------------ */
const ANNUAL_LEAVE_DAYS = 28;       // ст. 115 ТК РФ
const MIN_CONTINUOUS_PART = 14;     // ст. 125 ТК РФ
const PROBATION_MONTHS = 6;        // ст. 122 ТК РФ

/* ================================================================== */
/*  TESTS                                                              */
/* ================================================================== */

test.describe.serial('Leave Management', () => {
  test.beforeAll(async () => {
    await getToken();
  });

  test.afterAll(async () => {
    if (issues.length > 0) {
      console.log('\n=== LEAVE ISSUES ===');
      issues.forEach((i) =>
        console.log(`  ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`),
      );
    }
  });

  // ─── SENIORITY REPORT ───────────────────────────────────────────

  test('SENIORITY — API returns leave balance data', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Leave',
        operation: 'SENIORITY-API',
        issue: `Seniority report API returned ${res.status}`,
        severity: '[MAJOR]',
        expected: '200 with SeniorityRecord[]',
        actual: `${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    if (records.length === 0) {
      trackIssue({
        entity: 'Leave',
        operation: 'SENIORITY-API',
        issue: 'Seniority report is empty (no employees)',
        severity: '[MINOR]',
        expected: 'At least 1 employee record',
        actual: '0 records',
      });
      return;
    }

    // Verify structure of seniority records
    const record = records[0];
    const requiredFields = ['employeeName', 'hireDate', 'baseLeave', 'totalLeave', 'remainingLeave'];
    const missingFields = requiredFields.filter((f) => record[f] === undefined);

    if (missingFields.length > 0) {
      trackIssue({
        entity: 'Leave',
        operation: 'SENIORITY-FIELDS',
        issue: `Missing fields in seniority record: ${missingFields.join(', ')}`,
        severity: '[MAJOR]',
        expected: requiredFields.join(', '),
        actual: Object.keys(record).join(', '),
      });
    }
  });

  test('SENIORITY — base leave is 28 days (ст. 115 ТК РФ)', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    for (const record of records) {
      if (record.baseLeave !== undefined && record.baseLeave !== ANNUAL_LEAVE_DAYS) {
        trackIssue({
          entity: 'Leave',
          operation: 'BASE-LEAVE',
          issue: `Base leave is ${record.baseLeave} days for ${record.employeeName}`,
          severity: '[CRITICAL]',
          expected: `${ANNUAL_LEAVE_DAYS} days (ст. 115 ТК РФ)`,
          actual: `${record.baseLeave} days`,
        });
        break;
      }
    }
  });

  test('SENIORITY — remaining leave cannot be negative', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    for (const record of records) {
      if (record.remainingLeave !== undefined && record.remainingLeave < 0) {
        trackIssue({
          entity: 'Leave',
          operation: 'NEGATIVE-BALANCE',
          issue: `Negative leave balance: ${record.remainingLeave} for ${record.employeeName}`,
          severity: '[CRITICAL]',
          expected: 'remainingLeave >= 0',
          actual: `${record.remainingLeave}`,
        });
      }
    }
  });

  test('SENIORITY — total = base + additional', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    for (const record of records) {
      if (
        record.baseLeave !== undefined &&
        record.additionalLeave !== undefined &&
        record.totalLeave !== undefined
      ) {
        const expectedTotal = record.baseLeave + record.additionalLeave;
        if (record.totalLeave !== expectedTotal) {
          trackIssue({
            entity: 'Leave',
            operation: 'TOTAL-CALC',
            issue: `totalLeave mismatch: ${record.totalLeave} != ${record.baseLeave} + ${record.additionalLeave}`,
            severity: '[CRITICAL]',
            expected: `${expectedTotal}`,
            actual: `${record.totalLeave}`,
          });
        }
        break; // Check first record only
      }
    }
  });

  test('SENIORITY — remaining = total - used', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    for (const record of records) {
      if (
        record.totalLeave !== undefined &&
        record.usedLeave !== undefined &&
        record.remainingLeave !== undefined
      ) {
        const expectedRemaining = record.totalLeave - record.usedLeave;
        if (record.remainingLeave !== expectedRemaining) {
          trackIssue({
            entity: 'Leave',
            operation: 'REMAINING-CALC',
            issue: `remainingLeave mismatch: ${record.remainingLeave} != ${record.totalLeave} - ${record.usedLeave}`,
            severity: '[CRITICAL]',
            expected: `${expectedRemaining}`,
            actual: `${record.remainingLeave}`,
          });
        }
        break; // Check first record only
      }
    }
  });

  // ─── UI PAGES ───────────────────────────────────────────────────

  test('UI — leave/seniority page loads', async ({ page }) => {
    // Try the seniority-leave route
    await page.goto('/hr/seniority-leave', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();
    const hasContent =
      body.includes('Стаж') ||
      body.includes('Отпуск') ||
      body.includes('Leave') ||
      body.includes('Seniority') ||
      body.includes('Баланс') ||
      body.includes('Остаток');

    if (!hasContent) {
      trackIssue({
        entity: 'Leave',
        operation: 'UI-PAGE',
        issue: 'Seniority/leave page has no relevant content',
        severity: '[MAJOR]',
        expected: 'Table with employee seniority and leave balance',
        actual: 'No leave content detected',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/leave-seniority.png' });
  });

  test('UI — leave balance columns check', async ({ page }) => {
    await page.goto('/hr/seniority-leave', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    // Check for expected columns
    const body = await page.locator('body').innerText();
    const expectedLabels = [
      { label: 'ФИО', alt: 'Сотрудник' },
      { label: 'Стаж', alt: 'Seniority' },
      { label: 'Отпуск', alt: 'Leave' },
      { label: 'Использовано', alt: 'Used' },
      { label: 'Остаток', alt: 'Remaining' },
    ];

    const found = expectedLabels.filter(
      (e) => body.includes(e.label) || body.includes(e.alt),
    );

    if (found.length < 2) {
      trackIssue({
        entity: 'Leave',
        operation: 'UI-COLUMNS',
        issue: 'Leave page missing expected columns',
        severity: '[UX]',
        expected: 'Columns: ФИО, Стаж, Отпуск, Использовано, Остаток',
        actual: `Found ${found.length} of 5 expected labels`,
      });
    }
  });

  // ─── LEAVE REQUEST (if API exists) ──────────────────────────────

  test('LEAVE REQUEST — check if dedicated API exists', async () => {
    // Try common leave request endpoints
    const endpoints = [
      '/api/leave-requests',
      '/api/hr/leave-requests',
      '/api/leaves',
      '/api/hr/leaves',
    ];

    let found = false;
    for (const ep of endpoints) {
      const res = await fetch(`${API}${ep}`, {
        headers: headers(),
      });
      if (res.ok || res.status === 403) {
        found = true;
        break;
      }
    }

    if (!found) {
      trackIssue({
        entity: 'Leave',
        operation: 'API-MISSING',
        issue: 'No dedicated leave request CRUD API found',
        severity: '[MISSING]',
        expected: 'POST/GET /api/leave-requests for CRUD operations',
        actual: 'Leave managed only through T-13 codes and seniority report',
      });
    }
  });

  test('LEAVE — T-13 codes for leave period', async ({ page }) => {
    // When employee is on leave, T-13 should show ОТ code
    await page.goto('/hr/timesheet-t13', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();

    // Check if T-13 page shows any leave codes
    const hasLeaveCode = body.includes('ОТ') || body.includes('OT');

    // This is informational — leave codes may not be present in test data
    await page.screenshot({ path: 'e2e/screenshots/t13-leave-codes.png' });
  });

  // ─── PROBATION CHECK ────────────────────────────────────────────

  test('PROBATION — leave eligibility after 6 months (ст. 122 ТК РФ)', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    for (const record of records) {
      const hireDateStr = record.hireDate;
      if (!hireDateStr) continue;

      const hireDate = new Date(hireDateStr);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - hireDate.getFullYear()) * 12 +
        (now.getMonth() - hireDate.getMonth());

      // Employees hired less than 6 months ago
      if (monthsDiff < PROBATION_MONTHS) {
        if (record.usedLeave > 0) {
          trackIssue({
            entity: 'Leave',
            operation: 'PROBATION',
            issue: `Employee ${record.employeeName} used ${record.usedLeave} leave days but hired only ${monthsDiff} months ago`,
            severity: '[MINOR]',
            expected: 'No leave used during probation (<6 months)',
            actual: `${record.usedLeave} days used after ${monthsDiff} months`,
          });
        }
      }
    }
  });

  // ─── LEAVE OVERLAP VALIDATION ───────────────────────────────────

  test('UI — leave request form (if exists)', async ({ page }) => {
    // Navigate to leave requests page
    await page.goto('/leave/requests', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();
    const hasContent =
      body.includes('Заявка') ||
      body.includes('Отпуск') ||
      body.includes('Leave') ||
      body.includes('Request') ||
      body.includes('заявлен');

    if (!hasContent) {
      trackIssue({
        entity: 'Leave',
        operation: 'UI-REQUEST',
        issue: 'Leave request page not showing leave-related content',
        severity: '[MINOR]',
        expected: 'Leave request list or form',
        actual: 'No leave content',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/leave-requests.png' });
  });

  // ─── COMPLIANCE SUMMARY ────────────────────────────────────────

  test('COMPLIANCE — labor law summary check', async () => {
    const res = await fetch(`${API}/api/hr/seniority-report`, {
      headers: headers(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = Array.isArray(data) ? data : data.data ?? [];

    let complianceOk = true;
    for (const record of records) {
      // Check: base leave = 28
      if (record.baseLeave !== undefined && record.baseLeave < ANNUAL_LEAVE_DAYS) {
        complianceOk = false;
        trackIssue({
          entity: 'Leave',
          operation: 'COMPLIANCE',
          issue: `${record.employeeName}: base leave ${record.baseLeave} < ${ANNUAL_LEAVE_DAYS}`,
          severity: '[CRITICAL]',
          expected: `>= ${ANNUAL_LEAVE_DAYS}`,
          actual: `${record.baseLeave}`,
        });
      }

      // Check: remaining >= 0
      if (record.remainingLeave !== undefined && record.remainingLeave < 0) {
        complianceOk = false;
      }

      // Check: seniority calculated
      if (record.seniorityYears === undefined && record.seniorityMonths === undefined) {
        trackIssue({
          entity: 'Leave',
          operation: 'COMPLIANCE',
          issue: `${record.employeeName}: no seniority data calculated`,
          severity: '[MINOR]',
          expected: 'seniorityYears and seniorityMonths populated',
          actual: 'undefined',
        });
      }
    }

    // Overall compliance status — informational
    console.log(`Leave compliance check: ${complianceOk ? 'PASS' : 'ISSUES FOUND'} (${records.length} employees)`);
  });
});
