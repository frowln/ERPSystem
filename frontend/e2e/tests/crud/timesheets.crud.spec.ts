/**
 * Session 2.3 — Deep CRUD: Timesheets (Табели учёта рабочего времени)
 *
 * Persona focus: Бухгалтер (T-13 statutory form), Прораб (daily hours),
 *                Кадровик (overtime tracking, work codes)
 *
 * Domain rules:
 *   - Standard working day: 8 hours (ст. 91 ТК РФ)
 *   - Max per day: 12 hours (ст. 99 ТК РФ)
 *   - Weekly norm: 40 hours
 *   - T-13 attendance codes: Я(явка), В(выходной), Б(больничный),
 *     ОТ(отпуск), Н(ночные), С(сверхурочные)
 *   - Timesheet statuses: DRAFT → SUBMITTED → APPROVED | REJECTED
 *
 * API endpoints tested:
 *   POST   /api/timesheets                    — create timesheet entry
 *   GET    /api/timesheets                    — list timesheets
 *   GET    /api/timesheets/{id}               — get timesheet detail
 *   PUT    /api/timesheets/{id}               — update timesheet
 *   PATCH  /api/timesheets/{id}/submit        — submit for approval
 *   PATCH  /api/timesheets/{id}/approve       — approve timesheet
 *   PATCH  /api/timesheets/{id}/reject        — reject timesheet
 *   DELETE /api/timesheets/{id}               — delete
 *   GET    /api/timesheets/summary/weekly     — weekly summary
 *   GET    /api/timesheets/summary/monthly    — monthly summary
 *   GET    /api/hr/timesheet-t13              — T-13 form data
 *   PUT    /api/hr/timesheet-t13/cell         — update T-13 cell
 *   GET    /api/hr/work-orders               — list work orders
 *   POST   /api/hr/work-orders               — create work order
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
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const TIMESHEET_ENTRY = {
  workDate: '2026-03-10',
  hoursWorked: 8,
  overtimeHours: 0,
  notes: 'E2E-Табель: прокладка кабеля ВВГнг 3×2.5, секция 4, этаж 2',
};

const OVERTIME_ENTRY = {
  workDate: '2026-03-11',
  hoursWorked: 10,
  overtimeHours: 2,
  notes: 'E2E-Табель: сверхурочные — срочный монтаж щитовой ШР-1',
};

const WORK_ORDER = {
  type: 'task_order' as const,
  crewName: 'E2E-Бригада электромонтажников №3',
  workDescription: 'E2E-НЗ: Прокладка кабеля ВВГнг 3×2.5, секция 4-5',
  date: '2026-03-10',
  endDate: '2026-03-14',
  safetyRequirements: 'Допуск III группа ЭБ, каска, диэлектрические перчатки',
  hazardousConditions: 'Работа вблизи токоведущих частей 0.4кВ',
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let createdTimesheetId = '';
let employeeId = '';
let projectId = '';
const cleanupIds: { endpoint: string; id: string }[] = [];

/* ================================================================== */
/*  TESTS                                                              */
/* ================================================================== */

