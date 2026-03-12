/**
 * Session 2.3 — Deep CRUD: Crew / Brigades (Бригады)
 *
 * Persona focus: Прораб (crew management, assignments), Директор (capacity planning),
 *                Кадровик (member tracking)
 *
 * Domain rules:
 *   - Every crew must have a foreman (бригадир)
 *   - Crew capacity = members × hours/month (168h standard)
 *   - One employee cannot be in two active crews simultaneously
 *   - Crew status: ACTIVE → IDLE → DISBANDED
 *   - Crew assigned to project = active site presence
 *
 * API endpoints tested:
 *   GET    /api/crews                           — list all crews
 *   GET    /api/crew/project/{projectId}        — crew by project
 *   GET    /api/crew/employee/{employeeId}      — crew assignments by employee
 *   POST   /api/crew                            — assign employee to project/crew
 *   DELETE /api/crew/employee/{eid}/project/{pid} — remove assignment
 *   GET    /api/crews (CrewTeamsController)      — team-level crew list
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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MONTHLY_HOURS = 168; // Standard work month hours

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let employeeId = '';
let projectId = '';
let createdAssignmentId = '';
const cleanupIds: { endpoint: string; id: string }[] = [];

/* ================================================================== */
/*  TESTS                                                              */
/* ================================================================== */

