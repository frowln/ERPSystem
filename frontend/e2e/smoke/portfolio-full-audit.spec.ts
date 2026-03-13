import { test, expect } from '@playwright/test';

/**
 * Полный E2E аудит портфельного модуля:
 * 1. Возможности (Opportunities)
 * 2. Тендеры (Bid Packages)
 * 3. Сравнение предложений (Bid Comparison)
 * 4. CRM Dashboard + Leads
 */

test.describe('Портфель — Возможности (Opportunities)', () => {

  test('1.1 Список возможностей — загрузка, данные, табы', async ({ page }) => {
    await page.goto('/portfolio/opportunities');
    await page.waitForTimeout(3000);

    // Проверяем заголовок на русском
    const body = await page.textContent('body');
    expect(body).toContain('Возможности');

    // Метрики должны быть видимы (4 карточки)
    const metricCards = page.locator('[class*="rounded-xl"]').filter({ hasText: /Активные|Pipeline|Взвешен|вероятность/i });
    const metricCount = await metricCards.count();
    console.log(`  Метрик-карточек: ${metricCount}`);

    // Проверяем табы
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Все|Активные|Выигранные|Проигранные/i });
    const tabCount = await tabs.count();
    console.log(`  Табов: ${tabCount}`);
    expect(tabCount).toBeGreaterThanOrEqual(3);

    // Таблица/список с данными
    const rows = page.locator('tr, [class*="cursor-pointer"]');
    const rowCount = await rows.count();
    console.log(`  Строк данных: ${rowCount}`);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-opportunities-list.png', fullPage: true });
  });

  test('1.2 Табы фильтрации — Активные, Выигранные, Проигранные', async ({ page }) => {
    await page.goto('/portfolio/opportunities');
    await page.waitForTimeout(2000);

    // Кликаем "Выигранные"
    const wonTab = page.locator('button, [role="tab"]').filter({ hasText: /Выигранные/i }).first();
    if (await wonTab.count() > 0) {
      await wonTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-opp-tab-won.png', fullPage: true });
    }

    // Кликаем "Проигранные"
    const lostTab = page.locator('button, [role="tab"]').filter({ hasText: /Проигранные/i }).first();
    if (await lostTab.count() > 0) {
      await lostTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-opp-tab-lost.png', fullPage: true });
    }

    // Кликаем "Все"
    const allTab = page.locator('button, [role="tab"]').filter({ hasText: /^Все/i }).first();
    if (await allTab.count() > 0) {
      await allTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('1.3 Поиск и фильтр по стадиям', async ({ page }) => {
    await page.goto('/portfolio/opportunities');
    await page.waitForTimeout(2000);

    // Проверяем поиск
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="поиск"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Аквамарин');
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      console.log(`  Результат поиска "Аквамарин": ${body?.includes('Аквамарин') ? 'найден' : 'не найден'}`);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-opp-search.png', fullPage: true });
      await searchInput.clear();
    }

    // Фильтр по стадии
    const stageSelect = page.locator('select').first();
    if (await stageSelect.count() > 0) {
      const options = await stageSelect.locator('option').allTextContents();
      console.log(`  Опции фильтра: ${options.join(', ')}`);
    }
  });

  test('1.4 Детальная страница возможности', async ({ page }) => {
    await page.goto('/portfolio/opportunities');
    await page.waitForTimeout(2000);

    // Кликаем по первой строке данных таблицы
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(3000);

      const url = page.url();
      const navigated = /\/portfolio\/opportunities\//.test(url);
      console.log(`  Навигация: ${navigated ? '✓' : '✗'} (${url})`);

      if (navigated) {
        const body = await page.textContent('body');

        // Проверяем наличие пайплайна стадий
        const hasStages = /Лид|Квалификация|Предложение|Переговоры|Выигран/i.test(body || '');
        console.log(`  Пайплайн стадий: ${hasStages ? '✓' : '✗'}`);

        // Проверяем финансовые данные
        const hasFinancials = /₽|руб|стоимость|вероятность/i.test(body || '');
        console.log(`  Финансовые данные: ${hasFinancials ? '✓' : '✗'}`);

        // Go/No-Go чек-лист
        const hasChecklist = /Go.*No.*Go|чек.*лист/i.test(body || '');
        console.log(`  Go/No-Go чеклист: ${hasChecklist ? '✓' : '✗'}`);
      }

      await page.screenshot({ path: 'e2e/screenshots/portfolio-opp-detail.png', fullPage: true });
    }
  });

  test('1.5 Создание возможности — форма', async ({ page }) => {
    await page.goto('/portfolio/opportunities/new');
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    // Должна быть форма с полями
    const hasForm = /название|клиент|стоимость|вероятность|источник/i.test(body || '');
    console.log(`  Форма создания: ${hasForm ? '✓' : '✗'}`);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-opp-form.png', fullPage: true });
  });
});


