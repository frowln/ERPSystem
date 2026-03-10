import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-meeting';
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

  // Go directly to meeting page for first project
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(1500);
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("Предстроительный")').first().click();
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Стартовое совещание")').first().click();
  await page.waitForTimeout(2000);

  // Create meeting if empty
  const createBtn = page.locator('button:has-text("Создать совещание")');
  if (await createBtn.count() > 0) {
    await createBtn.click();
    await page.waitForTimeout(1500);
  }
  
  await page.screenshot({ path: path.join(DIR, '01-meeting-created.png'), fullPage: true });
  console.log('1. Meeting created');

  // Edit location
  const locationInput = page.locator('input[placeholder="Место не указано"]');
  if (await locationInput.count() > 0) {
    await locationInput.fill('Офис, ул. Ленина 42, каб. 301');
    await page.waitForTimeout(500);
  }
  
  // Add attendees
  const attendeeInput = page.locator('input[placeholder="Добавить участника"]');
  if (await attendeeInput.count() > 0) {
    await attendeeInput.fill('Иванов А.С. — Генеральный директор');
    await attendeeInput.press('Enter');
    await page.waitForTimeout(500);
    await attendeeInput.fill('Петрова Е.В. — Главный инженер');
    await attendeeInput.press('Enter');
    await page.waitForTimeout(500);
    await attendeeInput.fill('Сидоров К.П. — Прораб');
    await attendeeInput.press('Enter');
    await page.waitForTimeout(500);
  }
  
  // Add agenda
  const agendaInput = page.locator('input[placeholder="Добавить пункт"]');
  if (await agendaInput.count() > 0) {
    await agendaInput.fill('Обзор проектной документации');
    await agendaInput.press('Enter');
    await page.waitForTimeout(500);
    await agendaInput.fill('Утверждение графика работ');
    await agendaInput.press('Enter');
    await page.waitForTimeout(500);
    await agendaInput.fill('Распределение ответственных');
    await agendaInput.press('Enter');
    await page.waitForTimeout(500);
  }

  // Add decisions
  const decisionInput = page.locator('input[placeholder="Добавить решение"]');
  if (await decisionInput.count() > 0) {
    await decisionInput.fill('Начать мобилизацию до 15.04.2026');
    await decisionInput.press('Enter');
    await page.waitForTimeout(500);
    await decisionInput.fill('Заказать материалы по спецификации');
    await decisionInput.press('Enter');
    await page.waitForTimeout(500);
  }
  
  // Add action item
  const actionDesc = page.locator('input[placeholder="Описание задачи"]');
  const actionOwner = page.locator('input[placeholder="Ответственный"]');
  if (await actionDesc.count() > 0) {
    await actionDesc.fill('Подготовить график мобилизации');
    if (await actionOwner.count() > 0) await actionOwner.fill('Иванов А.С.');
    // Click + button next to action
    const actionPlus = page.locator('.space-y-2 button:has(svg.lucide-plus)').last();
    if (await actionPlus.count() > 0) {
      await actionPlus.click();
      await page.waitForTimeout(500);
    }
  }

  // Fill minutes
  const minutesArea = page.locator('textarea');
  if (await minutesArea.count() > 0) {
    await minutesArea.fill('Совещание проведено 10.03.2026. Присутствовали все ключевые участники. Обсуждены основные вопросы по проекту. Решения приняты единогласно.');
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(DIR, '02-meeting-full.png'), fullPage: true });
  console.log('2. Meeting fully filled');
  
  // Toggle a decision checkbox
  const decisionCheckbox = page.locator('button:has-text("Начать мобилизацию")');
  if (await decisionCheckbox.count() > 0) {
    await decisionCheckbox.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(DIR, '03-meeting-toggled.png'), fullPage: true });
  console.log('3. Meeting with toggled decision');

  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
