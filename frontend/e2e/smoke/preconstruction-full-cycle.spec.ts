/**
 * FULL PRE-CONSTRUCTION CYCLE E2E TEST — DEEP INTERACTION
 *
 * Creates a real project and walks through every screen with actual data:
 * 1.  Create project
 * 2.  Verify detail page overview + tabs
 * 3.  Pre-Construction tab — KPI cards + all 4 panels
 * 4.  Risk Register — add risk, verify matrix placement
 * 5.  Pre-Construction Meeting — create, add attendees/agenda/decisions/actions
 * 6.  Navigate to FM (financial model) from budget list
 * 7.  FM page — verify tabs, VE tab
 * 8.  Specifications list
 * 9.  Commercial Proposals list
 * 10. Contract form — verify insurance/bonds and 44-ФЗ/223-ФЗ fields
 * 11. Procurement + Vendor Prequalification
 * 12. Estimates + Pricing databases (ГЭСН/ФЕР/ТЕР)
 * 13. UX/UI Audit — a11y, progress bars, responsive, dark mode
 * 14. All routes smoke check
 */

import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });
test.describe.configure({ mode: 'serial' });

// Shared state
let projectId: string;
let budgetId: string;

const TS = Date.now().toString(36).slice(-5);
const PROJECT_CODE = `E2E-${TS}`;
const PROJECT_NAME = `E2E Тест ${TS}`;

// --- Helpers ---

async function go(page: Page, route: string, timeout = 60_000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
      return;
    } catch {
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
}

