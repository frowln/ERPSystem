/**
 * SESSION 2.4 — Deep CRUD: Safety Trainings (Briefings)
 *
 * Personas: Инженер ОТ (creates/manages), Прораб (attends), Кадровик (tracks certs)
 * Domain: ТК РФ ст.212, 225; ГОСТ 12.0.004-2015 (порядок обучения)
 *
 * Types: INITIAL | PRIMARY | PERIODIC | UNSCHEDULED | SPECIAL
 * Status: PLANNED → IN_PROGRESS → COMPLETED | CANCELLED
 * Key: Periodic training every 6 months. Unsigned participants = compliance gap.
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
const API = '/api/safety/trainings';

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
const TRAINING_INITIAL = {
  title: 'E2E-Вводный инструктаж по ОТ при работе на высоте',
  trainingType: 'INITIAL',
  date: new Date().toISOString().split('T')[0],
  instructorName: 'E2E-Морозова Е.В.',
  participants: 'E2E-Козлов Д.А., E2E-Иванов А.С., E2E-Петров И.В.',
  topics: 'Общие требования ОТ, Работа на высоте, СИЗ, Первая помощь',
  duration: 120,
  notes: 'E2E-Вводный инструктаж для новых сотрудников бригады',
};

const TRAINING_PERIODIC = {
  title: 'E2E-Повторный инструктаж по электробезопасности',
  trainingType: 'PERIODIC',
  date: new Date().toISOString().split('T')[0],
  instructorName: 'E2E-Волков А.П.',
  participants: 'E2E-Козлов Д.А., E2E-Иванов А.С.',
  topics: 'Электробезопасность, группа допуска, порядок работ на ЭУ',
  duration: 90,
  notes: 'E2E-Повторный инструктаж (каждые 6 месяцев по ГОСТ 12.0.004)',
};

const TRAINING_UNSCHEDULED = {
  title: 'E2E-Внеплановый инструктаж после инцидента',
  trainingType: 'UNSCHEDULED',
  date: new Date().toISOString().split('T')[0],
  instructorName: 'E2E-Морозова Е.В.',
  participants: 'E2E-вся бригада монтажников (8 чел.)',
  topics:
    'Анализ инцидента с падением опалубки, усиление мер безопасности',
  duration: 60,
  notes:
    'E2E-Проведён в связи с инцидентом от 10.03.2026. Обязателен для всех.',
};

const TRAINING_UPDATE = {
  title: 'E2E-Вводный инструктаж по ОТ при работе на высоте (дополнен)',
  duration: 150,
  notes: 'E2E-Обновлено: добавлена тема по применению страховочных систем',
};

/* ───── helpers ───── */
async function createTrainingViaApi(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return createEntity<{ id: string }>(
    API,
    { ...TRAINING_INITIAL, ...overrides },
    'admin',
  );
}

