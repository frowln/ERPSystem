/**
 * SESSION 2.7 — Deep CRUD: Support Tickets (Заявки технической поддержки)
 *
 * Full lifecycle test for Support Ticket entity.
 * Tested as 5 personas: прораб, бухгалтер, директор, инженер-сметчик, снабженец.
 * Uses realistic data: ООО "СтройМонтаж", ГРАНД-Смета, ЛСР import bug.
 *
 * Status flow: OPEN → ASSIGNED → IN_PROGRESS → WAITING_RESPONSE → RESOLVED → CLOSED
 *
 * Sections:
 *   A. CREATE — create ticket via API, verify fields
 *   B. READ — list, filters, search, detail, dashboard stats, kanban board
 *   C. UPDATE — change priority, assign, add comment
 *   D. STATUS FLOW — full chain OPEN→…→CLOSED
 *   E. COMMENTS — add comment, internal comment
 *   F. VALIDATION — empty required, bad category
 *   G. DELETE — soft delete
 *   PERSONA — persona-specific checks
 *
 * API endpoints:
 *   GET    /api/support/tickets           — list
 *   POST   /api/support/tickets           — create
 *   GET    /api/support/tickets/{id}      — get
 *   PUT    /api/support/tickets/{id}      — update
 *   PATCH  /api/support/tickets/{id}/assign   — assign
 *   PATCH  /api/support/tickets/{id}/start    — start work
 *   PATCH  /api/support/tickets/{id}/resolve  — resolve
 *   PATCH  /api/support/tickets/{id}/close    — close
 *   DELETE /api/support/tickets/{id}      — delete
 *   GET    /api/support/tickets/{id}/comments — comments
 *   POST   /api/support/tickets/{id}/comments — add comment
 *   GET    /api/support/tickets/dashboard — stats
 *   GET    /api/support/tickets/my        — my tickets
 *   GET    /api/support/tickets/assigned  — assigned to me
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
const TICKET_DATA = {
  subject: 'E2E-Не работает импорт ЛСР из ГРАНД-Сметы',
  description:
    'При загрузке файла .xlsx из ГРАНД-Сметы 2025.3 система зависает на 95%. Файл размером 12 МБ, 9665 строк.\n' +
    'Шаги:\n1. Перейти в раздел Сметы\n2. Нажать "Импорт"\n3. Выбрать файл\n4. Система зависает',
  category: 'BUG',
  priority: 'HIGH',
};

const TICKET_DATA_2 = {
  subject: 'E2E-Запрос: добавить экспорт КС-2 в PDF',
  description:
    'Необходима возможность экспортировать акт КС-2 в формате PDF для отправки заказчику по email. ' +
    'Сейчас доступен только Excel.',
  category: 'FEATURE_REQUEST',
  priority: 'MEDIUM',
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let ticketId: string;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
async function createTicketViaApi(overrides?: Record<string, unknown>): Promise<{ id: string; code?: string }> {
  const body = { ...TICKET_DATA, ...overrides };
  const res = await fetch(`${API}/api/support/tickets`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const data = json.data ?? json;
  return { id: data.id ?? '', code: data.code };
}

async function cleanupE2ETickets(): Promise<void> {
  try {
    const res = await fetch(`${API}/api/support/tickets?size=200`, { headers: headers() });
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    if (!Array.isArray(list)) return;
    const e2e = list.filter((t: any) => (t.subject ?? '').includes('E2E-'));
    for (const t of e2e) {
      await fetch(`${API}/api/support/tickets/${t.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

// ══════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════

test.describe('Support Tickets CRUD — Deep Lifecycle (Техподдержка)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await getToken();
    await cleanupE2ETickets();
  });

  test.afterAll(async () => {
    await cleanupE2ETickets();
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  SUPPORT TICKETS CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ SUPPORT TICKETS CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create support ticket via API (BUG, HIGH)', async () => {
    const res = await fetch(`${API}/api/support/tickets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(TICKET_DATA),
    });

    expect(res.status, 'Ticket creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    const data = json.data ?? json;
    ticketId = data.id ?? '';
    expect(ticketId, 'Ticket ID returned').toBeTruthy();

    // Verify initial status
    expect.soft(data.status).toMatch(/OPEN|open|Открыт/i);
    expect.soft(data.priority).toMatch(/HIGH|high|Высок/i);
    expect.soft(data.category).toMatch(/BUG|bug/i);

    if (data.code) {
      console.log(`Ticket code: ${data.code}`);
    }
    console.log(`Created ticket: id=${ticketId}, status=${data.status}`);
  });

  test('A2: Create second ticket (FEATURE_REQUEST, MEDIUM)', async () => {
    const res = await fetch(`${API}/api/support/tickets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(TICKET_DATA_2),
    });

    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      console.log(`Second ticket: id=${data.id}, category=${data.category}`);
      expect.soft(data.priority).toMatch(/MEDIUM|medium/i);
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'CREATE',
        issue: `Second ticket creation failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('A3: Verify ticket detail via API', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
    expect(res.ok, 'GET ticket detail should succeed').toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    const checks = [
      { field: 'subject', pattern: /ГРАНД-Сметы/, value: data.subject },
      { field: 'description', pattern: /xlsx/, value: data.description },
      { field: 'category', pattern: /BUG/i, value: data.category },
    ];

    for (const c of checks) {
      if (!c.value) {
        trackIssue({
          entity: 'Support Ticket',
          operation: 'READ',
          issue: `Field "${c.field}" is null/empty`,
          severity: c.field === 'subject' ? '[MAJOR]' : '[MINOR]',
          expected: `${c.field} has value`,
          actual: 'null/empty',
        });
      } else if (c.pattern && !c.pattern.test(String(c.value))) {
        trackIssue({
          entity: 'Support Ticket',
          operation: 'READ',
          issue: `Field "${c.field}" has unexpected value: ${c.value}`,
          severity: '[MINOR]',
          expected: `Matches ${c.pattern}`,
          actual: String(c.value),
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. READ — List, search, dashboard, kanban                     */
  /* ============================================================== */

  test('B1: Ticket appears in list (API)', async () => {
    const res = await fetch(`${API}/api/support/tickets?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((t: any) => t.id === ticketId) : null;
    expect(found, 'Ticket should appear in list').toBeTruthy();
  });

  test('B2: Ticket list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Should have table or card layout
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="grid"]').first().isVisible().catch(() => false);

    expect.soft(hasTable || hasCards, 'Ticket list should have table or card layout').toBeTruthy();

    await page.screenshot({ path: 'test-results/support-tickets-list.png' });
  });

  test('B3: Ticket board (kanban) page loads', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets/board', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Board has content').toBeGreaterThan(50);

    // Kanban should have columns for statuses
    const statusKeywords = ['открыт', 'в работе', 'решен', 'open', 'progress', 'resolved'];
    let columnsFound = 0;
    for (const kw of statusKeywords) {
      if (body.toLowerCase().includes(kw)) columnsFound++;
    }

    if (columnsFound < 2) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'READ/board',
        issue: 'Kanban board has fewer than 2 status columns visible',
        severity: '[UX]',
        expected: 'At least Open, In Progress, Resolved columns',
        actual: `${columnsFound} status keywords found`,
      });
    }

    await page.screenshot({ path: 'test-results/support-tickets-board.png' });
  });

  test('B4: Support dashboard shows stats', async () => {
    const res = await fetch(`${API}/api/support/tickets/dashboard`, { headers: headers() });

    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      console.log('Dashboard stats:', JSON.stringify(data).slice(0, 500));

      // Директор expects: total, open, critical, resolved counts
      expect.soft(data).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'READ/dashboard',
        issue: `Dashboard stats returned ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200 with counts',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('B5: Support dashboard page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/support/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Dashboard has content').toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/support-dashboard.png' });
  });

  test('B6: Ticket search works', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const searchInput = page.locator(
      'input[type="text"], input[type="search"], input[placeholder*="Поиск" i], input[placeholder*="search" i]',
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('E2E-');
      await page.waitForTimeout(1500);

      const body = await page.textContent('body') ?? '';
      if (body.includes('E2E-') || body.includes('ГРАНД')) {
        console.log('Search found our E2E ticket');
      }
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'READ/search',
        issue: 'No search input on tickets list page',
        severity: '[UX]',
        expected: 'Search input visible',
        actual: 'Not found',
      });
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Update ticket — escalate priority to CRITICAL', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        ...TICKET_DATA,
        priority: 'CRITICAL',
        description: TICKET_DATA.description + '\n\nUPDATE: Блокирует работу 3-х сметчиков на проекте ЖК "Солнечный"',
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.priority).toMatch(/CRITICAL|critical/i);
      console.log(`Ticket priority escalated to: ${data.priority}`);
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'UPDATE',
        issue: `Priority escalation failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx, priority=CRITICAL',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('C2: Assign ticket to user', async () => {
    // Get current user ID (admin)
    const meRes = await fetch(`${API}/api/auth/me`, { headers: headers() });
    let assigneeId: string | undefined;
    if (meRes.ok) {
      const me = (await meRes.json()).data ?? (await meRes.json());
      assigneeId = me.id;
    }

    if (!assigneeId) {
      console.log('SKIP: Could not get current user ID for assignment');
      return;
    }

    const res = await fetch(`${API}/api/support/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ assigneeId }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`Ticket assigned to: ${data.assigneeId ?? 'unknown'}, status: ${data.status}`);

      // Status should change to ASSIGNED after assignment
      if (data.status && !/ASSIGNED|IN_PROGRESS/i.test(data.status)) {
        trackIssue({
          entity: 'Support Ticket',
          operation: 'STATUS',
          issue: `Status should be ASSIGNED after assignment, got: ${data.status}`,
          severity: '[MINOR]',
          expected: 'ASSIGNED',
          actual: data.status,
        });
      }
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'UPDATE/assign',
        issue: `Assign ticket failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  D. STATUS FLOW                                                */
  /* ============================================================== */

  test('D1: Start work (→ IN_PROGRESS)', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/start`, {
      method: 'PATCH',
      headers: headers(),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/IN_PROGRESS|in_progress/i);
      console.log(`After start: status=${data.status}`);
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'STATUS',
        issue: `Start work failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'IN_PROGRESS',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D2: Resolve ticket', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: headers(),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/RESOLVED|resolved/i);
      console.log(`After resolve: status=${data.status}`);

      // resolvedAt should be set
      if (!data.resolvedAt) {
        trackIssue({
          entity: 'Support Ticket',
          operation: 'STATUS/resolve',
          issue: 'resolvedAt not set when ticket resolved',
          severity: '[MINOR]',
          expected: 'resolvedAt populated',
          actual: 'resolvedAt is null',
        });
      }
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'STATUS',
        issue: `Resolve failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'RESOLVED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D3: Close ticket', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/close`, {
      method: 'PATCH',
      headers: headers(),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/support/tickets/${ticketId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.status).toMatch(/CLOSED|closed/i);
      console.log(`After close: status=${data.status}`);
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'STATUS',
        issue: `Close failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'CLOSED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D4: Full status flow on fresh ticket', async () => {
    const ticket = await createTicketViaApi({
      subject: 'E2E-Тикет для полного flow',
      description: 'Тестируем полный цикл: OPEN→ASSIGNED→IN_PROGRESS→RESOLVED→CLOSED',
    });
    const id = ticket.id;
    if (!id) return;

    const steps = [
      { action: 'assign', method: 'PATCH' as const, path: `/assign`, body: {}, expectedStatus: /ASSIGNED/i },
      { action: 'start', method: 'PATCH' as const, path: `/start`, body: undefined, expectedStatus: /IN_PROGRESS/i },
      { action: 'resolve', method: 'PATCH' as const, path: `/resolve`, body: undefined, expectedStatus: /RESOLVED/i },
      { action: 'close', method: 'PATCH' as const, path: `/close`, body: undefined, expectedStatus: /CLOSED/i },
    ];

    for (const step of steps) {
      const fetchOptions: RequestInit = {
        method: step.method,
        headers: headers(),
      };
      if (step.body !== undefined) {
        fetchOptions.body = JSON.stringify(step.body);
      }

      const res = await fetch(`${API}/api/support/tickets/${id}${step.path}`, fetchOptions);

      if (!res.ok) {
        trackIssue({
          entity: 'Support Ticket',
          operation: `STATUS/${step.action}`,
          issue: `${step.action} failed in full flow: ${res.status}`,
          severity: '[MAJOR]',
          expected: `Status → ${step.expectedStatus}`,
          actual: `HTTP ${res.status}`,
        });
        break; // Stop flow if a step fails
      }
    }

    // Verify final status
    const verifyRes = await fetch(`${API}/api/support/tickets/${id}`, { headers: headers() });
    if (verifyRes.ok) {
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      console.log(`Full flow final status: ${data.status}`);
    }

    await fetch(`${API}/api/support/tickets/${id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
  });

  /* ============================================================== */
  /*  E. COMMENTS                                                   */
  /* ============================================================== */

  test('E1: Add comment to ticket', async () => {
    // Use our main ticket (may be closed, but comments should still work)
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        content: 'Проблема воспроизведена на файле client_lsr_9665.xlsx. Причина: парсер не обрабатывает формат ФСБЦ.',
        isInternal: false,
      }),
    });

    if (res.ok) {
      console.log('Comment added to ticket');
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'COMMENT/add',
        issue: `Add comment failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('E2: Add internal comment (not visible to reporter)', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        content: 'Внутренний комментарий: нужно расширить regex в parseGrandSmeta() для кодов ФСБЦ.',
        isInternal: true,
      }),
    });

    if (res.ok) {
      console.log('Internal comment added');
    } else {
      // isInternal may not be supported — not critical
      console.log(`Internal comment: HTTP ${res.status}`);
    }
  });

  test('E3: List comments for ticket', async () => {
    const res = await fetch(`${API}/api/support/tickets/${ticketId}/comments`, { headers: headers() });

    if (res.ok) {
      const json = await res.json();
      const comments = json.content ?? json.data ?? json ?? [];
      const list = Array.isArray(comments) ? comments : [];
      console.log(`Ticket has ${list.length} comments`);
      expect.soft(list.length, 'Ticket should have at least 1 comment').toBeGreaterThanOrEqual(1);
    } else {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'COMMENT/list',
        issue: `List comments failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 200',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  F. VALIDATION                                                 */
  /* ============================================================== */

  test('F1: Cannot create ticket without subject', async () => {
    const res = await fetch(`${API}/api/support/tickets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        description: 'Some description without subject',
        category: 'BUG',
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'VALIDATION',
        issue: 'Ticket created without subject — should be rejected',
        severity: '[MAJOR]',
        expected: 'HTTP 400 — subject required',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/support/tickets/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('F2: Cannot create ticket without description', async () => {
    const res = await fetch(`${API}/api/support/tickets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subject: 'E2E-Test no description',
        category: 'BUG',
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'VALIDATION',
        issue: 'Ticket created without description — should be rejected',
        severity: '[MINOR]',
        expected: 'HTTP 400 — description required',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/support/tickets/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    }
  });

  test('F3: Validation on UI — empty form', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Look for create button
    const createBtn = page.getByRole('button', {
      name: /создать|create|новая|new|добавить/i,
    });

    if (await createBtn.first().isVisible().catch(() => false)) {
      await createBtn.first().click();
      await page.waitForTimeout(1500);

      // Try to submit empty form
      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|create|отправить|submit/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(1500);

        // Check for validation errors
        const errorTexts = page.locator(
          '.text-red-500, .text-red-600, [role="alert"], .text-destructive',
        );
        const errorCount = await errorTexts.count();
        if (errorCount === 0) {
          trackIssue({
            entity: 'Support Ticket',
            operation: 'VALIDATION/UI',
            issue: 'No validation errors on empty ticket form submit',
            severity: '[MAJOR]',
            expected: 'At least subject and description required',
            actual: '0 validation errors',
          });
        }
      }
    }

    await page.screenshot({ path: 'test-results/support-ticket-validation.png' });
  });

  /* ============================================================== */
  /*  G. DELETE                                                     */
  /* ============================================================== */

  test('G1: Delete ticket via API — soft delete', async () => {
    const ticket = await createTicketViaApi({
      subject: 'E2E-Тикет для удаления',
      description: 'Этот тикет будет удалён в рамках теста',
    });
    const id = ticket.id;
    if (!id) return;

    const res = await fetch(`${API}/api/support/tickets/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    expect.soft(res.status, 'Delete should succeed').toBeLessThanOrEqual(204);

    // Verify not accessible
    const getRes = await fetch(`${API}/api/support/tickets/${id}`, { headers: headers() });
    if (getRes.ok) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'DELETE',
        issue: 'Deleted ticket still accessible via GET',
        severity: '[CRITICAL]',
        expected: 'HTTP 404/410 after deletion',
        actual: `HTTP ${getRes.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  PERSONA — Domain expert checks                                */
  /* ============================================================== */

  test('PERSONA: Прораб — can create ticket quickly', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    // Прораб needs: quick ticket creation (2-3 clicks max)
    const createBtn = page.getByRole('button', {
      name: /создать|create|новая|new|добавить/i,
    });

    const isCreateVisible = await createBtn.first().isVisible().catch(() => false);
    if (!isCreateVisible) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'PERSONA/прораб',
        issue: 'No visible "Create" button on tickets page — прораб needs quick access',
        severity: '[UX]',
        expected: 'Prominent "Создать заявку" button',
        actual: 'Create button not found',
      });
    }
  });

  test('PERSONA: Директор — dashboard shows key metrics', async ({ page }) => {
    await page.goto('http://localhost:4000/support/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';

    // Директор needs: total count, open count, SLA stats
    const hasNumbers = /\d+/.test(body);
    if (!hasNumbers) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'PERSONA/директор',
        issue: 'No numeric metrics on support dashboard',
        severity: '[UX]',
        expected: 'Total/open/resolved ticket counts visible',
        actual: 'No numbers found on dashboard',
      });
    }
  });

  test('PERSONA: Инженер-сметчик — category filter for сметы-related tickets', async ({ page }) => {
    await page.goto('http://localhost:4000/support/tickets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Check for category filter
    const categoryFilter = page.locator('select, [role="combobox"], button')
      .filter({ hasText: /категория|category|тип|type/i })
      .first();

    if (!await categoryFilter.isVisible().catch(() => false)) {
      trackIssue({
        entity: 'Support Ticket',
        operation: 'PERSONA/сметчик',
        issue: 'No category filter — сметчик needs to filter by module/type',
        severity: '[UX]',
        expected: 'Category filter (BUG, FEATURE_REQUEST, QUESTION, etc.)',
        actual: 'No category filter found',
      });
    }
  });
});