test.describe.serial('Timesheets CRUD', () => {
  test.beforeAll(async () => {
    await getToken();

    // Find or create an employee to use for timesheets
    try {
      const empRes = await fetch(`${API}/api/employees`, { headers: headers() });
      if (empRes.ok) {
        const json = await empRes.json();
        const list = json.content ?? json.data ?? json;
        if (Array.isArray(list) && list.length > 0) {
          employeeId = list[0].id;
        }
      }
    } catch { /* use fallback */ }

    if (!employeeId) {
      // Create a test employee
      const empRes = await fetch(`${API}/api/employees`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          firstName: 'Дмитрий',
          lastName: 'E2E-ТабельТест',
          fullName: 'E2E-ТабельТест Дмитрий',
          position: 'Электромонтажник',
          hireDate: '2024-01-01',
          status: 'ACTIVE',
        }),
      });
      if (empRes.ok) {
        const json = await empRes.json();
        const emp = json.data ?? json;
        employeeId = emp.id;
        cleanupIds.push({ endpoint: '/api/employees', id: emp.id });
      }
    }

    // Find a project
    try {
      const projRes = await fetch(`${API}/api/projects`, { headers: headers() });
      if (projRes.ok) {
        const json = await projRes.json();
        const list = json.content ?? json.data ?? json;
        if (Array.isArray(list) && list.length > 0) {
          projectId = list[0].id;
        }
      }
    } catch { /* ignore */ }
  });

  test.afterAll(async () => {
    if (issues.length > 0) {
      console.log('\n=== TIMESHEET ISSUES ===');
      issues.forEach((i) =>
        console.log(`  ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`),
      );
    }

    // Cleanup timesheets
    if (createdTimesheetId) {
      await fetch(`${API}/api/timesheets/${createdTimesheetId}`, {
        method: 'DELETE',
        headers: headers(),
      }).catch(() => null);
    }
    // Cleanup other entities in reverse
    for (const { endpoint, id } of [...cleanupIds].reverse()) {
      await fetch(`${API}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: headers(),
      }).catch(() => null);
    }
  });

  // ─── CREATE ──────────────────────────────────────────────────────

  test('CREATE — timesheet entry via API', async () => {
    const body: Record<string, unknown> = {
      ...TIMESHEET_ENTRY,
    };
    if (employeeId) body.employeeId = employeeId;
    if (projectId) body.projectId = projectId;

    const res = await fetch(`${API}/api/timesheets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    expect(res.status, `Timesheet creation: ${res.status}`).toBeLessThan(300);
    const json = await res.json();
    const ts = json.data ?? json;
    createdTimesheetId = ts.id;

    expect(createdTimesheetId).toBeTruthy();
    expect(ts.hoursWorked ?? ts.hours).toBe(TIMESHEET_ENTRY.hoursWorked);
  });

  test('CREATE — verify in API list', async () => {
    const res = await fetch(`${API}/api/timesheets`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json;

    expect(Array.isArray(list)).toBeTruthy();
    if (createdTimesheetId && Array.isArray(list)) {
      const found = list.find((t: any) => t.id === createdTimesheetId);
      if (!found) {
        trackIssue({
          entity: 'Timesheet',
          operation: 'CREATE-LIST',
          issue: 'Created timesheet not found in list',
          severity: '[MAJOR]',
          expected: `Timesheet ${createdTimesheetId} in list`,
          actual: 'Not found',
        });
      }
    }
  });

  test('CREATE — overtime entry (10h + 2h overtime)', async () => {
    const body: Record<string, unknown> = { ...OVERTIME_ENTRY };
    if (employeeId) body.employeeId = employeeId;
    if (projectId) body.projectId = projectId;

    const res = await fetch(`${API}/api/timesheets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const ts = json.data ?? json;
      cleanupIds.push({ endpoint: '/api/timesheets', id: ts.id });

      // Verify overtime tracked
      expect(ts.overtimeHours ?? ts.overtime ?? 0).toBe(OVERTIME_ENTRY.overtimeHours);
    } else {
      trackIssue({
        entity: 'Timesheet',
        operation: 'CREATE-OVERTIME',
        issue: 'Cannot create timesheet with overtime hours',
        severity: '[MAJOR]',
        expected: '2xx response',
        actual: `${res.status}`,
      });
    }
  });

  // ─── READ ────────────────────────────────────────────────────────

  test('READ — timesheet detail via API', async () => {
    if (!createdTimesheetId) return test.skip();

    const res = await fetch(`${API}/api/timesheets/${createdTimesheetId}`, {
      headers: headers(),
    });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const ts = json.data ?? json;

    expect(ts.hoursWorked ?? ts.hours).toBe(TIMESHEET_ENTRY.hoursWorked);
    expect(ts.workDate ?? ts.date).toContain('2026-03-10');
  });

  test('READ — UI timesheet list loads', async ({ page }) => {
    await page.goto('/timesheets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    const body = await page.locator('body').innerText();
    const hasTimesheetContent =
      body.includes('Табел') ||
      body.includes('Timesheet') ||
      body.includes('Часы') ||
      body.includes('Hours') ||
      body.includes('timesheet');

    if (!hasTimesheetContent) {
      trackIssue({
        entity: 'Timesheet',
        operation: 'READ-UI',
        issue: 'Timesheet list page has no relevant content',
        severity: '[MAJOR]',
        expected: 'Table with employee/date/hours columns',
        actual: 'No timesheet content detected',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/timesheets-list.png' });
  });

  test('READ — UI timesheet detail page', async ({ page }) => {
    if (!createdTimesheetId) return test.skip();

    await page.goto(`/timesheets/${createdTimesheetId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();
    // Should show hours and date
    const hasDetail =
      body.includes('8') || body.includes('10.03') || body.includes('2026');

    await page.screenshot({ path: 'e2e/screenshots/timesheet-detail.png' });
  });

  // ─── UPDATE ──────────────────────────────────────────────────────

  test('UPDATE — modify hours via API', async () => {
    if (!createdTimesheetId) return test.skip();

    const updateBody: Record<string, unknown> = {
      ...TIMESHEET_ENTRY,
      hoursWorked: 9,
      notes: 'E2E-Табель: обновлённый — +1 час на наладку',
    };
    if (employeeId) updateBody.employeeId = employeeId;
    if (projectId) updateBody.projectId = projectId;

    const res = await fetch(`${API}/api/timesheets/${createdTimesheetId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(updateBody),
    });

    expect(res.status).toBeLessThan(300);

    // Verify
    const getRes = await fetch(`${API}/api/timesheets/${createdTimesheetId}`, {
      headers: headers(),
    });
    if (getRes.ok) {
      const json = await getRes.json();
      const ts = json.data ?? json;
      expect(ts.hoursWorked ?? ts.hours).toBe(9);
    }
  });

  // ─── STATUS TRANSITIONS ─────────────────────────────────────────

  test('STATUS — DRAFT → SUBMITTED', async () => {
    if (!createdTimesheetId) return test.skip();

    const res = await fetch(`${API}/api/timesheets/${createdTimesheetId}/submit`, {
      method: 'PATCH',
      headers: headers(),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Timesheet',
        operation: 'STATUS-SUBMIT',
        issue: `Submit transition failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: '2xx',
        actual: `${res.status}`,
      });
      return;
    }

    const json = await res.json();
    const ts = json.data ?? json;
    expect(ts.status).toBe('SUBMITTED');
  });

  test('STATUS — SUBMITTED → APPROVED', async () => {
    if (!createdTimesheetId) return test.skip();

    const res = await fetch(`${API}/api/timesheets/${createdTimesheetId}/approve`, {
      method: 'PATCH',
      headers: headers(),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Timesheet',
        operation: 'STATUS-APPROVE',
        issue: `Approve transition failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: '2xx',
        actual: `${res.status}`,
      });
      return;
    }

    const json = await res.json();
    const ts = json.data ?? json;
    expect(ts.status).toBe('APPROVED');
  });

  test('STATUS — rejection flow (SUBMITTED → REJECTED)', async () => {
    // Create a new timesheet for rejection test
    const body: Record<string, unknown> = {
      workDate: '2026-03-12',
      hoursWorked: 8,
      overtimeHours: 0,
      notes: 'E2E-Табель: тест отклонения',
    };
    if (employeeId) body.employeeId = employeeId;
    if (projectId) body.projectId = projectId;

    const createRes = await fetch(`${API}/api/timesheets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!createRes.ok) return;

    const created = await createRes.json();
    const ts = created.data ?? created;
    const tsId = ts.id;
    cleanupIds.push({ endpoint: '/api/timesheets', id: tsId });

    // Submit it
    await fetch(`${API}/api/timesheets/${tsId}/submit`, {
      method: 'PATCH',
      headers: headers(),
    });

    // Reject it
    const rejectRes = await fetch(`${API}/api/timesheets/${tsId}/reject`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ reason: 'Некорректное количество часов' }),
    });

    if (rejectRes.ok) {
      const json = await rejectRes.json();
      const rejected = json.data ?? json;
      expect(rejected.status).toBe('REJECTED');
    } else {
      trackIssue({
        entity: 'Timesheet',
        operation: 'STATUS-REJECT',
        issue: `Reject transition failed: ${rejectRes.status}`,
        severity: '[MAJOR]',
        expected: '2xx',
        actual: `${rejectRes.status}`,
      });
    }
  });

  // ─── T-13 FORM ──────────────────────────────────────────────────

  test('T-13 — UI page loads', async ({ page }) => {
    await page.goto('/hr/timesheet-t13', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();

    // T-13 should show employee rows with day cells
    const hasT13Content =
      body.includes('Т-13') ||
      body.includes('T-13') ||
      body.includes('Табель') ||
      body.includes('Timesheet') ||
      body.includes('Код') ||
      body.includes('Часы');

    if (!hasT13Content) {
      trackIssue({
        entity: 'Timesheet',
        operation: 'T13-UI',
        issue: 'T-13 page has no statutory form content',
        severity: '[MAJOR]',
        expected: 'T-13 grid with employee rows and day columns',
        actual: 'No T-13 content detected',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/timesheet-t13.png' });
  });

  test('T-13 — API returns structured data', async () => {
    if (!projectId) return test.skip();

    const res = await fetch(
      `${API}/api/hr/timesheet-t13?projectId=${projectId}&month=3&year=2026`,
      { headers: headers() },
    );

    if (!res.ok) {
      trackIssue({
        entity: 'Timesheet',
        operation: 'T13-API',
        issue: `T-13 API returned ${res.status}`,
        severity: '[MAJOR]',
        expected: '200 with TimesheetT13Row[]',
        actual: `${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const rows = Array.isArray(data) ? data : data.data ?? [];

    // Each row should have: employeeId, employeeName, cells, totalDays, totalHours
    if (rows.length > 0) {
      const row = rows[0];
      expect(row).toHaveProperty('employeeName');

      if (row.cells && Array.isArray(row.cells)) {
        // Verify T-13 attendance codes
        const validCodes = ['Я', 'В', 'Б', 'ОТ', 'Н', 'С', 'К', 'НН', 'ПР', 'Р', 'РВ', ''];
        for (const cell of row.cells) {
          if (cell.code && !validCodes.includes(cell.code)) {
            trackIssue({
              entity: 'Timesheet',
              operation: 'T13-CODES',
              issue: `Unknown T-13 code: ${cell.code}`,
              severity: '[MINOR]',
              expected: `One of: ${validCodes.join(', ')}`,
              actual: cell.code,
            });
            break;
          }
        }
      }
    }
  });

  // ─── OVERTIME WARNINGS ──────────────────────────────────────────

  test('VALIDATION — exceeding 12 hours per day', async () => {
    // ст. 99 ТК РФ: max 12 hours per day
    const body: Record<string, unknown> = {
      workDate: '2026-03-13',
      hoursWorked: 14,
      overtimeHours: 6,
      notes: 'E2E-Табель: тест превышения 12 часов',
    };
    if (employeeId) body.employeeId = employeeId;
    if (projectId) body.projectId = projectId;

    const res = await fetch(`${API}/api/timesheets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const ts = json.data ?? json;
      cleanupIds.push({ endpoint: '/api/timesheets', id: ts.id });

      trackIssue({
        entity: 'Timesheet',
        operation: 'OVERTIME',
        issue: 'Backend accepts 14h workday without warning (ст.99 ТК РФ max 12h)',
        severity: '[MISSING]',
        expected: 'Warning or validation error for >12h',
        actual: 'Created without warning',
      });
    }
    // If rejected — backend enforces limit, which is correct
  });

  test('VALIDATION — weekly hours exceed 40', async () => {
    // ст. 91 ТК РФ: norm 40h per week
    // This is tracked via weekly summary, not per-entry
    if (!employeeId) return test.skip();

    const res = await fetch(
      `${API}/api/timesheets/summary/weekly?employeeId=${employeeId}`,
      { headers: headers() },
    );

    if (res.ok) {
      const data = await res.json();
      const summary = data.data ?? data;
      // If weekly total > 40 — should flag
      if (summary.totalHours > 40) {
        trackIssue({
          entity: 'Timesheet',
          operation: 'WEEKLY-NORM',
          issue: `Weekly total ${summary.totalHours}h exceeds 40h norm`,
          severity: '[MINOR]',
          expected: 'Warning for >40h/week',
          actual: `${summary.totalHours}h accepted`,
        });
      }
    }
  });

  // ─── WORK ORDERS ────────────────────────────────────────────────

  test('WORK ORDER — create наряд-заказ', async () => {
    if (!projectId) return test.skip();

    const woBody = {
      ...WORK_ORDER,
      projectId,
    };

    const res = await fetch(`${API}/api/hr/work-orders`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(woBody),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'WorkOrder',
        operation: 'CREATE',
        issue: `Work order creation failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: '2xx',
        actual: `${res.status}`,
      });
      return;
    }

    const json = await res.json();
    const wo = json.data ?? json;
    expect(wo.id || wo.number).toBeTruthy();

    if (wo.id) {
      // Note: no dedicated delete endpoint for work orders, cleanup not needed
    }
  });

  test('WORK ORDER — UI page loads', async ({ page }) => {
    await page.goto('/hr/work-orders', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();
    const hasContent =
      body.includes('Наряд') ||
      body.includes('Work Order') ||
      body.includes('Допуск') ||
      body.includes('Задание');

    if (!hasContent) {
      trackIssue({
        entity: 'WorkOrder',
        operation: 'UI',
        issue: 'Work orders page has no relevant content',
        severity: '[MINOR]',
        expected: 'Work order list or board',
        actual: 'No content detected',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/work-orders.png' });
  });

  // ─── SUMMARIES ──────────────────────────────────────────────────

  test('SUMMARY — monthly totals via API', async () => {
    if (!employeeId) return test.skip();

    const res = await fetch(
      `${API}/api/timesheets/summary/monthly?employeeId=${employeeId}&month=3&year=2026`,
      { headers: headers() },
    );

    if (res.ok) {
      const data = await res.json();
      const summary = data.data ?? data;
      // Monthly summary should have totalHours, workDays
      if (summary.totalHours !== undefined) {
        expect(summary.totalHours).toBeGreaterThanOrEqual(0);
      }
    } else {
      trackIssue({
        entity: 'Timesheet',
        operation: 'SUMMARY',
        issue: `Monthly summary API returned ${res.status}`,
        severity: '[MINOR]',
        expected: '200 with summary data',
        actual: `${res.status}`,
      });
    }
  });

  // ─── DELETE ──────────────────────────────────────────────────────

  test('DELETE — timesheet via API', async () => {
    if (!createdTimesheetId) return test.skip();

    const res = await fetch(`${API}/api/timesheets/${createdTimesheetId}`, {
      method: 'DELETE',
      headers: headers(),
    });

    expect([200, 204, 404]).toContain(res.status);
    createdTimesheetId = '';
  });
});