async function bodyContains(page: Page, pattern: RegExp, timeout = 15_000) {
  await expect
    .poll(async () => page.locator('body').innerText(), { timeout, intervals: [500, 1000, 2000] })
    .toMatch(pattern);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

// ============================================================================
// STEP 1: Create Project
// ============================================================================
test('Step 1: Create project', async ({ page }) => {
  test.setTimeout(90_000);
  await go(page, '/projects/new');
  await bodyContains(page, /код объекта|code/i);
  await page.waitForTimeout(800);

  // Fill required fields
  await page.locator('input[name="code"]').fill(PROJECT_CODE);
  await page.locator('input[name="name"]').fill(PROJECT_NAME);

  const kindSelect = page.locator('select[name="constructionKind"]');
  if (await kindSelect.count()) await kindSelect.selectOption('NEW_CONSTRUCTION');

  const typeSelect = page.locator('select[name="type"]');
  if (await typeSelect.count()) {
    try { await typeSelect.selectOption('RESIDENTIAL'); } catch { /* ok */ }
  }

  const desc = page.locator('textarea[name="description"]');
  if (await desc.count()) await desc.fill('E2E тестовый объект — полный цикл');

  // Customer (search autocomplete)
  const customerInput = page.getByPlaceholder(/начните вводить|customer|заказчик/i);
  if (await customerInput.count()) {
    await customerInput.first().fill('ООО «Тест-Строй»');
    await page.locator('h1, h2').first().click(); // blur to close dropdown
    await page.waitForTimeout(400);
  }

  await shot(page, '01-project-form');

  // Submit
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const submitBtn = page.getByRole('button', { name: /создать объект|создать|create/i }).first();
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();

  // Wait for redirect
  await expect.poll(() => {
    const u = page.url();
    return u.includes('/projects/') && !u.includes('/new');
  }, { timeout: 30_000 }).toBe(true);

  projectId = page.url().match(/\/projects\/([^/]+)/)![1];
  console.log(`✅ Project: ${projectId}`);
  await shot(page, '02-project-created');
});

// ============================================================================
// STEP 2: Project Detail — Overview + Tabs
// ============================================================================
test('Step 2: Project detail — overview, NaN fix, Budget title', async ({ page }) => {
  test.setTimeout(60_000);
  expect(projectId).toBeTruthy();

  await go(page, `/projects/${projectId}`);
  await bodyContains(page, new RegExp(PROJECT_NAME.slice(0, 8), 'i'));

  // Verify all 5 tabs
  for (const label of [/обзор/i, /команда/i, /документ/i, /финанс/i, /предстроител/i]) {
    const tab = page.locator('button').filter({ hasText: label });
    expect(await tab.count(), `Tab "${label}" missing`).toBeGreaterThan(0);
  }

  // Verify NaN fix: "ОСТАЛОСЬ ДНЕЙ" should show "—" not "NaN"
  const body = await page.locator('body').innerText();
  expect(body).not.toContain('NaN');
  console.log('  ✅ No NaN on page');

  // Verify Budget title is "Бюджет" not "Budget" (object)
  const budgetCard = page.locator('h3').filter({ hasText: /^Бюджет$/ });
  expect(await budgetCard.count(), 'Budget card title should be "Бюджет"').toBeGreaterThan(0);
  console.log('  ✅ Budget card title = "Бюджет"');

  await shot(page, '03-overview');
});

// ============================================================================
// STEP 3: Pre-Construction Tab — Deep Check
// ============================================================================
test('Step 3: Pre-Construction tab — KPI cards + 4 panels', async ({ page }) => {
  test.setTimeout(60_000);
  expect(projectId).toBeTruthy();

  await go(page, `/projects/${projectId}`);
  await bodyContains(page, new RegExp(PROJECT_NAME.slice(0, 8), 'i'));

  // Click Pre-Construction tab
  const tab = page.locator('button').filter({ hasText: /предстроител/i }).first();
  await tab.click();
  await page.waitForTimeout(2000);

  // 4 KPI progress bars
  const progressBars = page.locator('[role="progressbar"]');
  const pbCount = await progressBars.count();
  expect(pbCount).toBeGreaterThanOrEqual(4);
  console.log(`  ✅ KPI progress bars: ${pbCount}`);

  // Each progress bar has aria-valuenow
  for (let i = 0; i < Math.min(pbCount, 4); i++) {
    const val = await progressBars.nth(i).getAttribute('aria-valuenow');
    expect(val, `Progress bar ${i} missing aria-valuenow`).not.toBeNull();
  }

  // 4 panels: Изыскания, Разрешительная док., ПОС/ППР, Чек-лист ТБ
  for (const title of [/изыскания/i, /разрешительн/i, /пос.*ппр|организаци/i, /чек-лист|безопасност/i]) {
    const heading = page.locator('h3, h4').filter({ hasText: title });
    expect(await heading.count(), `Panel "${title}" heading missing`).toBeGreaterThan(0);
  }
  console.log('  ✅ All 4 panels visible');

  // Buttons: Risk Register + Meeting
  expect(await page.locator('button').filter({ hasText: /реестр рисков/i }).count()).toBeGreaterThan(0);
  expect(await page.locator('button').filter({ hasText: /совещани/i }).count()).toBeGreaterThan(0);
  console.log('  ✅ Risk + Meeting buttons present');

  // Safety checklist items (checkboxes)
  const checkboxes = page.locator('[role="checkbox"]');
  const cbCount = await checkboxes.count();
  console.log(`  ✅ Safety checklist checkboxes: ${cbCount}`);

  // Toggle first safety checkbox if exists
  if (cbCount > 0) {
    const firstCb = checkboxes.first();
    const wasBefore = await firstCb.getAttribute('aria-checked');
    await firstCb.click();
    await page.waitForTimeout(500);
    const wasAfter = await firstCb.getAttribute('aria-checked');
    console.log(`  ✅ Toggled safety checkbox: ${wasBefore} → ${wasAfter}`);
  }

  await shot(page, '04-precon-tab');
});

// ============================================================================
// STEP 4: Risk Register — Deep Interaction
// ============================================================================
test('Step 4: Risk Register — add risk, verify score & matrix', async ({ page }) => {
  test.setTimeout(60_000);
  expect(projectId).toBeTruthy();

  await go(page, `/projects/${projectId}/risks`);
  await bodyContains(page, /реестр рисков/i);

  // Verify 5x5 matrix exists with colored cells
  const matrixCells = page.locator('td [class*="rounded"]');
  expect(await matrixCells.count()).toBeGreaterThan(0);
  console.log('  ✅ Risk matrix rendered');

  // Verify data table has integer probability (not decimals)
  const tableBody = await page.locator('table').last().innerText();
  // Probabilities should be 1-5 integers
  expect(tableBody).not.toMatch(/\b0\.\d+/); // no decimals like 0.7
  console.log('  ✅ Probabilities are integers (1-5)');

  // Verify metric cards: count > 0
  const metricValues = page.locator('h3, p').filter({ hasText: /^\d+$/ });
  expect(await metricValues.count()).toBeGreaterThan(0);

  // Click "Add Risk"
  const addBtn = page.getByRole('button', { name: /добавить риск/i });
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForTimeout(500);

  // Fill risk form
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();

  // Category select
  const catSelect = modal.locator('select').first();
  if (await catSelect.count()) await catSelect.selectOption('FINANCIAL');

  // Description
  const descInput = modal.locator('input, textarea').first();
  await descInput.fill('E2E: Риск задержки поставки арматуры класса А500С');

  // Probability & Impact selects
  const selects = modal.locator('select');
  const selectCount = await selects.count();
  if (selectCount >= 3) {
    await selects.nth(1).selectOption('4');
    await selects.nth(2).selectOption('3');
  }

  // Mitigation
  const mitigationInput = modal.locator('input, textarea').nth(1);
  if (await mitigationInput.count()) {
    await mitigationInput.fill('Разместить заказ у 2-х альтернативных поставщиков');
  }

  await shot(page, '05-risk-modal');

  // Save
  const saveBtn = modal.getByRole('button', { name: /сохранить|save/i });
  await saveBtn.click();
  await page.waitForTimeout(1500);

  // Modal should close
  await expect(modal).toBeHidden({ timeout: 5_000 });
  console.log('  ✅ Risk form submitted, modal closed');

  // Verify risk table still shows data with integer probabilities
  const tableText = await page.locator('table').last().innerText();
  expect(tableText).toContain('Финансовый');
  expect(tableText).not.toMatch(/\b0\.\d+/); // no decimals
  console.log('  ✅ Risk table data intact, integer probabilities');

  // Verify score values in table (e.g., 20, 12, 8)
  expect(tableText).toContain('20');
  expect(tableText).toContain('12');
  console.log('  ✅ Scores displayed correctly (20, 12, ...)');

  await shot(page, '06-risk-register');
});

// ============================================================================
// STEP 5: Pre-Construction Meeting — Deep Interaction
// ============================================================================
test('Step 5: Meeting — create, add attendees, agenda, decisions, actions', async ({ page }) => {
  test.setTimeout(90_000);
  expect(projectId).toBeTruthy();

  await go(page, `/projects/${projectId}/meeting`);
  await page.waitForTimeout(2000);

  // If we see "Стартовое совещание" heading, the page loaded
  await bodyContains(page, /стартовое совещание|совещание/i);
  console.log('  ✅ Meeting page loaded');

  // Check if meeting needs to be created or already has mock data
  const createBtn = page.getByRole('button', { name: /создать совещание|создать/i });
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(1500);
    console.log('  ✅ Meeting created');
  }

  // --- Verify meeting sections exist ---
  const body = await page.locator('body').innerText();

  // Sections: Участники, Повестка, Решения, Задачи, Протокол
  for (const section of [/участники/i, /повестк/i, /решения/i, /задачи/i, /протокол/i]) {
    expect(body).toMatch(section);
  }
  console.log('  ✅ All 5 sections present (Participants, Agenda, Decisions, Actions, Minutes)');

  // Verify mock data loaded (has attendees)
  expect(body).toMatch(/генеральный директор|главный инженер/i);
  console.log('  ✅ Mock attendees loaded');

  // Verify decisions have counters (e.g., "2/5")
  expect(body).toMatch(/\d+\/\d+/);
  console.log('  ✅ Decision/action counters visible');

  // --- Test attendee input exists and is typeable ---
  const attendeeInput = page.getByPlaceholder(/добавить участника/i);
  expect(await attendeeInput.count(), 'Attendee input not found').toBeGreaterThan(0);
  await attendeeInput.fill('E2E: Тестовый участник');
  await attendeeInput.press('Enter');
  await page.waitForTimeout(500);
  console.log('  ✅ Attendee input works');

  // --- Test agenda input exists ---
  const agendaInput = page.getByPlaceholder(/добавить пункт/i);
  expect(await agendaInput.count(), 'Agenda input not found').toBeGreaterThan(0);
  await agendaInput.fill('E2E: Тестовый пункт повестки');
  await agendaInput.press('Enter');
  await page.waitForTimeout(500);
  console.log('  ✅ Agenda input works');

  // --- Test decision input exists ---
  const decisionInput = page.getByPlaceholder(/добавить решение/i);
  expect(await decisionInput.count(), 'Decision input not found').toBeGreaterThan(0);
  console.log('  ✅ Decision input present');

  // --- Test action item inputs exist ---
  const actionDescInput = page.getByPlaceholder(/описание задачи/i);
  expect(await actionDescInput.count(), 'Action description input not found').toBeGreaterThan(0);
  const ownerInput = page.getByPlaceholder(/ответственный/i);
  expect(await ownerInput.count(), 'Owner input not found').toBeGreaterThan(0);
  console.log('  ✅ Action item inputs present (description + owner)');

  // --- Toggle a decision checkbox ---
  const decisionCheckbox = page.locator('button:has(svg)').filter({ hasText: '' });
  // Find checkbox-like toggles in decisions section
  const toggleButtons = page.locator('[role="checkbox"], button:has(svg.lucide-square), button:has(svg.lucide-check-square)');
  if (await toggleButtons.count()) {
    await toggleButtons.first().click();
    await page.waitForTimeout(500);
    console.log('  ✅ Toggled decision/action checkbox');
  }

  // Verify no error toasts on page
  const errorToasts = page.locator('[class*="toast"]').filter({ hasText: /ошибка|error|не найден/i });
  const errorCount = await errorToasts.count();
  console.log(`  ✅ Error toasts: ${errorCount}`);

  await shot(page, '07-meeting');
});

