import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-fixes-screenshots';
fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', 'admin@privod.ru');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);

  // Navigate to project pre-construction tab
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("предстроит")').first().click();
  await page.waitForTimeout(2000);

  // === SAFETY CHECKLIST: Add item ===
  const safetyTitle = page.locator('h3:has-text("Чек-лист ТБ")').first();
  await safetyTitle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const addBtn = page.locator('button[title="Добавить пункт"]');
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(500);
    
    // Fill description
    const descInput = page.locator('input[placeholder="Введите описание пункта"]');
    await descInput.fill('Проверка заземления оборудования');
    
    // Click modal's "Добавить" button (inside the modal, not elsewhere)
    // The modal has a specific structure - get the dialog/modal container then find button
    const modalAddBtn = page.locator('.space-y-4 button:has-text("Добавить")').first();
    await modalAddBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    await safetyTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '14-safety-after-add.png') });
    console.log('14. Safety after adding item');
  }

  // Toggle a checkbox item
  const firstCheckItem = page.locator('button:has-text("Каски, жилеты")').first();
  if (await firstCheckItem.count() > 0) {
    await firstCheckItem.click();
    await page.waitForTimeout(500);
    await safetyTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, '15-safety-after-toggle.png') });
    console.log('15. Safety after toggling');
  }

  // === PERMITS: Edit status ===
  const permitsTitle = page.locator('h3:has-text("Разрешительная документация")').first();
  await permitsTitle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '20-permits-section.png') });
  console.log('20. Permits section');
  
  // Click pencil on first mandatory permit row (ГПЗУ)
  // Find pencil icons - they are SVG with lucide-pencil class
  const pencilBtns = page.locator('svg.lucide-pencil').first();
  if (await pencilBtns.count() > 0) {
    await pencilBtns.click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(DIR, '21-permit-edit-modal.png') });
    console.log('21. Permit edit modal');
    
    // Change status to IN_PROGRESS
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`  Found ${selectCount} selects in modal`);
    
    // Second select should be status
    if (selectCount >= 2) {
      await selects.nth(1).selectOption('IN_PROGRESS');
      await page.waitForTimeout(300);
    }
    
    // Click save
    const saveBtn = page.locator('button:has-text("Сохранить")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
    
    await permitsTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '22-permits-after-save.png') });
    console.log('22. Permits after saving status change');
  }

  // === SITE ASSESSMENT: Panel in pre-construction ===
  const siteTitle = page.locator('h3:has-text("Обследование площад")').first();
  if (await siteTitle.count() > 0) {
    await siteTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '30-site-assessment-panel.png') });
    console.log('30. Site assessment panel');
  }

  // === SITE ASSESSMENT: Standalone list page ===
  await page.goto(`${BASE}/site-assessments`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '31-site-assessment-list.png'), fullPage: true });
  console.log('31. Site assessment list');
  
  // Check what's on the page
  const h1 = await page.locator('h1, h2').first().textContent();
  console.log('  Page heading:', h1);
  
  // Try click first item (could be table row or card)
  const saRows = page.locator('table tbody tr');
  const saCards = page.locator('[class*="cursor-pointer"], [class*="rounded-xl"]').filter({ has: page.locator('text=/Обследование|площад|assessment/i') });
  
  if (await saRows.count() > 0) {
    await saRows.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '32-site-assessment-detail.png'), fullPage: true });
    console.log('32. Site assessment detail');
  } else if (await saCards.count() > 0) {
    await saCards.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '32-site-assessment-detail.png'), fullPage: true });
    console.log('32. Site assessment detail (card)');
  } else {
    console.log('  No site assessments to click');
  }

  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