test.describe('Портфель — Тендеры (Bid Packages)', () => {

  test('2.1 Список тендеров — загрузка, метрики, табы', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('Тендеры');

    // 4 метрик-карточки
    const hasTotal = /Всего тендеров/i.test(body || '');
    const hasVolume = /Общий объём/i.test(body || '');
    const hasWinRate = /Процент побед/i.test(body || '');
    const hasReview = /На рассмотрении/i.test(body || '');
    console.log(`  Метрики: Всего=${hasTotal} Объём=${hasVolume} Побед=${hasWinRate} Рассмотрение=${hasReview}`);
    expect(hasTotal && hasVolume && hasWinRate && hasReview).toBeTruthy();

    // Табы: Все, Активные, Выигранные, Проигранные
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Все|Активные|Выигранные|Проигранные/i });
    const tabCount = await tabs.count();
    console.log(`  Табов: ${tabCount}`);
    expect(tabCount).toBeGreaterThanOrEqual(4);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-list.png', fullPage: true });
  });

  test('2.2 Таблица тендеров — колонки и данные', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(3000);

    // Проверяем заголовки колонок
    const body = await page.textContent('body');
    const hasNumber = body?.includes('№');
    const hasProject = /Объект/i.test(body || '');
    const hasStatus = /Статус/i.test(body || '');
    const hasBidAmount = /Сумма предложения/i.test(body || '');
    const hasScore = /Оценка/i.test(body || '');
    const hasResponsible = /Ответственный/i.test(body || '');
    const hasDeadline = /Дедлайн/i.test(body || '');
    const hasSubmitted = /Подан/i.test(body || '');
    console.log(`  Колонки: №=${hasNumber} Объект=${hasProject} Статус=${hasStatus} Сумма=${hasBidAmount} Оценка=${hasScore} Ответств=${hasResponsible} Дедлайн=${hasDeadline} Подан=${hasSubmitted}`);

    // Проверяем данные из seed
    const hasRealData = /BP-2026|Аквамарин|Мостовик|Логистик/i.test(body || '');
    console.log(`  Реальные данные: ${hasRealData ? '✓' : '✗'}`);
    expect(hasRealData).toBeTruthy();

    // Проверяем бейджи статусов
    const statusBadges = page.locator('[class*="badge"], [class*="rounded-full"], span').filter({
      hasText: /Черновик|В подготовке|Подан|На оценке|Выигран|Проигран|Без предложения/i
    });
    const badgeCount = await statusBadges.count();
    console.log(`  Бейджей статуса: ${badgeCount}`);
    expect(badgeCount).toBeGreaterThanOrEqual(3);

    // Проверяем числовые данные (суммы)
    const hasMoneyFormat = /млн|₽|млрд/i.test(body || '');
    console.log(`  Форматированные суммы: ${hasMoneyFormat ? '✓' : '✗'}`);
  });

  test('2.3 Табы фильтрации — разные вкладки', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    // "Активные"
    const activeTab = page.locator('button, [role="tab"]').filter({ hasText: /Активные/i }).first();
    if (await activeTab.count() > 0) {
      await activeTab.click();
      await page.waitForTimeout(1000);
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`  Активные: ${count} строк`);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-tab-active.png', fullPage: true });
    }

    // "Выигранные"
    const wonTab = page.locator('button, [role="tab"]').filter({ hasText: /Выигранные/i }).first();
    if (await wonTab.count() > 0) {
      await wonTab.click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      const hasWon = /Выигран|WON|Логистик/i.test(body || '');
      console.log(`  Выигранные содержат данные: ${hasWon ? '✓' : '✗'}`);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-tab-won.png', fullPage: true });
    }

    // "Проигранные"
    const lostTab = page.locator('button, [role="tab"]').filter({ hasText: /Проигранные/i }).first();
    if (await lostTab.count() > 0) {
      await lostTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-tab-lost.png', fullPage: true });
    }
  });

  test('2.4 Поиск тендеров', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="поиск"]').first();
    expect(await searchInput.count()).toBeGreaterThan(0);

    // Поиск по клиенту
    await searchInput.fill('Мостовик');
    await page.waitForTimeout(1000);
    let body = await page.textContent('body');
    const foundMostovikSearch = /Мостовик/i.test(body || '');
    console.log(`  Поиск "Мостовик": ${foundMostovikSearch ? '✓ найдено' : '✗ не найдено'}`);
    await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-search.png', fullPage: true });

    // Поиск по номеру
    await searchInput.clear();
    await searchInput.fill('BP-2026-003');
    await page.waitForTimeout(1000);
    body = await page.textContent('body');
    const foundNumber = /BP-2026-003/i.test(body || '');
    console.log(`  Поиск "BP-2026-003": ${foundNumber ? '✓ найдено' : '✗ не найдено'}`);
  });

  test('2.5 Фильтр по статусу', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    const statusSelect = page.locator('select').first();
    if (await statusSelect.count() > 0) {
      // Выбираем "Выигран"
      await statusSelect.selectOption({ label: 'Выигран' });
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      console.log(`  Фильтр "Выигран": ${/Логистик/i.test(body || '') ? '✓' : '✗'}`);

      // Сбрасываем
      await statusSelect.selectOption({ value: '' });
      await page.waitForTimeout(500);
    }
  });

  test('2.6 Клик по строке → детальная страница', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    // Кликаем по первой строке таблицы
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForURL('**/portfolio/tenders/**', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const body = await page.textContent('body');

      // Пайплайн статусов
      const hasStatusPipeline = /Черновик.*В подготовке.*Подан|Подан.*На оценке.*Выигран/i.test(body || '');
      console.log(`  Пайплайн статусов: ${hasStatusPipeline ? '✓' : '✗'}`);

      // Финансовые метрики
      const hasBidAmount = /Сумма предложения/i.test(body || '');
      const hasCost = /себестоимость/i.test(body || '');
      const hasMargin = /[Мм]аржа/i.test(body || '');
      console.log(`  Финансы: Сумма=${hasBidAmount} Себестоимость=${hasCost} Маржа=${hasMargin}`);

      // Информация о проекте
      const hasProjectInfo = /Информация о проекте/i.test(body || '');
      console.log(`  Информация о проекте: ${hasProjectInfo ? '✓' : '✗'}`);

      // Сроки
      const hasDeadlines = /[Сс]роки|[Дд]едлайн/i.test(body || '');
      console.log(`  Сроки: ${hasDeadlines ? '✓' : '✗'}`);

      // Sidebar
      const hasResponsible = /Ответственный/i.test(body || '');
      console.log(`  Ответственный (sidebar): ${hasResponsible ? '✓' : '✗'}`);

      // Кнопки действий
      const editBtn = page.locator('button').filter({ hasText: /Редактир|Изменить/i });
      const statusBtn = page.locator('button').filter({ hasText: /Сменить статус/i });
      const deleteBtn = page.locator('button').filter({ hasText: /Удалить/i });
      console.log(`  Кнопки: Редакт=${await editBtn.count()} СменаСтатуса=${await statusBtn.count()} Удаление=${await deleteBtn.count()}`);

      await page.screenshot({ path: 'e2e/screenshots/portfolio-tender-detail.png', fullPage: true });
    }
  });

  test('2.7 Детальная — смена статуса', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    // Найдем тендер со статусом IN_PREPARATION (можно менять)
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (/В подготовке/i.test(text || '')) {
        await rows.nth(i).click();
        break;
      }
    }

    await page.waitForURL('**/portfolio/tenders/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Кликаем "Сменить статус"
    const statusBtn = page.locator('button').filter({ hasText: /Сменить статус/i }).first();
    if (await statusBtn.count() > 0 && await statusBtn.isEnabled()) {
      await statusBtn.click();
      await page.waitForTimeout(500);

      // Должно появиться dropdown с вариантами
      const dropdown = page.locator('[class*="absolute"]').filter({ hasText: /Подан|Проигран/i });
      const hasDropdown = await dropdown.count() > 0;
      console.log(`  Dropdown статусов: ${hasDropdown ? '✓' : '✗'}`);

      await page.screenshot({ path: 'e2e/screenshots/portfolio-tender-status-dropdown.png', fullPage: true });

      // Закрываем dropdown
      await page.keyboard.press('Escape');
    } else {
      console.log('  Кнопка "Сменить статус" не найдена или disabled');
    }
  });

  test('2.8 Создание нового тендера — форма', async ({ page }) => {
    await page.goto('/portfolio/tenders/new');
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect(body).toContain('Новый тендерный пакет');

    // Проверяем секции формы
    const hasBasicInfo = /Основная информация|Название проекта/i.test(body || '');
    const hasFinancial = /[Фф]инансы|Сумма предложения/i.test(body || '');
    const hasDeadline = /[Сс]роки|[Дд]едлайн/i.test(body || '');
    const hasDetails = /[Дд]етали|[Пп]римечания/i.test(body || '');
    console.log(`  Секции: Основная=${hasBasicInfo} Финансы=${hasFinancial} Сроки=${hasDeadline} Детали=${hasDetails}`);

    // Проверяем поля
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    console.log(`  Полей формы: ${inputCount}`);
    expect(inputCount).toBeGreaterThanOrEqual(5);

    // Проверяем кнопки
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /Создать/i });
    const cancelBtn = page.locator('button').filter({ hasText: /Назад|Отмена/i });
    console.log(`  Кнопка создания: ${await submitBtn.count()}, Кнопка отмены: ${await cancelBtn.count()}`);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-tender-form-new.png', fullPage: true });
  });

  test('2.9 Форма — валидация обязательных полей', async ({ page }) => {
    await page.goto('/portfolio/tenders/new');
    await page.waitForTimeout(2000);

    // Закрываем cookie баннер если есть
    const acceptBtn = page.locator('button').filter({ hasText: /Accept|Принять/i }).first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    // Попытка сабмита без заполнения
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Должна появиться ошибка валидации
    const body = await page.textContent('body');
    const hasValidation = /обязательно|введите|required|минимум/i.test(body || '');
    console.log(`  Ошибка валидации: ${hasValidation ? '✓' : '✗'}`);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-tender-form-validation.png', fullPage: true });
  });

  test('2.10 Форма — расчёт маржи', async ({ page }) => {
    await page.goto('/portfolio/tenders/new');
    await page.waitForTimeout(2000);

    // Заполняем сумму и себестоимость
    const bidAmountInput = page.locator('input[type="number"]').first();
    const costInput = page.locator('input[type="number"]').nth(1);

    if (await bidAmountInput.count() > 0 && await costInput.count() > 0) {
      await bidAmountInput.fill('1000000');
      await costInput.fill('800000');
      await page.waitForTimeout(500);

      // Маржа должна рассчитаться: (1000000 - 800000) / 1000000 * 100 = 20%
      const body = await page.textContent('body');
      const hasMarginCalc = /20\.00%/i.test(body || '');
      console.log(`  Авто-маржа 20%: ${hasMarginCalc ? '✓' : '✗'}`);

      await page.screenshot({ path: 'e2e/screenshots/portfolio-tender-form-margin.png', fullPage: true });
    }
  });

  test('2.11 Кнопка "Новое предложение" на странице списка', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    const newBtn = page.locator('button, a').filter({ hasText: /Новое предложение/i }).first();
    expect(await newBtn.count()).toBeGreaterThan(0);

    await newBtn.click();
    await page.waitForURL('**/portfolio/tenders/new', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const body = await page.textContent('body');
    expect(body).toContain('Новый тендерный пакет');
    console.log('  Навигация: Список → Новое предложение ✓');
  });

  test('2.12 Breadcrumbs и навигация назад', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    // Кликаем на первый тендер
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(3000);

      // Проверяем breadcrumbs
      const body = await page.textContent('body');
      const hasBreadcrumbs = /Главная|Портфель|Тендеры|BP-/i.test(body || '');
      console.log(`  Breadcrumbs: ${hasBreadcrumbs ? '✓' : '✗'}`);

      // Кнопка назад (ArrowLeft icon button with aria-label="Назад")
      const backBtn = page.locator('button[aria-label="Назад"]');
      if (await backBtn.count() > 0) {
        await backBtn.click();
        await page.waitForTimeout(2000);
        const isBack = page.url().endsWith('/portfolio/tenders') || page.url().includes('/portfolio/tenders?');
        console.log(`  Навигация назад: ${isBack ? '✓' : '✗'}`);
        expect(isBack).toBeTruthy();
      }
    }
  });
});


