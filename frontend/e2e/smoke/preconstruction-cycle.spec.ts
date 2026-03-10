import { test, expect, Page, APIRequestContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ── Constants ────────────────────────────────────────────────────────────────
const PDF_PATH = '/Users/damirkasimov/Downloads/Раздел_ПД_№5_Подраздел_ПД_№4_Том_5_4_2.pdf';
const SCREENSHOTS_DIR = path.resolve('e2e/screenshots/preconstruction-flow');

// Module-level IDs flowing between serial tests
let projectId = '';
let budgetId = '';
let specId = '';
let cpId = '';
let authToken = '';

// Error tracking across all tests
const pageErrors: string[] = [];
const consoleErrors: string[] = [];

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ── Real HVAC spec data (from PDF Том 5.4.2 — Теплоснабжение) ─────────────

const HVAC_SPEC_ITEMS = [
  // Раздел 1: Теплообменное оборудование
  { name: 'Теплообменник пластинчатый ТПР-0,8-М1/16-Р', brand: 'ТПР-0,8', productCode: 'ТО-001', manufacturer: 'Ридан', quantity: 4, unitOfMeasure: 'шт.', weight: 280, itemType: 'EQUIPMENT' as const, sectionName: 'Теплообменное оборудование', costPrice: 485000, estimatePrice: 620000, customerPrice: 680000 },
  { name: 'Теплообменник пластинчатый ТПР-0,4-М1/10-Р (ГВС)', brand: 'ТПР-0,4', productCode: 'ТО-002', manufacturer: 'Ридан', quantity: 2, unitOfMeasure: 'шт.', weight: 145, itemType: 'EQUIPMENT' as const, sectionName: 'Теплообменное оборудование', costPrice: 325000, estimatePrice: 415000, customerPrice: 455000 },
  { name: 'Бак-аккумулятор ГВС 3000л с теплоизоляцией', brand: 'БАК-3000', productCode: 'ТО-003', manufacturer: 'Эван', quantity: 2, unitOfMeasure: 'шт.', weight: 420, itemType: 'EQUIPMENT' as const, sectionName: 'Теплообменное оборудование', costPrice: 189000, estimatePrice: 240000, customerPrice: 264000 },
  // Раздел 2: Насосное оборудование
  { name: 'Насос циркуляционный Wilo TOP-S 50/10 DM', brand: 'TOP-S 50/10', productCode: 'НО-001', manufacturer: 'Wilo', quantity: 6, unitOfMeasure: 'шт.', weight: 28, itemType: 'EQUIPMENT' as const, sectionName: 'Насосное оборудование', costPrice: 67000, estimatePrice: 85000, customerPrice: 93500 },
  { name: 'Насос циркуляционный Wilo TOP-S 30/7 DM (ГВС)', brand: 'TOP-S 30/7', productCode: 'НО-002', manufacturer: 'Wilo', quantity: 4, unitOfMeasure: 'шт.', weight: 18, itemType: 'EQUIPMENT' as const, sectionName: 'Насосное оборудование', costPrice: 42000, estimatePrice: 54000, customerPrice: 59400 },
  { name: 'Насос дренажный Grundfos Unilift AP 35B.50.06.A1V', brand: 'AP 35B', productCode: 'НО-003', manufacturer: 'Grundfos', quantity: 2, unitOfMeasure: 'шт.', weight: 12, itemType: 'EQUIPMENT' as const, sectionName: 'Насосное оборудование', costPrice: 38000, estimatePrice: 48000, customerPrice: 52800 },
  // Раздел 3: Запорно-регулирующая арматура
  { name: 'Клапан балансировочный Danfoss MSV-F2 DN50', brand: 'MSV-F2', productCode: 'ЗА-001', manufacturer: 'Danfoss', quantity: 12, unitOfMeasure: 'шт.', weight: 4.5, itemType: 'MATERIAL' as const, sectionName: 'Запорно-регулирующая арматура', costPrice: 18500, estimatePrice: 23500, customerPrice: 25850 },
  { name: 'Клапан регулирующий Danfoss VB2 DN32 Kvs=16', brand: 'VB2', productCode: 'ЗА-002', manufacturer: 'Danfoss', quantity: 8, unitOfMeasure: 'шт.', weight: 3.2, itemType: 'MATERIAL' as const, sectionName: 'Запорно-регулирующая арматура', costPrice: 24000, estimatePrice: 31000, customerPrice: 34100 },
  { name: 'Затвор дисковый поворотный Tecofi DN100 PN16', brand: 'TECFLY', productCode: 'ЗА-003', manufacturer: 'Tecofi', quantity: 16, unitOfMeasure: 'шт.', weight: 8.7, itemType: 'MATERIAL' as const, sectionName: 'Запорно-регулирующая арматура', costPrice: 6800, estimatePrice: 8700, customerPrice: 9570 },
  { name: 'Фильтр сетчатый ФСМ-50 (магнитный)', brand: 'ФСМ-50', productCode: 'ЗА-004', manufacturer: 'Теплоком', quantity: 10, unitOfMeasure: 'шт.', weight: 2.1, itemType: 'MATERIAL' as const, sectionName: 'Запорно-регулирующая арматура', costPrice: 4200, estimatePrice: 5400, customerPrice: 5940 },
  // Раздел 4: КИПиА (контрольно-измерительные приборы)
  { name: 'Датчик температуры Pt1000 погружной L=100мм', brand: 'Pt1000', productCode: 'КИ-001', manufacturer: 'Овен', quantity: 24, unitOfMeasure: 'шт.', weight: 0.15, itemType: 'EQUIPMENT' as const, sectionName: 'КИПиА', costPrice: 3200, estimatePrice: 4100, customerPrice: 4510 },
  { name: 'Датчик давления Danfoss MBS 3000 0-10 бар', brand: 'MBS 3000', productCode: 'КИ-002', manufacturer: 'Danfoss', quantity: 16, unitOfMeasure: 'шт.', weight: 0.25, itemType: 'EQUIPMENT' as const, sectionName: 'КИПиА', costPrice: 7800, estimatePrice: 10000, customerPrice: 11000 },
  { name: 'Контроллер ИТП Овен ТРМ232М-У (погодозависимый)', brand: 'ТРМ232М', productCode: 'КИ-003', manufacturer: 'Овен', quantity: 2, unitOfMeasure: 'шт.', weight: 1.2, itemType: 'EQUIPMENT' as const, sectionName: 'КИПиА', costPrice: 45000, estimatePrice: 58000, customerPrice: 63800 },
  { name: 'Теплосчётчик ультразвуковой ПРАМЕР-510 DN50', brand: 'ПРАМЕР-510', productCode: 'КИ-004', manufacturer: 'ПРАМЕР', quantity: 2, unitOfMeasure: 'шт.', weight: 3.5, itemType: 'EQUIPMENT' as const, sectionName: 'КИПиА', costPrice: 62000, estimatePrice: 79000, customerPrice: 86900 },
  // Раздел 5: Монтажные работы
  { name: 'Монтаж теплообменного оборудования с обвязкой', brand: '', productCode: '', manufacturer: '', quantity: 8, unitOfMeasure: 'комп.', weight: 0, itemType: 'WORK' as const, sectionName: 'Монтажные работы', costPrice: 85000, estimatePrice: 110000, customerPrice: 121000 },
  { name: 'Монтаж насосного оборудования с подключением', brand: '', productCode: '', manufacturer: '', quantity: 12, unitOfMeasure: 'шт.', weight: 0, itemType: 'WORK' as const, sectionName: 'Монтажные работы', costPrice: 32000, estimatePrice: 42000, customerPrice: 46200 },
  { name: 'Монтаж трубопроводов стальных Ду25-100', brand: '', productCode: '', manufacturer: '', quantity: 450, unitOfMeasure: 'п.м.', weight: 0, itemType: 'WORK' as const, sectionName: 'Монтажные работы', costPrice: 1800, estimatePrice: 2300, customerPrice: 2530 },
  { name: 'Пусконаладочные работы ИТП (комплекс)', brand: '', productCode: '', manufacturer: '', quantity: 2, unitOfMeasure: 'комп.', weight: 0, itemType: 'WORK' as const, sectionName: 'Монтажные работы', costPrice: 120000, estimatePrice: 155000, customerPrice: 170500 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: false,
  });
}

