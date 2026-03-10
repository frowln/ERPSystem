#!/usr/bin/env node
/**
 * Comprehensive Playwright test for Pre-Construction tab
 * Takes screenshots and tests all panels
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4000';
const SCREENSHOTS_DIR = '/tmp/preconstruction-screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();

  // Login
  console.log('🔑 Logging in...');
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[name="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"], input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Navigate to first project
  console.log('📋 Finding a project...');
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-projects-list.png`, fullPage: false });

  // Click first project
  const firstProjectLink = await page.locator('table tbody tr a, table tbody tr').first();
  if (firstProjectLink) {
    await firstProjectLink.click();
    await page.waitForTimeout(2000);
  }

  const projectUrl = page.url();
  console.log(`📍 Project URL: ${projectUrl}`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-project-overview.png`, fullPage: true });

  // Go to Pre-Construction tab
  console.log('🏗️ Opening Pre-Construction tab...');
  const preconTab = page.locator('button, a').filter({ hasText: /предстроительный/i }).first();
  if (await preconTab.count() > 0) {
    await preconTab.click();
    await page.waitForTimeout(2000);
  } else {
    // Try URL param
    const baseUrl = projectUrl.split('?')[0];
    await page.goto(`${baseUrl}?tab=preConstruction`);
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-preconstruction-full.png`, fullPage: true });

  // Check for English text on the page
  const pageText = await page.textContent('body');
  const englishPatterns = [
    'Personal protective', 'Fire safety measures', 'Electrical safety',
    'Excavation safety', 'Scaffolding', 'Not Started', 'Item site',
    'Item permits', 'Status not started', 'Title', 'Empty', 'Add btn',
    'Create btn', 'Panel create', 'Progress',
  ];
  const foundEnglish = englishPatterns.filter(p => pageText?.includes(p));
  if (foundEnglish.length > 0) {
    console.log('⚠️ ENGLISH TEXT FOUND:', foundEnglish);
  } else {
    console.log('✅ No English patterns found on page');
  }

  // Scroll through all panels and take screenshots
  console.log('📸 Taking panel screenshots...');

  // Screenshot sections
  const sections = [
    { id: 'section-site-assessments', name: 'site-assessment' },
    { id: 'section-permits', name: 'permits' },
    { id: 'section-surveys', name: 'surveys' },
    { id: 'section-plans', name: 'construction-plans' },
    { id: 'section-safety', name: 'safety-checklist' },
    { id: 'section-gpzu', name: 'gpzu' },
    { id: 'section-tu', name: 'technical-conditions' },
    { id: 'section-design', name: 'design' },
    { id: 'section-expertise', name: 'expertise' },
    { id: 'section-mobilization', name: 'mobilization' },
  ];

  for (const sec of sections) {
    const el = page.locator(`#${sec.id}`);
    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await el.screenshot({ path: `${SCREENSHOTS_DIR}/panel-${sec.name}.png` });
      console.log(`  📸 ${sec.name} — captured`);
    } else {
      console.log(`  ⚠️ ${sec.name} — section ID not found`);
    }
  }

  // Test 1: Initialize Safety Checklist
  console.log('\n🧪 TEST: Initialize Safety Checklist...');
  const safetyInit = page.locator('button').filter({ hasText: /инициализировать/i }).first();
  if (await safetyInit.count() > 0) {
    await safetyInit.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-safety-initialized.png`, fullPage: true });

    // Check content after init
    const safetyPanel = page.locator('text=Чек-лист ТБ').locator('..').locator('..');
    const safetyText = await safetyPanel.textContent().catch(() => '');
    console.log(`  Safety panel text: ${safetyText?.slice(0, 200)}`);

    // Check categories
    const categories = ['СИЗ', 'Охрана площадки', 'Аварийные планы', 'Обучение', 'Оценка опасных факторов', 'Пожарная защита'];
    for (const cat of categories) {
      const found = safetyText?.includes(cat);
      console.log(`  ${found ? '✅' : '❌'} Category "${cat}" ${found ? 'found' : 'MISSING'}`);
    }
  } else {
    console.log('  ⏭️ Safety checklist already initialized or button not found');
    // Check if checklist items exist
    const checkItems = await page.locator('text=Чек-лист ТБ').locator('..').locator('..').textContent().catch(() => '');
    console.log(`  Current content: ${checkItems?.slice(0, 200)}`);
  }

  // Test 2: Initialize Construction Plans
  console.log('\n🧪 TEST: Initialize Construction Plans...');
  const plansCreate = page.locator('button').filter({ hasText: /создать/i }).first();
  // Scroll to plans section first
  const plansSection = page.locator('text=ПОС / ППР').first();
  if (await plansSection.count() > 0) {
    await plansSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Look for create button near the plans section
    const planPanel = plansSection.locator('..').locator('..');
    const createBtn = planPanel.locator('button').filter({ hasText: /создать/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      console.log('  ✅ Construction plans initialized');
    } else {
      // Check if advance buttons exist (plans already created)
      const advanceBtn = planPanel.locator('button').filter({ hasText: /продвинуть/i }).first();
      if (await advanceBtn.count() > 0) {
        console.log('  ⏭️ Plans already created - advance buttons visible');
      } else {
        console.log('  ⚠️ No create or advance buttons found');
      }
    }
  }

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-plans-after-init.png`, fullPage: true });

  // Test 3: Add a permit
  console.log('\n🧪 TEST: Add Permit...');
  const permitsSection = page.locator('text=Разрешительная документация').first();
  if (await permitsSection.count() > 0) {
    await permitsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const permitPanel = permitsSection.locator('..').locator('..');
    const addPermitBtn = permitPanel.locator('button').filter({ hasText: /добавить/i }).first();
    if (await addPermitBtn.count() > 0) {
      await addPermitBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-permit-modal.png` });

      // Fill form
      const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        console.log('  ✅ Permit saved');
      }
    } else {
      console.log('  ⚠️ Add permit button not found');
    }
  }
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-after-permit.png`, fullPage: true });

  // Test 4: Add a survey
  console.log('\n🧪 TEST: Add Survey...');
  const surveysSection = page.locator('text=Инженерные изыскания').first();
  if (await surveysSection.count() > 0) {
    await surveysSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const surveyPanel = surveysSection.locator('..').locator('..');
    const addSurveyBtn = surveyPanel.locator('button').filter({ hasText: /добавить/i }).first();
    if (await addSurveyBtn.count() > 0) {
      await addSurveyBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-survey-modal.png` });

      // Save
      const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        console.log('  ✅ Survey saved');
      }
    }
  }

  // Test 5: Create Design
  console.log('\n🧪 TEST: Create Design...');
  const designSection = page.locator('text=Проектная документация').first();
  if (await designSection.count() > 0) {
    await designSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Look for create button
    const designCreateBtn = page.locator('button').filter({ hasText: /создать проект/i }).first();
    if (await designCreateBtn.count() > 0) {
      await designCreateBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-design-modal.png` });

      const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        console.log('  ✅ Design created');
      }
    } else {
      console.log('  ⏭️ Design already exists or create button not found');
    }
  }

  // Test 6: Add milestone
  console.log('\n🧪 TEST: Add Milestone...');
  const milestonesSection = page.locator('text=Вехи проекта').first();
  if (await milestonesSection.count() > 0) {
    await milestonesSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Try "Заполнить по шаблону" button
    const templateBtn = page.locator('button').filter({ hasText: /заполнить по шаблону/i }).first();
    if (await templateBtn.count() > 0) {
      await templateBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Milestones filled from template');
    } else {
      const addBtn = page.locator('button').filter({ hasText: /добавить веху/i }).first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(500);
        console.log('  ⏭️ Milestones exist, add form toggled');
      }
    }
  }

  // Final full-page screenshot
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-final-top.png`, fullPage: false });

  // Scroll to middle
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/11-final-mid.png`, fullPage: false });

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/12-final-bottom.png`, fullPage: false });

  // Final check: count Russian vs English text
  const finalText = await page.textContent('body') || '';
  const russianWords = finalText.match(/[а-яё]+/gi) || [];
  const englishWords = finalText.match(/\b[a-zA-Z]{4,}\b/g) || [];

  // Filter out common tech terms
  const techTerms = new Set(['dark', 'hover', 'text', 'null', 'undefined', 'true', 'false', 'button', 'input', 'type', 'GPZU', 'PENDING', 'PLANNED']);
  const realEnglish = englishWords.filter(w => !techTerms.has(w) && !techTerms.has(w.toUpperCase()));

  console.log(`\n📊 Language stats:`);
  console.log(`  Russian words: ${russianWords.length}`);
  console.log(`  English words (non-tech): ${realEnglish.length}`);
  if (realEnglish.length > 0) {
    console.log(`  Sample English: ${[...new Set(realEnglish)].slice(0, 20).join(', ')}`);
  }

  await browser.close();
  console.log(`\n📁 Screenshots saved to: ${SCREENSHOTS_DIR}/`);
}

import { mkdirSync } from 'fs';
mkdirSync(SCREENSHOTS_DIR, { recursive: true });
run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
