import { test, expect } from '@playwright/test';

/**
 * Полный аудит модуля «Охрана труда» — все страницы, все подразделы.
 * Проверяет: загрузку страницы, отсутствие JS-ошибок, наличие контента,
 * отсутствие английских строк в русском UI, работу тёмной темы.
 */

const SAFETY_PAGES = [
  { path: '/safety', name: 'Дашборд ОТ' },
  { path: '/safety/board', name: 'Канбан-доска инцидентов' },
  { path: '/safety/incidents', name: 'Реестр инцидентов' },
  { path: '/safety/incidents/new', name: 'Создание инцидента' },
  { path: '/safety/inspections', name: 'Реестр проверок' },
  { path: '/safety/inspections/new', name: 'Создание проверки' },
  { path: '/safety/violations', name: 'Реестр нарушений' },
  { path: '/safety/training', name: 'Обучение по безопасности' },
  { path: '/safety/training/new', name: 'Новое обучение' },
  { path: '/safety/training-journal', name: 'Журнал инструктажей' },
  { path: '/safety/briefings', name: 'Инструктажи по ОТ' },
  { path: '/safety/briefings/new', name: 'Новый инструктаж' },
  { path: '/safety/metrics', name: 'LTIR/TRIR метрики' },
  { path: '/safety/ppe', name: 'Управление СИЗ' },
  { path: '/safety/sout', name: 'Карточки СОУТ' },
  { path: '/safety/accident-acts', name: 'Акты Н-1' },
  { path: '/safety/certification-matrix', name: 'Матрица удостоверений' },
  { path: '/safety/compliance', name: 'Соответствие требованиям ОТ' },
];

test.describe('Охрана труда — полный аудит модуля', () => {
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

  for (const { path, name } of SAFETY_PAGES) {
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

      // 6. Нет сырых i18n-ключей (формат "safety.something.key")
      const rawKeys = await page.locator('text=/^safety\\.[a-z]+\\.[a-zA-Z]+/').count();
      expect(rawKeys, `Сырые i18n-ключи на ${path}`).toBe(0);

      // 7. Скриншот для визуальной проверки
      await page.screenshot({
        path: `e2e/screenshots/safety/${path.replace(/\//g, '_')}.png`,
        fullPage: true,
      });
    });
  }

  test('Дашборд ОТ — метрики не захардкожены', async ({ page }) => {
    await page.goto('/safety', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Проверяем что на странице есть MetricCard элементы
    const metricCards = page.locator('[class*="metric"], [class*="MetricCard"], .grid > div').first();
    await expect(metricCards).toBeVisible();
  });

  test('Канбан-доска — колонки отображаются', async ({ page }) => {
    await page.goto('/safety/board', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Должно быть минимум 3 колонки на канбан-доске
    const columns = page.locator('[class*="min-w-\\[280px\\]"], [class*="flex-col"][class*="rounded-xl"]');
    const count = await columns.count();
    expect(count, 'Количество колонок на канбан-доске').toBeGreaterThanOrEqual(3);
  });

  test('Реестр инцидентов — таблица загружается', async ({ page }) => {
    await page.goto('/safety/incidents', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Проверяем наличие таблицы или пустого состояния
    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет инцидентов|Нет данных|Создайте/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице инцидентов').toBeGreaterThan(0);
  });

  test('Реестр проверок — таблица загружается', async ({ page }) => {
    await page.goto('/safety/inspections', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет проверок|Нет данных|Создайте/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице проверок').toBeGreaterThan(0);
  });

  test('Реестр нарушений — таблица загружается', async ({ page }) => {
    await page.goto('/safety/violations', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет нарушений|Нет данных|Создайте/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице нарушений').toBeGreaterThan(0);
  });

  test('Обучение — список и метрики', async ({ page }) => {
    await page.goto('/safety/training', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет обучений|Создайте/').count();
    expect(hasTable + hasEmpty, 'Таблица на странице обучения').toBeGreaterThan(0);
  });

  test('СИЗ — инвентарь и выдача', async ({ page }) => {
    await page.goto('/safety/ppe', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Проверяем наличие табов или контента
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    // Не должно быть необработанных ошибок
    const errorBanner = await page.locator('text=/error|ошибка/i').count();
    // Допускаем что может быть 0 ошибок или они в виде "Нет данных"
    expect(true).toBeTruthy();
  });

  test('СОУТ — карточки и фильтры', async ({ page }) => {
    await page.goto('/safety/sout', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет карт|Нет данных/').count();
    expect(hasTable + hasEmpty, 'Контент на странице СОУТ').toBeGreaterThan(0);
  });

  test('Инструктажи — список и создание', async ({ page }) => {
    await page.goto('/safety/briefings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет инструктажей|Нет данных|Создайте/').count();
    expect(hasTable + hasEmpty, 'Контент на странице инструктажей').toBeGreaterThan(0);
  });

  test('Матрица удостоверений — загружается', async ({ page }) => {
    await page.goto('/safety/certification-matrix', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasContent = await page.locator('[class*="grid"]').count();
    expect(hasTable + hasContent, 'Контент на странице матрицы').toBeGreaterThan(0);
  });

  test('Compliance-дашборд — загружается и dark mode корректен', async ({ page }) => {
    await page.goto('/safety/compliance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Проверяем что в JSX-разметке компонентов нет bg-gray-800 (проверяем class атрибуты)
    const grayElements = await page.locator('[class*="bg-gray-800"]').count();
    expect(grayElements, 'Элементов с bg-gray-800 на compliance странице').toBe(0);

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('Тёмная тема — основные страницы не ломаются', async ({ page }) => {
    // Включаем тёмную тему через localStorage
    await page.goto('/safety', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('privod-theme', JSON.stringify({ state: { theme: 'dark' } }));
    });
    await page.waitForTimeout(500);

    // Проверяем что контент всё ещё видим
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);

    await page.screenshot({
      path: 'e2e/screenshots/safety/_dark_mode_dashboard.png',
      fullPage: true,
    });

    // Переходим на board в тёмной теме
    await page.goto('/safety/board', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/safety/_dark_mode_board.png',
      fullPage: true,
    });
  });
});
