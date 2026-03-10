import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-precon2';
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
  await page.locator('button:has-text("Предстроительный")').first().click();
  await page.waitForTimeout(2000);

  // === 1. Click "Стартовое совещание" ===
  const meetingBtn = page.locator('button:has-text("Стартовое совещание")').first();
  await meetingBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '01-meeting-empty.png'), fullPage: true });
  console.log('1. Meeting empty state');

  // Click "Создать совещание"
  const createMeeting = page.locator('button:has-text("Создать совещание")').first();
  if (await createMeeting.count() > 0) {
    await createMeeting.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '02-meeting-after-create.png'), fullPage: true });
    console.log('2. Meeting after create click');
    console.log('  URL:', page.url());
    
    // Check for error toast or modal
    const toast = page.locator('[role="status"], .Toastify, [class*="toast"]');
    if (await toast.count() > 0) {
      console.log('  Toast visible:', await toast.first().textContent());
    }
  }

  // Navigate back to pre-construction
  await page.goBack();
  await page.waitForTimeout(1000);
  
  // Go back to pre-construction tab
  await page.locator('button:has-text("Предстроительный")').first().click();
  await page.waitForTimeout(1500);

  // === 2. Click "Аналитика предстроя" ===
  const analyticsBtn = page.locator('button:has-text("Аналитика предстро")').first();
  if (await analyticsBtn.count() > 0) {
    await analyticsBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '03-analytics.png'), fullPage: true });
    console.log('3. Analytics page');
    console.log('  URL:', page.url());
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '04-analytics-scrolled.png') });
    console.log('4. Analytics scrolled');
  } else {
    console.log('WARN: Analytics button not found');
  }

  // === 3. Click "Реестр рисков" ===
  const risksBtn = page.locator('button:has-text("Реестр рисков")').first();
  if (await risksBtn.count() > 0) {
    await risksBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '05-risks.png'), fullPage: true });
    console.log('5. Risks page');
  }

  // === 4. Go back to main pre-construction view and test interactions ===
  // Go back to overview
  await page.locator('button:has-text("Предстроительный")').first().click();
  await page.waitForTimeout(1500);
  
  // Check "Готовность к строительству" readiness summary
  await page.screenshot({ path: path.join(DIR, '06-readiness.png') });
  console.log('6. Readiness overview');
  
  // Scroll down through all panels
  const sections = [
    'Обследование площад',
    'ГПЗУ',
    'Разрешительная документа',
    'Технические условия',
    'Инженерные изыскания',
    'Проектная документация',
    'Экспертиза',
    'ПОС / ППР',
    'Планы строительства',
    'Чек-лист ТБ',
    'Мобилизация',
    'Финансовая модель',
    'Преквалификация'
  ];
  
  for (const section of sections) {
    const el = page.locator(`text=${section}`).first();
    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const slug = section.replace(/[^a-zA-Zа-яА-Я]/g, '_').substring(0, 20);
      await page.screenshot({ path: path.join(DIR, `07-${slug}.png`) });
      console.log(`  Section "${section}" found`);
    } else {
      console.log(`  MISSING: "${section}"`);
    }
  }

  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
