/**
 * SESSION 2.4 — Deep CRUD: Safety Incidents
 *
 * Personas: Прораб (reports), Инженер ОТ (investigates), Директор (reviews metrics)
 * Domain: СП 12-136-2002, ТК РФ ст.227-231, Форма Н-1
 *
 * Status flow: REPORTED → UNDER_INVESTIGATION → CORRECTIVE_ACTION → RESOLVED → CLOSED
 * Severity: MINOR | MODERATE | SERIOUS | CRITICAL | FATAL
 * Types: FALL | STRUCK_BY | CAUGHT_IN | ELECTROCUTION | COLLAPSE | FIRE | CHEMICAL | EQUIPMENT | OTHER
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
const API = '/api/safety/incidents';

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
const INCIDENT_NEAR_MISS = {
  description:
    'E2E-При монтаже опалубки стены произошло падение элемента с высоты 4м. Рабочие находились в безопасной зоне, пострадавших нет.',
  severity: 'MODERATE',
  incidentType: 'STRUCK_BY',
  incidentDate: new Date().toISOString().split('T')[0],
  incidentTime: '14:30',
  location: 'Корпус 1, 5 этаж, ось Г-Д/3-4',
  locationDescription: 'Корпус 1, 5 этаж, ось Г-Д/3-4',
  reportedByName: 'E2E-Иванов А.С.',
  witnessNames: 'Козлов Д.А., Петров И.В.',
  correctiveActions:
    'Остановлены работы на участке. Проведён внеплановый инструктаж.',
  notes: 'E2E-Потенциально опасное происшествие, без пострадавших',
};

const INCIDENT_LOST_TIME = {
  description:
    'E2E-Электромонтажник получил электротравму при подключении щита ЩС-1. Госпитализирован.',
  severity: 'CRITICAL',
  incidentType: 'ELECTROCUTION',
  incidentDate: new Date().toISOString().split('T')[0],
  incidentTime: '10:15',
  location: 'Корпус 2, подвал, электрощитовая',
  locationDescription: 'Корпус 2, подвал, электрощитовая',
  reportedByName: 'E2E-Козлов Д.А.',
  injuredPersons: 1,
  workDaysLost: 14,
  medicalTreatment: true,
  hospitalization: true,
  witnessNames: 'Волков А.П.',
  correctiveActions:
    'Отключено питание щита. Вызвана скорая. Составлен акт расследования.',
  notes: 'E2E-Несчастный случай с потерей рабочего времени. Требуется Н-1.',
};

const INCIDENT_UPDATE = {
  description:
    'E2E-При монтаже опалубки стены произошло падение элемента с высоты 4м. ОБНОВЛЕНО: установлена причина — износ крепления.',
  correctiveActions:
    'Все крепления заменены. Повторный инструктаж проведён 11.03.2026.',
};

/* ───── helpers ───── */
async function createIncidentViaApi(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return createEntity<{ id: string }>(
    API,
    { ...INCIDENT_NEAR_MISS, ...overrides },
    'admin',
  );
}

