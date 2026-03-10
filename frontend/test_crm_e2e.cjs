const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  console.log('1. Logging in...');
  await page.goto('http://localhost:4000/login');
  await page.fill('input[name="email"]', 'admin@privod.ru');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Navigate to CRM Leads
  console.log('2. Opening CRM Leads list (Pipeline view)...');
  await page.goto('http://localhost:4000/crm/leads');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/crm_01_leads_pipeline.png', fullPage: false });
  console.log('   Screenshot: /tmp/crm_01_leads_pipeline.png');

  // Check pipeline stages are not duplicated
  const stageHeaders = await page.locator('.bg-neutral-100.dark\\:bg-neutral-800 h3').allTextContents();
  console.log(`   Pipeline stages: ${stageHeaders.join(' | ')}`);
  const uniqueStages = [...new Set(stageHeaders)];
  if (uniqueStages.length === stageHeaders.length) {
    console.log('   ✓ No duplicate stages');
  } else {
    console.log(`   ✗ DUPLICATES! ${stageHeaders.length} stages, ${uniqueStages.length} unique`);
  }

  // Check KPI cards
  const metricValues = await page.locator('[class*="MetricCard"] [class*="text-2xl"], [class*="metric"] [class*="font-bold"]').allTextContents();
  console.log(`   Metrics: ${metricValues.join(' | ')}`);

  // Switch to List view
  console.log('3. Switching to List view...');
  const listButton = page.locator('button').filter({ hasText: /Список/i });
  if (await listButton.count() > 0) {
    await listButton.first().click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/tmp/crm_02_leads_list.png', fullPage: false });
  console.log('   Screenshot: /tmp/crm_02_leads_list.png');

  // Check table headers are Russian
  const thTexts = await page.locator('thead th').allTextContents();
  console.log(`   Table headers: ${thTexts.filter(t => t.trim()).join(' | ')}`);

  // Check lead rows
  const rowCount = await page.locator('tbody tr').count();
  console.log(`   Lead rows: ${rowCount}`);

  // Click on first lead to open detail
  console.log('4. Opening first lead detail...');
  const firstRow = page.locator('tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/crm_03_lead_detail.png', fullPage: false });
    console.log('   Screenshot: /tmp/crm_03_lead_detail.png');

    // Check for error message
    const errorText = await page.locator('text=Произошла ошибка').count();
    if (errorText > 0) {
      console.log('   ✗ ERROR: Error message found on detail page!');
    } else {
      console.log('   ✓ Detail page loaded without errors');
    }

    // Check stage flow bar
    const stageSteps = await page.locator('.flex.items-center.gap-2 .px-4.py-2').allTextContents();
    console.log(`   Stage flow: ${stageSteps.map(s => s.trim()).join(' → ')}`);

    // Check sidebar info
    const infoLabels = await page.locator('.text-xs.text-neutral-500').allTextContents();
    console.log(`   Info labels: ${infoLabels.slice(0, 8).join(' | ')}`);

    // Check for English fragments
    const allText = await page.locator('body').textContent();
    const englishPatterns = ['convert ', 'go to ', 'linked', 'Pipeline'];
    for (const pat of englishPatterns) {
      if (allText.includes(pat) && pat !== 'Pipeline') {
        console.log(`   ✗ English fragment found: "${pat}"`);
      }
    }

    // Check status badges
    const badges = await page.locator('[class*="StatusBadge"], [class*="inline-flex"][class*="rounded-full"]').allTextContents();
    console.log(`   Status badges: ${badges.filter(b => b.trim()).join(' | ')}`);

    // Scroll down for full page screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/crm_04_lead_detail_bottom.png', fullPage: true });
    console.log('   Screenshot: /tmp/crm_04_lead_detail_bottom.png');
  }

  // Go back and test creating a new lead
  console.log('5. Testing "New Lead" form...');
  await page.goto('http://localhost:4000/crm/leads/new');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/crm_05_new_lead_form.png', fullPage: true });
  console.log('   Screenshot: /tmp/crm_05_new_lead_form.png');

  // Check form labels are Russian
  const formLabels = await page.locator('label, h2').allTextContents();
  console.log(`   Form labels: ${formLabels.filter(l => l.trim()).join(' | ')}`);

  // Check for hardcoded English in form
  const formText = await page.locator('form').textContent();
  const formEnglish = ['Priority', 'Source', 'Company', 'Name'];
  for (const eng of formEnglish) {
    if (formText && formText.includes(eng) && !formText.includes('Company')) {
      console.log(`   ✗ English in form: "${eng}"`);
    }
  }

  // Test pipeline back navigation
  console.log('6. Going back to Pipeline view...');
  await page.goto('http://localhost:4000/crm/leads');
  await page.waitForTimeout(2000);

  // Check lead cards in pipeline
  const cardCount = await page.locator('.bg-white.dark\\:bg-neutral-900.rounded-lg.p-3.border').count();
  console.log(`   Lead cards in pipeline: ${cardCount}`);

  // Test a WON lead detail (conversion button)
  console.log('7. Testing WON lead...');
  await page.goto('http://localhost:4000/crm/leads');
  await page.waitForTimeout(1000);

  // Switch to list, find WON lead
  const listBtn2 = page.locator('button').filter({ hasText: /Список/i });
  if (await listBtn2.count() > 0) await listBtn2.first().click();
  await page.waitForTimeout(1000);

  // Find and click a WON lead
  const wonRow = page.locator('tr').filter({ hasText: /Выиграно/i }).first();
  if (await wonRow.count() > 0) {
    await wonRow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/crm_06_won_lead.png', fullPage: true });
    console.log('   Screenshot: /tmp/crm_06_won_lead.png');

    // Check for project link
    const projectLink = await page.locator('text=Перейти к проекту').count();
    console.log(`   "Перейти к проекту" button: ${projectLink > 0 ? '✓ Found' : '✗ Not found'}`);
  } else {
    console.log('   No WON lead found in list');
  }

  // Test CRM Dashboard
  console.log('8. Testing CRM Dashboard...');
  await page.goto('http://localhost:4000/crm/dashboard');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/crm_07_dashboard.png', fullPage: true });
  console.log('   Screenshot: /tmp/crm_07_dashboard.png');

  // Check dashboard title
  const dashTitle = await page.locator('h1, [class*="PageHeader"] h1, [class*="text-2xl"]').first().textContent();
  console.log(`   Dashboard title: "${dashTitle}"`);

  console.log('\n=== E2E Test Complete ===');
  await browser.close();
})().catch(e => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