test.describe('Портфель — Сравнение предложений', () => {

  test('3.1 Страница сравнения предложений', async ({ page }) => {
    await page.goto('/portfolio/bid-comparison');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('Сравнение предложений');

    // Метрики
    const hasMetrics = /Участников|Средняя цена|Разброс цен|Рекомендовано/i.test(body || '');
    console.log(`  Метрики: ${hasMetrics ? '✓' : '✗'}`);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-bid-comparison.png', fullPage: true });
  });
});


test.describe('CRM — Лиды и Dashboard', () => {

  test('4.1 CRM Dashboard — метрики', async ({ page }) => {
    await page.goto('/crm/dashboard');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');

    await page.screenshot({ path: 'e2e/screenshots/crm-dashboard-full.png', fullPage: true });
  });

  test('4.2 Список лидов — pipeline view', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    // Должны быть колонки стадий
    const hasStages = /Новый|Квалификация|Предложение|Переговоры/i.test(body || '');
    console.log(`  Стадии pipeline: ${hasStages ? '✓' : '✗'}`);

    await page.screenshot({ path: 'e2e/screenshots/crm-leads-pipeline.png', fullPage: true });
  });

  test('4.3 Детальная страница лида', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    const leadCard = page.locator('[class*="cursor-pointer"]').first();
    if (await leadCard.count() > 0) {
      await leadCard.click();
      await page.waitForURL('**/crm/leads/**', { timeout: 10000 });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'e2e/screenshots/crm-lead-detail-full.png', fullPage: true });
    }
  });

  test('4.4 Создание лида — форма', async ({ page }) => {
    await page.goto('/crm/leads/new');
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    const hasForm = /название|компания|контакт|бюджет|источник/i.test(body || '');
    console.log(`  Форма создания лида: ${hasForm ? '✓' : '✗'}`);

    await page.screenshot({ path: 'e2e/screenshots/crm-lead-form-new.png', fullPage: true });
  });
});


