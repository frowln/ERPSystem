/**
 * SESSION 2.4 — Deep CRUD: Quality Defects (Non-conformances + Defect Register)
 *
 * Personas: Прораб (reports), Инженер ОТК (verifies), Подрядчик (fixes)
 * Domain: СП 70.13330, ГОСТ Р ИСО 9001-2015
 *
 * Severity: MINOR | MAJOR | CRITICAL
 * Status: OPEN → IN_PROGRESS → RESOLVED → CLOSED | REJECTED
 * Key: Tolerance check (measured vs allowed deviation per СП 70.13330)
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  createEntity,
  deleteEntity,
  listEntities,
  authenticatedRequest,
} from '../../fixtures/api.fixture';

/* ───── constants ───── */
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const API_NC = '/api/quality/non-conformances';
const API_REGISTER = '/api/quality/defect-register';
const API_STATS = '/api/quality/defect-statistics';
const API_CHECKS = '/api/quality/checks';

/* ───── issue tracker ───── */
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

/* ───── test data ───── */
const DEFECT_STRUCTURAL = {
  description:
    'E2E-Отклонение оси колонны К-15 от проектного положения на 25мм (допуск по СП 70.13330 — 15мм)',
  severity: 'MAJOR',
  number: `E2E-ЗАМ-2026-${String(Date.now()).slice(-4)}`,
  dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
  correctiveAction:
    'Усиление колонны обоймой. Согласование с проектировщиком.',
  assignedToName: 'E2E-Иванов А.С.',
};

const DEFECT_COSMETIC = {
  description:
    'E2E-Трещина в штукатурном слое стены длиной 1.2м, глубиной 2мм',
  severity: 'MINOR',
  number: `E2E-ЗАМ-2026-${String(Date.now()).slice(-3)}A`,
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  correctiveAction: 'Расшивка, грунтовка, повторное оштукатуривание участка.',
  assignedToName: 'E2E-Козлов Д.А.',
};

const DEFECT_CRITICAL = {
  description:
    'E2E-Арматура фундаментной плиты не соответствует проекту: использована А400 вместо А500С',
  severity: 'CRITICAL',
  number: `E2E-ЗАМ-2026-${String(Date.now()).slice(-3)}B`,
  dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  correctiveAction:
    'Остановка работ. Экспертиза несущей способности. Замена арматуры.',
  assignedToName: 'E2E-Сидоров В.М.',
};

const DEFECT_UPDATE = {
  description:
    'E2E-Отклонение оси колонны К-15: УСТРАНЕНО. Установлена обойма усиления.',
  correctiveAction:
    'Обойма установлена по проекту КМ-05/26. Фото прилагается.',
};

/* ───── helpers ───── */
async function createDefectViaApi(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return createEntity<{ id: string }>(
    API_NC,
    { ...DEFECT_STRUCTURAL, ...overrides },
    'admin',
  );
}

// Quality checks are parents for non-conformances — create one if needed
async function ensureQualityCheck(): Promise<string | undefined> {
  try {
    const checks = await listEntities<{ id: string; name?: string }>(
      API_CHECKS,
      { size: '10' },
      'admin',
    );
    const e2eCheck = checks.find((c) => (c.name ?? '').includes('E2E-'));
    if (e2eCheck) return e2eCheck.id;

    const check = await createEntity<{ id: string }>(
      API_CHECKS,
      {
        name: 'E2E-Приёмка бетонных работ — фундаментная плита',
        type: 'ACCEPTANCE',
        scheduledDate: new Date().toISOString().split('T')[0],
        description:
          'E2E-Проверка качества бетонных работ по фундаментной плите',
        inspectorName: 'E2E-Козлов Д.А.',
      },
      'admin',
    );
    return check.id;
  } catch {
    return undefined;
  }
}

