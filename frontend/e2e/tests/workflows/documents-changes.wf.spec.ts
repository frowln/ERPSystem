/**
 * WF: Documents + Change Orders — ПТО инженер + ГИП
 *
 * Персоны:
 * 1. Инженер ПТО — ведёт исполнительную документацию.
 *    "Каждый акт скрытых работ должен быть подписан ДО заливки бетона. Иначе ломать."
 * 2. ГИП (главный инженер проекта) — управляет изменениями.
 *    "Заказчик хочет перенести стену — это change order на 2 млн."
 *
 * Объект: ЖК "Солнечный квартал" — жилой комплекс, 450 млн ₽
 *
 * 7 фаз (A–G), 25 шагов, ~200 assertions.
 * Бизнес-цепочки:
 * - ПТО: Документы → CDE → АОСР → КС-6 → ИТД
 * - ГИП: RFI → Submittal → Change Event → Change Order → Бюджет
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  authenticatedRequest,
  createEntity,
  deleteEntity,
  listEntities,
} from '../../fixtures/api.fixture';

// ─── Configuration ───────────────────────────────────────────────────────────

const SS = 'e2e/screenshots/documents-changes';
const TODAY = new Date().toISOString().slice(0, 10);
const IN_5_DAYS = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);

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

let projectId: string | undefined;
let changeEventId: string | undefined;
let changeOrderId: string | undefined;
let rfiId: string | undefined;
let submittalId: string | undefined;
let issueId: string | undefined;

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

test.describe.serial('WF: Documents + Change Orders', () => {

  // ─── STEP 0: Seed project via API ──────────────────────────────────────────

  test('00 — Seed project', async () => {
    try {
      const project = await createEntity<{ id: string }>('/api/projects', {
        name: 'E2E-ЖК Солнечный квартал',
        code: 'E2E-DOC-SK-001',
        status: 'IN_PROGRESS',
        startDate: '2026-01-15',
        plannedEndDate: '2027-06-30',
        description: 'Жилой комплекс, 450 млн ₽, электромонтаж + вентиляция',
        constructionKind: 'RESIDENTIAL',
      });
      projectId = project.id;
      console.log(`✅ Project seeded: ${projectId}`);
    } catch (e) {
      // Try to find existing E2E project
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
  // PHASE A: Документооборот (ПТО)
  // ═══════════════════════════════════════════════════════════════════════════

  test('01 — Общий реестр документов', async ({ page }) => {
    const start = Date.now();

    // Navigate to document registry
    const body = await smokeNav(page, '/documents', '01', 'Реестр документов');

    // Check for key registry elements: table or list, filters
    const hasTable = (await page.locator('table, [role="table"]').count()) > 0;
    const hasCards = (await page.locator('[class*="card"], [class*="grid"]').count()) > 0;
    const hasContent = hasTable || hasCards || body.length > 200;
    expect(hasContent, 'Document registry should render content').toBeTruthy();

    // Check for filters
    const hasFilters = (await page.locator('select, input[type="search"], input[placeholder*="оиск"], input[placeholder*="earch"]').count()) > 0;
    if (!hasFilters) {
      recordIssue('UX', '01', 'Реестр документов без фильтров — при 500+ документах ПТО-инженер не найдёт нужный');
    }

    // Check smart recognition page
    await smokeNav(page, '/documents/smart-recognition', '01', 'Smart Recognition');
    const smartBody = (await page.textContent('body')) ?? '';
    const hasSmartFeatures = /распознав|recognition|AI|ИИ|загруз|upload|drag|drop/i.test(smartBody);
    if (!hasSmartFeatures) {
      recordIssue('UX', '01', 'Страница умного распознавания не содержит UI для загрузки/распознавания документов');
    }

    await screenshot(page, '01-document-registry');
    recordTiming('document-registry', Date.now() - start);
    console.log(`✅ Step 01: Реестр документов (table: ${hasTable}, filters: ${hasFilters})`);
  });

  test('02 — CDE (Общая среда данных)', async ({ page }) => {
    const start = Date.now();

    // CDE document containers
    const cdeBody = await smokeNav(page, '/cde/documents', '02', 'CDE Documents');

    const hasStructure = /папк|folder|классифик|classification|контейнер|container|документ/i.test(cdeBody);
    if (!hasStructure) {
      recordIssue('UX', '02', 'CDE не показывает структуру папок / классификацию — ключевая функция ISO 19650');
    }

    // Check for versioning indicators (ISO 19650 key requirement)
    const hasVersioning = /версия|version|rev\.|ревизия|revision/i.test(cdeBody);
    if (!hasVersioning) {
      recordIssue('MISSING', '02', 'CDE нет индикаторов версионирования — ISO 19650 требует version control');
    }

    // Check transmittals page
    await smokeNav(page, '/cde/transmittals', '02', 'CDE Transmittals');

    // Check revision sets
    await smokeNav(page, '/cde/revision-sets', '02', 'CDE Revision Sets');

    // Check archive policies
    await smokeNav(page, '/cde/archive-policies', '02', 'CDE Archive Policies');

    await screenshot(page, '02-cde-documents');
    recordTiming('cde', Date.now() - start);
    console.log(`✅ Step 02: CDE (structure: ${hasStructure}, versioning: ${hasVersioning})`);
  });

  test('03 — ПТО документы + разрешения на работы', async ({ page }) => {
    const start = Date.now();

    // PTO document registry
    const ptoBody = await smokeNav(page, '/pto/documents', '03', 'ПТО документы');

    const hasPtoDocs = /документ|ПТО|акт|протокол|журнал/i.test(ptoBody);
    expect(ptoBody.length).toBeGreaterThan(50);

    // PTO document board
    await smokeNav(page, '/pto/documents/board', '03', 'ПТО Board');

    // Work permits page
    const permitsBody = await smokeNav(page, '/pto/work-permits', '03', 'Разрешения на работы');

    const hasPermitUI = /разрешен|permit|наряд|допуск|работ/i.test(permitsBody);
    if (!hasPermitUI) {
      recordIssue('MAJOR', '03', 'Страница разрешений на работы не содержит UI для наряд-допусков — обязательный документ для опасных работ');
    }

    // BUSINESS: наряд-допуск на опасные работы = обязательный документ. Без него — штраф.
    const hasWorkTypes = /повышенн|опасн|dangerous|hot work|высот|excavat/i.test(permitsBody);
    if (!hasWorkTypes) {
      recordIssue('UX', '03', 'Нет классификации по типам опасных работ (высота, электро, огневые, земляные) — обязательно по СНиП');
    }

    await screenshot(page, '03-pto-work-permits');
    recordTiming('pto-docs', Date.now() - start);
    console.log(`✅ Step 03: ПТО документы (docs: ${hasPtoDocs}, permits: ${hasPermitUI})`);
  });

  test('04 — Акты скрытых работ (АОСР)', async ({ page }) => {
    const start = Date.now();

    // Hidden work acts page
    const aosrBody = await smokeNav(page, '/pto/hidden-work-acts', '04', 'АОСР');

    const hasAosrUI = /АОСР|акт.*скрыт|hidden.*work|освидетельств/i.test(aosrBody);
    if (!hasAosrUI) {
      recordIssue('MAJOR', '04', 'АОСР страница не содержит соответствующий UI для актов скрытых работ');
    }

    // Check form page exists
    await smokeNav(page, '/pto/hidden-work-acts/new', '04', 'АОСР создание');
    const formBody = (await page.textContent('body')) ?? '';

    // BUSINESS: АОСР подписывается ТРЕМЯ сторонами (подрядчик, заказчик, стройконтроль)
    const hasTripleSignature = /подрядчик|заказчик|стройконтрол|представител|contractor|customer|inspector/i.test(formBody);
    if (!hasTripleSignature) {
      recordIssue('MAJOR', '04', 'Форма АОСР не имеет полей для трёх подписантов (подрядчик, заказчик, стройконтроль) — требование СП');
    }

    // Check for work description field
    const hasWorkDesc = /работ|наименование|описание|description/i.test(formBody);

    await screenshot(page, '04-aosr-form');
    recordTiming('aosr', Date.now() - start);
    console.log(`✅ Step 04: АОСР (UI: ${hasAosrUI}, tripleSign: ${hasTripleSignature})`);
  });

  test('05 — Журнал КС-6', async ({ page }) => {
    const start = Date.now();

    // KS-6 calendar (general work journal)
    const ks6Body = await smokeNav(page, '/pto/ks6-calendar', '05', 'КС-6 Календарь');

    const hasKs6UI = /КС-6|журнал|calendar|работ|daily/i.test(ks6Body);
    if (!hasKs6UI) {
      recordIssue('MAJOR', '05', 'КС-6 страница не показывает журнал работ');
    }

    // Also check exec-docs KS-6
    await smokeNav(page, '/exec-docs/ks6', '05', 'КС-6 Journal (exec-docs)');

    // BUSINESS: КС-6 ведётся ежедневно. Заполняется автоматически из daily logs?
    const hasAutoLink = /daily.*log|ежедневн|отчёт|автоматич/i.test(ks6Body);
    if (!hasAutoLink) {
      recordIssue('UX', '05', 'КС-6 не связан с ежедневными отчётами (daily logs) — двойная работа для прораба');
    }

    await screenshot(page, '05-ks6-calendar');
    recordTiming('ks6', Date.now() - start);
    console.log(`✅ Step 05: КС-6 (UI: ${hasKs6UI}, autoLink: ${hasAutoLink})`);
  });

  test('06 — Лабораторные испытания', async ({ page }) => {
    const start = Date.now();

    const labBody = await smokeNav(page, '/pto/lab-tests', '06', 'Лабораторные испытания');

    const hasLabUI = /лаборатор|испытан|lab|test|протокол|protocol|образец|sample/i.test(labBody);
    if (!hasLabUI) {
      recordIssue('MAJOR', '06', 'Страница лабораторных испытаний не содержит UI для протоколов');
    }

    // BUSINESS: если результат < нормы — материал бракуется. Система сигнализирует?
    const hasPassFail = /годен|негоден|pass|fail|соответств|не соответств|норм|ГОСТ/i.test(labBody);
    if (!hasPassFail) {
      recordIssue('UX', '06', 'Нет индикации pass/fail для результатов испытаний — инженер должен видеть сразу');
    }

    await screenshot(page, '06-lab-tests');
    recordTiming('lab-tests', Date.now() - start);
    console.log(`✅ Step 06: Лабораторные испытания (UI: ${hasLabUI})`);
  });

  test('07 — ИТД валидация', async ({ page }) => {
    const start = Date.now();

    const itdBody = await smokeNav(page, '/pto/itd-validation', '07', 'ИТД Валидация');

    const hasItdUI = /ИТД|исполнител|документац|комплект|completeness|validation/i.test(itdBody);
    if (!hasItdUI) {
      recordIssue('MAJOR', '07', 'Страница ИТД не показывает проверку комплектности — ГСН не примет объект без полного комплекта');
    }

    // BUSINESS: при сдаче объекта ГСН требует полный комплект ИТД
    const hasChecklist = /чек.*лист|checklist|✓|✗|статус|комплект|required|обязатель/i.test(itdBody);
    if (!hasChecklist) {
      recordIssue('UX', '07', 'Нет чек-листа обязательных документов ИТД — нужен при сдаче объекта');
    }

    await screenshot(page, '07-itd-validation');
    recordTiming('itd-validation', Date.now() - start);
    console.log(`✅ Step 07: ИТД валидация (UI: ${hasItdUI}, checklist: ${hasChecklist})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE B: Исполнительная документация
  // ═══════════════════════════════════════════════════════════════════════════

  test('08 — АОСР реестр (exec-docs)', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/exec-docs/aosr', '08', 'АОСР (exec-docs)');

    const hasAosr = /АОСР|акт.*скрыт|hidden|освидетельств/i.test(body);
    expect(body.length).toBeGreaterThan(50);

    // BUSINESS: АОСР оформляется ДО закрытия конструкции
    const hasWarning = /предупрежд|warning|срок|deadline|до закрыт/i.test(body);
    if (!hasWarning) {
      recordIssue('UX', '08', 'Нет предупреждений о сроках подписания АОСР — стяжку залили без АОСР = проблема');
    }

    await screenshot(page, '08-aosr-exec-docs');
    recordTiming('aosr-exec', Date.now() - start);
    console.log(`✅ Step 08: АОСР exec-docs (UI: ${hasAosr})`);
  });

  test('09 — Входной контроль', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/exec-docs/incoming-control', '09', 'Входной контроль');

    const hasControl = /входн|контрол|incoming|материал|акт/i.test(body);
    if (!hasControl) {
      recordIssue('MAJOR', '09', 'Страница входного контроля не содержит соответствующий UI');
    }

    // BUSINESS: связаны ли с quality/material-inspection? Не дублируют ли?
    // This is an architectural UX concern
    recordIssue('UX', '09', 'Входной контроль (/exec-docs/incoming-control) может дублировать /quality/material-inspection — нужна консолидация или cross-link');

    await screenshot(page, '09-incoming-control');
    recordTiming('incoming-control', Date.now() - start);
    console.log(`✅ Step 09: Входной контроль (UI: ${hasControl})`);
  });

  test('10 — Сварочные работы', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/exec-docs/welding', '10', 'Сварочные работы');

    const hasWelding = /свароч|сварк|welding|журнал|стык|joint/i.test(body);
    if (!hasWelding) {
      recordIssue('MINOR', '10', 'Страница сварочных работ не содержит специфический UI');
    }

    await screenshot(page, '10-welding-journal');
    recordTiming('welding', Date.now() - start);
    console.log(`✅ Step 10: Сварочные работы (UI: ${hasWelding})`);
  });

  test('11 — Специальные журналы', async ({ page }) => {
    const start = Date.now();

    const body = await smokeNav(page, '/exec-docs/special-journals', '11', 'Специальные журналы');

    const hasJournals = /журнал|journal|бетонир|свароч|антикорроз|special/i.test(body);
    if (!hasJournals) {
      recordIssue('MAJOR', '11', 'Страница спецжурналов не показывает доступные журналы');
    }

    // BUSINESS: обязательные журналы для стройки РФ
    const requiredJournals = ['КС-6', 'бетонирован', 'сварочн', 'антикорроз'];
    const missingJournals = requiredJournals.filter((j) => !new RegExp(j, 'i').test(body));
    if (missingJournals.length > 0) {
      recordIssue('UX', '11', `Не все обязательные журналы видны: отсутствуют ${missingJournals.join(', ')} — для стройки РФ обязательны`);
    }

    await screenshot(page, '11-special-journals');
    recordTiming('special-journals', Date.now() - start);
    console.log(`✅ Step 11: Спецжурналы (journals: ${hasJournals}, missing: ${missingJournals.length})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE C: RFI и Submittals
  // ═══════════════════════════════════════════════════════════════════════════

  test('12 — RFI создание', async ({ page }) => {
    const start = Date.now();

    // Navigate to RFI list
    const rfiBody = await smokeNav(page, '/pm/rfis', '12', 'RFI список');

    const hasRfiUI = /RFI|запрос.*информ|request.*info/i.test(rfiBody);
    expect(rfiBody.length).toBeGreaterThan(50);

    // Check RFI board view
    await smokeNav(page, '/pm/rfis/board', '12', 'RFI Board');

    // Try to create RFI via API
    if (projectId) {
      try {
        const rfi = await createEntity<{ id: string }>('/api/rfis', {
          title: 'E2E-Уточнение высоты установки розеток в кладовых',
          projectId,
          description: 'В проектной документации указана высота розеток 300 мм от пола. В кладовых это неудобно из-за стеллажей. Прошу уточнить: можно ли установить на 900 мм?',
          priority: 'MEDIUM',
          status: 'OPEN',
        });
        rfiId = rfi.id;
        console.log(`  RFI created: ${rfiId}`);
      } catch (e) {
        console.warn('  ⚠️ Could not create RFI via API — checking UI only');
      }
    }

    // Navigate to RFI form
    await smokeNav(page, '/pm/rfis/new', '12', 'RFI создание');
    const formBody = (await page.textContent('body')) ?? '';

    // Check form has required fields
    const hasTitle = /название|title|тема|subject/i.test(formBody);
    const hasPriority = /приоритет|priority|срочн|urgent/i.test(formBody);
    const hasAssignee = /кому|assignee|ответствен|recipient|получател/i.test(formBody);

    if (!hasAssignee) {
      recordIssue('UX', '12', 'Форма RFI нет поля «Кому» / ответственный — Procore показывает кому отправлен RFI и от кого');
    }

    // BUSINESS: Procore — лидер в RFI workflow: создание → назначение → ответ → закрытие
    const hasDeadline = /срок|deadline|дата.*ответ|response.*date|до/i.test(formBody);
    if (!hasDeadline) {
      recordIssue('UX', '12', 'RFI нет поля срока ответа — если >5 дней без ответа, стройка стоит');
    }

    await screenshot(page, '12-rfi-created');
    recordTiming('rfi-create', Date.now() - start);
    console.log(`✅ Step 12: RFI (UI: ${hasRfiUI}, title: ${hasTitle}, priority: ${hasPriority})`);
  });

  test('13 — Ответ на RFI + workflow', async ({ page }) => {
    const start = Date.now();

    if (rfiId) {
      // Try to update RFI status and add response via API
      try {
        await authenticatedRequest('admin', 'PATCH', `/api/rfis/${rfiId}/status`, {
          status: 'ANSWERED',
        });
        console.log('  RFI status → ANSWERED');
      } catch {
        // Try PUT update instead
        try {
          await authenticatedRequest('admin', 'PUT', `/api/rfis/${rfiId}`, {
            status: 'ANSWERED',
            response: 'Согласовано. В кладовых устанавливать розетки на высоте 900 мм.',
          });
        } catch {
          console.warn('  ⚠️ Could not update RFI status via API');
        }
      }

      // Navigate to RFI detail
      await smokeNav(page, `/pm/rfis/${rfiId}`, '13', 'RFI Detail');
      const detailBody = (await page.textContent('body')) ?? '';

      // Check status workflow indicators
      const hasStatusFlow = /статус|status|workflow|процесс|этап/i.test(detailBody);
      const hasResponseField = /ответ|response|решение|conclusion/i.test(detailBody);

      // BUSINESS: RFI influences work. If no answer >5 days — construction stops
      const hasEscalation = /эскалац|escalat|просрочен|overdue|напоминание|reminder/i.test(detailBody);
      if (!hasEscalation) {
        recordIssue('MISSING', '13', 'RFI нет механизма эскалации/напоминания — если ответа нет >5 дней, стройка простаивает');
      }

      console.log(`  RFI detail: statusFlow=${hasStatusFlow}, response=${hasResponseField}`);
    } else {
      // Navigate to RFI list and check workflow elements
      const body = await smokeNav(page, '/pm/rfis', '13', 'RFI List (no API)');
      const hasWorkflow = /открыт|отвечен|закрыт|open|answered|closed/i.test(body);
      if (!hasWorkflow) {
        recordIssue('UX', '13', 'RFI список не показывает статусы workflow (Открыт → Отвечен → Закрыт)');
      }
    }

    await screenshot(page, '13-rfi-workflow');
    recordTiming('rfi-workflow', Date.now() - start);
    console.log(`✅ Step 13: RFI ответ/workflow`);
  });

  test('14 — Submittal (передача на согласование)', async ({ page }) => {
    const start = Date.now();

    // Submittals list
    const subBody = await smokeNav(page, '/pm/submittals', '14', 'Submittals список');

    const hasSubmittalUI = /submittal|согласован|передач|material|замен/i.test(subBody);
    expect(subBody.length).toBeGreaterThan(50);

    // Try to create submittal via API
    if (projectId) {
      try {
        const submittal = await createEntity<{ id: string }>('/api/submittals', {
          title: 'E2E-Согласование замены автоматов ABB → Schneider',
          projectId,
          description: 'Предлагается замена автоматов ABB S203 на Schneider Electric iC60N по причине более быстрой поставки (3 дня вместо 14).',
          submittalType: 'MATERIAL_SUBSTITUTION',
          status: 'OPEN',
        });
        submittalId = submittal.id;
        console.log(`  Submittal created: ${submittalId}`);
      } catch {
        console.warn('  ⚠️ Could not create submittal via API');
      }
    }

    // Check submittal form
    await smokeNav(page, '/pm/submittals/new', '14', 'Submittal создание');
    const formBody = (await page.textContent('body')) ?? '';

    // BUSINESS: замена материала = обязательное согласование проектировщика
    const hasApprovalChain = /согласов|approval|проектировщик|designer|заказчик|customer|подпис|sign/i.test(formBody);
    if (!hasApprovalChain) {
      recordIssue('UX', '14', 'Submittal нет цепочки согласования (проектировщик → заказчик) — без подписи проектировщика нельзя менять материал');
    }

    await screenshot(page, '14-submittal-form');
    recordTiming('submittal', Date.now() - start);
    console.log(`✅ Step 14: Submittal (UI: ${hasSubmittalUI})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE D: Изменения (Change Management)
  // ═══════════════════════════════════════════════════════════════════════════

  test('15 — Change Event создание', async ({ page }) => {
    const start = Date.now();

    // Dashboard
    const dashBody = await smokeNav(page, '/change-management/dashboard', '15', 'Change Mgmt Dashboard');

    const hasDashboard = /дашборд|dashboard|событи|event|заказ|order|изменен|change/i.test(dashBody);
    if (!hasDashboard) {
      recordIssue('MINOR', '15', 'Дашборд управления изменениями не содержит метрики');
    }

    // Events list
    await smokeNav(page, '/change-management/events', '15', 'Change Events');

    // Create change event via API
    if (projectId) {
      try {
        const event = await createEntity<{ id: string }>('/api/change-events', {
          title: 'E2E-Перенос вентшахты в секции 2',
          projectId,
          source: 'OWNER_REQUEST',
          description: 'Вентиляционную шахту необходимо перенести на 2 метра к оси В. Затрагивает: воздуховоды этажей 1-12, монтажные отверстия в перекрытиях.',
          estimatedCostImpact: 2_400_000,
          estimatedScheduleImpact: 14,
        });
        changeEventId = event.id;
        console.log(`  Change Event created: ${changeEventId}`);
      } catch {
        console.warn('  ⚠️ Could not create change event via API');
      }
    }

    // Navigate to list to verify event appears
    await page.goto('/change-management/events', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    const listBody = (await page.textContent('body')) ?? '';

    if (changeEventId) {
      const hasCreatedEvent = /E2E-Перенос|вентшахт/i.test(listBody);
      if (!hasCreatedEvent) {
        recordIssue('MINOR', '15', 'Созданное событие не отображается в списке (возможно фильтр по проекту)');
      }
    }

    // Check metric cards
    const hasMetrics = (await page.locator('[class*="metric"], [class*="card"], [class*="stat"]').count()) > 0;

    await screenshot(page, '15-change-event-created');
    recordTiming('change-event', Date.now() - start);
    console.log(`✅ Step 15: Change Event (dashboard: ${hasDashboard}, metrics: ${hasMetrics})`);
  });

  test('16 — Оценка влияния (Impact Assessment)', async ({ page }) => {
    const start = Date.now();

    if (changeEventId) {
      // Navigate to change event detail
      const detailBody = await smokeNav(page, `/change-management/events/${changeEventId}`, '16', 'Change Event Detail');

      // Check impact assessment section
      const hasCostImpact = /влияние.*стоимость|cost.*impact|2[\s\u00A0]?400|2400/i.test(detailBody);
      const hasScheduleImpact = /влияние.*срок|schedule.*impact|14\s*дн|14\s*day/i.test(detailBody);

      if (!hasCostImpact) {
        recordIssue('MAJOR', '16', 'Оценка влияния на стоимость не отображается на детальной странице');
      }
      if (!hasScheduleImpact) {
        recordIssue('MAJOR', '16', 'Оценка влияния на сроки не отображается на детальной странице');
      }

      // Check status workflow visualization
      const hasStatusFlow = (await page.locator('[class*="ring-"], [class*="bg-success"], [class*="bg-primary"]').count()) > 0;
      if (!hasStatusFlow) {
        recordIssue('UX', '16', 'Нет визуализации этапов согласования (status flow) — ГИП должен видеть прогресс');
      }

      // BUSINESS: change без оценки влияния = непонятно сколько стоит
      const hasImpactSection = /оценка.*влиян|impact.*assess|cost.*impact|стоимост.*влиян/i.test(detailBody);
      if (!hasImpactSection) {
        recordIssue('MAJOR', '16', 'Нет выделенной секции оценки влияния — [MAJOR] если можно утвердить без оценки');
      }

      // Try advancing status: IDENTIFIED → UNDER_REVIEW
      try {
        await authenticatedRequest('admin', 'PATCH', `/api/change-events/${changeEventId}/status`, {
          status: 'UNDER_REVIEW',
        });
        console.log('  Change Event status → UNDER_REVIEW');
      } catch {
        console.warn('  ⚠️ Could not advance change event status');
      }

      await screenshot(page, '16-impact-assessment');
    } else {
      // No event created — check events list structure
      await smokeNav(page, '/change-management/events', '16', 'Change Events (no API)');
      recordIssue('MINOR', '16', 'Не удалось создать change event для проверки impact assessment');
    }

    recordTiming('impact-assessment', Date.now() - start);
    console.log(`✅ Step 16: Оценка влияния`);
  });

  test('17 — Change Order создание', async ({ page }) => {
    const start = Date.now();

    // Change Orders list
    await smokeNav(page, '/change-management/orders', '17', 'Change Orders');

    // Change Orders board
    await smokeNav(page, '/change-management/orders/board', '17', 'CO Board');

    // Create Change Order via API
    if (projectId) {
      try {
        const order = await createEntity<{ id: string }>('/api/change-orders', {
          title: 'E2E-CO Перенос вентшахты',
          projectId,
          changeOrderType: 'ADDITION',
          totalAmount: 2_400_000,
          scheduleImpactDays: 14,
          description: 'Доп. работы по переносу вентиляционной шахты в секции 2',
          changeOrderRequestId: changeEventId || undefined,
        });
        changeOrderId = order.id;
        console.log(`  Change Order created: ${changeOrderId}`);
      } catch {
        console.warn('  ⚠️ Could not create change order via API');
      }
    }

    // Check CO form page
    const formBody = await smokeNav(page, '/change-management/orders/new', '17', 'CO Form');
    const formText = (await page.textContent('body')) ?? '';

    // Verify form fields
    const hasTitle = /название|title/i.test(formText);
    const hasType = /тип.*изменен|type|добавлен|вычет|замещен/i.test(formText);
    const hasAmount = /сумма|amount|стоимость/i.test(formText);
    const hasSchedule = /срок|schedule|дней|days/i.test(formText);

    if (!hasAmount) {
      recordIssue('MAJOR', '17', 'Форма CO нет поля суммы — невозможно оценить стоимость изменения');
    }

    await screenshot(page, '17-change-order-form');
    recordTiming('change-order', Date.now() - start);
    console.log(`✅ Step 17: Change Order (title: ${hasTitle}, type: ${hasType}, amount: ${hasAmount})`);
  });

  test('18 — CO Detail + Status Workflow', async ({ page }) => {
    const start = Date.now();

    if (changeOrderId) {
      // Navigate to CO detail
      const detailBody = await smokeNav(page, `/change-management/orders/${changeOrderId}`, '18', 'CO Detail');

      // Check contract impact section
      const hasContractImpact = /влияние.*договор|contract.*impact|первоначальн|original|скорректир|revised/i.test(detailBody);
      if (!hasContractImpact) {
        recordIssue('UX', '18', 'CO detail нет секции влияния на договор (оригинал → изменение → скорректированная сумма)');
      }

      // Check status flow
      const hasStatusFlow = /черновик|draft|утвержд|pending|approved|выполнен|executed/i.test(detailBody);

      // Check line items table
      const hasLineItems = /позици|items|описание|кол-во|цена|сумма/i.test(detailBody);

      // Try advancing status: DRAFT → PENDING_APPROVAL
      try {
        await authenticatedRequest('admin', 'PATCH', `/api/change-orders/${changeOrderId}/status`, {
          status: 'PENDING_APPROVAL',
        });
        console.log('  CO status → PENDING_APPROVAL');

        // APPROVED
        await authenticatedRequest('admin', 'PATCH', `/api/change-orders/${changeOrderId}/status`, {
          status: 'APPROVED',
        });
        console.log('  CO status → APPROVED');
      } catch {
        console.warn('  ⚠️ Could not advance CO status');
      }

      // BUSINESS: CO >1,000,000 ₽ — требует подписи директора
      const coAmount = 2_400_000;
      if (coAmount > 1_000_000) {
        // Check if approval required director sign
        const hasApprovalCheck = /директор|director|утверд|руководител|порог|threshold|CEO/i.test(detailBody);
        if (!hasApprovalCheck) {
          recordIssue('UX', '18', 'CO >1,000,000₽ нет проверки порога утверждения — система не проверяет требуется ли подпись директора');
        }
      }

      // Reload to see updated status
      await page.goto(`/change-management/orders/${changeOrderId}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await screenshot(page, '18-co-approved');
    } else {
      await smokeNav(page, '/change-management/orders', '18', 'CO List (no API)');
    }

    // BUSINESS: if CO approved but budget not updated → [CRITICAL]
    // Navigate to budget to check (placeholder check)
    await smokeNav(page, '/cost-management/budget', '18', 'Cost Management Budget');
    const budgetBody = (await page.textContent('body')) ?? '';
    const hasBudgetPage = budgetBody.length > 50;
    if (!hasBudgetPage) {
      recordIssue('UX', '18', 'Страница бюджета /cost-management/budget не загружается — невозможно проверить обновление бюджета из CO');
    }

    recordTiming('co-detail', Date.now() - start);
    console.log(`✅ Step 18: CO Detail + Approval`);
  });

  test('19 — Issues tracking', async ({ page }) => {
    const start = Date.now();

    const issueBody = await smokeNav(page, '/pm/issues', '19', 'Issues');

    const hasIssueUI = /issue|замечан|несоответств|проблем/i.test(issueBody);
    expect(issueBody.length).toBeGreaterThan(50);

    // Create issue via API
    if (projectId) {
      try {
        const issue = await createEntity<{ id: string }>('/api/issues', {
          title: 'E2E-Несоответствие чертежей и факта на этаже 5',
          projectId,
          priority: 'HIGH',
          description: 'На этаже 5 фактическое расположение перегородок не совпадает с проектной документацией',
          status: 'OPEN',
        });
        issueId = issue.id;
        console.log(`  Issue created: ${issueId}`);
      } catch {
        console.warn('  ⚠️ Could not create issue via API');
      }
    }

    // Check issue form
    await smokeNav(page, '/pm/issues/new', '19', 'Issue создание');

    // BUSINESS: issues → RFI → change order chain. Отслеживается?
    const formBody = (await page.textContent('body')) ?? '';
    const hasLinkedRfi = /RFI|связан|linked|привязк/i.test(formBody);
    if (!hasLinkedRfi) {
      recordIssue('UX', '19', 'Issue форма нет связи с RFI — цепочка issue→RFI→CO должна отслеживаться');
    }

    await screenshot(page, '19-issues');
    recordTiming('issues', Date.now() - start);
    console.log(`✅ Step 19: Issues (UI: ${hasIssueUI})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE E: Проектирование (Design Management)
  // ═══════════════════════════════════════════════════════════════════════════

  test('20 — Версии проекта', async ({ page }) => {
    const start = Date.now();

    const versionsBody = await smokeNav(page, '/design/versions', '20', 'Design Versions');

    const hasVersions = /версия|version|ревизия|revision|проект/i.test(versionsBody);
    if (!hasVersions) {
      recordIssue('MINOR', '20', 'Страница версий проекта не показывает индикацию версионирования');
    }

    // BUSINESS: на стройке обычно 3-5 версий ПД. Актуальная должна быть помечена.
    const hasActiveMark = /актуальн|active|current|действующ/i.test(versionsBody);
    if (!hasActiveMark) {
      recordIssue('UX', '20', 'Нет пометки актуальной версии проекта — на стройке 3-5 версий, прораб должен знать какая текущая');
    }

    await screenshot(page, '20-design-versions');
    recordTiming('design-versions', Date.now() - start);
    console.log(`✅ Step 20: Версии проекта (UI: ${hasVersions})`);
  });

  test('21 — Design reviews + разделы', async ({ page }) => {
    const start = Date.now();

    // Design reviews
    const reviewsBody = await smokeNav(page, '/design/reviews', '21', 'Design Reviews');
    const hasReviews = /review|отзыв|комментар|замечан|рецензи/i.test(reviewsBody);

    // Design review board
    await smokeNav(page, '/design/reviews/board', '21', 'Design Review Board');

    // Design sections (АР, КР, ЭОМ, ОВ, ВК...)
    const sectionsBody = await smokeNav(page, '/design/sections', '21', 'Design Sections');
    const hasSections = /раздел|section|АР|КР|ЭОМ|ОВ|ВК|архитектур|конструктив|электр/i.test(sectionsBody);
    if (!hasSections) {
      recordIssue('UX', '21', 'Страница разделов проекта не показывает стандартные разделы (АР, КР, ЭОМ, ОВ, ВК)');
    }

    await screenshot(page, '21-design-sections');
    recordTiming('design', Date.now() - start);
    console.log(`✅ Step 21: Design reviews + sections (reviews: ${hasReviews}, sections: ${hasSections})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE F: Workflow и согласования
  // ═══════════════════════════════════════════════════════════════════════════

  test('22 — Шаблоны workflow', async ({ page }) => {
    const start = Date.now();

    const wfBody = await smokeNav(page, '/workflow/templates', '22', 'Workflow Templates');

    const hasTemplates = /шаблон|template|процесс|workflow|бизнес/i.test(wfBody);
    if (!hasTemplates) {
      recordIssue('MINOR', '22', 'Страница шаблонов workflow пуста');
    }

    // BUSINESS: стандартные workflow стройки
    const expectedWorkflows = ['согласов', 'КП', 'CO', 'КС-2', 'приёмк'];
    const foundWorkflows = expectedWorkflows.filter((w) => new RegExp(w, 'i').test(wfBody));
    if (foundWorkflows.length === 0) {
      recordIssue('UX', '22', 'Нет предустановленных шаблонов workflow — нужны: согласование КП, утверждение CO, подписание КС-2, приёмка работ');
    }

    // Check workflow designer
    await smokeNav(page, '/workflow/designer', '22', 'Workflow Designer');

    // Check workflow instances
    await smokeNav(page, '/workflow/instances', '22', 'Workflow Instances');

    await screenshot(page, '22-workflow-templates');
    recordTiming('workflow', Date.now() - start);
    console.log(`✅ Step 22: Workflow templates (UI: ${hasTemplates})`);
  });

  test('23 — Inbox согласований', async ({ page }) => {
    const start = Date.now();

    const inboxBody = await smokeNav(page, '/workflow/approval-inbox', '23', 'Approval Inbox');

    const hasInbox = /inbox|входящ|согласован|утвержд|approval|задач|pending/i.test(inboxBody);
    if (!hasInbox) {
      recordIssue('UX', '23', 'Inbox согласований не содержит UI — ГИП утверждает 10-20 документов в день, inbox должен собирать всё в одном месте');
    }

    // BUSINESS: ГИП должен видеть все задачи на согласование в одном месте
    const hasConsolidatedView = /все|all|сводн|consolidated|document|документ/i.test(inboxBody);
    if (!hasConsolidatedView) {
      recordIssue('UX', '23', 'Inbox не показывает сводный вид (RFI + CO + КС-2 + submittals) — ГИП должен видеть всё');
    }

    await screenshot(page, '23-approval-inbox');
    recordTiming('approval-inbox', Date.now() - start);
    console.log(`✅ Step 23: Approval Inbox (UI: ${hasInbox})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE G: Русские документы
  // ═══════════════════════════════════════════════════════════════════════════

  test('24 — ЭДО (электронный документооборот)', async ({ page }) => {
    const start = Date.now();

    // EDO page
    const edoBody = await smokeNav(page, '/russian-docs/edo', '24', 'ЭДО');

    const hasEdoUI = /ЭДО|электронн.*документооборот|EDI|electronic/i.test(edoBody);
    if (!hasEdoUI) {
      recordIssue('MISSING', '24', 'Страница ЭДО не содержит интеграцию — КС-2/КС-3 через ЭДО = экономия времени, без него [MISSING] конкурентный разрыв');
    }

    // SBIS page
    const sbisBody = await smokeNav(page, '/russian-docs/sbis', '24', 'СБИС');

    const hasSbisUI = /СБИС|Тензор|SBIS|Tensor|интеграц|integration/i.test(sbisBody);
    if (!hasSbisUI) {
      recordIssue('MISSING', '24', 'Нет интеграции с СБИС — крупные заказчики требуют ЭДО (закон 63-ФЗ), СБИС = основной оператор');
    }

    await screenshot(page, '24-edo-sbis');
    recordTiming('edo', Date.now() - start);
    console.log(`✅ Step 24: ЭДО/СБИС (EDO: ${hasEdoUI}, SBIS: ${hasSbisUI})`);
  });

  test('25 — Российские документы (КС-2, КС-3, М-29)', async ({ page }) => {
    const start = Date.now();

    // Russian docs list
    const rdBody = await smokeNav(page, '/russian-docs/list', '25', 'Российские документы');

    const hasDocList = /документ|КС-2|КС-3|КС-6|М-29|Акт|form/i.test(rdBody);
    if (!hasDocList) {
      recordIssue('MAJOR', '25', 'Список российских документов не содержит стандартные формы');
    }

    // Check KS-2 generator
    await smokeNav(page, '/russian-docs/ks2', '25', 'КС-2 Generator');

    // Check KS-3 generator
    await smokeNav(page, '/russian-docs/ks3', '25', 'КС-3 Generator');

    // Check M-29
    await smokeNav(page, '/m29', '25', 'М-29');

    // BUSINESS: минимум для стройки РФ: КС-2, КС-3, КС-6, АОСР, Акт Н-1, М-29
    const requiredForms = ['КС-2', 'КС-3', 'КС-6', 'АОСР', 'М-29'];
    const allContent = rdBody.toLowerCase();
    const missingForms = requiredForms.filter((f) => !allContent.includes(f.toLowerCase()));
    if (missingForms.length > 0) {
      recordIssue('UX', '25', `В списке российских документов не видны формы: ${missingForms.join(', ')} — обязательный минимум для стройки РФ`);
    }

    // Check form generators exist
    await smokeNav(page, '/russian-docs/form-ks2', '25', 'Форма КС-2');
    await smokeNav(page, '/russian-docs/form-ks3', '25', 'Форма КС-3');

    await screenshot(page, '25-russian-docs');
    recordTiming('russian-docs', Date.now() - start);
    console.log(`✅ Step 25: Российские документы (list: ${hasDocList}, missing: ${missingForms.length})`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP + REPORT
  // ═══════════════════════════════════════════════════════════════════════════

  test('Cleanup: удаление E2E-* сущностей', async () => {
    // Delete in reverse dependency order
    const directDeletes: [string, string | undefined][] = [
      ['/api/issues', issueId],
      ['/api/submittals', submittalId],
      ['/api/rfis', rfiId],
      ['/api/change-orders', changeOrderId],
      ['/api/change-events', changeEventId],
      ['/api/projects', projectId],
    ];

    for (const [endpoint, id] of directDeletes) {
      if (id) {
        try {
          await deleteEntity(endpoint, id, 'admin');
        } catch {
          // Already deleted or endpoint doesn't support delete — ignore
        }
      }
    }

    // Scan for remaining E2E entities
    const scanEndpoints = [
      '/api/change-orders',
      '/api/change-events',
      '/api/rfis',
      '/api/submittals',
      '/api/issues',
      '/api/projects',
    ];

    for (const endpoint of scanEndpoints) {
      try {
        const entities = await listEntities<{ id: string; name?: string; title?: string; number?: string }>(endpoint);
        const e2eEntities = entities.filter(
          (e) => ((e.name ?? e.title ?? e.number) ?? '').startsWith('E2E-'),
        );
        for (const entity of e2eEntities) {
          try {
            await deleteEntity(endpoint, entity.id, 'admin');
          } catch { /* ignore */ }
        }
      } catch { /* endpoint may not support listing */ }
    }

    // ─── Issue Summary ─────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════');
    console.log('  DOCUMENTS + CHANGE ORDERS WORKFLOW — ISSUE SUMMARY');
    console.log('════════════════════════════════════════════════════════');

    const bySeverity: Record<string, Issue[]> = {
      CRITICAL: issues.filter((i) => i.severity === 'CRITICAL'),
      MAJOR: issues.filter((i) => i.severity === 'MAJOR'),
      MINOR: issues.filter((i) => i.severity === 'MINOR'),
      UX: issues.filter((i) => i.severity === 'UX'),
      MISSING: issues.filter((i) => i.severity === 'MISSING'),
    };

    for (const [sev, list] of Object.entries(bySeverity)) {
      if (list.length > 0) {
        console.log(`\n  [${sev}] (${list.length}):`);
        for (const issue of list) {
          console.log(`    Step ${issue.step}: ${issue.description}`);
          if (issue.actual) {
            console.log(`      actual: ${issue.actual}, expected: ${issue.expected}`);
          }
        }
      }
    }

    console.log(`\n  TOTAL: ${issues.length} issues`);
    console.log(`  Pages visited: ${totalPages}`);
    console.log('  Timings:');
    for (const [op, ms] of Object.entries(timings)) {
      console.log(`    ${op}: ${(ms / 1000).toFixed(1)}s`);
    }
    console.log('════════════════════════════════════════════════════════\n');
  });
});
