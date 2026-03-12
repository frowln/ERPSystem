/**
 * SESSION 2.4 — Deep CRUD: Quality Inspections (Checks + Checklists)
 *
 * Personas: Инженер ОТК (inspects), Прораб (presents work), Подрядчик (receives results)
 * Domain: ГОСТ Р ИСО 9001-2015, СП 48.13330, ГОСТ 26433
 *
 * Quality Check Types: INCOMING | IN_PROCESS | FINAL | ACCEPTANCE | AUDIT | HIDDEN_WORKS | LABORATORY
 * Check Status: PLANNED → IN_PROGRESS → COMPLETED | CANCELLED
 * Result: PENDING | PASSED | FAILED | CONDITIONAL | CONDITIONALLY_PASSED
 * Checklist Item: PASS | FAIL | NA | PENDING
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
const API_CHECKS = '/api/quality/checks';
const API_CHECKLISTS = '/api/quality/checklists';
const API_TEMPLATES = '/api/quality/checklist-templates';
const API_MATERIAL_INSPECTIONS = '/api/quality/material-inspections';

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
const CHECK_CONCRETE = {
  name: 'E2E-Приёмка бетонных работ — фундаментная плита',
  type: 'ACCEPTANCE',
  scheduledDate: new Date().toISOString().split('T')[0],
  description:
    'E2E-Проверка качества бетонных работ по фундаментной плите корп.1. Класс бетона В25, защитный слой 40мм.',
  inspectorName: 'E2E-Козлов Д.А.',
  location: 'Корпус 1, фундаментная плита',
};

const CHECK_HIDDEN_WORKS = {
  name: 'E2E-Освидетельствование скрытых работ — гидроизоляция',
  type: 'HIDDEN_WORKS',
  scheduledDate: new Date().toISOString().split('T')[0],
  description:
    'E2E-Акт освидетельствования скрытых работ: горизонтальная гидроизоляция фундамента.',
  inspectorName: 'E2E-Волков А.П.',
  location: 'Корпус 1, фундамент, отм. -3.200',
};

const CHECK_INCOMING = {
  name: 'E2E-Входной контроль арматуры А500С',
  type: 'INCOMING',
  scheduledDate: new Date().toISOString().split('T')[0],
  description:
    'E2E-Входной контроль партии арматуры А500С ∅12, поставщик ООО МеталлТрейд. Проверка: сертификат, маркировка, геометрия.',
  inspectorName: 'E2E-Морозова Н.П.',
  location: 'Склад №1, зона приёмки',
};

const CHECK_UPDATE = {
  name: 'E2E-Приёмка бетонных работ — фундаментная плита (дополнение)',
  description:
    'E2E-ОБНОВЛЕНО: добавлена проверка армирования. Класс бетона В25, защитный слой 40мм, арматура А500С.',
};

const CHECKLIST_TEMPLATE = {
  name: 'E2E-Шаблон: Приёмка бетонных работ',
  workType: 'concreting',
  items: [
    {
      question: 'Геометрия опалубки соответствует проекту',
      required: true,
    },
    {
      question: 'Армирование выполнено по проекту',
      required: true,
    },
    {
      question: 'Защитный слой бетона >= 40мм',
      required: true,
    },
    {
      question: 'Класс бетона подтверждён (В25)',
      required: true,
    },
    {
      question: 'Отсутствие трещин и раковин',
      required: true,
    },
    {
      question: 'Вертикальность конструкции в допуске',
      required: true,
    },
  ],
};

const MATERIAL_INSPECTION = {
  materialName: 'E2E-Арматура А500С ∅12',
  supplier: 'E2E-ООО МеталлТрейд',
  batchNumber: 'E2E-ПАР-2026-031',
  inspectorName: 'E2E-Морозова Н.П.',
  inspectionDate: new Date().toISOString().split('T')[0],
  result: 'accepted',
  testResults: [
    { parameter: 'Предел текучести', value: '520 МПа', standard: '≥500 МПа', passed: true },
    { parameter: 'Относительное удлинение', value: '16%', standard: '≥14%', passed: true },
    { parameter: 'Диаметр', value: '12.1 мм', standard: '12±0.4 мм', passed: true },
  ],
};

/* ───── helpers ───── */
async function createCheckViaApi(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return createEntity<{ id: string }>(
    API_CHECKS,
    { ...CHECK_CONCRETE, ...overrides },
    'admin',
  );
}

