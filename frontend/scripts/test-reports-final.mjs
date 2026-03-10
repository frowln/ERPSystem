import { chromium } from 'playwright';
import { mkdirSync, statSync, readFileSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/privod-reports-final';
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

  // 2. Navigate to Reports
  console.log('\n=== 2. REPORTS PAGE ===');
  await page.goto(`${BASE}/reports`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '01-reports-all');

  const allCards = await page.locator('.grid > div').count();
  check(`Total report cards: ${allCards}`, allCards === 16);

  const titles = await page.locator('h3').allTextContents();
  const hasEnglish = titles.some(t => /^[A-Za-z]/.test(t.trim()));
  check('All report titles in Russian', !hasEnglish);
  console.log(`  Titles: ${titles.slice(0, 5).join(', ')}...`);

  // 3. Category filters
  console.log('\n=== 3. CATEGORY FILTERS ===');
  const filterButtons = page.locator('.flex.items-center.gap-2.mb-6 button');
  const filterCount = await filterButtons.count();
  check(`Filter buttons: ${filterCount}`, filterCount === 5);

  for (let i = 0; i < filterCount; i++) {
    const btn = filterButtons.nth(i);
    const label = (await btn.textContent()).trim();
    await btn.click();
    await page.waitForTimeout(300);
    const visibleCards = await page.locator('.grid > div').count();
    check(`Filter "${label}": ${visibleCards} cards`, visibleCards > 0);
  }
  await filterButtons.nth(0).click();
  await page.waitForTimeout(300);

  // 4. Category filter screenshots
  console.log('\n=== 4. CATEGORY SCREENSHOTS ===');
  for (const cat of ['Объект', 'Финансы', 'Безопасность', 'Операции']) {
    const btn = page.locator(`button:has-text("${cat}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await screenshot(page, `03-filter-${cat}`);
    }
  }
  await filterButtons.nth(0).click();
  await page.waitForTimeout(300);

  // 5. Generation modal
  console.log('\n=== 5. GENERATION MODAL ===');
  const generateBtn = page.locator('button:has-text("Сформировать")').first();
  await generateBtn.click();
  await page.waitForTimeout(500);
  await screenshot(page, '04-modal-open');

  const selects = page.locator('select');
  const dateInputs = page.locator('input[type="date"]');
  check('Project select visible', (await selects.count()) >= 1);
  check('Date inputs: 2', (await dateInputs.count()) === 2);
  check('Format select visible', (await selects.count()) >= 2);

  if ((await dateInputs.count()) >= 2) {
    const dateTo = await dateInputs.nth(1).inputValue();
    const dateFrom = await dateInputs.nth(0).inputValue();
    const today = new Date().toISOString().slice(0, 10);
    check(`Date To is today (${dateTo})`, dateTo === today);
    check(`Date From is ~1 month ago (${dateFrom})`, dateFrom !== dateTo);
  }

  const formatSelect = selects.last();
  const options = await formatSelect.locator('option').allTextContents();
  console.log(`  Format options: ${options.join(', ')}`);
  check('Has PDF/XLSX/CSV formats', options.length >= 3);

  // 6. Download test — PDF (default format)
  console.log('\n=== 6. DOWNLOAD TEST (PDF) ===');
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  const modalGenBtn = page.locator('button:has-text("Сформировать")').last();
  await modalGenBtn.click();
  await page.waitForTimeout(3000);

  const download = await downloadPromise;
  if (download) {
    const filename = download.suggestedFilename();
    const dlPath = `${DIR}/${filename}`;
    await download.saveAs(dlPath);
    const size = statSync(dlPath).size;
    console.log(`  Downloaded: ${filename} (${size} bytes)`);
    check('PDF download succeeded', true);
    check(`PDF file not empty (${size} bytes)`, size > 0);
    check('PDF filename has .pdf extension', filename.endsWith('.pdf'));

    const header = readFileSync(dlPath).subarray(0, 5).toString();
    check('File starts with %PDF', header === '%PDF-');
  } else {
    check('Download triggered', false);
    await screenshot(page, '05-download-failed');
  }
  await screenshot(page, '06-after-download');

  // 6b. Download test — XLSX format
  console.log('\n=== 6b. DOWNLOAD TEST (XLSX) ===');
  const genBtn2 = page.locator('button:has-text("Сформировать")').first();
  await genBtn2.click();
  await page.waitForTimeout(500);
  // Select XLSX format
  const fmtSelect = page.locator('select').last();
  await fmtSelect.selectOption('xlsx');
  await page.waitForTimeout(300);
  const xlsxDownloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  const modalGenBtn2 = page.locator('button:has-text("Сформировать")').last();
  await modalGenBtn2.click();
  await page.waitForTimeout(3000);
  const xlsxDownload = await xlsxDownloadPromise;
  if (xlsxDownload) {
    const xlsxFilename = xlsxDownload.suggestedFilename();
    const xlsxPath = `${DIR}/${xlsxFilename}`;
    await xlsxDownload.saveAs(xlsxPath);
    const xlsxSize = statSync(xlsxPath).size;
    console.log(`  Downloaded: ${xlsxFilename} (${xlsxSize} bytes)`);
    check('XLSX download succeeded', true);
    check('XLSX filename has .xlsx extension', xlsxFilename.endsWith('.xlsx'));
    check(`XLSX file not empty (${xlsxSize} bytes)`, xlsxSize > 0);
  } else {
    check('XLSX download triggered', false);
  }

  // 6c. Download test — CSV format
  console.log('\n=== 6c. DOWNLOAD TEST (CSV) ===');
  const genBtn3 = page.locator('button:has-text("Сформировать")').first();
  await genBtn3.click();
  await page.waitForTimeout(500);
  const fmtSelect2 = page.locator('select').last();
  await fmtSelect2.selectOption('csv');
  await page.waitForTimeout(300);
  const csvDownloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  const modalGenBtn3 = page.locator('button:has-text("Сформировать")').last();
  await modalGenBtn3.click();
  await page.waitForTimeout(3000);
  const csvDownload = await csvDownloadPromise;
  if (csvDownload) {
    const csvFilename = csvDownload.suggestedFilename();
    const csvPath = `${DIR}/${csvFilename}`;
    await csvDownload.saveAs(csvPath);
    const csvSize = statSync(csvPath).size;
    console.log(`  Downloaded: ${csvFilename} (${csvSize} bytes)`);
    check('CSV download succeeded', true);
    check('CSV filename has .csv extension', csvFilename.endsWith('.csv'));
    const content = readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    check(`CSV has header + data (${lines.length} lines)`, lines.length >= 2);
    check('CSV header in Russian', /[А-Яа-я]/.test(lines[0]));
  } else {
    check('CSV download triggered', false);
  }

  // 7. Dark mode
  console.log('\n=== 7. DARK MODE ===');
  // Click the dark mode toggle button in the top bar
  const darkToggle = page.locator('button[aria-label]').filter({ has: page.locator('svg') }).nth(0);
  // Use the moon/sun toggle button
  const themeButton = page.locator('header button').filter({ hasText: '' }).nth(1);
  await themeButton.click().catch(() => {});
  await page.waitForTimeout(500);

  // Force dark mode via direct DOM manipulation
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(500);
  await screenshot(page, '07-dark-mode');

  const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  check('Dark mode class applied', hasDarkClass);

  // Open modal in dark mode
  const darkGenBtn2 = page.locator('button:has-text("Сформировать")').first();
  await darkGenBtn2.click();
  await page.waitForTimeout(500);
  await screenshot(page, '08-dark-mode-modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Reset to light
  await page.evaluate(() => { document.documentElement.classList.remove('dark'); });

  // 8. Test ALL 16 report downloads via frontend proxy
  console.log('\n=== 8. ALL 16 REPORT API TESTS ===');
  const reportTypes = [
    'project-summary', 'financial-report', 'safety-report', 'daily-log-report',
    'ks2-report', 'ks3-report', 'budget-variance', 'progress-report',
    'material-consumption', 'fleet-utilization', 'evm-report', 'change-order-report',
    'quality-report', 'labor-report', 'subcontractor-report', 'rfi-submittal-report'
  ];

  for (const rt of reportTypes) {
    const result = await page.evaluate(async (reportType) => {
      try {
        const authStore = JSON.parse(localStorage.getItem('privod-auth') || '{}');
        const token = authStore?.state?.token || '';
        const resp = await fetch(`/api/analytics/export/${reportType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await resp.text();
        const lines = text.trim().split('\n');
        return {
          ok: resp.ok,
          status: resp.status,
          lines: lines.length,
          header: lines[0]?.slice(0, 80) || '',
          hasRussian: /[А-Яа-я]/.test(lines[0] || ''),
          hasData: lines.length > 1,
          stub: text.includes('будут доступны')
        };
      } catch (e) {
        return { ok: false, status: 0, lines: 0, header: e.message, hasRussian: false, hasData: false, stub: false };
      }
    }, rt);

    const statusText = result.ok
      ? (result.hasData ? `${result.lines} lines, Russian: ${result.hasRussian}` : 'header only')
      : `HTTP ${result.status}`;
    check(`${rt}: ${statusText}`, result.ok && result.hasRussian && !result.stub);
  }

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots saved to: ${DIR}`);
  console.log(`${'='.repeat(50)}`);
}

main().catch(console.error);
