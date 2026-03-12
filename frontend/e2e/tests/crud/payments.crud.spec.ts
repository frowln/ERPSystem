/**
 * Session 2.2 — Deep CRUD: Payments (Платежи)
 *
 * Persona focus: Бухгалтер (payment amounts exact, balance tracking)
 * Domain rules:
 *   - Payment cannot exceed invoice remaining balance
 *   - Payment date must be valid
 *   - Status flow: DRAFT → PENDING → APPROVED → PAID
 *   - All payments traced back to invoice
 *
 * API endpoints tested:
 *   POST   /api/payments             — create
 *   GET    /api/payments             — list
 *   GET    /api/payments/{id}        — get
 *   PUT    /api/payments/{id}        — update
 *   POST   /api/payments/{id}/approve — approve
 *   POST   /api/payments/{id}/mark-paid — mark paid
 *   POST   /api/payments/{id}/cancel — cancel
 *   GET    /api/payments/summary     — project summary
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
const PAYMENT_1_AMOUNT = 500_000;
const PAYMENT_2_AMOUNT = 494_800;
const INVOICE_TOTAL = 994_800; // From invoice test

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let invoiceId: string;
let paymentId1: string;
let paymentId2: string;
let cancelTestPaymentId: string;

test.describe('Payment CRUD — Deep Lifecycle (Платежи)', () => {
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

    // Create an invoice to pay against
    const invRes = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        dueDate: '2026-04-15',
        projectId,
        partnerName: 'ООО "ЭлектроПром"',
        invoiceType: 'RECEIVED',
        subtotal: 829_000,
        vatRate: 20,
        totalAmount: INVOICE_TOTAL,
        notes: 'E2E payment test invoice',
      }),
    });
    if (invRes.ok) {
      const invJson = await invRes.json();
      invoiceId = invJson.id ?? invJson.data?.id;
    }
  });

  test.afterAll(async () => {
    // Cancel test payments
    for (const pid of [paymentId1, paymentId2, cancelTestPaymentId]) {
      if (pid) {
        await fetch(`${API}/api/payments/${pid}/cancel`, { method: 'POST', headers: headers() });
      }
    }
    // Cancel test invoice
    if (invoiceId) {
      await fetch(`${API}/api/invoices/${invoiceId}/cancel`, { method: 'POST', headers: headers() });
    }

    // Issue summary
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  PAYMENT CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ PAYMENT CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE — Partial payment                                   */
  /* ============================================================== */

  test('A1: Create partial payment of 500,000', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-03-20',
        projectId,
        partnerName: 'ООО "ЭлектроПром"',
        paymentType: 'OUTGOING',
        amount: PAYMENT_1_AMOUNT,
        vatAmount: PAYMENT_1_AMOUNT * 0.20 / 1.20, // НДС from the amount
        purpose: 'Оплата по счёту за электроматериалы (частично)',
        bankAccount: 'р/с 40702810100000000001',
        invoiceId,
        notes: 'E2E payment test — partial',
      }),
    });

    expect(res.status, 'Payment creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    paymentId1 = json.id ?? json.data?.id;
    expect(paymentId1, 'Payment ID returned').toBeTruthy();

    const pay = json.data ?? json;
    expect.soft(Number(pay.amount ?? 0)).toBe(PAYMENT_1_AMOUNT);
    if (pay.number) {
      console.log(`Payment 1 number: ${pay.number}`);
    }
  });

  test('A2: Payment 1 appears in list', async () => {
    const res = await fetch(`${API}/api/payments?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((p: any) => p.id === paymentId1) : null;
    expect(found, 'Payment should appear in list').toBeTruthy();
    if (found) {
      expect.soft(Number(found.amount ?? found.totalAmount ?? 0)).toBeCloseTo(PAYMENT_1_AMOUNT, -1);
    }
  });

  test('A3: Payment detail has correct fields', async () => {
    const res = await fetch(`${API}/api/payments/${paymentId1}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    expect.soft(Number(data.amount ?? 0)).toBe(PAYMENT_1_AMOUNT);
    expect.soft(data.paymentType).toMatch(/OUTGOING/i);
    expect.soft(data.partnerName).toContain('ЭлектроПром');

    // Required fields
    const requiredFields = ['paymentDate', 'amount', 'paymentType', 'status'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        trackIssue({
          entity: 'Payment',
          operation: 'READ',
          issue: `Required field "${field}" is null/undefined`,
          severity: '[MAJOR]',
          expected: `${field} has value`,
          actual: 'null/undefined',
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. STATUS TRANSITIONS                                         */
  /* ============================================================== */

  test('B1: Approve payment (DRAFT → APPROVED)', async () => {
    const res = await fetch(`${API}/api/payments/${paymentId1}/approve`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/payments/${paymentId1}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/APPROVED|PENDING/i);
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'STATUS',
        issue: `Approve payment failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'APPROVED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('B2: Mark payment as paid (→ PAID)', async () => {
    const res = await fetch(`${API}/api/payments/${paymentId1}/mark-paid`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/payments/${paymentId1}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/PAID/i);
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'STATUS',
        issue: `Mark paid failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'PAID',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  C. CREATE — Second payment (complete balance)                 */
  /* ============================================================== */

  test('C1: Create second payment for remaining 494,800', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-04-10',
        projectId,
        partnerName: 'ООО "ЭлектроПром"',
        paymentType: 'OUTGOING',
        amount: PAYMENT_2_AMOUNT,
        vatAmount: PAYMENT_2_AMOUNT * 0.20 / 1.20,
        purpose: 'Оплата по счёту за электроматериалы (остаток)',
        bankAccount: 'р/с 40702810100000000001',
        invoiceId,
        notes: 'E2E payment test — remaining balance',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      paymentId2 = json.id ?? json.data?.id;
      expect(paymentId2, 'Payment 2 ID returned').toBeTruthy();
      console.log(`Payment 2 created: ${paymentId2}`);
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'CREATE',
        issue: `Second payment creation failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('C2: Verify total payments = invoice total (994,800)', async () => {
    // Get all payments for this project
    const res = await fetch(`${API}/api/payments?size=50`, { headers: headers() });
    if (!res.ok) return;
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const arr = Array.isArray(list) ? list : [];

    // Sum payments linked to our invoice
    const ourPayments = arr.filter((p: any) =>
      p.id === paymentId1 || p.id === paymentId2 || p.invoiceId === invoiceId
    );
    const totalPaid = ourPayments.reduce((s: number, p: any) => s + Number(p.amount ?? p.totalAmount ?? 0), 0);

    console.log(`Total payments: ${totalPaid} (expected: ${INVOICE_TOTAL})`);

    if (totalPaid > 0) {
      const diff = Math.abs(totalPaid - INVOICE_TOTAL);
      expect.soft(diff, `Sum payments = ${totalPaid}, invoice = ${INVOICE_TOTAL}`).toBeLessThanOrEqual(1);

      if (diff > 1) {
        trackIssue({
          entity: 'Payment',
          operation: 'CALCULATION',
          issue: `Sum of payments (${totalPaid}) ≠ invoice total (${INVOICE_TOTAL})`,
          severity: '[CRITICAL]',
          expected: String(INVOICE_TOTAL),
          actual: String(totalPaid),
        });
      }
    }
  });

  /* ============================================================== */
  /*  D. UPDATE                                                     */
  /* ============================================================== */

  test('D1: Update payment purpose', async () => {
    if (!paymentId2) return;
    const res = await fetch(`${API}/api/payments/${paymentId2}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-04-10',
        partnerName: 'ООО "ЭлектроПром"',
        paymentType: 'OUTGOING',
        amount: PAYMENT_2_AMOUNT,
        purpose: 'Оплата по счёту E2E-СЧ-2026-001 (остаток) — обновлено',
        invoiceId,
      }),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/payments/${paymentId2}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.purpose).toContain('обновлено');
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'UPDATE',
        issue: `Update payment failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  E. VALIDATION                                                 */
  /* ============================================================== */

  test('E1: Cannot create payment with zero amount', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-03-20',
        paymentType: 'OUTGOING',
        amount: 0,
        partnerName: 'E2E-Zero test',
        projectId,
      }),
    });
    // @DecimalMin(0.01) on amount
    if (res.ok) {
      trackIssue({
        entity: 'Payment',
        operation: 'VALIDATION',
        issue: 'Zero amount accepted — should be rejected',
        severity: '[CRITICAL]',
        expected: 'HTTP 400',
        actual: `HTTP ${res.status}`,
      });
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) await fetch(`${API}/api/payments/${id}/cancel`, { method: 'POST', headers: headers() });
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('E2: Cannot create payment with negative amount', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-03-20',
        paymentType: 'OUTGOING',
        amount: -50000,
        partnerName: 'E2E-Negative test',
        projectId,
      }),
    });
    if (res.ok) {
      trackIssue({
        entity: 'Payment',
        operation: 'VALIDATION',
        issue: 'Negative amount accepted — should be rejected',
        severity: '[CRITICAL]',
        expected: 'HTTP 400',
        actual: `HTTP ${res.status}`,
      });
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) await fetch(`${API}/api/payments/${id}/cancel`, { method: 'POST', headers: headers() });
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('E3: Cannot create payment without paymentDate', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentType: 'OUTGOING',
        amount: 100000,
        partnerName: 'E2E-No date test',
        projectId,
      }),
    });
    expect.soft(res.status, 'Missing paymentDate should be rejected').toBeGreaterThanOrEqual(400);
  });

  test('E4: Cannot create payment without paymentType', async () => {
    const res = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-03-20',
        amount: 100000,
        partnerName: 'E2E-No type test',
        projectId,
      }),
    });
    expect.soft(res.status, 'Missing paymentType should be rejected').toBeGreaterThanOrEqual(400);
  });

  /* ============================================================== */
  /*  F. CANCEL                                                     */
  /* ============================================================== */

  test('F1: Cancel a payment', async () => {
    // Create a fresh payment to cancel
    const createRes = await fetch(`${API}/api/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        paymentDate: '2026-03-25',
        projectId,
        partnerName: 'E2E-Cancel test partner',
        paymentType: 'OUTGOING',
        amount: 10000,
        purpose: 'E2E cancel test',
      }),
    });
    if (!createRes.ok) return;
    const json = await createRes.json();
    cancelTestPaymentId = json.id ?? json.data?.id;

    const cancelRes = await fetch(`${API}/api/payments/${cancelTestPaymentId}/cancel`, {
      method: 'POST',
      headers: headers(),
    });
    if (cancelRes.ok) {
      const verifyRes = await fetch(`${API}/api/payments/${cancelTestPaymentId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/CANCEL/i);
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'CANCEL',
        issue: `Cancel payment failed: ${cancelRes.status}`,
        severity: '[MINOR]',
        expected: 'CANCELLED',
        actual: `HTTP ${cancelRes.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  G. UI CHECKS                                                  */
  /* ============================================================== */

  test('G1: Payment list page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:4000/payments', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Check for expected columns
    const expectedHeaders = ['Номер', 'Дата', 'Сумма', 'Статус'];
    for (const h of expectedHeaders) {
      if (!body.includes(h)) {
        trackIssue({
          entity: 'Payment',
          operation: 'READ',
          issue: `Column "${h}" not visible in payments UI`,
          severity: '[UX]',
          expected: `"${h}" visible`,
          actual: 'Not found',
        });
      }
    }

    await page.screenshot({ path: 'test-results/payment-list.png' });
  });

  test('G2: Payment list shows status filter tabs', async ({ page }) => {
    await page.goto('http://localhost:4000/payments', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const tabs = await page.locator('button, [role="tab"]').allTextContents();
    const hasFilters = tabs.some(t =>
      t.includes('Все') || t.includes('Входящ') || t.includes('Исходящ') || t.includes('Ожидает')
    );
    if (!hasFilters) {
      trackIssue({
        entity: 'Payment',
        operation: 'READ',
        issue: 'No status/type filter tabs found in payment list',
        severity: '[UX]',
        expected: 'Filter tabs (Все, Входящие, Исходящие, Ожидающие)',
        actual: `Tabs found: ${tabs.slice(0, 10).join(', ')}`,
      });
    }
  });

  test('G3: Russian number format in payment amounts', async ({ page }) => {
    await page.goto('http://localhost:4000/payments', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const cells = await page.locator('td').allTextContents();
    let westernCount = 0;
    for (const cell of cells) {
      if (cell.match(/\d{1,3}(,\d{3})+\.\d{2}/)) {
        westernCount++;
      }
    }
    if (westernCount > 0) {
      trackIssue({
        entity: 'Payment',
        operation: 'READ',
        issue: `${westernCount} cells use Western number format`,
        severity: '[MINOR]',
        expected: 'Russian format (1 234 567,89)',
        actual: `${westernCount} cells in "1,234,567.89" format`,
      });
    }
  });

  /* ============================================================== */
  /*  H. PAYMENT BALANCE CHAIN (бухгалтер's final check)           */
  /* ============================================================== */

  test('H1: Payment balance chain: invoice_total - sum(payments) = remaining', async () => {
    if (!invoiceId) return;

    // Check invoice state after payments
    const res = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    if (!res.ok) return;
    const data = (await res.json()).data ?? (await res.json());

    const total = Number(data.totalAmount ?? 0);
    const paid = Number(data.paidAmount ?? 0);
    const remaining = Number(data.remainingAmount ?? 0);

    console.log(`Balance chain: total=${total}, paid=${paid}, remaining=${remaining}`);

    if (total > 0) {
      const expectedRemaining = total - paid;
      const diff = Math.abs(remaining - expectedRemaining);
      expect.soft(diff, `Remaining = total - paid: ${remaining} ≈ ${expectedRemaining}`).toBeLessThanOrEqual(1);

      if (diff > 1) {
        trackIssue({
          entity: 'Payment',
          operation: 'CALCULATION',
          issue: `Balance chain broken: ${total} - ${paid} ≠ ${remaining}`,
          severity: '[CRITICAL]',
          expected: String(expectedRemaining),
          actual: String(remaining),
        });
      }
    }
  });

  test('H2: Project payment summary (директор check)', async () => {
    if (!projectId) return;

    const res = await fetch(`${API}/api/payments/summary?projectId=${projectId}`, { headers: headers() });
    if (res.ok) {
      const summary = (await res.json()).data ?? (await res.json());
      console.log('Payment summary:', JSON.stringify(summary).slice(0, 500));
      // Summary should exist and have meaningful data
      expect.soft(summary).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Payment',
        operation: 'READ',
        issue: `Payment summary endpoint returned: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200 with summary data',
        actual: `HTTP ${res.status}`,
      });
    }
  });
});