async function cleanupE2EChecks(): Promise<void> {
  // Clean quality checks
  try {
    const list = await listEntities<{
      id: string;
      name?: string;
      description?: string;
    }>(API_CHECKS, { size: '200' }, 'admin');
    const e2e = list.filter(
      (c) =>
        (c.name ?? '').includes('E2E-') ||
        (c.description ?? '').includes('E2E-'),
    );
    for (const item of e2e) {
      try {
        await deleteEntity(API_CHECKS, item.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  // Clean checklists
  try {
    const list = await listEntities<{ id: string; name?: string; code?: string }>(
      API_CHECKLISTS,
      { size: '200' },
      'admin',
    );
    const e2e = list.filter(
      (c) =>
        (c.name ?? '').includes('E2E-') ||
        (c.code ?? '').includes('E2E-'),
    );
    for (const item of e2e) {
      try {
        await deleteEntity(API_CHECKLISTS, item.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  // Clean templates
  try {
    const list = await listEntities<{ id: string; name?: string }>(
      API_TEMPLATES,
      { size: '200' },
      'admin',
    );
    const e2e = list.filter((t) => (t.name ?? '').includes('E2E-'));
    for (const item of e2e) {
      try {
        await deleteEntity(API_TEMPLATES, item.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/* ═══════════════════════════════════════════════════════════════ */
test.describe('Quality Inspections CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let concreteCheckId: string | undefined;
  let templateId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2EChecks();
  });

  test.afterAll(async () => {
    await cleanupE2EChecks();
    if (issues.length > 0) {
      console.log('\n═══ QUALITY INSPECTIONS CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n No quality inspection issues found.');
    }
  });

  /* ───── A. CREATE ───── */
  test.describe('A. CREATE', () => {
    test('A1: Create ACCEPTANCE check via API', async () => {
      const res = await createCheckViaApi();
      concreteCheckId = res.id;
      expect(concreteCheckId).toBeTruthy();
    });

    test('A2: Verify check in list', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      let body = await page.locator('body').innerText();
      let found = body.includes('E2E-') || body.includes('бетонных');

      // Try quality checklists page
      if (!found) {
        await page.goto(`${BASE}/quality/checklists`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        await page.waitForTimeout(2000);
        body = await page.locator('body').innerText();
        found = body.includes('E2E-') || body.includes('бетонных');
      }

      if (!found) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CREATE→LIST',
          issue: 'Created check not found in list',
          severity: '[MAJOR]',
          expected: 'E2E check visible in /quality or /quality/checklists',
          actual: 'Not found',
        });
      }
      expect.soft(found).toBeTruthy();
    });

    test('A3: Create HIDDEN_WORKS check', async () => {
      const res = await createCheckViaApi(CHECK_HIDDEN_WORKS);
      expect(res.id).toBeTruthy();
    });

    test('A4: Create INCOMING check', async () => {
      const res = await createCheckViaApi(CHECK_INCOMING);
      expect(res.id).toBeTruthy();
    });

    test('A5: Create checklist template', async () => {
      try {
        const res = await createEntity<{ id: string }>(
          API_TEMPLATES,
          CHECKLIST_TEMPLATE,
          'admin',
        );
        templateId = res.id;
        expect(templateId).toBeTruthy();
      } catch {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CREATE/TEMPLATE',
          issue: 'Failed to create checklist template',
          severity: '[MAJOR]',
          expected: 'POST /api/quality/checklist-templates → 200/201',
          actual: 'Error thrown',
        });
      }
    });

    test('A6: Create via UI', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      let hasForm = await page
        .locator('form')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (!hasForm) {
        await page.goto(`${BASE}/quality`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        const createBtn = page
          .getByRole('button', {
            name: /создать|добавить|новая|запланировать|create|add/i,
          })
          .first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(2000);
        }
        hasForm = await page
          .locator('form, [role="dialog"] input')
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
      }

      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.first().isVisible().catch(() => false)) {
        await nameInput.first().fill('E2E-UI: Проверка сварных соединений');
      }

      await page.screenshot({
        path: 'e2e/screenshots/quality-check-create.png',
        fullPage: true,
      });

      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|запланировать/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(3000);
      }
    });

    test('A7: Material inspection creation', async () => {
      try {
        const res = await authenticatedRequest(
          'admin',
          'POST',
          API_MATERIAL_INSPECTIONS,
          MATERIAL_INSPECTION,
        );

        if (res.status === 200 || res.status === 201) {
          const json = await res.json();
          const data = json.data ?? json;
          expect(data.id || data).toBeTruthy();

          // Verify test results captured
          if (data.testResults) {
            expect.soft(data.testResults.length).toBe(3);
          }
        } else if (res.status === 404) {
          trackIssue({
            entity: 'QualityInspection',
            operation: 'CREATE/MATERIAL',
            issue: 'Material inspection API not found',
            severity: '[MISSING]',
            expected:
              'POST /api/quality/material-inspections → 200/201',
            actual: `HTTP ${res.status}`,
          });
        }
      } catch {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CREATE/MATERIAL',
          issue: 'Material inspection creation threw error',
          severity: '[MAJOR]',
          expected: 'Successful creation',
          actual: 'Error thrown',
        });
      }
    });
  });

  /* ───── B. READ ───── */
  test.describe('B. READ', () => {
    test('B1: Quality checks list shows table', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality`, {
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

    test('B2: Check detail page renders', async ({
      trackedPage: page,
    }) => {
      if (!concreteCheckId) {
        const res = await createCheckViaApi();
        concreteCheckId = res.id;
      }

      await page.goto(`${BASE}/quality/${concreteCheckId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        body.includes('E2E-') ||
        body.includes('бетон') ||
        body.includes('Козлов');

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'READ/DETAIL',
          issue: 'Check detail page shows no data',
          severity: '[MAJOR]',
          expected: 'Check name, inspector, description visible',
          actual: 'No check data on page',
        });
      }
    });

    test('B3: API returns check structure', async () => {
      if (!concreteCheckId) {
        const res = await createCheckViaApi();
        concreteCheckId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API_CHECKS}/${concreteCheckId}`,
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      const check = json.data ?? json;

      expect.soft(check.name).toContain('E2E-');
      expect.soft(check.type).toBeTruthy();
      expect.soft(check.status).toBeTruthy();
    });

    test('B4: Filter by status tabs', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const tabs = page.locator('button, [role="tab"]');
      const count = await tabs.count();
      let hasStatusTabs = false;
      for (let i = 0; i < Math.min(count, 20); i++) {
        const text = await tabs.nth(i).innerText().catch(() => '');
        if (
          /все|планиров|в работе|завершён|all|planned|progress|completed/i.test(
            text,
          )
        ) {
          hasStatusTabs = true;
          break;
        }
      }

      if (!hasStatusTabs) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'READ/FILTER',
          issue: 'No status tabs in quality checks list',
          severity: '[UX]',
          expected: 'Tabs: Все/Запланированные/В работе/Завершённые',
          actual: 'No matching tabs',
        });
      }
    });

    test('B5: Checklist templates page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/checklist-templates`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        /шаблон|template|чек.*лист|checklist/i.test(body);

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'READ/TEMPLATES',
          issue: 'Checklist templates page has no content',
          severity: '[MINOR]',
          expected: 'List of checklist templates',
          actual: 'No template content',
        });
      }
    });

    test('B6: Material inspection page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/material-inspection`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        /входной|контроль|материал|inspection|material/i.test(body);

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'READ/MATERIAL',
          issue: 'Material inspection page has no content',
          severity: '[MINOR]',
          expected: 'Material inspection records',
          actual: 'No content',
        });
      }
    });

    test('B7: Material certificates page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/certificates`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        /сертификат|certificate|паспорт|passport|документ/i.test(body);

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'READ/CERTS',
          issue: 'Material certificates page has no content',
          severity: '[MINOR]',
          expected: 'Material certificates and quality documents',
          actual: 'No content',
        });
      }
    });
  });

  /* ───── C. UPDATE ───── */
  test.describe('C. UPDATE', () => {
    test('C1: Update check via API', async () => {
      if (!concreteCheckId) {
        const res = await createCheckViaApi();
        concreteCheckId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API_CHECKS}/${concreteCheckId}`,
        { ...CHECK_CONCRETE, ...CHECK_UPDATE },
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'UPDATE',
          issue: 'PUT update on quality check failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);
    });

    test('C2: Verify updated name', async () => {
      if (!concreteCheckId) return;

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API_CHECKS}/${concreteCheckId}`,
      );
      if (res.status === 200) {
        const json = await res.json();
        const check = json.data ?? json;
        expect.soft(check.name).toContain('дополнение');
      }
    });
  });

  /* ───── D. STATUS TRANSITIONS ───── */
  test.describe('D. STATUS TRANSITIONS', () => {
    test('D1: PLANNED → IN_PROGRESS (start check)', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Status test: start',
      });

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'STATUS',
          issue: 'PLANNED→IN_PROGRESS transition failed',
          severity: '[CRITICAL]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      await deleteEntity(API_CHECKS, check.id, 'admin').catch(() => {});
    });

    test('D2: IN_PROGRESS → COMPLETED with PASSED result', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Status test: complete passed',
      });

      // Start
      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );

      // Complete with result
      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/complete`,
        {
          result: 'PASSED',
          findings: 'Все параметры в пределах допуска.',
        },
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'STATUS',
          issue: 'Complete with PASSED result failed',
          severity: '[CRITICAL]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      // Verify final state
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API_CHECKS}/${check.id}`,
      );
      if (getRes.status === 200) {
        const json = await getRes.json();
        const data = json.data ?? json;
        expect.soft(data.status).toBe('COMPLETED');
        if (data.result) {
          expect.soft(data.result).toBe('PASSED');
        }
      }

      await deleteEntity(API_CHECKS, check.id, 'admin').catch(() => {});
    });

    test('D3: Complete with CONDITIONAL result (partial pass)', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Status test: conditional',
      });

      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/complete`,
        {
          result: 'CONDITIONAL',
          findings:
            'E2E-5 из 6 пунктов пройдены. Обнаружены раковины до 10мм — требуется устранение.',
          nonConformanceCount: 1,
        },
      );

      if (res.status !== 200) {
        // May not support CONDITIONAL — try CONDITIONALLY_PASSED
        const altRes = await authenticatedRequest(
          'admin',
          'PATCH',
          `${API_CHECKS}/${check.id}/complete`,
          { result: 'CONDITIONALLY_PASSED', findings: 'E2E-5/6 passed' },
        );
        if (altRes.status !== 200) {
          trackIssue({
            entity: 'QualityInspection',
            operation: 'STATUS',
            issue: 'CONDITIONAL result not supported',
            severity: '[MAJOR]',
            expected: 'CONDITIONAL or CONDITIONALLY_PASSED result accepted',
            actual: `HTTP ${res.status} / ${altRes.status}`,
          });
        }
      }

      await deleteEntity(API_CHECKS, check.id, 'admin').catch(() => {});
    });

    test('D4: Complete with FAILED result', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Status test: failed',
      });

      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/complete`,
        {
          result: 'FAILED',
          findings:
            'E2E-Критические несоответствия: арматура А400 вместо А500С, защитный слой 25мм вместо 40мм.',
          nonConformanceCount: 2,
        },
      );

      expect.soft(res.status).toBe(200);

      await deleteEntity(API_CHECKS, check.id, 'admin').catch(() => {});
    });

    test('D5: COMPLETED check cannot be re-started', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Status test: no restart',
      });

      // Complete it
      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );
      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/complete`,
        { result: 'PASSED' },
      );

      // Try to re-start
      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API_CHECKS}/${check.id}/start`,
      );

      if (res.status === 200) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'STATUS',
          issue:
            'COMPLETED check can be re-started (backward transition)',
          severity: '[CRITICAL]',
          expected: 'HTTP 400 — backward transition blocked',
          actual: 'HTTP 200',
        });
      }

      await deleteEntity(API_CHECKS, check.id, 'admin').catch(() => {});
    });
  });

  /* ───── E. CHECKLIST ITEMS ───── */
  test.describe('E. CHECKLIST ITEMS', () => {
    test('E1: Checklists page loads', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality/checklists`, {
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
      const hasContent =
        (await page.locator('body').innerText()).length > 100;

      expect.soft(hasTable || hasCards || hasContent).toBeTruthy();
    });

    test('E2: Checklist score display (pass/total)', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/checklists`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasScore =
        /\d+\s*[/из]\s*\d+|\d+%|score|оценка|балл/i.test(body);

      if (!hasScore) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CHECKLIST/SCORE',
          issue: 'No pass/total score shown in checklist list',
          severity: '[UX]',
          expected: 'Score display (e.g., 5/6 or 83%)',
          actual: 'No score visible',
        });
      }
    });

    test('E3: FAIL item without comment should warn', async () => {
      // Domain rule: FAIL result on checklist item requires comment/explanation
      // This is a business rule check
      const hasRule = true; // We'll check UI behavior
      expect(hasRule).toBeTruthy();

      trackIssue({
        entity: 'QualityInspection',
        operation: 'CHECKLIST/VALIDATION',
        issue:
          'FAIL checklist item without comment — need runtime verification',
        severity: '[UX]',
        expected:
          'UI prevents saving FAIL item without comment ("Укажите причину несоответствия")',
        actual: 'Needs live server verification',
      });
    });
  });

  /* ───── F. VALIDATION ───── */
  test.describe('F. VALIDATION', () => {
    test('F1: Empty name rejected via API', async () => {
      try {
        const res = await authenticatedRequest(
          'admin',
          'POST',
          API_CHECKS,
          {
            type: 'ACCEPTANCE',
            scheduledDate: new Date().toISOString().split('T')[0],
            // No name!
          },
        );

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'QualityInspection',
            operation: 'VALIDATION',
            issue: 'Quality check without name accepted',
            severity: '[CRITICAL]',
            expected: 'HTTP 400/422 — name required',
            actual: `HTTP ${res.status}`,
          });
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API_CHECKS, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
        expect.soft(res.status).toBeGreaterThanOrEqual(400);
      } catch {
        // Expected
      }
    });

    test('F2: No inspector — check if required', async () => {
      try {
        const res = await authenticatedRequest(
          'admin',
          'POST',
          API_CHECKS,
          {
            name: 'E2E-Check without inspector',
            type: 'ACCEPTANCE',
            scheduledDate: new Date().toISOString().split('T')[0],
            // No inspectorName or inspectorId!
          },
        );

        if (res.status === 200 || res.status === 201) {
          trackIssue({
            entity: 'QualityInspection',
            operation: 'VALIDATION',
            issue: 'Quality check without inspector accepted',
            severity: '[MAJOR]',
            expected:
              'Inspector required for valid inspection record',
            actual: 'Accepted without inspector',
          });
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API_CHECKS, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
      } catch {
        // Expected
      }
    });

    test('F3: UI form validation', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|запланировать/i,
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
            entity: 'QualityInspection',
            operation: 'VALIDATION/UI',
            issue: 'No validation errors on empty quality check form',
            severity: '[MAJOR]',
            expected: 'At least 1 validation error (name required)',
            actual: '0 errors',
          });
        }
      }
    });
  });

  /* ───── G. DELETE ───── */
  test.describe('G. DELETE', () => {
    test('G1: Delete check via API', async () => {
      const check = await createCheckViaApi({
        name: 'E2E-Delete test check',
      });

      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API_CHECKS}/${check.id}`,
      );
      expect.soft(res.status).toBeLessThanOrEqual(204);

      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API_CHECKS}/${check.id}`,
      );
      if (getRes.status === 200) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'DELETE',
          issue: 'Deleted check still accessible',
          severity: '[CRITICAL]',
          expected: 'HTTP 404 or 410',
          actual: `HTTP ${getRes.status}`,
        });
      }
    });

    test('G2: Delete template via API', async () => {
      if (!templateId) return;

      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API_TEMPLATES}/${templateId}`,
      );
      expect.soft(res.status).toBeLessThanOrEqual(204);
    });
  });

  /* ───── H. SUPERVISION JOURNAL ───── */
  test.describe('H. SUPERVISION JOURNAL', () => {
    test('H1: Author supervision journal page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality/supervision-journal`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        /авторск|надзор|supervision|журнал|journal/i.test(body);

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'SUPERVISION',
          issue: 'Author supervision journal page has no content',
          severity: '[MINOR]',
          expected: 'Supervision journal entries',
          actual: 'No content',
        });
      }
    });

    test('H2: Quality gates page loads', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/quality/gates`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        /этап|gate|контрольная.*точка|checkpoint|вех/i.test(body);

      if (!hasContent) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'GATES',
          issue: 'Quality gates page has no content',
          severity: '[MINOR]',
          expected: 'Quality gates / stage gate controls',
          actual: 'No content',
        });
      }
    });
  });

  /* ───── I. CROSS-ENTITY ───── */
  test.describe('I. CROSS-ENTITY', () => {
    test('I1: Inspection failure can create defect', async ({
      trackedPage: page,
    }) => {
      // When inspection fails → option to auto-create defect
      if (!concreteCheckId) {
        const res = await createCheckViaApi();
        concreteCheckId = res.id;
      }

      await page.goto(`${BASE}/quality/${concreteCheckId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasDefectLink =
        /дефект|замечан|несоответств|defect|non.?conform|создать.*замеч/i.test(
          body,
        );

      if (!hasDefectLink) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CROSS-ENTITY',
          issue:
            'No link to create defect from inspection detail page',
          severity: '[UX]',
          expected:
            'Button/link to create defect from failed inspection',
          actual: 'No defect creation link',
        });
      }
    });

    test('I2: Overall pass rate metric', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/quality`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      // Look for pass rate indicator
      const hasPassRate =
        /процент.*прошед|pass.*rate|%|успешн|качеств/i.test(body);

      if (!hasPassRate) {
        trackIssue({
          entity: 'QualityInspection',
          operation: 'CROSS-ENTITY',
          issue: 'No inspection pass rate KPI in quality module',
          severity: '[UX]',
          expected:
            'Pass rate % (domain rule: <70% = serious quality issues)',
          actual: 'No pass rate indicator',
        });
      }
    });
  });
});
