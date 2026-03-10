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

  // Go to projects
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  
  // Click first project
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.count() > 0) {
    const projectName = await firstRow.locator('td').nth(1).textContent();
    console.log('Opening project:', projectName);
    await firstRow.click();
    await page.waitForTimeout(1500);
    
    // Navigate to preConstruction tab
    const preConTab = page.locator('button, a').filter({ hasText: /предстроительная|pre.?construction/i }).first();
    if (await preConTab.count() > 0) {
      await preConTab.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(DIR, '01-preconstruction-tab.png'), fullPage: true });
      console.log('1. Pre-construction tab screenshot taken');
    }
    
    // Scroll to Safety Checklist
    const safetySection = page.locator('text=Чек-лист ТБ').first();
    if (await safetySection.count() > 0) {
      await safetySection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '02-safety-checklist.png'), fullPage: false });
      console.log('2. Safety checklist screenshot taken');
      
      // Look for + button near safety checklist
      const addBtn = page.locator('button[title="Добавить пункт"]');
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(DIR, '03-safety-add-modal.png'), fullPage: false });
        console.log('3. Safety add modal screenshot taken');
        
        // Fill in the modal
        const descInput = page.locator('input[placeholder="Введите описание пункта"]');
        if (await descInput.count() > 0) {
          await descInput.fill('Проверка заземления оборудования');
        }
        await page.screenshot({ path: path.join(DIR, '04-safety-add-filled.png'), fullPage: false });
        console.log('4. Safety add form filled screenshot');
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /отмена|cancel/i }).first();
        if (await cancelBtn.count() > 0) await cancelBtn.click();
        await page.waitForTimeout(300);
      } else {
        console.log('WARNING: No add button found for safety checklist');
        // Maybe checklist not initialized - try to initialize first
        const initBtn = page.locator('button').filter({ hasText: /инициализировать/i }).first();
        if (await initBtn.count() > 0) {
          console.log('Checklist not initialized, clicking initialize...');
          await initBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(DIR, '02b-safety-after-init.png'), fullPage: false });
          
          // Now try the add button again
          const addBtn2 = page.locator('button[title="Добавить пункт"]');
          if (await addBtn2.count() > 0) {
            await addBtn2.click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(DIR, '03-safety-add-modal.png'), fullPage: false });
            console.log('3. Safety add modal screenshot taken (after init)');
            const cancelBtn = page.locator('button').filter({ hasText: /отмена|cancel/i }).first();
            if (await cancelBtn.count() > 0) await cancelBtn.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
    
    // Scroll to Permits section
    const permitsSection = page.locator('text=Разрешительная документация').first();
    if (await permitsSection.count() > 0) {
      await permitsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '05-permits-section.png'), fullPage: false });
      console.log('5. Permits section screenshot taken');
      
      // Click edit pencil on first permit row (should now work for "Не начато" permits)
      const pencilBtns = page.locator('button').filter({ has: page.locator('svg.lucide-pencil') });
      const pencilCount = await pencilBtns.count();
      console.log(`Found ${pencilCount} pencil buttons in permits section`);
      
      if (pencilCount > 0) {
        await pencilBtns.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(DIR, '06-permit-edit-modal.png'), fullPage: false });
        console.log('6. Permit edit modal screenshot taken');
        
        // Close modal
        const cancelBtn = page.locator('button').filter({ hasText: /отмена|cancel/i }).first();
        if (await cancelBtn.count() > 0) await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Now check Site Assessment
    const siteSection = page.locator('text=Обследование площадки').first();
    if (await siteSection.count() > 0) {
      await siteSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '07-site-assessment.png'), fullPage: false });
      console.log('7. Site assessment section screenshot taken');
    }

    // Also check SiteAssessment standalone page
    await page.goto(`${BASE}/site-assessments`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '08-site-assessment-list.png'), fullPage: true });
    console.log('8. Site assessment list page screenshot taken');
  }

  await browser.close();
  console.log('\nAll screenshots saved to:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
