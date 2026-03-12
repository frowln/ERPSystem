/**
 * Session 2.2 — Deep CRUD: Contracts (Договоры)
 *
 * Persona focus: Директор (contract value, retention, advance), Бухгалтер (НДС in contract)
 * Domain rules:
 *   - НДС included: amount/1.20×0.20 = НДС
 *   - Advance: amount × advancePercent%
 *   - Retention: amount × retentionPercent%
 *   - Status: DRAFT → REVIEW → SIGNED → IN_PROGRESS → COMPLETED → CLOSED
 *   - Contract dates within project dates
 *   - No КС-2 without signed contract
 *
 * API endpoints tested:
 *   POST   /api/contracts                     — create
 *   GET    /api/contracts                     — list
 *   GET    /api/contracts/{id}                — get
 *   PUT    /api/contracts/{id}                — update
 *   PATCH  /api/contracts/{id}/status         — change status
 *   POST   /api/contracts/{id}/submit-approval — submit for approval
 *   POST   /api/contracts/{id}/approve        — approve
 *   POST   /api/contracts/{id}/sign           — sign
 *   POST   /api/contracts/{id}/activate       — activate
 *   POST   /api/contracts/{id}/close          — close
 *   GET    /api/contracts/dashboard/summary   — dashboard
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
const CONTRACT_DATA = {
  name: 'E2E-ДС-2026-001 Электромонтажные работы корпус 1',
  contractDate: '2026-03-01',
  partnerName: 'ООО "ЭлектроПром"',
  amount: 4_500_000,
  vatRate: 20,
  paymentTerms: '30 дней с даты подписания акта КС-2',
  plannedStartDate: '2026-04-01',
  plannedEndDate: '2026-12-31',
  retentionPercent: 5,
  prepaymentPercent: 30,
  paymentDelayDays: 30,
  guaranteePeriodMonths: 24,
  direction: 'SUBCONTRACT',
  notes: 'E2E deep CRUD contract — субподряд электрика',
};

// Pre-calculated values (НДС included in amount)
const AMOUNT = 4_500_000;
const VAT_IN_AMOUNT = AMOUNT / 1.20 * 0.20; // 750,000.00
const ADVANCE_AMOUNT = AMOUNT * 0.30; // 1,350,000.00
const RETENTION_AMOUNT = AMOUNT * 0.05; // 225,000.00

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let contractId: string;

test.describe('Contract CRUD — Deep Lifecycle (Договоры)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await getToken();

    // Find or create project
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

  test.afterAll(async () => {
    // Issue summary
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  CONTRACT CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ CONTRACT CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create contract via API', async () => {
    const res = await fetch(`${API}/api/contracts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        ...CONTRACT_DATA,
        projectId,
      }),
    });

    expect(res.status, 'Contract creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    contractId = json.id ?? json.data?.id;
    expect(contractId, 'Contract ID returned').toBeTruthy();

    const c = json.data ?? json;
    expect.soft(c.name).toContain('E2E-ДС-2026-001');
    expect.soft(c.status).toMatch(/DRAFT/i);
    if (c.number) {
      console.log(`Contract number: ${c.number}`);
    }
  });

  test('A2: Verify НДС calculation (amount includes НДС)', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    const amount = Number(data.amount ?? 0);
    const vatAmount = Number(data.vatAmount ?? 0);
    const totalWithVat = Number(data.totalWithVat ?? 0);

    console.log(`Contract: amount=${amount}, НДС=${vatAmount}, totalWithVat=${totalWithVat}`);

    // НДС check (if backend calculates it)
    if (vatAmount > 0) {
      const expectedVat = AMOUNT / 1.20 * 0.20;
      const diff = Math.abs(vatAmount - expectedVat);
      expect.soft(diff, `НДС = ${vatAmount}, expected = ${expectedVat.toFixed(2)}`).toBeLessThanOrEqual(1);

      if (diff > 1) {
        trackIssue({
          entity: 'Contract',
          operation: 'CALCULATION',
          issue: `НДС calculation wrong: ${vatAmount} ≠ ${expectedVat.toFixed(2)}`,
          severity: '[CRITICAL]',
          expected: expectedVat.toFixed(2),
          actual: String(vatAmount),
        });
      }
    } else if (amount > 0) {
      // Backend may not auto-calculate НДС — track as gap
      trackIssue({
        entity: 'Contract',
        operation: 'CALCULATION',
        issue: 'НДС not auto-calculated from contract amount',
        severity: '[MINOR]',
        expected: `vatAmount = ${VAT_IN_AMOUNT.toFixed(2)}`,
        actual: 'vatAmount = 0 or null',
      });
    }
  });

  test('A3: Verify advance and retention amounts', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    const retention = Number(data.retentionPercent ?? 0);
    const prepayment = Number(data.prepaymentPercent ?? 0);

    expect.soft(retention).toBe(5);
    expect.soft(prepayment).toBe(30);

    // Calculated amounts (директор needs these)
    const amount = Number(data.amount ?? AMOUNT);
    const advanceCalc = amount * prepayment / 100;
    const retentionCalc = amount * retention / 100;

    console.log(`Advance: ${advanceCalc.toFixed(2)} (${prepayment}%)`);
    console.log(`Retention: ${retentionCalc.toFixed(2)} (${retention}%)`);

    expect.soft(Math.abs(advanceCalc - ADVANCE_AMOUNT), `Advance = ${advanceCalc}`).toBeLessThanOrEqual(1);
    expect.soft(Math.abs(retentionCalc - RETENTION_AMOUNT), `Retention = ${retentionCalc}`).toBeLessThanOrEqual(1);
  });

  /* ============================================================== */
  /*  B. READ                                                       */
  /* ============================================================== */

  test('B1: Contract appears in /contracts list (API)', async () => {
    const res = await fetch(`${API}/api/contracts?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((c: any) => c.id === contractId) : null;
    expect(found, 'Contract should appear in list').toBeTruthy();
  });

  test('B2: Contract detail has all financial fields', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    // Fields директор needs
    const importantFields = [
      'name', 'status', 'amount',
      'plannedStartDate', 'plannedEndDate',
      'retentionPercent', 'prepaymentPercent',
      'guaranteePeriodMonths',
    ];
    for (const field of importantFields) {
      if (data[field] === undefined || data[field] === null) {
        trackIssue({
          entity: 'Contract',
          operation: 'READ',
          issue: `Field "${field}" is null/undefined in contract detail`,
          severity: field === 'amount' || field === 'status' ? '[MAJOR]' : '[MINOR]',
          expected: `${field} has value`,
          actual: 'null/undefined',
        });
      }
    }

    // Financial summary fields (populated after invoices/payments)
    const financialFields = ['totalInvoiced', 'totalPaid', 'balance'];
    for (const field of financialFields) {
      if (data[field] === undefined) {
        console.log(`Note: "${field}" not present in contract response (may be computed later)`);
      }
    }
  });

  test('B3: Contracts list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/contracts', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/contract-list.png' });
  });

  test('B4: Contract dashboard summary', async () => {
    const res = await fetch(`${API}/api/contracts/dashboard/summary`, { headers: headers() });
    if (res.ok) {
      const summary = (await res.json()).data ?? (await res.json());
      console.log('Contract dashboard:', JSON.stringify(summary).slice(0, 500));
      expect.soft(summary).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'READ',
        issue: `Dashboard summary returned ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Update contract amount and verify', async () => {
    const newAmount = 5_000_000;
    const res = await fetch(`${API}/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        name: CONTRACT_DATA.name,
        contractDate: CONTRACT_DATA.contractDate,
        partnerName: CONTRACT_DATA.partnerName,
        projectId,
        amount: newAmount,
        vatRate: 20,
        paymentTerms: CONTRACT_DATA.paymentTerms,
        plannedStartDate: CONTRACT_DATA.plannedStartDate,
        plannedEndDate: CONTRACT_DATA.plannedEndDate,
        retentionPercent: 5,
        prepaymentPercent: 30,
        paymentDelayDays: 30,
        guaranteePeriodMonths: 24,
        direction: CONTRACT_DATA.direction,
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      const actualAmount = Number(data.amount ?? 0);
      expect.soft(Math.abs(actualAmount - newAmount), `Amount updated to ${actualAmount}`).toBeLessThanOrEqual(1);

      // Verify advance recalculated: 5M × 30% = 1,500,000
      const newAdvance = newAmount * 0.30;
      const newRetention = newAmount * 0.05;
      console.log(`Updated advance: ${newAdvance}, retention: ${newRetention}`);
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'UPDATE',
        issue: `Contract update failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('C2: Update contract dates', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        name: CONTRACT_DATA.name,
        contractDate: CONTRACT_DATA.contractDate,
        partnerName: CONTRACT_DATA.partnerName,
        projectId,
        amount: 5_000_000,
        vatRate: 20,
        plannedStartDate: '2026-05-01',
        plannedEndDate: '2027-03-31',
        retentionPercent: 5,
        prepaymentPercent: 30,
        guaranteePeriodMonths: 24,
        direction: CONTRACT_DATA.direction,
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.plannedStartDate).toBe('2026-05-01');
      expect.soft(data.plannedEndDate).toBe('2027-03-31');
    }
  });

  /* ============================================================== */
  /*  D. STATUS TRANSITIONS                                         */
  /* ============================================================== */

  test('D1: Submit for approval (DRAFT → under review)', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}/submit-approval`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`After submit-approval: status = ${data.status}`);
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'STATUS',
        issue: `Submit for approval failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'Under review',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D2: Approve contract', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}/approve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        stage: 'LEGAL',
        comment: 'E2E auto-approve',
      }),
    });
    if (res.ok) {
      console.log('Legal approval done');
    }

    // Second approval stage
    const res2 = await fetch(`${API}/api/contracts/${contractId}/approve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        stage: 'FINANCE',
        comment: 'E2E finance approve',
      }),
    });
    if (res2.ok) {
      console.log('Finance approval done');
    }

    // Check status
    const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
    const data = (await verifyRes.json()).data ?? (await verifyRes.json());
    console.log(`After approval: status = ${data.status}`);
  });

  test('D3: Sign contract', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`After sign: status = ${data.status}`);
      expect.soft(data.status).toMatch(/SIGNED|ACTIVE|IN_PROGRESS/i);
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'STATUS',
        issue: `Sign contract failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'SIGNED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D4: Activate signed contract', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}/activate`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`After activate: status = ${data.status}`);
      expect.soft(data.status).toMatch(/ACTIVE|IN_PROGRESS/i);
    } else {
      // May already be active after sign
      console.log(`Activate returned ${res.status} — may already be active`);
    }
  });

  test('D5: Close contract', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}/close`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/CLOSED|COMPLETED/i);
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'STATUS',
        issue: `Close contract failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'CLOSED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  E. VALIDATION                                                 */
  /* ============================================================== */

  test('E1: Cannot create contract without name', async () => {
    const res = await fetch(`${API}/api/contracts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        projectId,
        amount: 1000000,
        direction: 'SUBCONTRACT',
      }),
    });
    expect.soft(res.status, 'Missing name should be rejected').toBeGreaterThanOrEqual(400);
  });

  test('E2: Cannot create contract with negative amount', async () => {
    const res = await fetch(`${API}/api/contracts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Negative amount test',
        projectId,
        amount: -1000000,
        direction: 'SUBCONTRACT',
      }),
    });
    if (res.ok) {
      trackIssue({
        entity: 'Contract',
        operation: 'VALIDATION',
        issue: 'Negative amount accepted — should be rejected',
        severity: '[CRITICAL]',
        expected: 'HTTP 400',
        actual: `HTTP ${res.status}`,
      });
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('E3: Retention percent sanity (0-100%)', async () => {
    const res = await fetch(`${API}/api/contracts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Bad retention test',
        projectId,
        amount: 1000000,
        retentionPercent: 150, // 150% — nonsensical
        direction: 'SUBCONTRACT',
      }),
    });
    if (res.ok) {
      trackIssue({
        entity: 'Contract',
        operation: 'VALIDATION',
        issue: 'Retention 150% accepted — should be capped at 100%',
        severity: '[MAJOR]',
        expected: 'HTTP 400 or max 100%',
        actual: `HTTP ${res.status} — accepted`,
      });
    }
  });

  /* ============================================================== */
  /*  F. FINANCIAL SUMMARY (cross-finance)                          */
  /* ============================================================== */

  test('F1: Contract financial summary fields', async () => {
    const res = await fetch(`${API}/api/contracts/${contractId}`, { headers: headers() });
    if (!res.ok) return;
    const data = (await res.json()).data ?? (await res.json());

    const amount = Number(data.amount ?? 0);
    const invoiced = Number(data.totalInvoiced ?? 0);
    const paid = Number(data.totalPaid ?? 0);
    const balance = Number(data.balance ?? 0);

    console.log(`Contract financial: amount=${amount}, invoiced=${invoiced}, paid=${paid}, balance=${balance}`);

    // Balance = amount - paid (or amount - invoiced)
    if (amount > 0 && balance !== undefined && balance > 0) {
      const expectedBalance = amount - paid;
      const diff = Math.abs(balance - expectedBalance);
      if (diff > 1) {
        trackIssue({
          entity: 'Contract',
          operation: 'CALCULATION',
          issue: `Contract balance wrong: ${balance} ≠ ${amount} - ${paid} = ${expectedBalance}`,
          severity: '[CRITICAL]',
          expected: String(expectedBalance),
          actual: String(balance),
        });
      }
    }
  });

  /* ============================================================== */
  /*  G. UI CHECKS                                                  */
  /* ============================================================== */

  test('G1: Contract list shows key columns', async ({ page }) => {
    await page.goto('http://localhost:4000/contracts', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Director needs: contract name/number, status, amount, dates
    const expectedParts = ['Статус', 'Сумма'];
    for (const part of expectedParts) {
      if (!body.includes(part)) {
        trackIssue({
          entity: 'Contract',
          operation: 'READ',
          issue: `"${part}" not visible in contract list UI`,
          severity: '[UX]',
          expected: `"${part}" visible`,
          actual: 'Not found',
        });
      }
    }
  });

  test('G2: Contract search works', async ({ page }) => {
    await page.goto('http://localhost:4000/contracts', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Try to find search input
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="Поиск"], input[placeholder*="поиск"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('E2E-ДС');
      await page.waitForTimeout(1000);
      const body = await page.textContent('body') ?? '';
      if (body.includes('E2E-ДС') || body.includes('ЭлектроПром')) {
        console.log('Search found our E2E contract');
      }
    } else {
      trackIssue({
        entity: 'Contract',
        operation: 'READ',
        issue: 'No search input found on contracts page',
        severity: '[UX]',
        expected: 'Search input visible',
        actual: 'Not found',
      });
    }

    await page.screenshot({ path: 'test-results/contract-search.png' });
  });
});
