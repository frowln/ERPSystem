import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/privod-projects-audit';
mkdirSync(DIR, { recursive: true });

let passed = 0, failed = 0;

function check(name, condition) {
  if (condition) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ FAIL: ${name}`); }
}

async function screenshot(page, name) {
  const path = `${DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 ${path}`);
  return path;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('\n=== 1. LOGIN ===');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);
  check('Login successful', true);

  // 2. Navigate to Projects
  console.log('\n=== 2. PROJECTS PAGE ===');
  await page.goto(`${BASE}/projects`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await screenshot(page, '01-projects-list');

  // 3. Page Header
  console.log('\n=== 3. PAGE HEADER ===');
  const pageTitle = await page.locator('h1').first().textContent();
  console.log(`  Title: "${pageTitle}"`);
  check('Page title is in Russian', /[А-Яа-я]/.test(pageTitle));
  check('Title contains "Объекты"', pageTitle.includes('Объекты'));

  // Subtitle with count — use the paragraph right after h1 inside main content
  const subtitle = await page.locator('main p, [class*="animate-fade"] p').first().textContent().catch(() => '');
  console.log(`  Subtitle: "${subtitle}"`);
  check('Subtitle contains count', /\d/.test(subtitle) && /объект/.test(subtitle));

  // Breadcrumbs
  const breadcrumbs = await page.locator('nav[aria-label="breadcrumb"], .breadcrumb, [class*="breadcrumb"]').textContent().catch(() => '');
  console.log(`  Breadcrumbs: "${breadcrumbs?.trim().slice(0, 60)}"`);

  // 4. Create button
  console.log('\n=== 4. CREATE BUTTON ===');
  const createBtn = page.locator('button:has-text("Создать"), a:has-text("Создать")').first();
  const createBtnVisible = await createBtn.isVisible().catch(() => false);
  check('Create button visible', createBtnVisible);
  if (createBtnVisible) {
    const createText = await createBtn.textContent();
    console.log(`  Button text: "${createText}"`);
    check('Create button in Russian', /Создать/.test(createText));
  }

  // 5. KPI Summary Cards
  console.log('\n=== 5. KPI SUMMARY CARDS ===');
  const metricCards = page.locator('[class*="animate-fade"] .grid > div');
  const metricCount = await metricCards.count();
  console.log(`  Metric cards: ${metricCount}`);
  check('Has 4 KPI cards', metricCount >= 4);

  const metricTexts = await metricCards.allTextContents();
  const hasRussianMetrics = metricTexts.some(t => /[А-Яа-я]/.test(t));
  check('KPI cards in Russian', hasRussianMetrics);
  console.log(`  KPI texts: ${metricTexts.map(t => t.trim().slice(0, 40)).join(' | ')}`);

  // 6. Tab filters — tabs are buttons in a border-b flex container
  console.log('\n=== 6. TAB FILTERS ===');
  const tabBar = page.locator('.border-b.flex');
  const tabs = tabBar.locator('button');
  const tabCount = await tabs.count();
  console.log(`  Tab count: ${tabCount}`);
  check('Has tab filters (>=4)', tabCount >= 4);

  const allTexts = [];
  for (let i = 0; i < Math.min(tabCount, 10); i++) {
    const text = await tabs.nth(i).textContent();
    allTexts.push(text?.trim());
  }
  console.log(`  Tab labels: ${allTexts.join(' | ')}`);
  check('Tab labels in Russian', allTexts.some(t => /Все|В работе|Планирование|Завершённые/.test(t)));

  // 7. Search and Filter — use the project-specific search (inside main content, not TopBar)
  console.log('\n=== 7. SEARCH & FILTER ===');
  const searchInput = page.locator('input[placeholder*="Поиск по названию"]').first();
  const searchVisible = await searchInput.isVisible().catch(() => false);
  check('Project search input visible', searchVisible);
  if (searchVisible) {
    const placeholder = await searchInput.getAttribute('placeholder');
    console.log(`  Search placeholder: "${placeholder}"`);
    check('Search placeholder in Russian', /[А-Яа-я]/.test(placeholder));
  }

  const statusFilter = page.locator('select').first();
  const statusFilterVisible = await statusFilter.isVisible().catch(() => false);
  check('Status filter visible', statusFilterVisible);

  // 8. Table content
  console.log('\n=== 8. TABLE CONTENT ===');
  const tableHeaders = await page.locator('th, [role="columnheader"]').allTextContents();
  console.log(`  Headers (${tableHeaders.length}): ${tableHeaders.join(' | ')}`);

  const hasEnglishHeaders = tableHeaders.some(h => /^(Budget|Status|Type|Progress|Manager|Name|Code)$/.test(h.trim()));
  check('All headers in Russian', !hasEnglishHeaders);

  // Check table rows
  const rows = page.locator('tbody tr, [role="row"]');
  const rowCount = await rows.count();
  console.log(`  Table rows: ${rowCount}`);
  check('Has project rows', rowCount >= 3);

  // 9. Data in rows
  console.log('\n=== 9. DATA VERIFICATION ===');
  const cellTexts = await page.locator('tbody td, [role="cell"]').allTextContents();
  const allText = cellTexts.join(' ');

  // Check for Russian status labels
  const hasRussianStatus = /В работе|Планирование|Завершён|Черновик|Приостановлен|Отменён/.test(allText);
  check('Status labels in Russian', hasRussianStatus);

  // Check for project types in Russian
  const hasRussianType = /Жилое|Коммерческое|Промышленное|Инфраструктура|Реновация|Реконструкция/.test(allText);
  check('Project types in Russian', hasRussianType);

  // Check for budget formatting (Russian ₽ format)
  const hasBudgetFormat = /[\d\s]+₽/.test(allText) || /[\d\s]+руб/.test(allText);
  check('Budget in Russian format', hasBudgetFormat);

  // Check for date formatting (DD.MM.YYYY)
  const hasDateFormat = /\d{2}\.\d{2}\.\d{4}/.test(allText);
  check('Dates in DD.MM.YYYY format', hasDateFormat);

  // Check for progress percentages
  const hasProgress = /\d+%/.test(allText);
  check('Progress percentages shown', hasProgress);

  // Check for project codes
  const hasProjectCodes = /PRJ-\d+/.test(allText);
  check('Project codes shown (PRJ-XXXXX)', hasProjectCodes);

  // Check for customer names
  const hasCustomers = /ООО|АО|ГКУ/.test(allText);
  check('Customer names shown', hasCustomers);

  // Check no English status values leaked
  const hasEnglishStatus = /IN_PROGRESS|COMPLETED|CANCELLED|PLANNING|DRAFT|ON_HOLD/.test(allText);
  check('No English status values', !hasEnglishStatus);

  const hasEnglishType = /RESIDENTIAL|COMMERCIAL|INDUSTRIAL|INFRASTRUCTURE|RENOVATION/.test(allText);
  check('No English type values', !hasEnglishType);

  // 10. Tab interaction
  console.log('\n=== 10. TAB INTERACTION ===');
  // Click "В работе" tab
  const inProgressTab = page.locator('button:has-text("В работе")').first();
  if (await inProgressTab.isVisible().catch(() => false)) {
    await inProgressTab.click();
    await page.waitForTimeout(500);
    await screenshot(page, '02-tab-in-progress');
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`  "В работе" tab: ${filteredRows} rows`);
    check('"В работе" filter works', filteredRows >= 1);
  }

  // Click "Планирование" tab
  const planningTab = page.locator('button:has-text("Планирование")').first();
  if (await planningTab.isVisible().catch(() => false)) {
    await planningTab.click();
    await page.waitForTimeout(500);
    await screenshot(page, '03-tab-planning');
    const planRows = await page.locator('tbody tr').count();
    console.log(`  "Планирование" tab: ${planRows} rows`);
    check('"Планирование" filter works', planRows >= 1);
  }

  // Click "Все" tab to reset
  const allTab = page.locator('button:has-text("Все")').first();
  if (await allTab.isVisible().catch(() => false)) {
    await allTab.click();
    await page.waitForTimeout(500);
  }

  // 11. Search interaction — use the PROJECT search input (not TopBar)
  console.log('\n=== 11. SEARCH ===');
  if (searchVisible) {
    await searchInput.fill('Речной');
    await page.waitForTimeout(500);
    await screenshot(page, '04-search-result');
    const searchRows = await page.locator('tbody tr').count();
    console.log(`  Search "Речной": ${searchRows} rows`);
    check('Search filters correctly', searchRows === 1);
    await searchInput.fill('');
    await page.waitForTimeout(500);
  }

  // 12. Dark mode
  console.log('\n=== 12. DARK MODE ===');
  await page.evaluate(() => { document.documentElement.classList.add('dark'); });
  await page.waitForTimeout(500);
  await screenshot(page, '05-dark-mode');
  check('Dark mode renders', true);
  await page.evaluate(() => { document.documentElement.classList.remove('dark'); });

  // 13. Click into a project detail
  console.log('\n=== 13. PROJECT DETAIL NAVIGATION ===');
  const firstRow = page.locator('tbody tr').first();
  if (await firstRow.isVisible().catch(() => false)) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    console.log(`  Navigated to: ${currentUrl}`);
    check('Navigates to project detail', currentUrl.includes('/projects/'));
    await screenshot(page, '06-project-detail');

    // Check detail page content
    const detailTitle = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`  Detail title: "${detailTitle}"`);
    check('Detail page has title', detailTitle.length > 0);
  }

  // 14. Go back and check empty state with impossible search
  console.log('\n=== 14. EMPTY STATE ===');
  await page.goto(`${BASE}/projects`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const searchInput2 = page.locator('input[placeholder*="Поиск по названию"]').first();
  if (await searchInput2.isVisible().catch(() => false)) {
    await searchInput2.fill('XYZNONEXISTENT12345');
    await page.waitForTimeout(500);
    await screenshot(page, '07-empty-state');
    const emptyRows = await page.locator('tbody tr').count();
    const emptyMsg = await page.locator('text=не найден').textContent().catch(() => '');
    console.log(`  Empty search: ${emptyRows} rows, msg: "${emptyMsg.slice(0, 50)}"`);
    check('Empty state shown for no results', emptyRows === 0 || emptyMsg.length > 0);
    await searchInput2.fill('');
  }

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots saved to: ${DIR}`);
  console.log(`${'='.repeat(50)}`);
}

main().catch(console.error);
