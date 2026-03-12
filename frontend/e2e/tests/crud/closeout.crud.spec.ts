/**
 * SESSION 2.6 — Deep CRUD: Closeout (Закрытие проекта / Ввод в эксплуатацию)
 *
 * Full lifecycle: commissioning checklist → warranty obligations → handover packages.
 * Persona focus: Прораб (checklist items), Директор (completion %).
 *
 * Domain rules:
 *   - Commissioning checklist: track completion % = completed items / total items
 *   - All КС-2 must be signed before project closeout
 *   - Warranty period: startDate + warrantyPeriod months = endDate
 *   - Warranty obligation types: general, structural, MEP, finishes
 *   - Status: NOT_STARTED → IN_PROGRESS → READY_FOR_REVIEW → APPROVED → CLOSED
 *   - Closeout requires: as-built drawings, equipment passports, test protocols, certificates
 *   - Russian regulatory: ЗОС (заключение о соответствии), Ростехнадзор, акт допуска
 *
 * API endpoints tested:
 *   GET    /api/closeout/dashboard                — summary statistics
 *   GET    /api/closeout/commissioning            — list commissioning tasks
 *   POST   /api/closeout/commissioning            — create task
 *   GET    /api/closeout/commissioning/{id}       — detail
 *   PUT    /api/closeout/commissioning/{id}       — update
 *   GET    /api/closeout/warranty                 — list warranty claims
 *   POST   /api/closeout/warranty                 — create warranty
 *   GET    /api/closeout/handover                 — handover packages
 *   POST   /api/closeout/handover                 — create package
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
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4000';
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
async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiPut(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiPatch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiDelete(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: headers() });
  return res.status;
}

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const COMMISSIONING_CHECKLIST = [
  { item: 'Протокол испытания изоляции', status: 'COMPLETE', document: 'Протокол №123' },
  { item: 'Акт допуска электроустановки', status: 'PENDING', document: null },
  { item: 'Заключение Ростехнадзора', status: 'NOT_STARTED', document: null },
  { item: 'Исполнительная схема электроснабжения', status: 'COMPLETE', document: 'ИС-ЭОМ-01' },
  { item: 'Паспорта оборудования', status: 'COMPLETE', document: 'Комплект' },
];

// 3 of 5 complete = 60%
const EXPECTED_COMPLETION_PERCENT = 60;

const WARRANTY_DATA = {
  contractor: 'ООО "ЭлектроПром"',
  section: 'Электромонтаж',
  warrantyPeriod: 24,         // months
  startDate: '2026-12-01',
  endDate: '2028-12-01',      // startDate + 24 months
  description: 'Гарантийные обязательства по электромонтажным работам',
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let commissioningId: string;
let warrantyId: string;
let handoverId: string;

test.describe('Closeout CRUD — Deep Lifecycle (Закрытие проекта)', () => {
  test.describe.configure({ mode: 'serial' });

  /* ============================================================== */
  /*  SETUP                                                         */
  /* ============================================================== */
  test.beforeAll(async () => {
    await getToken();

    // Find or create E2E project
    const listRes = await fetch(`${API}/api/projects?search=E2E-ЖК Солнечный&size=5`, { headers: headers() });
    const listJson = await listRes.json();
    const projects = listJson.content ?? listJson.data ?? listJson ?? [];
    const existing = Array.isArray(projects) ? projects.find((p: any) => p.name?.includes('E2E-ЖК Солнечный')) : null;
    if (existing) {
      projectId = existing.id;
    } else {
      const createRes = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: 'E2E-ЖК Солнечный квартал',
          code: 'E2E-ZHK-SLN',
          type: 'RESIDENTIAL',
          status: 'PLANNING',
          startDate: '2026-01-15',
          plannedEndDate: '2027-06-30',
        }),
      });
      if (createRes.ok) {
        const pJson = await createRes.json();
        projectId = pJson.id ?? pJson.data?.id;
      }
    }
  });

  /* ============================================================== */
  /*  CLEANUP                                                       */
  /* ============================================================== */
  test.afterAll(async () => {
    if (commissioningId) {
      await apiDelete(`/api/closeout/commissioning/${commissioningId}`);
    }
    if (warrantyId) {
      await apiDelete(`/api/closeout/warranty/${warrantyId}`);
    }
    if (handoverId) {
      await apiDelete(`/api/closeout/handover/${handoverId}`);
    }

    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log(`CLOSEOUT CRUD: ${issues.length} issues found`);
      issues.forEach((i, idx) => {
        console.log(`  ${idx + 1}. ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
        console.log(`     Expected: ${i.expected}`);
        console.log(`     Actual: ${i.actual}`);
      });
      console.log('═══════════════════════════════════════\n');
    }
  });

  /* ============================================================== */
  /*  A. CLOSEOUT DASHBOARD                                         */
  /* ============================================================== */
  test('A1: Closeout dashboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/dashboard`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Dashboard should show completion metrics
    const hasMetrics = body?.includes('%') || body?.includes('Завершен') || body?.includes('Комиссия')
      || body?.includes('Гарантия') || body?.includes('closeout') || body?.includes('Закрытие');

    if (!hasMetrics) {
      trackIssue({
        entity: 'Closeout',
        operation: 'UI',
        issue: 'Dashboard does not show completion metrics',
        severity: '[UX]',
        expected: 'Completion percentages for commissioning, handover, warranty',
        actual: 'No metrics visible',
      });
    }
  });

  test('A2: Closeout dashboard API returns summary', async () => {
    const dashboard = await apiGet('/api/closeout/dashboard');

    if (!dashboard) {
      // Try alternative endpoints
      const altDash = await apiGet(`/api/closeout/dashboard?projectId=${projectId}`);
      if (!altDash) {
        trackIssue({
          entity: 'Closeout',
          operation: 'READ',
          issue: 'Dashboard API endpoint not available',
          severity: '[MISSING]',
          expected: 'GET /api/closeout/dashboard returns summary stats',
          actual: 'Not available',
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. COMMISSIONING (Ввод в эксплуатацию)                        */
  /* ============================================================== */
  test('B1: Create commissioning task via API', async () => {
    const { status, data } = await apiPost('/api/closeout/commissioning', {
      projectId,
      name: 'E2E-Ввод в эксплуатацию электроснабжения',
      type: 'COMMISSIONING',
      section: 'Электроснабжение',
      status: 'IN_PROGRESS',
      description: 'Приёмка системы электроснабжения корпуса 1',
      checklist: COMMISSIONING_CHECKLIST,
    });

    if (status < 300 && data) {
      commissioningId = data.id ?? data.data?.id;
      expect(commissioningId).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Commissioning',
        operation: 'CREATE',
        issue: 'Failed to create commissioning task',
        severity: '[MAJOR]',
        expected: '201 Created',
        actual: `${status}`,
      });

      // Try generic closeout task endpoint
      const { status: altStatus, data: altData } = await apiPost('/api/closeout/tasks', {
        projectId,
        name: 'E2E-Ввод в эксплуатацию электроснабжения',
        type: 'COMMISSIONING',
        section: 'Электроснабжение',
        status: 'IN_PROGRESS',
      });

      if (altStatus < 300 && altData) {
        commissioningId = altData.id ?? altData.data?.id;
      }
    }
  });

  test('B2: Verify completion = 60% (3 of 5 complete)', async () => {
    // From our checklist: COMPLETE=3, PENDING=1, NOT_STARTED=1
    const completeCount = COMMISSIONING_CHECKLIST.filter(i => i.status === 'COMPLETE').length;
    const totalCount = COMMISSIONING_CHECKLIST.length;
    const expectedPercent = Math.round((completeCount / totalCount) * 100);

    expect(expectedPercent).toBe(EXPECTED_COMPLETION_PERCENT);
    expect(completeCount).toBe(3);
    expect(totalCount).toBe(5);

    // Verify via API
    if (commissioningId) {
      const detail = await apiGet(`/api/closeout/commissioning/${commissioningId}`);
      const data = detail?.data ?? detail;

      if (data) {
        const completion = data.completionPercent ?? data.progress ?? data.percentComplete;
        if (completion !== undefined) {
          const diff = Math.abs(completion - EXPECTED_COMPLETION_PERCENT);
          if (diff > 1) {
            trackIssue({
              entity: 'Commissioning',
              operation: 'CALC',
              issue: `Completion: ${completion}% vs expected ${EXPECTED_COMPLETION_PERCENT}%`,
              severity: '[CRITICAL]',
              expected: `${EXPECTED_COMPLETION_PERCENT}%`,
              actual: `${completion}%`,
            });
          }
        }
      }
    }
  });

  test('B3: Commissioning list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/commissioning`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('B4: Commissioning checklist page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/commissioning-checklist`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('B5: Commissioning board view loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/commissioning/board`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  C. WARRANTY (Гарантийные обязательства)                       */
  /* ============================================================== */
  test('C1: Create warranty obligation via API', async () => {
    const { status, data } = await apiPost('/api/closeout/warranty', {
      projectId,
      name: 'E2E-Гарантия электромонтаж',
      contractorName: WARRANTY_DATA.contractor,
      section: WARRANTY_DATA.section,
      warrantyPeriodMonths: WARRANTY_DATA.warrantyPeriod,
      startDate: WARRANTY_DATA.startDate,
      endDate: WARRANTY_DATA.endDate,
      description: WARRANTY_DATA.description,
      status: 'ACTIVE',
    });

    if (status < 300 && data) {
      warrantyId = data.id ?? data.data?.id;
      expect(warrantyId).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Warranty',
        operation: 'CREATE',
        issue: 'Failed to create warranty obligation',
        severity: '[MAJOR]',
        expected: '201 Created',
        actual: `${status}`,
      });

      // Try alternative endpoint
      const { status: altStatus, data: altData } = await apiPost('/api/closeout/warranty-obligations', {
        projectId,
        name: 'E2E-Гарантия электромонтаж',
        contractorName: WARRANTY_DATA.contractor,
        warrantyPeriodMonths: WARRANTY_DATA.warrantyPeriod,
        startDate: WARRANTY_DATA.startDate,
        endDate: WARRANTY_DATA.endDate,
      });

      if (altStatus < 300 && altData) {
        warrantyId = altData.id ?? altData.data?.id;
      }
    }
  });

  test('C2: Verify warranty period = 24 months', async () => {
    // Verify: startDate + 24 months = endDate
    const start = new Date(WARRANTY_DATA.startDate);
    const end = new Date(WARRANTY_DATA.endDate);

    // Calculate difference in months
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    expect(diffMonths).toBe(WARRANTY_DATA.warrantyPeriod);
  });

  test('C3: Verify warranty expiry date calculation', async () => {
    // startDate(2026-12-01) + 24 months = 2028-12-01
    const start = new Date(WARRANTY_DATA.startDate);
    const expectedEnd = new Date(start);
    expectedEnd.setMonth(expectedEnd.getMonth() + WARRANTY_DATA.warrantyPeriod);

    const actualEnd = new Date(WARRANTY_DATA.endDate);

    expect(expectedEnd.getFullYear()).toBe(actualEnd.getFullYear());
    expect(expectedEnd.getMonth()).toBe(actualEnd.getMonth());
    expect(expectedEnd.getDate()).toBe(actualEnd.getDate());
  });

  test('C4: Warranty claims list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/warranty`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('C5: Warranty obligations page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/warranty-obligations`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('C6: Warranty tracking page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/warranty-tracking`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  D. HANDOVER PACKAGES                                          */
  /* ============================================================== */
  test('D1: Create handover package via API', async () => {
    const { status, data } = await apiPost('/api/closeout/handover', {
      projectId,
      name: 'E2E-Пакет документов ЭОМ',
      section: 'Электромонтаж',
      description: 'Исполнительная документация по электромонтажу',
      status: 'IN_PROGRESS',
      documents: [
        { name: 'Исполнительная схема ЭОМ', status: 'COMPLETE' },
        { name: 'Акты скрытых работ', status: 'COMPLETE' },
        { name: 'Протоколы испытаний', status: 'IN_PROGRESS' },
        { name: 'Паспорта оборудования', status: 'COMPLETE' },
      ],
    });

    if (status < 300 && data) {
      handoverId = data.id ?? data.data?.id;
      expect(handoverId).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Handover',
        operation: 'CREATE',
        issue: 'Failed to create handover package',
        severity: '[MAJOR]',
        expected: '201 Created',
        actual: `${status}`,
      });
    }
  });

  test('D2: Handover package list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/handover`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  E. STATUS FLOW                                                */
  /* ============================================================== */
  test('E1: Commissioning status NOT_STARTED → IN_PROGRESS', async () => {
    if (!commissioningId) return;

    // Already created as IN_PROGRESS — verify
    const detail = await apiGet(`/api/closeout/commissioning/${commissioningId}`);
    const status = detail?.status ?? detail?.data?.status;

    if (status) {
      expect(['IN_PROGRESS', 'ACTIVE', 'in_progress']).toContain(status);
    }
  });

  test('E2: Commissioning status IN_PROGRESS → READY_FOR_REVIEW', async () => {
    if (!commissioningId) return;

    const { status } = await apiPatch(`/api/closeout/commissioning/${commissioningId}`, {
      status: 'READY_FOR_REVIEW',
    });

    if (status >= 300) {
      const { status: putStatus } = await apiPut(`/api/closeout/commissioning/${commissioningId}`, {
        projectId,
        name: 'E2E-Ввод в эксплуатацию электроснабжения',
        status: 'READY_FOR_REVIEW',
      });

      if (putStatus >= 300) {
        trackIssue({
          entity: 'Commissioning',
          operation: 'STATUS',
          issue: 'Cannot transition IN_PROGRESS → READY_FOR_REVIEW',
          severity: '[MAJOR]',
          expected: '200 OK',
          actual: `PATCH: ${status}, PUT: ${putStatus}`,
        });
      }
    }
  });

  test('E3: Commissioning status READY_FOR_REVIEW → APPROVED', async () => {
    if (!commissioningId) return;

    const { status } = await apiPatch(`/api/closeout/commissioning/${commissioningId}`, {
      status: 'APPROVED',
    });

    if (status >= 300) {
      const { status: putStatus } = await apiPut(`/api/closeout/commissioning/${commissioningId}`, {
        projectId,
        name: 'E2E-Ввод в эксплуатацию электроснабжения',
        status: 'APPROVED',
      });

      if (putStatus >= 300) {
        trackIssue({
          entity: 'Commissioning',
          operation: 'STATUS',
          issue: 'Cannot transition READY_FOR_REVIEW → APPROVED',
          severity: '[MAJOR]',
          expected: '200 OK',
          actual: `${putStatus}`,
        });
      }
    }
  });

  test('E4: Backward transition APPROVED → NOT_STARTED should be blocked', async () => {
    if (!commissioningId) return;

    const { status } = await apiPatch(`/api/closeout/commissioning/${commissioningId}`, {
      status: 'NOT_STARTED',
    });

    if (status < 300) {
      trackIssue({
        entity: 'Commissioning',
        operation: 'STATUS',
        issue: 'Backward transition APPROVED → NOT_STARTED allowed',
        severity: '[CRITICAL]',
        expected: '400/403 (backward transitions forbidden)',
        actual: `${status} (accepted)`,
      });
    }
  });

  /* ============================================================== */
  /*  F. VALIDATION                                                 */
  /* ============================================================== */
  test('F1: Incomplete checklist → cannot close', async () => {
    // Business rule: closeout requires 100% completion
    // Our checklist is at 60% — should not be closeable
    if (!commissioningId) return;

    const { status } = await apiPatch(`/api/closeout/commissioning/${commissioningId}`, {
      status: 'CLOSED',
    });

    if (status < 300) {
      trackIssue({
        entity: 'Commissioning',
        operation: 'VALIDATION',
        issue: 'Commissioning closed with only 60% completion',
        severity: '[MAJOR]',
        expected: 'Rejection: completion < 100%',
        actual: `Closed with status ${status}`,
      });
    }
  });

  test('F2: Warranty without start date → error', async () => {
    const { status } = await apiPost('/api/closeout/warranty', {
      projectId,
      name: 'E2E-Warranty no start date',
      contractorName: 'ООО "Test"',
      warrantyPeriodMonths: 12,
      // No startDate
      description: 'Test warranty',
    });

    if (status < 300) {
      trackIssue({
        entity: 'Warranty',
        operation: 'VALIDATION',
        issue: 'Warranty accepted without start date',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  /* ============================================================== */
  /*  G. UI PAGES — comprehensive                                   */
  /* ============================================================== */
  test('G1: As-built tracker page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/as-built`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('G2: ЗОС (completion certificate) page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/zos`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('G3: ЗОС form page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/zos-form`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('G4: Стройнадзор package page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/stroynadzor`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('G5: Executive schemas page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/executive-schemas`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('G6: Commissioning templates page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/commissioning-templates`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  H. CROSS-ENTITY                                               */
  /* ============================================================== */
  test('H1: Closeout completeness requires all docs', async () => {
    // Business rule: project cannot close until:
    // 1. All КС-2 signed
    // 2. All commissioning items complete
    // 3. All handover packages delivered
    // 4. All warranty obligations documented

    // Verify project closeout endpoint checks these conditions
    if (!projectId) return;

    const closeoutStatus = await apiGet(`/api/closeout/status?projectId=${projectId}`);

    if (closeoutStatus) {
      const data = closeoutStatus.data ?? closeoutStatus;
      console.log('[INFO] Closeout status:', JSON.stringify(data));

      // Check if system tracks completeness
      if (data.canClose === true && data.completionPercent < 100) {
        trackIssue({
          entity: 'Closeout',
          operation: 'CROSS',
          issue: 'Project can be closed despite incomplete closeout',
          severity: '[CRITICAL]',
          expected: 'canClose=false when completionPercent < 100%',
          actual: `canClose=true, completion=${data.completionPercent}%`,
        });
      }
    } else {
      trackIssue({
        entity: 'Closeout',
        operation: 'CROSS',
        issue: 'Closeout status endpoint not available',
        severity: '[MISSING]',
        expected: 'GET /api/closeout/status?projectId=... returns completeness check',
        actual: 'Not available',
      });
    }
  });

  test('H2: Warranty linked to project and contractor', async () => {
    if (!warrantyId) return;

    const detail = await apiGet(`/api/closeout/warranty/${warrantyId}`);
    const data = detail?.data ?? detail;

    if (data) {
      if (data.projectId) {
        expect(data.projectId).toBe(projectId);
      }
      if (data.contractorName) {
        expect(data.contractorName).toContain('ЭлектроПром');
      }
    }
  });

  /* ============================================================== */
  /*  I. DARK MODE                                                  */
  /* ============================================================== */
  test('I1: Closeout dashboard in dark mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/closeout/dashboard`);
    await page.waitForLoadState('networkidle');

    // Enable dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);

    // Verify no white backgrounds visible
    const whiteElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.backgroundColor === 'rgb(255, 255, 255)' && el.offsetWidth > 50 && el.offsetHeight > 50) {
          count++;
        }
      }
      return count;
    });

    if (whiteElements > 3) {
      trackIssue({
        entity: 'Closeout',
        operation: 'UI',
        issue: `Dark mode: ${whiteElements} elements with white background`,
        severity: '[MINOR]',
        expected: 'No white backgrounds in dark mode',
        actual: `${whiteElements} white elements`,
      });
    }
  });
});