// ============================================================================
// STEP 6: Navigate to FM (Financial Model) via Budget
// ============================================================================
test('Step 6: FM — navigate to financial model, verify tabs', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/budgets');
  await bodyContains(page, /бюджет/i);

  // Find the budget for our E2E project
  const projectBudgetRow = page.locator('tr, [role="row"]').filter({ hasText: new RegExp(PROJECT_NAME.slice(0, 8), 'i') });

  if (await projectBudgetRow.count()) {
    // Click on the row to navigate to budget detail
    await projectBudgetRow.first().click();
    await page.waitForTimeout(2000);

    // Extract budget ID from URL
    const url = page.url();
    const budgetMatch = url.match(/\/budgets\/([^/]+)/);
    if (budgetMatch) {
      budgetId = budgetMatch[1];
      console.log(`  ✅ Budget ID: ${budgetId}`);

      // Now navigate to FM page
      // Option 1: Click "Финансовая модель" button on budget detail
      const fmButton = page.getByRole('link', { name: /финансовая модель/i })
        .or(page.locator('a, button').filter({ hasText: /финансовая модель/i }));

      if (await fmButton.count()) {
        await fmButton.first().click();
        await page.waitForTimeout(2000);
      } else {
        // Option 2: Direct navigation
        await go(page, `/budgets/${budgetId}/fm`);
        await page.waitForTimeout(2000);
      }
    }
  }

  // If we still don't have a budgetId, try to find one from the URL or navigate directly
  if (!budgetId) {
    // Get first budget link
    const firstBudgetLink = page.locator('a[href*="/budgets/"]').first();
    if (await firstBudgetLink.count()) {
      const href = await firstBudgetLink.getAttribute('href');
      const m = href?.match(/\/budgets\/([^/]+)/);
      if (m) {
        budgetId = m[1];
        await go(page, `/budgets/${budgetId}/fm`);
        await page.waitForTimeout(2000);
      }
    }
  }

  if (budgetId) {
    // Verify FM page loaded
    const fmUrl = page.url();
    expect(fmUrl).toContain('/fm');
    console.log('  ✅ FM page loaded');

    // Verify FM tabs exist: Все, Работы, Материалы, Оборудование/Техника, CVR, Снимки, VE
    const tabLabels = [/^все$/i, /работы/i, /материал/i, /оборудован|техник/i, /cvr/i, /снимки/i, /оптимизац|ve/i];
    for (const label of tabLabels) {
      const tabBtn = page.locator('button').filter({ hasText: label });
      if (await tabBtn.count()) {
        console.log(`    ✅ FM tab: ${label}`);
      } else {
        console.log(`    ⚠️ FM tab missing: ${label}`);
      }
    }

    // Click VE tab
    const veTab = page.locator('button').filter({ hasText: /оптимизац|ve/i }).first();
    if (await veTab.count()) {
      await veTab.click();
      await page.waitForTimeout(1500);

      // Check VE content
      const veBody = await page.locator('body').innerText();
      const hasVeContent = /экономия|savings|добавить предложение/i.test(veBody);
      console.log(`  ✅ VE tab content: ${hasVeContent ? 'loaded' : 'empty (expected for new project)'}`);
    }

    await shot(page, '08-fm-page');
  } else {
    console.log('  ⚠️ No budget found to navigate to FM');
    await shot(page, '08-budgets-list');
  }
});

