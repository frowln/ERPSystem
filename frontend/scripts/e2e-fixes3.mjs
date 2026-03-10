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

  // Go to first project, pre-construction tab
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(2000);
  
  // Click pre-construction tab
  const preConTab = page.locator('button:has-text("предстроит")').first();
  await preConTab.click();
  await page.waitForTimeout(2000);

  // === 1. SAFETY CHECKLIST ===
  // Scroll to safety checklist
  const safetyTitle = page.locator('h3:has-text("Чек-лист ТБ")').first();
  if (await safetyTitle.count() > 0) {
    await safetyTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Check if "Инициализировать" button exists
    const initBtn = page.locator('button:has-text("Инициализировать")').first();
    if (await initBtn.count() > 0) {
      console.log('Safety checklist: initializing...');
      await page.screenshot({ path: path.join(DIR, '10-safety-before-init.png') });
      await initBtn.click();
      await page.waitForTimeout(1500);
      await safetyTitle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(DIR, '11-safety-after-init.png') });
    console.log('11. Safety checklist after init');
    
    // Check counter
    const counter = await page.locator('text=/\\d+\\/\\d+/').first().textContent();
    console.log('Safety counter:', counter);
    
    // Look for + button
    const addBtn = page.locator('button[title="Добавить пункт"]');
    if (await addBtn.count() > 0) {
      console.log('Add button found!');
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '12-safety-add-modal.png') });
      console.log('12. Safety add modal');
      
      // Fill form
      const descInput = page.locator('input[placeholder="Введите описание пункта"]');
      if (await descInput.count() > 0) {
        await descInput.fill('Проверка заземления оборудования');
      }
      await page.screenshot({ path: path.join(DIR, '13-safety-add-filled.png') });
      
      // Click "Добавить"
      const addSubmit = page.locator('button:has-text("Добавить")').last();
      if (await addSubmit.count() > 0) {
        await addSubmit.click();
        await page.waitForTimeout(1000);
      }
      
      await safetyTitle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '14-safety-after-add.png') });
      console.log('14. Safety after adding item');
      
      // Check new counter
      const newCounter = await page.locator('text=/\\d+\\/\\d+/').first().textContent();
      console.log('Safety counter after add:', newCounter);
    } else {
      console.log('WARNING: Add button NOT found');
    }
    
    // Test toggle a checkbox
    const checkItem = page.locator('button:has-text("Каски, жилеты")').first();
    if (await checkItem.count() > 0) {
      await checkItem.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '15-safety-after-toggle.png') });
      console.log('15. Safety after toggling item');
    }
  } else {
    console.log('WARNING: Safety checklist section not found');
  }

  // === 2. PERMITS ===
  const permitsTitle = page.locator('h3:has-text("Разрешительная документация")').first();
  if (await permitsTitle.count() > 0) {
    await permitsTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '20-permits-section.png') });
    console.log('20. Permits section');
    
    // Find pencil buttons in permits section
    // The permits panel is a specific container
    const permitsPanel = page.locator('div:has(> div > h3:has-text("Разрешительная документация"))').last();
    const pencilBtns = permitsPanel.locator('svg.lucide-pencil');
    const pencilCount = await pencilBtns.count();
    console.log(`Permits: found ${pencilCount} pencil icons`);
    
    if (pencilCount > 0) {
      // Click the first pencil to open edit modal
      await pencilBtns.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '21-permit-edit-modal.png') });
      console.log('21. Permit edit modal opened');
      
      // Change status in the dropdown
      const statusSelect = page.locator('select').nth(1); // Second select is status
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('IN_PROGRESS');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(DIR, '22-permit-status-changed.png') });
        console.log('22. Permit status changed to IN_PROGRESS');
      }
      
      // Save
      const saveBtn = page.locator('button:has-text("Сохранить")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }
      
      await permitsTitle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '23-permits-after-save.png') });
      console.log('23. Permits after saving');
    }
  }

  // === 3. SITE ASSESSMENT ===
  const siteTitle = page.locator('h3:has-text("Обследование площад")').first();
  if (await siteTitle.count() > 0) {
    await siteTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '30-site-assessment-panel.png') });
    console.log('30. Site assessment panel in pre-construction');
  }

  // Go to standalone site assessments page
  await page.goto(`${BASE}/site-assessments`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '31-site-assessment-list.png'), fullPage: true });
  console.log('31. Site assessment list page');
  
  // Try clicking first assessment
  const saRow = page.locator('table tbody tr').first();
  if (await saRow.count() > 0) {
    await saRow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '32-site-assessment-detail.png'), fullPage: true });
    console.log('32. Site assessment detail');
  } else {
    // Maybe it's a card view. Try clicking first card
    const saCard = page.locator('[class*="cursor-pointer"]').first();
    if (await saCard.count() > 0) {
      await saCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(DIR, '32-site-assessment-detail.png'), fullPage: true });
      console.log('32. Site assessment detail (from card)');
    } else {
      console.log('No site assessments to click');
    }
  }

  // Also navigate to site assessment creation
  await page.goto(`${BASE}/site-assessments`);
  await page.waitForTimeout(1500);
  const createSaBtn = page.locator('button:has-text("Создать"), button:has-text("Новое обследование"), a:has-text("Новое")').first();
  if (await createSaBtn.count() > 0) {
    await createSaBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '33-site-assessment-create.png'), fullPage: true });
    console.log('33. Site assessment create form');
  }

  await browser.close();
  console.log('\nDone! Screenshots in:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
