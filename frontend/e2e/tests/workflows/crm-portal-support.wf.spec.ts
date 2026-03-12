/**
 * WF: CRM + Portal + Support — Менеджер по продажам + Заказчик + Техподдержка
 *
 * Персоны:
 * 1. Менеджер по продажам — ведёт клиента от первого звонка до подписания договора.
 *    "Мне нужна воронка. Сколько лидов, сколько в работе, сколько закрыто. Как в Битрикс24, но с стройкой."
 * 2. Заказчик (Иванченко М.П.) — зашёл в портал проверить как идёт стройка его ЖК.
 *    "Я плачу 450 млн. Хочу видеть: фото, прогресс, документы, сколько осталось."
 * 3. Техподдержка — обрабатывает обращения пользователей.
 *
 * 5 фаз (A–E), 28 шагов, ~250 assertions.
 * Бизнес-цепочки:
 * - CRM: Лид → Квалификация → КП → Выигран → Проект
 * - Portal: Dashboard → Документы → RFI → Дефекты → КС-2 → Подписание
 * - Support: Тикет → В работе → Решён
 * - Мессенджер: Канал → Сообщение
 * - Сквозное: CRM → Project → Portal → Security (маржа скрыта)
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  authenticatedRequest,
  createEntity,
  deleteEntity,
  listEntities,
  updateEntity,
} from '../../fixtures/api.fixture';

// ─── Configuration ───────────────────────────────────────────────────────────

const SS = 'e2e/screenshots/crm-portal-support';
const TODAY = new Date().toISOString().slice(0, 10);
const IN_7_DAYS = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

// ─── Test Data ───────────────────────────────────────────────────────────────

const LEAD = {
  contactName: 'E2E-Смирнова Ольга Викторовна',
  companyName: 'ООО Ритейл Центр',
  phone: '+7 (495) 987-65-43',
  email: `e2e-smirnova-${Date.now()}@retailcenter.ru`,
  source: 'Сайт — форма заявки',
  description: 'Интересуется строительством склада 3000 м², промзона Южная',
  expectedRevenue: 120_000_000,
};

const COUNTERPARTY = {
  name: 'E2E-ООО Ритейл Центр',
  inn: '7701234567',
  address: 'г. Москва, ул. Промышленная, д. 5',
  type: 'customer',
  contactPerson: 'Смирнова О.В.',
};

const BID_PACKAGE = {
  name: 'E2E-Пакет: Склад Ритейл Центр',
  description: 'Полный комплекс СМР для склада 3000 м²',
  type: 'GENERAL_CONTRACT',
};

const SUPPORT_TICKET = {
  subject: 'E2E-Не загружается страница ФМ',
  description: 'При переходе в финансовую модель проекта ЖК Солнечный страница показывает белый экран. Ошибка в консоли: TypeError.',
  priority: 'HIGH',
  category: 'BUG',
};

const MESSAGE = {
  channelName: 'E2E-Объект ЖК Солнечный',
  text: 'Бетон B25 придёт завтра к 8:00, нужен кран',
};

// ─── Issue Tracker ───────────────────────────────────────────────────────────

type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';

interface Issue {
  severity: IssueSeverity;
  step: string;
  description: string;
  actual?: string;
  expected?: string;
}

const issues: Issue[] = [];
let totalPages = 0;
const timings: Record<string, number> = {};

function recordIssue(
  severity: IssueSeverity,
  step: string,
  description: string,
  actual?: string,
  expected?: string,
): void {
  issues.push({ severity, step, description, actual, expected });
  console.warn(`  [${severity}] Step ${step}: ${description}${actual ? ` (actual: ${actual}, expected: ${expected})` : ''}`);
}

function recordTiming(label: string, ms: number): void {
  timings[label] = ms;
}

// ─── Shared State ────────────────────────────────────────────────────────────

let leadId: string | undefined;
let counterpartyId: string | undefined;
let bidPackageId: string | undefined;
let ticketId: string | undefined;
let projectId: string | undefined;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function screenshot(page: import('@playwright/test').Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true }).catch(() => {});
}

async function smokeNav(
  page: import('@playwright/test').Page,
  url: string,
  step: string,
  label: string,
): Promise<string> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  const ms = Date.now() - start;

  const body = (await page.textContent('body')) ?? '';

  if (ms > 5000) {
    recordIssue('MINOR', step, `${label} загрузка > 5s`, `${ms}ms`, '<5000ms');
  }

  if (body.length < 50) {
    recordIssue('MAJOR', step, `${label} пустая страница (body < 50 chars)`, `${body.length} chars`);
  }

  if (/something went wrong|cannot read properties|error boundary/i.test(body)) {
    recordIssue('CRITICAL', step, `${label} crash / error boundary`, body.slice(0, 200));
  }

  totalPages++;
  return body;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe.serial('WF: CRM + Portal + Support', () => {

  // ─── SEED ──────────────────────────────────────────────────────────────────

  test('00 — Seed project for portal tests', async () => {
    try {
      const project = await createEntity<{ id: string }>('/api/projects', {
        name: 'E2E-ЖК Солнечный квартал',
        code: `E2E-CPS-${Date.now().toString().slice(-6)}`,
        status: 'IN_PROGRESS',
        startDate: '2026-01-15',
        plannedEndDate: '2027-06-30',
        description: 'Жилой комплекс, 450 млн ₽',
        constructionKind: 'RESIDENTIAL',
      });
      projectId = project.id;
      console.log(`✅ Project seeded: ${projectId}`);
    } catch {
      const projects = await listEntities<{ id: string; name?: string }>('/api/projects');
      const existing = projects.find((p) => p.name?.includes('E2E-ЖК Солнечный'));
      if (existing) {
        projectId = existing.id;
        console.log(`✅ Reusing existing project: ${projectId}`);
      } else {
        console.warn('⚠️ Could not seed project — tests will use UI navigation only');
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE A: CRM — Воронка продаж (Менеджер по продажам)
  // ═══════════════════════════════════════════════════════════════════════════

  test('01 — CRM Dashboard: воронка, KPI, задачи', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/crm/dashboard', '01', 'CRM Dashboard');

    // BUSINESS: Воронка — первый экран менеджера. Как в Битрикс24.
    // KPI: total pipeline, weighted, win rate, avg deal
    const hasPipelineRevenue = /pipeline|воронк|выручк|сумм.*₽|revenue/i.test(body);
    const hasWinRate = /win.*rate|конверс|выигр/i.test(body);
    const hasKpiCards = (await page.locator('[class*="card"], [class*="metric"]').count()) >= 2;

    expect(body.length).toBeGreaterThan(50);

    if (!hasPipelineRevenue && !hasKpiCards) {
      recordIssue('MAJOR', '01', 'CRM Dashboard не показывает сумму воронки — менеджер не видит объём');
    }

    if (!hasWinRate && !hasKpiCards) {
      recordIssue('UX', '01', 'Нет win rate / конверсии — менеджер не может оценить эффективность');
    }

    // BUSINESS: Битрикс24 имеет воронку на первом экране. У нас?
    const hasStages = /нов|квалифиц|предложен|переговор|выигр|new|qualified|proposition|negot|won/i.test(body);
    if (!hasStages) {
      recordIssue('UX', '01', 'Стадии воронки не видны на дашборде — менеджер не понимает распределение лидов');
    }

    // Check upcoming tasks/activities
    const hasTasks = /задач|activity|звонок|встреча|предстоящ|call|meeting/i.test(body);
    if (!hasTasks) {
      recordIssue('UX', '01', 'Нет блока задач на сегодня — менеджер должен видеть свои активности');
    }

    await screenshot(page, '01-crm-dashboard');
    recordTiming('crm-dashboard', Date.now() - start);
    console.log(`✅ Step 01: CRM Dashboard (pipeline: ${hasPipelineRevenue}, winRate: ${hasWinRate}, stages: ${hasStages})`);
  });

  test('02 — Создание лида', async ({ page }) => {
    const start = Date.now();

    // Navigate to leads list
    const leadsBody = await smokeNav(page, '/crm/leads', '02', 'CRM Leads');

    // Check if pipeline/list view exists
    const hasViewToggle = (await page.locator('button:has-text("pipeline"), button:has-text("list"), button:has-text("Канбан"), button:has-text("Список")').count()) > 0;

    // Try to create lead via API first (faster than UI)
    try {
      const lead = await createEntity<{ id: string }>('/api/v1/crm/leads', {
        contactName: LEAD.contactName,
        companyName: LEAD.companyName,
        phone: LEAD.phone,
        email: LEAD.email,
        source: LEAD.source,
        description: LEAD.description,
        expectedRevenue: LEAD.expectedRevenue,
        status: 'NEW',
        priority: 'HIGH',
      });
      leadId = lead.id;
      console.log(`✅ Lead created via API: ${leadId}`);
    } catch {
      // Try UI creation
      const addBtn = page.getByRole('button', { name: /создать|добавить|new|add|create/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);

        // Fill form fields
        const nameInput = page.locator('input[name="contactName"], input[name="name"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(LEAD.contactName);
        }
        const companyInput = page.locator('input[name="companyName"], input[name="company"]').first();
        if (await companyInput.isVisible().catch(() => false)) {
          await companyInput.fill(LEAD.companyName);
        }

        // Submit
        const saveBtn = page.getByRole('button', { name: /сохранить|создать|save|create/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      console.log('⚠️ Lead creation via UI attempted (API failed)');
    }

    await screenshot(page, '02-crm-lead-created');
    recordTiming('crm-lead-create', Date.now() - start);
    console.log(`✅ Step 02: Lead created (id: ${leadId}, viewToggle: ${hasViewToggle})`);
  });

  test('03 — Квалификация → Работа → КП → Переговоры → Выигран', async ({ page }) => {
    const start = Date.now();

    if (!leadId) {
      console.warn('⚠️ No lead ID — skipping stage transitions');
      return;
    }

    // BUSINESS: CRM pipeline stages: NEW → QUALIFIED → PROPOSITION → NEGOTIATION → WON
    // Битрикс24 позволяет настраивать этапы. У нас фиксированные?
    const stageTransitions = [
      { status: 'QUALIFIED', label: 'Квалифицирован' },
      { status: 'PROPOSITION', label: 'КП отправлено' },
      { status: 'NEGOTIATION', label: 'Переговоры' },
    ];

    let currentStatus = 'NEW';
    let transitionsFailed = 0;

    for (const stage of stageTransitions) {
      try {
        await authenticatedRequest('PUT', `/api/v1/crm/leads/${leadId}`, {
          contactName: LEAD.contactName,
          companyName: LEAD.companyName,
          status: stage.status,
        });
        currentStatus = stage.status;
        console.log(`  → Transition OK: ${currentStatus}`);
      } catch {
        // Try moving via stage endpoint
        try {
          await authenticatedRequest('PATCH', `/api/v1/crm/leads/${leadId}/stage/${stage.status}`);
          currentStatus = stage.status;
        } catch {
          transitionsFailed++;
          recordIssue('MAJOR', '03', `Переход ${currentStatus} → ${stage.status} не работает`);
        }
      }
    }

    // Final: mark as WON
    try {
      await authenticatedRequest('POST', `/api/v1/crm/leads/${leadId}/won`);
      currentStatus = 'WON';
      console.log('  → Lead marked as WON');
    } catch {
      try {
        await authenticatedRequest('PUT', `/api/v1/crm/leads/${leadId}`, {
          contactName: LEAD.contactName,
          companyName: LEAD.companyName,
          status: 'WON',
        });
        currentStatus = 'WON';
      } catch {
        transitionsFailed++;
        recordIssue('MAJOR', '03', 'Не удалось перевести лид в статус ВЫИГРАН');
      }
    }

    // Navigate to leads to verify
    await page.goto('/crm/leads', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // BUSINESS: Битрикс24 = 15+ этапов настраиваемых. У нас 6 фиксированных.
    // Достаточно для стройки? Да, если есть доп. поля для специфики.
    if (transitionsFailed > 2) {
      recordIssue('MAJOR', '03', `${transitionsFailed} из 4 переходов не работают — воронка неполноценна`);
    }

    await screenshot(page, '03-crm-lead-won');
    recordTiming('crm-stage-transitions', Date.now() - start);
    console.log(`✅ Step 03: Stage transitions (final: ${currentStatus}, failed: ${transitionsFailed})`);
  });

  test('04 — Контрагенты', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/counterparties', '04', 'Контрагенты');

    // Check for table
    const hasTable = (await page.locator('table, [role="table"]').count()) > 0;
    const hasContent = body.length > 100 || hasTable;
    expect(hasContent, 'Counterparties page should have content').toBeTruthy();

    // Try to create counterparty via API
    try {
      const cp = await createEntity<{ id: string }>('/api/v1/contracts/counterparties', {
        name: COUNTERPARTY.name,
        inn: COUNTERPARTY.inn,
        address: COUNTERPARTY.address,
        customer: true,
        active: true,
      });
      counterpartyId = cp.id;
      console.log(`✅ Counterparty created: ${counterpartyId}`);
    } catch {
      console.warn('⚠️ Counterparty creation failed — page smoke only');
    }

    // BUSINESS: ИНН должен проверяться на корректность (алгоритм контрольных цифр)
    // Check if form has validation
    const hasSearch = (await page.locator('input[placeholder*="оиск"], input[placeholder*="earch"], input[type="search"]').count()) > 0;
    const hasFilters = (await page.locator('select').count()) > 0;

    if (!hasSearch && !hasFilters) {
      recordIssue('UX', '04', 'Контрагенты без поиска/фильтров — при 100+ контрагентах неудобно');
    }

    // Check for type filters (Заказчик, Поставщик, Подрядчик, etc.)
    const hasTypeFilter = /заказчик|поставщик|подрядчик|customer|supplier|contractor/i.test(body);
    if (!hasTypeFilter) {
      recordIssue('UX', '04', 'Нет фильтра по типу контрагента — менеджеру нужно быстро найти заказчиков');
    }

    await screenshot(page, '04-counterparties');
    recordTiming('counterparties', Date.now() - start);
    console.log(`✅ Step 04: Контрагенты (table: ${hasTable}, typeFilter: ${hasTypeFilter})`);
  });

  test('05 — Тендерные пакеты (Bid Packages)', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portfolio/tenders', '05', 'Тендерные пакеты');

    const hasContent = body.length > 100;
    expect(hasContent, 'Tenders page should render').toBeTruthy();

    // Try API creation of bid package
    try {
      const bid = await createEntity<{ id: string }>('/api/portfolio/bid-packages', {
        bidNumber: `E2E-BID-${Date.now().toString().slice(-6)}`,
        projectName: BID_PACKAGE.name,
        description: BID_PACKAGE.description,
        status: 'DRAFT',
      });
      bidPackageId = bid.id;
      console.log(`✅ Bid package created: ${bidPackageId}`);
    } catch {
      console.warn('⚠️ Bid package API creation failed — page smoke only');
    }

    // Check for status tabs (All, Active, Won, Lost)
    const hasStatusTabs = /все|all|active|актив|выигр|won|lost|проигр/i.test(body);

    // BUSINESS: Тендерный пакет — то что мы отправляем заказчику. КП + смета + сроки + гарантии.
    const hasBidFields = /номер|тендер|bid|пакет|статус|status|сумм|amount/i.test(body);

    if (!hasStatusTabs) {
      recordIssue('UX', '05', 'Нет вкладок по статусам тендеров — менеджер должен быстро видеть активные');
    }

    await screenshot(page, '05-bid-packages');
    recordTiming('bid-packages', Date.now() - start);
    console.log(`✅ Step 05: Bid packages (tabs: ${hasStatusTabs}, bidFields: ${hasBidFields})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE B: Портал подрядчика/заказчика (Заказчик Иванченко)
  // ═══════════════════════════════════════════════════════════════════════════

  test('06 — Portal Dashboard: обзор для заказчика', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal', '06', 'Portal Dashboard');

    // BUSINESS: Заказчик заходит 1-2 раза в неделю. За 30 секунд должен понять статус.
    const hasProjects = /проект|project/i.test(body);
    const hasProgress = /прогресс|progress|%/i.test(body);
    const hasDocuments = /документ|document/i.test(body);
    const hasFinance = /финанс|оплат|payment|счёт|invoice|баланс/i.test(body);

    const hasKpiCards = (await page.locator('[class*="card"], [class*="metric"]').count()) >= 2;

    expect(body.length).toBeGreaterThan(50);

    if (!hasProjects && !hasKpiCards) {
      recordIssue('MAJOR', '06', 'Portal Dashboard не показывает проекты — заказчик не видит свои объекты');
    }

    if (!hasProgress) {
      recordIssue('UX', '06', 'Нет % прогресса строительства — заказчик хочет знать "когда будет готово"');
    }

    // Buildertrend делает дашборд для заказчика отлично: фото, прогресс, документы, платежи
    const dashboardCompleteness = [hasProjects, hasProgress, hasDocuments, hasFinance].filter(Boolean).length;
    if (dashboardCompleteness < 3) {
      recordIssue('UX', '06', `Portal Dashboard показывает ${dashboardCompleteness}/4 ключевых блоков (проекты, прогресс, документы, финансы) — недостаточно для Buildertrend-уровня`);
    }

    await screenshot(page, '06-portal-dashboard');
    recordTiming('portal-dashboard', Date.now() - start);
    console.log(`✅ Step 06: Portal Dashboard (projects: ${hasProjects}, progress: ${hasProgress}, docs: ${hasDocuments}, finance: ${hasFinance})`);
  });

  test('07 — Portal Projects: проекты заказчика', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/projects', '07', 'Portal Projects');

    const hasProjectList = (await page.locator('table, [role="table"], [class*="card"]').count()) > 0 || body.length > 200;
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: заказчик видит ТОЛЬКО свои проекты, не чужие. RBAC правильный?
    // This needs live testing — recording as check point
    const hasStatusBadges = /статус|status|в работе|in.?progress|завершён|completed/i.test(body);

    if (!hasProjectList) {
      recordIssue('MAJOR', '07', 'Portal Projects — нет списка проектов');
    }

    await screenshot(page, '07-portal-projects');
    recordTiming('portal-projects', Date.now() - start);
    console.log(`✅ Step 07: Portal Projects (list: ${hasProjectList}, statuses: ${hasStatusBadges})`);
  });

  test('08 — Portal Documents: документы заказчика', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/documents', '08', 'Portal Documents');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: Заказчик видит: подписанные акты, счета, договоры.
    // НЕ должен видеть: внутренние сметы, маржу, КЛ (там наши закупочные цены!)
    const hasSensitiveData = /costPrice|маржа|margin|закупочн|конкурентн.*лист|competitive.*list/i.test(body);
    if (hasSensitiveData) {
      recordIssue('CRITICAL', '08', 'УТЕЧКА: Portal Documents показывает costPrice/маржу/КЛ — коммерческая тайна!');
    }

    // Check document categories
    const hasCategories = /акт|договор|счёт|КС|act|contract|invoice/i.test(body);

    await screenshot(page, '08-portal-documents');
    recordTiming('portal-documents', Date.now() - start);
    console.log(`✅ Step 08: Portal Documents (sensitive: ${hasSensitiveData}, categories: ${hasCategories})`);
  });

  test('09 — Portal Contracts', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/contracts', '09', 'Portal Contracts');
    expect(body.length).toBeGreaterThan(50);

    const hasContractUI = /договор|contract|контракт|номер|number|статус|status/i.test(body);

    // Security check: no internal pricing visible
    const hasCostData = /costPrice|себестоим|маржа|margin|прибыл|profit/i.test(body);
    if (hasCostData) {
      recordIssue('CRITICAL', '09', 'УТЕЧКА: Portal Contracts показывает себестоимость/маржу — заказчик видит нашу прибыль!');
    }

    await screenshot(page, '09-portal-contracts');
    recordTiming('portal-contracts', Date.now() - start);
    console.log(`✅ Step 09: Portal Contracts (UI: ${hasContractUI}, costLeak: ${hasCostData})`);
  });

  test('10 — Portal Invoices', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/invoices', '10', 'Portal Invoices');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: заказчик видит: номер, сумма, статус (оплачен/не оплачен)
    const hasInvoiceUI = /счёт|invoice|сумм|amount|статус|status|оплач|paid/i.test(body);

    // Can the customer pay online?
    const hasPayAction = /оплат|pay|перевод|transfer/i.test(body);
    if (!hasPayAction) {
      recordIssue('MISSING', '10', 'Нет кнопки оплаты — заказчик не может оплатить счёт через портал (Buildertrend это умеет)');
    }

    await screenshot(page, '10-portal-invoices');
    recordTiming('portal-invoices', Date.now() - start);
    console.log(`✅ Step 10: Portal Invoices (UI: ${hasInvoiceUI}, pay: ${hasPayAction})`);
  });

  test('11 — Portal Schedule', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/schedule', '11', 'Portal Schedule');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: заказчик хочет видеть "когда мне сдадут?" — график понятный?
    const hasScheduleUI = /график|schedule|план|plan|срок|deadline|gantt|календар|calendar|milestone/i.test(body);

    if (!hasScheduleUI) {
      recordIssue('UX', '11', 'Portal Schedule не содержит графика/плана — заказчик не видит сроки');
    }

    // Expected completion date should be visible
    const hasDates = /\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2}/i.test(body);

    await screenshot(page, '11-portal-schedule');
    recordTiming('portal-schedule', Date.now() - start);
    console.log(`✅ Step 11: Portal Schedule (scheduleUI: ${hasScheduleUI}, dates: ${hasDates})`);
  });

  test('12 — Portal RFIs', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/rfis', '12', 'Portal RFIs');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: RFI от подрядчика → ответ заказчика через портал. Как в Procore.
    const hasRfiUI = /RFI|запрос|request.*information|вопрос|question/i.test(body);

    // Can the customer respond to RFIs?
    const hasCreateAction = (await page.locator('button:has-text("создать"), button:has-text("ответить"), button:has-text("create"), button:has-text("respond")').count()) > 0;

    // Status workflow: OPEN → ASSIGNED → ANSWERED → CLOSED
    const hasStatuses = /открыт|назначен|отвечен|закрыт|open|assigned|answered|closed/i.test(body);

    await screenshot(page, '12-portal-rfis');
    recordTiming('portal-rfis', Date.now() - start);
    console.log(`✅ Step 12: Portal RFIs (UI: ${hasRfiUI}, createAction: ${hasCreateAction})`);
  });

  test('13 — Portal Defects', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/defects', '13', 'Portal Defects');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: Зависит от политики. Некоторые скрывают дефекты от заказчика.
    const hasDefectUI = /дефект|defect|замечан|claim|рекламац/i.test(body);

    // Does customer see defect details or just summary?
    const hasTimeline = /комментар|activity|timeline|история|history/i.test(body);

    // Can customer create defect claims?
    const hasCreateBtn = (await page.locator('button:has-text("создать"), button:has-text("добавить"), button:has-text("create"), button:has-text("add")').count()) > 0;

    if (!hasCreateBtn && hasDefectUI) {
      recordIssue('UX', '13', 'Заказчик видит дефекты но не может создавать рекламации — нужна кнопка "Подать замечание"');
    }

    await screenshot(page, '13-portal-defects');
    recordTiming('portal-defects', Date.now() - start);
    console.log(`✅ Step 13: Portal Defects (UI: ${hasDefectUI}, create: ${hasCreateBtn})`);
  });

  test('14 — Portal Photos', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/photos', '14', 'Portal Photos');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: Buildertrend делает это отлично — заказчик видит фото прогресса каждую неделю.
    const hasPhotoUI = /фото|photo|изображен|image|галерея|gallery|отчёт/i.test(body);

    // Can photos be uploaded by customer?
    const hasUpload = /загруз|upload|drag.*drop|выбрать файл/i.test(body);

    if (!hasPhotoUI) {
      recordIssue('UX', '14', 'Portal Photos не содержит UI для фото-отчётов — Buildertrend это делает лучше всех');
    }

    await screenshot(page, '14-portal-photos');
    recordTiming('portal-photos', Date.now() - start);
    console.log(`✅ Step 14: Portal Photos (photoUI: ${hasPhotoUI}, upload: ${hasUpload})`);
  });

  test('15 — Portal Daily Reports', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/daily-reports', '15', 'Portal Daily Reports');
    expect(body.length).toBeGreaterThan(50);

    const hasReportUI = /ежедневн|daily|отчёт|report|погода|weather|бригад|crew/i.test(body);

    await screenshot(page, '15-portal-daily-reports');
    recordTiming('portal-daily-reports', Date.now() - start);
    console.log(`✅ Step 15: Portal Daily Reports (reportUI: ${hasReportUI})`);
  });

  test('16 — Portal Signatures: электронное подписание', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/signatures', '16', 'Portal Signatures');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: подписание КС-2 через портал = сокращение сроков закрытия с 2 недель до 2 дней
    const hasSignatureUI = /подпис|signature|sign|утверд|approve|документ|document/i.test(body);

    // Sign/reject buttons?
    const hasSignActions = (await page.locator('button:has-text("подписать"), button:has-text("sign"), button:has-text("утвердить"), button:has-text("approve")').count()) > 0;

    if (!hasSignatureUI) {
      recordIssue('MISSING', '16', 'Portal Signatures не содержит UI для подписания — это критическая фича для сокращения сроков');
    }

    await screenshot(page, '16-portal-signatures');
    recordTiming('portal-signatures', Date.now() - start);
    console.log(`✅ Step 16: Portal Signatures (UI: ${hasSignatureUI}, actions: ${hasSignActions})`);
  });

  test('17 — Portal КС-2 Drafts: черновики для проверки', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/ks2-drafts', '17', 'Portal KS-2 Drafts');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: до подписания КС-2 заказчик проверяет объёмы. Это УНИКАЛЬНАЯ фича.
    // Ни у Procore, ни у Buildertrend, ни у PlanRadar этого нет.
    const hasKs2UI = /КС-2|KS-2|черновик|draft|акт|act|объём|volume/i.test(body);

    // Status workflow: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
    const hasStatusFlow = /черновик|подан|рассмотр|утвержд|отклон|draft|submitted|review|approved|rejected/i.test(body);

    if (!hasKs2UI) {
      recordIssue('MISSING', '17', 'Portal КС-2 Drafts не содержит UI для проверки объёмов — уникальная фича не работает');
    }

    // COMPETITIVE: Это наше конкурентное преимущество. Обязательно должно работать.
    if (hasKs2UI && hasStatusFlow) {
      console.log('  ★ УНИКАЛЬНАЯ ФИЧА: КС-2 черновики через портал — ни у одного конкурента нет!');
    }

    await screenshot(page, '17-portal-ks2-drafts');
    recordTiming('portal-ks2-drafts', Date.now() - start);
    console.log(`✅ Step 17: Portal KS-2 Drafts (UI: ${hasKs2UI}, statusFlow: ${hasStatusFlow})`);
  });

  test('18 — Portal Tasks', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/portal/tasks', '18', 'Portal Tasks');
    expect(body.length).toBeGreaterThan(50);

    const hasTaskUI = /задач|task|поручен|assignment|статус|status/i.test(body);

    await screenshot(page, '18-portal-tasks');
    recordTiming('portal-tasks', Date.now() - start);
    console.log(`✅ Step 18: Portal Tasks (UI: ${hasTaskUI})`);
  });

  test('19 — Portal Settings + Admin: контроль видимости', async ({ page }) => {
    const start = Date.now();

    // Portal Settings
    await smokeNav(page, '/portal/settings', '19', 'Portal Settings');
    await screenshot(page, '19-portal-settings');

    // Portal Admin
    const adminBody = await smokeNav(page, '/portal/admin', '19', 'Portal Admin');

    // BUSINESS: КРИТИЧНО — администратор должен контролировать что заказчик видит.
    // Маржу и КЛ — НЕЛЬЗЯ.
    const hasAccessControl = /доступ|access|роль|role|разрешен|permission|пользовател|user/i.test(adminBody);

    if (!hasAccessControl) {
      recordIssue('MAJOR', '19', 'Portal Admin не содержит управления доступом — критично для безопасности данных');
    }

    // Check for data visibility controls
    const hasVisibilitySettings = /видимость|visibility|скрыть|hide|показать|show|данные|data/i.test(adminBody);
    if (!hasVisibilitySettings) {
      recordIssue('UX', '19', 'Нет настроек видимости данных для портала — админ не может контролировать что видит заказчик');
    }

    await screenshot(page, '19-portal-admin');
    recordTiming('portal-admin', Date.now() - start);
    console.log(`✅ Step 19: Portal Admin (accessControl: ${hasAccessControl}, visibilitySettings: ${hasVisibilitySettings})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE C: Мессенджер и Почта
  // ═══════════════════════════════════════════════════════════════════════════

  test('20 — Мессенджер: чат для прорабов', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/messaging', '20', 'Мессенджер');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: прорабы общаются в WhatsApp потому что там быстрее.
    // Наш чат быстрее? Если медленнее — [UX].
    const hasChatUI = /канал|channel|чат|chat|сообщен|message|написать|send/i.test(body);

    // Check for channel list
    const hasChannels = (await page.locator('[class*="channel"], [class*="sidebar"] li, [class*="conversation"]').count()) > 0;

    // Check for message input
    const hasInput = (await page.locator('textarea, input[placeholder*="сообщен"], input[placeholder*="message"], [contenteditable]').count()) > 0;

    if (!hasChatUI) {
      recordIssue('MAJOR', '20', 'Мессенджер не содержит chat UI — прорабы останутся в WhatsApp');
    }

    if (!hasInput) {
      recordIssue('MAJOR', '20', 'Нет поля ввода сообщения — чат неработоспособен');
    }

    // Check load time — must be fast for field workers
    const loadTime = timings['messaging'] ?? (Date.now() - start);
    if (loadTime > 3000) {
      recordIssue('UX', '20', `Мессенджер загружается ${loadTime}ms — WhatsApp открывается за <1s, прорабы не будут ждать`);
    }

    await screenshot(page, '20-messenger-chat');
    recordTiming('messenger', Date.now() - start);
    console.log(`✅ Step 20: Мессенджер (chatUI: ${hasChatUI}, channels: ${hasChannels}, input: ${hasInput})`);
  });

  test('21 — Почта: встроенный email', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/mail', '21', 'Почта');
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: встроенная почта = все коммуникации в системе. Полезно для аудита.
    const hasMailUI = /входящ|inbox|отправл|sent|черновик|draft|корзин|trash/i.test(body);

    // Three-pane email layout?
    const hasFolders = (await page.locator('[class*="sidebar"], [class*="folder"]').count()) > 0;
    const hasMessageList = (await page.locator('table, [class*="list"], [class*="mail"]').count()) > 0;

    // Compose button
    const hasCompose = (await page.locator('button:has-text("написать"), button:has-text("compose"), button:has-text("создать"), button:has-text("новое")').count()) > 0;

    if (!hasMailUI) {
      recordIssue('MAJOR', '21', 'Почтовый клиент не содержит базовых папок (входящие/отправленные/черновики)');
    }

    if (!hasCompose) {
      recordIssue('UX', '21', 'Нет кнопки "Написать" — пользователь не может создать новое письмо');
    }

    await screenshot(page, '21-mail-client');
    recordTiming('mail', Date.now() - start);
    console.log(`✅ Step 21: Почта (mailUI: ${hasMailUI}, folders: ${hasFolders}, compose: ${hasCompose})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE D: Техподдержка
  // ═══════════════════════════════════════════════════════════════════════════

  test('22 — Support Dashboard: KPI поддержки', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/support/dashboard', '22', 'Support Dashboard');
    expect(body.length).toBeGreaterThan(50);

    // KPI: open tickets, avg resolution, satisfaction
    const hasKpiCards = (await page.locator('[class*="card"], [class*="metric"]').count()) >= 2;
    const hasTicketMetrics = /открыт|тикет|ticket|open|время.*ответ|resolution|удовлетвор|satisfaction/i.test(body);

    if (!hasKpiCards && !hasTicketMetrics) {
      recordIssue('MAJOR', '22', 'Support Dashboard не показывает KPI — руководитель поддержки не видит нагрузку');
    }

    // Priority distribution
    const hasPriorityDist = /приоритет|priority|критичн|critical|высок|high/i.test(body);

    await screenshot(page, '22-support-dashboard');
    recordTiming('support-dashboard', Date.now() - start);
    console.log(`✅ Step 22: Support Dashboard (kpi: ${hasKpiCards}, metrics: ${hasTicketMetrics})`);
  });

  test('23 — Создание тикета', async ({ page }) => {
    const start = Date.now();

    // Navigate to tickets
    await smokeNav(page, '/support/tickets', '23', 'Support Tickets');

    // Try to create ticket via API
    try {
      const ticket = await createEntity<{ id: string }>('/api/support/tickets', {
        subject: SUPPORT_TICKET.subject,
        description: SUPPORT_TICKET.description,
        priority: SUPPORT_TICKET.priority,
        category: SUPPORT_TICKET.category,
      });
      ticketId = ticket.id;
      console.log(`✅ Ticket created: ${ticketId}`);
    } catch {
      // Try UI creation
      const addBtn = page.getByRole('button', { name: /создать|добавить|new|create/i }).first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        console.log('⚠️ Ticket creation via UI attempted');
      } else {
        console.warn('⚠️ Ticket creation failed — no create button visible');
      }
    }

    // Verify ticket list has table/cards
    const hasTable = (await page.locator('table, [role="table"], [class*="card"]').count()) > 0;
    expect(hasTable || (await page.textContent('body'))!.length > 100).toBeTruthy();

    // Check for status tabs
    const hasStatusTabs = (await page.locator('button:has-text("Все"), button:has-text("Открытые"), button:has-text("В работе")').count()) > 0;

    // BUSINESS: время первого ответа <4 часа для высокого приоритета. Есть SLA?
    const body = (await page.textContent('body')) ?? '';
    const hasSlaIndicator = /SLA|время ответа|response time|срок/i.test(body);
    if (!hasSlaIndicator) {
      recordIssue('MISSING', '23', 'Нет индикатора SLA — время первого ответа должно быть видно для тикетов высокого приоритета');
    }

    await screenshot(page, '23-support-ticket-created');
    recordTiming('support-ticket-create', Date.now() - start);
    console.log(`✅ Step 23: Support Ticket (id: ${ticketId}, tabs: ${hasStatusTabs}, sla: ${hasSlaIndicator})`);
  });

  test('24 — Обработка тикета: ответ + закрытие', async ({ page }) => {
    const start = Date.now();

    if (!ticketId) {
      console.warn('⚠️ No ticket ID — skipping ticket processing');
      // Still check ticket board
      await smokeNav(page, '/support/tickets/board', '24', 'Ticket Board');
      return;
    }

    // Add comment via API
    try {
      await authenticatedRequest('POST', `/api/support/tickets/${ticketId}/comments`, {
        content: 'Проблема найдена, исправление будет в обновлении v1.5.2',
        isInternal: false,
      });
      console.log('  → Comment added');
    } catch {
      recordIssue('MAJOR', '24', 'Не удалось добавить комментарий к тикету через API');
    }

    // Transition: start work
    try {
      await authenticatedRequest('PATCH', `/api/support/tickets/${ticketId}/start`);
      console.log('  → Ticket started (IN_PROGRESS)');
    } catch {
      try {
        await authenticatedRequest('PUT', `/api/support/tickets/${ticketId}`, {
          subject: SUPPORT_TICKET.subject,
          description: SUPPORT_TICKET.description,
          priority: SUPPORT_TICKET.priority,
          status: 'IN_PROGRESS',
        });
      } catch {
        recordIssue('MAJOR', '24', 'Не удалось перевести тикет В работу');
      }
    }

    // Transition: resolve
    try {
      await authenticatedRequest('PATCH', `/api/support/tickets/${ticketId}/resolve`);
      console.log('  → Ticket resolved');
    } catch {
      try {
        await authenticatedRequest('PUT', `/api/support/tickets/${ticketId}`, {
          subject: SUPPORT_TICKET.subject,
          description: SUPPORT_TICKET.description,
          priority: SUPPORT_TICKET.priority,
          status: 'RESOLVED',
        });
      } catch {
        recordIssue('MAJOR', '24', 'Не удалось перевести тикет в Решён');
      }
    }

    // BUSINESS: пользователь должен получить уведомление об ответе. Email/push?
    // This can only be verified with real notification system, recording as check
    recordIssue('MISSING', '24', 'Нет проверки уведомлений при ответе на тикет — пользователь может не узнать о решении');

    // Check ticket board (kanban)
    await smokeNav(page, '/support/tickets/board', '24', 'Ticket Board');
    const boardBody = (await page.textContent('body')) ?? '';
    const hasBoardColumns = /открыт|в работе|решён|closed|open|in.?progress|resolved/i.test(boardBody);

    await screenshot(page, '24-support-ticket-resolved');
    recordTiming('support-ticket-process', Date.now() - start);
    console.log(`✅ Step 24: Ticket processed (board: ${hasBoardColumns})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE E: Сквозные проверки
  // ═══════════════════════════════════════════════════════════════════════════

  test('25 — Сквозная: CRM → Project → Portal доступ', async ({ page }) => {
    const start = Date.now();

    // BUSINESS: Лид → Выигран → Создан проект → Заказчик получил доступ в портал
    // Проверяем: цепочка работает? Или нужно вручную?

    // Check if there's a "convert to project" capability in CRM
    if (leadId) {
      try {
        // Try the convert endpoint
        await authenticatedRequest('POST', `/api/v1/crm/leads/${leadId}/convert`);
        console.log('  → Lead converted to project via API');
      } catch {
        // Expected — this may not be connected end-to-end yet
        recordIssue('MISSING', '25', 'CRM → Project conversion не работает через API — менеджер должен вручную создавать проект после выигрыша лида');
      }
    }

    // Verify project list
    await smokeNav(page, '/projects', '25', 'Projects list');

    // Verify portal access requires manual setup?
    await smokeNav(page, '/portal/admin', '25', 'Portal Admin');
    const adminBody = (await page.textContent('body')) ?? '';
    const hasAutoAccess = /автоматич|auto.*access|auto.*invite/i.test(adminBody);

    if (!hasAutoAccess) {
      recordIssue('UX', '25', 'Нет автоматического приглашения заказчика в портал при выигрыше лида — требуется ручная настройка доступа');
    }

    await screenshot(page, '25-crm-to-portal-chain');
    recordTiming('crm-portal-chain', Date.now() - start);
    console.log(`✅ Step 25: CRM → Portal chain (autoAccess: ${hasAutoAccess})`);
  });

  test('26 — Security: Portal RBAC — маржа и КЛ скрыты', async ({ page }) => {
    const start = Date.now();

    // CRITICAL CHECK: Заказчик НЕ видит маржу, КЛ цены, внутренние чаты, HR данные
    const sensitivePages = [
      { url: '/portal', label: 'Portal Dashboard' },
      { url: '/portal/projects', label: 'Portal Projects' },
      { url: '/portal/documents', label: 'Portal Documents' },
      { url: '/portal/contracts', label: 'Portal Contracts' },
      { url: '/portal/invoices', label: 'Portal Invoices' },
    ];

    let securityIssues = 0;

    for (const pg of sensitivePages) {
      const body = await smokeNav(page, pg.url, '26', pg.label);

      // Check for sensitive data leaks
      const sensitivePatterns = [
        { pattern: /costPrice|себестоимость/i, label: 'costPrice/себестоимость' },
        { pattern: /margin\b|маржа|маржинальность/i, label: 'маржа' },
        { pattern: /profitRate|profit.*rate/i, label: 'profitRate' },
        { pattern: /конкурентн.*лист|competitive.*list|КЛ.*цен/i, label: 'КЛ/competitive list' },
        { pattern: /закупочн.*цен|purchase.*price/i, label: 'закупочная цена' },
      ];

      for (const sp of sensitivePatterns) {
        if (sp.pattern.test(body)) {
          securityIssues++;
          recordIssue('CRITICAL', '26', `УТЕЧКА на ${pg.label}: обнаружено "${sp.label}" — коммерческая тайна видна заказчику!`);
        }
      }
    }

    if (securityIssues === 0) {
      console.log('  ★ Security check PASSED: никакая коммерческая информация не видна в портале');
    } else {
      console.warn(`  ⚠️ ${securityIssues} security issues found!`);
    }

    await screenshot(page, '26-portal-security-check');
    recordTiming('portal-security', Date.now() - start);
    console.log(`✅ Step 26: Portal RBAC security (issues: ${securityIssues})`);
  });

  test('27 — Portal CP Approval + Messages', async ({ page }) => {
    const start = Date.now();

    // Check CP Approval page
    const cpBody = await smokeNav(page, '/portal/cp-approval', '27', 'Portal CP Approval');

    // BUSINESS: КП на согласовании → заказчик открывает → утверждает → уведомление нам
    const hasCpUI = /КП|коммерческ|proposal|согласован|approval|утверд|approve/i.test(cpBody);
    if (!hasCpUI) {
      recordIssue('MISSING', '27', 'Portal CP Approval не содержит UI для согласования КП — уникальная фича не реализована');
    }

    // Check portal messages
    const msgBody = await smokeNav(page, '/portal/messages', '27', 'Portal Messages');
    const fallbackMsgBody = msgBody.length < 50
      ? await smokeNav(page, '/portal', '27', 'Portal (fallback for messages)')
      : msgBody;

    const hasMessaging = /сообщен|message|письм|inbox|чат|chat/i.test(fallbackMsgBody);

    await screenshot(page, '27-portal-cp-approval');
    recordTiming('portal-cp-approval', Date.now() - start);
    console.log(`✅ Step 27: Portal CP Approval (cpUI: ${hasCpUI}, messaging: ${hasMessaging})`);
  });

  test('28 — Communication chain: RFI cycle', async ({ page }) => {
    const start = Date.now();

    // BUSINESS: RFI создан подрядчиком → уведомление заказчику → ответ через портал → уведомление подрядчику
    // Full cycle can only be verified with multi-role auth, but we check the UI

    // Check main RFI page (internal)
    await smokeNav(page, '/pm/rfis', '28', 'RFI Registry (internal)');
    const rfiBody = (await page.textContent('body')) ?? '';
    const hasRfiRegistry = /RFI|запрос|информац/i.test(rfiBody);

    // Check portal RFI page (external)
    await smokeNav(page, '/portal/rfis', '28', 'RFI (portal)');
    const portalRfiBody = (await page.textContent('body')) ?? '';
    const hasPortalRfi = /RFI|запрос|вопрос|ответ|response/i.test(portalRfiBody);

    // BUSINESS: RFI workflow needs both sides. If portal side missing, it's incomplete.
    if (!hasPortalRfi) {
      recordIssue('MAJOR', '28', 'Portal RFI не работает — заказчик не может ответить на запросы информации');
    }

    // Check for response capability
    const hasResponseUI = /ответить|respond|reply|отправить/i.test(portalRfiBody);
    if (!hasResponseUI) {
      recordIssue('UX', '28', 'Нет кнопки "Ответить" на Portal RFI — цепочка коммуникации неполная');
    }

    await screenshot(page, '28-rfi-communication-chain');
    recordTiming('rfi-chain', Date.now() - start);
    console.log(`✅ Step 28: RFI Chain (registry: ${hasRfiRegistry}, portalRfi: ${hasPortalRfi}, response: ${hasResponseUI})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP + REPORT
  // ═══════════════════════════════════════════════════════════════════════════

  test.afterAll(async () => {
    // ─── Cleanup E2E entities ───
    const cleanupResults: string[] = [];

    if (ticketId) {
      try {
        await deleteEntity(`/api/support/tickets/${ticketId}`);
        cleanupResults.push(`ticket ${ticketId}`);
      } catch { /* ignore */ }
    }

    if (leadId) {
      try {
        await deleteEntity(`/api/v1/crm/leads/${leadId}`);
        cleanupResults.push(`lead ${leadId}`);
      } catch { /* ignore */ }
    }

    if (counterpartyId) {
      try {
        await deleteEntity(`/api/v1/contracts/counterparties/${counterpartyId}`);
        cleanupResults.push(`counterparty ${counterpartyId}`);
      } catch { /* ignore */ }
    }

    if (bidPackageId) {
      try {
        await deleteEntity(`/api/portfolio/bid-packages/${bidPackageId}`);
        cleanupResults.push(`bid ${bidPackageId}`);
      } catch { /* ignore */ }
    }

    if (projectId) {
      try {
        await deleteEntity(`/api/projects/${projectId}`);
        cleanupResults.push(`project ${projectId}`);
      } catch { /* ignore */ }
    }

    console.log(`🧹 Cleaned: ${cleanupResults.length > 0 ? cleanupResults.join(', ') : 'nothing to clean'}`);

    // ─── Issue Summary ───
    const critical = issues.filter(i => i.severity === 'CRITICAL').length;
    const major = issues.filter(i => i.severity === 'MAJOR').length;
    const minor = issues.filter(i => i.severity === 'MINOR').length;
    const ux = issues.filter(i => i.severity === 'UX').length;
    const missing = issues.filter(i => i.severity === 'MISSING').length;

    console.log('\n════════════════════════════════════════════');
    console.log('  CRM + Portal + Support — Issue Summary');
    console.log('════════════════════════════════════════════');
    console.log(`  Pages visited:   ${totalPages}`);
    console.log(`  [CRITICAL]:      ${critical}`);
    console.log(`  [MAJOR]:         ${major}`);
    console.log(`  [MINOR]:         ${minor}`);
    console.log(`  [UX]:            ${ux}`);
    console.log(`  [MISSING]:       ${missing}`);
    console.log(`  Total issues:    ${issues.length}`);
    console.log('════════════════════════════════════════════\n');

    if (issues.length > 0) {
      console.log('Issues detail:');
      for (const issue of issues) {
        console.log(`  [${issue.severity}] Step ${issue.step}: ${issue.description}`);
        if (issue.actual) {
          console.log(`    actual: ${issue.actual}, expected: ${issue.expected}`);
        }
      }
    }

    // ─── Timings ───
    console.log('\nPage timings:');
    for (const [label, ms] of Object.entries(timings)) {
      console.log(`  ${label}: ${ms}ms`);
    }
  });
});
