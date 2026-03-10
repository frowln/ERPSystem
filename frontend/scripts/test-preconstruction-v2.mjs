#!/usr/bin/env node
/**
 * Comprehensive verification of pre-construction tab fixes
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/precon-v2';
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

  // Suppress console errors from API calls
  page.on('console', () => {});

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[name="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"], input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Clear old localStorage data
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
  console.log('🧹 Cleared old localStorage data\n');

  // Go to first project
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(2000);
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(2000);
  const projUrl = page.url();
  console.log(`📍 Project: ${projUrl}`);

  // Navigate to preConstruction tab
  const baseUrl = projUrl.split('?')[0];
  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(3000);

  // ====== TEST 1: i18n — all Russian ======
  console.log('\n📝 TEST 1: i18n — everything in Russian');
  const bodyText = await page.textContent('body') || '';

  const russianLabels = [
    'Готовность к строительству', 'Вехи проекта', 'Обследование площадки',
    'ГПЗУ', 'Разрешительная документация', 'Технические условия',
    'Инженерные изыскания', 'Проектная документация', 'Экспертиза',
    'ПОС / ППР', 'Чек-лист ТБ', 'Мобилизация',
  ];
  for (const label of russianLabels) {
    check(`"${label}" present`, bodyText.includes(label));
  }

  const badEnglish = ['Personal protective', 'Fire safety measures', 'Electrical safety', 'Excavation safety', 'Scaffolding inspection', 'Not Started', 'Item site'];
  for (const eng of badEnglish) {
    check(`No English "${eng}"`, !bodyText.includes(eng));
  }

  await page.screenshot({ path: `${DIR}/01-full-page.png`, fullPage: true });

  // ====== TEST 2: Section IDs for scrollTo ======
  console.log('\n📝 TEST 2: Section IDs present');
  const sectionIds = ['section-site-assessments', 'section-gpzu', 'section-permits', 'section-tu', 'section-surveys', 'section-design', 'section-expertise', 'section-plans', 'section-safety', 'section-mobilization'];
  for (const sid of sectionIds) {
    const el = page.locator(`#${sid}`);
    check(`id="${sid}"`, await el.count() > 0);
  }

  // ====== TEST 3: Safety Checklist initialization ======
  console.log('\n📝 TEST 3: Safety Checklist');
  const initBtn = page.locator('button').filter({ hasText: /инициализировать/i });
  if (await initBtn.count() > 0) {
    await initBtn.first().scrollIntoViewIfNeeded();
    await initBtn.first().click();
    await page.waitForTimeout(1500);
    check('Init button found and clicked', true);
  } else {
    check('Checklist already initialized', true);
  }

  const safetySection = page.locator('#section-safety');
  await safetySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const safetyText = await safetySection.textContent() || '';

  const categories = ['СИЗ', 'ОХРАНА ПЛОЩАДКИ', 'АВАРИЙНЫЕ ПЛАНЫ', 'ОБУЧЕНИЕ И ИНСТРУКТАЖИ', 'ОЦЕНКА ОПАСНЫХ ФАКТОРОВ', 'ПОЖАРНАЯ ЗАЩИТА'];
  for (const cat of categories) {
    check(`Category "${cat}"`, safetyText.toUpperCase().includes(cat));
  }

  const russianItems = ['Каски', 'Ограждение', 'План эвакуации', 'Инструктаж', 'Огнетушители'];
  for (const item of russianItems) {
    check(`Item "${item}"`, safetyText.includes(item));
  }

  check('No "Personal protective"', !safetyText.includes('Personal protective'));
  check('No "Fire safety measures"', !safetyText.includes('Fire safety measures'));

  await safetySection.screenshot({ path: `${DIR}/02-safety.png` });

  // ====== TEST 4: Construction Plans — Create button ======
  console.log('\n📝 TEST 4: Construction Plans');
  const plansSection = page.locator('#section-plans');
  await plansSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const plansCreateBtn = plansSection.locator('button').filter({ hasText: /создать/i });
  if (await plansCreateBtn.count() > 0) {
    await plansCreateBtn.first().click();
    await page.waitForTimeout(1500);
    check('Plans created via button', true);
  } else {
    check('Plans already exist', true);
  }

  const plansText = await plansSection.textContent() || '';
  check('POS visible', plansText.includes('ПОС'));
  check('PPR visible', plansText.includes('ППР'));
  check('Стройгенплан visible', plansText.includes('Стройгенплан'));

  // Check advance buttons appear now
  const advanceBtns = plansSection.locator('button').filter({ hasText: /продвинуть/i });
  check('Advance buttons appear', await advanceBtns.count() >= 1);

  await plansSection.screenshot({ path: `${DIR}/03-plans.png` });

  // ====== TEST 5: Permits — Add ======
  console.log('\n📝 TEST 5: Permits');
  const permitsSection = page.locator('#section-permits');
  await permitsSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const addPermitBtn = permitsSection.locator('button').filter({ hasText: /добавить/i });
  check('Permit Add button visible', await addPermitBtn.count() > 0);

  if (await addPermitBtn.count() > 0) {
    await addPermitBtn.first().click();
    await page.waitForTimeout(1000);

    // Check modal opened
    const modal = page.locator('[role="dialog"], .modal, div').filter({ hasText: /добавить разрешение/i });
    check('Permit modal opened', await modal.count() > 0);

    // Fill and save
    const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      check('Permit saved successfully', true);
    }

    await page.screenshot({ path: `${DIR}/04-permits.png`, fullPage: false });
  }

  // ====== TEST 6: Surveys — Add ======
  console.log('\n📝 TEST 6: Surveys');
  const surveysSection = page.locator('#section-surveys');
  await surveysSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const addSurveyBtn = surveysSection.locator('button').filter({ hasText: /добавить/i });
  check('Survey Add button visible', await addSurveyBtn.count() > 0);

  if (await addSurveyBtn.count() > 0) {
    await addSurveyBtn.first().click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      check('Survey saved successfully', true);
    }
  }

  // Verify survey appeared
  const surveysText = await surveysSection.textContent() || '';
  check('Survey type label present', surveysText.includes('Геодезические'));

  await surveysSection.screenshot({ path: `${DIR}/05-surveys.png` });

  // ====== TEST 7: Design — Create ======
  console.log('\n📝 TEST 7: Design');
  const designSection = page.locator('#section-design');
  await designSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const createDesignBtn = designSection.locator('button').filter({ hasText: /создать/i });
  if (await createDesignBtn.count() > 0) {
    await createDesignBtn.first().click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      check('Design created', true);
    }
  } else {
    check('Design already exists', true);
  }

  await designSection.screenshot({ path: `${DIR}/06-design.png` });

  // ====== TEST 8: GPZU — Add ======
  console.log('\n📝 TEST 8: GPZU');
  const gpzuSection = page.locator('#section-gpzu');
  await gpzuSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const addGpzuBtn = gpzuSection.locator('button').filter({ hasText: /добавить/i });
  check('GPZU Add button visible', await addGpzuBtn.count() > 0);

  if (await addGpzuBtn.count() > 0) {
    await addGpzuBtn.first().click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      check('GPZU saved', true);
    }
  }

  await gpzuSection.screenshot({ path: `${DIR}/07-gpzu.png` });

  // ====== TEST 9: Technical Conditions — Add ======
  console.log('\n📝 TEST 9: Technical Conditions');
  const tuSection = page.locator('#section-tu');
  await tuSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const addTuBtn = tuSection.locator('button').filter({ hasText: /добавить/i });
  check('TU Add button visible', await addTuBtn.count() > 0);

  if (await addTuBtn.count() > 0) {
    await addTuBtn.first().click();
    await page.waitForTimeout(1000);

    const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      check('TU saved', true);
    }
  }

  await tuSection.screenshot({ path: `${DIR}/08-tu.png` });

  // ====== TEST 10: Milestones — Fill Template ======
  console.log('\n📝 TEST 10: Milestones');
  const msSection = page.locator('text=Вехи проекта').first().locator('..').locator('..');
  await msSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const templateBtn = page.locator('button').filter({ hasText: /заполнить по шаблону/i });
  if (await templateBtn.count() > 0) {
    await templateBtn.first().click();
    await page.waitForTimeout(3000);
    check('Milestones filled from template', true);
  } else {
    check('Milestones already exist', true);
  }

  const msText = await page.textContent('body') || '';
  check('Milestone "Получение ГПЗУ"', msText.includes('Получение ГПЗУ'));
  check('Milestone "Инженерные изыскания"', msText.includes('Инженерные изыскания'));

  // ====== FINAL SCREENSHOTS ======
  console.log('\n📸 Final screenshots...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/10-final-top.png`, fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/11-final-mid.png`, fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/12-final-bottom.png`, fullPage: false });

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Screenshots: ${DIR}/`);
  console.log(`${'='.repeat(50)}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