test.describe('Навигация — Портфель в меню', () => {

  test('5.1 Навигация Портфель → подразделы', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Ищем пункт "Портфель" в сайдбаре
    const portfolioNav = page.locator('nav a, nav button, aside a, aside button, [class*="sidebar"] a').filter({
      hasText: /Портфель/i
    }).first();

    if (await portfolioNav.count() > 0) {
      console.log('  Меню "Портфель" найдено ✓');
    } else {
      console.log('  Меню "Портфель" не найдено — ищем в подменю');
    }

    // Проверяем что все маршруты доступны
    const routes = [
      { path: '/portfolio/opportunities', name: 'Возможности' },
      { path: '/portfolio/tenders', name: 'Тендеры' },
      { path: '/portfolio/bid-comparison', name: 'Сравнение предложений' },
      { path: '/crm/dashboard', name: 'CRM Dashboard' },
      { path: '/crm/leads', name: 'CRM Лиды' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForTimeout(1500);
      const status = page.url().includes(route.path) ? '✓' : '✗';
      console.log(`  ${route.name} (${route.path}): ${status}`);
    }

    await page.screenshot({ path: 'e2e/screenshots/portfolio-nav-check.png', fullPage: true });
  });
});


test.describe('Тёмная тема — портфельный модуль', () => {

  test('6.1 Dark mode — тендеры', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    // Включаем dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/portfolio-tenders-dark.png', fullPage: true });
    console.log('  Dark mode — тендеры: скриншот сохранён');
  });
});