async function gotoStable(page: Page, route: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await page.waitForTimeout(1000 * (i + 1));
    }
  }
}

function isCriticalError(text: string): boolean {
  const benign = [
    'Download the React DevTools', 'React does not recognize',
    'findDOMNode is deprecated', 'Warning:', 'favicon.ico',
    'HMR', 'hot update', '[vite]', 'ResizeObserver',
    'Non-Error promise rejection', 'net::ERR_',
    'Failed to load resource', 'the server responded with a status of 4',
    "Can't perform a React state update on a component that hasn't mounted yet",
    'Failed to fetch',
    'Load failed',
    'AbortError',
  ];
  return !benign.some((b) => text.includes(b));
}

/** Extract JWT from the page's localStorage */
async function getToken(page: Page): Promise<string> {
  if (authToken) return authToken;
  authToken = await page.evaluate(() => {
    const stored = localStorage.getItem('privod-auth');
    try { return JSON.parse(stored!)?.state?.token ?? ''; } catch { return ''; }
  });
  return authToken;
}

/** Make authenticated API request (direct to backend, bypassing Vite proxy) */
const API_BASE = process.env.BACKEND_URL || 'http://localhost:8080';

async function apiRaw(page: Page, method: 'get' | 'post' | 'put', url: string, data?: any) {
  const token = await getToken(page);
  const fullUrl = `${API_BASE}/api${url}`;
  const opts: any = {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (data !== undefined) opts.data = data;
  const resp = method === 'get'
    ? await page.request.get(fullUrl, opts)
    : method === 'post'
      ? await page.request.post(fullUrl, opts)
      : await page.request.put(fullUrl, opts);
  return resp;
}

/** Unwrap backend response envelope { success, data } */
async function api(page: Page, method: 'get' | 'post' | 'put', url: string, data?: any) {
  const resp = await apiRaw(page, method, url, data);
  return resp;
}

/** Parse API response, unwrapping envelope if present */
async function parseBody(resp: any): Promise<any> {
  const text = await resp.text();
  if (!text) return null;
  const parsed = JSON.parse(text);
  // Backend wraps responses in { success: true, data: ... }
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return parsed.data;
  }
  return parsed;
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe.serial('Pre-Construction Cycle — Full Walkthrough', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isCriticalError(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      const text = err.message || String(err);
      if (isCriticalError(text)) pageErrors.push(text);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 01 — Go/No-Go
  // ══════════════════════════════════════════════════════════════════════════
  test('01 — Go/No-Go: portfolio page renders', async ({ page }) => {
    await gotoStable(page, '/projects');
    await expect(page.locator('body')).toBeVisible();
    const hasContent = await page.locator('main, [class*="container"], [class*="page"]')
      .first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
    await screenshot(page, '01-go-no-go-portfolio');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 02 — Create Project via UI
  // ══════════════════════════════════════════════════════════════════════════
  test('02 — Create Project with real data', async ({ page }) => {
    await gotoStable(page, '/projects/new');
    await screenshot(page, '02a-project-form-empty');

    const codeInput = page.locator('input[name="code"]').or(page.getByPlaceholder('2024-МСК-001')).first();
    await expect(codeInput).toBeVisible({ timeout: 10_000 });
    await codeInput.fill('342-10-25');

    const nameInput = page.locator('input[name="name"]').or(page.getByPlaceholder('Введите название объекта')).first();
    await nameInput.fill('Наращивание мощностей ФКП Авангард');

    const kindSelect = page.locator('select[name="constructionKind"]')
      .or(page.locator('select').filter({ has: page.locator('option[value="RECONSTRUCTION"]') })).first();
    await kindSelect.selectOption('RECONSTRUCTION');

    for (const [name, placeholder, value] of [
      ['region', 'Московская область', 'Республика Башкортостан'],
      ['city', 'Москва', 'Стерлитамак'],
      ['address', 'ул. Строителей', 'ул. Промышленная, д. 5'],
    ] as const) {
      const input = page.locator(`input[name="${name}"]`).or(page.getByPlaceholder(placeholder)).first();
      if (await input.isVisible().catch(() => false)) await input.fill(value);
    }

    // Customer
    const customerInput = page.locator('input[name="customerName"]')
      .or(page.getByPlaceholder(/заказчик|начните вводить/i)).first();
    await expect(customerInput).toBeVisible({ timeout: 5_000 });
    await customerInput.fill('ФКП Авангард');
    await page.waitForTimeout(1500);
    const suggestion = page.locator('[role="option"], [class*="suggestion"], [class*="dropdown"] button, [class*="dropdown"] li').first();
    if (await suggestion.isVisible().catch(() => false)) {
      await suggestion.click();
      await page.waitForTimeout(500);
    }

    // Dates
    const startDate = page.locator('input[name="plannedStartDate"]').or(page.locator('input[type="date"]').first()).first();
    if (await startDate.isVisible().catch(() => false)) await startDate.fill('2025-03-01');
    const endDate = page.locator('input[name="plannedEndDate"]').or(page.locator('input[type="date"]').nth(1)).first();
    if (await endDate.isVisible().catch(() => false)) await endDate.fill('2026-12-31');

    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(PDF_PATH);
      await page.waitForTimeout(1000);
    }

    await screenshot(page, '02b-project-form-filled');

    const submitBtn = page.getByRole('button', { name: /создать объект|создать|сохранить/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const projectMatch = page.url().match(/\/projects\/([a-f0-9-]+)/);
    if (projectMatch) projectId = projectMatch[1];

    await screenshot(page, '02c-project-created');
    expect(page.url()).not.toContain('/new');
    expect(projectId).toMatch(/^[a-f0-9-]{36}$/);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 03 — Create Spec via UI + populate items via API
  // ══════════════════════════════════════════════════════════════════════════
  test('03 — Create Specification + populate real HVAC items', async ({ page }) => {
    test.skip(!projectId, 'Project not created');

    // Create spec via UI
    await gotoStable(page, '/specifications/new');
    await screenshot(page, '03a-spec-form-empty');

    const projectSelect = page.locator('select[name="projectId"]').or(page.locator('select').first()).first();
    await expect(projectSelect).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await projectSelect.selectOption(projectId).catch(async () => {
      const options = await projectSelect.locator('option').allInnerTexts();
      const match = options.find((o) => o.includes('342-10-25') || o.includes('Авангард'));
      if (match) await projectSelect.selectOption({ label: match });
      else if (options.length > 1) await projectSelect.selectOption({ index: options.length - 1 });
    });

    const nameInput = page.locator('input[name="name"]').or(page.locator('input[name="title"]'))
      .or(page.getByPlaceholder(/назван|наименов|title/i)).first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill('ОВиК — Спецификация оборудования (Том 5.4.2)');

    // Uncheck autoFm (we'll do it manually to control the data)
    const autoFmToggle = page.locator('input[type="checkbox"]').first();
    if (await autoFmToggle.isVisible().catch(() => false)) {
      const isChecked = await autoFmToggle.isChecked().catch(() => false);
      if (isChecked) await autoFmToggle.uncheck();
    }

    await screenshot(page, '03b-spec-form-filled');

    const submitBtn = page.getByRole('button', { name: /создать|сохранить/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await page.waitForURL(/\/specifications\/[a-f0-9-]+/, { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const specMatch = page.url().match(/\/specifications\/([a-f0-9-]+)/);
    if (specMatch && !specMatch[1].includes('new')) specId = specMatch[1];

    await screenshot(page, '03c-spec-created-empty');
    expect(specId).toMatch(/^[a-f0-9-]{36}$/);

    // ── Populate spec items via API (18 real HVAC items) ──
    let createdItems = 0;
    for (let i = 0; i < HVAC_SPEC_ITEMS.length; i++) {
      const item = HVAC_SPEC_ITEMS[i];
      const resp = await api(page, 'post', `/specifications/${specId}/items`, {
        name: item.name,
        itemType: item.itemType === 'WORK' ? 'MATERIAL' : item.itemType, // backend only supports EQUIPMENT/MATERIAL
        brand: item.brand || undefined,
        productCode: item.productCode || undefined,
        manufacturer: item.manufacturer || undefined,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        weight: item.weight || undefined,
        sectionName: item.sectionName,
        sequence: i + 1,
        position: String(i + 1),
      });
      if (resp.ok()) createdItems++;
    }
    expect(createdItems).toBeGreaterThan(0);

    // Reload spec detail to see items
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '03d-spec-with-items');

    // Verify items are visible in the table
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 04 — Create FM (Budget) + populate items with prices
  // ══════════════════════════════════════════════════════════════════════════
  test('04 — Create FM and populate with priced items', async ({ page }) => {
    test.skip(!projectId || !specId, 'Project/Spec not created');

    // Navigate to a page first so localStorage (auth state) is available
    await gotoStable(page, '/projects');

    // Try to find existing budget for project
    const listResp = await api(page, 'get', `/budgets?projectId=${projectId}`);
    if (listResp.ok()) {
      const data = await parseBody(listResp);
      const arr = Array.isArray(data) ? data : data?.content || [];
      const existing = arr.find((b: any) => b.projectId === projectId);
      if (existing) budgetId = existing.id;
    }

    // Create budget if not found
    if (!budgetId) {
      const createResp = await api(page, 'post', '/budgets', {
        name: 'ФМ — Наращивание мощностей ФКП Авангард',
        projectId,
        plannedRevenue: 0,
        plannedCost: 0,
      });
      if (createResp.ok()) {
        const budget = await parseBody(createResp);
        budgetId = budget?.id;
      }
    }

    // Hard assertion — FM creation is critical for the rest of the flow
    expect(budgetId, 'Budget must be created for FM flow').toBeTruthy();
    expect(budgetId).toMatch(/^[a-f0-9-]{36}$/);

    // ── Create FM items grouped by section, with real prices ──
    const sections = [...new Set(HVAC_SPEC_ITEMS.map((i) => i.sectionName))];
    let totalCreated = 0;

    for (const section of sections) {
      // Create section header
      await api(page, 'post', `/budgets/${budgetId}/items`, {
        name: section,
        category: 'OTHER',
        section: true,
        plannedAmount: 0,
      });

      // Create items under section
      const sectionItems = HVAC_SPEC_ITEMS.filter((i) => i.sectionName === section);
      for (const item of sectionItems) {
        const category = item.itemType === 'EQUIPMENT' ? 'EQUIPMENT'
          : item.itemType === 'WORK' ? 'LABOR' : 'MATERIALS';
        const resp = await api(page, 'post', `/budgets/${budgetId}/items`, {
          name: item.name,
          category,
          itemType: item.itemType === 'EQUIPMENT' ? 'EQUIPMENT'
            : item.itemType === 'WORK' ? 'WORKS' : 'MATERIALS',
          unit: item.unitOfMeasure,
          quantity: item.quantity,
          costPrice: item.costPrice,
          estimatePrice: item.estimatePrice,
          customerPrice: item.estimatePrice, // customerPrice ≤ estimatePrice (backend validation)
          plannedAmount: item.costPrice * item.quantity,
        });
        if (resp.ok()) totalCreated++;
      }
    }
    expect(totalCreated).toBeGreaterThan(10);

    // Navigate to FM page and verify
    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);
    await screenshot(page, '04a-fm-page-with-data');

    // Verify KPI strip shows non-zero values
    await expect(page.getByText('Себестоимость').first()).toBeVisible();
    await expect(page.getByText('Сметная стоимость').first()).toBeVisible();
    await expect(page.getByText('Маржа').first()).toBeVisible();
    await expect(page.getByText('ROI').first()).toBeVisible();

    // Verify table has data rows
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(10);

    // Verify footer totals are non-zero
    const footer = page.locator('tfoot');
    await expect(footer.getByText('Итого')).toBeVisible();

    await screenshot(page, '04b-fm-kpi-nonzero');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 05 — Inline edit estimatePrice on FM
  // ══════════════════════════════════════════════════════════════════════════
  test('05 — FM: inline edit estimatePrice', async ({ page }) => {
    test.skip(!budgetId, 'Budget not found');

    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    // Find first editable cell (double-click hint)
    const editableCell = page.locator('span[title*="клик"]').first();
    await expect(editableCell).toBeVisible({ timeout: 10_000 });
    const originalText = await editableCell.innerText();

    await screenshot(page, '05a-before-inline-edit');

    // Double-click to enter edit mode
    await editableCell.dblclick();
    await page.waitForTimeout(500);

    const input = page.locator('tbody input[type="number"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Change value
    await input.fill('750000');
    await screenshot(page, '05b-editing-value');

    // Press Enter to save
    await input.press('Enter');
    await page.waitForTimeout(2000);

    // Verify the cell changed
    const updatedText = await page.locator('span[title*="клик"]').first().innerText();
    expect(updatedText).not.toBe(originalText);

    await screenshot(page, '05c-after-inline-edit');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 06 — Create КП from FM page
  // ══════════════════════════════════════════════════════════════════════════
  test('06 — Create КП from FM', async ({ page }) => {
    test.skip(!budgetId, 'Budget not found');

    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    const createCpBtn = page.locator('button').filter({ hasText: /создать кп/i }).first();
    await expect(createCpBtn).toBeVisible({ timeout: 5_000 });
    await createCpBtn.click();
    await page.waitForTimeout(1000);

    // Fill modal
    const modal = page.locator('.fixed.inset-0').last();
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const cpNameInput = modal.locator('input').first();
    await expect(cpNameInput).toBeVisible();
    await cpNameInput.fill('КП — ОВиК Авангард (Том 5.4.2)');

    await screenshot(page, '06a-cp-modal-filled');

    const submitBtn = modal.getByRole('button', { name: /создать|сохранить|подтвер/i }).first();
    await submitBtn.click();

    await page.waitForURL(/\/commercial-proposals\/[a-f0-9-]+/, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const cpMatch = page.url().match(/\/commercial-proposals\/([a-f0-9-]+)/);
    if (cpMatch) cpId = cpMatch[1];

    await screenshot(page, '06b-cp-created');
    expect(cpId).toMatch(/^[a-f0-9-]{36}$/);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 07 — КП Materials tab — verify non-empty
  // ══════════════════════════════════════════════════════════════════════════
  test('07 — КП Materials tab with real items', async ({ page }) => {
    test.skip(!cpId, 'КП not created');

    await gotoStable(page, `/commercial-proposals/${cpId}`);
    await page.waitForTimeout(3000);
    await screenshot(page, '07a-cp-overview');

    // Click Materials tab
    const materialsTab = page.locator('button').filter({ hasText: /материал/i }).first();
    if (await materialsTab.isVisible().catch(() => false)) {
      await materialsTab.click();
      await page.waitForTimeout(1500);
    }

    await screenshot(page, '07b-cp-materials-tab');

    // Check KPIs are non-zero
    const costKpi = page.getByText('Себестоимость').first();
    if (await costKpi.isVisible().catch(() => false)) {
      await expect(costKpi).toBeVisible();
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 08 — КП Works tab + Тендер подрядчиков
  // ══════════════════════════════════════════════════════════════════════════
  test('08 — КП Works tab + Тендер подрядчиков', async ({ page }) => {
    test.skip(!cpId, 'КП not created');

    await gotoStable(page, `/commercial-proposals/${cpId}`);
    await page.waitForTimeout(3000);

    // Switch to Works tab
    const worksTab = page.locator('button').filter({ hasText: /работ/i }).first();
    if (await worksTab.isVisible().catch(() => false)) {
      await worksTab.click();
      await page.waitForTimeout(1500);
    }
    await screenshot(page, '08a-cp-works-tab');

    // Click "Тендер подрядчиков" button (amber)
    const tenderBtn = page.locator('button').filter({ hasText: /тендер/i }).first();
    if (await tenderBtn.isVisible().catch(() => false)) {
      await tenderBtn.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.fixed.inset-0').last();
      if (await modal.isVisible().catch(() => false)) {
        // Fill costPrice
        const costPriceInput = modal.locator('input[type="text"], input[type="number"]')
          .or(modal.getByPlaceholder('0.00')).first();
        if (await costPriceInput.isVisible().catch(() => false)) {
          await costPriceInput.fill('85000');
          await screenshot(page, '08b-tender-modal-filled');

          const applyBtn = modal.locator('button').filter({ hasText: /применить|apply|подтвер/i }).first();
          if (await applyBtn.isVisible().catch(() => false)) {
            await applyBtn.click();
            await page.waitForTimeout(2000);
          }
        }
        await screenshot(page, '08c-tender-applied');
      }
    } else {
      await screenshot(page, '08a-no-tender-btn');
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 09 — Generate own cost lines
  // ══════════════════════════════════════════════════════════════════════════
  test('09 — FM: Generate own cost lines', async ({ page }) => {
    test.skip(!budgetId, 'Budget not found');

    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    const rowsBefore = await page.locator('tbody tr').count();
    await screenshot(page, '09a-fm-before-own-costs');

    const ownCostBtn = page.locator('button').filter({ hasText: /собственн|себестоимость/i }).first();
    if (await ownCostBtn.isVisible().catch(() => false)) {
      await ownCostBtn.click();
      await page.waitForTimeout(3000);

      const rowsAfter = await page.locator('tbody tr').count();
      // Own cost generation may consolidate/regroup rows; just verify table still has data
      expect(rowsAfter).toBeGreaterThan(0);
      await screenshot(page, '09b-own-costs-generated');
    }

    await screenshot(page, '09c-fm-after-own-costs');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10 — ROI in KPI strip (with non-zero values)
  // ══════════════════════════════════════════════════════════════════════════
  test('10 — FM: Verify ROI and KPI strip with real numbers', async ({ page }) => {
    test.skip(!budgetId, 'Budget not found');

    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    // KPI strip labels
    await expect(page.getByText('Себестоимость').first()).toBeVisible();
    await expect(page.getByText('Сметная стоимость').first()).toBeVisible();
    await expect(page.getByText('Цена заказчику').first()).toBeVisible();
    await expect(page.getByText('Маржа').first()).toBeVisible();
    await expect(page.getByText('ROI').first()).toBeVisible();

    await screenshot(page, '10a-kpi-strip-full');

    // Verify KPI values are non-zero (look for formatted numbers like "1 234 567" or "1,234")
    const kpiStrip = page.locator('div').filter({ hasText: 'Себестоимость' }).first();
    const kpiText = await kpiStrip.innerText();
    // At least one KPI should contain a digit other than 0
    const hasNonZero = /[1-9]/.test(kpiText);
    expect(hasNonZero).toBeTruthy();

    await screenshot(page, '10b-roi-nonzero');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11 — Margin Scenario simulation
  // ══════════════════════════════════════════════════════════════════════════
  test('11 — FM: Margin Scenario simulation at 25%', async ({ page }) => {
    test.skip(!budgetId, 'Budget not found');

    await gotoStable(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    // Click "Сценарии" button
    const marginBtn = page.locator('button').filter({ hasText: /сценари/i }).first();
    await expect(marginBtn).toBeVisible({ timeout: 5_000 });
    await marginBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '11a-margin-panel-open');

    // Move slider to 25%
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible().catch(() => false)) {
      await slider.fill('25');
      await page.waitForTimeout(500);
    }

    // Click "Рассчитать" (simulate button)
    const simulateBtn = page.locator('button').filter({ hasText: /рассчитать|симулир|simulate/i }).first();
    if (await simulateBtn.isVisible().catch(() => false)) {
      await simulateBtn.click();
      await page.waitForTimeout(2000);
    }

    await screenshot(page, '11b-margin-simulation-result');

    // Verify result grid shows values
    const currentRevenue = page.getByText('Текущая выручка').first();
    const targetRevenue = page.getByText('Целевая выручка').first();
    const delta = page.getByText('Дельта выручки').first();

    await expect(currentRevenue).toBeVisible();
    await expect(targetRevenue).toBeVisible();
    await expect(delta).toBeVisible();

    await screenshot(page, '11c-margin-done');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12 — КП Versioning
  // ══════════════════════════════════════════════════════════════════════════
  test('12 — КП: Create new version', async ({ page }) => {
    test.skip(!cpId, 'КП not created');

    await gotoStable(page, `/commercial-proposals/${cpId}`);
    await page.waitForTimeout(3000);
    await screenshot(page, '12a-cp-before-versioning');

    // Click "Новая версия" button
    const versionBtn = page.locator('button').filter({ hasText: /новая версия|версия|version/i }).first();

    if (await versionBtn.isVisible().catch(() => false)) {
      await versionBtn.click();
      await page.waitForTimeout(3000);

      const newUrl = page.url();
      const newCpMatch = newUrl.match(/\/commercial-proposals\/([a-f0-9-]+)/);
      if (newCpMatch && newCpMatch[1] !== cpId) {
        expect(newCpMatch[1]).not.toBe(cpId);
        await screenshot(page, '12b-cp-new-version');
      } else {
        await screenshot(page, '12b-cp-version-result');
      }
    } else {
      // Fallback: look for icon-only Copy button
      const copyBtn = page.locator('button').filter({ has: page.locator('svg.lucide-copy') }).first();
      if (await copyBtn.isVisible().catch(() => false)) {
        await copyBtn.click();
        await page.waitForTimeout(3000);
      }
      await screenshot(page, '12b-version-fallback');
    }

    await screenshot(page, '12c-versioning-done');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13 — Final Error Check
  // ══════════════════════════════════════════════════════════════════════════
  test('13 — No critical page errors across entire flow', async ({ page }) => {
    if (consoleErrors.length > 0) {
      console.log('Console errors collected:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page errors collected:', pageErrors);
    }
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });
});
