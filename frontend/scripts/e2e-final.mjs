import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-final-screenshots';
fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', 'admin@privod.ru');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);

  // 1. Site Assessment list page — check i18n
  await page.goto(`${BASE}/site-assessments`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '01-sa-list.png'), fullPage: true });
  console.log('1. SA list page');

  // 2. Click first row → detail page
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '02-sa-detail-top.png') });
    console.log('2. SA detail top');
    
    // Scroll down to see scoring criteria
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '03-sa-detail-criteria.png') });
    console.log('3. SA detail criteria');
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '04-sa-detail-bottom.png') });
    console.log('4. SA detail bottom');
  }

  // 3. Go to project → pre-construction → safety checklist and permits
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("предстроит")').first().click();
  await page.waitForTimeout(2000);

  // Scroll to safety checklist
  await page.evaluate(() => window.scrollTo(0, 99999));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '05-safety-checklist.png') });
  console.log('5. Safety checklist');
  
  // Scroll to permits
  const permitsTitle = page.locator('h3:has-text("Разрешительная документация")').first();
  if (await permitsTitle.count() > 0) {
    await permitsTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '06-permits-with-pencils.png') });
    console.log('6. Permits with pencil icons');
  }

  await browser.close();
  console.log('\nAll screenshots in:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
