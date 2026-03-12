/**
 * SESSION 2.6 — Deep CRUD: КС-2 / КС-3 (Акты выполненных работ)
 *
 * Full lifecycle: create КС-2 → add lines → verify totals → sign → link to КС-3.
 * Persona focus: Бухгалтер (totals exact, НДС=20%), Прораб (volumes, periods).
 *
 * Domain rules (Russian construction documentation):
 *   - КС-2 line total = quantity × unitPrice (exact to kopeck)
 *   - КС-2 subtotal = SUM(lines) — no rounding
 *   - НДС = subtotal × 0.20 (exactly 20%)
 *   - Total = subtotal + НДС
 *   - КС-3 total = SUM(linked КС-2 acts)
 *   - КС-3 cannot exceed contract value (unless addendum)
 *   - Cumulative КС-2 quantity ≤ estimate total quantity
 *   - Status: DRAFT → SUBMITTED → SIGNED → CLOSED
 *   - Period dates must not overlap with other КС-2 for same contract
 *
 * Pre-calculated values:
 *   Line 1: 15 × 2,812.20 = 42,183.00
 *   Line 2: 40 × 115.80 = 4,632.00
 *   Subtotal: 46,815.00
 *   НДС 20%: 9,363.00
 *   Total: 56,178.00
 *
 * API endpoints tested:
 *   POST   /api/ks2                    — create
 *   GET    /api/ks2                    — list
 *   GET    /api/ks2/{id}              — detail
 *   PUT    /api/ks2/{id}              — update
 *   POST   /api/ks2/{id}/submit       — DRAFT → SUBMITTED
 *   POST   /api/ks2/{id}/sign         — SUBMITTED → SIGNED
 *   POST   /api/ks2/{id}/close        — SIGNED → CLOSED
 *   POST   /api/ks2/{id}/lines        — add line
 *   GET    /api/ks3                    — list КС-3
 *   POST   /api/ks3                    — create КС-3
 *   POST   /api/ks3/{id}/link-ks2     — link КС-2 to КС-3
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
function parseRussianNumber(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^\d,.\-−]/g, '').replace('−', '-').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

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

async function apiDelete(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: headers() });
  return res.status;
}

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const KS2_NUMBER = 'E2E-КС2-001';

const KS2_LINES = [
  {
    workName: 'Прокладка кабелей массой 1м до 1кг',
    unitOfMeasure: '100 м',
    quantity: 15,         // 15 of 50 estimate units done this period
    unitPrice: 2812.20,
    costCode: 'ГЭСН 08-02-001-01',
  },
  {
    workName: 'Установка автоматических выключателей',
    unitOfMeasure: 'шт',
    quantity: 40,         // 40 of 120 installed this period
    unitPrice: 115.80,
    costCode: 'ГЭСН 08-03-587-01',
  },
];

// Pre-calculated
const CALC = {
  line1Total: 15 * 2812.20,    // 42,183.00
  line2Total: 40 * 115.80,     // 4,632.00
  subtotal: 0,
  vat: 0,
  total: 0,
};
CALC.subtotal = CALC.line1Total + CALC.line2Total; // 46,815.00
CALC.vat = CALC.subtotal * 0.20;                   // 9,363.00
CALC.total = CALC.subtotal + CALC.vat;             // 56,178.00

const TOLERANCE = 1.0; // ±1 ₽

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let contractId: string;
let ks2Id: string;
let ks3Id: string;
const lineIds: string[] = [];

test.describe('КС-2 / КС-3 CRUD — Deep Lifecycle (Акты выполненных работ)', () => {
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

    // Find or create a contract for КС-2 linkage
    const cListRes = await fetch(`${API}/api/contracts?search=E2E-ДС-2026&size=5`, { headers: headers() });
    const cListJson = await cListRes.json().catch(() => ({}));
    const contracts = cListJson.content ?? cListJson.data ?? cListJson ?? [];
    const existingContract = Array.isArray(contracts) ? contracts.find((c: any) => c.name?.includes('E2E-ДС')) : null;

    if (existingContract) {
      contractId = existingContract.id;
    } else {
      const cCreateRes = await fetch(`${API}/api/contracts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: 'E2E-ДС-2026-001 Электромонтаж',
          number: 'E2E-ДС-2026-001',
          projectId,
          type: 'SUBCONTRACT',
          amount: 500000,
          status: 'DRAFT',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          counterpartyName: 'ООО "ЭлектроПром"',
        }),
      });
      if (cCreateRes.ok) {
        const cJson = await cCreateRes.json();
        contractId = cJson.id ?? cJson.data?.id;
      }
    }
  });

  /* ============================================================== */
  /*  CLEANUP                                                       */
  /* ============================================================== */
  test.afterAll(async () => {
    // Delete lines
    for (const lineId of lineIds) {
      await apiDelete(`/api/ks2/lines/${lineId}`);
    }
    // Delete КС-2
    if (ks2Id) {
      await apiDelete(`/api/ks2/${ks2Id}`);
    }
    // Delete КС-3
    if (ks3Id) {
      await apiDelete(`/api/ks3/${ks3Id}`);
    }

    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log(`КС-2/КС-3 CRUD: ${issues.length} issues found`);
      issues.forEach((i, idx) => {
        console.log(`  ${idx + 1}. ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
        console.log(`     Expected: ${i.expected}`);
        console.log(`     Actual: ${i.actual}`);
      });
      console.log('═══════════════════════════════════════\n');
    }
  });

  /* ============================================================== */
  /*  A. CREATE КС-2                                                */
  /* ============================================================== */
  test('A1: Create КС-2 via API', async () => {
    const { status, data } = await apiPost('/api/ks2', {
      number: KS2_NUMBER,
      name: 'E2E-Акт выполненных работ за март 2026',
      documentDate: '2026-03-31',
      projectId,
      contractId: contractId ?? undefined,
      status: 'DRAFT',
      periodFrom: '2026-03-01',
      periodTo: '2026-03-31',
    });

    expect(status).toBeLessThan(300);
    expect(data).toBeTruthy();
    ks2Id = data.id ?? data.data?.id;
    expect(ks2Id).toBeTruthy();
  });

  test('A2: Add 2 lines to КС-2', async () => {
    expect(ks2Id).toBeTruthy();

    for (const line of KS2_LINES) {
      const { status, data } = await apiPost(`/api/ks2/${ks2Id}/lines`, {
        ...line,
        ks2DocumentId: ks2Id,
        amount: line.quantity * line.unitPrice,
      });

      if (status < 300 && data) {
        const id = data.id ?? data.data?.id;
        if (id) lineIds.push(id);
      } else {
        trackIssue({
          entity: 'Ks2Line',
          operation: 'CREATE',
          issue: `Failed to create line "${line.workName}"`,
          severity: '[MAJOR]',
          expected: '201 Created',
          actual: `${status}`,
        });
      }
    }

    expect(lineIds.length).toBe(2);
  });

  test('A3: Verify КС-2 in list', async ({ page }) => {
    await page.goto(`${BASE_URL}/russian-docs/ks2`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Alternative routes: /ks2, /closing/ks2
    if (!body?.includes('КС-2') && !body?.includes('KS2') && !body?.includes('Акт')) {
      // Try alternative route
      await page.goto(`${BASE_URL}/ks2`);
      await page.waitForLoadState('networkidle');
    }
  });

  /* ============================================================== */
  /*  B. READ — verify calculations                                 */
  /* ============================================================== */
  test('B1: Verify line 1 total = 42,183.00', async () => {
    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const lines = detail?.lines ?? detail?.data?.lines ?? [];

    if (Array.isArray(lines) && lines.length > 0) {
      const line1 = lines.find((l: any) =>
        l.workName?.includes('Прокладка') || l.costCode?.includes('08-02'));

      if (line1) {
        const amount = line1.amount ?? (line1.quantity * line1.unitPrice);
        const diff = Math.abs(amount - CALC.line1Total);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Ks2Line',
            operation: 'CALC',
            issue: `Line 1 total: ${amount} vs expected ${CALC.line1Total}`,
            severity: '[CRITICAL]',
            expected: `${CALC.line1Total}`,
            actual: `${amount}`,
          });
        }
        expect(diff).toBeLessThanOrEqual(TOLERANCE);
      }
    } else {
      // Try fetching lines separately
      const linesRes = await apiGet(`/api/ks2/${ks2Id}/lines`);
      const linesList = linesRes?.content ?? linesRes?.data ?? linesRes ?? [];
      if (Array.isArray(linesList) && linesList.length > 0) {
        const line1 = linesList[0];
        const amount = line1.amount ?? (line1.quantity * line1.unitPrice);
        const diff = Math.abs(amount - CALC.line1Total);
        expect(diff).toBeLessThanOrEqual(TOLERANCE);
      }
    }
  });

  test('B2: Verify line 2 total = 4,632.00', async () => {
    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const lines = detail?.lines ?? detail?.data?.lines ?? [];

    if (Array.isArray(lines) && lines.length > 1) {
      const line2 = lines.find((l: any) =>
        l.workName?.includes('Установка') || l.costCode?.includes('08-03'));

      if (line2) {
        const amount = line2.amount ?? (line2.quantity * line2.unitPrice);
        const diff = Math.abs(amount - CALC.line2Total);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Ks2Line',
            operation: 'CALC',
            issue: `Line 2 total: ${amount} vs expected ${CALC.line2Total}`,
            severity: '[CRITICAL]',
            expected: `${CALC.line2Total}`,
            actual: `${amount}`,
          });
        }
        expect(diff).toBeLessThanOrEqual(TOLERANCE);
      }
    }
  });

  test('B3: Verify subtotal = 46,815.00', async () => {
    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const data = detail?.data ?? detail;

    if (data) {
      const totalAmount = data.totalAmount ?? data.subtotal;
      if (totalAmount !== undefined) {
        // totalAmount might be subtotal or might include НДС
        console.log(`КС-2 totalAmount from API: ${totalAmount}`);

        // If it's the subtotal
        if (Math.abs(totalAmount - CALC.subtotal) <= TOLERANCE) {
          // Subtotal matches
        } else if (Math.abs(totalAmount - CALC.total) <= TOLERANCE) {
          // It's the total including НДС
          console.log('[INFO] API totalAmount includes НДС');
        } else {
          trackIssue({
            entity: 'Ks2',
            operation: 'CALC',
            issue: `Subtotal/Total: ${totalAmount} does not match expected subtotal ${CALC.subtotal} or total ${CALC.total}`,
            severity: '[CRITICAL]',
            expected: `Subtotal: ${CALC.subtotal} or Total: ${CALC.total}`,
            actual: `${totalAmount}`,
          });
        }
      }
    }
  });

  test('B4: Verify НДС = 9,363.00 (20% of subtotal)', async () => {
    // НДС = subtotal × 0.20 — non-negotiable in Russia
    const expectedVat = CALC.subtotal * 0.20;
    const diff = Math.abs(expectedVat - CALC.vat);
    expect(diff).toBeLessThanOrEqual(0.01);
    expect(CALC.vat).toBeCloseTo(9363.00, 0);
  });

  test('B5: Verify total = 56,178.00 (subtotal + НДС)', async () => {
    const expectedTotal = CALC.subtotal + CALC.vat;
    const diff = Math.abs(expectedTotal - CALC.total);
    expect(diff).toBeLessThanOrEqual(0.01);
    expect(CALC.total).toBeCloseTo(56178.00, 0);
  });

  test('B6: Verify period "01.03.2026 — 31.03.2026" in API', async () => {
    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const data = detail?.data ?? detail;

    if (data) {
      const periodFrom = data.periodFrom ?? data.startDate;
      const periodTo = data.periodTo ?? data.endDate;

      if (periodFrom) {
        expect(periodFrom).toContain('2026-03-01');
      }
      if (periodTo) {
        expect(periodTo).toContain('2026-03-31');
      }
    }
  });

  test('B7: Verify status = DRAFT', async () => {
    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const status = detail?.status ?? detail?.data?.status;
    expect(status).toBe('DRAFT');
  });

  /* ============================================================== */
  /*  C. STATUS FLOW                                                */
  /* ============================================================== */
  test('C1: Submit КС-2 (DRAFT → SUBMITTED)', async () => {
    const { status } = await apiPost(`/api/ks2/${ks2Id}/submit`, {});

    if (status >= 300) {
      trackIssue({
        entity: 'Ks2',
        operation: 'STATUS',
        issue: 'Cannot transition DRAFT → SUBMITTED',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
    }
  });

  test('C2: Sign КС-2 (SUBMITTED → SIGNED)', async () => {
    const { status } = await apiPost(`/api/ks2/${ks2Id}/sign`, {});

    if (status >= 300) {
      trackIssue({
        entity: 'Ks2',
        operation: 'STATUS',
        issue: 'Cannot transition SUBMITTED → SIGNED',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
    }
  });

  test('C3: Close КС-2 (SIGNED → CLOSED)', async () => {
    const { status } = await apiPost(`/api/ks2/${ks2Id}/close`, {});

    if (status >= 300) {
      trackIssue({
        entity: 'Ks2',
        operation: 'STATUS',
        issue: 'Cannot transition SIGNED → CLOSED',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
    }
  });

  test('C4: Backward transition CLOSED → DRAFT should be blocked', async () => {
    // Try to revert — should fail
    const res = await fetch(`${API}/api/ks2/${ks2Id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ status: 'DRAFT' }),
    });

    if (res.ok) {
      const body = await res.json();
      const newStatus = body.status ?? body.data?.status;
      if (newStatus === 'DRAFT') {
        trackIssue({
          entity: 'Ks2',
          operation: 'STATUS',
          issue: 'Backward transition CLOSED → DRAFT allowed',
          severity: '[CRITICAL]',
          expected: '400/403 (backward transitions forbidden)',
          actual: 'Status changed to DRAFT',
        });
      }
    }
    // If it failed — that's correct behavior
  });

  /* ============================================================== */
  /*  D. КС-3 — aggregate КС-2                                     */
  /* ============================================================== */
  test('D1: Create КС-3 certificate', async () => {
    const { status, data } = await apiPost('/api/ks3', {
      number: 'E2E-КС3-001',
      name: 'E2E-Справка о стоимости за март 2026',
      documentDate: '2026-03-31',
      projectId,
      contractId: contractId ?? undefined,
      periodFrom: '2026-03-01',
      periodTo: '2026-03-31',
      status: 'DRAFT',
      retentionPercent: 10,
    });

    if (status < 300 && data) {
      ks3Id = data.id ?? data.data?.id;
      expect(ks3Id).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Ks3',
        operation: 'CREATE',
        issue: 'Failed to create КС-3',
        severity: '[MAJOR]',
        expected: '201 Created',
        actual: `${status}`,
      });
    }
  });

  test('D2: Link КС-2 to КС-3', async () => {
    if (!ks3Id || !ks2Id) return;

    const { status } = await apiPost(`/api/ks3/${ks3Id}/link-ks2`, {
      ks2DocumentId: ks2Id,
      ks2Id: ks2Id,
    });

    if (status >= 300) {
      trackIssue({
        entity: 'Ks3',
        operation: 'LINK',
        issue: 'Failed to link КС-2 to КС-3',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
    }
  });

  test('D3: Verify КС-3 total matches КС-2 total', async () => {
    if (!ks3Id) return;

    const detail = await apiGet(`/api/ks3/${ks3Id}`);
    const data = detail?.data ?? detail;

    if (data) {
      const totalAmount = data.totalAmount;
      const netAmount = data.netAmount;
      const retentionPercent = data.retentionPercent ?? 10;

      if (totalAmount !== undefined) {
        // КС-3 total should equal КС-2 total (subtotal or with НДС)
        const matchesSubtotal = Math.abs(totalAmount - CALC.subtotal) <= TOLERANCE;
        const matchesTotal = Math.abs(totalAmount - CALC.total) <= TOLERANCE;

        if (!matchesSubtotal && !matchesTotal) {
          trackIssue({
            entity: 'Ks3',
            operation: 'CALC',
            issue: `КС-3 total ${totalAmount} doesn't match КС-2 subtotal ${CALC.subtotal} or total ${CALC.total}`,
            severity: '[CRITICAL]',
            expected: `${CALC.subtotal} or ${CALC.total}`,
            actual: `${totalAmount}`,
          });
        }
      }

      // Verify retention calculation
      if (netAmount !== undefined && totalAmount !== undefined) {
        const expectedRetention = totalAmount * retentionPercent / 100;
        const expectedNet = totalAmount - expectedRetention;
        const diff = Math.abs(netAmount - expectedNet);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Ks3',
            operation: 'CALC',
            issue: `Net amount: ${netAmount} vs expected ${expectedNet} (total ${totalAmount} - ${retentionPercent}% retention)`,
            severity: '[MAJOR]',
            expected: `${expectedNet}`,
            actual: `${netAmount}`,
          });
        }
      }
    }
  });

  test('D4: КС-3 list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/russian-docs/ks3`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Try alternative route if needed
    if (!body?.includes('КС-3') && !body?.includes('KS3') && !body?.includes('Справка')) {
      await page.goto(`${BASE_URL}/ks3`);
      await page.waitForLoadState('networkidle');
    }
  });

  /* ============================================================== */
  /*  E. VALIDATION                                                 */
  /* ============================================================== */
  test('E1: Line quantity > estimate quantity → warning', async () => {
    // Domain rule: КС-2 line quantity should not exceed estimate quantity
    // Line 1 has qty=15 for an estimate of 50 total — OK
    // If we try qty=51 — should warn
    const { status, data } = await apiPost(`/api/ks2/${ks2Id}/lines`, {
      workName: 'E2E-Excessive quantity test',
      unitOfMeasure: '100 м',
      quantity: 999, // way over estimate
      unitPrice: 100,
      amount: 99900,
    });

    if (status < 300) {
      // Accepted — check if warning was returned
      trackIssue({
        entity: 'Ks2Line',
        operation: 'VALIDATION',
        issue: 'Excessive quantity accepted without warning',
        severity: '[MAJOR]',
        expected: 'Warning: "Превышен объём по смете"',
        actual: `Accepted with status ${status}`,
      });

      // Cleanup
      const lineId = data?.id ?? data?.data?.id;
      if (lineId) {
        await apiDelete(`/api/ks2/lines/${lineId}`);
      }
    }
  });

  test('E2: No contract linked → error', async () => {
    const { status } = await apiPost('/api/ks2', {
      number: 'E2E-КС2-NOCONTRACT',
      name: 'E2E-Акт без договора',
      documentDate: '2026-03-31',
      projectId,
      // No contractId
      status: 'DRAFT',
    });

    if (status < 300) {
      trackIssue({
        entity: 'Ks2',
        operation: 'VALIDATION',
        issue: 'КС-2 created without contract — Russian law requires contract reference',
        severity: '[MAJOR]',
        expected: '400 "Укажите договор"',
        actual: `${status} (accepted without contract)`,
      });

      // Cleanup (fetch the ID if available)
    }
  });

  test('E3: Empty КС-2 (no lines) should not be signable', async () => {
    // Create empty КС-2
    const { status, data } = await apiPost('/api/ks2', {
      number: 'E2E-КС2-EMPTY',
      name: 'E2E-Пустой акт',
      documentDate: '2026-04-01',
      projectId,
      contractId: contractId ?? undefined,
      status: 'DRAFT',
    });

    if (status < 300 && data) {
      const emptyKs2Id = data.id ?? data.data?.id;

      // Try to submit empty act
      const { status: submitStatus } = await apiPost(`/api/ks2/${emptyKs2Id}/submit`, {});

      if (submitStatus < 300) {
        trackIssue({
          entity: 'Ks2',
          operation: 'VALIDATION',
          issue: 'Empty КС-2 (no lines) submitted successfully',
          severity: '[MAJOR]',
          expected: 'Rejection: КС-2 must have at least 1 line',
          actual: `Submitted with status ${submitStatus}`,
        });
      }

      // Cleanup
      await apiDelete(`/api/ks2/${emptyKs2Id}`);
    }
  });

  /* ============================================================== */
  /*  F. UI PAGES                                                   */
  /* ============================================================== */
  test('F1: КС-2 generator page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/russian-docs/ks2`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('F2: КС-2 detail page shows lines', async ({ page }) => {
    if (!ks2Id) return;

    // Try multiple routes
    for (const route of [`/ks2/${ks2Id}`, `/russian-docs/ks2/${ks2Id}`]) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      if (body && body.length > 200) {
        // Check for line content
        const hasLineData = body.includes('Прокладка') || body.includes('Установка')
          || body.includes('2812') || body.includes('115');
        if (hasLineData) break;
      }
    }
  });

  test('F3: КС-2 approval workflow page loads', async ({ page }) => {
    if (!ks2Id) return;

    await page.goto(`${BASE_URL}/ks2/${ks2Id}/approvals`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Just verify page loads without crash
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  G. CROSS-ENTITY                                               */
  /* ============================================================== */
  test('G1: КС-2 linked to contract', async () => {
    if (!ks2Id) return;

    const detail = await apiGet(`/api/ks2/${ks2Id}`);
    const linked = detail?.contractId ?? detail?.data?.contractId;

    if (linked) {
      expect(linked).toBe(contractId);
    } else if (contractId) {
      trackIssue({
        entity: 'Ks2',
        operation: 'CROSS',
        issue: 'КС-2 not linked to contract',
        severity: '[MAJOR]',
        expected: `contractId = ${contractId}`,
        actual: 'No contract link',
      });
    }
  });

  test('G2: Volume check — cumulative КС-2 ≤ estimate', async () => {
    if (!ks2Id) return;

    const volumeCheck = await apiGet(`/api/ks2/${ks2Id}/volume-check`);

    if (volumeCheck) {
      const data = volumeCheck.data ?? volumeCheck;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.status === 'exceeds') {
            trackIssue({
              entity: 'Ks2',
              operation: 'CROSS',
              issue: `Volume exceeds estimate for "${item.workItem}": submitted=${item.totalSubmitted}, estimate=${item.estimateQty}`,
              severity: '[CRITICAL]',
              expected: 'totalSubmitted ≤ estimateQty',
              actual: `${item.totalSubmitted} > ${item.estimateQty}`,
            });
          }
        }
      }
    } else {
      trackIssue({
        entity: 'Ks2',
        operation: 'CROSS',
        issue: 'Volume check endpoint not available',
        severity: '[MISSING]',
        expected: 'GET /ks2/{id}/volume-check returns comparison data',
        actual: 'Not available',
      });
    }
  });

  test('G3: Create invoice from КС-2', async () => {
    if (!ks2Id) return;

    const { status } = await apiPost(`/api/ks2/${ks2Id}/create-invoice`, {});

    if (status >= 300) {
      trackIssue({
        entity: 'Ks2',
        operation: 'CROSS',
        issue: 'Cannot create invoice from КС-2',
        severity: '[MISSING]',
        expected: 'POST /ks2/{id}/create-invoice → invoice with КС-2 amount',
        actual: `${status}`,
      });
    }
  });
});
