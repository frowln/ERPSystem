/**
 * WF: HR Lifecycle — Кадровик + Прораб Иванов
 *
 * Персоны:
 * 1. HR-менеджер ООО "СтройМонтаж" — оформляет нового электромонтажника:
 *    приём → договор → инструктаж → допуск → бригада.
 * 2. Прораб Иванов — ведёт табель, отмечает выработку, согласовывает отпуска.
 *
 * "В 1С кадры — это 200 кликов на одного сотрудника. У нас проще?"
 *
 * 7 фаз (A–G), 18 шагов, ~200 assertions.
 * Domain: Russian construction ERP — ТК РФ (Трудовой кодекс), T-13, СНИЛС/ИНН,
 *         сертификаты, допуски, бригады, наряды, табели, отпуска.
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  authenticatedRequest,
  createEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  getEntity,
} from '../../fixtures/api.fixture';
import { parseRussianNumber } from '../../helpers/calculation.helper';

// ─── Configuration ───────────────────────────────────────────────────────────

const SS = 'e2e/screenshots/hr-lifecycle';
const TODAY = new Date().toISOString().slice(0, 10);
const IN_14_DAYS = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
const IN_2_MONTHS = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
const IN_2M_14D = new Date(Date.now() + 74 * 86_400_000).toISOString().slice(0, 10);
const LAST_MONTH = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
const IN_11_MONTHS = new Date(Date.now() + 330 * 86_400_000).toISOString().slice(0, 10);
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed
const CURRENT_YEAR = new Date().getFullYear();

// ─── Test Data — ООО "СтройМонтаж" ──────────────────────────────────────────

const EMPLOYEE = {
  firstName: 'Андрей',
  lastName: 'E2E-Новиков',
  middleName: 'Игоревич',
  position: 'Электромонтажник 5 разряда',
  department: 'Электромонтажный участок',
  phone: '+7 (903) 555-12-34',
  email: `e2e-novikov-${Date.now()}@test.ru`,
  monthlyRate: 55000,
  passportNumber: '4515 123456',
  inn: '771234567890',
  snils: '123-456-789 01',
  contractType: 'FIXED_TERM',
};

const PROJECT = {
  name: 'E2E-ЖК Солнечный квартал',
  code: `E2E-SK-HR-${Date.now().toString().slice(-6)}`,
  type: 'RESIDENTIAL',
  budget: 450_000_000,
  status: 'IN_PROGRESS',
};

const WORK_ORDER = {
  type: 'task_order',
  crewName: 'Бригада Иванова',
  workDescription: 'E2E-Прокладка кабеля ВВГнг 3×2.5',
  volume: 120,   // metres
  rate: 85,      // ₽/m
  total: 10200,  // volume × rate
};

const CERTIFICATE = {
  name: 'Удостоверение электромонтажника, группа III',
  number: 'ЭБ-2026-001234',
  issueDate: LAST_MONTH,
  expiryDate: IN_11_MONTHS,
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

function recordIssue(
  severity: IssueSeverity,
  step: string,
  description: string,
  actual?: string,
  expected?: string,
): void {
  issues.push({ severity, step, description, actual, expected });
  const prefix = { CRITICAL: '🔴', MAJOR: '🟠', MINOR: '🟡', UX: '🟣', MISSING: '⚪' }[severity];
  console.log(`${prefix} [${severity}] Step ${step}: ${description}${actual ? ` (actual: ${actual}, expected: ${expected})` : ''}`);
}

// ─── Timing Tracker ──────────────────────────────────────────────────────────

const timings: Record<string, number> = {};

function recordTiming(operation: string, ms: number): void {
  timings[operation] = ms;
  const seconds = (ms / 1000).toFixed(1);
  console.log(`⏱ ${operation}: ${seconds}s`);
}

// ─── Shared State ────────────────────────────────────────────────────────────

let projectId: string;
let employeeId: string;
let timesheetId: string | undefined;
let workOrderId: string | undefined;
let leaveRequestId: string | undefined;
let totalPages = 0;

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe.serial('WF: HR Lifecycle — Кадровик + Прораб', () => {
  test.setTimeout(120_000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE A: Приём на работу
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step A0: Setup — создание проекта', async () => {
    // Create project via API
    const project = await createEntity<{ id: string }>('/api/projects', {
      name: PROJECT.name,
      code: PROJECT.code,
      projectType: PROJECT.type,
      budget: PROJECT.budget,
      status: PROJECT.status,
    });
    projectId = project.id;
    expect(projectId).toBeTruthy();
    console.log(`✅ Setup: project=${projectId}`);
  });

  test('Step A1: Создание сотрудника — электромонтажник 5 разряда', async ({ page }) => {
    const start = Date.now();

    // --- Create via API ---
    try {
      const emp = await createEntity<{ id: string; fullName?: string }>('/api/employees', {
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        middleName: EMPLOYEE.middleName,
        position: EMPLOYEE.position,
        status: 'ACTIVE',
        hireDate: TODAY,
        phone: EMPLOYEE.phone,
        email: EMPLOYEE.email,
        monthlyRate: EMPLOYEE.monthlyRate,
        contractType: EMPLOYEE.contractType,
        passportNumber: EMPLOYEE.passportNumber,
        inn: EMPLOYEE.inn,
        snils: EMPLOYEE.snils,
        projectId,
      });
      employeeId = emp.id;
      expect(employeeId).toBeTruthy();
    } catch {
      recordIssue('MAJOR', 'A1', 'Employee creation via API failed — trying UI');

      // Fallback: create via UI
      await page.goto('/employees/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      totalPages++;

      // Fill form fields by label/name/placeholder
      const fields: Array<[string, string]> = [
        ['lastName', EMPLOYEE.lastName],
        ['firstName', EMPLOYEE.firstName],
        ['middleName', EMPLOYEE.middleName],
        ['position', EMPLOYEE.position],
        ['phone', EMPLOYEE.phone],
        ['email', EMPLOYEE.email],
        ['hireDate', TODAY],
      ];

      for (const [name, value] of fields) {
        const input = page.locator(`input[name="${name}"]`)
          .or(page.locator(`[data-testid="${name}"]`))
          .or(page.getByPlaceholder(new RegExp(name, 'i')));

        if (await input.first().isVisible().catch(() => false)) {
          await input.first().fill(value);
        }
      }

      // Submit
      const submitBtn = page.getByRole('button', { name: /сохранить|создать|save|create/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForResponse(r => r.url().includes('/api/employees') && r.status() < 500, { timeout: 15_000 }).catch(() => null),
          submitBtn.click(),
        ]);
        await page.waitForTimeout(2000);

        // Extract ID from URL if navigated to detail page
        const url = page.url();
        const idMatch = url.match(/\/employees\/([a-f0-9-]+)/);
        if (idMatch) {
          employeeId = idMatch[1];
        }
      }
    }

    const createMs = Date.now() - start;
    recordTiming('employee-create', createMs);

    // --- Verify in UI ---
    await page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    const hasEmployee = body.includes('E2E-Новиков') || body.includes(EMPLOYEE.lastName);
    expect.soft(hasEmployee, 'Employee should appear in list').toBeTruthy();

    // Navigate to detail page to verify fields
    if (employeeId) {
      await page.goto(`/employees/${employeeId}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      totalPages++;

      const detailBody = (await page.textContent('body')) ?? '';

      // Check all fields saved correctly
      expect.soft(detailBody).toContain(EMPLOYEE.position);
      if (!detailBody.includes(EMPLOYEE.firstName)) {
        recordIssue('MINOR', 'A1', 'First name not visible on detail page');
      }

      // --- BUSINESS: RF cadre fields check ---
      // For Russian cadre accounting: СНИЛС, ИНН, паспорт, адрес, образование
      const hasSnils = detailBody.match(/снилс|snils/i);
      const hasInn = detailBody.match(/инн|inn/i);
      const hasPassport = detailBody.match(/паспорт|passport/i);
      const hasAddress = detailBody.match(/адрес|address/i);
      const hasEducation = detailBody.match(/образовани|education/i);

      if (!hasSnils) recordIssue('MISSING', 'A1', 'No СНИЛС field visible — required for RF cadre accounting');
      if (!hasInn) recordIssue('MISSING', 'A1', 'No ИНН field visible — required for RF cadre accounting');
      if (!hasPassport) recordIssue('MISSING', 'A1', 'No passport data field visible — required for RF cadre accounting');
      if (!hasAddress) recordIssue('MISSING', 'A1', 'No address field — required for personnel record (Т-2 form)');
      if (!hasEducation) recordIssue('MISSING', 'A1', 'No education field — required for personnel record (Т-2 form)');
    }

    await page.screenshot({ path: `${SS}/employee-created.png`, fullPage: true }).catch(() => {});
  });

  test('Step A2: Трудовой договор (РФ документы)', async ({ page }) => {
    // Navigate to employment contracts
    await page.goto('/hr-russian/employment-contracts', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';

    // Check page loaded
    expect(body.length, 'Employment contracts page should render').toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');

    // Check for create functionality
    const createBtn = page.getByRole('button', { name: /создать|добавить|new|create/i })
      .or(page.locator('a[href*="new"], a[href*="create"]'));
    const hasCreateBtn = (await createBtn.count()) > 0;

    if (!hasCreateBtn) {
      recordIssue('MAJOR', 'A2', 'No "Create" button on employment contracts page — cannot create ТД');
    }

    // Check for contract type fields
    const hasContractTypes = body.match(/срочный|бессрочный|fixed.?term|permanent|тип.*договор/i);
    if (!hasContractTypes) {
      recordIssue('MISSING', 'A2', 'No contract type distinction (срочный/бессрочный) — ТК РФ requires this');
    }

    // BUSINESS: срочный договор >5 лет = нарушение ТК
    const hasTermValidation = body.match(/срок|5.*лет|duration|term.*limit/i);
    if (!hasTermValidation) {
      recordIssue('UX', 'A2', 'No visible term limit validation — system should warn if fixed-term >5 years (ТК violation)');
    }

    // Try to create a contract via create button or modal
    if (hasCreateBtn) {
      await createBtn.first().click();
      await page.waitForTimeout(1500);

      const formBody = (await page.textContent('body')) ?? '';
      // Check form fields present
      const hasEmployeeField = formBody.match(/сотрудник|employee/i);
      const hasNumberField = formBody.match(/номер|number/i);
      const hasTypeField = formBody.match(/тип|type/i);
      const hasSalaryField = formBody.match(/оклад|salary|ставка|rate/i);

      if (!hasEmployeeField) recordIssue('MISSING', 'A2', 'Contract form missing employee field');
      if (!hasNumberField) recordIssue('MISSING', 'A2', 'Contract form missing contract number field');
      if (!hasTypeField) recordIssue('MISSING', 'A2', 'Contract form missing contract type field');
      if (!hasSalaryField) recordIssue('MISSING', 'A2', 'Contract form missing salary/rate field');
    }

    await page.screenshot({ path: `${SS}/employment-contract.png`, fullPage: true }).catch(() => {});
  });

  test('Step A3: Штатное расписание — проверка отражения', async ({ page }) => {
    await page.goto('/hr/staffing-schedule', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Staffing schedule should render').toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');

    // Check page has structure: department → position → people
    const hasDepartments = body.match(/подразделен|department|отдел/i);
    const hasPositions = body.match(/должност|position|вакан/i);

    if (!hasDepartments) recordIssue('MINOR', 'A3', 'Staffing schedule has no department column');
    if (!hasPositions) recordIssue('MINOR', 'A3', 'Staffing schedule has no position column');

    // Check metrics
    const metricCards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    const hasMetrics = (await metricCards.count()) >= 2;
    if (!hasMetrics) {
      recordIssue('UX', 'A3', 'Staffing schedule missing KPI metrics (total positions, fill rate)');
    }

    // BUSINESS: new employee should be reflected in staffing
    // If the employee's department is listed, the staffing schedule should show it
    const hasElectricalDept = body.match(/электромонтаж|electrical/i);
    if (!hasElectricalDept) {
      recordIssue('MINOR', 'A3', 'Employee department not reflected in staffing schedule — may need manual sync');
    }

    // Check for vacancy creation
    const createVacancyBtn = page.getByRole('button', { name: /создать|добавить|вакан|new/i });
    if ((await createVacancyBtn.count()) === 0) {
      recordIssue('MISSING', 'A3', 'No vacancy creation button — cannot manage open positions');
    }

    await page.screenshot({ path: `${SS}/staffing-schedule.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE B: Обучение и допуск
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step B1: Вводный инструктаж по ОТ', async ({ page }) => {
    await page.goto('/safety/briefings', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Safety briefings page should render').toBeGreaterThan(50);

    // Check for briefing types
    const hasBriefingType = body.match(/вводн|первичн|повторн|внеплан|целев|introductory|initial|repeat/i);
    if (!hasBriefingType) {
      recordIssue('MISSING', 'B1', 'No briefing type classification — vvodny/pervichny/povtorny required by law');
    }

    // Check create functionality
    const createBtn = page.getByRole('button', { name: /создать|добавить|провести|new|create/i })
      .or(page.locator('a[href*="new"]'));
    const hasCreate = (await createBtn.count()) > 0;

    if (!hasCreate) {
      recordIssue('MAJOR', 'B1', 'No create button on safety briefings page');
    }

    // BUSINESS CRITICAL: без вводного инструктажа НЕЛЬЗЯ выпускать на площадку
    const hasBlockingLogic = body.match(/блокир|допуск|access.*denied|not.*allowed|требуется.*инструктаж/i);
    if (!hasBlockingLogic) {
      recordIssue('CRITICAL', 'B1', 'No evidence of site access blocking without safety briefing — legally REQUIRED in RF construction');
    }

    // Check for instructor field
    const hasInstructor = body.match(/инструктор|instructor|ответственн|responsible/i);
    if (!hasInstructor) {
      recordIssue('MISSING', 'B1', 'No instructor field — required for briefing documentation');
    }

    // Check for result field (зачёт/не зачёт)
    const hasResult = body.match(/результат|зачёт|result|pass|fail/i);
    if (!hasResult) {
      recordIssue('MISSING', 'B1', 'No result field (зачёт/незачёт) — required for briefing records');
    }

    await page.screenshot({ path: `${SS}/safety-briefing.png`, fullPage: true }).catch(() => {});
  });

  test('Step B2: Обучение по электробезопасности + журнал', async ({ page }) => {
    await page.goto('/safety/training-journal', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Safety training journal should render').toBeGreaterThan(50);

    // Check for training types
    const hasTrainingTypes = body.match(/обучени|training|электробезопас|пожарн|первая.*помощь/i);
    if (!hasTrainingTypes) {
      recordIssue('MINOR', 'B2', 'Training journal shows no training type labels');
    }

    // Check for expiry date tracking
    const hasExpiry = body.match(/срок.*действ|expir|годен.*до|valid.*until|истекает/i);
    if (!hasExpiry) {
      recordIssue('MAJOR', 'B2', 'No expiry date tracking — electrical safety permits expire in 12 months, system must track this');
    }

    // Check for create functionality
    const createBtn = page.getByRole('button', { name: /создать|добавить|new|create/i });
    if ((await createBtn.count()) === 0) {
      recordIssue('MAJOR', 'B2', 'No create button on training journal page');
    }

    // Now check certification matrix
    await page.goto('/hr/certification-matrix', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const matrixBody = (await page.textContent('body')) ?? '';
    expect(matrixBody.length, 'Certification matrix should render').toBeGreaterThan(50);

    // BUSINESS: допуск по электробезопасности истекает через 12 мес.
    // Система должна напомнить за 30 дней
    const hasExpiringAlerts = matrixBody.match(/истекает|expiring|предупрежд|warning|alert|30.*дн/i);
    if (!hasExpiringAlerts) {
      recordIssue('MAJOR', 'B2', 'Certification matrix has no expiring-soon alerts — must warn 30 days before expiry');
    }

    // Check for compliance dashboard metrics
    const complianceMetrics = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    const hasComplianceCards = (await complianceMetrics.count()) >= 2;
    if (!hasComplianceCards) {
      recordIssue('UX', 'B2', 'Certification matrix missing compliance dashboard (valid/expiring/expired counts)');
    }

    // Check for status indicators
    const hasStatusBadges = matrixBody.match(/действующ|valid|просрочен|expired|истекает|expiring/i);
    if (hasStatusBadges) {
      console.log('✅ Certification matrix has status indicators (valid/expiring/expired)');
    }

    await page.screenshot({ path: `${SS}/certification-matrix.png`, fullPage: true }).catch(() => {});
  });

  test('Step B3: СИЗ (средства индивидуальной защиты)', async ({ page }) => {
    await page.goto('/safety/ppe', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'PPE page should render').toBeGreaterThan(50);

    // Check for PPE-related content
    const hasPpeContent = body.match(/сиз|ppe|каск|перчатк|ботинк|жилет|helmet|gloves|boots|vest/i);
    if (!hasPpeContent) {
      recordIssue('MISSING', 'B3', 'PPE page has no PPE-related content — should list required equipment by position');
    }

    // Check for issuance tracking
    const hasIssuance = body.match(/выдач|issue|получен|received|дата.*выдач/i);
    if (!hasIssuance) {
      recordIssue('MISSING', 'B3', 'No PPE issuance tracking — must record who got what equipment and when');
    }

    // BUSINESS: без каски на площадку нельзя
    const hasMandatoryPpe = body.match(/обязательн|mandatory|required|норм.*выдач|standard.*issue/i);
    if (!hasMandatoryPpe) {
      recordIssue('UX', 'B3', 'No indication of mandatory PPE by position — system should know that electrician needs dielectric gloves');
    }

    await page.screenshot({ path: `${SS}/ppe-management.png`, fullPage: true }).catch(() => {});
  });

  test('Step B4: Сертификаты и удостоверения сотрудника', async ({ page }) => {
    // Try to add certificate via API
    if (employeeId) {
      try {
        await createEntity('/api/employees/' + employeeId + '/certificates', {
          name: CERTIFICATE.name,
          certificateNumber: CERTIFICATE.number,
          issueDate: CERTIFICATE.issueDate,
          expiryDate: CERTIFICATE.expiryDate,
          type: 'ELECTRICAL_SAFETY',
        });
        console.log('✅ Certificate added via API');
      } catch {
        recordIssue('MINOR', 'B4', 'Could not add certificate via API — may need different endpoint or field names');
      }
    }

    // Navigate to worker certificates page
    await page.goto('/safety/worker-certs', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Worker certificates page should render').toBeGreaterThan(50);

    // Check for certificate content
    const hasCertContent = body.match(/удостоверен|сертификат|certificate|допуск|qualification/i);
    if (!hasCertContent) {
      recordIssue('MISSING', 'B4', 'Worker certificates page has no certificate-related content');
    }

    // Check safety certification matrix
    await page.goto('/safety/certification-matrix', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const matrixBody = (await page.textContent('body')) ?? '';

    // BUSINESS: просроченный сертификат = нельзя допускать к работе
    const hasExpiredIndicator = matrixBody.match(/просроч|expired|недействит|invalid|red|danger/i);
    if (!hasExpiredIndicator) {
      recordIssue('MAJOR', 'B4', 'No expired certificate indicator — must clearly show if worker cannot be admitted to work');
    }

    await page.screenshot({ path: `${SS}/worker-certificates.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE C: Назначение в бригаду
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step C1: Бригады — добавление сотрудника', async ({ page }) => {
    await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Crew page should render').toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');

    // Check crew list content
    const hasCrewContent = body.match(/бригад|crew|team|состав|member/i);
    if (!hasCrewContent) {
      recordIssue('MISSING', 'C1', 'Crew page has no crew-related content');
    }

    // Check for crew details: ФИО, должность, допуски
    const hasPersonnelFields = body.match(/сотрудник|фио|employee|worker|member/i);
    const hasQualifications = body.match(/допуск|квалифик|qualification|сертификат/i);

    if (!hasPersonnelFields) {
      recordIssue('MINOR', 'C1', 'Crew page does not show individual members');
    }
    if (!hasQualifications) {
      recordIssue('UX', 'C1', 'Crew page does not show member qualifications/permits — foreman needs this for assignments');
    }

    // Check metrics
    const metricCards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    const cardCount = await metricCards.count();
    expect.soft(cardCount, 'Should have crew metrics cards').toBeGreaterThanOrEqual(2);

    // Check for crew assignment
    const assignBtn = page.getByRole('button', { name: /назначить|добавить|assign|add/i });
    if ((await assignBtn.count()) === 0) {
      recordIssue('MAJOR', 'C1', 'No crew assignment button — cannot add workers to crews');
    }

    // BUSINESS: на стройке бригада = основная единица учёта. Не сотрудник, а бригада.
    const hasForeman = body.match(/бригадир|foreman|старший|lead/i);
    if (!hasForeman) {
      recordIssue('UX', 'C1', 'No foreman (бригадир) designation — every crew must have a named foreman');
    }

    // Try API-based crew assignment
    if (employeeId) {
      try {
        await createEntity('/api/crew', {
          employeeId,
          projectId,
          role: 'Электромонтажник',
          startDate: TODAY,
        });
        console.log('✅ Employee assigned to project crew via API');
      } catch {
        recordIssue('MINOR', 'C1', 'Could not assign employee to crew via API');
      }
    }

    await page.screenshot({ path: `${SS}/crew-management.png`, fullPage: true }).catch(() => {});
  });

  test('Step C2: Самозанятые — проверка модуля', async ({ page }) => {
    await page.goto('/self-employed', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';

    // Check if page exists and renders
    const isNotFound = body.match(/not found|404|не найден/i);
    const isEmpty = body.length < 100;

    if (isNotFound || isEmpty) {
      recordIssue('MISSING', 'C2', 'Self-employed module (/self-employed) not implemented — 30% of construction workforce are self-employed (штукатуры, плиточники), need ГПХ tracking');
    } else {
      // Page exists — check content
      const hasSelfEmployedContent = body.match(/самозанят|self.?employ|гпх|гражданско|ИП|ИНН/i);
      if (!hasSelfEmployedContent) {
        recordIssue('UX', 'C2', 'Self-employed page renders but has no relevant content');
      }

      // BUSINESS: для самозанятых другой учёт: не трудовой договор, а ГПХ
      const hasGphDistinction = body.match(/гпх|гражданско.*правов|civil.*law|contract.*type/i);
      if (!hasGphDistinction) {
        recordIssue('MISSING', 'C2', 'No ГПХ contract type distinction — self-employed workers need different accounting than employees');
      }
    }

    await page.screenshot({ path: `${SS}/self-employed.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE D: Табельный учёт
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step D1: Табель Т-13 — обязательная форма', async ({ page }) => {
    const start = Date.now();

    await page.goto('/hr/timesheet-t13', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const loadMs = Date.now() - start;
    recordTiming('t13-load', loadMs);

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'T-13 page should render').toBeGreaterThan(50);

    // Check for T-13 structure
    const hasT13Content = body.match(/т-?13|табел|timesheet|attendance/i);
    expect.soft(hasT13Content, 'Page should contain T-13 related content').toBeTruthy();

    // Check for attendance codes (Russian abbreviations)
    const attendanceCodes = ['Я', 'Б', 'О', 'К', 'НН', 'В', 'Н'];
    const hasAnyCodes = attendanceCodes.some(code => body.includes(code));

    if (!hasAnyCodes) {
      recordIssue('MINOR', 'D1', 'No attendance codes visible (Я/Б/О/К/НН/В/Н) — may need data or project selection');
    }

    // Check for project selector (T-13 is per-project)
    const projectSelector = page.locator('select, [role="combobox"], [class*="select"]');
    const hasProjectSelector = (await projectSelector.count()) > 0;
    if (!hasProjectSelector) {
      recordIssue('UX', 'D1', 'No project selector on T-13 page — T-13 is per-project');
    }

    // Check for month/period selector
    const monthSelector = body.match(/январ|феврал|март|апрел|май|июн|июл|август|сентябр|октябр|ноябр|декабр|month|период|period/i);
    if (!monthSelector) {
      recordIssue('UX', 'D1', 'No month selector on T-13 page — must select period');
    }

    // Check for day columns (1-31)
    const hasDayColumns = body.match(/\b(1[0-9]|2[0-9]|3[01]|[1-9])\b/);
    // This is a weak check — T-13 should have 31 day columns

    // Check totals section
    const hasTotals = body.match(/итого|total|всего|часов|hours|дней|days/i);
    if (!hasTotals) {
      recordIssue('MINOR', 'D1', 'No totals section visible — T-13 must show total days and hours per employee');
    }

    // BUSINESS: T-13 — обязательная форма для бухгалтерии
    // If this page doesn't generate proper T-13, accountant can't process payroll
    const hasExportOrPrint = body.match(/экспорт|export|печать|print|скачать|download|excel|pdf/i);
    if (!hasExportOrPrint) {
      recordIssue('MAJOR', 'D1', 'No export/print for T-13 — accountant needs this as Goskomstat form for payroll');
    }

    await page.screenshot({ path: `${SS}/timesheet-t13.png`, fullPage: true }).catch(() => {});
  });

  test('Step D2: Табель (обычный) — создание записи', async ({ page }) => {
    // Create timesheet entry via API
    if (employeeId) {
      try {
        const ts = await createEntity<{ id: string }>('/api/timesheets', {
          employeeId,
          projectId,
          workDate: TODAY,
          hoursWorked: 8,
          overtimeHours: 0,
          notes: 'E2E-Электромонтаж кабельных лотков',
          status: 'DRAFT',
        });
        timesheetId = ts.id;
        expect(timesheetId).toBeTruthy();
        console.log(`✅ Timesheet created: ${timesheetId}`);
      } catch {
        recordIssue('MAJOR', 'D2', 'Could not create timesheet entry via API');
      }
    }

    // Navigate to timesheets list
    await page.goto('/timesheets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Timesheets page should render').toBeGreaterThan(50);

    // Check timesheet entry visible
    if (timesheetId) {
      const hasEntry = body.includes('E2E-Новиков') || body.includes(EMPLOYEE.lastName) || body.includes('Электромонтаж');
      if (!hasEntry) {
        recordIssue('MINOR', 'D2', 'Timesheet entry not visible in list — may need filter adjustment');
      }
    }

    // --- Test: try to enter >12 hours ---
    if (employeeId) {
      let accepted13Hours = false;
      try {
        const badTs = await createEntity<{ id: string }>('/api/timesheets', {
          employeeId,
          projectId,
          workDate: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10), // yesterday
          hoursWorked: 13,
          overtimeHours: 5,
          notes: 'E2E-Тест превышения 12 часов',
          status: 'DRAFT',
        });
        accepted13Hours = true;
        // Clean up the bad entry
        try { await deleteEntity('/api/timesheets', badTs.id); } catch { /* ignore */ }
      } catch {
        // Expected: API should reject >12 hours
        console.log('✅ API correctly rejects >12 hours timesheet entry');
      }

      if (accepted13Hours) {
        recordIssue('MAJOR', 'D2', 'System accepted 13 hours in a timesheet — ТК РФ limits to 12 hours/day', '13', '≤12');
      }
    }

    // --- Test: 0 hours in a workday ---
    if (employeeId) {
      try {
        const zeroTs = await createEntity<{ id: string }>('/api/timesheets', {
          employeeId,
          projectId,
          workDate: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10),
          hoursWorked: 0,
          overtimeHours: 0,
          notes: 'E2E-Тест нулевых часов',
          status: 'DRAFT',
        });
        // 0 hours is OK (sick leave, vacation, etc.) but system should ask for reason
        console.log('⚠️ System accepted 0 hours — should prompt for absence reason (Б/О/К)');
        recordIssue('UX', 'D2', 'System accepted 0 hours without asking for absence code (Б/О/К) — foreman should justify zero hours');
        try { await deleteEntity('/api/timesheets', zeroTs.id); } catch { /* ignore */ }
      } catch {
        // Also acceptable — system may require >0 hours
      }
    }

    // Check tabs (All, Draft, Submitted, Approved, Rejected)
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /черновик|draft|отправл|submitted|утвержд|approved|отклон|rejected/i });
    const hasStatusTabs = (await tabs.count()) >= 2;
    if (!hasStatusTabs) {
      recordIssue('MINOR', 'D2', 'No status filter tabs on timesheet list');
    }

    await page.screenshot({ path: `${SS}/timesheet-list.png`, fullPage: true }).catch(() => {});
  });

  test('Step D3: Наряд на работы (сдельная оплата)', async ({ page }) => {
    // Create work order via API
    try {
      const wo = await createEntity<{ id: string }>('/api/hr/work-orders', {
        type: WORK_ORDER.type,
        projectId,
        crewName: WORK_ORDER.crewName,
        workDescription: WORK_ORDER.workDescription,
        date: TODAY,
        endDate: TODAY,
        safetyRequirements: 'Каска, перчатки диэлектрические, жилет',
      });
      workOrderId = wo.id;
      expect(workOrderId).toBeTruthy();
      console.log(`✅ Work order created: ${workOrderId}`);
    } catch {
      recordIssue('MAJOR', 'D3', 'Could not create work order via API');
    }

    // Navigate to work orders page
    await page.goto('/hr/work-orders', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Work orders page should render').toBeGreaterThan(50);

    // Check work order visible
    const hasWorkOrder = body.includes('E2E-Прокладка') || body.includes(WORK_ORDER.workDescription) || body.includes('Бригада Иванова');
    if (workOrderId && !hasWorkOrder) {
      recordIssue('MINOR', 'D3', 'Work order not visible in list');
    }

    // Check for piece-rate calculation fields
    const hasPieceRate = body.match(/объём|volume|расценк|rate|итого|total|сдельн|piece/i);
    if (!hasPieceRate) {
      recordIssue('MISSING', 'D3', 'No piece-rate fields (volume × rate = total) on work orders — construction relies on сдельная оплата');
    }

    // BUSINESS: итого = объём × расценка = РОВНО 10 200.00
    // Check if the page shows calculation
    const hasCalculation = body.match(/10\s?200|расчёт|calculation/i);
    if (!hasCalculation) {
      // Expected — piece-rate calc may not be in the work order form
      recordIssue('UX', 'D3', 'Work order does not auto-calculate piece-rate total (volume × rate) — foreman needs this for payroll');
    }

    // Check for safety requirements field
    const hasSafetyField = body.match(/безопасност|safety|требован|requirement|сиз|ppe/i);
    if (!hasSafetyField) {
      recordIssue('UX', 'D3', 'Work order does not show safety requirements — every наряд must have safety section');
    }

    await page.screenshot({ path: `${SS}/work-orders.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE E: Отпуска и отсутствия
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step E1: Заявка на отпуск', async ({ page }) => {
    await page.goto('/leave/requests', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Leave requests page should render').toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');

    // Check for leave request content
    const hasLeaveContent = body.match(/отпуск|leave|отсутств|absence|заявк|request/i);
    if (!hasLeaveContent) {
      recordIssue('MISSING', 'E1', 'Leave requests page has no leave-related content');
    }

    // Check for create functionality
    const createBtn = page.getByRole('button', { name: /создать|добавить|new|create|подать/i });
    const hasCreate = (await createBtn.count()) > 0;

    if (hasCreate) {
      await createBtn.first().click();
      await page.waitForTimeout(1500);

      const formBody = (await page.textContent('body')) ?? '';

      // Check form fields
      const hasEmployeeField = formBody.match(/сотрудник|employee/i);
      const hasTypeField = formBody.match(/тип|type|вид|kind/i);
      const hasDateFields = formBody.match(/дата|date|начал|start|оконч|end/i);
      const hasDaysField = formBody.match(/дней|days|количеств|count/i);

      if (!hasTypeField) {
        recordIssue('MISSING', 'E1', 'Leave form missing type field (ежегодный/учебный/без сохранения)');
      }

      // BUSINESS: по ТК РФ минимальный отпуск = 28 дней в год, одна часть ≥14 дней
      const has14DayRule = formBody.match(/14|четырнадцат|минимальн|minimum/i);
      if (!has14DayRule) {
        recordIssue('UX', 'E1', 'No 14-day minimum rule validation — ТК РФ requires at least one leave part ≥14 days');
      }
    } else {
      recordIssue('MAJOR', 'E1', 'No create button on leave requests page — cannot submit leave request');
    }

    // BUSINESS: стройка в разгаре — прораб может не отпустить
    const hasApprovalWorkflow = body.match(/согласован|approval|статус|status|pending|на.*рассмотрен/i);
    if (!hasApprovalWorkflow) {
      recordIssue('MAJOR', 'E1', 'No approval workflow for leave requests — foreman must be able to approve/reject');
    }

    await page.screenshot({ path: `${SS}/leave-requests.png`, fullPage: true }).catch(() => {});
  });

  test('Step E2: Сведения о стаже и отпусках', async ({ page }) => {
    // Check seniority-leave page for balance tracking
    await page.goto('/hr/seniority-leave', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Seniority & leave page should render').toBeGreaterThan(50);

    // Check for seniority data
    const hasSeniority = body.match(/стаж|seniority|выслуг|tenure|лет.*мес/i);
    if (!hasSeniority) {
      recordIssue('MINOR', 'E2', 'No seniority (стаж) data visible');
    }

    // Check for leave balance
    const hasLeaveBalance = body.match(/остаток|balance|использован|used|баланс|remaining/i);
    if (!hasLeaveBalance) {
      recordIssue('MAJOR', 'E2', 'No leave balance tracking — HR must know how many days each employee has left');
    }

    // BUSINESS: leave balance cannot go negative
    const hasNegativeCheck = body.match(/отрицательн|negative|превышен|exceed/i);
    // This is hard to verify without data — record as UX observation
    if (!hasNegativeCheck) {
      recordIssue('UX', 'E2', 'No visible indication of negative leave balance prevention');
    }

    await page.screenshot({ path: `${SS}/seniority-leave.png`, fullPage: true }).catch(() => {});
  });

  test('Step E3: Больничный (незапланированное отсутствие)', async ({ page }) => {
    // Navigate to leave board for absence tracking
    await page.goto('/leave/board', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Leave board should render').toBeGreaterThan(50);

    // Check for sick leave tracking
    const hasSickLeave = body.match(/больничн|sick|нетрудоспособ|disability|б\/л|medical/i);
    if (!hasSickLeave) {
      recordIssue('MISSING', 'E3', 'No sick leave tracking visible on leave board');
    }

    // BUSINESS: на стройке больничный = бригада работает в неполном составе.
    // Прораб должен увидеть уведомление.
    const hasNotification = body.match(/уведомлен|notification|оповещ|alert|предупрежд/i);
    if (!hasNotification) {
      recordIssue('UX', 'E3', 'No foreman notification when crew member goes on sick leave — team may be understaffed');
    }

    // Check for absence types
    const hasAbsenceTypes = body.match(/тип|type|больничн|sick|отпуск|leave|командировк|business.*trip/i);
    if (hasAbsenceTypes) {
      console.log('✅ Leave board shows absence type classification');
    }

    await page.screenshot({ path: `${SS}/leave-board.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE F: Увольнение
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step F1: Процедура увольнения', async ({ page }) => {
    if (!employeeId) {
      recordIssue('MAJOR', 'F1', 'No employee created — cannot test termination');
      return;
    }

    // Try to change employee status to TERMINATED via API
    let terminationWorked = false;
    try {
      await updateEntity('/api/employees', employeeId, {
        status: 'TERMINATED',
        terminationDate: IN_14_DAYS,
      });
      terminationWorked = true;
      console.log('✅ Employee status changed to TERMINATED via API');
    } catch {
      // Try PATCH
      try {
        await authenticatedRequest('admin', 'PATCH', `/api/employees/${employeeId}`, {
          status: 'TERMINATED',
          terminationDate: IN_14_DAYS,
        });
        terminationWorked = true;
      } catch {
        recordIssue('MAJOR', 'F1', 'Cannot change employee status to TERMINATED via API');
      }
    }

    // Navigate to employee detail to verify
    await page.goto(`/employees/${employeeId}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';

    if (terminationWorked) {
      // Check status changed
      const hasTerminatedStatus = body.match(/уволен|terminated|inactive|dismissed/i);
      if (!hasTerminatedStatus) {
        recordIssue('MINOR', 'F1', 'Terminated status not clearly displayed on employee card');
      }
    }

    // Check for termination reason field
    const hasReason = body.match(/основани|reason|причин|cause|по.*собственн|by.*own|статья|article/i);
    if (!hasReason) {
      recordIssue('MISSING', 'F1', 'No termination reason field — must specify basis (ТК РФ article, own wish, etc.)');
    }

    // Check for 14-day notice period (отработка)
    const hasNoticePeriod = body.match(/отработк|notice|14.*дн|14.*day/i);
    if (!hasNoticePeriod) {
      recordIssue('UX', 'F1', 'No notice period tracking (отработка 14 дней) — legally required for voluntary resignation');
    }

    // BUSINESS: after termination, employee should NOT be assignable
    // Try to create a timesheet for terminated employee
    if (terminationWorked && employeeId) {
      let assignedAfterTermination = false;
      try {
        const badTs = await createEntity<{ id: string }>('/api/timesheets', {
          employeeId,
          projectId,
          workDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10), // 30 days from now (after termination)
          hoursWorked: 8,
          notes: 'E2E-Тест назначения после увольнения',
          status: 'DRAFT',
        });
        assignedAfterTermination = true;
        try { await deleteEntity('/api/timesheets', badTs.id); } catch { /* ignore */ }
      } catch {
        console.log('✅ System correctly blocks timesheet creation for terminated employee');
      }

      if (assignedAfterTermination) {
        recordIssue('CRITICAL', 'F1', 'Terminated employee can still receive timesheet entries — "мёртвые души" risk', 'allowed', 'blocked');
      }
    }

    // Restore employee to ACTIVE for cleanup
    if (terminationWorked) {
      try {
        await updateEntity('/api/employees', employeeId, { status: 'ACTIVE', terminationDate: null });
      } catch {
        // Ignore — employee may stay terminated for cleanup
      }
    }

    await page.screenshot({ path: `${SS}/employee-termination.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE G: Сквозные проверки
  // ═══════════════════════════════════════════════════════════════════════════

  test('Step G1: Сквозная цепочка: Сотрудник → Бригада → Проект → Табель', async ({ page }) => {
    // Verify the chain: employee → crew → project → timesheet
    const chainResults: Record<string, boolean> = {};

    // 1. Employee exists
    if (employeeId) {
      try {
        const emp = await getEntity<{ id: string; status?: string; fullName?: string }>('/api/employees', employeeId);
        chainResults['employee_exists'] = !!emp.id;
        console.log(`✅ Chain: Employee ${emp.fullName ?? emp.id} exists`);
      } catch {
        chainResults['employee_exists'] = false;
      }
    }

    // 2. Employee is assigned to project (crew)
    if (employeeId) {
      try {
        const assignments = await listEntities<{ projectId?: string }>(`/api/crew/employee/${employeeId}`);
        chainResults['crew_assigned'] = assignments.length > 0;
        if (assignments.length > 0) {
          console.log(`✅ Chain: Employee assigned to ${assignments.length} project(s)`);
        }
      } catch {
        chainResults['crew_assigned'] = false;
      }
    }

    // 3. Timesheet exists for employee
    if (employeeId) {
      try {
        const timesheets = await listEntities<{ id: string }>(`/api/timesheets/employee/${employeeId}`);
        chainResults['timesheet_exists'] = timesheets.length > 0;
        if (timesheets.length > 0) {
          console.log(`✅ Chain: ${timesheets.length} timesheet record(s) found`);
        }
      } catch {
        chainResults['timesheet_exists'] = false;
      }
    }

    // 4. Certificates check
    if (employeeId) {
      try {
        const certs = await listEntities<{ id: string; status?: string }>(`/api/employees/${employeeId}/certificates`);
        chainResults['certs_valid'] = certs.length > 0;
        const expiredCerts = certs.filter(c => c.status === 'EXPIRED');
        if (expiredCerts.length > 0) {
          recordIssue('MAJOR', 'G1', `Employee has ${expiredCerts.length} expired certificate(s) — should not be admitted to work`);
        }
      } catch {
        chainResults['certs_valid'] = false;
      }
    }

    // Report chain integrity
    const chainComplete = Object.values(chainResults).every(v => v);
    if (!chainComplete) {
      const missing = Object.entries(chainResults).filter(([, v]) => !v).map(([k]) => k);
      recordIssue('MAJOR', 'G1', `Employee lifecycle chain incomplete: missing ${missing.join(', ')}`, missing.join(', '), 'all present');
    } else {
      console.log('✅ Full chain: Employee → Crew → Project → Timesheet — complete');
    }

    // Navigate to employee list and verify
    await page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    const hasEmployee = body.includes('E2E-Новиков');
    expect.soft(hasEmployee, 'E2E employee should be visible in list').toBeTruthy();
  });

  test('Step G2: Квалификации — журнал и проверки', async ({ page }) => {
    // Check qualifications journal
    await page.goto('/hr/qualifications', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    totalPages++;

    const body = (await page.textContent('body')) ?? '';
    expect(body.length, 'Qualifications journal should render').toBeGreaterThan(50);

    // Check for qualification tracking
    const hasQualContent = body.match(/квалифик|qualification|допуск|permit|удостоверен|certificate/i);
    if (!hasQualContent) {
      recordIssue('MINOR', 'G2', 'Qualifications journal has no qualification-related content');
    }

    // Check for status tracking (valid/expiring/expired)
    const hasStatusTracking = body.match(/действующ|valid|истекает|expiring|просрочен|expired/i);
    if (!hasStatusTracking) {
      recordIssue('MAJOR', 'G2', 'Qualifications journal has no status tracking (valid/expiring/expired)');
    }

    // Try to create a qualification record via API
    if (employeeId) {
      try {
        await createEntity('/api/hr/qualifications', {
          employeeId,
          qualificationType: 'Электробезопасность III группа',
          certificateNumber: CERTIFICATE.number,
          issueDate: CERTIFICATE.issueDate,
          expiryDate: CERTIFICATE.expiryDate,
        });
        console.log('✅ Qualification record created via API');
      } catch {
        recordIssue('MINOR', 'G2', 'Could not create qualification record via API');
      }
    }

    // Check metrics cards
    const metricCards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    const hasMetrics = (await metricCards.count()) >= 2;
    if (!hasMetrics) {
      recordIssue('UX', 'G2', 'Qualifications journal missing summary metrics (total/valid/expiring/expired)');
    }

    await page.screenshot({ path: `${SS}/qualifications-journal.png`, fullPage: true }).catch(() => {});
  });

  test('Step G3: HR дашборд', async ({ page }) => {
    // Check for HR/analytics dashboard
    const dashboardUrls = ['/hr/dashboard', '/analytics', '/admin/dashboard'];
    let dashboardFound = false;

    for (const url of dashboardUrls) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      totalPages++;

      const body = (await page.textContent('body')) ?? '';
      const hasHrMetrics = body.match(/сотрудник|employee|штат|staff|кадр|personnel|табел|timesheet/i);

      if (hasHrMetrics && body.length > 200) {
        dashboardFound = true;
        console.log(`✅ HR-related dashboard found at ${url}`);

        // Check for key HR KPIs
        const hasEmployeeCount = body.match(/количеств.*сотрудник|employee.*count|всего.*чел|total.*staff/i);
        const hasExpiredCerts = body.match(/просроченн|expired|истекш/i);
        const hasPlannedLeave = body.match(/отпуск|leave|планируем/i);
        const hasUnfilledTimesheets = body.match(/не.*заполнен|unfilled|missing.*timesheet/i);

        if (!hasEmployeeCount) recordIssue('UX', 'G3', 'Dashboard missing total employee count');
        if (!hasExpiredCerts) recordIssue('UX', 'G3', 'Dashboard missing expired certificates alert');
        if (!hasPlannedLeave) recordIssue('UX', 'G3', 'Dashboard missing planned leaves overview');
        if (!hasUnfilledTimesheets) recordIssue('UX', 'G3', 'Dashboard missing unfilled timesheets alert — who forgot to log hours?');

        break;
      }
    }

    if (!dashboardFound) {
      recordIssue('MISSING', 'G3', 'No HR-specific dashboard found (/hr/dashboard) — HR manager needs single screen with: headcount, expired certs, pending leave, missing timesheets');
    }

    await page.screenshot({ path: `${SS}/hr-dashboard.png`, fullPage: true }).catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP + SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  test.afterAll(async () => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('   WF: HR LIFECYCLE — CLEANUP & SUMMARY');
    console.log('═══════════════════════════════════════════════════\n');

    // Cleanup: delete all E2E-* entities (reverse dependency order)
    // 1. Timesheets
    if (timesheetId) {
      try { await deleteEntity('/api/timesheets', timesheetId); } catch { /* ignore */ }
    }

    // 2. Work orders
    if (workOrderId) {
      try { await deleteEntity('/api/hr/work-orders', workOrderId); } catch { /* ignore */ }
    }

    // 3. Crew assignments
    if (employeeId) {
      try { await authenticatedRequest('admin', 'DELETE', `/api/crew/employee/${employeeId}/project/${projectId}`); } catch { /* ignore */ }
    }

    // 4. Employee
    if (employeeId) {
      try { await deleteEntity('/api/employees', employeeId); } catch { /* ignore */ }
    }

    // 5. Project
    if (projectId) {
      try { await deleteEntity('/api/projects', projectId); } catch { /* ignore */ }
    }

    // --- Issue Summary ---
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const majorCount = issues.filter(i => i.severity === 'MAJOR').length;
    const minorCount = issues.filter(i => i.severity === 'MINOR').length;
    const uxCount = issues.filter(i => i.severity === 'UX').length;
    const missingCount = issues.filter(i => i.severity === 'MISSING').length;

    console.log(`\n📊 Issue Summary:`);
    console.log(`   🔴 CRITICAL: ${criticalCount}`);
    console.log(`   🟠 MAJOR:    ${majorCount}`);
    console.log(`   🟡 MINOR:    ${minorCount}`);
    console.log(`   🟣 UX:       ${uxCount}`);
    console.log(`   ⚪ MISSING:  ${missingCount}`);
    console.log(`   ─────────────────`);
    console.log(`   Total:       ${issues.length}`);

    console.log(`\n📄 Pages visited: ${totalPages}`);
    console.log(`\n⏱ Timings:`);
    for (const [op, ms] of Object.entries(timings)) {
      console.log(`   ${op}: ${(ms / 1000).toFixed(1)}s`);
    }

    if (issues.length > 0) {
      console.log('\n📋 All Issues:');
      for (const issue of issues) {
        const prefix = { CRITICAL: '🔴', MAJOR: '🟠', MINOR: '🟡', UX: '🟣', MISSING: '⚪' }[issue.severity];
        console.log(`   ${prefix} [${issue.severity}] ${issue.step}: ${issue.description}`);
        if (issue.actual) {
          console.log(`      actual: ${issue.actual}, expected: ${issue.expected}`);
        }
      }
    }
  });
});
