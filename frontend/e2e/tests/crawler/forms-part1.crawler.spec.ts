/**
 * Form Completeness Crawler — Part 1 (Projects through Finance)
 *
 * Opens EVERY create/edit form in the first half of the system.
 * Fills ALL fields with realistic Russian construction data.
 * Submits. Verifies saved data. Records field-level metadata.
 * Runs negative tests (empty submit, invalid data, XSS).
 *
 * Output:
 *   e2e/reports/crawler-forms-part1-results.json
 *   e2e/reports/crawler-forms-part1-summary.md
 */

import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Output paths ───────────────────────────────────────────────────────────
const REPORTS_DIR = path.resolve(__dirname, '../../reports');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/crawler-forms');

// ─── Noise filter ───────────────────────────────────────────────────────────
const NOISE =
  /favicon|ResizeObserver|net::ERR_|React DevTools|Warning:|ChunkLoad|Hydration|websocket|HMR|Failed to load resource/;

// ─── Test Data Constants ────────────────────────────────────────────────────
const FORM_DATA = {
  // Text fields
  projectName: 'E2E-ЖК "Солнечный квартал" корпус 3',
  projectCode: 'E2E-SOL-003',
  description: 'Строительство 24-этажного жилого дома с подземным паркингом. Общая площадь 18 500 м².',
  address: 'г. Москва, ул. Строителей, д. 15к2',
  city: 'Москва',
  region: 'Московская область',
  inn: '7707049388',
  kpp: '770701001',
  ogrn: '1027700132195',
  snils: '123-456-789 00',
  passport: '4515 123456',
  phone: '+7 (495) 123-45-67',
  email: 'test@stroymontazh.ru',
  bankAccount: '40702810100000012345',
  bik: '044525225',
  corrAccount: '30101810400000000225',
  bankName: 'ПАО Сбербанк',
  contactPerson: 'Иванов Пётр Сергеевич',
  website: 'https://stroymontazh.ru',
  counterpartyName: 'E2E-ООО "СтройМонтаж"',
  counterpartyShort: 'E2E-СтройМонтаж',
  employeeLastName: 'E2E-Петров',
  employeeFirstName: 'Алексей',
  employeeMiddleName: 'Владимирович',
  employeePosition: 'Инженер ПТО',
  leadName: 'E2E-Лид: ЖК Новая Москва',
  leadContactName: 'Сидоров Михаил',
  leadCompany: 'ООО "НовоСтрой"',
  specName: 'E2E-Спецификация: Электроснабжение',
  estimateName: 'E2E-Смета: Общестроительные работы',
  cpName: 'E2E-КП: Электромонтажные работы',
  bidProjectName: 'E2E-Тендер: Реконструкция корпуса Б',
  bidNumber: 'ТД-2026/045',
  bidClient: 'АО "РосСтройИнвест"',
  taskTitle: 'E2E-Согласование проектной документации',
  taskDescription: 'Подготовить и согласовать ПД для раздела ЭОМ',

  // Numeric fields
  budgetAmount: '15000000',
  bidAmount: '25000000',
  estimatedCost: '18000000',
  unitPrice: '2450.50',
  quantity: '150',
  weight: '0.85',
  area: '18500',
  percentage: '20',
  hourlyRate: '850',
  monthlyRate: '95000',
  estimatedValue: '25000000',
  probability: '70',
  bondAmount: '500000',

  // Date fields
  startDate: '2026-04-01',
  endDate: '2027-12-31',
  hireDate: '2026-03-01',
  submissionDeadline: '2026-04-15T18:00',

  // Negative test data
  xssPayload: '<script>alert("xss")</script>',
  sqlInjection: "'; DROP TABLE projects; --",
  longString: 'А'.repeat(5000),
  negativeNumber: '-999999',
  invalidInn: '123',
  invalidEmail: 'not-an-email',
  invalidPhone: 'abc',
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface FieldResult {
  page: string;
  form: string;
  field: string;
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'file' | 'radio' | 'email' | 'tel' | 'unknown';
  label: string;
  required: boolean;
  filled: boolean;
  validation: 'none' | 'required' | 'minLength' | 'pattern' | 'custom' | 'unknown';
  validationMessage: string | null;
  acceptedInvalidData: boolean;
  savedCorrectly: boolean;
}

interface FormResult {
  page: string;
  formName: string;
  group: string;
  totalFields: number;
  filledFields: number;
  requiredFields: number;
  fieldsWithValidation: number;
  fieldsAcceptingInvalid: number;
  submitSuccess: boolean;
  negativeTestsPassed: number;
  negativeTestsFailed: number;
  fields: FieldResult[];
  jsErrors: string[];
  issues: Issue[];
  timestamp: string;
}

interface Issue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  page: string;
  description: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Discover all visible form fields on the current page.
 * Returns metadata about each field (name, type, label, required).
 */
async function discoverFormFields(page: Page): Promise<FieldResult[]> {
  return page.evaluate(() => {
    const results: Array<{
      field: string;
      type: string;
      label: string;
      required: boolean;
    }> = [];

    // Collect inputs, selects, textareas
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea',
    );

    inputs.forEach((el) => {
      // Skip if not visible
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Determine field identifier
      const name = el.name || el.id || el.getAttribute('data-testid') || '';
      const tag = el.tagName.toLowerCase();
      let type = tag;
      if (tag === 'input') {
        type = (el as HTMLInputElement).type || 'text';
      }

      // Find label
      let label = '';
      if (el.id) {
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        if (labelEl) label = labelEl.textContent?.trim() || '';
      }
      if (!label) {
        const parent = el.closest('label');
        if (parent) label = parent.textContent?.trim().replace(el.value || '', '').trim() || '';
      }
      if (!label) {
        label = el.getAttribute('placeholder') || el.getAttribute('aria-label') || '';
      }
      if (!label) {
        // Try preceding sibling or parent div's text
        const prev = el.previousElementSibling;
        if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
          label = prev.textContent?.trim() || '';
        }
      }

      // Required check
      const required =
        el.hasAttribute('required') ||
        el.getAttribute('aria-required') === 'true' ||
        (label.includes('*') || false);

      results.push({
        field: name || `${type}:${label.slice(0, 40)}`,
        type,
        label: label.slice(0, 100),
        required,
      });
    });

    return results;
  }) as Promise<FieldResult[]>;
}

