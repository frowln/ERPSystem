import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const SCREENSHOTS_DIR = '/tmp/privod-screenshots';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function screenshot(page, name) {
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 Screenshot: ${path}`);
  return path;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('=== 1. Logging in ===');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);
  console.log('  ✅ Logged in successfully');

  // 2. Navigate to Reports page
  console.log('\n=== 2. Reports Page (/reports) ===');
  await page.goto(`${BASE}/reports`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '01-reports-page-all');

  // Count visible report cards
  const allCards = await page.locator('.grid > div').count();
  console.log(`  📊 Total report cards visible: ${allCards}`);

  // Check all report titles are in Russian
  const titles = await page.locator('h3').allTextContents();
  console.log(`  📝 Report titles: ${titles.join(', ')}`);
  const hasEnglish = titles.some(t => /^[A-Za-z]/.test(t.trim()));
  console.log(`  ${hasEnglish ? '❌ Some titles in English!' : '✅ All titles in Russian'}`);

  // 3. Test category filters
  console.log('\n=== 3. Category Filters ===');
  const filterButtons = page.locator('.flex.items-center.gap-2.mb-6 button');
  const filterCount = await filterButtons.count();
  console.log(`  🔘 Filter buttons: ${filterCount}`);

  for (let i = 0; i < filterCount; i++) {
    const btn = filterButtons.nth(i);
    const label = await btn.textContent();
    await btn.click();
    await page.waitForTimeout(300);
    const visibleCards = await page.locator('.grid > div').count();
    console.log(`  Filter "${label.trim()}": ${visibleCards} cards visible`);
    if (i > 0 && visibleCards === 0) {
      console.log(`  ❌ BUG: Filter "${label.trim()}" shows 0 cards!`);
    }
  }

  // Reset to "All"
  await filterButtons.nth(0).click();
  await page.waitForTimeout(300);
  await screenshot(page, '02-reports-filters');

  // 4. Test report generation modal
  console.log('\n=== 4. Report Generation Modal ===');
  const firstGenerateBtn = page.locator('button:has-text("Сформировать")').first();
  await firstGenerateBtn.click();
  await page.waitForTimeout(500);
  await screenshot(page, '03-reports-modal');

  // Check modal is open
  const modalVisible = await page.locator('[role="dialog"], .fixed').first().isVisible().catch(() => false);
  console.log(`  ${modalVisible ? '✅' : '⚠️'} Modal is ${modalVisible ? 'visible' : 'not visible (checking alternative)'}`);

  // Check modal form fields
  const projectSelect = page.locator('select').first();
  const dateInputs = page.locator('input[type="date"]');
  const formatSelect = page.locator('select').last();

  const projectVisible = await projectSelect.isVisible().catch(() => false);
  const dateCount = await dateInputs.count();
  const formatVisible = await formatSelect.isVisible().catch(() => false);

  console.log(`  Project select: ${projectVisible ? '✅' : '❌'}`);
  console.log(`  Date inputs: ${dateCount} ${dateCount === 2 ? '✅' : '❌'}`);
  console.log(`  Format select: ${formatVisible ? '✅' : '❌'}`);

  // Check dates are dynamic (not hardcoded)
  if (dateCount >= 2) {
    const dateFrom = await dateInputs.nth(0).inputValue();
    const dateTo = await dateInputs.nth(1).inputValue();
    console.log(`  Date from: ${dateFrom}`);
    console.log(`  Date to: ${dateTo}`);
    if (dateTo === '2026-02-13') {
      console.log('  ❌ Date is still hardcoded!');
    } else {
      console.log('  ✅ Dates are dynamic');
    }
  }

  // Check format options
  if (formatVisible) {
    const options = await formatSelect.locator('option').allTextContents();
    console.log(`  Format options: ${options.join(', ')}`);
    const hasCSV = options.some(o => o.includes('CSV'));
    console.log(`  ${hasCSV ? '✅' : '❌'} CSV format ${hasCSV ? 'available' : 'missing'}`);
  }

  // Try to generate a report (click the generate button in the modal)
  console.log('\n=== 5. Test Report Download ===');

  // Set up download listener BEFORE clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

  const modalGenerateBtn = page.locator('button:has-text("Сформировать")').last();
  await modalGenerateBtn.click();
  await page.waitForTimeout(3000);

  const download = await downloadPromise;
  if (download) {
    const filename = download.suggestedFilename();
    const path = `${SCREENSHOTS_DIR}/${filename}`;
    await download.saveAs(path);
    const { statSync } = await import('fs');
    const size = statSync(path).size;
    console.log(`  📄 Downloaded: ${filename} (${size} bytes)`);
    if (size === 0) {
      console.log('  ❌ File is empty!');
    } else {
      console.log('  ✅ File has content');
      // Read first 500 chars of CSV
      const { readFileSync } = await import('fs');
      const content = readFileSync(path, 'utf-8').slice(0, 500);
      console.log(`  Preview:\n${content}`);
    }
  } else {
    console.log('  ⚠️ No download triggered (checking toast)');
    await screenshot(page, '04-reports-after-generate');
  }

  // Check for toast message
  await page.waitForTimeout(500);
  const toastText = await page.locator('[role="status"], .toast, .Toastify, [data-sonner-toast]').allTextContents().catch(() => []);
  if (toastText.length > 0) {
    console.log(`  Toast message: ${toastText.join(', ')}`);
  }

  // 6. Test dark mode
  console.log('\n=== 6. Dark Mode ===');
  // Toggle dark mode via localStorage
  await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem('privod-theme') || '{}');
    store.state = store.state || {};
    store.state.mode = 'dark';
    localStorage.setItem('privod-theme', JSON.stringify(store));
    document.documentElement.classList.add('dark');
  });
  await page.goto(`${BASE}/reports`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '05-reports-dark-mode');
  console.log('  ✅ Dark mode screenshot taken');

  // 7. Check all sub-pages from navigation
  console.log('\n=== 7. Quick check: Monitoring page ===');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    const store = JSON.parse(localStorage.getItem('privod-theme') || '{}');
    store.state = store.state || {};
    store.state.mode = 'light';
    localStorage.setItem('privod-theme', JSON.stringify(store));
  });
  await page.goto(`${BASE}/monitoring`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await screenshot(page, '06-monitoring-page');

  // 8. Test each category filter individually with screenshot
  console.log('\n=== 8. Category filter screenshots ===');
  await page.goto(`${BASE}/reports`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const filters = ['Объект', 'Финансы', 'Безопасность', 'Операции'];
  for (const filterName of filters) {
    const btn = page.locator(`button:has-text("${filterName}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      const cards = await page.locator('.grid > div').count();
      console.log(`  Filter "${filterName}": ${cards} cards`);
      await screenshot(page, `07-reports-filter-${filterName}`);
    }
  }

  await browser.close();
  console.log('\n✅ All tests complete. Screenshots saved to:', SCREENSHOTS_DIR);
}

main().catch(console.error);