async function cleanupE2ETrainings(): Promise<void> {
  try {
    const list = await listEntities<{
      id: string;
      title?: string;
      notes?: string;
    }>(API, { size: '200' }, 'admin');
    const e2e = list.filter(
      (t) =>
        (t.title ?? '').includes('E2E-') ||
        (t.notes ?? '').includes('E2E-'),
    );
    for (const item of e2e) {
      try {
        await deleteEntity(API, item.id, 'admin');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/* ═══════════════════════════════════════════════════════════════ */
test.describe('Safety Trainings CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let initialTrainingId: string | undefined;
  let periodicTrainingId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2ETrainings();
  });

  test.afterAll(async () => {
    await cleanupE2ETrainings();
    if (issues.length > 0) {
      console.log('\n═══ SAFETY TRAININGS CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n No safety training issues found.');
    }
  });

  /* ───── A. CREATE ───── */
  test.describe('A. CREATE', () => {
    test('A1: Create INITIAL training via API', async () => {
      const res = await createTrainingViaApi();
      initialTrainingId = res.id;
      expect(initialTrainingId).toBeTruthy();
    });

    test('A2: Verify training in list', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/briefings`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      let body = await page.locator('body').innerText();
      let found = body.includes('E2E-') || body.includes('Вводный');

      // Try alternative URL
      if (!found) {
        await page.goto(`${BASE}/safety/training-journal`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        await page.waitForTimeout(2000);
        body = await page.locator('body').innerText();
        found = body.includes('E2E-') || body.includes('Вводный');
      }

      if (!found) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'CREATE→LIST',
          issue: 'Created training not found in list',
          severity: '[MAJOR]',
          expected: 'E2E training visible in briefings page',
          actual: 'Not found',
        });
      }
      expect.soft(found).toBeTruthy();
    });

    test('A3: Create PERIODIC training', async () => {
      const res = await createTrainingViaApi(TRAINING_PERIODIC);
      periodicTrainingId = res.id;
      expect(periodicTrainingId).toBeTruthy();
    });

    test('A4: Create UNSCHEDULED training (after incident)', async () => {
      const res = await createTrainingViaApi(TRAINING_UNSCHEDULED);
      expect(res.id).toBeTruthy();
      await deleteEntity(API, res.id, 'admin').catch(() => {});
    });

    test('A5: Create training via UI', async ({ trackedPage: page }) => {
      // Try form page
      await page.goto(`${BASE}/safety/briefings/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      let hasForm = await page
        .locator('form')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (!hasForm) {
        // Try from list page
        await page.goto(`${BASE}/safety/briefings`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        const createBtn = page
          .getByRole('button', {
            name: /создать|добавить|новый|провести|create|add/i,
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

      // Fill if form is visible
      const titleInput = page.locator(
        'input[name="title"], input[name="name"]',
      );
      if (await titleInput.first().isVisible().catch(() => false)) {
        await titleInput
          .first()
          .fill('E2E-UI: Целевой инструктаж на сварочные работы');
      }

      const instructorInput = page.locator(
        'input[name="instructorName"], input[name="instructor"]',
      );
      if (await instructorInput.first().isVisible().catch(() => false)) {
        await instructorInput.first().fill('E2E-Морозова Е.В.');
      }

      await page.screenshot({
        path: 'e2e/screenshots/training-create-form.png',
        fullPage: true,
      });

      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|провести/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(3000);
      }
    });
  });

  /* ───── B. READ ───── */
  test.describe('B. READ', () => {
    test('B1: Training list shows table', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/briefings`, {
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

    test('B2: Training detail page', async ({ trackedPage: page }) => {
      if (!initialTrainingId) {
        const res = await createTrainingViaApi();
        initialTrainingId = res.id;
      }

      // Try direct detail URL
      await page.goto(
        `${BASE}/safety/briefings/${initialTrainingId}`,
        { waitUntil: 'domcontentloaded', timeout: 60_000 },
      );
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent =
        body.includes('E2E-') ||
        body.includes('Вводный') ||
        body.includes('Морозова');

      if (!hasContent) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'READ/DETAIL',
          issue: 'Training detail page shows no data',
          severity: '[MAJOR]',
          expected: 'Training title, instructor, participants visible',
          actual: 'No training data on page',
        });
      }
    });

    test('B3: Training type filter', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/briefings`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasTypeLabels =
        /вводный|первичный|повторный|внеплановый|целевой|initial|primary|periodic/i.test(
          body,
        );

      if (!hasTypeLabels) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'READ/FILTER',
          issue: 'Training type labels not visible in list',
          severity: '[MINOR]',
          expected: 'Type badges (Вводный/Повторный/etc)',
          actual: 'No type labels found',
        });
      }
    });

    test('B4: API returns training structure', async () => {
      if (!initialTrainingId) {
        const res = await createTrainingViaApi();
        initialTrainingId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${initialTrainingId}`,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      const training = json.data ?? json;

      expect.soft(training.title).toContain('E2E-');
      expect.soft(training.trainingType || training.type).toBeTruthy();
      expect.soft(training.instructorName || training.instructor).toBeTruthy();
    });

    test('B5: Participant tracking — signed vs unsigned', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/briefings`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      // Look for participant count or signature indicators
      const hasParticipantInfo =
        /участник|participant|подпис|signed|чел\.|человек/i.test(body);

      if (!hasParticipantInfo) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'READ/PARTICIPANTS',
          issue: 'No participant count or signature status in list',
          severity: '[UX]',
          expected:
            'Participant count with signed/unsigned breakdown',
          actual: 'No participant information visible',
        });
      }
    });
  });

  /* ───── C. UPDATE ───── */
  test.describe('C. UPDATE', () => {
    test('C1: Update training via API', async () => {
      if (!initialTrainingId) {
        const res = await createTrainingViaApi();
        initialTrainingId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API}/${initialTrainingId}`,
        {
          ...TRAINING_INITIAL,
          ...TRAINING_UPDATE,
        },
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'UPDATE',
          issue: 'PUT update failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);
    });

    test('C2: Verify updated title', async () => {
      if (!initialTrainingId) return;

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${initialTrainingId}`,
      );

      if (res.status === 200) {
        const json = await res.json();
        const training = json.data ?? json;
        expect.soft(training.title).toContain('дополнен');
      }
    });
  });

  /* ───── D. STATUS TRANSITIONS ───── */
  test.describe('D. STATUS TRANSITIONS', () => {
    test('D1: Complete training via API', async () => {
      const training = await createTrainingViaApi({
        title: 'E2E-Status test: complete',
        status: 'PLANNED',
      });

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${training.id}/complete`,
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'STATUS',
          issue: 'Complete training failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      // Verify status
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${training.id}`,
      );
      if (getRes.status === 200) {
        const json = await getRes.json();
        const data = json.data ?? json;
        expect.soft(data.status).toBe('COMPLETED');
      }

      await deleteEntity(API, training.id, 'admin').catch(() => {});
    });

    test('D2: Cancel training via API', async () => {
      const training = await createTrainingViaApi({
        title: 'E2E-Status test: cancel',
        status: 'PLANNED',
      });

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${training.id}/cancel`,
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'STATUS',
          issue: 'Cancel training failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      await deleteEntity(API, training.id, 'admin').catch(() => {});
    });

    test('D3: Completed training cannot be cancelled', async () => {
      const training = await createTrainingViaApi({
        title: 'E2E-Status test: completed→cancel',
      });

      // Complete first
      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${training.id}/complete`,
      );

      // Try cancel
      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${training.id}/cancel`,
      );

      if (res.status === 200) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'STATUS',
          issue: 'COMPLETED→CANCELLED allowed (should be blocked)',
          severity: '[CRITICAL]',
          expected: 'HTTP 400/422 — backward transition blocked',
          actual: `HTTP 200 — succeeded`,
        });
      }

      await deleteEntity(API, training.id, 'admin').catch(() => {});
    });
  });

  /* ───── E. VALIDATION ───── */
  test.describe('E. VALIDATION', () => {
    test('E1: No title rejected', async () => {
      try {
        const res = await authenticatedRequest('admin', 'POST', API, {
          trainingType: 'INITIAL',
          date: new Date().toISOString().split('T')[0],
          // No title!
        });

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'SafetyTraining',
            operation: 'VALIDATION',
            issue: 'Training without title accepted',
            severity: '[CRITICAL]',
            expected: 'HTTP 400/422 — title required',
            actual: `HTTP ${res.status}`,
          });
          // Clean up
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
        expect.soft(res.status).toBeGreaterThanOrEqual(400);
      } catch {
        // Expected
      }
    });

    test('E2: No instructor — check if required', async () => {
      try {
        const res = await authenticatedRequest('admin', 'POST', API, {
          title: 'E2E-Training without instructor',
          trainingType: 'INITIAL',
          date: new Date().toISOString().split('T')[0],
          // No instructor!
        });

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'SafetyTraining',
            operation: 'VALIDATION',
            issue:
              'Training without instructor accepted (compliance risk per ГОСТ 12.0.004)',
            severity: '[MAJOR]',
            expected:
              'Warning or rejection — instructor required for valid briefing',
            actual: 'Accepted',
          });
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
      } catch {
        // Expected
      }
    });

    test('E3: No participants — check if required', async () => {
      try {
        const res = await authenticatedRequest('admin', 'POST', API, {
          title: 'E2E-Training without participants',
          trainingType: 'INITIAL',
          date: new Date().toISOString().split('T')[0],
          instructorName: 'E2E-Test',
          // No participants!
        });

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'SafetyTraining',
            operation: 'VALIDATION',
            issue: 'Training without participants accepted',
            severity: '[MAJOR]',
            expected: 'At least 1 participant required',
            actual: 'Accepted with 0 participants',
          });
          try {
            const json = await res.json();
            const data = json.data ?? json;
            if (data.id) await deleteEntity(API, data.id, 'admin').catch(() => {});
          } catch { /* ignore */ }
        }
      } catch {
        // Expected
      }
    });
  });

  /* ───── F. TRAINING JOURNAL ───── */
  test.describe('F. TRAINING JOURNAL', () => {
    test('F1: Training journal page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/training-journal`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent = body.length > 100;

      if (!hasContent) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'JOURNAL',
          issue: 'Training journal page empty',
          severity: '[MINOR]',
          expected: 'Per-employee training records',
          actual: 'Empty page',
        });
      }
    });

    test('F2: Certification matrix page loads', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/certification-matrix`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasMatrix =
        /матриц|сертифик|допуск|аттестац|matrix|cert/i.test(body);

      if (!hasMatrix) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'JOURNAL',
          issue: 'Certification matrix has no content',
          severity: '[MINOR]',
          expected: 'Employee × certification matrix',
          actual: 'No matrix data',
        });
      }
    });
  });

  /* ───── G. DELETE ───── */
  test.describe('G. DELETE', () => {
    test('G1: Delete training via API', async () => {
      const training = await createTrainingViaApi({
        title: 'E2E-Delete test training',
      });

      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API}/${training.id}`,
      );
      expect.soft(res.status).toBeLessThanOrEqual(204);

      // Verify deleted
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${training.id}`,
      );
      if (getRes.status === 200) {
        trackIssue({
          entity: 'SafetyTraining',
          operation: 'DELETE',
          issue: 'Deleted training still accessible',
          severity: '[CRITICAL]',
          expected: 'HTTP 404 or 410',
          actual: `HTTP ${getRes.status}`,
        });
      }
    });
  });
});