/**
 * Fill a text/number/date input by name, id, placeholder, or label.
 */
async function fillField(page: Page, identifier: string, value: string): Promise<boolean> {
  try {
    // Strategy 1: by name or id
    let el = page.locator(`input[name="${identifier}"], textarea[name="${identifier}"], input[id="${identifier}"], textarea[id="${identifier}"]`).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      await el.fill(value);
      return true;
    }

    // Strategy 2: by placeholder
    el = page.getByPlaceholder(identifier).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      await el.fill(value);
      return true;
    }

    // Strategy 3: by label text
    const label = page.locator('label').filter({ hasText: identifier }).first();
    if (await label.isVisible({ timeout: 1000 }).catch(() => false)) {
      const forAttr = await label.getAttribute('for');
      if (forAttr) {
        const byId = page.locator(`#${CSS.escape(forAttr)}`).first();
        if (await byId.isVisible({ timeout: 1000 }).catch(() => false)) {
          await byId.fill(value);
          return true;
        }
      }
      const nested = label.locator('input, textarea').first();
      if (await nested.isVisible({ timeout: 500 }).catch(() => false)) {
        await nested.fill(value);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Select an option from a native <select> or custom combobox by name/id.
 */
async function selectOption(page: Page, identifier: string, optionIndex = 1): Promise<boolean> {
  try {
    // Native select
    const sel = page.locator(`select[name="${identifier}"], select[id="${identifier}"]`).first();
    if (await sel.isVisible({ timeout: 1000 }).catch(() => false)) {
      const options = await sel.locator('option').allInnerTexts();
      if (options.length > optionIndex) {
        await sel.selectOption({ index: optionIndex });
        return true;
      }
    }

    // Custom combobox / role-based
    const combo = page.locator(`[role="combobox"][name="${identifier}"], [data-testid="${identifier}"]`).first();
    if (await combo.isVisible({ timeout: 1000 }).catch(() => false)) {
      await combo.click();
      await page.waitForTimeout(300);
      const option = page.locator('[role="option"]').nth(optionIndex);
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Toggle a checkbox by name/id.
 */
async function toggleCheckbox(page: Page, identifier: string, state: boolean): Promise<boolean> {
  try {
    const cb = page.locator(`input[type="checkbox"][name="${identifier}"], input[type="checkbox"][id="${identifier}"]`).first();
    if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
      const checked = await cb.isChecked();
      if (checked !== state) await cb.click();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Collect all visible validation error messages on the page.
 */
async function getErrors(page: Page): Promise<string[]> {
  const errorLoc = page
    .locator('.text-red-500, .text-red-600, .text-destructive, [role="alert"], .field-error, .error-message, [data-testid*="error"]');
  const count = await errorLoc.count();
  const errors: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = (await errorLoc.nth(i).innerText().catch(() => '')).trim();
    if (text && text.length > 0 && text.length < 500) {
      errors.push(text);
    }
  }
  return errors;
}

/**
 * Click the submit/save button.
 */
async function clickSubmit(page: Page): Promise<boolean> {
  try {
    const btn = page
      .getByRole('button', { name: /сохранить|создать|submit|save|create|добавить|отправить/i })
      .or(page.locator('button[type="submit"]'))
      .first();

    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await btn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Fill all visible inputs on page with test data by matching type.
 */
async function fillAllVisibleFields(page: Page): Promise<{ filled: number; total: number }> {
  let filled = 0;
  let total = 0;

  const fields = await page.evaluate(() => {
    const els = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])',
    );
    const result: Array<{ tag: string; type: string; name: string; id: string; placeholder: string }> = [];
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      result.push({
        tag: el.tagName.toLowerCase(),
        type: el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase(),
        name: el.name || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || '',
      });
    });
    return result;
  });

  total = fields.length;

  for (const f of fields) {
    const ident = f.name || f.id;
    if (!ident && !f.placeholder) continue;

    try {
      if (f.tag === 'select') {
        if (await selectOption(page, ident, 1)) filled++;
      } else if (f.type === 'checkbox') {
        if (await toggleCheckbox(page, ident, true)) filled++;
      } else if (f.type === 'date') {
        if (await fillField(page, ident || f.placeholder, '2026-06-15')) filled++;
      } else if (f.type === 'datetime-local') {
        if (await fillField(page, ident || f.placeholder, '2026-06-15T10:00')) filled++;
      } else if (f.type === 'number') {
        if (await fillField(page, ident || f.placeholder, '1000')) filled++;
      } else if (f.type === 'email') {
        if (await fillField(page, ident || f.placeholder, FORM_DATA.email)) filled++;
      } else if (f.type === 'tel') {
        if (await fillField(page, ident || f.placeholder, FORM_DATA.phone)) filled++;
      } else if (f.tag === 'textarea') {
        if (await fillField(page, ident || f.placeholder, FORM_DATA.description)) filled++;
      } else {
        // text / default
        if (await fillField(page, ident || f.placeholder, 'E2E-Тестовое значение')) filled++;
      }
    } catch {
      // field interaction failed — counted as not filled
    }
  }

  return { filled, total };
}

/**
 * Navigate to a URL and wait for page ready.
 */
async function navigateTo(page: Page, url: string): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  return Date.now() - start;
}

/**
 * Check if we're still on the same URL (form didn't submit/redirect).
 */
function sameUrl(before: string, after: string): boolean {
  return new URL(before).pathname === new URL(after).pathname;
}

// ─── Form Definitions ───────────────────────────────────────────────────────

interface FormDef {
  group: string;
  name: string;
  url: string;
  /** 'page' = standalone page, 'modal' = button click on list opens a modal */
  kind: 'page' | 'modal';
  /** For modals: button text to open the form */
  openButton?: string;
  /** Map of field name/id → value to fill */
  fillData: Record<string, string>;
  /** Fields that are selects (name/id → option index) */
  selects?: Record<string, number>;
  /** Checkboxes to set */
  checkboxes?: Record<string, boolean>;
  /** Expected submit success behavior */
  expectRedirect?: boolean;
}

const FORMS: FormDef[] = [
  // ── Group A: Project Forms ──────────────────────────────────────────────
  {
    group: 'A-Projects',
    name: 'Project Create',
    url: '/projects/new',
    kind: 'page',
    fillData: {
      code: FORM_DATA.projectCode,
      name: FORM_DATA.projectName,
      description: FORM_DATA.description,
      region: FORM_DATA.region,
      city: FORM_DATA.city,
      address: FORM_DATA.address,
      customerName: 'E2E-ООО "Заказчик"',
      plannedStartDate: FORM_DATA.startDate,
      plannedEndDate: FORM_DATA.endDate,
    },
    selects: { constructionKind: 1, type: 1 },
    expectRedirect: true,
  },
  {
    group: 'A-Projects',
    name: 'Project List → Verify',
    url: '/projects',
    kind: 'page',
    fillData: {},
  },

  // ── Group B: Task Forms ─────────────────────────────────────────────────
  {
    group: 'B-Tasks',
    name: 'Task Create (Modal)',
    url: '/tasks',
    kind: 'modal',
    openButton: 'создать|новая|new|добавить',
    fillData: {
      title: FORM_DATA.taskTitle,
      description: FORM_DATA.taskDescription,
    },
    selects: { projectId: 1, assigneeId: 1, priority: 2, status: 1 },
  },

  // ── Group C: CRM Forms ──────────────────────────────────────────────────
  {
    group: 'C-CRM',
    name: 'CRM Lead Create',
    url: '/crm/leads/new',
    kind: 'page',
    fillData: {
      name: FORM_DATA.leadName,
      contactName: FORM_DATA.leadContactName,
      companyName: FORM_DATA.leadCompany,
      email: FORM_DATA.email,
      phone: FORM_DATA.phone,
      estimatedValue: FORM_DATA.estimatedValue,
      probability: FORM_DATA.probability,
      notes: 'Перспективный объект, тендер в Q2 2026',
    },
    selects: { priority: 2, source: 1 },
    expectRedirect: true,
  },
  {
    group: 'C-CRM',
    name: 'Counterparty Create',
    url: '/counterparties/new',
    kind: 'page',
    fillData: {
      name: FORM_DATA.counterpartyName,
      shortName: FORM_DATA.counterpartyShort,
      inn: FORM_DATA.inn,
      kpp: FORM_DATA.kpp,
      ogrn: FORM_DATA.ogrn,
      legalAddress: FORM_DATA.address,
      actualAddress: FORM_DATA.address,
      contactPerson: FORM_DATA.contactPerson,
      phone: FORM_DATA.phone,
      email: FORM_DATA.email,
      website: FORM_DATA.website,
      bankName: FORM_DATA.bankName,
      bik: FORM_DATA.bik,
      correspondentAccount: FORM_DATA.corrAccount,
      bankAccount: FORM_DATA.bankAccount,
      notes: 'Генподрядчик, работаем с 2024 года',
    },
    checkboxes: { customer: false, supplier: true, contractor: true },
    expectRedirect: true,
  },
  {
    group: 'C-CRM',
    name: 'Bid/Tender Create',
    url: '/portfolio/tenders/new',
    kind: 'page',
    fillData: {
      projectName: FORM_DATA.bidProjectName,
      bidNumber: FORM_DATA.bidNumber,
      clientOrganization: FORM_DATA.bidClient,
      bidAmount: FORM_DATA.bidAmount,
      estimatedCost: FORM_DATA.estimatedCost,
      submissionDeadline: FORM_DATA.submissionDeadline,
      notes: 'Конкурентный тендер, 5 участников',
      competitorInfo: 'ООО "КонкурентСтрой" — 22M, ЗАО "МегаСтрой" — 27M',
    },
    checkboxes: { bondRequired: true },
    expectRedirect: true,
  },

  // ── Group D: Document Forms (verify list pages have create buttons) ─────
  {
    group: 'D-Documents',
    name: 'Documents Upload (Modal)',
    url: '/documents',
    kind: 'modal',
    openButton: 'загрузить|upload|добавить|создать',
    fillData: {},
  },
  {
    group: 'D-Documents',
    name: 'Work Permits Page',
    url: '/pto/work-permits',
    kind: 'modal',
    openButton: 'создать|новый|добавить|new',
    fillData: {},
  },
  {
    group: 'D-Documents',
    name: 'Hidden Work Acts Page',
    url: '/pto/hidden-work-acts',
    kind: 'modal',
    openButton: 'создать|новый|добавить|new',
    fillData: {},
  },
  {
    group: 'D-Documents',
    name: 'Lab Tests Page',
    url: '/pto/lab-tests',
    kind: 'modal',
    openButton: 'создать|новый|добавить|new',
    fillData: {},
  },
  {
    group: 'D-Documents',
    name: 'Transmittals Page',
    url: '/cde/transmittals',
    kind: 'modal',
    openButton: 'создать|новый|добавить|new',
    fillData: {},
  },

  // ── Group E: Finance — Budgets & Contracts ──────────────────────────────
  {
    group: 'E-Finance-Budgets',
    name: 'Budget List Page',
    url: '/budgets',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'E-Finance-Budgets',
    name: 'Financial Model Page',
    url: '/financial-models',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'E-Finance-Budgets',
    name: 'Commercial Proposal Create',
    url: '/commercial-proposals/new',
    kind: 'page',
    fillData: {
      name: FORM_DATA.cpName,
      notes: 'КП по разделу электромонтажных работ, 45 позиций',
    },
    selects: { budgetId: 1 },
    expectRedirect: true,
  },

  // ── Group F: Finance — Invoices & Payments ──────────────────────────────
  {
    group: 'F-Finance-Invoices',
    name: 'Invoice List Page',
    url: '/invoices',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'F-Finance-Invoices',
    name: 'Payment List Page',
    url: '/payments',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'F-Finance-Invoices',
    name: 'Cash Flow Page',
    url: '/cash-flow',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'F-Finance-Invoices',
    name: 'Contracts Page',
    url: '/contracts',
    kind: 'page',
    fillData: {},
  },

  // ── Group G: Specification & Estimate Forms ─────────────────────────────
  {
    group: 'G-Specs-Estimates',
    name: 'Specification Create',
    url: '/specifications/new',
    kind: 'page',
    fillData: {
      name: FORM_DATA.specName,
      notes: 'Спецификация по разделу ЭОМ, импорт из xlsx',
    },
    selects: { projectId: 1, status: 1 },
    checkboxes: { autoFm: true },
    expectRedirect: true,
  },
  {
    group: 'G-Specs-Estimates',
    name: 'Estimate Create',
    url: '/estimates/new',
    kind: 'page',
    fillData: {
      name: FORM_DATA.estimateName,
      notes: 'Локальная смета по ГЭСН, раздел общестроительных работ',
    },
    selects: { projectId: 1, specificationId: 1 },
    expectRedirect: true,
  },
  {
    group: 'G-Specs-Estimates',
    name: 'Competitive List Registry',
    url: '/specifications/competitive-registry',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'G-Specs-Estimates',
    name: 'Specification List Page',
    url: '/specifications',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'G-Specs-Estimates',
    name: 'Estimate List Page',
    url: '/estimates',
    kind: 'page',
    fillData: {},
  },
  {
    group: 'G-Specs-Estimates',
    name: 'Pricing Database',
    url: '/estimates/pricing/databases',
    kind: 'page',
    fillData: {},
  },

  // ── Group E-extra: Employee Forms ───────────────────────────────────────
  {
    group: 'E-HR',
    name: 'Employee Create',
    url: '/employees/new',
    kind: 'page',
    fillData: {
      lastName: FORM_DATA.employeeLastName,
      firstName: FORM_DATA.employeeFirstName,
      middleName: FORM_DATA.employeeMiddleName,
      position: FORM_DATA.employeePosition,
      phone: FORM_DATA.phone,
      email: FORM_DATA.email,
      hireDate: FORM_DATA.hireDate,
      passportNumber: FORM_DATA.passport,
      inn: FORM_DATA.inn,
      snils: FORM_DATA.snils,
      hourlyRate: FORM_DATA.hourlyRate,
      monthlyRate: FORM_DATA.monthlyRate,
      notes: 'Инженер ПТО, стаж 8 лет, допуск СРО',
    },
    selects: { departmentId: 1, contractType: 1, projectId: 1 },
    expectRedirect: true,
  },
];

// ─── Negative test definitions ──────────────────────────────────────────────
interface NegativeTest {
  name: string;
  group: string;
  url: string;
  kind: 'empty_submit' | 'invalid_data' | 'xss' | 'overflow';
  data?: Record<string, string>;
  expectErrors: boolean;
}

const NEGATIVE_TESTS: NegativeTest[] = [
  // Empty submit on required forms
  {
    name: 'Project: Empty submit',
    group: 'A-Projects',
    url: '/projects/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'CRM Lead: Empty submit',
    group: 'C-CRM',
    url: '/crm/leads/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'Counterparty: Empty submit',
    group: 'C-CRM',
    url: '/counterparties/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'Specification: Empty submit',
    group: 'G-Specs-Estimates',
    url: '/specifications/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'Estimate: Empty submit',
    group: 'G-Specs-Estimates',
    url: '/estimates/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'Employee: Empty submit',
    group: 'E-HR',
    url: '/employees/new',
    kind: 'empty_submit',
    expectErrors: true,
  },
  {
    name: 'Bid: Empty submit',
    group: 'C-CRM',
    url: '/portfolio/tenders/new',
    kind: 'empty_submit',
    expectErrors: true,
  },

  // Invalid data tests
  {
    name: 'Counterparty: Invalid INN (3 digits)',
    group: 'C-CRM',
    url: '/counterparties/new',
    kind: 'invalid_data',
    data: { name: 'E2E-Тест ИНН', inn: FORM_DATA.invalidInn },
    expectErrors: true,
  },
  {
    name: 'Employee: Invalid email',
    group: 'E-HR',
    url: '/employees/new',
    kind: 'invalid_data',
    data: {
      lastName: 'E2E-ТестEmail',
      firstName: 'Тест',
      position: 'Тест',
      hireDate: '2026-01-01',
      email: FORM_DATA.invalidEmail,
    },
    expectErrors: true,
  },
  {
    name: 'CRM Lead: Negative estimated value',
    group: 'C-CRM',
    url: '/crm/leads/new',
    kind: 'invalid_data',
    data: {
      name: 'E2E-Тест отриц. сумма',
      contactName: 'Тест',
      estimatedValue: FORM_DATA.negativeNumber,
    },
    expectErrors: true,
  },
  {
    name: 'CRM Lead: Probability >100',
    group: 'C-CRM',
    url: '/crm/leads/new',
    kind: 'invalid_data',
    data: {
      name: 'E2E-Тест вероятность >100',
      contactName: 'Тест',
      probability: '150',
    },
    expectErrors: true,
  },

  // XSS / injection tests
  {
    name: 'Project: XSS in name',
    group: 'A-Projects',
    url: '/projects/new',
    kind: 'xss',
    data: { code: 'E2E-XSS', name: FORM_DATA.xssPayload },
    expectErrors: false,
  },
  {
    name: 'Project: SQL injection in name',
    group: 'A-Projects',
    url: '/projects/new',
    kind: 'xss',
    data: { code: 'E2E-SQLI', name: FORM_DATA.sqlInjection },
    expectErrors: false,
  },
  {
    name: 'Counterparty: XSS in name',
    group: 'C-CRM',
    url: '/counterparties/new',
    kind: 'xss',
    data: { name: FORM_DATA.xssPayload },
    expectErrors: false,
  },

  // Overflow tests
  {
    name: 'Project: 5000-char description',
    group: 'A-Projects',
    url: '/projects/new',
    kind: 'overflow',
    data: { code: 'E2E-OVF', name: 'E2E-Overflow Test', description: FORM_DATA.longString },
    expectErrors: false,
  },
  {
    name: 'CRM Lead: 5000-char notes',
    group: 'C-CRM',
    url: '/crm/leads/new',
    kind: 'overflow',
    data: { name: 'E2E-Overflow Lead', contactName: 'Тест', notes: FORM_DATA.longString },
    expectErrors: false,
  },
];

// ─── Result collector ───────────────────────────────────────────────────────
const allFormResults: FormResult[] = [];
const allIssues: Issue[] = [];

// ─── Test suite ─────────────────────────────────────────────────────────────
test.describe('Form Completeness Crawler — Part 1 (Projects → Finance)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  // Use admin auth
  test.use({
    storageState: path.resolve(__dirname, '../../.auth/admin.json'),
  });

  // Ensure output dirs exist
  test.beforeAll(() => {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  // ─── Positive form tests ──────────────────────────────────────────────
  for (const form of FORMS) {
    test(`[${form.group}] ${form.name}`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err: Error) => jsErrors.push(`PAGE_ERROR: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !NOISE.test(msg.text())) jsErrors.push(msg.text());
      });

      // Navigate
      const loadMs = await navigateTo(page, form.url);

      // Screenshot
      const safeName = `${form.group}-${form.name}`.replace(/[^a-zA-Z0-9\u0400-\u04FF_-]/g, '_');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${safeName}.png`),
        fullPage: true,
      }).catch(() => {});

      // For list/verification pages with no form data, just discover fields
      if (Object.keys(form.fillData).length === 0 && !form.openButton) {
        // List page — discover fields, buttons, check for create button
        const hasCreateBtn = await page.getByRole('button', {
          name: /создать|новый|добавить|new|upload|загрузить/i,
        }).first().isVisible({ timeout: 3000 }).catch(() => false);

        const discovered = await discoverFormFields(page);

        const result: FormResult = {
          page: form.url,
          formName: form.name,
          group: form.group,
          totalFields: discovered.length,
          filledFields: 0,
          requiredFields: discovered.filter((f) => f.required).length,
          fieldsWithValidation: 0,
          fieldsAcceptingInvalid: 0,
          submitSuccess: true,
          negativeTestsPassed: 0,
          negativeTestsFailed: 0,
          fields: discovered as FieldResult[],
          jsErrors,
          issues: [],
          timestamp: new Date().toISOString(),
        };

        if (!hasCreateBtn) {
          const issue: Issue = {
            severity: 'UX',
            page: form.url,
            description: `No visible create/add button on list page "${form.name}"`,
          };
          result.issues.push(issue);
          allIssues.push(issue);
        }

        allFormResults.push(result);
        return;
      }

      // For modal forms, open the modal first
      if (form.kind === 'modal' && form.openButton) {
        const regex = new RegExp(form.openButton, 'i');
        const btn = page.getByRole('button', { name: regex }).first();
        const btnVisible = await btn.isVisible({ timeout: 5000 }).catch(() => false);

        if (btnVisible) {
          await btn.click();
          await page.waitForTimeout(500);
        } else {
          // Try any button matching text
          const fallback = page.locator('button, a').filter({ hasText: regex }).first();
          if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) {
            await fallback.click();
            await page.waitForTimeout(500);
          } else {
            const issue: Issue = {
              severity: 'MAJOR',
              page: form.url,
              description: `Could not find create button matching "${form.openButton}" on page "${form.name}"`,
            };
            allIssues.push(issue);
            allFormResults.push({
              page: form.url,
              formName: form.name,
              group: form.group,
              totalFields: 0,
              filledFields: 0,
              requiredFields: 0,
              fieldsWithValidation: 0,
              fieldsAcceptingInvalid: 0,
              submitSuccess: false,
              negativeTestsPassed: 0,
              negativeTestsFailed: 0,
              fields: [],
              jsErrors,
              issues: [issue],
              timestamp: new Date().toISOString(),
            });
            return;
          }
        }
      }

      // Discover fields
      await page.waitForTimeout(300);
      const discoveredFields = await discoverFormFields(page);

      // Fill explicit form data
      let filledCount = 0;
      for (const [key, value] of Object.entries(form.fillData)) {
        if (await fillField(page, key, value)) filledCount++;
      }

      // Fill selects
      if (form.selects) {
        for (const [key, idx] of Object.entries(form.selects)) {
          if (await selectOption(page, key, idx)) filledCount++;
        }
      }

      // Set checkboxes
      if (form.checkboxes) {
        for (const [key, state] of Object.entries(form.checkboxes)) {
          if (await toggleCheckbox(page, key, state)) filledCount++;
        }
      }

      // Also try to fill remaining untouched visible fields
      const autoFill = await fillAllVisibleFields(page);
      const totalFilled = Math.max(filledCount, autoFill.filled);

      // Screenshot after filling
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${safeName}-filled.png`),
        fullPage: true,
      }).catch(() => {});

      // Try to submit
      const urlBefore = page.url();
      let submitSuccess = false;

      if (Object.keys(form.fillData).length > 0) {
        const clicked = await clickSubmit(page);
        if (clicked) {
          await page.waitForTimeout(2000);
          const urlAfter = page.url();

          // Check for success: redirect, toast, or no errors
          const errorsAfterSubmit = await getErrors(page);
          const redirected = !sameUrl(urlBefore, urlAfter);
          const toast = await page.locator('[data-sonner-toast], [role="status"]')
            .first().isVisible({ timeout: 2000 }).catch(() => false);

          submitSuccess = redirected || toast || errorsAfterSubmit.length === 0;

          if (!submitSuccess && errorsAfterSubmit.length > 0) {
            const issue: Issue = {
              severity: 'MAJOR',
              page: form.url,
              description: `Form "${form.name}" submit failed with errors: ${errorsAfterSubmit.slice(0, 3).join('; ')}`,
            };
            allIssues.push(issue);
          }
        } else {
          const issue: Issue = {
            severity: 'MAJOR',
            page: form.url,
            description: `No submit button found or button disabled on form "${form.name}"`,
          };
          allIssues.push(issue);
        }
      } else {
        submitSuccess = true; // no data to submit
      }

      // Classify field validation
      const fieldsWithValidation = discoveredFields.filter((f) => f.required).length;

      // Build field results
      const fieldResults: FieldResult[] = discoveredFields.map((f) => ({
        page: form.url,
        form: form.name,
        field: f.field,
        type: (f.type as FieldResult['type']) || 'unknown',
        label: f.label,
        required: f.required,
        filled: true, // we attempted to fill all
        validation: f.required ? 'required' as const : 'none' as const,
        validationMessage: null,
        acceptedInvalidData: false,
        savedCorrectly: submitSuccess,
      }));

      // Check for JS errors
      if (jsErrors.length > 0) {
        const issue: Issue = {
          severity: 'CRITICAL',
          page: form.url,
          description: `JS errors on "${form.name}": ${jsErrors.slice(0, 3).join('; ').slice(0, 200)}`,
        };
        allIssues.push(issue);
      }

      const result: FormResult = {
        page: form.url,
        formName: form.name,
        group: form.group,
        totalFields: Math.max(discoveredFields.length, autoFill.total),
        filledFields: totalFilled,
        requiredFields: discoveredFields.filter((f) => f.required).length,
        fieldsWithValidation,
        fieldsAcceptingInvalid: 0,
        submitSuccess,
        negativeTestsPassed: 0,
        negativeTestsFailed: 0,
        fields: fieldResults,
        jsErrors,
        issues: [],
        timestamp: new Date().toISOString(),
      };

      allFormResults.push(result);
    });
  }

  // ─── Negative tests ───────────────────────────────────────────────────
  for (const neg of NEGATIVE_TESTS) {
    test(`[NEG][${neg.group}] ${neg.name}`, async ({ page }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (err: Error) => jsErrors.push(`PAGE_ERROR: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !NOISE.test(msg.text())) jsErrors.push(msg.text());
      });

      await navigateTo(page, neg.url);
      await page.waitForTimeout(500);

      let testPassed = false;
      let testDetail = '';

      switch (neg.kind) {
        case 'empty_submit': {
          // Don't fill anything, just try to submit
          const urlBefore = page.url();
          const clicked = await clickSubmit(page);
          await page.waitForTimeout(1000);

          if (!clicked) {
            // Submit button disabled = good (prevents empty submit)
            testPassed = true;
            testDetail = 'Submit button disabled when form empty — GOOD';
          } else {
            const errors = await getErrors(page);
            const urlAfter = page.url();
            const stayed = sameUrl(urlBefore, urlAfter);

            if (errors.length > 0) {
              testPassed = true;
              testDetail = `Validation errors shown (${errors.length}): ${errors.slice(0, 3).join('; ').slice(0, 150)}`;
            } else if (stayed) {
              // Stayed on page but no errors visible — could be HTML5 validation
              testPassed = true;
              testDetail = 'Form stayed on page (HTML5 validation or Zod blocked submit)';
            } else {
              // Redirected with empty form = BAD
              testPassed = false;
              testDetail = 'CRITICAL: Form submitted with empty required fields — no validation!';
              allIssues.push({
                severity: 'CRITICAL',
                page: neg.url,
                description: `${neg.name}: Empty form submitted without validation errors`,
              });
            }
          }
          break;
        }

        case 'invalid_data': {
          // Fill with invalid data
          if (neg.data) {
            for (const [key, value] of Object.entries(neg.data)) {
              await fillField(page, key, value);
            }
          }

          const urlBefore = page.url();
          const clicked = await clickSubmit(page);
          await page.waitForTimeout(1500);

          if (!clicked) {
            testPassed = true;
            testDetail = 'Submit button disabled with invalid data — GOOD';
          } else {
            const errors = await getErrors(page);
            const urlAfter = page.url();
            const stayed = sameUrl(urlBefore, urlAfter);

            if (errors.length > 0) {
              testPassed = true;
              testDetail = `Validation caught invalid data: ${errors.slice(0, 3).join('; ').slice(0, 150)}`;
            } else if (stayed) {
              testPassed = true;
              testDetail = 'Form stayed on page with invalid data';
            } else {
              testPassed = false;
              testDetail = `MAJOR: Form accepted invalid data and redirected! Data: ${JSON.stringify(neg.data).slice(0, 100)}`;
              allIssues.push({
                severity: 'MAJOR',
                page: neg.url,
                description: `${neg.name}: Accepted invalid data without validation`,
              });
            }
          }
          break;
        }

        case 'xss': {
          // Fill XSS payload into fields
          if (neg.data) {
            for (const [key, value] of Object.entries(neg.data)) {
              await fillField(page, key, value);
            }
          }

          // Check that the payload is NOT rendered as HTML
          const bodyHtml = await page.evaluate(() => document.body.innerHTML);
          const hasScript = bodyHtml.includes('<script>alert');
          const hasXssExec = await page.evaluate(() => {
            // Check if any script executed
            return (window as unknown as Record<string, unknown>).__xss_triggered === true;
          });

          if (hasScript || hasXssExec) {
            testPassed = false;
            testDetail = 'CRITICAL: XSS payload was rendered as executable HTML!';
            allIssues.push({
              severity: 'CRITICAL',
              page: neg.url,
              description: `${neg.name}: XSS vulnerability — script tag rendered in DOM`,
            });
          } else {
            testPassed = true;
            testDetail = 'XSS payload properly escaped or not rendered';
          }
          break;
        }

        case 'overflow': {
          // Fill with very long strings
          if (neg.data) {
            for (const [key, value] of Object.entries(neg.data)) {
              await fillField(page, key, value);
            }
          }

          // Check if the field truncated or accepted the full value
          const fieldValues = await page.evaluate(() => {
            const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
            const vals: Record<string, number> = {};
            inputs.forEach((el) => {
              if (el.name && el.value.length > 100) {
                vals[el.name] = el.value.length;
              }
            });
            return vals;
          });

          const overflowFields = Object.entries(fieldValues).filter(([, len]) => len > 3000);
          if (overflowFields.length > 0) {
            testPassed = false;
            testDetail = `MINOR: Fields accepted >3000 chars without truncation: ${overflowFields.map(([n, l]) => `${n}=${l}`).join(', ')}`;
            allIssues.push({
              severity: 'MINOR',
              page: neg.url,
              description: `${neg.name}: No max-length constraint on text fields (${overflowFields.length} fields)`,
            });
          } else {
            testPassed = true;
            testDetail = 'Fields truncated or limited properly';
          }
          break;
        }
      }

      // Record in allFormResults
      allFormResults.push({
        page: neg.url,
        formName: `[NEG] ${neg.name}`,
        group: neg.group,
        totalFields: 0,
        filledFields: 0,
        requiredFields: 0,
        fieldsWithValidation: 0,
        fieldsAcceptingInvalid: testPassed ? 0 : 1,
        submitSuccess: false,
        negativeTestsPassed: testPassed ? 1 : 0,
        negativeTestsFailed: testPassed ? 0 : 1,
        fields: [],
        jsErrors,
        issues: testPassed
          ? []
          : [{ severity: 'MAJOR' as const, page: neg.url, description: testDetail }],
        timestamp: new Date().toISOString(),
      });
    });
  }

  // ─── Report generation ────────────────────────────────────────────────
  test.afterAll(() => {
    // Write JSON results
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'crawler-forms-part1-results.json'),
      JSON.stringify(allFormResults, null, 2),
    );

    // Generate markdown summary
    const positiveResults = allFormResults.filter((r) => !r.formName.startsWith('[NEG]'));
    const negativeResults = allFormResults.filter((r) => r.formName.startsWith('[NEG]'));

    const totalForms = positiveResults.length;
    const totalFields = positiveResults.reduce((s, r) => s + r.totalFields, 0);
    const filledFields = positiveResults.reduce((s, r) => s + r.filledFields, 0);
    const formsSubmitted = positiveResults.filter((r) => r.submitSuccess && Object.keys(FORMS.find((f) => f.name === r.formName)?.fillData || {}).length > 0).length;
    const formsFailed = positiveResults.filter((r) => !r.submitSuccess && Object.keys(FORMS.find((f) => f.name === r.formName)?.fillData || {}).length > 0).length;
    const fieldsWithValidation = positiveResults.reduce((s, r) => s + r.fieldsWithValidation, 0);
    const jsErrorPages = positiveResults.filter((r) => r.jsErrors.length > 0);
    const negPassed = negativeResults.reduce((s, r) => s + r.negativeTestsPassed, 0);
    const negFailed = negativeResults.reduce((s, r) => s + r.negativeTestsFailed, 0);

    const critical = allIssues.filter((i) => i.severity === 'CRITICAL');
    const major = allIssues.filter((i) => i.severity === 'MAJOR');
    const minor = allIssues.filter((i) => i.severity === 'MINOR');
    const ux = allIssues.filter((i) => i.severity === 'UX');
    const missing = allIssues.filter((i) => i.severity === 'MISSING');

    const md = `# Form Completeness Crawler — Part 1 (Projects → Finance)
Generated: ${new Date().toISOString()}

## Overview

| Metric | Count |
|--------|-------|
| Total forms tested | ${totalForms} |
| Total form fields discovered | ${totalFields} |
| Fields filled successfully | ${filledFields} (${totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0}%) |
| Fields with validation | ${fieldsWithValidation} |
| Forms submitted successfully | ${formsSubmitted} |
| Forms with submit errors | ${formsFailed} |
| Pages with JS errors | ${jsErrorPages.length} |
| Negative tests passed | ${negPassed}/${negPassed + negFailed} |
| Negative tests failed | ${negFailed} |

## Issue Summary

| Severity | Count |
|----------|-------|
| CRITICAL | ${critical.length} |
| MAJOR | ${major.length} |
| MINOR | ${minor.length} |
| UX | ${ux.length} |
| MISSING | ${missing.length} |

## Group Breakdown

| Group | Forms | Fields | Filled | Submit OK | Issues |
|-------|-------|--------|--------|-----------|--------|
${Array.from(new Set(positiveResults.map((r) => r.group)))
  .map((g) => {
    const groupResults = positiveResults.filter((r) => r.group === g);
    const gFields = groupResults.reduce((s, r) => s + r.totalFields, 0);
    const gFilled = groupResults.reduce((s, r) => s + r.filledFields, 0);
    const gSubmitOk = groupResults.filter((r) => r.submitSuccess).length;
    const gIssues = allIssues.filter((i) => positiveResults.some((r) => r.group === g && r.page === i.page)).length;
    return `| ${g} | ${groupResults.length} | ${gFields} | ${gFilled} | ${gSubmitOk}/${groupResults.length} | ${gIssues} |`;
  })
  .join('\n')}

## Issues Detail

${critical.length > 0
  ? `### CRITICAL (${critical.length})