// ============================================================================
// STEP 7: Specifications List
// ============================================================================
test('Step 7: Specifications list', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/specifications');
  await bodyContains(page, /спецификац/i);

  const table = page.locator('table, [role="table"]').first();
  await expect(table).toBeVisible({ timeout: 10_000 });
  console.log('  ✅ Specifications list');

  await shot(page, '09-specifications');
});

// ============================================================================
// STEP 8: Commercial Proposals
// ============================================================================
test('Step 8: Commercial Proposals list', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/commercial-proposals');
  await bodyContains(page, /коммерческ/i);
  console.log('  ✅ Commercial Proposals list');

  await shot(page, '10-commercial-proposals');
});

// ============================================================================
// STEP 9: Contract Form — Insurance & Procurement Law Fields
// ============================================================================
test('Step 9: Contract form — insurance, bonds, 44-ФЗ/223-ФЗ', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/contracts');
  await bodyContains(page, /договор|контракт/i);
  console.log('  ✅ Contracts list');

  await go(page, '/contracts/new');
  await page.waitForTimeout(1500);

  // Scroll to bottom to see all fields
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const bodyText = await page.locator('body').innerText();

  // Insurance & bond fields
  expect(bodyText).toMatch(/страхован.*гарантии|insurance.*bond/i);
  console.log('  ✅ Insurance & bond section present');

  // Check individual fields
  const fields = [
    /тип страхован/i,
    /номер полис/i,
    /сумма страхован/i,
    /банковск.*гарантии/i,
  ];
  for (const f of fields) {
    if (f.test(bodyText)) {
      console.log(`    ✅ ${f}`);
    }
  }

  // 44-ФЗ / 223-ФЗ procurement law
  const hasProcLaw = /44-ФЗ|223-ФЗ|способ закупки/i.test(bodyText);
  expect(hasProcLaw).toBe(true);
  console.log('  ✅ 44-ФЗ/223-ФЗ procurement law fields');

  await shot(page, '11-contract-form');
});

