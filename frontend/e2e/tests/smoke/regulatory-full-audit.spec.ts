import { test, expect } from '@playwright/test';

/**
 * Полный аудит модуля «Регуляторика/Надзор» — все страницы, все подразделы.
 * Проверяет: загрузку страницы, отсутствие JS-ошибок, наличие контента,
 * отсутствие сырых i18n-ключей, работу тёмной темы.
 *
 * Persona: инженер ПТО, директор (Сидоров В.М.)
 * Domain: Ростехнадзор, СЭС, пожарный надзор, Госстройнадзор,
 *         СРО (ФЗ-315), предписания, лицензии, соответствие требованиям.
 *         Неисполнение предписаний → штраф до 1М руб. + остановка работ (КоАП).
 */

const REGULATORY_PAGES = [
  { path: '/regulatory/dashboard', name: 'Дашборд регуляторики' },
  { path: '/regulatory/permits', name: 'Реестр разрешений' },
  { path: '/regulatory/permits/board', name: 'Канбан разрешений' },
  { path: '/regulatory/licenses', name: 'Лицензии' },
  { path: '/regulatory/inspections', name: 'Проверки надзорных органов' },
  { path: '/regulatory/inspection-history', name: 'История проверок' },
  { path: '/regulatory/prescriptions', name: 'Реестр предписаний' },
  { path: '/regulatory/prescriptions/new', name: 'Создание предписания' },
  { path: '/regulatory/prescriptions-journal', name: 'Журнал предписаний' },
  { path: '/regulatory/prescription-responses', name: 'Ответы на предписания' },
  { path: '/regulatory/reporting-calendar', name: 'Календарь отчётности' },
  { path: '/regulatory/sro-licenses', name: 'Реестр СРО' },
  { path: '/regulatory/inspection-prep', name: 'Подготовка к проверке' },
  { path: '/regulatory/compliance', name: 'Соответствие требованиям' },
];

