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

  // Go to first project  
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    
    // List all tab buttons visible
    const allButtons = page.locator('button');
    const count = await allButtons.count();
    console.log(`Total buttons on project detail: ${count}`);
    for (let i = 0; i < Math.min(count, 40); i++) {
      const txt = await allButtons.nth(i).textContent();
      if (txt && txt.trim()) console.log(`  btn[${i}]: "${txt.trim()}"`);
    }
    
    // Try to find "Предстроительная подготовка" or similar tab
    const tabs = page.locator('[role="tab"], [data-tab], button');
    for (const text of ['Предстроительная', 'предстроит', 'Подготовка', 'pre-construction', 'preConstruction']) {
      const found = page.locator(`button:has-text("${text}")`);
      const n = await found.count();
      if (n > 0) {
        console.log(`Found tab with text "${text}": ${n} matches`);
        await found.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(DIR, '01-preconstruction-tab.png'), fullPage: true });
        console.log('1. Pre-construction tab opened');
        break;
      }
    }

    // Check current URL
    console.log('Current URL:', page.url());
    await page.screenshot({ path: path.join(DIR, '01b-current-page.png'), fullPage: true });
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