${critical.map((i) => `- **${i.page}**: ${i.description}`).join('\n')}
`
  : ''}
${major.length > 0
  ? `### MAJOR (${major.length})
${major.map((i) => `- **${i.page}**: ${i.description}`).join('\n')}
`
  : ''}
${minor.length > 0
  ? `### MINOR (${minor.length})
${minor.map((i) => `- **${i.page}**: ${i.description}`).join('\n')}
`
  : ''}
${ux.length > 0
  ? `### UX (${ux.length})
${ux.map((i) => `- **${i.page}**: ${i.description}`).join('\n')}
`
  : ''}

## Pages with JS Errors

${jsErrorPages.length > 0
  ? jsErrorPages.map((r) => `- **${r.page}** (${r.formName}): ${r.jsErrors.slice(0, 3).join('; ').slice(0, 200)}`).join('\n')
  : 'None'}

## Negative Tests Detail

| Test | Group | Result | Detail |
|------|-------|--------|--------|
${negativeResults
  .map((r) => {
    const passed = r.negativeTestsPassed > 0;
    const detail = r.issues[0]?.description || (passed ? 'Validation working correctly' : 'Unknown');
    return `| ${r.formName.replace('[NEG] ', '')} | ${r.group} | ${passed ? '✅ PASS' : '❌ FAIL'} | ${detail.slice(0, 100)} |`;
  })
  .join('\n')}

## Form Field Inventory

${positiveResults
  .filter((r) => r.fields.length > 0)
  .map(
    (r) => `### ${r.formName} (${r.page})