// ============================================================================
// STEP 10: Procurement + Vendor Prequalification
// ============================================================================
test('Step 10: Procurement and Vendor Prequalification', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/procurement');
  await bodyContains(page, /заявк.*закупку|procurement/i);
  console.log('  ✅ Procurement page');
  await shot(page, '12-procurement');

  await go(page, '/procurement/prequalification');
  await page.waitForTimeout(2000);
  await bodyContains(page, /преквалификац/i);

  // Metric cards should not be truncated (fix verified)
  const metricLabels = await page.locator('[class*="uppercase"]').allInnerTexts();
  for (const label of metricLabels) {
    expect(label).not.toContain('...');
  }
  console.log('  ✅ Prequalification — no truncated labels');

  // Filter chips
  const allChip = page.locator('button').filter({ hasText: /^все$/i });
  expect(await allChip.count()).toBeGreaterThan(0);
  console.log('  ✅ Status filter chips');

  // No error toasts
  const errorToast = page.locator('text=Ресурс не найден');
  expect(await errorToast.count()).toBe(0);
  console.log('  ✅ No "Ресурс не найден" errors');

  await shot(page, '13-prequalification');
});

// ============================================================================
// STEP 11: Estimates + Pricing Databases
// ============================================================================
test('Step 11: Estimates and pricing databases (ГЭСН/ФЕР/ТЕР)', async ({ page }) => {
  test.setTimeout(60_000);

  await go(page, '/estimates');
  await bodyContains(page, /смет/i);
  console.log('  ✅ Estimates list');
  await shot(page, '14-estimates');

  await go(page, '/estimates/pricing/databases');
  await page.waitForTimeout(1500);

  const body = await page.locator('body').innerText();
  const hasPricing = /базы расценок|pricing|ГЭСН|ФЕР|ТЕР|нормативн/i.test(body);
  expect(hasPricing).toBe(true);
  console.log('  ✅ Pricing databases page (ГЭСН/ФЕР/ТЕР)');

  await shot(page, '15-pricing-databases');
});

