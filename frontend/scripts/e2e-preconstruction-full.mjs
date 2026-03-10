import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-precon';
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

  // Go to first project → pre-construction
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2000);

  // Click pre-construction tab
  await page.locator('button:has-text("предстроит")').first().click();
  await page.waitForTimeout(2500);

  // Full page screenshot
  await page.screenshot({ path: path.join(DIR, '01-preconstruction-full.png'), fullPage: true });
  console.log('01. Full pre-construction page');

  // Screenshot viewport sections by scrolling
  for (let i = 0; i < 10; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * 800);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, `02-scroll-${i}.png`) });
    console.log(`02-scroll-${i}`);
  }

  // Now find and click "Стартовое совещание" tab/section
  const startMeetingTab = page.locator('button:has-text("Стартовое совещание")').first();
  if (await startMeetingTab.count() > 0) {
    await startMeetingTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '10-start-meeting.png'), fullPage: true });
    console.log('10. Start meeting tab');
  } else {
    console.log('WARN: "Стартовое совещание" button not found');
    // Look for it differently
    const allBtns = page.locator('button, a');
    const count = await allBtns.count();
    for (let i = 0; i < count; i++) {
      const txt = await allBtns.nth(i).textContent();
      if (txt && (txt.includes('совещ') || txt.includes('meeting') || txt.includes('Совещ'))) {
        console.log(`  Found: "${txt.trim()}" at index ${i}`);
      }
    }
  }

  // Find "Аналитика предстроя" or analytics section
  const analyticsTab = page.locator('button:has-text("Аналитика"), button:has-text("аналитик")').first();
  if (await analyticsTab.count() > 0) {
    await analyticsTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '20-analytics.png'), fullPage: true });
    console.log('20. Analytics tab');
  } else {
    console.log('WARN: Analytics tab not found');
    // Check URL and look for subtabs
    const subtabs = page.locator('button').filter({ hasText: /аналитик|предстро|анализ/i });
    const sc = await subtabs.count();
    console.log(`  Found ${sc} analytics-related buttons`);
  }

  // Check what tabs exist in pre-construction
  console.log('\n=== SUB-TABS IN PRE-CONSTRUCTION ===');
  // The pre-construction tab likely has sub-tabs at the top
  const url = page.url();
  console.log('URL:', url);
  
  // Try navigating directly to specific sub-sections
  const projectId = url.match(/projects\/([^?]+)/)?.[1];
  if (projectId) {
    // Try start meeting page
    await page.goto(`${BASE}/projects/${projectId}/pre-construction-meeting`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '11-meeting-direct.png'), fullPage: true });
    console.log('11. Pre-construction meeting (direct URL)');
    console.log('  URL:', page.url());
    
    // Check the content
    const h1 = page.locator('h1, h2').first();
    if (await h1.count() > 0) {
      console.log('  Heading:', await h1.textContent());
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots in:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
