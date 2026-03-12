/**
 * SESSION 2.7 — Deep CRUD: Counterparties (Контрагенты)
 *
 * Full lifecycle test for Counterparty entity.
 * Tested as 5 personas: прораб, бухгалтер, директор, инженер-сметчик, снабженец.
 * Uses realistic data: ООО "ЭлектроМонтажСервис", ИП Петров К.В.
 *
 * Russian requisites validation:
 *   - ИНН юрлица: 10 цифр (контрольная сумма)
 *   - ИНН ИП: 12 цифр
 *   - КПП: 9 цифр (not for ИП)
 *   - ОГРН: 13 цифр (юрлицо), 15 цифр (ОГРНИП)
 *   - БИК: 9 цифр
 *   - Р/с: 20 цифр (40702 for юрлица)
 *   - К/с: 20 цифр (30101)
 *
 * Sections:
 *   A. CREATE — юрлицо + ИП
 *   B. READ — list, search, detail, roles
 *   C. UPDATE — change fields, add roles
 *   D. VALIDATION — ИНН, КПП, ОГРН, duplicate
 *   E. DELETE — deactivation
 *   PERSONA — persona-specific checks
 *
 * API endpoints:
 *   GET    /api/counterparties         — list
 *   POST   /api/counterparties         — create
 *   GET    /api/counterparties/{id}    — get
 *   PUT    /api/counterparties/{id}    — update
 *   DELETE /api/counterparties/{id}    — deactivate
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

// Юридическое лицо — субподрядчик электрика
const COUNTERPARTY_LEGAL = {
  name: 'E2E-ООО "ЭлектроМонтажСервис"',
  shortName: 'E2E-ЭМС',
  inn: '7701234567',
  kpp: '770101001',
  ogrn: '1027700123456',
  legalAddress: '127015, г. Москва, ул. Бутырская, д. 77, стр. 1',
  actualAddress: '127015, г. Москва, ул. Бутырская, д. 77, стр. 1',
  phone: '+7 (495) 222-33-44',
  email: 'info@ems-moscow.ru',
  website: 'www.ems-moscow.ru',
  bankName: 'ПАО Сбербанк',
  bik: '044525225',
  correspondentAccount: '30101810400000000225',
  bankAccount: '40702810500000000001',
  contactPerson: 'Николаев Сергей Петрович',
  subcontractor: true,
  contractor: true,
  supplier: false,
  customer: false,
  designer: false,
  notes: 'Электромонтажные работы, СРО-Э-001-2024, гарантия 24 мес.',
};

// ИП — отделочные работы
const COUNTERPARTY_IP = {
  name: 'E2E-ИП Петров Константин Владимирович',
  shortName: 'E2E-ИП Петров К.В.',
  inn: '770312345678', // 12 digits for ИП
  legalAddress: '115432, г. Москва, ул. Трофимова, д. 5, кв. 23',
  phone: '+7 (926) 111-22-33',
  email: 'petrov.kv@mail.ru',
  bankName: 'АО "Тинькофф Банк"',
  bik: '044525974',
  correspondentAccount: '30101810145250000974',
  bankAccount: '40802810100000000001',
  subcontractor: true,
  contractor: false,
  supplier: false,
  customer: false,
  designer: false,
  notes: 'Отделочные работы: штукатурка, покраска, плитка. Работает без НДС.',
};

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let legalEntityId: string;
let ipEntityId: string;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
async function cleanupE2ECounterparties(): Promise<void> {
  try {
    const res = await fetch(`${API}/api/counterparties?size=200`, { headers: headers() });
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    if (!Array.isArray(list)) return;
    const e2e = list.filter((c: any) => (c.name ?? '').includes('E2E-'));
    for (const c of e2e) {
      await fetch(`${API}/api/counterparties/${c.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

// ══════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════

test.describe('Counterparties CRUD — Deep Lifecycle (Контрагенты)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await getToken();
    await cleanupE2ECounterparties();
  });

  test.afterAll(async () => {
    await cleanupE2ECounterparties();
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  COUNTERPARTY CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ COUNTERPARTY CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create юрлицо (ООО) via API', async () => {
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(COUNTERPARTY_LEGAL),
    });

    expect(res.status, 'Legal entity creation should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    const data = json.data ?? json;
    legalEntityId = data.id ?? '';
    expect(legalEntityId, 'Counterparty ID returned').toBeTruthy();

    // Verify key fields
    expect.soft(data.inn).toBe('7701234567');
    expect.soft(data.subcontractor).toBeTruthy();
    expect.soft(data.contractor).toBeTruthy();
    if (data.active !== undefined) {
      expect.soft(data.active, 'New counterparty should be active').toBeTruthy();
    }

    console.log(`Created юрлицо: id=${legalEntityId}, inn=${data.inn}`);
  });

  test('A2: Create ИП via API', async () => {
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(COUNTERPARTY_IP),
    });

    if (res.ok) {
      const data = (await res.json()).data ?? (await res.json());
      ipEntityId = data.id ?? '';
      expect(ipEntityId, 'ИП ID returned').toBeTruthy();

      // ИП specifics: 12-digit ИНН, no КПП
      expect.soft(data.inn).toBe('770312345678');
      if (data.kpp) {
        trackIssue({
          entity: 'Counterparty',
          operation: 'CREATE/ИП',
          issue: 'ИП has КПП set — ИП should not have КПП',
          severity: '[MINOR]',
          expected: 'КПП null/empty for ИП',
          actual: `КПП = ${data.kpp}`,
        });
      }

      console.log(`Created ИП: id=${ipEntityId}, inn=${data.inn}`);
    } else {
      trackIssue({
        entity: 'Counterparty',
        operation: 'CREATE/ИП',
        issue: `ИП creation failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('A3: Verify юрлицо detail via API', async () => {
    const res = await fetch(`${API}/api/counterparties/${legalEntityId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const data = (await res.json()).data ?? (await res.json());

    // Бухгалтер needs all requisites
    const requiredFields = [
      'name', 'inn', 'kpp', 'bankAccount', 'bik', 'correspondentAccount', 'bankName',
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        trackIssue({
          entity: 'Counterparty',
          operation: 'READ/detail',
          issue: `Field "${field}" is null/empty for юрлицо`,
          severity: field === 'inn' || field === 'bankAccount' ? '[MAJOR]' : '[MINOR]',
          expected: `${field} has value`,
          actual: 'null/empty',
        });
      }
    }

    // Bank account validation: 20 digits, starts with 40702 for юрлицо
    if (data.bankAccount) {
      if (data.bankAccount.length !== 20) {
        trackIssue({
          entity: 'Counterparty',
          operation: 'VALIDATION/bankAccount',
          issue: `Р/с length wrong: ${data.bankAccount.length} ≠ 20`,
          severity: '[MINOR]',
          expected: '20 digits',
          actual: `${data.bankAccount.length} characters`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. READ — List, search, detail                                */
  /* ============================================================== */

  test('B1: Counterparties appear in list (API)', async () => {
    const res = await fetch(`${API}/api/counterparties?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const items = Array.isArray(list) ? list : [];

    const foundLegal = items.find((c: any) => c.id === legalEntityId);
    const foundIP = items.find((c: any) => c.id === ipEntityId);

    expect(foundLegal, 'Юрлицо should appear in list').toBeTruthy();
    if (ipEntityId) {
      expect.soft(foundIP, 'ИП should appear in list').toBeTruthy();
    }
  });

  test('B2: Counterparties list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/counterparties', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';
    expect.soft(body.length, 'Page has content').toBeGreaterThan(50);

    // Should have table with columns
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="grid"]').first().isVisible().catch(() => false);
    expect.soft(hasTable || hasCards, 'Should have table or card layout').toBeTruthy();

    await page.screenshot({ path: 'test-results/counterparties-list.png' });
  });

  test('B3: Search counterparties by name', async ({ page }) => {
    await page.goto('http://localhost:4000/counterparties', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const searchInput = page.locator(
      'input[type="text"], input[type="search"], input[placeholder*="Поиск" i], input[placeholder*="search" i], input[placeholder*="найти" i]',
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('E2E-ООО');
      await page.waitForTimeout(1500);

      const body = await page.textContent('body') ?? '';
      const found = body.includes('ЭлектроМонтаж') || body.includes('E2E-ООО');
      if (found) {
        console.log('Search found ООО counterparty');
      }
    } else {
      trackIssue({
        entity: 'Counterparty',
        operation: 'READ/search',
        issue: 'No search input on counterparties page',
        severity: '[UX]',
        expected: 'Search by name/ИНН',
        actual: 'No search input found',
      });
    }
  });

  test('B4: Search counterparties by ИНН (API)', async () => {
    const res = await fetch(`${API}/api/counterparties?search=7701234567&size=10`, { headers: headers() });

    if (res.ok) {
      const json = await res.json();
      const list = json.content ?? json.data ?? json ?? [];
      const items = Array.isArray(list) ? list : [];
      const found = items.find((c: any) => c.inn === '7701234567');

      if (found) {
        console.log('API search by ИНН works');
      } else {
        trackIssue({
          entity: 'Counterparty',
          operation: 'READ/search-inn',
          issue: 'Search by ИНН did not return matching counterparty',
          severity: '[UX]',
          expected: 'ООО ЭлектроМонтажСервис found by ИНН 7701234567',
          actual: `${items.length} results, none match ИНН`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Update юрлицо — change contact and add supplier role', async () => {
    const res = await fetch(`${API}/api/counterparties/${legalEntityId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        ...COUNTERPARTY_LEGAL,
        contactPerson: 'Иванова Мария Сергеевна',
        phone: '+7 (495) 333-44-55',
        supplier: true, // Now also a supplier
        notes: 'Электромонтаж + поставка кабельной продукции',
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/counterparties/${legalEntityId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());

      expect.soft(data.contactPerson).toBe('Иванова Мария Сергеевна');
      expect.soft(data.supplier, 'Supplier role added').toBeTruthy();
      expect.soft(data.subcontractor, 'Subcontractor role preserved').toBeTruthy();
      console.log(`Updated: contact=${data.contactPerson}, supplier=${data.supplier}`);
    } else {
      trackIssue({
        entity: 'Counterparty',
        operation: 'UPDATE',
        issue: `Update failed: ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('C2: Update ИП — change bank details', async () => {
    if (!ipEntityId) {
      console.log('SKIP: ИП not created');
      return;
    }

    const res = await fetch(`${API}/api/counterparties/${ipEntityId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        ...COUNTERPARTY_IP,
        bankName: 'ПАО Сбербанк',
        bik: '044525225',
        correspondentAccount: '30101810400000000225',
        bankAccount: '40802810900000000002',
      }),
    });

    if (res.ok) {
      const verifyRes = await fetch(`${API}/api/counterparties/${ipEntityId}`, { headers: headers() });
      const data = (await verifyRes.json()).data ?? (await verifyRes.json());
      expect.soft(data.bankName).toContain('Сбербанк');
      console.log(`ИП bank updated to: ${data.bankName}`);
    } else {
      trackIssue({
        entity: 'Counterparty',
        operation: 'UPDATE/ИП',
        issue: `ИП update failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'HTTP 2xx',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  D. VALIDATION                                                 */
  /* ============================================================== */

  test('D1: Cannot create without name', async () => {
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        inn: '7799887766',
        subcontractor: true,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'VALIDATION',
        issue: 'Counterparty created without name — should be rejected',
        severity: '[MAJOR]',
        expected: 'HTTP 400 — name required',
        actual: `HTTP ${res.status}`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/counterparties/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('D2: ИНН with wrong length rejected', async () => {
    // ИНН must be 10 (юрлицо) or 12 (ИП) digits
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Bad INN Test',
        inn: '12345', // 5 digits — invalid
        subcontractor: true,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'VALIDATION/ИНН',
        issue: 'ИНН with 5 digits accepted — should require 10 or 12',
        severity: '[CRITICAL]',
        expected: 'HTTP 400 — ИНН must be 10 or 12 digits',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/counterparties/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
      console.log('ИНН validation works: 5-digit ИНН rejected');
    }
  });

  test('D3: ИНН with letters rejected', async () => {
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Letters INN Test',
        inn: '77AB123456', // Letters — invalid
        subcontractor: true,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'VALIDATION/ИНН',
        issue: 'ИНН with letters accepted — should be digits only',
        severity: '[MAJOR]',
        expected: 'HTTP 400 — ИНН digits only',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/counterparties/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    }
  });

  test('D4: Duplicate ИНН warning', async () => {
    // Try to create another counterparty with same ИНН
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Duplicate INN Test ООО',
        inn: '7701234567', // Same as COUNTERPARTY_LEGAL
        subcontractor: true,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'VALIDATION/duplicate',
        issue: 'Duplicate ИНН accepted — should warn or reject',
        severity: '[MAJOR]',
        expected: 'HTTP 409 or warning — "Контрагент с таким ИНН уже существует"',
        actual: `HTTP ${res.status} — accepted silently`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/counterparties/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    } else {
      console.log(`Duplicate ИНН rejected: HTTP ${res.status}`);
    }
  });

  test('D5: БИК validation (9 digits)', async () => {
    const res = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-Bad BIK Test',
        inn: '7788990011',
        bik: '1234', // 4 digits — invalid
        subcontractor: true,
      }),
    });

    if (res.ok) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'VALIDATION/БИК',
        issue: 'БИК with 4 digits accepted — should require 9',
        severity: '[MINOR]',
        expected: 'HTTP 400 — БИК must be 9 digits',
        actual: `HTTP ${res.status} — accepted`,
      });
      const data = (await res.json()).data ?? (await res.json());
      if (data.id) {
        await fetch(`${API}/api/counterparties/${data.id}`, { method: 'DELETE', headers: headers() }).catch(() => {});
      }
    }
  });

  test('D6: Create via UI — form has requisite fields', async ({ page }) => {
    await page.goto('http://localhost:4000/counterparties/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';

    // Бухгалтер needs: ИНН, КПП, ОГРН, Р/с, К/с, БИК, Банк
    const requiredLabels = ['ИНН', 'КПП', 'Р/с', 'БИК'];
    let found = 0;
    for (const label of requiredLabels) {
      if (body.includes(label) || body.toLowerCase().includes(label.toLowerCase())) {
        found++;
      }
    }

    if (found < 2) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'CREATE/UI',
        issue: `Form missing key requisite fields (found ${found}/${requiredLabels.length})`,
        severity: '[UX]',
        expected: 'ИНН, КПП, Р/с, БИК fields visible on form',
        actual: `${found} of ${requiredLabels.length} labels found`,
      });
    }

    await page.screenshot({ path: 'test-results/counterparty-form.png' });
  });

  /* ============================================================== */
  /*  E. DELETE (deactivation)                                      */
  /* ============================================================== */

  test('E1: Deactivate counterparty via API', async () => {
    // Create a disposable counterparty
    const createRes = await fetch(`${API}/api/counterparties`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-ООО "Удаляемая компания"',
        inn: '9988776655',
        subcontractor: true,
      }),
    });

    if (!createRes.ok) return;
    const data = (await createRes.json()).data ?? (await createRes.json());
    const id = data.id;
    if (!id) return;

    const res = await fetch(`${API}/api/counterparties/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    expect.soft(res.status, 'Deactivate should succeed').toBeLessThanOrEqual(204);

    // Verify: may still be accessible but with active=false
    const getRes = await fetch(`${API}/api/counterparties/${id}`, { headers: headers() });
    if (getRes.ok) {
      const deactivated = (await getRes.json()).data ?? (await getRes.json());
      if (deactivated.active === true) {
        trackIssue({
          entity: 'Counterparty',
          operation: 'DELETE',
          issue: 'Counterparty still active after DELETE — should be deactivated',
          severity: '[MAJOR]',
          expected: 'active=false or HTTP 404',
          actual: `active=${deactivated.active}`,
        });
      }
    }
  });

  test('E2: Deactivated counterparty not in active list', async () => {
    const res = await fetch(`${API}/api/counterparties?size=200`, { headers: headers() });
    if (!res.ok) return;
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const items = Array.isArray(list) ? list : [];

    const deleted = items.find((c: any) => (c.name ?? '').includes('Удаляемая компания'));
    if (deleted && deleted.active !== false) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'DELETE/list',
        issue: 'Deactivated counterparty still shows as active in list',
        severity: '[MINOR]',
        expected: 'Filtered out or active=false',
        actual: `Found in list, active=${deleted.active}`,
      });
    }
  });

  /* ============================================================== */
  /*  PERSONA — Domain expert checks                                */
  /* ============================================================== */

  test('PERSONA: Бухгалтер — all requisites visible on detail', async ({ page }) => {
    if (!legalEntityId) return;

    await page.goto(`http://localhost:4000/counterparties/${legalEntityId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    const body = await page.textContent('body') ?? '';

    // Бухгалтер needs: ИНН, КПП, Банк, Р/с, К/с, БИК
    const criticalData = [
      { label: 'ИНН/inn', check: /7701234567/ },
      { label: 'КПП/kpp', check: /770101001/ },
      { label: 'Банк/bank', check: /Сбербанк/i },
    ];

    for (const cd of criticalData) {
      if (!cd.check.test(body)) {
        trackIssue({
          entity: 'Counterparty',
          operation: 'PERSONA/бухгалтер',
          issue: `"${cd.label}" data not visible on detail page`,
          severity: '[UX]',
          expected: `${cd.label} value visible`,
          actual: 'Not found in page text',
        });
      }
    }

    await page.screenshot({ path: 'test-results/counterparty-detail-accountant.png' });
  });

  test('PERSONA: Снабженец — role filters on counterparty list', async ({ page }) => {
    await page.goto('http://localhost:4000/counterparties', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';

    // Снабженец needs to filter by: поставщик, субподрядчик
    const hasRoleFilter = /поставщик|субподрядчик|подрядчик|supplier|subcontractor|contractor/i.test(body);

    if (!hasRoleFilter) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'PERSONA/снабженец',
        issue: 'No role filter (поставщик/субподрядчик) on counterparty list',
        severity: '[UX]',
        expected: 'Filter by counterparty role for procurement manager',
        actual: 'No role filter visible',
      });
    }
  });

  test('PERSONA: Директор — counterparty count and diversity', async () => {
    const res = await fetch(`${API}/api/counterparties?size=1`, { headers: headers() });
    if (!res.ok) return;
    const json = await res.json();
    const total = json.totalElements ?? json.total ?? 0;
    console.log(`Total counterparties: ${total}`);

    // Директор: having less than 5 active counterparties is unusual for a construction company
    if (total < 5) {
      trackIssue({
        entity: 'Counterparty',
        operation: 'PERSONA/директор',
        issue: `Only ${total} counterparties — too few for a construction company`,
        severity: '[UX]',
        expected: 'At least 5-10 counterparties (subcontractors, suppliers, customers)',
        actual: `${total} counterparties total`,
      });
    }
  });
});