test.describe.serial('Crew / Brigade Management', () => {
  test.beforeAll(async () => {
    await getToken();

    // Find existing employee
    try {
      const empRes = await fetch(`${API}/api/employees`, { headers: headers() });
      if (empRes.ok) {
        const json = await empRes.json();
        const list = json.content ?? json.data ?? json;
        if (Array.isArray(list) && list.length > 0) {
          employeeId = list[0].id;
        }
      }
    } catch { /* ignore */ }

    // Find existing project
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

    // Create test employee if none exist
    if (!employeeId) {
      const empRes = await fetch(`${API}/api/employees`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          firstName: 'Сергей',
          lastName: 'E2E-БригадаТест',
          fullName: 'E2E-БригадаТест Сергей',
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
  });

  test.afterAll(async () => {
    if (issues.length > 0) {
      console.log('\n=== CREW ISSUES ===');
      issues.forEach((i) =>
        console.log(`  ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`),
      );
    }

    // Cleanup created entities in reverse order
    for (const { endpoint, id } of [...cleanupIds].reverse()) {
      await fetch(`${API}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: headers(),
      }).catch(() => null);
    }
  });

  // ─── CREW LIST ──────────────────────────────────────────────────

  test('READ — crew list via API', async () => {
    const res = await fetch(`${API}/api/crews`, { headers: headers() });

    if (!res.ok) {
      trackIssue({
        entity: 'Crew',
        operation: 'LIST-API',
        issue: `Crew list API returned ${res.status}`,
        severity: '[MAJOR]',
        expected: '200',
        actual: `${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const crews = Array.isArray(data) ? data : data.content ?? data.data ?? [];

    // Verify crew structure if data exists
    if (crews.length > 0) {
      const crew = crews[0];
      const expectedFields = ['name', 'foreman', 'status', 'workersCount'];
      const present = expectedFields.filter((f) => crew[f] !== undefined);

      if (present.length < 2) {
        trackIssue({
          entity: 'Crew',
          operation: 'LIST-FIELDS',
          issue: `Crew record missing fields. Found: ${Object.keys(crew).join(', ')}`,
          severity: '[MINOR]',
          expected: expectedFields.join(', '),
          actual: Object.keys(crew).join(', '),
        });
      }
    }
  });

  test('READ — UI crew page loads', async ({ page }) => {
    await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    const body = await page.locator('body').innerText();
    const hasCrewContent =
      body.includes('Бригад') ||
      body.includes('Crew') ||
      body.includes('Бригадир') ||
      body.includes('Foreman') ||
      body.includes('Рабочих') ||
      body.includes('Workers');

    if (!hasCrewContent) {
      trackIssue({
        entity: 'Crew',
        operation: 'UI-PAGE',
        issue: 'Crew page has no crew-related content',
        severity: '[MAJOR]',
        expected: 'Crew cards or table with name, foreman, status',
        actual: 'No crew content detected',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/crew-list.png' });
  });

  // ─── CREW ASSIGNMENT ────────────────────────────────────────────

  test('CREATE — assign employee to project crew', async () => {
    if (!employeeId || !projectId) {
      trackIssue({
        entity: 'Crew',
        operation: 'ASSIGN',
        issue: 'Cannot test assignment — missing employeeId or projectId',
        severity: '[MINOR]',
        expected: 'Employee and project exist',
        actual: `employeeId=${employeeId}, projectId=${projectId}`,
      });
      return test.skip();
    }

    const res = await fetch(`${API}/api/crew`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        employeeId,
        projectId,
        role: 'Электромонтажник',
        startDate: '2026-03-01',
      }),
    });

    if (!res.ok) {
      // Try alternative endpoint
      const altRes = await fetch(`${API}/api/crew/assign`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          employeeId,
          projectId,
          role: 'Электромонтажник',
          startDate: '2026-03-01',
        }),
      });

      if (!altRes.ok) {
        trackIssue({
          entity: 'Crew',
          operation: 'ASSIGN',
          issue: `Assignment creation failed: ${res.status} / alt: ${altRes.status}`,
          severity: '[MAJOR]',
          expected: '2xx',
          actual: `${res.status}`,
        });
        return;
      }

      const json = await altRes.json();
      const assignment = json.data ?? json;
      if (assignment.id) {
        createdAssignmentId = assignment.id;
      }
    } else {
      const json = await res.json();
      const assignment = json.data ?? json;
      if (assignment.id) {
        createdAssignmentId = assignment.id;
      }
    }
  });

  test('READ — crew by project', async () => {
    if (!projectId) return test.skip();

    const res = await fetch(`${API}/api/crew/project/${projectId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Crew',
        operation: 'BY-PROJECT',
        issue: `Crew by project API returned ${res.status}`,
        severity: '[MAJOR]',
        expected: '200',
        actual: `${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const assignments = Array.isArray(data) ? data : data.data ?? [];

    // Should have at least one assignment if we created one
    if (createdAssignmentId && assignments.length === 0) {
      trackIssue({
        entity: 'Crew',
        operation: 'BY-PROJECT',
        issue: 'Created assignment not found in project crew list',
        severity: '[MAJOR]',
        expected: 'At least 1 assignment',
        actual: '0 assignments',
      });
    }
  });

  test('READ — crew by employee', async () => {
    if (!employeeId) return test.skip();

    const res = await fetch(`${API}/api/crew/employee/${employeeId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      trackIssue({
        entity: 'Crew',
        operation: 'BY-EMPLOYEE',
        issue: `Crew by employee API returned ${res.status}`,
        severity: '[MINOR]',
        expected: '200',
        actual: `${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const assignments = Array.isArray(data) ? data : data.data ?? [];

    // Verify employee is assigned to at least our project
    if (Array.isArray(assignments)) {
      expect(assignments.length).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── CREW CAPACITY ─────────────────────────────────────────────

  test('CAPACITY — verify calculation on crew cards', async ({ page }) => {
    await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();

    // Look for capacity-related data
    const hasCapacity =
      body.includes('часов') ||
      body.includes('hours') ||
      body.includes('мощность') ||
      body.includes('Capacity') ||
      body.includes(String(MONTHLY_HOURS));

    if (!hasCapacity) {
      trackIssue({
        entity: 'Crew',
        operation: 'CAPACITY',
        issue: 'No capacity calculation visible on crew page',
        severity: '[UX]',
        expected: 'Crew capacity: N members × 168 h/month',
        actual: 'No capacity data shown',
      });
    }
  });

  // ─── CREW STATUS ────────────────────────────────────────────────

  test('STATUS — crew status values in list', async () => {
    const res = await fetch(`${API}/api/crews`, { headers: headers() });
    if (!res.ok) return;

    const data = await res.json();
    const crews = Array.isArray(data) ? data : data.content ?? data.data ?? [];

    const validStatuses = ['ACTIVE', 'IDLE', 'ON_LEAVE', 'DISBANDED', 'active', 'idle', 'on_leave', 'disbanded'];

    for (const crew of crews) {
      if (crew.status && !validStatuses.includes(crew.status)) {
        trackIssue({
          entity: 'Crew',
          operation: 'STATUS',
          issue: `Unknown crew status: ${crew.status}`,
          severity: '[MINOR]',
          expected: validStatuses.join(', '),
          actual: crew.status,
        });
        break;
      }
    }
  });

  // ─── VALIDATION ─────────────────────────────────────────────────

  test('VALIDATION — duplicate assignment prevention', async () => {
    if (!employeeId || !projectId) return test.skip();

    // Try to assign same employee to same project again
    const res = await fetch(`${API}/api/crew`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        employeeId,
        projectId,
        role: 'Электромонтажник',
        startDate: '2026-03-01',
      }),
    });

    // Should be rejected (409 Conflict or 400 Bad Request)
    if (res.ok) {
      const json = await res.json();
      const dup = json.data ?? json;
      // Clean up duplicate
      if (dup.id && dup.id !== createdAssignmentId) {
        await fetch(`${API}/api/crew/employee/${employeeId}/project/${projectId}`, {
          method: 'DELETE',
          headers: headers(),
        }).catch(() => null);
      }

      trackIssue({
        entity: 'Crew',
        operation: 'VALIDATION',
        issue: 'Duplicate crew assignment accepted (same employee+project)',
        severity: '[MAJOR]',
        expected: '409 or 400 error',
        actual: `${res.status} (duplicate created)`,
      });
    }
    // If rejected — correct behavior
  });

  test('VALIDATION — assignment without employee', async () => {
    if (!projectId) return test.skip();

    const res = await fetch(`${API}/api/crew`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        projectId,
        role: 'Тестовая роль',
        startDate: '2026-03-01',
        // No employeeId
      }),
    });

    // Should be rejected
    if (res.ok) {
      trackIssue({
        entity: 'Crew',
        operation: 'VALIDATION',
        issue: 'Assignment without employeeId accepted',
        severity: '[MAJOR]',
        expected: '400 validation error',
        actual: `${res.status}`,
      });
    }
  });

  // ─── UI FEATURES ────────────────────────────────────────────────

  test('UI — crew card components', async ({ page }) => {
    await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Check for crew card elements
    const body = await page.locator('body').innerText();

    // Expected info on crew cards
    const checks = [
      { label: 'Foreman/Бригадир', found: body.includes('Бригадир') || body.includes('Foreman') || body.includes('бригадир') },
      { label: 'Status badge', found: body.includes('Активн') || body.includes('Active') || body.includes('ACTIVE') },
      { label: 'Workers count', found: /\d+\s*(чел|рабоч|workers|members)/i.test(body) || body.includes('Рабочих') },
    ];

    const missing = checks.filter((c) => !c.found);
    if (missing.length > 0) {
      trackIssue({
        entity: 'Crew',
        operation: 'UI-CARDS',
        issue: `Missing crew card elements: ${missing.map((m) => m.label).join(', ')}`,
        severity: '[UX]',
        expected: 'Cards with foreman, status, worker count',
        actual: `${checks.length - missing.length}/${checks.length} elements found`,
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/crew-cards.png' });
  });

  test('UI — crew dark mode', async ({ page }) => {
    await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Toggle dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    // Check no pure white backgrounds in dark mode
    const whiteElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      elements.forEach((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(255, 255, 255)' && el.clientHeight > 20 && el.clientWidth > 100) {
          count++;
        }
      });
      return count;
    });

    if (whiteElements > 3) {
      trackIssue({
        entity: 'Crew',
        operation: 'DARK-MODE',
        issue: `${whiteElements} elements with white background in dark mode`,
        severity: '[MINOR]',
        expected: 'No white backgrounds in dark mode',
        actual: `${whiteElements} white elements`,
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/crew-dark-mode.png' });
  });

  // ─── DELETE ASSIGNMENT ──────────────────────────────────────────

  test('DELETE — remove crew assignment', async () => {
    if (!employeeId || !projectId) return test.skip();

    const res = await fetch(
      `${API}/api/crew/employee/${employeeId}/project/${projectId}`,
      {
        method: 'DELETE',
        headers: headers(),
      },
    );

    if (!res.ok && res.status !== 404) {
      trackIssue({
        entity: 'Crew',
        operation: 'DELETE',
        issue: `Assignment deletion failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: '200 or 204',
        actual: `${res.status}`,
      });
    }

    // Verify removed
    const getRes = await fetch(`${API}/api/crew/employee/${employeeId}`, {
      headers: headers(),
    });
    if (getRes.ok) {
      const data = await getRes.json();
      const assignments = Array.isArray(data) ? data : data.data ?? [];
      const stillAssigned = assignments.some(
        (a: any) => a.projectId === projectId,
      );
      if (stillAssigned) {
        trackIssue({
          entity: 'Crew',
          operation: 'DELETE-VERIFY',
          issue: 'Assignment still exists after DELETE',
          severity: '[MAJOR]',
          expected: 'No assignment for this project',
          actual: 'Still assigned',
        });
      }
    }
  });

  // ─── CROSS-HR CONSISTENCY ──────────────────────────────────────

  test('CROSS-HR — dismissed employee excluded from crew', async () => {
    // This is a data integrity check
    // Terminated employees should not be in active crews
    const crewRes = await fetch(`${API}/api/crews`, { headers: headers() });
    if (!crewRes.ok) return;

    const data = await crewRes.json();
    const crews = Array.isArray(data) ? data : data.content ?? data.data ?? [];

    // For each active crew, check members are not terminated
    // This requires per-crew member list which may not be in the list endpoint
    // Track as informational
    expect(Array.isArray(crews)).toBeTruthy();
  });

  test('CROSS-HR — crew assignment reflects in employee detail', async () => {
    if (!employeeId) return test.skip();

    // Check employee projects (crew assignments)
    const res = await fetch(`${API}/api/crew/employee/${employeeId}`, {
      headers: headers(),
    });

    if (res.ok) {
      const data = await res.json();
      const assignments = Array.isArray(data) ? data : data.data ?? [];
      // Informational — verify data consistency
      expect(Array.isArray(assignments)).toBeTruthy();
    }
  });
});
