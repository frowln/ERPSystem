#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-issues';
mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  page.on('console', () => {});

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[name="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"], input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Navigate to first project preConstruction
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(2000);
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2000);
  const baseUrl = page.url().split('?')[0];

  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(3000);

  // ===== 1. SITE ASSESSMENT =====
  console.log('\n━━━ 1. ОБСЛЕДОВАНИЕ ПЛОЩАДКИ ━━━');
  const siteSection = page.locator('#section-site-assessments');
  await siteSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await siteSection.screenshot({ path: `${DIR}/01-site-assessment.png` });
  const siteText = await siteSection.textContent() || '';
  console.log('Site text:', siteText.slice(0, 500));

  // ===== 2. SITE ASSESSMENT LIST PAGE =====
  console.log('\n━━━ 2. СТРАНИЦА ОБСЛЕДОВАНИЯ ПЛОЩАДКИ ━━━');
  await page.goto(`${BASE}/site-assessments`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/02-site-assessment-list.png`, fullPage: true });
  const saListText = await page.textContent('body') || '';
  console.log('SA list text:', saListText.slice(0, 500));

  // Go back
  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(3000);

  // ===== 3. PERMITS - STATUS CHANGE =====
  console.log('\n━━━ 3. РАЗРЕШИТЕЛЬНАЯ ДОКУМЕНТАЦИЯ ━━━');
  const permSection = page.locator('#section-permits');
  await permSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await permSection.screenshot({ path: `${DIR}/03-permits-initial.png` });
  const permText = await permSection.textContent() || '';
  console.log('Permits text:', permText.slice(0, 500));

  // Try clicking on a permit to see if there's edit capability
  const firstPermit = permSection.locator('div').filter({ hasText: /ГПЗУ|Экспертиза|Разрешение|Экологическое|Пожарная/ }).first();
  if (await firstPermit.count() > 0) {
    // Check for edit/pencil button
    const editBtns = permSection.locator('button[aria-label], button svg, [class*="edit"], [class*="pencil"]');
    console.log('Edit buttons found:', await editBtns.count());
    
    // Check for status badges/buttons
    const statusBadges = permSection.locator('text=Не начато');
    console.log('Status badges "Не начато":', await statusBadges.count());
    
    // Try clicking on a status badge
    if (await statusBadges.count() > 0) {
      await statusBadges.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${DIR}/04-permits-after-status-click.png` });
      console.log('Clicked on status badge');
    }
  }

  // Check for any clickable elements
  const permitCards = permSection.locator('[class*="cursor"], [class*="click"], a, button');
  console.log('Clickable elements in permits:', await permitCards.count());
  
  // List all buttons
  const allPermitBtns = permSection.locator('button');
  for (let i = 0; i < await allPermitBtns.count(); i++) {
    const txt = await allPermitBtns.nth(i).textContent();
    console.log(`  Button ${i}: "${txt?.trim()}"`);
  }

  // ===== 4. SAFETY CHECKLIST =====
  console.log('\n━━━ 4. ЧЕК-ЛИСТ ТБ ━━━');
  const safetySection = page.locator('#section-safety');
  await safetySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Don't clear localStorage - we want to see what the USER sees
  const safetyText = await safetySection.textContent() || '';
  console.log('Safety text:', safetyText.slice(0, 800));
  await safetySection.screenshot({ path: `${DIR}/05-safety-initial.png` });

  // Check the counter
  const counterMatch = safetyText.match(/(\d+)\/(\d+)/);
  if (counterMatch) {
    console.log(`Counter: ${counterMatch[0]}`);
  }

  // Check what's in localStorage
  const lsData = await page.evaluate(() => {
    const raw = localStorage.getItem('privod-safety-checklist');
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      // Get project data
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const items = data[keys[0]];
        return {
          projectId: keys[0],
          count: items.length,
          categories: [...new Set(items.map(i => i.category))],
          completed: items.filter(i => i.completed).length,
          items: items.map(i => ({ id: i.id, category: i.category, description: i.description?.slice(0, 40), completed: i.completed }))
        };
      }
    } catch { }
    return null;
  });
  console.log('localStorage safety data:', JSON.stringify(lsData, null, 2));

  // Check for "add" button
  const addItemBtns = safetySection.locator('button');
  for (let i = 0; i < await addItemBtns.count(); i++) {
    const txt = await addItemBtns.nth(i).textContent();
    console.log(`  Safety button ${i}: "${txt?.trim()}"`);
  }

  // Check if there's an "add item" capability
  const addSafetyBtn = safetySection.locator('button').filter({ hasText: /добавить|новый|add/i });
  console.log('Add safety item button exists:', await addSafetyBtn.count() > 0);

  // Take full page screenshot
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/06-safety-bottom.png` });

  // ===== 5. Check all categories rendered =====
  console.log('\n━━━ 5. КАТЕГОРИИ ТБ ━━━');
  const cats = ['СИЗ', 'ОХРАНА ПЛОЩАДКИ', 'АВАРИЙНЫЕ ПЛАНЫ', 'ОБУЧЕНИЕ', 'ОЦЕНКА ОПАСНЫХ ФАКТОРОВ', 'ПОЖАРНАЯ ЗАЩИТА'];
  for (const cat of cats) {
    console.log(`  ${safetyText.toUpperCase().includes(cat) ? '✅' : '❌'} ${cat}`);
  }

  // Count checkboxes
  const checkboxes = await safetySection.locator('input[type="checkbox"]').count();
  console.log(`Checkboxes in safety: ${checkboxes}`);

  await browser.close();
  console.log(`\n📁 Screenshots: ${DIR}/`);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
