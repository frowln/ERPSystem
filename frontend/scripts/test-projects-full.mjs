#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/projects-audit';
mkdirSync(DIR, { recursive: true });

let passed = 0, failed = 0;
function check(name, ok) {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}`); }
}

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

  // ====== TEST 1: Project List ======
  console.log('\n📝 TEST 1: Project List Page');
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/01-project-list.png`, fullPage: false });

  const listBody = await page.textContent('body') || '';
  check('Title "Объекты"', listBody.includes('Объекты'));
  check('Tab "Все"', listBody.includes('Все'));
  check('Tab "В работе"', listBody.includes('В работе'));
  check('Tab "Планирование"', listBody.includes('Планирование'));
  check('Tab "Завершённые"', listBody.includes('Завершённые'));
  check('KPI cards visible', listBody.includes('Всего объектов'));
  check('Button "Создать объект"', listBody.includes('Создать объект'));

  // Check NO checkboxes visible (we removed enableRowSelection)
  const checkboxes = await page.locator('table input[type="checkbox"]').count();
  check('No row selection checkboxes', checkboxes === 0);

  // ====== TEST 2: Click into project ======
  console.log('\n📝 TEST 2: Project Detail — Overview');
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(2000);
  const projUrl = page.url();
  await page.screenshot({ path: `${DIR}/02-project-overview.png`, fullPage: true });

  const overviewBody = await page.textContent('body') || '';
  check('Tabs visible', overviewBody.includes('Обзор'));
  check('Team tab', overviewBody.includes('Команда'));
  check('Documents tab', overviewBody.includes('Документы'));
  check('Finance tab', overviewBody.includes('Финансы'));
  check('Mail tab', overviewBody.includes('Почта'));
  check('PreConstruction tab', overviewBody.includes('Предстроительный этап'));
  
  // Check financial cards
  check('Сумма договора', overviewBody.includes('Сумма договора'));
  check('Маржа', overviewBody.includes('Маржа'));
  
  // Check related sections (links to specs, contracts, estimates, etc.)
  check('Related: Сметы', overviewBody.includes('Сметы'));
  check('Related: Спецификации', overviewBody.includes('Спецификации'));
  check('Related: Договоры', overviewBody.includes('Договоры'));

  // ====== TEST 3: Team Tab ======
  console.log('\n📝 TEST 3: Team Tab');
  const baseUrl = projUrl.split('?')[0];
  await page.goto(`${baseUrl}?tab=team`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/03-team.png`, fullPage: false });
  
  const teamBody = await page.textContent('body') || '';
  check('Team header', teamBody.includes('Команда'));

  // ====== TEST 4: Documents Tab ======
  console.log('\n📝 TEST 4: Documents Tab');
  await page.goto(`${baseUrl}?tab=documents`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/04-documents.png`, fullPage: false });
  
  const docsBody = await page.textContent('body') || '';
  check('Documents header', docsBody.includes('Документы'));

  // ====== TEST 5: Finance Tab ======
  console.log('\n📝 TEST 5: Finance Tab');
  await page.goto(`${baseUrl}?tab=finance`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/05-finance.png`, fullPage: true });
  
  const finBody = await page.textContent('body') || '';
  check('Finance visible', finBody.includes('Финанс'));

  // ====== TEST 6: Mail Tab ======
  console.log('\n📝 TEST 6: Mail Tab');
  await page.goto(`${baseUrl}?tab=mail`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/06-mail.png`, fullPage: false });
  
  const mailBody = await page.textContent('body') || '';
  check('Mail header', mailBody.includes('Привязанные письма'));
  check('Link button', mailBody.includes('Привязать письмо'));

  // ====== TEST 7: Pre-Construction Tab ======
  console.log('\n📝 TEST 7: Pre-Construction Tab');
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.removeItem('privod-safety-checklist');
    localStorage.removeItem('privod-construction-plans');
    localStorage.removeItem('privod-engineering-surveys');
    localStorage.removeItem('privod-permits');
    localStorage.removeItem('privod-milestones');
    localStorage.removeItem('privod-gpzu');
    localStorage.removeItem('privod-technical-conditions');
    localStorage.removeItem('privod-expertise');
    localStorage.removeItem('privod-mobilization');
    localStorage.removeItem('privod-project-design');
  });
  
  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/07-precon-top.png`, fullPage: false });

  const preconBody = await page.textContent('body') || '';
  check('Готовность к строительству', preconBody.includes('Готовность к строительству'));
  check('Вехи проекта', preconBody.includes('Вехи проекта'));
  check('Обследование площадки', preconBody.includes('Обследование площадки'));
  check('ГПЗУ', preconBody.includes('ГПЗУ'));
  check('Разрешительная документация', preconBody.includes('Разрешительная документация'));
  check('Технические условия', preconBody.includes('Технические условия'));
  check('Инженерные изыскания', preconBody.includes('Инженерные изыскания'));
  check('Проектная документация', preconBody.includes('Проектная документация'));
  check('Экспертиза', preconBody.includes('Экспертиза'));
  check('ПОС / ППР', preconBody.includes('ПОС / ППР'));
  check('Чек-лист ТБ', preconBody.includes('Чек-лист ТБ'));
  check('Мобилизация', preconBody.includes('Мобилизация'));

  // Initialize safety checklist
  const safetyInit = page.locator('button').filter({ hasText: /инициализировать/i });
  if (await safetyInit.count() > 0) {
    await safetyInit.first().scrollIntoViewIfNeeded();
    await safetyInit.first().click();
    await page.waitForTimeout(1500);
  }
  
  const safetySection = page.locator('#section-safety');
  if (await safetySection.count() > 0) {
    await safetySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const safetyText = await safetySection.textContent() || '';
    check('Safety: СИЗ category', safetyText.toUpperCase().includes('СИЗ'));
    check('Safety: ОХРАНА ПЛОЩАДКИ', safetyText.toUpperCase().includes('ОХРАНА ПЛОЩАДКИ'));
    check('Safety: АВАРИЙНЫЕ ПЛАНЫ', safetyText.toUpperCase().includes('АВАРИЙНЫЕ ПЛАНЫ'));
    check('Safety: ПОЖАРНАЯ ЗАЩИТА', safetyText.toUpperCase().includes('ПОЖАРНАЯ ЗАЩИТА'));
    check('Safety: Каски', safetyText.includes('Каски'));
    check('Safety: No English', !safetyText.includes('Personal protective'));
    await safetySection.screenshot({ path: `${DIR}/08-safety.png` });
  }

  // Construction plans create
  const plansSection = page.locator('#section-plans');
  if (await plansSection.count() > 0) {
    await plansSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const createPlansBtn = plansSection.locator('button').filter({ hasText: /создать/i });
    if (await createPlansBtn.count() > 0) {
      await createPlansBtn.first().click();
      await page.waitForTimeout(1500);
    }
    const plansText = await plansSection.textContent() || '';
    check('Plans: ПОС', plansText.includes('ПОС'));
    check('Plans: ППР', plansText.includes('ППР'));
    check('Plans: Стройгенплан', plansText.includes('Стройгенплан'));
    check('Plans: Продвинуть buttons', (await plansSection.locator('button').filter({ hasText: /продвинуть/i }).count()) >= 1);
    await plansSection.screenshot({ path: `${DIR}/09-plans.png` });
  }

  // Check English on the entire page
  const badEnglish = ['Personal protective', 'Fire safety measures', 'Not Started', 'Item site', 'finance.longLead'];
  const finalBody = await page.textContent('body') || '';
  for (const eng of badEnglish) {
    check(`No "${eng}" on page`, !finalBody.includes(eng));
  }

  // Final screenshots
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/10-precon-mid.png`, fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/11-precon-bottom.png`, fullPage: false });

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Screenshots: ${DIR}/`);
  console.log(`${'='.repeat(50)}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
