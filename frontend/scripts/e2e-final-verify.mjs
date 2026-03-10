import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-verify-final';
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

  // 1. Click "Аналитика предстроя"
  const analyticsBtn = page.locator('button:has-text("Аналитика предстро")').first();
  if (await analyticsBtn.count() > 0) {
    await analyticsBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(DIR, '01-analytics-top.png') });
    console.log('1. Analytics top');
    
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '02-analytics-mid.png') });
    console.log('2. Analytics mid');
    
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '03-analytics-bottom.png') });
    console.log('3. Analytics bottom (readiness table)');
  }

  // 2. Go back and click "Стартовое совещание"
  await page.goBack();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Предстроительный")').first().click();
  await page.waitForTimeout(1500);
  
  const meetingBtn = page.locator('button:has-text("Стартовое совещание")').first();
  if (await meetingBtn.count() > 0) {
    await meetingBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '04-meeting-page.png'), fullPage: true });
    console.log('4. Meeting page');
    
    // Test adding an attendee
    const attendeeInput = page.locator('input[placeholder="Добавить участника"]');
    if (await attendeeInput.count() > 0) {
      await attendeeInput.fill('Иванов А.С.');
      await attendeeInput.press('Enter');
      await page.waitForTimeout(800);
      
      await attendeeInput.fill('Петрова Е.В.');
      await attendeeInput.press('Enter');
      await page.waitForTimeout(800);
    }
    
    // Add agenda item
    const agendaInput = page.locator('input[placeholder="Добавить пункт"]');
    if (await agendaInput.count() > 0) {
      await agendaInput.fill('Обзор проектной документации');
      await agendaInput.press('Enter');
      await page.waitForTimeout(800);
      
      await agendaInput.fill('Утверждение графика работ');
      await agendaInput.press('Enter');
      await page.waitForTimeout(800);
    }
    
    // Add decision
    const decisionInput = page.locator('input[placeholder="Добавить решение"]');
    if (await decisionInput.count() > 0) {
      await decisionInput.fill('Начать мобилизацию до 15.04.2026');
      await decisionInput.press('Enter');
      await page.waitForTimeout(800);
    }
    
    // Add action item
    const actionDescInput = page.locator('input[placeholder="Описание задачи"]');
    if (await actionDescInput.count() > 0) {
      await actionDescInput.fill('Подготовить график мобилизации');
      const ownerInput = page.locator('input[placeholder="Ответственный"]');
      if (await ownerInput.count() > 0) await ownerInput.fill('Иванов А.С.');
      await page.waitForTimeout(300);
    }

    // Fill location
    const locationInput = page.locator('input[placeholder="Место не указано"]');
    if (await locationInput.count() > 0) {
      await locationInput.fill('Офис, ул. Ленина 42, каб. 301');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(DIR, '05-meeting-filled.png'), fullPage: true });
    console.log('5. Meeting with data filled');
    
    // Scroll down for minutes
    await page.evaluate(() => window.scrollTo(0, 99999));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '06-meeting-bottom.png') });
    console.log('6. Meeting bottom (minutes)');
  }

  await browser.close();
  console.log('\nDone! Screenshots:', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