test.describe('Проверка отсутствия английского текста', () => {

  test('7.1 Тендеры — нет английских строк в UI', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');

    // Проверяем на наличие сырых ключей i18n (portfolio.tenders.*, forms.bid.*)
    const rawKeys = body?.match(/portfolio\.\w+\.\w+|forms\.bid\.\w+/g);
    if (rawKeys && rawKeys.length > 0) {
      console.log(`  ❌ Найдены сырые i18n ключи: ${rawKeys.join(', ')}`);
    } else {
      console.log('  ✓ Сырых i18n ключей нет');
    }

    // Проверяем на типичные английские слова которых не должно быть
    const englishPatterns = [
      /\bDraft\b(?!.*BP-)/,
      /\bSubmitted\b/,
      /\bUnder Evaluation\b/,
      /\bWon\b(?!.*\d)/,
      /\bLost\b(?!.*\d)/,
      /\bNo Bid\b/,
      /\bSearch\b/,
      /\bFilter\b/,
      /\bDelete\b/,
      /\bCreate\b/,
      /\bEdit\b(?!.*edit)/,
    ];

    const englishFound: string[] = [];
    for (const pattern of englishPatterns) {
      if (pattern.test(body || '')) {
        englishFound.push(pattern.source);
      }
    }

    if (englishFound.length > 0) {
      console.log(`  ⚠ Английские слова в UI: ${englishFound.join(', ')}`);
    } else {
      console.log('  ✓ Весь UI на русском');
    }
  });

  test('7.2 Детальная тендера — нет английских строк', async ({ page }) => {
    await page.goto('/portfolio/tenders');
    await page.waitForTimeout(2000);

    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForURL('**/portfolio/tenders/**', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const body = await page.textContent('body');
      const rawKeys = body?.match(/portfolio\.\w+\.\w+|forms\.bid\.\w+|common\.\w+/g);
      if (rawKeys && rawKeys.length > 0) {
        console.log(`  ❌ Сырые ключи на детальной: ${rawKeys.join(', ')}`);
      } else {
        console.log('  ✓ Детальная страница — весь текст на русском');
      }
    }
  });
});