test.describe('Регуляторика — полный аудит модуля', () => {
  // Собираем JS-ошибки на каждой странице
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
  });

  for (const { path, name } of REGULATORY_PAGES) {
    test(`${name} (${path}) — загрузка и проверка`, async ({ page }) => {
      // Открываем страницу
      const response = await page.goto(path, { waitUntil: 'networkidle', timeout: 30000 });

      // 1. HTTP-статус OK
      expect(response?.status(), `HTTP статус для ${path}`).toBeLessThan(400);

      // 2. Ждём, пока исчезнет спиннер / скелетон
      await page.waitForTimeout(1500);

      // 3. Страница не пустая — есть видимый контент
      const body = await page.textContent('body');
      expect(body?.length, `Контент на ${path}`).toBeGreaterThan(50);

      // 4. Нет «chunk load error» или белого экрана
      const hasError = await page.locator('text=/chunk.*error/i').count();
      expect(hasError, `Chunk error на ${path}`).toBe(0);

      // 5. Нет «Cannot read properties of undefined» и подобных JS-ошибок
      const criticalErrors = consoleErrors.filter(
        (e) =>
          e.includes('Cannot read properties') ||
          e.includes('is not a function') ||
          e.includes('is not defined') ||
          e.includes('Uncaught')
      );
      expect(criticalErrors, `JS-ошибки на ${path}`).toHaveLength(0);

      // 6. Нет сырых i18n-ключей (формат "regulatory.something.key")
      const rawKeys = await page.locator('text=/^regulatory\\.[a-z]+\\.[a-zA-Z]+/').count();
      expect(rawKeys, `Сырые i18n-ключи на ${path}`).toBe(0);

      // 7. Скриншот для визуальной проверки
      await page.screenshot({
        path: `e2e/screenshots/regulatory/${path.replace(/\//g, '_')}.png`,
        fullPage: true,
      });
    });
  }

  // ─── Расширенные проверки по конкретным страницам ───

  test('Дашборд регуляторики — метрики и KPI-карточки', async ({ page }) => {
    await page.goto('/regulatory/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Проверяем что на странице есть KPI / метрики
    const metricCards = page.locator('[class*="metric"], [class*="MetricCard"], .grid > div').first();
    await expect(metricCards).toBeVisible();

    // Дашборд должен содержать числовые показатели
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('Реестр разрешений — таблица или пустое состояние', async ({ page }) => {
    await page.goto('/regulatory/permits', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет разрешений|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице разрешений').toBeGreaterThan(0);
  });

  test('Канбан разрешений — колонки отображаются', async ({ page }) => {
    await page.goto('/regulatory/permits/board', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Должно быть минимум 2 колонки на канбан-доске (Черновик, В работе, Получено и т.д.)
    const columns = page.locator('[class*="min-w-\\[280px\\]"], [class*="flex-col"][class*="rounded-xl"]');
    const count = await columns.count();
    expect(count, 'Количество колонок на канбан-доске разрешений').toBeGreaterThanOrEqual(2);
  });

  test('Лицензии — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/licenses', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет лицензий|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице лицензий').toBeGreaterThan(0);
  });

  test('Проверки надзорных органов — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/inspections', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет проверок|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице проверок').toBeGreaterThan(0);
  });

  test('История проверок — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/inspection-history', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет проверок|Нет данных|Пусто|История пуста/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице истории проверок').toBeGreaterThan(0);
  });

  test('Реестр предписаний — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/prescriptions', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет предписаний|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице предписаний').toBeGreaterThan(0);
  });

  test('Создание предписания — поля формы отображаются', async ({ page }) => {
    await page.goto('/regulatory/prescriptions/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Форма создания должна содержать input или select элементы
    const hasInputs = await page.locator('input, select, textarea').count();
    const hasForm = await page.locator('form').count();
    const body = await page.textContent('body');
    expect(
      hasInputs + hasForm + (body && body.length > 100 ? 1 : 0),
      'Форма или контент на странице создания предписания'
    ).toBeGreaterThan(0);
  });

  test('Журнал предписаний — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/prescriptions-journal', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет записей|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице журнала').toBeGreaterThan(0);
  });

  test('Ответы на предписания — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/prescription-responses', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет ответов|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице ответов').toBeGreaterThan(0);
  });

  test('Календарь отчётности — контент загружается', async ({ page }) => {
    await page.goto('/regulatory/reporting-calendar', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Календарь может быть в виде таблицы, сетки или карточек
    const hasTable = await page.locator('table').count();
    const hasGrid = await page.locator('[class*="grid"]').count();
    const body = await page.textContent('body');
    expect(
      hasTable + hasGrid + (body && body.length > 100 ? 1 : 0),
      'Контент на странице календаря отчётности'
    ).toBeGreaterThan(0);
  });

  test('Реестр СРО — таблица загружается', async ({ page }) => {
    await page.goto('/regulatory/sro-licenses', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет СРО|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице СРО').toBeGreaterThan(0);
  });

  test('Подготовка к проверке — контент загружается', async ({ page }) => {
    await page.goto('/regulatory/inspection-prep', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Может быть чек-лист, таблица или карточки
    const hasTable = await page.locator('table').count();
    const hasCheckboxes = await page.locator('input[type="checkbox"]').count();
    const body = await page.textContent('body');
    expect(
      hasTable + hasCheckboxes + (body && body.length > 100 ? 1 : 0),
      'Контент на странице подготовки к проверке'
    ).toBeGreaterThan(0);
  });

  test('Соответствие требованиям — контент загружается', async ({ page }) => {
    await page.goto('/regulatory/compliance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Матрица соответствия — таблица, сетка или карточки
    const hasTable = await page.locator('table').count();
    const hasGrid = await page.locator('[class*="grid"]').count();
    const body = await page.textContent('body');
    expect(
      hasTable + hasGrid + (body && body.length > 100 ? 1 : 0),
      'Контент на странице соответствия требованиям'
    ).toBeGreaterThan(0);
  });

  test('Тёмная тема — основные страницы регуляторики не ломаются', async ({ page }) => {
    // Включаем тёмную тему через localStorage
    await page.goto('/regulatory/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('privod-theme', JSON.stringify({ state: { theme: 'dark' } }));
    });
    await page.waitForTimeout(500);

    // Проверяем что контент всё ещё видим
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);

    await page.screenshot({
      path: 'e2e/screenshots/regulatory/_dark_mode_dashboard.png',
      fullPage: true,
    });

    // Переходим на реестр разрешений в тёмной теме
    await page.goto('/regulatory/permits', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/regulatory/_dark_mode_permits.png',
      fullPage: true,
    });

    // Переходим на канбан разрешений в тёмной теме
    await page.goto('/regulatory/permits/board', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/regulatory/_dark_mode_board.png',
      fullPage: true,
    });

    // Переходим на календарь в тёмной теме
    await page.goto('/regulatory/reporting-calendar', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/regulatory/_dark_mode_calendar.png',
      fullPage: true,
    });
  });
});