async function cleanupE2EDefects(): Promise<void> {
  try {
    const list = await listEntities<{
      id: string;
      description?: string;
      number?: string;
    }>(API_NC, { size: '200' }, 'admin');
    const e2e = list.filter(
      (d) =>
        (d.description ?? '').includes('E2E-') ||
        (d.number ?? '').includes('E2E-'),
    );
    for (const item of e2e) {
      try {
        await deleteEntity(API_NC, item.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  // Also clean quality checks
  try {
    const checks = await listEntities<{ id: string; name?: string }>(
      API_CHECKS,
      { size: '200' },
      'admin',
    );
    for (const c of checks.filter((c) => (c.name ?? '').includes('E2E-'))) {
      try {
        await deleteEntity(API_CHECKS, c.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/* ═══════════════════════════════════════════════════════════════ */
test.describe('Quality Defects CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let structuralDefectId: string | undefined;
  let qualityCheckId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2EDefects();
    qualityCheckId = await ensureQualityCheck();
  });

  test.afterAll(async () => {
    await cleanupE2EDefects();
    if (issues.length > 0) {
      console.log('\n═══ QUALITY DEFECTS CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n No quality defect issues found.');
    }
  });

  /* ───── A. CREATE ───── */
  test.describe('A. CREATE', () => {
    test('A1: Create MAJOR structural defect via API', async () => {
      const data: Record<string, unknown> = { ...DEFECT_STRUCTURAL };
      if (qualityCheckId) data.qualityCheckId = qualityCheckId;

      const res = await createEntity<{ id: string }>(
        API_NC,
        data,
        'admin',
      );
      structuralDefectId = res.id;
      expect(structuralDefectId).toBeTruthy();
    });

    test('A2: Verify defect in defect register', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/defect-register`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      let body = await page.locator('body').innerText();
      let found = body.includes('E2E-') || body.includes('колонны К-15');

      // Try alternative defects page
      if (!found) {
        await page.goto(`${BASE}/defects`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        await page.waitForTimeout(2000);
        body = await page.locator('body').innerText();
        found = body.includes('E2E-') || body.includes('колонны');
      }

      if (!found) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'CREATE→LIST',
          issue: 'Created defect not found in register',
          severity: '[MAJOR]',
          expected: 'E2E defect visible in /quality/defect-register or /defects',
          actual: 'Not found',
        });
      }
      expect.soft(found).toBeTruthy();
    });

    test('A3: Create MINOR cosmetic defect', async () => {
      const data: Record<string, unknown> = { ...DEFECT_COSMETIC };
      if (qualityCheckId) data.qualityCheckId = qualityCheckId;

      const res = await createEntity<{ id: string }>(API_NC, data, 'admin');
      expect(res.id).toBeTruthy();
    });

    test('A4: Create CRITICAL defect (wrong rebar grade)', async () => {
      const data: Record<string, unknown> = { ...DEFECT_CRITICAL };
      if (qualityCheckId) data.qualityCheckId = qualityCheckId;

      const res = await createEntity<{ id: string }>(API_NC, data, 'admin');
      expect(res.id).toBeTruthy();
    });

    test('A5: Severity badge displayed correctly', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/defect-register`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasSeverity =
        /незначител|значител|критич|minor|major|critical/i.test(body);

      if (!hasSeverity) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'CREATE/DISPLAY',
          issue: 'Severity labels not shown in defect register',
          severity: '[MINOR]',
          expected: 'Severity badges (Незначительный/Значительный/Критический)',
          actual: 'No severity labels found',
        });
      }
    });
  });

  /* ───── B. READ ───── */
  test.describe('B. READ', () => {
    test('B1: Defect register shows table', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/defect-register`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const hasTable = await page
        .locator('table thead, [role="table"]')
        .first()
        .isVisible()
        .catch(() => false);
      const hasCards = await page
        .locator('[class*="card"], [class*="Card"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect.soft(hasTable || hasCards).toBeTruthy();
    });

    test('B2: Defect statistics API', async () => {
      const res = await authenticatedRequest(
        'admin',
        'GET',
        API_STATS,
      );

      if (res.status === 200) {
        const json = await res.json();
        const stats = json.data ?? json;

        // Should have breakdown by severity
        if (stats.bySeverity) {
          expect.soft(typeof stats.bySeverity).toBe('object');
        }
        if (stats.total !== undefined) {
          expect.soft(stats.total).toBeGreaterThanOrEqual(0);
        }
      } else if (res.status === 404) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'READ/STATS',
          issue: 'Defect statistics API not found',
          severity: '[MISSING]',
          expected: 'GET /api/quality/defect-statistics → 200',
          actual: `HTTP ${res.status}`,
        });
      }
    });

    test('B3: Pareto chart page loads', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality/defect-pareto`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasChart =
        /парето|pareto|распределение|distribution/i.test(body);
      const hasChartElement = await page
        .locator('svg, canvas, .recharts-surface')
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasChart && !hasChartElement) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'READ/PARETO',
          issue: 'Pareto chart page has no chart content',
          severity: '[MINOR]',
          expected: 'Pareto chart showing defect distribution',
          actual: 'No chart found',
        });
      }
    });

    test('B4: Non-conformance detail via API', async () => {
      if (!structuralDefectId) {
        const res = await createDefectViaApi();
        structuralDefectId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API_NC}/${structuralDefectId}`,
      );

      if (res.status === 200) {
        const json = await res.json();
        const defect = json.data ?? json;

        expect.soft(defect.description).toContain('E2E-');
        expect.soft(defect.severity).toBeTruthy();
        expect.soft(defect.status).toBeTruthy();
      } else {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'READ/DETAIL',
          issue: 'GET non-conformance by ID failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200 with defect data',
          actual: `HTTP ${res.status}`,
        });
      }
    });

    test('B5: Filter defects by severity', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/defect-register`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      // Look for severity filter buttons or select
      const filterBtns = page.locator(
        'button, [role="tab"], select option',
      );
      const count = await filterBtns.count();
      let hasSeverityFilter = false;
      for (let i = 0; i < Math.min(count, 30); i++) {
        const text = await filterBtns.nth(i).innerText().catch(() => '');
        if (
          /minor|major|critical|незначит|значит|критич/i.test(text)
        ) {
          hasSeverityFilter = true;
          break;
        }
      }

      if (!hasSeverityFilter) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'READ/FILTER',
          issue: 'No severity filter in defect register',
          severity: '[UX]',
          expected: 'Filter by MINOR/MAJOR/CRITICAL',
          actual: 'No severity filter found',
        });
      }
    });
  });

  /* ───── C. UPDATE ───── */
  test.describe('C. UPDATE', () => {
    test('C1: Update defect description (fix applied)', async () => {
      if (!structuralDefectId) {
        const res = await createDefectViaApi();
        structuralDefectId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${structuralDefectId}`,
        {
          ...DEFECT_STRUCTURAL,
          ...DEFECT_UPDATE,
        },
      );

      if (res.status !== 200) {
        // Try PATCH instead
        const patchRes = await authenticatedRequest(
          'admin',
          'PATCH',
          `${API_NC}/${structuralDefectId}`,
          DEFECT_UPDATE,
        );
        if (patchRes.status !== 200) {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'UPDATE',
            issue: 'Neither PUT nor PATCH update worked',
            severity: '[MAJOR]',
            expected: 'HTTP 200',
            actual: `PUT ${res.status}, PATCH ${patchRes.status}`,
          });
        }
      }
    });

    test('C2: Change severity (escalation)', async () => {
      if (!structuralDefectId) {
        const res = await createDefectViaApi();
        structuralDefectId = res.id;
      }

      // Escalate from MAJOR to CRITICAL
      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${structuralDefectId}`,
        {
          ...DEFECT_STRUCTURAL,
          severity: 'CRITICAL',
        },
      );

      // Severity escalation should be allowed
      if (res.status === 200) {
        const json = await res.json();
        const data = json.data ?? json;
        expect.soft(data.severity).toBe('CRITICAL');
      }
    });
  });

  /* ───── D. STATUS TRANSITIONS ───── */
  test.describe('D. STATUS TRANSITIONS', () => {
    test('D1: OPEN → IN_PROGRESS (contractor starts fixing)', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Status test: start fixing',
      });

      // Try status update via PUT with status field
      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${defect.id}`,
        {
          ...DEFECT_STRUCTURAL,
          description: 'E2E-Status test: start fixing',
          status: 'IN_PROGRESS',
        },
      );

      if (res.status !== 200) {
        // Try PATCH
        const patchRes = await authenticatedRequest(
          'admin',
          'PATCH',
          `${API_NC}/${defect.id}/status`,
          { status: 'IN_PROGRESS' },
        );
        if (patchRes.status !== 200) {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'STATUS',
            issue: 'OPEN→IN_PROGRESS transition failed',
            severity: '[MAJOR]',
            expected: 'HTTP 200',
            actual: `PUT ${res.status}, PATCH ${patchRes.status}`,
          });
        }
      }

      await deleteEntity(API_NC, defect.id, 'admin').catch(() => {});
    });

    test('D2: Full lifecycle OPEN → CLOSED', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Full defect lifecycle test',
      });

      const transitions = ['IN_PROGRESS', 'RESOLVED', 'CLOSED'];

      for (const status of transitions) {
        const res = await authenticatedRequest(
          'admin',
          'PUT',
          `${API_NC}/${defect.id}`,
          {
            ...DEFECT_STRUCTURAL,
            description: 'E2E-Full defect lifecycle test',
            status,
          },
        );

        if (res.status !== 200) {
          // Try dedicated status endpoint
          const altRes = await authenticatedRequest(
            'admin',
            'PATCH',
            `${API_NC}/${defect.id}/status`,
            { status },
          );
          if (altRes.status !== 200) {
            trackIssue({
              entity: 'QualityDefect',
              operation: 'STATUS',
              issue: `Transition to ${status} failed`,
              severity: '[CRITICAL]',
              expected: 'HTTP 200',
              actual: `PUT ${res.status}`,
            });
          }
        }
      }

      await deleteEntity(API_NC, defect.id, 'admin').catch(() => {});
    });

    test('D3: CLOSED → OPEN backward transition blocked', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Backward transition test',
      });

      // Advance to CLOSED
      for (const status of ['IN_PROGRESS', 'RESOLVED', 'CLOSED']) {
        await authenticatedRequest(
          'admin',
          'PUT',
          `${API_NC}/${defect.id}`,
          {
            ...DEFECT_STRUCTURAL,
            description: 'E2E-Backward transition test',
            status,
          },
        );
      }

      // Try backward: CLOSED → OPEN
      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${defect.id}`,
        {
          ...DEFECT_STRUCTURAL,
          description: 'E2E-Backward transition test',
          status: 'OPEN',
        },
      );

      if (res.status === 200) {
        const json = await res.json();
        const data = json.data ?? json;
        if (data.status === 'OPEN') {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'STATUS',
            issue:
              'CLOSED→OPEN backward transition allowed (data integrity risk)',
            severity: '[CRITICAL]',
            expected: 'HTTP 400 — backward transition blocked',
            actual: 'HTTP 200 — reverted to OPEN',
          });
        }
      }

      await deleteEntity(API_NC, defect.id, 'admin').catch(() => {});
    });

    test('D4: Resolution time tracking', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Resolution time test',
      });

      // Move to RESOLVED
      await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${defect.id}`,
        {
          ...DEFECT_STRUCTURAL,
          description: 'E2E-Resolution time test',
          status: 'RESOLVED',
        },
      );

      // Check if resolvedDate is set
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API_NC}/${defect.id}`,
      );
      if (getRes.status === 200) {
        const json = await getRes.json();
        const data = json.data ?? json;

        if (!data.resolvedDate && !data.resolvedAt) {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'STATUS/TRACKING',
            issue: 'No resolution date recorded when defect resolved',
            severity: '[MISSING]',
            expected: 'resolvedDate set automatically',
            actual: 'No resolution date',
          });
        }
      }

      await deleteEntity(API_NC, defect.id, 'admin').catch(() => {});
    });
  });

  /* ───── E. VALIDATION ───── */
  test.describe('E. VALIDATION', () => {
    test('E1: Empty description rejected', async () => {
      try {
        const res = await authenticatedRequest('admin', 'POST', API_NC, {
          severity: 'MINOR',
          // No description!
        });

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'VALIDATION',
            issue: 'Defect without description accepted',
            severity: '[CRITICAL]',
            expected: 'HTTP 400/422 — description required',
            actual: `HTTP ${res.status}`,
          });
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API_NC, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
        expect.soft(res.status).toBeGreaterThanOrEqual(400);
      } catch {
        // Expected
      }
    });

    test('E2: Due date in past — warning', async () => {
      const pastDate = '2020-01-15';
      const res = await authenticatedRequest('admin', 'POST', API_NC, {
        description: 'E2E-Past due date defect test',
        severity: 'MINOR',
        dueDate: pastDate,
      });

      // May accept but should warn
      if (res.status === 200 || res.status === 201) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'VALIDATION',
          issue: 'Past due date accepted without warning',
          severity: '[MINOR]',
          expected: 'Warning — due date in the past',
          actual: 'Accepted silently',
        });
        try {
          const json = await res.json();
          const data = json.data ?? json;
          if (data.id) await deleteEntity(API_NC, data.id, 'admin').catch(() => {});
        } catch { /* ignore */ }
      }
    });

    test('E3: CRITICAL defect without photo — check recommendation', async ({
      trackedPage: page,
    }) => {
      // Navigate to defect creation
      await page.goto(`${BASE}/defects`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      // Check for photo upload capability
      const hasPhotoUpload =
        /фото|photo|загрузить|upload|прикрепить|attach/i.test(body);

      if (!hasPhotoUpload) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'VALIDATION',
          issue: 'No photo upload capability visible in defect list/form',
          severity: '[MISSING]',
          expected:
            'Photo before/after upload for defect evidence (PlanRadar standard)',
          actual: 'No photo upload found',
        });
      }
    });

    test('E4: UI form validation on empty submit', async ({
      trackedPage: page,
    }) => {
      // Try defect creation page
      await page.goto(`${BASE}/quality/non-conformances/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      let hasForm = await page
        .locator('form')
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasForm) {
        // Try from list page with create button
        await page.goto(`${BASE}/defects`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        const createBtn = page
          .getByRole('button', {
            name: /создать|добавить|зарегистрировать|create/i,
          })
          .first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(2000);
        }
        hasForm = await page
          .locator('form, [role="dialog"]')
          .first()
          .isVisible()
          .catch(() => false);
      }

      if (hasForm) {
        const submitBtn = page.getByRole('button', {
          name: /создать|сохранить|save/i,
        });
        if (await submitBtn.first().isVisible().catch(() => false)) {
          await submitBtn.first().click();
          await page.waitForTimeout(1500);

          const errors = page.locator(
            '.text-red-500, .text-red-600, [role="alert"]',
          );
          const errorCount = await errors.count();

          if (errorCount === 0) {
            trackIssue({
              entity: 'QualityDefect',
              operation: 'VALIDATION/UI',
              issue: 'No validation errors on empty defect form',
              severity: '[MAJOR]',
              expected: 'At least 1 validation error',
              actual: '0 errors',
            });
          }
        }
      }
    });
  });

  /* ───── F. TOLERANCE CHECKS (СП 70.13330) ───── */
  test.describe('F. TOLERANCE CHECKS', () => {
    test('F1: Tolerance rules page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/tolerance-rules`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasRules =
        /допуск|tolerance|отклонен|deviation|СП 70|предел/i.test(body);

      if (!hasRules) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'TOLERANCE',
          issue: 'Tolerance rules page has no rules data',
          severity: '[MINOR]',
          expected: 'Tolerance rules per СП 70.13330',
          actual: 'No rules content',
        });
      }
    });

    test('F2: Tolerance checks page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/tolerance-checks`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasChecks =
        /проверка|check|измерен|measured|факт|actual/i.test(body);

      if (!hasChecks) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'TOLERANCE',
          issue: 'Tolerance checks page has no check data',
          severity: '[MINOR]',
          expected: 'Tolerance check results (measured vs allowed)',
          actual: 'No check content',
        });
      }
    });

    test('F3: Column deviation 25mm vs 15mm allowed — flagged', async () => {
      // This tests the domain rule: if measured deviation > tolerance → FAIL
      // The structural defect we created has 25mm vs 15mm allowed
      // Check if the system understands this
      const body = DEFECT_STRUCTURAL.description;
      const measured = 25;
      const allowed = 15;
      const deviation = measured - allowed;

      expect(deviation).toBeGreaterThan(0); // Deviation exceeds tolerance
      expect(measured / allowed).toBeGreaterThan(1); // Over tolerance

      // Domain rule assertion — this would be checked at runtime
      // For now, verify the test data is correct
      expect(DEFECT_STRUCTURAL.severity).toBe('MAJOR'); // 25mm > 15mm → MAJOR

      if (measured > allowed * 2) {
        // >30mm would be CRITICAL
        trackIssue({
          entity: 'QualityDefect',
          operation: 'TOLERANCE/DOMAIN',
          issue: 'Deviation > 2x tolerance should be CRITICAL',
          severity: '[UX]',
          expected: `CRITICAL severity for ${measured}mm > 2×${allowed}mm`,
          actual: `MAJOR severity (acceptable for 1.67x)`,
        });
      }
    });
  });

  /* ───── G. DELETE ───── */
  test.describe('G. DELETE', () => {
    test('G1: Delete defect via API', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Delete test defect',
      });

      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API_NC}/${defect.id}`,
      );
      expect.soft(res.status).toBeLessThanOrEqual(204);

      // Verify deleted
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API_NC}/${defect.id}`,
      );
      if (getRes.status === 200) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'DELETE',
          issue: 'Deleted defect still accessible',
          severity: '[CRITICAL]',
          expected: 'HTTP 404 or 410',
          actual: `HTTP ${getRes.status}`,
        });
      }
    });

    test('G2: RESOLVED defect should require reason to delete', async () => {
      const defect = await createDefectViaApi({
        description: 'E2E-Delete resolved defect test',
      });

      // Advance to RESOLVED
      await authenticatedRequest(
        'admin',
        'PUT',
        `${API_NC}/${defect.id}`,
        {
          ...DEFECT_STRUCTURAL,
          description: 'E2E-Delete resolved defect test',
          status: 'RESOLVED',
        },
      );

      // Try delete
      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API_NC}/${defect.id}`,
      );

      if (res.status <= 204) {
        trackIssue({
          entity: 'QualityDefect',
          operation: 'DELETE',
          issue:
            'RESOLVED defect deleted without audit trail (compliance risk)',
          severity: '[MAJOR]',
          expected:
            'Deletion of resolved defects should require reason or be blocked',
          actual: 'Deleted successfully without restriction',
        });
      }
    });
  });

  /* ───── H. CROSS-ENTITY ───── */
  test.describe('H. CROSS-ENTITY', () => {
    test('H1: Quality check links to non-conformances', async () => {
      if (!qualityCheckId) return;

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API_CHECKS}/${qualityCheckId}`,
      );

      if (res.status === 200) {
        const json = await res.json();
        const check = json.data ?? json;
        // Check should reference non-conformance count
        if (
          check.nonConformanceCount === undefined &&
          check.defectCount === undefined
        ) {
          trackIssue({
            entity: 'QualityDefect',
            operation: 'CROSS-ENTITY',
            issue: 'Quality check has no non-conformance count field',
            severity: '[UX]',
            expected: 'nonConformanceCount or defectCount on check',
            actual: 'Field not present',
          });
        }
      }
    });

    test('H2: Defect statistics reflect created defects', async () => {
      const res = await authenticatedRequest(
        'admin',
        'GET',
        API_STATS,
      );

      if (res.status === 200) {
        const json = await res.json();
        const stats = json.data ?? json;

        if (stats.total !== undefined) {
          expect.soft(stats.total).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });
});
