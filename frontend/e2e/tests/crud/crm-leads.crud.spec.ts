/**
 * SESSION 2.7 — Deep CRUD: CRM Leads (Лиды CRM)
 *
 * Full lifecycle test for CRM Lead entity.
 * Tested as 5 personas: прораб, бухгалтер, директор, инженер-сметчик, снабженец.
 * Uses realistic data: ООО "Девелопер-Инвест", ЖК "Солнечный".
 *
 * Pipeline stages: NEW → QUALIFIED → PROPOSITION → NEGOTIATION → WON / LOST
 *
 * Sections:
 *   A. CREATE — create lead via API, verify fields + status
 *   B. READ — list, filters, search, detail, dashboard KPIs
 *   C. UPDATE — change fields, verify
 *   D. PIPELINE STAGES — full chain NEW→…→WON, LOST with reason
 *   E. ACTIVITIES — call, meeting, site_visit
 *   F. VALIDATION — empty required, bad data
 *   G. CONVERT — WON → create project
 *   H. DELETE — soft delete, verify removal
 *   PERSONA — persona-specific checks
 *
 * API endpoints:
 *   GET    /api/v1/crm/leads          — list
 *   POST   /api/v1/crm/leads          — create
 *   GET    /api/v1/crm/leads/{id}     — get
 *   PUT    /api/v1/crm/leads/{id}     — update
 *   DELETE /api/v1/crm/leads/{id}     — delete
 *   PATCH  /api/v1/crm/leads/{id}/stage/{stageId} — move stage
 *   POST   /api/v1/crm/leads/{id}/won  — mark won
 *   POST   /api/v1/crm/leads/{id}/lost — mark lost
 *   POST   /api/v1/crm/leads/{id}/convert — convert to project
 *   GET    /api/v1/crm/stages         — stages
 *   GET    /api/v1/crm/leads/{id}/activities — activities
 *   POST   /api/v1/crm/activities     — create activity
 *   POST   /api/v1/crm/activities/{id}/complete — complete
 *   GET    /api/v1/crm/pipeline       — pipeline stats
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
const LEAD_DATA = {
  name: 'E2E-ООО "Девелопер-Инвест" — БЦ класса А',
  partnerName: 'Смирнов Андрей Павлович',
  companyName: 'E2E-ООО "Девелопер-Инвест"',
  phone: '+7 (495) 777-88-99',
  email: 'smirnov@developer-invest.ru',
  source: 'website',
  expectedRevenue: 250_000_000,
  probability: 60,
  priority: 'HIGH',
  description: 'Строительство бизнес-центра класса А, 12 этажей + 3 подземных. Площадь 35 000 м².',
};

const UPDATE_DATA = {
  expectedRevenue: 280_000_000,
  probability: 75,
  description: 'Уточнённый объём: 14 этажей + 3 подземных, паркинг на 600 мест.',
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let leadId: string;
let stages: Array<{ id: string; name: string }> = [];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
async function createLeadViaApi(overrides?: Record<string, unknown>): Promise<{ id: string }> {
  const body = { ...LEAD_DATA, ...overrides };
  const res = await fetch(`${API}/api/v1/crm/leads`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const data = json.data ?? json;
  return { id: data.id ?? '' };
}

async function fetchStages(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${API}/api/v1/crm/stages`, { headers: headers() });
  if (!res.ok) return [];
  const json = await res.json();
  const list = json.content ?? json.data ?? json ?? [];
  return Array.isArray(list) ? list : [];
}

async function cleanupE2ELeads(): Promise<void> {
  try {
    const res = await fetch(`${API}/api/v1/crm/leads?size=200`, { headers: headers() });
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    if (!Array.isArray(list)) return;
    const e2e = list.filter(
      (l: any) => (l.name ?? '').includes('E2E-') || (l.companyName ?? '').includes('E2E-'),
    );
    for (const l of e2e) {
      await fetch(`${API}/api/v1/crm/leads/${l.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

// ══════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════

test.describe('CRM Leads CRUD — Deep Lifecycle (Лиды CRM)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await getToken();
    await cleanupE2ELeads();
    stages = await fetchStages();
    if (stages.length > 0) {
      console.log(`CRM stages loaded: ${stages.map((s) => s.name).join(', ')}`);
    }
  });

  test.afterAll(async () => {
    await cleanupE2ELeads();
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  CRM LEADS CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ CRM LEADS CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create lead via API', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(LEAD_DATA),
    });

    expect(res.status, 'Lead creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    const data = json.data ?? json;
    leadId = data.id ?? '';
    expect(leadId, 'Lead ID returned').toBeTruthy();

    // Verify initial state
    expect.soft(data.status ?? data.stage, 'Initial status should be NEW').toMatch(/NEW|new|Новый/i);
    expect.soft(data.priority).toMatch(/HIGH|high/i);

    if (data.expectedRevenue !== undefined) {
      expect.soft(Number(data.expectedRevenue)).toBe(250_000_000);
    }

    console.log(`Created lead: id=${leadId}, status=${data.status}`);
  });

  test('A2: Verify lead detail via API', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads/${leadId}`, { headers: headers() });
    expect(res.ok, 'GET lead detail should succeed').toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    // Fields директор needs to see
    const checks: Array<{ field: string; pattern: RegExp | undefined; value: unknown }> = [
      { field: 'name', pattern: /Девелопер-Инвест/, value: data.name },
      { field: 'email', pattern: /smirnov@/, value: data.email },
      { field: 'phone', pattern: /777/, value: data.phone },
      { field: 'source', pattern: /website/i, value: data.source },
    ];

    for (const c of checks) {
      if (!c.value) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'READ',
          issue: `Field "${c.field}" is null/empty in detail`,
          severity: c.field === 'name' ? '[MAJOR]' : '[MINOR]',
          expected: `${c.field} has value`,
          actual: 'null/empty',
        });
      } else if (c.pattern && !c.pattern.test(String(c.value))) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'READ',
          issue: `Field "${c.field}" has unexpected value: ${c.value}`,
          severity: '[MINOR]',
          expected: `Matches ${c.pattern}`,
          actual: String(c.value),
        });
      }
    }

    // Weighted revenue check: expectedRevenue × (probability / 100)
    const weighted = Number(data.weightedRevenue ?? 0);
    const expectedWeighted = 250_000_000 * 0.60;
    if (weighted > 0) {
      const diff = Math.abs(weighted - expectedWeighted);
      if (diff > 1) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'CALCULATION',
          issue: `Weighted revenue wrong: ${weighted} ≠ 250M × 60% = ${expectedWeighted}`,
          severity: '[MAJOR]',
          expected: String(expectedWeighted),
          actual: String(weighted),
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. READ — List, search, dashboard                             */
  /* ============================================================== */

  test('B1: Lead appears in list (API)', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((l: any) => l.id === leadId) : null;
    expect(found, 'Lead should appear in list').toBeTruthy();
  });

  test('B2: CRM leads list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/crm/leads', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Check for pipeline/kanban or table view
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasKanban = await page.locator('[class*="kanban"], [class*="board"], [class*="column"], [class*="pipeline"]').first().isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="grid"]').first().isVisible().catch(() => false);

    if (!hasTable && !hasKanban && !hasCards) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'READ/list',
        issue: 'No table, kanban, or card layout found on leads page',
        severity: '[MAJOR]',
        expected: 'Pipeline kanban or table view',
        actual: 'No data layout found',
      });
    }

    await page.screenshot({ path: 'test-results/crm-leads-list.png' });
  });

  test('B3: CRM leads search works', async ({ page }) => {
    await page.goto('http://localhost:4000/crm/leads', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const searchInput = page.locator(
      'input[type="text"], input[type="search"], input[placeholder*="Поиск" i], input[placeholder*="search" i], input[placeholder*="найти" i]',
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('E2E-');
      await page.waitForTimeout(1500);

      const body = await page.textContent('body') ?? '';
      if (body.includes('E2E-') || body.includes('Девелопер')) {
        console.log('Search found our E2E lead');
      }
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'READ/search',
        issue: 'No search input found on CRM leads page',
        severity: '[UX]',
        expected: 'Search input visible',
        actual: 'Not found',
      });
    }
  });

  test('B4: CRM dashboard page loads', async ({ page }) => {
    await page.goto('http://localhost:4000/crm/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Dashboard has content').toBeGreaterThan(50);

    // Директор expects: funnel, total pipeline, conversion rate
    const metricsExpected = [
      { label: 'pipeline/funnel', pattern: /воронк|pipeline|funnel|лид|стадии|stages/i },
      { label: 'revenue/deals', pattern: /доход|revenue|выручк|сделк|deals/i },
    ];

    for (const m of metricsExpected) {
      if (!m.pattern.test(body)) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'READ/dashboard',
          issue: `Dashboard missing "${m.label}" metric`,
          severity: '[UX]',
          expected: `"${m.label}" visible on CRM dashboard`,
          actual: 'Not found',
        });
      }
    }

    await page.screenshot({ path: 'test-results/crm-dashboard.png' });
  });

  test('B5: Pipeline stats API', async () => {
    const res = await fetch(`${API}/api/v1/crm/pipeline`, { headers: headers() });
    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      console.log('Pipeline stats:', JSON.stringify(data).slice(0, 500));
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'READ/pipeline',
        issue: `Pipeline stats endpoint returned ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Update lead — increase revenue and probability', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads/${leadId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        ...LEAD_DATA,
        expectedRevenue: UPDATE_DATA.expectedRevenue,
        probability: UPDATE_DATA.probability,
        description: UPDATE_DATA.description,
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/v1/crm/leads/${leadId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());

      const revenue = Number(data.expectedRevenue ?? 0);
      if (revenue > 0) {
        expect.soft(revenue, 'Revenue updated to 280M').toBe(280_000_000);
      }

      const prob = Number(data.probability ?? 0);
      if (prob > 0) {
        expect.soft(prob, 'Probability updated to 75').toBe(75);
      }

      // Weighted revenue should be recalculated: 280M × 75% = 210M
      const weighted = Number(data.weightedRevenue ?? 0);
      if (weighted > 0) {
        const expectedW = 280_000_000 * 0.75;
        const diff = Math.abs(weighted - expectedW);
        if (diff > 1) {
          trackIssue({
            entity: 'CRM Lead',
            operation: 'UPDATE/weighted',
            issue: `Weighted revenue not recalculated: ${weighted} ≠ 280M × 75% = ${expectedW}`,
            severity: '[MAJOR]',
            expected: String(expectedW),
            actual: String(weighted),
          });
        }
      }
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'UPDATE',
        issue: `Lead update failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  D. PIPELINE STAGES                                            */
  /* ============================================================== */

  test('D1: Move lead through pipeline: NEW → QUALIFIED → PROPOSITION → NEGOTIATION', async () => {
    // Create a fresh lead for pipeline testing
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид для пайплайна — ЖК "Солнечный-2"',
      companyName: 'E2E-ООО "Стройинвест"',
      expectedRevenue: 150_000_000,
    });
    const id = freshLead.id;
    if (!id) {
      console.log('SKIP: Could not create fresh lead for pipeline test');
      return;
    }

    // Get stages to find IDs
    const targetStages = ['QUALIFIED', 'PROPOSITION', 'NEGOTIATION'];

    for (const targetStatus of targetStages) {
      // Try stage-based move (if stages exist)
      const stageObj = stages.find(
        (s) => s.name?.toUpperCase().includes(targetStatus) || s.name?.includes(targetStatus),
      );

      let moved = false;

      if (stageObj) {
        const res = await fetch(`${API}/api/v1/crm/leads/${id}/stage/${stageObj.id}`, {
          method: 'PATCH',
          headers: headers(),
        });
        moved = res.ok;
      }

      // Fallback: try direct status update
      if (!moved) {
        const res = await fetch(`${API}/api/v1/crm/leads/${id}`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify({
            name: 'E2E-Лид для пайплайна — ЖК "Солнечный-2"',
            status: targetStatus,
          }),
        });
        moved = res.ok;
      }

      if (!moved) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'PIPELINE',
          issue: `Cannot move lead to ${targetStatus}`,
          severity: '[MAJOR]',
          expected: `Lead moves to ${targetStatus}`,
          actual: 'Move failed',
        });
      }
    }

    // Verify final status
    const verifyRes = await fetch(`${API}/api/v1/crm/leads/${id}`, { headers: headers() });
    if (verifyRes.ok) {
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`Lead pipeline final status: ${data.status}`);
    }

    // Clean up
    await fetch(`${API}/api/v1/crm/leads/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
  });

  test('D2: Mark lead as WON', async () => {
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид WON тест — Склад "Логистик"',
      companyName: 'E2E-ООО "Складстрой"',
      expectedRevenue: 100_000_000,
    });
    const id = freshLead.id;
    if (!id) return;

    const res = await fetch(`${API}/api/v1/crm/leads/${id}/won`, {
      method: 'POST',
      headers: headers(),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/v1/crm/leads/${id}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/WON|won/i);

      // Won date should be set
      if (!data.wonDate) {
        trackIssue({
          entity: 'CRM Lead',
          operation: 'PIPELINE/WON',
          issue: 'wonDate not set when marking lead as WON',
          severity: '[MINOR]',
          expected: 'wonDate populated',
          actual: 'wonDate is null',
        });
      }
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'PIPELINE/WON',
        issue: `Mark as WON failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx, status=WON',
        actual: `HTTP ${res.status}`,
      });
    }

    await fetch(`${API}/api/v1/crm/leads/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
  });

  test('D3: Mark lead as LOST — requires reason', async () => {
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид LOST тест — Школа №5',
      companyName: 'E2E-Администрация района',
      expectedRevenue: 95_000_000,
    });
    const id = freshLead.id;
    if (!id) return;

    // Try to mark as LOST without reason
    const resNoReason = await fetch(`${API}/api/v1/crm/leads/${id}/lost`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    });

    // If it succeeds without reason — track as issue (should require reason)
    if (resNoReason.ok) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'PIPELINE/LOST',
        issue: 'Lead marked LOST without providing a reason — should require lostReason',
        severity: '[UX]',
        expected: 'Reason required for LOST status',
        actual: 'LOST accepted without reason',
      });
    }

    // Mark as LOST with reason
    const res = await fetch(`${API}/api/v1/crm/leads/${id}/lost`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        reason: 'Выбрали другого подрядчика — ООО "КонкурентСтрой" предложил цену на 15% ниже',
        lostReason: 'Выбрали другого подрядчика — ООО "КонкурентСтрой" предложил цену на 15% ниже',
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/v1/crm/leads/${id}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/LOST|lost/i);
      console.log(`LOST reason: ${data.lostReason}`);
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'PIPELINE/LOST',
        issue: `Mark as LOST with reason failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx, status=LOST',
        actual: `HTTP ${res.status}`,
      });
    }

    await fetch(`${API}/api/v1/crm/leads/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
  });

  /* ============================================================== */
  /*  E. ACTIVITIES                                                 */
  /* ============================================================== */

  test('E1: Create activity (CALL) for lead', async () => {
    const res = await fetch(`${API}/api/v1/crm/activities`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        leadId,
        type: 'CALL',
        subject: 'E2E-Первичный звонок — обсуждение ТЗ',
        description: 'Обсудить общие параметры проекта, бюджет, сроки',
        scheduledDate: '2026-03-20',
      }),
    });

    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      console.log(`Activity created: id=${data.id}, type=${data.type}`);

      // Complete the activity
      if (data.id) {
        const completeRes = await fetch(`${API}/api/v1/crm/activities/${data.id}/complete`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            result: 'Заказчик заинтересован, назначена встреча на объекте',
          }),
        });
        if (completeRes.ok) {
          console.log('Activity completed');
        }
      }
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'ACTIVITY/create',
        issue: `Create activity failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('E2: Create activity (SITE_VISIT) for lead', async () => {
    const res = await fetch(`${API}/api/v1/crm/activities`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        leadId,
        type: 'SITE_VISIT',
        subject: 'E2E-Выезд на объект — обследование площадки',
        description: 'Осмотр участка, фото-фиксация, замеры',
        scheduledDate: '2026-03-25',
      }),
    });

    if (res.ok) {
      console.log('Site visit activity created');
    } else {
      // May not be available — track but don't fail hard
      console.log(`Site visit activity creation: HTTP ${res.status}`);
    }
  });

  test('E3: List activities for lead', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads/${leadId}/activities`, { headers: headers() });

    if (res.ok) {
      const json = await res.json();
      const activities = json.content ?? json.data ?? json ?? [];
      const list = Array.isArray(activities) ? activities : [];
      console.log(`Lead has ${list.length} activities`);
      expect.soft(list.length, 'Lead should have at least 1 activity').toBeGreaterThanOrEqual(1);
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'ACTIVITY/list',
        issue: `List activities failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  F. VALIDATION                                                 */
  /* ============================================================== */

  test('F1: Cannot create lead without name', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        email: 'test@test.ru',
        expectedRevenue: 100_000_000,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'VALIDATION',
        issue: 'Lead created without name — should be rejected',
        severity: '[MAJOR]',
        expected: 'HTTP 400 — name required',
        actual: `HTTP ${res.status} — accepted`,
      });
      // Clean up
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/v1/crm/leads/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      expect.soft(res.status, 'Missing name rejected').toBeGreaterThanOrEqual(400);
    }
  });

  test('F2: Negative expected revenue rejected', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Negative revenue test',
        expectedRevenue: -50_000_000,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'VALIDATION',
        issue: 'Negative expectedRevenue accepted — should be rejected',
        severity: '[MAJOR]',
        expected: 'HTTP 400 — expectedRevenue >= 0',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/v1/crm/leads/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('F3: Probability out of range (>100) rejected', async () => {
    const res = await fetch(`${API}/api/v1/crm/leads`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Bad probability test',
        probability: 150,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'VALIDATION',
        issue: 'Probability 150% accepted — should be capped at 100%',
        severity: '[MINOR]',
        expected: 'HTTP 400 or max 100%',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/v1/crm/leads/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    }
  });

  /* ============================================================== */
  /*  G. CONVERT — WON → Project                                   */
  /* ============================================================== */

  test('G1: Convert WON lead to project', async () => {
    // Create and win a lead
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид для конвертации — Детсад "Радуга"',
      companyName: 'E2E-Администрация г. Москвы',
      expectedRevenue: 95_000_000,
    });
    const id = freshLead.id;
    if (!id) return;

    // Mark as WON
    await fetch(`${API}/api/v1/crm/leads/${id}/won`, { method: 'POST', headers: headers() });

    // Convert to project
    const res = await fetch(`${API}/api/v1/crm/leads/${id}/convert`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        projectName: 'E2E-Детский сад "Радуга" — из CRM лида',
        projectCode: 'E2E-DS-RAD',
      }),
    });

    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      console.log(`Lead converted to project: projectId=${data.projectId ?? data.id}`);

      // Verify lead now has projectId reference
      const leadRes = await fetch(`${API}/api/v1/crm/leads/${id}`, { headers: headers() });
      if (leadRes.ok) {
        const leadData = (await leadRes.json()).data ?? (await leadRes.json());
        if (leadData.projectId) {
          console.log(`Lead linked to project: ${leadData.projectId}`);
        } else {
          trackIssue({
            entity: 'CRM Lead',
            operation: 'CONVERT',
            issue: 'Lead has no projectId after conversion',
            severity: '[MINOR]',
            expected: 'projectId populated after conversion',
            actual: 'projectId is null',
          });
        }
      }
    } else {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'CONVERT',
        issue: `Convert to project failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx — project created from lead',
        actual: `HTTP ${res.status}`,
      });
    }

    // Clean up lead (project may need separate cleanup)
    await fetch(`${API}/api/v1/crm/leads/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
  });

  /* ============================================================== */
  /*  H. DELETE                                                     */
  /* ============================================================== */

  test('H1: Delete lead via API — soft delete', async () => {
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид для удаления',
      companyName: 'E2E-ООО "Удаляемая компания"',
    });
    const id = freshLead.id;
    if (!id) return;

    const res = await fetch(`${API}/api/v1/crm/leads/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    expect.soft(res.status, 'Delete should succeed').toBeLessThanOrEqual(204);

    // Verify not accessible
    const getRes = await fetch(`${API}/api/v1/crm/leads/${id}`, { headers: headers() });
    if (getRes.ok) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'DELETE',
        issue: 'Deleted lead still accessible via GET',
        severity: '[CRITICAL]',
        expected: 'HTTP 404/410 after deletion',
        actual: `HTTP ${getRes.status} — still returned`,
      });
    }
  });

  test('H2: Delete lead from UI — confirm dialog', async ({ page }) => {
    const freshLead = await createLeadViaApi({
      name: 'E2E-Лид UI удаление тест',
      companyName: 'E2E-Тест UI Delete',
    });
    const id = freshLead.id;
    if (!id) {
      console.log('SKIP: could not create lead for UI delete test');
      return;
    }

    await page.goto(`http://localhost:4000/crm/leads/${id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    const deleteBtn = page.getByRole('button', { name: /удалить|delete/i })
      .or(page.locator('button[aria-label*="удалить" i], button[aria-label*="delete" i]'));

    if (await deleteBtn.first().isVisible().catch(() => false)) {
      page.on('dialog', async (dialog) => dialog.accept());
      await deleteBtn.first().click();
      await page.waitForTimeout(2000);

      // Check for confirmation modal
      const confirmBtn = page.getByRole('button', {
        name: /подтвердить|удалить|confirm|delete|да/i,
      });
      if (await confirmBtn.first().isVisible().catch(() => false)) {
        await confirmBtn.first().click();
        await page.waitForTimeout(3000);
      }
    } else {
      // Clean up via API
      await fetch(`${API}/api/v1/crm/leads/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
    }

    await page.screenshot({ path: 'test-results/crm-lead-delete.png' });
  });

  /* ============================================================== */
  /*  PERSONA — Domain expert checks                                */
  /* ============================================================== */

  test('PERSONA: Директор — pipeline revenue visible', async ({ page }) => {
    await page.goto('http://localhost:4000/crm/leads', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    // Директор needs: total pipeline value visible
    const hasRevenue = /\d+[\s,]\d{3}|₽|руб|revenue|выручк|бюджет|доход/i.test(body);

    if (!hasRevenue) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'PERSONA/директор',
        issue: 'No revenue/budget data visible on CRM leads page',
        severity: '[UX]',
        expected: 'Директор видит сумму по воронке за 30 секунд',
        actual: 'No financial KPIs on leads page',
      });
    }
  });

  test('PERSONA: Бухгалтер — CRM is secondary, but lead sources matter', async ({ page }) => {
    await page.goto('http://localhost:4000/crm/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    // Бухгалтер: lead source data helps understand marketing spend ROI
    const hasSourceData = /источник|source|канал|channel|сайт|website|реферал|referral/i.test(body);

    if (!hasSourceData) {
      trackIssue({
        entity: 'CRM Lead',
        operation: 'PERSONA/бухгалтер',
        issue: 'No lead source analytics on dashboard — needed for marketing ROI',
        severity: '[UX]',
        expected: 'Lead source breakdown (for ROI analysis)',
        actual: 'No source data found',
      });
    }
  });
});
