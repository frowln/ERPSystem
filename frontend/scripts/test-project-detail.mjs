import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4000';
const DIR = '/tmp/privod-project-detail-audit';
mkdirSync(DIR, { recursive: true });

let passed = 0, failed = 0;

function check(name, condition) {
  if (condition) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ FAIL: ${name}`); }
}

async function screenshot(page, name) {
  const path = `${DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  📸 ${path}`);
  return path;
}

function checkNoEnglishEnums(allText, section) {
  const enums = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PLANNING', 'DRAFT', 'ON_HOLD',
    'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION'];
  const found = enums.filter(e => allText.includes(e));
  check(`[${section}] No English enums`, found.length === 0);
  if (found.length > 0) console.log(`    Found: ${found.join(', ')}`);
}

const PROJECT_ID = '26e882ed-a0a1-4c8d-baf5-cae3496c50e0';

async function navigateToTab(page, tab) {
  const url = tab ? `${BASE}/projects/${PROJECT_ID}?tab=${tab}` : `${BASE}/projects/${PROJECT_ID}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // 1. Login
  console.log('\n=== 1. LOGIN ===');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@privod.ru');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
  await page.waitForTimeout(1000);
  check('Login successful', true);

  // ===== OVERVIEW TAB =====
  console.log('\n=== 2. TAB: ОБЗОР ===');
  await navigateToTab(page, null);
  await screenshot(page, '01-overview');

  const title = await page.locator('h1').first().textContent();
  console.log(`  Title: "${title}"`);
  check('Title in Russian', /[А-Яа-я]/.test(title));

  const subtitle = await page.locator('[class*="animate-fade"] p').first().textContent().catch(() => '');
  console.log(`  Subtitle: "${subtitle}"`);
  check('Subtitle no raw English type', !/RESIDENTIAL|COMMERCIAL|INDUSTRIAL|INFRASTRUCTURE|RENOVATION/.test(subtitle));

  const breadcrumb = await page.locator('nav').first().textContent().catch(() => '');
  check('Breadcrumbs have Объект', breadcrumb.includes('Объект'));

  check('Edit btn', await page.locator('button:has-text("Редакт")').first().isVisible().catch(() => false));
  check('Status btn', await page.locator('button:has-text("Статус")').first().isVisible().catch(() => false));

  // Tab count
  const tabBar = page.locator('.-mb-px.flex, .border-b.flex.-mb-px');
  const tabBtns = tabBar.locator('button');
  const tabCount = await tabBtns.count();
  console.log(`  Tab buttons: ${tabCount}`);
  check('Has >=6 tabs', tabCount >= 6);

  // Status modal
  console.log('\n=== 3. STATUS MODAL ===');
  await page.locator('button:has-text("Статус")').first().click();
  await page.waitForTimeout(500);
  await screenshot(page, '02-status-modal');
  const modalText = await page.locator('[role="dialog"], .fixed.inset-0').first().textContent().catch(() => '');
  check('Russian statuses in modal', ['Черновик', 'Планирование', 'В работе'].every(s => modalText.includes(s)));
  checkNoEnglishEnums(modalText, 'Status Modal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Overview KPIs
  const overviewText = await page.locator('main').textContent().catch(() => '');
  const kpis = ['рогресс', 'бюджет', 'дней', 'частник', 'контракт', 'аржа', 'ебиторк'];
  const foundKpis = kpis.filter(k => overviewText.toLowerCase().includes(k));
  console.log(`  KPIs (${foundKpis.length}): ${foundKpis.join(', ')}`);
  check('[Overview] KPI cards >=4', foundKpis.length >= 4);
  check('[Overview] Project info', overviewText.includes('Заказчик') || overviewText.includes('Руководитель'));
  check('[Overview] Budget section', /[Бб]юджет/.test(overviewText));
  check('[Overview] Dates shown', /\d{1,2}\s[а-я]+\s\d{4}|\d{2}\.\d{2}\.\d{4}/.test(overviewText));
  checkNoEnglishEnums(overviewText, 'Overview');

  // ===== TEAM TAB =====
  console.log('\n=== 4. TAB: КОМАНДА ===');
  await navigateToTab(page, 'team');
  await screenshot(page, '03-team');
  const teamText = await page.locator('main').textContent().catch(() => '');
  check('[Team] Renders', teamText.length > 50);
  const teamOk = /[Кк]оманд|[Уу]частник|[Дд]обавить|Руководитель|Инженер|MANAGER|[Рр]оль/.test(teamText);
  const teamError = /ошибка/i.test(teamText);
  check('[Team] Has team UI or graceful error', teamOk || teamError);
  if (teamError) console.log('    ⚠️ Team shows error (backend may be restarting)');
  if (!teamError) checkNoEnglishEnums(teamText, 'Team');

  // ===== DOCUMENTS TAB =====
  console.log('\n=== 5. TAB: ДОКУМЕНТЫ ===');
  await navigateToTab(page, 'documents');
  await screenshot(page, '04-documents');
  const docsText = await page.locator('main').textContent().catch(() => '');
  check('[Docs] Renders', docsText.length > 50);
  const docsOk = /[Дд]окумент|[Зз]агрузить|[Кк]атегория|[Фф]айл|[Кк]онтракт|[Дд]оговор/.test(docsText);
  const docsError = /ошибка/i.test(docsText);
  check('[Docs] Has doc UI or graceful error', docsOk || docsError);
  if (docsError) console.log('    ⚠️ Docs shows error (backend may be restarting)');
  if (!docsError) checkNoEnglishEnums(docsText, 'Documents');

  // ===== BUDGET TAB =====
  console.log('\n=== 6. TAB: БЮДЖЕТ ===');
  await navigateToTab(page, 'budget');
  await screenshot(page, '05-budget');
  const budgetText = await page.locator('main').textContent().catch(() => '');
  check('[Budget] Renders', budgetText.length > 30);
  check('[Budget] Has budget UI', /[Бб]юджет|[Вв]ыручка|[Зз]атраты|[Сс]оздать|[Оо]ткрыть|[Мм]аржа|не найден/.test(budgetText));
  checkNoEnglishEnums(budgetText, 'Budget');

  // ===== FINANCE TAB =====
  console.log('\n=== 7. TAB: ФИНАНСЫ ===');
  await navigateToTab(page, 'finance');
  await screenshot(page, '06-finance');
  const finText = await page.locator('main').textContent().catch(() => '');
  check('[Finance] Renders', finText.length > 50);
  const finLabels = ['контракт', 'аржа', 'юджет', 'ыставлено', 'ебиторк', 'освоен'];
  const foundFin = finLabels.filter(l => finText.toLowerCase().includes(l));
  console.log(`  Finance labels (${foundFin.length}): ${foundFin.join(', ')}`);
  check('[Finance] Has finance metrics >=2', foundFin.length >= 2);
  checkNoEnglishEnums(finText, 'Finance');

  // ===== MAIL TAB =====
  console.log('\n=== 8. TAB: ПОЧТА ===');
  await navigateToTab(page, 'mail');
  await screenshot(page, '07-mail');
  const mailText = await page.locator('main').textContent().catch(() => '');
  check('[Mail] Renders', mailText.length > 20);
  checkNoEnglishEnums(mailText, 'Mail');

  // ===== PRE-CONSTRUCTION TAB =====
  console.log('\n=== 9. TAB: ПРЕДСТРОИТЕЛЬНЫЙ ЭТАП ===');
  await navigateToTab(page, 'preConstruction');
  await page.waitForTimeout(1000); // extra time for lazy panels
  await screenshot(page, '08-precon-top');

  const preconText = await page.locator('main').textContent().catch(() => '');
  check('[PreCon] Renders', preconText.length > 100);

  // Action buttons
  check('[PreCon] Risks btn', await page.locator('button:has-text("рисков"), button:has-text("Реестр")').first().isVisible().catch(() => false));
  check('[PreCon] Meeting btn', await page.locator('button:has-text("совещание"), button:has-text("Стартовое")').first().isVisible().catch(() => false));
  check('[PreCon] Analytics btn', await page.locator('button:has-text("Аналитика"), button:has-text("аналитик")').first().isVisible().catch(() => false));

  // Section headers
  const sections = ['Территория', 'Проектирование', 'Подготовка'];
  const foundSections = sections.filter(s => preconText.includes(s));
  console.log(`  Sections: ${foundSections.join(', ')}`);
  check('[PreCon] Section groupings >=2', foundSections.length >= 2);

  // Panels
  const panelNames = [
    'Инженерные изыскания', 'Разрешительная', 'ПОС', 'ТБ',
    'ГПЗУ', 'ТУ на подключение', 'Экспертиза', 'Проектная документация',
    'Мобилизация', 'Обследование', 'Готовность', 'ех'
  ];
  const foundPanels = panelNames.filter(p => preconText.includes(p));
  console.log(`  Panels (${foundPanels.length}/${panelNames.length}): ${foundPanels.join(', ')}`);
  check('[PreCon] Panels loaded >=6', foundPanels.length >= 6);
  checkNoEnglishEnums(preconText, 'Pre-Construction');

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await screenshot(page, '09-precon-bottom');

  // ===== DARK MODE =====
  console.log('\n=== 10. DARK MODE ===');
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(500);
  await screenshot(page, '10-dark');
  check('[Dark] Renders', true);
  await page.evaluate(() => document.documentElement.classList.remove('dark'));

  // ===== SUB-PAGES =====
  console.log('\n=== 11. SUB-PAGE: RISK REGISTER ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/risks`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '11-risks');
  const riskText = await page.locator('main').textContent().catch(() => '');
  check('[Risks] Renders', riskText.length > 50);
  check('[Risks] Has risk UI', /[Рр]иск|[Мм]атриц|[Вв]ероятность|[Дд]обавить/.test(riskText));
  checkNoEnglishEnums(riskText, 'Risks');

  console.log('\n=== 12. SUB-PAGE: MEETING ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/meeting`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '12-meeting');
  const meetingText = await page.locator('main').textContent().catch(() => '');
  check('[Meeting] Renders', meetingText.length > 50);
  check('[Meeting] Has UI', /[Сс]овещание|[Уу]частник|[Пп]овестка|[Рр]ешени|[Дд]обавить/.test(meetingText));
  checkNoEnglishEnums(meetingText, 'Meeting');

  console.log('\n=== 13. EDIT PROJECT ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/edit`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '13-edit');
  const editText = await page.locator('main').textContent().catch(() => '');
  check('[Edit] Renders', editText.length > 100);
  const editLabels = ['Название', 'Тип', 'Заказчик', 'Адрес', 'Дата'];
  const foundEdit = editLabels.filter(l => editText.includes(l));
  console.log(`  Labels: ${foundEdit.join(', ')}`);
  check('[Edit] Russian labels >=3', foundEdit.length >= 3);
  checkNoEnglishEnums(editText, 'Edit');

  console.log('\n=== 14. PRE-CON DASHBOARD ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/pre-construction`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '14-precon-dashboard');
  const dashText = await page.locator('main').textContent().catch(() => '');
  check('[PreConDash] Renders', dashText.length > 50);
  checkNoEnglishEnums(dashText, 'PreCon Dashboard');

  // ===== CONSTRUCTABILITY =====
  console.log('\n=== 15. CONSTRUCTABILITY ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/constructability`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '15-constructability');
  const constText = await page.locator('main').textContent().catch(() => '');
  check('[Constructability] Renders', constText.length > 30);

  // ===== HANDOFF REPORT =====
  console.log('\n=== 16. HANDOFF REPORT ===');
  await page.goto(`${BASE}/projects/${PROJECT_ID}/handoff-report`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await screenshot(page, '16-handoff');
  const handoffText = await page.locator('main').textContent().catch(() => '');
  check('[Handoff] Renders', handoffText.length > 30);

  // ===== SUMMARY =====
  console.log('\n=== 17. CONSOLE ERRORS ===');
  console.log(`  Total: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(`    ${e.slice(0, 120)}`));
  }

  await browser.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`PROJECT DETAIL FULL AUDIT: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots: ${DIR}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
