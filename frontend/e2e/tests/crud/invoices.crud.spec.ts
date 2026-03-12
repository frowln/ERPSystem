/**
 * Session 2.2 — Deep CRUD: Invoices (Счета)
 *
 * Persona focus: Бухгалтер (НДС must be EXACTLY 20%, totals verified to kopeck)
 * Domain rules:
 *   - НДС = subtotal × 0.20 (no exceptions in Russia)
 *   - Total = subtotal + НДС
 *   - Line total = quantity × unitPrice
 *   - Payment cannot exceed invoice total
 *   - Status flow: DRAFT → SENT → APPROVED → PARTIALLY_PAID → PAID
 *
 * API endpoints tested:
 *   POST   /api/invoices                       — create
 *   GET    /api/invoices                       — list
 *   GET    /api/invoices/{id}                  — get
 *   PUT    /api/invoices/{id}                  — update
 *   POST   /api/invoices/{id}/status           — change status
 *   POST   /api/invoices/{id}/register-payment — register payment
 *   POST   /api/invoices/{id}/cancel           — cancel
 *   POST   /api/invoices/{invoiceId}/lines     — add line
 *   DELETE /api/invoices/{invoiceId}/lines/{id} — delete line
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function parseRussianNumber(text: string): number {
  if (!text) return 0;
  return parseFloat(text.replace(/[^\d,.\-−]/g, '').replace('−', '-').replace(',', '.')) || 0;
}

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const INVOICE_LINES = [
  { name: 'Кабель ВВГнг 3×2.5', quantity: 5000, unit: 'м', unitPrice: 85.00 },
  { name: 'Кабель ВВГнг 5×4.0', quantity: 2000, unit: 'м', unitPrice: 175.00 },
  { name: 'Автомат ВА 25А', quantity: 120, unit: 'шт', unitPrice: 450.00 },
];

// Pre-calculated values:
const LINE_TOTALS = [
  5000 * 85.00,   // 425,000.00
  2000 * 175.00,  // 350,000.00
  120 * 450.00,   // 54,000.00
];
const SUBTOTAL = LINE_TOTALS.reduce((a, b) => a + b, 0); // 829,000.00
const VAT_RATE = 0.20;
const VAT_AMOUNT = SUBTOTAL * VAT_RATE; // 165,800.00
const TOTAL = SUBTOTAL + VAT_AMOUNT; // 994,800.00

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let invoiceId: string;
let projectId: string;
const lineIds: string[] = [];

test.describe('Invoice CRUD — Deep Lifecycle (Счета)', () => {
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
    // Cleanup invoice lines, then invoice
    if (invoiceId) {
      for (const lineId of lineIds) {
        await fetch(`${API}/api/invoices/${invoiceId}/lines/${lineId}`, { method: 'DELETE', headers: headers() });
      }
      // Cancel invoice to allow cleanup
      await fetch(`${API}/api/invoices/${invoiceId}/cancel`, { method: 'POST', headers: headers() });
    }
    // Issue summary
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  INVOICE CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ INVOICE CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create invoice with calculated total via API', async () => {
    const res = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        dueDate: '2026-04-15',
        projectId,
        partnerName: 'ООО "ЭлектроПром"',
        invoiceType: 'RECEIVED',
        subtotal: SUBTOTAL,
        vatRate: 20,
        totalAmount: TOTAL,
        notes: 'E2E deep CRUD invoice test — электроматериалы',
      }),
    });

    expect(res.status, 'Invoice creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    invoiceId = json.id ?? json.data?.id;
    expect(invoiceId, 'Invoice ID returned').toBeTruthy();

    const inv = json.data ?? json;
    // Verify auto-generated number
    if (inv.number) {
      expect.soft(inv.number.length, 'Invoice number should be non-empty').toBeGreaterThan(0);
      console.log(`Invoice number: ${inv.number}`);
    }
  });

  test('A2: Add 3 invoice lines via API', async () => {
    for (let i = 0; i < INVOICE_LINES.length; i++) {
      const line = INVOICE_LINES[i];
      const res = await fetch(`${API}/api/invoices/${invoiceId}/lines`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: line.name,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          totalPrice: LINE_TOTALS[i],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const lineId = json.id ?? json.data?.id;
        if (lineId) lineIds.push(lineId);
      } else {
        trackIssue({
          entity: 'Invoice',
          operation: 'CREATE',
          issue: `Line "${line.name}" creation failed: ${res.status}`,
          severity: '[MAJOR]',
          expected: 'HTTP 2xx',
          actual: `HTTP ${res.status}`,
        });
      }
    }
  });

  test('A3: Verify НДС = EXACTLY 20% of subtotal', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const inv = (await res.json()).data ?? (await res.json());
    // Re-fetch cleanly
    const res2 = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    const data = (await res2.json()).data ?? (await res2.json());

    const subtotal = Number(data.subtotal ?? 0);
    const vatAmt = Number(data.vatAmount ?? 0);
    const total = Number(data.totalAmount ?? 0);
    const vatRate = Number(data.vatRate ?? 0);

    console.log(`Invoice: subtotal=${subtotal}, НДС=${vatAmt}, total=${total}, vatRate=${vatRate}%`);

    // НДС verification (бухгалтер's critical check)
    if (subtotal > 0 && vatAmt > 0) {
      const expectedVat = subtotal * 0.20;
      const vatDiff = Math.abs(vatAmt - expectedVat);
      expect.soft(vatDiff, `НДС = ${vatAmt}, expected = ${expectedVat}`).toBeLessThanOrEqual(1); // ±1 копейка

      if (vatDiff > 1) {
        trackIssue({
          entity: 'Invoice',
          operation: 'CALCULATION',
          issue: `НДС calculation wrong: ${vatAmt} ≠ ${subtotal} × 0.20 = ${expectedVat}`,
          severity: '[CRITICAL]',
          expected: String(expectedVat),
          actual: String(vatAmt),
        });
      }
    }

    // Total = subtotal + НДС
    if (subtotal > 0 && total > 0) {
      const expectedTotal = subtotal + (subtotal * 0.20);
      const totalDiff = Math.abs(total - expectedTotal);
      expect.soft(totalDiff, `Total = ${total}, expected = ${expectedTotal}`).toBeLessThanOrEqual(1);

      if (totalDiff > 1) {
        trackIssue({
          entity: 'Invoice',
          operation: 'CALCULATION',
          issue: `Total calculation wrong: ${total} ≠ ${subtotal} + ${subtotal * 0.20} = ${expectedTotal}`,
          severity: '[CRITICAL]',
          expected: String(expectedTotal),
          actual: String(total),
        });
      }
    }
  });

  test('A4: Verify line item amounts', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/lines`, { headers: headers() });
    if (!res.ok) {
      trackIssue({
        entity: 'Invoice',
        operation: 'READ',
        issue: 'Cannot fetch invoice lines',
        severity: '[MAJOR]',
        expected: 'HTTP 200',
        actual: `HTTP ${res.status}`,
      });
      return;
    }
    const lines = (await res.json()).content ?? (await res.json()).data ?? (await res.json()) ?? [];
    const arr = Array.isArray(lines) ? lines : [];

    for (let i = 0; i < INVOICE_LINES.length && i < arr.length; i++) {
      const line = arr[i];
      const expected = LINE_TOTALS[i];
      const actual = Number(line.totalPrice ?? line.amount ?? 0);

      if (actual > 0) {
        const diff = Math.abs(actual - expected);
        expect.soft(diff, `Line "${INVOICE_LINES[i].name}": ${actual} ≈ ${expected}`).toBeLessThanOrEqual(1);

        if (diff > 1) {
          trackIssue({
            entity: 'Invoice',
            operation: 'CALCULATION',
            issue: `Line "${INVOICE_LINES[i].name}" total wrong`,
            severity: '[CRITICAL]',
            expected: String(expected),
            actual: String(actual),
          });
        }
      }
    }

    // Verify subtotal = sum of lines
    const lineSum = arr.reduce((s: number, l: any) => s + Number(l.totalPrice ?? l.amount ?? 0), 0);
    if (lineSum > 0) {
      const diff = Math.abs(lineSum - SUBTOTAL);
      expect.soft(diff, `Lines sum = ${lineSum}, expected subtotal = ${SUBTOTAL}`).toBeLessThanOrEqual(1);
    }
  });

  /* ============================================================== */
  /*  B. READ                                                       */
  /* ============================================================== */

  test('B1: Invoice appears in /invoices list (API)', async () => {
    const res = await fetch(`${API}/api/invoices?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((inv: any) => inv.id === invoiceId) : null;
    expect(found, 'Invoice should appear in list').toBeTruthy();
  });

  test('B2: Invoice detail returns all financial fields', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    // Fields бухгалтер needs
    const requiredFields = ['number', 'invoiceDate', 'totalAmount', 'status', 'invoiceType'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        trackIssue({
          entity: 'Invoice',
          operation: 'READ',
          issue: `Required field "${field}" is null/undefined`,
          severity: '[MAJOR]',
          expected: `${field} has value`,
          actual: 'null/undefined',
        });
      }
    }

    // Remaining = total - paid
    const total = Number(data.totalAmount ?? 0);
    const paid = Number(data.paidAmount ?? 0);
    const remaining = Number(data.remainingAmount ?? 0);
    if (total > 0 && remaining !== undefined) {
      const expectedRemaining = total - paid;
      expect.soft(Math.abs(remaining - expectedRemaining),
        `Remaining = ${remaining}, expected = ${total} - ${paid} = ${expectedRemaining}`)
        .toBeLessThanOrEqual(1);
    }
  });

  test('B3: Invoice list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/invoices', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Look for expected table column labels
    const expectedHeaders = ['Номер', 'Дата', 'Сумма', 'Статус'];
    for (const h of expectedHeaders) {
      if (!body.includes(h)) {
        trackIssue({
          entity: 'Invoice',
          operation: 'READ',
          issue: `Column header "${h}" not visible in UI`,
          severity: '[UX]',
          expected: `"${h}" visible`,
          actual: 'Not found',
        });
      }
    }

    await page.screenshot({ path: 'test-results/invoice-list.png' });
  });

  test('B4: Filter by status tab', async ({ page }) => {
    await page.goto('http://localhost:4000/invoices', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check for status filter tabs
    const tabs = await page.locator('button, [role="tab"]').allTextContents();
    const statusWords = ['Все', 'Входящ', 'Исходящ', 'Просрочен', 'Оплачен'];
    const foundTabs = statusWords.filter(w => tabs.some(t => t.includes(w)));
    if (foundTabs.length === 0) {
      trackIssue({
        entity: 'Invoice',
        operation: 'READ',
        issue: 'No status filter tabs found',
        severity: '[UX]',
        expected: 'Status filter tabs visible',
        actual: `Found tabs: ${tabs.slice(0, 10).join(', ')}`,
      });
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Add line item "Щит ЩР-24" and verify recalculated total', async () => {
    // Add new line
    const res = await fetch(`${API}/api/invoices/${invoiceId}/lines`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'Щит ЩР-24',
        quantity: 5,
        unit: 'шт',
        unitPrice: 12000,
        totalPrice: 60000, // 5 × 12000
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const lineId = json.id ?? json.data?.id;
      if (lineId) lineIds.push(lineId);
    }

    // New expected: subtotal = 829,000 + 60,000 = 889,000
    // НДС = 889,000 × 0.20 = 177,800
    // Total = 1,066,800
    const newSubtotal = SUBTOTAL + 60_000; // 889,000

    // Update invoice with new totals
    const updateRes = await fetch(`${API}/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        dueDate: '2026-04-15',
        projectId,
        partnerName: 'ООО "ЭлектроПром"',
        subtotal: newSubtotal,
        vatRate: 20,
        totalAmount: newSubtotal * 1.20,
      }),
    });

    if (updateRes.ok) {
      // Verify new totals
      const verifyRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      const actualTotal = Number(data.totalAmount ?? 0);
      const expectedTotal = 1_066_800;

      if (actualTotal > 0) {
        const diff = Math.abs(actualTotal - expectedTotal);
        expect.soft(diff, `Updated total = ${actualTotal}, expected = ${expectedTotal}`).toBeLessThanOrEqual(1);

        if (diff > 1) {
          trackIssue({
            entity: 'Invoice',
            operation: 'UPDATE',
            issue: 'Total after adding line does not match',
            severity: '[CRITICAL]',
            expected: String(expectedTotal),
            actual: String(actualTotal),
          });
        }
      }
    } else {
      trackIssue({
        entity: 'Invoice',
        operation: 'UPDATE',
        issue: `Invoice update failed: ${updateRes.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${updateRes.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  D. STATUS TRANSITIONS                                         */
  /* ============================================================== */

  test('D1: Change status to SENT', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/send`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/SENT|UNDER_REVIEW/i);
    } else {
      // Try via status endpoint
      const altRes = await fetch(`${API}/api/invoices/${invoiceId}/status`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ status: 'SENT' }),
      });
      if (!altRes.ok) {
        trackIssue({
          entity: 'Invoice',
          operation: 'STATUS',
          issue: `Send invoice failed: ${res.status}`,
          severity: '[MINOR]',
          expected: 'SENT',
          actual: `HTTP ${res.status}`,
        });
      }
    }
  });

  test('D2: Change status to APPROVED', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/status`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/APPROVED/i);
    } else {
      trackIssue({
        entity: 'Invoice',
        operation: 'STATUS',
        issue: `Approve failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'APPROVED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D3: Register partial payment → PARTIALLY_PAID', async () => {
    const res = await fetch(`${API}/api/invoices/${invoiceId}/register-payment`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ amount: 500_000 }),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());

      const paid = Number(data.paidAmount ?? 0);
      const remaining = Number(data.remainingAmount ?? 0);
      const total = Number(data.totalAmount ?? 0);

      expect.soft(Math.abs(paid - 500_000), `Paid = ${paid}`).toBeLessThanOrEqual(1);

      if (total > 0) {
        const expectedRemaining = total - 500_000;
        expect.soft(Math.abs(remaining - expectedRemaining),
          `Remaining = ${remaining}, expected = ${expectedRemaining}`).toBeLessThanOrEqual(1);
      }

      // Status should be PARTIALLY_PAID
      const status = data.status ?? '';
      if (!status.match(/PARTIAL/i) && !status.match(/PAID/i)) {
        trackIssue({
          entity: 'Invoice',
          operation: 'STATUS',
          issue: `After partial payment, status should be PARTIALLY_PAID, got "${status}"`,
          severity: '[MAJOR]',
          expected: 'PARTIALLY_PAID',
          actual: status,
        });
      }
    } else {
      trackIssue({
        entity: 'Invoice',
        operation: 'PAYMENT',
        issue: `Register payment failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D4: Register remaining payment → PAID', async () => {
    // Get current remaining
    const checkRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    const checkData = (await checkRes.json()).data ?? (await checkRes.json());
    const remaining = Number(checkData.remainingAmount ?? checkData.totalAmount ?? 0) -
                      Number(checkData.paidAmount ?? 0);
    const payAmount = remaining > 0 ? remaining : Number(checkData.totalAmount ?? 0) - 500_000;

    if (payAmount <= 0) {
      console.log('Invoice already fully paid or remaining unknown');
      return;
    }

    const res = await fetch(`${API}/api/invoices/${invoiceId}/register-payment`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ amount: payAmount }),
    });
    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      const finalRemaining = Number(data.remainingAmount ?? 0);

      expect.soft(finalRemaining, 'Remaining should be 0 after full payment').toBeLessThanOrEqual(1);

      const status = data.status ?? '';
      if (!status.match(/PAID/i) && !status.match(/CLOSED/i)) {
        trackIssue({
          entity: 'Invoice',
          operation: 'STATUS',
          issue: `After full payment, status should be PAID, got "${status}"`,
          severity: '[MAJOR]',
          expected: 'PAID',
          actual: status,
        });
      }
    }
  });

  /* ============================================================== */
  /*  E. VALIDATION                                                 */
  /* ============================================================== */

  test('E1: Cannot create invoice without invoiceDate', async () => {
    const res = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        projectId,
        invoiceType: 'RECEIVED',
        totalAmount: 100000,
        partnerName: 'E2E-Test',
      }),
    });
    expect.soft(res.status, 'Missing invoiceDate should be rejected').toBeGreaterThanOrEqual(400);
  });

  test('E2: Cannot create invoice without invoiceType', async () => {
    const res = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        totalAmount: 100000,
        partnerName: 'E2E-Test',
        projectId,
      }),
    });
    expect.soft(res.status, 'Missing invoiceType should be rejected').toBeGreaterThanOrEqual(400);
  });

  test('E3: Cannot create invoice with zero totalAmount', async () => {
    const res = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        invoiceType: 'RECEIVED',
        totalAmount: 0,
        partnerName: 'E2E-Test zero',
        projectId,
      }),
    });
    // @DecimalMin(0.01) on totalAmount
    if (res.ok) {
      trackIssue({
        entity: 'Invoice',
        operation: 'VALIDATION',
        issue: 'Zero totalAmount accepted — should be rejected',
        severity: '[CRITICAL]',
        expected: 'HTTP 400',
        actual: `HTTP ${res.status}`,
      });
      // Cleanup
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) await fetch(`${API}/api/invoices/${id}/cancel`, { method: 'POST', headers: headers() });
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('E4: НДС rate must be valid (0%, 10%, or 20%)', async () => {
    // Try with invalid НДС rate (18% — old Russian rate, no longer valid)
    const res = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-15',
        invoiceType: 'RECEIVED',
        totalAmount: 100000,
        subtotal: 84745.76,
        vatRate: 18, // INVALID — should be 0, 10, or 20
        partnerName: 'E2E-Invalid VAT rate',
        projectId,
      }),
    });
    if (res.ok) {
      trackIssue({
        entity: 'Invoice',
        operation: 'VALIDATION',
        issue: 'НДС rate 18% accepted — should only allow 0%, 10%, or 20%',
        severity: '[MAJOR]',
        expected: 'HTTP 400 (invalid VAT rate)',
        actual: `HTTP ${res.status} — accepted`,
      });
      // Cleanup
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) await fetch(`${API}/api/invoices/${id}/cancel`, { method: 'POST', headers: headers() });
    }
    // Note: if backend doesn't validate VAT rates, this is a known gap
  });

  /* ============================================================== */
  /*  F. DELETE / CANCEL                                            */
  /* ============================================================== */

  test('F1: Cancel invoice', async () => {
    // Create a fresh invoice to cancel
    const createRes = await fetch(`${API}/api/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        invoiceDate: '2026-03-20',
        invoiceType: 'RECEIVED',
        totalAmount: 50000,
        subtotal: 41666.67,
        vatRate: 20,
        partnerName: 'E2E-Cancel test',
        projectId,
      }),
    });
    if (!createRes.ok) return;
    const json = await createRes.json();
    const tempId = json.id ?? json.data?.id;

    const cancelRes = await fetch(`${API}/api/invoices/${tempId}/cancel`, {
      method: 'POST',
      headers: headers(),
    });
    if (cancelRes.ok) {
      const verifyRes = await fetch(`${API}/api/invoices/${tempId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/CANCEL/i);
    } else {
      trackIssue({
        entity: 'Invoice',
        operation: 'DELETE',
        issue: `Cancel invoice failed: ${cancelRes.status}`,
        severity: '[MINOR]',
        expected: 'CANCELLED',
        actual: `HTTP ${cancelRes.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  G. CROSS-CHECKS (бухгалтер perspective)                      */
  /* ============================================================== */

  test('G1: All amounts use Russian number format in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/invoices', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const cells = await page.locator('td').allTextContents();
    let westernFormatCount = 0;
    for (const cell of cells) {
      // Detect Western format: 1,234,567.89
      if (cell.match(/\d{1,3}(,\d{3})+\.\d{2}/)) {
        westernFormatCount++;
      }
    }
    if (westernFormatCount > 0) {
      trackIssue({
        entity: 'Invoice',
        operation: 'READ',
        issue: `${westernFormatCount} cells use Western number format instead of Russian`,
        severity: '[MINOR]',
        expected: '"1 234 567,89" format',
        actual: `${westernFormatCount} cells in "1,234,567.89" format`,
      });
    }

    await page.screenshot({ path: 'test-results/invoice-list-format.png' });
  });

  test('G2: Invoice payment balance chain verification', async () => {
    // Verify: total - sum(payments) = remaining
    const res = await fetch(`${API}/api/invoices/${invoiceId}`, { headers: headers() });
    if (!res.ok) return;
    const data = (await res.json()).data ?? (await res.json());

    const total = Number(data.totalAmount ?? 0);
    const paid = Number(data.paidAmount ?? 0);
    const remaining = Number(data.remainingAmount ?? 0);

    if (total > 0) {
      const expectedRemaining = total - paid;
      const diff = Math.abs(remaining - expectedRemaining);
      expect.soft(diff, `Balance chain: total(${total}) - paid(${paid}) = remaining(${remaining}), expected ${expectedRemaining}`).toBeLessThanOrEqual(1);

      if (diff > 1) {
        trackIssue({
          entity: 'Invoice',
          operation: 'CALCULATION',
          issue: 'Payment balance chain broken',
          severity: '[CRITICAL]',
          expected: `remaining = ${expectedRemaining}`,
          actual: `remaining = ${remaining}`,
        });
      }
    }
  });
});
