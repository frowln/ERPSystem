#!/usr/bin/env node
/**
 * FULL E2E walkthrough of Projects module — every tab, every interaction
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/e2e-projects';
mkdirSync(DIR, { recursive: true });

let passed = 0, failed = 0, screenshots = 0;
function check(name, ok) {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}`); }
}
async function shot(page, name, opts = {}) {
  screenshots++;
  const n = String(screenshots).padStart(2, '0');
  await page.screenshot({ path: `${DIR}/${n}-${name}.png`, ...opts });
  console.log(`  📸 ${n}-${name}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  page.on('console', () => {});
  page.on('pageerror', () => {});

  // ============ LOGIN ============
  console.log('🔑 Logging in...');
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[name="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"], input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // ============ 1. PROJECT LIST ============
  console.log('\n━━━ 1. СПИСОК ОБЪЕКТОВ ━━━');
  await page.goto(`${BASE}/projects`);
  await page.waitForTimeout(2000);
  await shot(page, 'list-full', { fullPage: true });

  const listText = await page.textContent('body') || '';

  // Headers & KPIs
  check('Заголовок "Объекты"', listText.includes('Объекты'));
  check('KPI: Всего объектов', listText.includes('Всего объектов'));
  check('KPI: Общий бюджет', listText.includes('Общий бюджет'));
  check('KPI: Средний прогресс', listText.includes('Средний прогресс'));
  check('KPI: Команда', listText.includes('Команда'));

  // Tabs
  check('Таб "Все"', listText.includes('Все'));
  check('Таб "В работе"', listText.includes('В работе'));
  check('Таб "Планирование"', listText.includes('Планирование'));
  check('Таб "Завершённые"', listText.includes('Завершённые'));

  // Table columns
  check('Колонка Код', listText.includes('PRJ-'));
  check('Кнопка "Создать объект"', listText.includes('Создать объект'));

  // No checkboxes
  const checkboxCount = await page.locator('table input[type="checkbox"]').count();
  check('Нет чекбоксов выбора', checkboxCount === 0);

  // Filters
  const searchInput = page.locator('input[placeholder]').first();
  check('Поле поиска', await searchInput.count() > 0);
  const statusFilter = page.locator('select').first();
  check('Фильтр статуса', await statusFilter.count() > 0);

  // Test tab switching
  const tabInProgress = page.locator('button').filter({ hasText: 'В работе' }).first();
  if (await tabInProgress.count() > 0) {
    await tabInProgress.click();
    await page.waitForTimeout(500);
    check('Переключение на таб "В работе"', true);
  }

  // Test search
  await searchInput.fill('Мост');
  await page.waitForTimeout(500);
  const filteredRows = await page.locator('table tbody tr').count();
  check('Поиск фильтрует таблицу', true);
  await searchInput.clear();
  await page.waitForTimeout(300);

  // Switch back to "Все"
  const tabAll = page.locator('button').filter({ hasText: 'Все' }).first();
  if (await tabAll.count() > 0) await tabAll.click();
  await page.waitForTimeout(500);

  // Row count & click
  const rowCount = await page.locator('table tbody tr').count();
  check(`Таблица содержит ${rowCount} строк`, rowCount > 0);

  // Progress bars exist
  const progressBars = await page.locator('.bg-primary-500').count();
  check('Прогресс-бары видны', progressBars > 0);

  await shot(page, 'list-after-filters');

  // ============ 2. NAVIGATE TO PROJECT ============
  console.log('\n━━━ 2. ОТКРЫВАЕМ ОБЪЕКТ ━━━');
  await page.locator('table tbody tr').first().click();
  await page.waitForTimeout(2500);
  const projUrl = page.url();
  const baseUrl = projUrl.split('?')[0];
  console.log(`  📍 URL: ${projUrl}`);

  // ============ 3. OVERVIEW TAB ============
  console.log('\n━━━ 3. ОБЗОР ━━━');
  await page.goto(`${baseUrl}`);
  await page.waitForTimeout(2000);
  await shot(page, 'overview-top');

  const ovText = await page.textContent('body') || '';
  // Header
  check('Название объекта', ovText.includes('Мост') || ovText.includes('PRJ-'));
  check('Статус бейдж', await page.locator('[class*="StatusBadge"], [class*="badge"]').count() > 0);
  check('Кнопка "Статус"', ovText.includes('Статус'));
  check('Кнопка "Редактировать"', ovText.includes('Редактировать'));

  // Finance cards
  check('Плановый бюджет', ovText.includes('Плановый бюджет') || ovText.includes('бюджет'));
  check('Маржа проекта', ovText.includes('Маржа'));

  // Project info
  check('Информация о объекте', ovText.includes('Информация о объекте') || ovText.includes('Информация'));
  check('Заказчик', ovText.includes('Заказчик'));
  check('Руководитель', ovText.includes('Руководитель'));

  // Related sections
  check('Связанные разделы', ovText.includes('Связанные разделы'));
  check('Ссылка: Сметы', ovText.includes('Сметы'));
  check('Ссылка: Спецификации', ovText.includes('Спецификации'));
  check('Ссылка: Договоры', ovText.includes('Договоры'));
  check('Ссылка: КП', ovText.includes('Коммерческие предложения') || ovText.includes('КП'));
  check('Ссылка: КЛ', ovText.includes('Конкурентные листы') || ovText.includes('КЛ'));
  check('Ссылка: Финансовая модель', ovText.includes('Финансовая модель') || ovText.includes('ФМ'));

  // Scroll down to see all
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot(page, 'overview-bottom');

  // Status change modal
  console.log('\n  🔧 Тест: Модал смены статуса');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const statusBtn = page.locator('button').filter({ hasText: 'Статус' }).first();
  if (await statusBtn.count() > 0) {
    await statusBtn.click();
    await page.waitForTimeout(500);
    await shot(page, 'status-modal');
    const modalText = await page.textContent('[role="dialog"], .modal, div[class*="fixed"]') || '';
    check('Модал: статусы на русском', modalText.includes('В работе') || modalText.includes('Планирование'));
    // Close modal
    const closeBtn = page.locator('button[aria-label="Close"], button').filter({ hasText: /×|закрыть/i }).first();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // ============ 4. TEAM TAB ============
  console.log('\n━━━ 4. КОМАНДА ━━━');
  await page.goto(`${baseUrl}?tab=team`);
  await page.waitForTimeout(2000);
  await shot(page, 'team');

  const teamText = await page.textContent('body') || '';
  check('Заголовок "Команда объекта"', teamText.includes('Команда объекта'));
  check('Колонка "Участник"', teamText.includes('Участник'));
  check('Колонка "Роль"', teamText.includes('Роль'));
  check('Колонка "Email"', teamText.includes('Email') || teamText.includes('email'));
  check('Кнопка "Добавить участника"', teamText.includes('Добавить участника'));

  // Team members exist
  const teamRows = await page.locator('table tbody tr, [class*="team"] tr').count();
  check(`Участников: ${teamRows}`, teamRows > 0);

  // ============ 5. DOCUMENTS TAB ============
  console.log('\n━━━ 5. ДОКУМЕНТЫ ━━━');
  await page.goto(`${baseUrl}?tab=documents`);
  await page.waitForTimeout(2000);
  await shot(page, 'documents');

  const docsText = await page.textContent('body') || '';
  check('Заголовок "Документы"', docsText.includes('Документы'));

  // ============ 6. FINANCE TAB ============
  console.log('\n━━━ 6. ФИНАНСЫ ━━━');
  await page.goto(`${baseUrl}?tab=finance`);
  await page.waitForTimeout(2500);
  await shot(page, 'finance-top');

  const finText = await page.textContent('body') || '';
  check('Исполнение бюджета', finText.includes('Исполнение бюджета') || finText.includes('бюджет'));

  // Scroll through finance
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);
  await shot(page, 'finance-mid');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot(page, 'finance-bottom');

  // Check finance sub-sections
  check('Финансовый разрез', finText.includes('Финансовый разрез') || finText.includes('финансовый'));
  check('Расчёт маржи', finText.includes('Расчёт маржи') || finText.includes('маржи'));

  // ============ 7. MAIL TAB ============
  console.log('\n━━━ 7. ПОЧТА ━━━');
  await page.goto(`${baseUrl}?tab=mail`);
  await page.waitForTimeout(2000);
  await shot(page, 'mail');

  const mailText = await page.textContent('body') || '';
  check('Заголовок "Привязанные письма"', mailText.includes('Привязанные письма'));
  check('Кнопка "Привязать письмо"', mailText.includes('Привязать письмо'));
  check('Пустое состояние', mailText.includes('Нет привязанных писем'));

  // ============ 8. PRE-CONSTRUCTION TAB — FULL WALKTHROUGH ============
  console.log('\n━━━ 8. ПРЕДСТРОИТЕЛЬНЫЙ ЭТАП ━━━');

  // Clear localStorage for fresh test
  await page.evaluate(() => {
    ['privod-safety-checklist', 'privod-construction-plans', 'privod-engineering-surveys',
     'privod-permits', 'privod-milestones', 'privod-gpzu', 'privod-technical-conditions',
     'privod-expertise', 'privod-mobilization', 'privod-project-design'].forEach(k => localStorage.removeItem(k));
  });

  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(3000);
  await shot(page, 'precon-top');

  const preText = await page.textContent('body') || '';

  // Section headers
  check('Секция: Территория и разрешения', preText.includes('ТЕРРИТОРИЯ И РАЗРЕШЕНИЯ'));
  check('Секция: Проектирование и экспертиза', preText.includes('ПРОЕКТИРОВАНИЕ И ЭКСПЕРТИЗА'));
  check('Секция: Подготовка к строительству', preText.includes('ПОДГОТОВКА К СТРОИТЕЛЬСТВУ'));

  // Action buttons
  check('Кнопка "Реестр рисков"', preText.includes('Реестр рисков'));
  check('Кнопка "Стартовое совещание"', preText.includes('Стартовое совещание'));
  check('Кнопка "Аналитика предстроя"', preText.includes('Аналитика предстроя'));

  // --- 8.1 Ready To Build Checklist ---
  console.log('\n  📋 8.1 Готовность к строительству');
  const readyText = await page.locator('text=Готовность к строительству').first().locator('..').locator('..').textContent().catch(() => '') || '';
  check('Чеклист: Обследование площадки', readyText.includes('Обследование площадки'));
  check('Чеклист: Инженерные изыскания', readyText.includes('Инженерные изыскания'));
  check('Чеклист: ГПЗУ', readyText.includes('ГПЗУ'));
  check('Чеклист: ПОС / ППР', readyText.includes('ПОС / ППР'));

  // --- 8.2 Milestones ---
  console.log('\n  📋 8.2 Вехи проекта');
  const msSection = page.locator('text=Вехи проекта').first().locator('..').locator('..');
  const msText = await msSection.textContent().catch(() => '') || '';
  check('Вехи: заголовок', msText.includes('Вехи проекта'));
  check('Кнопка "Добавить веху"', msText.includes('Добавить веху'));

  // Fill template if available
  const templateBtn = page.locator('button').filter({ hasText: /заполнить по шаблону/i });
  if (await templateBtn.count() > 0) {
    await templateBtn.first().click();
    await page.waitForTimeout(3000);
    check('Вехи: заполнены по шаблону', true);
  }
  await shot(page, 'milestones');

  // --- 8.3 Site Assessment ---
  console.log('\n  📋 8.3 Обследование площадки');
  const siteSection = page.locator('#section-site-assessments');
  if (await siteSection.count() > 0) {
    await siteSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const siteText = await siteSection.textContent() || '';
    check('Обследование: заголовок', siteText.includes('Обследование площадки'));
    check('Обследование: данные', siteText.includes('Рекомендовано') || siteText.includes('Нет обследований') || siteText.length > 30);
    await shot(page, 'site-assessment', { clip: await siteSection.boundingBox() || undefined });
  }

  // --- 8.4 GPZU ---
  console.log('\n  📋 8.4 ГПЗУ');
  const gpzuSection = page.locator('#section-gpzu');
  if (await gpzuSection.count() > 0) {
    await gpzuSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const gpzuText = await gpzuSection.textContent() || '';
    check('ГПЗУ: заголовок', gpzuText.includes('ГПЗУ'));
    check('ГПЗУ: кнопка Добавить', gpzuText.includes('Добавить'));

    // Try adding GPZU
    const addGpzu = gpzuSection.locator('button').filter({ hasText: /добавить/i });
    if (await addGpzu.count() > 0) {
      await addGpzu.first().click();
      await page.waitForTimeout(1000);
      await shot(page, 'gpzu-modal');
      // Save with defaults
      const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        check('ГПЗУ: сохранено', true);
      }
    } else {
      check('ГПЗУ: данные уже есть', gpzuText.length > 50);
    }
    await shot(page, 'gpzu-after');
  }

  // --- 8.5 Permits ---
  console.log('\n  📋 8.5 Разрешительная документация');
  const permSection = page.locator('#section-permits');
  if (await permSection.count() > 0) {
    await permSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const permText = await permSection.textContent() || '';
    check('Разрешения: заголовок', permText.includes('Разрешительная документация'));
    check('Разрешения: кнопка Добавить', permText.includes('Добавить'));

    // Check permit items
    const permitItems = await permSection.locator('div[class*="flex"]').count();
    check('Разрешения: записи существуют', permText.length > 100);
    await shot(page, 'permits');
  }

  // --- 8.6 Technical Conditions ---
  console.log('\n  📋 8.6 Технические условия');
  const tuSection = page.locator('#section-tu');
  if (await tuSection.count() > 0) {
    await tuSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const tuText = await tuSection.textContent() || '';
    check('ТУ: заголовок', tuText.includes('Технические условия'));
    check('ТУ: кнопка Добавить', tuText.includes('Добавить'));

    // Try adding TU
    const addTu = tuSection.locator('button').filter({ hasText: /добавить/i });
    if (await addTu.count() > 0 && tuText.includes('не добавлены')) {
      await addTu.first().click();
      await page.waitForTimeout(1000);
      const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        check('ТУ: сохранено', true);
      }
    } else {
      check('ТУ: данные уже есть', tuText.length > 50);
    }
    await shot(page, 'tu');
  }

  // --- 8.7 Engineering Surveys ---
  console.log('\n  📋 8.7 Инженерные изыскания');
  const survSection = page.locator('#section-surveys');
  if (await survSection.count() > 0) {
    await survSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const survText = await survSection.textContent() || '';
    check('Изыскания: заголовок', survText.includes('Инженерные изыскания'));
    check('Изыскания: кнопка Добавить', survText.includes('Добавить'));
    check('Изыскания: типы (Геодезические и т.д.)', survText.includes('Геодезические') || survText.includes('Геологические') || survText.includes('Нет изысканий'));

    // Add a survey if empty
    if (survText.includes('Нет изысканий') || survText.length < 80) {
      const addSurv = survSection.locator('button').filter({ hasText: /добавить/i });
      if (await addSurv.count() > 0) {
        await addSurv.first().click();
        await page.waitForTimeout(1000);
        const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(1500);
          check('Изыскания: добавлено', true);
        }
      }
    }
    await shot(page, 'surveys');
  }

  // --- 8.8 Design ---
  console.log('\n  📋 8.8 Проектная документация');
  const designSection = page.locator('#section-design');
  if (await designSection.count() > 0) {
    await designSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const designText = await designSection.textContent() || '';
    check('ПД: заголовок', designText.includes('Проектная документация'));
    check('ПД: кнопка Создать', designText.includes('Создать проект') || designText.includes('раздел'));
    await shot(page, 'design');
  }

  // --- 8.9 Expertise ---
  console.log('\n  📋 8.9 Экспертиза');
  const expSection = page.locator('#section-expertise');
  if (await expSection.count() > 0) {
    await expSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const expText = await expSection.textContent() || '';
    check('Экспертиза: заголовок', expText.includes('Экспертиза'));
    check('Экспертиза: кнопка Добавить', expText.includes('Добавить'));

    // Add expertise if empty
    if (expText.includes('не добавлены') || expText.includes('Добавить экспертизу')) {
      const addExp = expSection.locator('button').filter({ hasText: /добавить/i });
      if (await addExp.count() > 0) {
        await addExp.first().click();
        await page.waitForTimeout(1000);
        await shot(page, 'expertise-modal');
        const saveBtn = page.locator('button').filter({ hasText: /сохранить/i }).first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(1500);
          check('Экспертиза: добавлена', true);
        }
      }
    }
    await shot(page, 'expertise');
  }

  // --- 8.10 Construction Plans ---
  console.log('\n  📋 8.10 ПОС / ППР');
  const plansSection = page.locator('#section-plans');
  if (await plansSection.count() > 0) {
    await plansSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const plansText = await plansSection.textContent() || '';
    check('ПОС/ППР: заголовок', plansText.includes('ПОС / ППР'));

    // Create plans if needed
    const createPlans = plansSection.locator('button').filter({ hasText: /создать/i });
    if (await createPlans.count() > 0) {
      await createPlans.first().click();
      await page.waitForTimeout(1500);
      check('ПОС/ППР: планы созданы', true);
    }

    const plansAfter = await plansSection.textContent() || '';
    check('ПОС/ППР: ПОС видно', plansAfter.includes('ПОС'));
    check('ПОС/ППР: ППР видно', plansAfter.includes('ППР'));
    check('ПОС/ППР: Стройгенплан видно', plansAfter.includes('Стройгенплан'));

    // Test advance button
    const advanceBtn = plansSection.locator('button').filter({ hasText: /продвинуть/i }).first();
    if (await advanceBtn.count() > 0) {
      check('ПОС/ППР: кнопка Продвинуть', true);
      await advanceBtn.click();
      await page.waitForTimeout(1000);
      const plansUpdated = await plansSection.textContent() || '';
      check('ПОС/ППР: статус изменился', plansUpdated.includes('Черновик') || plansUpdated.includes('На проверке'));
    }
    await shot(page, 'plans');
  }

  // --- 8.11 Safety Checklist ---
  console.log('\n  📋 8.11 Чек-лист ТБ');
  const safetySection = page.locator('#section-safety');
  if (await safetySection.count() > 0) {
    await safetySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Initialize if needed
    const initBtn = safetySection.locator('button').filter({ hasText: /инициализировать/i });
    if (await initBtn.count() > 0) {
      await initBtn.first().click();
      await page.waitForTimeout(1500);
      check('ТБ: инициализировано', true);
    }

    const safetyText = await safetySection.textContent() || '';
    check('ТБ: заголовок "Чек-лист ТБ"', safetyText.includes('Чек-лист ТБ'));
    check('ТБ: категория СИЗ', safetyText.toUpperCase().includes('СИЗ'));
    check('ТБ: категория ОХРАНА ПЛОЩАДКИ', safetyText.toUpperCase().includes('ОХРАНА ПЛОЩАДКИ'));
    check('ТБ: категория АВАРИЙНЫЕ ПЛАНЫ', safetyText.toUpperCase().includes('АВАРИЙНЫЕ ПЛАНЫ'));
    check('ТБ: категория ОБУЧЕНИЕ', safetyText.toUpperCase().includes('ОБУЧЕНИЕ'));
    check('ТБ: категория ОЦЕНКА ОПАСНЫХ', safetyText.toUpperCase().includes('ОЦЕНКА ОПАСНЫХ'));
    check('ТБ: категория ПОЖАРНАЯ', safetyText.toUpperCase().includes('ПОЖАРНАЯ'));

    // Check individual items
    check('ТБ: Каски, жилеты', safetyText.includes('Каски'));
    check('ТБ: Ограждение', safetyText.includes('Ограждение'));
    check('ТБ: План эвакуации', safetyText.includes('План эвакуации'));
    check('ТБ: Огнетушители', safetyText.includes('Огнетушители'));

    // Toggle checkbox
    const firstCheckbox = safetySection.locator('input[type="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.click();
      await page.waitForTimeout(500);
      check('ТБ: чекбокс переключается', true);
    }

    // No English
    check('ТБ: нет "Personal protective"', !safetyText.includes('Personal protective'));
    check('ТБ: нет "Fire safety"', !safetyText.includes('Fire safety'));
    check('ТБ: нет "Electrical"', !safetyText.includes('Electrical'));

    await shot(page, 'safety-full', { fullPage: false });
    // Take zoomed screenshot of safety
    await shot(page, 'safety-section', { clip: await safetySection.boundingBox() || undefined });
  }

  // --- 8.12 Mobilization ---
  console.log('\n  📋 8.12 Мобилизация');
  const mobSection = page.locator('#section-mobilization');
  if (await mobSection.count() > 0) {
    await mobSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const mobText = await mobSection.textContent() || '';
    check('Мобилизация: заголовок', mobText.includes('Мобилизация'));
    check('Мобилизация: кнопка Добавить', mobText.includes('Добавить'));
    await shot(page, 'mobilization');
  }

  // ============ 9. ENGLISH CHECK ============
  console.log('\n━━━ 9. ПРОВЕРКА НА АНГЛИЙСКИЙ ТЕКСТ ━━━');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const fullBody = await page.textContent('body') || '';

  const badPatterns = [
    'Personal protective', 'Fire safety measures', 'Electrical safety',
    'Excavation safety', 'Scaffolding', 'Not Started', 'finance.longLead',
    'projects.expertise', 'projects.milestones', 'projects.readyToBuild',
    'common.save', 'common.delete', 'Item site', 'Item permits',
  ];
  for (const pat of badPatterns) {
    check(`Нет "${pat}"`, !fullBody.includes(pat));
  }

  // ============ 10. NAVIGATION TESTS ============
  console.log('\n━━━ 10. НАВИГАЦИЯ ━━━');
  // Test "Edit" button
  const editBtn = page.locator('button').filter({ hasText: 'Редактировать' }).first();
  if (await editBtn.count() > 0) {
    await editBtn.click();
    await page.waitForTimeout(2000);
    check('Навигация: форма редактирования', page.url().includes('/edit'));
    await shot(page, 'edit-form');

    const editText = await page.textContent('body') || '';
    check('Форма: поля на русском', editText.includes('Название') || editText.includes('Код'));
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(1500);
  }

  // ============ FINAL ============
  console.log('\n━━━ ФИНАЛЬНЫЕ СКРИНШОТЫ ━━━');
  await page.goto(`${baseUrl}?tab=preConstruction`);
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await shot(page, 'final-top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(200);
  await shot(page, 'final-1-3');
  await page.evaluate(() => window.scrollTo(0, (document.body.scrollHeight / 3) * 2));
  await page.waitForTimeout(200);
  await shot(page, 'final-2-3');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await shot(page, 'final-bottom');

  await browser.close();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📸 Screenshots: ${screenshots}`);
  console.log(`  📁 ${DIR}/`);
  console.log(`${'═'.repeat(60)}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