async function cleanupE2EIncidents(): Promise<void> {
  try {
    const list = await listEntities<{
      id: string;
      description?: string;
      notes?: string;
    }>(API, { size: '200' }, 'admin');
    const e2e = list.filter(
      (i) =>
        (i.description ?? '').includes('E2E-') ||
        (i.notes ?? '').includes('E2E-'),
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
test.describe('Safety Incidents CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let nearMissId: string | undefined;
  let lostTimeId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2EIncidents();
  });

  test.afterAll(async () => {
    await cleanupE2EIncidents();
    if (issues.length > 0) {
      console.log('\n═══ SAFETY INCIDENTS CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n No safety incident issues found.');
    }
  });

  /* ───── A. CREATE ───── */
  test.describe('A. CREATE', () => {
    test('A1: Create NEAR_MISS via API — all fields', async () => {
      const res = await createIncidentViaApi();
      nearMissId = res.id;
      expect(nearMissId).toBeTruthy();
    });

    test('A2: Verify near-miss in list', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/incidents`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);
      const body = await page.locator('body').innerText();
      const found =
        body.includes('E2E-') || body.includes('монтаже опалубки');

      if (!found) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'CREATE→LIST',
          issue: 'Created near-miss not found in incident list',
          severity: '[MAJOR]',
          expected: 'E2E incident visible in /safety/incidents',
          actual: 'Not found',
        });
      }
      expect.soft(found).toBeTruthy();
    });

    test('A3: Create CRITICAL incident (electrocution, lost time)', async () => {
      const res = await createIncidentViaApi(INCIDENT_LOST_TIME);
      lostTimeId = res.id;
      expect(lostTimeId).toBeTruthy();
    });

    test('A4: Create incident via UI form', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/incidents/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      const hasForm = await page
        .locator('form, [data-testid="incident-form"]')
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      if (!hasForm) {
        // Try create from list page via button
        await page.goto(`${BASE}/safety/incidents`, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        const createBtn = page
          .getByRole('button', {
            name: /создать|добавить|новый|зарегистрировать|create|add|new/i,
          })
          .first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      // Try to fill form fields
      const descInput = page.locator(
        'textarea[name="description"], input[name="description"]',
      );
      if (await descInput.first().isVisible().catch(() => false)) {
        await descInput.first().fill(
          'E2E-UI: Падение строительного мусора в зону прохода',
        );
      }

      const locationInput = page.locator(
        'input[name="location"], input[name="locationDescription"]',
      );
      if (await locationInput.first().isVisible().catch(() => false)) {
        await locationInput.first().fill('Корпус 3, двор');
      }

      await page.screenshot({
        path: 'e2e/screenshots/incident-create-form.png',
        fullPage: true,
      });

      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|зарегистрировать/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(3000);
      }
    });
  });

  /* ───── B. READ ───── */
  test.describe('B. READ', () => {
    test('B1: List page loads with table or cards', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/incidents`, {
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

    test('B2: Detail page shows incident data', async ({
      trackedPage: page,
    }) => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      await page.goto(`${BASE}/safety/incidents/${nearMissId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasDescription =
        body.includes('опалубки') || body.includes('E2E-');
      const hasLocation =
        body.includes('Корпус') || body.includes('ось Г-Д');

      if (!hasDescription) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'READ/DETAIL',
          issue: 'Description not displayed on detail page',
          severity: '[MAJOR]',
          expected: 'Incident description visible',
          actual: 'Not found on page',
        });
      }
      expect.soft(hasDescription || hasLocation).toBeTruthy();
    });

    test('B3: Filter by status tabs', async ({ trackedPage: page }) => {
      await page.goto(`${BASE}/safety/incidents`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      // Look for status tabs: Все, Активные, Решённые, Закрытые
      const tabs = page.locator(
        'button, [role="tab"]',
      );
      const tabTexts: string[] = [];
      const count = await tabs.count();
      for (let i = 0; i < Math.min(count, 20); i++) {
        const text = await tabs.nth(i).innerText().catch(() => '');
        if (
          /все|активн|решён|закрыт|открыт|расслед|all|active|resolved|closed/i.test(
            text,
          )
        ) {
          tabTexts.push(text.trim());
        }
      }

      if (tabTexts.length === 0) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'READ/FILTER',
          issue: 'No status filter tabs found',
          severity: '[UX]',
          expected: 'Status tabs (Все/Активные/Решённые/Закрытые)',
          actual: 'No matching tabs',
        });
      }
    });

    test('B4: Severity badge colors correct', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/incidents`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      // Check for severity labels in Russian
      const hasSeverityLabels =
        /незначител|умеренн|серьёзн|критич|смертел|minor|moderate|serious|critical|fatal/i.test(
          body,
        );

      if (!hasSeverityLabels) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'READ/DISPLAY',
          issue: 'Severity labels not displayed in incident list',
          severity: '[MINOR]',
          expected: 'Severity badge (Критическая/Умеренная/etc)',
          actual: 'No severity labels found',
        });
      }
    });

    test('B5: API returns full incident structure', async () => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${nearMissId}`,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      const incident = json.data ?? json;

      // Verify all fields present
      expect.soft(incident.description).toContain('E2E-');
      expect.soft(incident.severity).toBeTruthy();
      expect.soft(incident.status).toBeTruthy();

      // Verify date format
      if (incident.incidentDate) {
        expect
          .soft(incident.incidentDate)
          .toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    });
  });

  /* ───── C. UPDATE ───── */
  test.describe('C. UPDATE', () => {
    test('C1: Update incident description via API', async () => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      const res = await authenticatedRequest(
        'admin',
        'PUT',
        `${API}/${nearMissId}`,
        {
          ...INCIDENT_NEAR_MISS,
          ...INCIDENT_UPDATE,
        },
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'UPDATE',
          issue: 'PUT update failed',
          severity: '[MAJOR]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);
    });

    test('C2: Update via UI edit page', async ({ trackedPage: page }) => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      // Navigate to detail → find edit button
      await page.goto(`${BASE}/safety/incidents/${nearMissId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const editBtn = page.getByRole('button', {
        name: /редактировать|edit|изменить/i,
      });
      if (await editBtn.first().isVisible().catch(() => false)) {
        await editBtn.first().click();
        await page.waitForTimeout(2000);

        // Try to update description
        const descInput = page.locator(
          'textarea[name="description"], input[name="description"]',
        );
        if (await descInput.first().isVisible().catch(() => false)) {
          await descInput.first().clear();
          await descInput.first().fill(
            'E2E-ОБНОВЛЕНО: падение элемента опалубки, причина установлена',
          );
        }

        const saveBtn = page.getByRole('button', {
          name: /сохранить|save|обновить/i,
        });
        if (await saveBtn.first().isVisible().catch(() => false)) {
          await saveBtn.first().click();
          await page.waitForTimeout(3000);
        }
      }

      await page.screenshot({
        path: 'e2e/screenshots/incident-updated.png',
        fullPage: true,
      });
    });
  });

  /* ───── D. STATUS TRANSITIONS ───── */
  test.describe('D. STATUS TRANSITIONS', () => {
    test('D1: REPORTED → UNDER_INVESTIGATION', async () => {
      const incident = await createIncidentViaApi({
        description: 'E2E-Status test: investigation start',
      });

      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${incident.id}/investigate`,
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'STATUS',
          issue:
            'REPORTED→UNDER_INVESTIGATION transition failed',
          severity: '[CRITICAL]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      await deleteEntity(API, incident.id, 'admin').catch(() => {});
    });

    test('D2: UNDER_INVESTIGATION → CORRECTIVE_ACTION', async () => {
      const incident = await createIncidentViaApi({
        description: 'E2E-Status test: corrective action',
      });

      // First transition to UNDER_INVESTIGATION
      await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${incident.id}/investigate`,
      );

      // Then to CORRECTIVE_ACTION
      const res = await authenticatedRequest(
        'admin',
        'PATCH',
        `${API}/${incident.id}/corrective-action`,
      );

      if (res.status !== 200) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'STATUS',
          issue: 'UNDER_INVESTIGATION→CORRECTIVE_ACTION failed',
          severity: '[CRITICAL]',
          expected: 'HTTP 200',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBe(200);

      await deleteEntity(API, incident.id, 'admin').catch(() => {});
    });

    test('D3: Full lifecycle REPORTED → CLOSED', async () => {
      const incident = await createIncidentViaApi({
        description: 'E2E-Full lifecycle test',
      });

      const steps = [
        { endpoint: 'investigate', expected: 'UNDER_INVESTIGATION' },
        { endpoint: 'corrective-action', expected: 'CORRECTIVE_ACTION' },
        { endpoint: 'resolve', expected: 'RESOLVED' },
        { endpoint: 'close', expected: 'CLOSED' },
      ];

      for (const step of steps) {
        const res = await authenticatedRequest(
          'admin',
          'PATCH',
          `${API}/${incident.id}/${step.endpoint}`,
        );

        if (res.status !== 200) {
          trackIssue({
            entity: 'SafetyIncident',
            operation: 'STATUS',
            issue: `Transition to ${step.expected} failed`,
            severity: '[CRITICAL]',
            expected: 'HTTP 200',
            actual: `HTTP ${res.status}`,
          });
        }
        expect.soft(
          res.status,
          `→${step.expected} should succeed`,
        ).toBe(200);
      }

      // Verify final status
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${incident.id}`,
      );
      if (getRes.status === 200) {
        const json = await getRes.json();
        const data = json.data ?? json;
        expect.soft(data.status).toBe('CLOSED');
      }

      await deleteEntity(API, incident.id, 'admin').catch(() => {});
    });

    test('D4: UI shows status timeline', async ({ trackedPage: page }) => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      await page.goto(`${BASE}/safety/incidents/${nearMissId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      // Should show current status or status indicator
      const hasStatus =
        /статус|status|зарегистрирован|расследован|reported|investigating/i.test(
          body,
        );

      if (!hasStatus) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'STATUS/UI',
          issue: 'No status indicator on detail page',
          severity: '[UX]',
          expected: 'Status badge or timeline',
          actual: 'No status indication found',
        });
      }
    });
  });

  /* ───── E. VALIDATION ───── */
  test.describe('E. VALIDATION', () => {
    test('E1: Empty description rejected via API', async () => {
      try {
        const res = await authenticatedRequest('admin', 'POST', API, {
          severity: 'MINOR',
          incidentType: 'OTHER',
          incidentDate: new Date().toISOString().split('T')[0],
          // No description!
        });

        if (res.status === 201 || res.status === 200) {
          trackIssue({
            entity: 'SafetyIncident',
            operation: 'VALIDATION',
            issue: 'Empty description accepted',
            severity: '[CRITICAL]',
            expected: 'HTTP 400/422 — description required',
            actual: `HTTP ${res.status}`,
          });
        }
        expect.soft(res.status).toBeGreaterThanOrEqual(400);
      } catch {
        // Expected — validation error
      }
    });

    test('E2: Empty form submit shows validation errors in UI', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/incidents/new`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|зарегистрировать/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(1500);

        const errors = page.locator(
          '.text-red-500, .text-red-600, [role="alert"], .field-error',
        );
        const errorCount = await errors.count();

        if (errorCount === 0) {
          trackIssue({
            entity: 'SafetyIncident',
            operation: 'VALIDATION/UI',
            issue: 'No validation errors shown on empty form submit',
            severity: '[MAJOR]',
            expected: 'At least 1 validation error',
            actual: '0 errors',
          });
        }
        expect.soft(errorCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('E3: FATAL severity without injured person — check warning', async () => {
      const res = await authenticatedRequest('admin', 'POST', API, {
        description: 'E2E-Fatal test without injured person',
        severity: 'FATAL',
        incidentType: 'FALL',
        incidentDate: new Date().toISOString().split('T')[0],
        injuredPersons: 0,
        // No injured person name — should warn or reject
      });

      // FATAL without injured is a domain logic issue
      if (res.status === 200 || res.status === 201) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'VALIDATION',
          issue: 'FATAL severity accepted without injured person data',
          severity: '[MAJOR]',
          expected:
            'Warning or rejection — fatal incident must have victim info',
          actual: 'Accepted without warning',
        });
        // Clean up
        try {
          const json = await res.json();
          const data = json.data ?? json;
          if (data.id)
            await deleteEntity(API, data.id, 'admin').catch(() => {});
        } catch {
          /* ignore */
        }
      }
    });

    test('E4: Corrective action due date validation', async () => {
      // Past due dates should trigger warning
      const pastDate = '2020-01-01';
      const res = await authenticatedRequest('admin', 'POST', API, {
        description: 'E2E-Past corrective action date test',
        severity: 'MODERATE',
        incidentType: 'OTHER',
        incidentDate: new Date().toISOString().split('T')[0],
        correctiveActions: `Устранить до ${pastDate}`,
      });

      // This is soft validation — may accept but should warn
      if (res.status === 200 || res.status === 201) {
        try {
          const json = await res.json();
          const data = json.data ?? json;
          if (data.id)
            await deleteEntity(API, data.id, 'admin').catch(() => {});
        } catch {
          /* ignore */
        }
      }
    });
  });

  /* ───── F. REGULATORY (Н-1 form) ───── */
  test.describe('F. REGULATORY', () => {
    test('F1: Accident acts page accessible', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/accident-acts`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasContent = body.length > 100;

      if (!hasContent) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'REGULATORY',
          issue: 'Accident acts (Н-1) page has no content',
          severity: '[MISSING]',
          expected: 'List of Н-1 forms or creation interface',
          actual: 'Empty or minimal page',
        });
      }
    });

    test('F2: CRITICAL incident should trigger Н-1 form creation', async () => {
      if (!lostTimeId) {
        const res = await createIncidentViaApi(INCIDENT_LOST_TIME);
        lostTimeId = res.id;
      }

      // Check accident acts API
      const res = await authenticatedRequest(
        'admin',
        'GET',
        '/api/safety/accident-acts',
      );

      if (res.status === 200) {
        const json = await res.json();
        const acts = json.data ?? json.content ?? json;
        const linked = Array.isArray(acts)
          ? acts.find(
              (a: Record<string, unknown>) =>
                a.incidentId === lostTimeId,
            )
          : null;

        if (!linked) {
          trackIssue({
            entity: 'SafetyIncident',
            operation: 'REGULATORY',
            issue:
              'CRITICAL incident with hospitalization has no auto-generated Н-1 act',
            severity: '[MISSING]',
            expected:
              'Automatic Н-1 form creation for CRITICAL incidents',
            actual: 'No linked accident act found',
          });
        }
      } else if (res.status === 404) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'REGULATORY',
          issue: 'Accident acts API not found (404)',
          severity: '[MISSING]',
          expected: 'GET /api/safety/accident-acts → 200',
          actual: `HTTP ${res.status}`,
        });
      }
    });

    test('F3: Safety metrics page shows LTIFR', async ({
      trackedPage: page,
    }) => {
      await page.goto(`${BASE}/safety/metrics`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const body = await page.locator('body').innerText();
      const hasLTIFR =
        /ltifr|ltir|trir|частот|коэфф.*травм/i.test(body);

      if (!hasLTIFR) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'REGULATORY',
          issue: 'Safety metrics page does not show LTIFR/LTIR',
          severity: '[MISSING]',
          expected:
            'LTIFR = (LTI × 1,000,000) / Total Hours Worked',
          actual: 'No LTIFR indicator found',
        });
      }
    });
  });

  /* ───── G. DELETE ───── */
  test.describe('G. DELETE', () => {
    test('G1: Delete incident via API', async () => {
      const incident = await createIncidentViaApi({
        description: 'E2E-Delete test incident',
      });

      const res = await authenticatedRequest(
        'admin',
        'DELETE',
        `${API}/${incident.id}`,
      );
      expect.soft(res.status).toBeLessThanOrEqual(204);

      // Verify deleted
      const getRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/${incident.id}`,
      );
      if (getRes.status === 200) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'DELETE',
          issue: 'Deleted incident still accessible via GET',
          severity: '[CRITICAL]',
          expected: 'HTTP 404 or 410',
          actual: `HTTP ${getRes.status}`,
        });
      }
    });

    test('G2: Delete button visible on UI', async ({
      trackedPage: page,
    }) => {
      if (!nearMissId) {
        const res = await createIncidentViaApi();
        nearMissId = res.id;
      }

      await page.goto(`${BASE}/safety/incidents/${nearMissId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);

      const deleteBtn = page.getByRole('button', {
        name: /удалить|delete/i,
      });
      const hasDelete = await deleteBtn
        .first()
        .isVisible()
        .catch(() => false);

      if (!hasDelete) {
        trackIssue({
          entity: 'SafetyIncident',
          operation: 'DELETE/UI',
          issue: 'No delete button on incident detail page',
          severity: '[MINOR]',
          expected: 'Delete button for admin',
          actual: 'No delete button found',
        });
      }
    });
  });
});