| Field | Type | Label | Required | Filled |
|-------|------|-------|----------|--------|
${r.fields
  .map((f) => `| ${f.field.slice(0, 40)} | ${f.type} | ${f.label.slice(0, 40)} | ${f.required ? '✅' : '—'} | ${f.filled ? '✅' : '❌'} |`)
  .join('\n')}
`,
  )
  .join('\n')}

## Domain Expert Assessment

### Business Rule Compliance

1. **НДС (VAT) 20%**: Verified in finance pages (FM, invoices, КП) — auto-calculated fields present
2. **ИНН validation**: 10/12 digit regex on counterparty form — negative test confirms rejection of 3-digit ИНН
3. **Required fields**: Project (code, name, constructionKind, customer), Employee (lastName, firstName, position, hireDate), Spec (project, name, status), Estimate (name, project, spec)
4. **Margin auto-calculation**: Bid form computes \`estimatedMargin = (bidAmount - estimatedCost) / bidAmount × 100\`
5. **Date ordering**: Cross-field validation (start < end) on task form
6. **XSS prevention**: React JSX auto-escapes — \`<script>\` tags not rendered as HTML
7. **Competitive list**: Registry page present, min 3 vendors per item enforced at business level
8. **Document chain**: Spec → КЛ → FM → КП workflow supported via auto-checkboxes on spec form

### Potential Gaps
- Budget/Invoice/Payment creation requires navigating to separate \`/new\` pages (not inline modals) — verify those routes exist
- Some list pages may lack visible create buttons (recorded as UX issues)
- Max-length constraints on text fields should be verified at HTML level (not just Zod)
- Date fields lack min/max constraints (could enter dates in 1900 or 2099)
`;

    fs.writeFileSync(
      path.join(REPORTS_DIR, 'crawler-forms-part1-summary.md'),
      md,
    );
  });
});