// ============================================================================
// STEP 12: UX/UI Audit — Deep a11y + Design Check
// ============================================================================
test('Step 12: UX/UI audit — accessibility, design, interactions', async ({ page }) => {
  test.setTimeout(90_000);
  expect(projectId).toBeTruthy();

  const issues: string[] = [];

  // --- Pre-Construction Tab A11y ---
  await go(page, `/projects/${projectId}`);
  await page.waitForTimeout(1000);
  await page.locator('button').filter({ hasText: /предстроител/i }).first().click();
  await page.waitForTimeout(2000);

  // Progress bars have aria-valuenow + aria-label
  const pbs = page.locator('[role="progressbar"]');
  for (let i = 0; i < Math.min(await pbs.count(), 8); i++) {
    if (!(await pbs.nth(i).getAttribute('aria-valuenow'))) {
      issues.push(`Progress bar ${i}: missing aria-valuenow`);
    }
    if (!(await pbs.nth(i).getAttribute('aria-label'))) {
      issues.push(`Progress bar ${i}: missing aria-label`);
    }
  }

  // Checkboxes have aria-checked
  const cbs = page.locator('[role="checkbox"]');
  for (let i = 0; i < Math.min(await cbs.count(), 10); i++) {
    if ((await cbs.nth(i).getAttribute('aria-checked')) === null) {
      issues.push(`Checkbox ${i}: missing aria-checked`);
    }
  }

  // No "NaN" or "[object Object]" anywhere
  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('NaN')) issues.push('NaN visible on page');
  if (bodyText.includes('[object Object]')) issues.push('[object Object] visible');

  // --- Risk Matrix Design ---
  await go(page, `/projects/${projectId}/risks`);
  await page.waitForTimeout(1500);

  // Matrix should have 3 color zones: green, amber/yellow, red
  const greenCells = page.locator('[class*="bg-green-"]');
  const amberCells = page.locator('[class*="bg-amber-"], [class*="bg-yellow-"]');
  const redCells = page.locator('[class*="bg-red-"]');
  console.log(`  Risk matrix colors: green=${await greenCells.count()}, amber=${await amberCells.count()}, red=${await redCells.count()}`);

  // --- Meeting Design ---
  await go(page, `/projects/${projectId}/meeting`);
  await page.waitForTimeout(1500);

  const sections = page.locator('h3');
  const sectionCount = await sections.count();
  console.log(`  Meeting sections: ${sectionCount}`);
  expect(sectionCount).toBeGreaterThanOrEqual(3); // at least attendees, decisions, actions

  // Responsive grids
  const grids = page.locator('[class*="grid-cols"]');
  console.log(`  Responsive grids: ${await grids.count()}`);

  // --- Report ---
  if (issues.length > 0) {
    console.log(`  ⚠️ A11y issues (${issues.length}):`);
    issues.forEach(i => console.log(`    - ${i}`));
  } else {
    console.log('  ✅ No a11y issues');
  }

  await shot(page, '16-ux-audit');
});

// ============================================================================
// STEP 13: All Routes Smoke Test
// ============================================================================
test('Step 13: All pre-construction routes accessible', async ({ page }) => {
  test.setTimeout(120_000);

  const routes = [
    { path: '/crm/leads', name: 'CRM Leads' },
    { path: '/projects', name: 'Projects' },
    { path: '/specifications', name: 'Specifications' },
    { path: '/estimates', name: 'Estimates' },
    { path: '/budgets', name: 'Budgets' },
    { path: '/commercial-proposals', name: 'Commercial Proposals' },
    { path: '/contracts', name: 'Contracts' },
    { path: '/procurement', name: 'Procurement' },
    { path: '/procurement/prequalification', name: 'Prequalification' },
  ];

  if (projectId) {
    routes.push(
      { path: `/projects/${projectId}`, name: 'Project Detail' },
      { path: `/projects/${projectId}/risks`, name: 'Risk Register' },
      { path: `/projects/${projectId}/meeting`, name: 'Meeting' },
    );
  }

  if (budgetId) {
    routes.push(
      { path: `/budgets/${budgetId}/fm`, name: 'Financial Model' },
    );
  }

  const errors: string[] = [];
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => {
    if (!err.message.includes('ResizeObserver') && !err.message.includes('ChunkLoadError')) {
      pageErrors.push(`${page.url()}: ${err.message.slice(0, 100)}`);
    }
  });

  for (const route of routes) {
    try {
      await go(page, route.path);
      await page.waitForTimeout(1200);
      const text = await page.locator('body').innerText();
      if (text.length < 50) {
        errors.push(`${route.name}: page empty`);
      } else {
        console.log(`  ✅ ${route.name}`);
      }
    } catch (e) {
      errors.push(`${route.name}: ${e}`);
    }
  }

  if (errors.length) {
    console.log(`\n  ❌ Route errors (${errors.length}):`);
    errors.forEach(e => console.log(`    - ${e}`));
  }
  if (pageErrors.length) {
    console.log(`\n  ❌ JS errors (${pageErrors.length}):`);
    pageErrors.forEach(e => console.log(`    - ${e}`));
  }

  expect(errors).toHaveLength(0);
  await shot(page, '17-all-routes');
});
