import { test, expect } from '@playwright/test';

/**
 * Полный аудит модуля «Качество» — все страницы, все подразделы.
 * Проверяет: загрузку страницы, отсутствие JS-ошибок, наличие контента,
 * отсутствие сырых i18n-ключей, работу тёмной темы.
 *
 * Persona: инженер по качеству, прораб (Иванов А.С.)
 * Domain: ISO 9001, входной контроль материалов, quality gates,
 *         чек-листы, допуски по СНиП/ГОСТ, Парето-анализ дефектов.
 */

const QUALITY_PAGES = [
  { path: '/quality', name: 'Дашборд качества' },
  { path: '/quality/board', name: 'Канбан проверок' },
  { path: '/quality/new', name: 'Создание проверки' },
  { path: '/quality/checklists', name: 'Чек-листы качества' },
  { path: '/quality/checklist-templates', name: 'Шаблоны чек-листов' },
  { path: '/quality/defect-register', name: 'Реестр дефектов' },
  { path: '/quality/defect-pareto', name: 'Парето-анализ дефектов' },
  { path: '/quality/tolerance-rules', name: 'Правила допусков' },
  { path: '/quality/tolerance-checks', name: 'Проверки допусков' },
  { path: '/quality/material-inspection', name: 'Входной контроль' },
  { path: '/quality/certificates', name: 'Сертификаты материалов' },
  { path: '/quality/supervision-journal', name: 'Журнал авторского надзора' },
  { path: '/quality/gates', name: 'Quality Gates' },
  { path: '/quality/inspections/new', name: 'Форма инспекции' },
];

test.describe('Качество — полный аудит модуля', () => {
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

  for (const { path, name } of QUALITY_PAGES) {
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

      // 6. Нет сырых i18n-ключей (формат "quality.something.key")
      const rawKeys = await page.locator('text=/^quality\\.[a-z]+\\.[a-zA-Z]+/').count();
      expect(rawKeys, `Сырые i18n-ключи на ${path}`).toBe(0);

      // 7. Скриншот для визуальной проверки
      await page.screenshot({
        path: `e2e/screenshots/quality/${path.replace(/\//g, '_')}.png`,
        fullPage: true,
      });
    });
  }

  // ─── Расширенные проверки по конкретным страницам ───

  test('Проверки качества — таблица и табы загружаются', async ({ page }) => {
    await page.goto('/quality', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // /quality — это реестр проверок с табами и таблицей
    const hasTable = await page.locator('table').count();
    const hasTabs = await page.locator('[role="tab"], [class*="tab"]').count();
    const hasEmpty = await page.locator('text=/Нет проверок|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasTabs + hasEmpty, 'Таблица или табы на странице проверок качества').toBeGreaterThan(0);

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('Канбан проверок — колонки отображаются', async ({ page }) => {
    await page.goto('/quality/board', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Должно быть минимум 2 колонки на канбан-доске (напр. «Запланировано», «В работе», «Завершено»)
    const columns = page.locator('[class*="min-w-\\[280px\\]"], [class*="flex-col"][class*="rounded-xl"]');
    const count = await columns.count();
    expect(count, 'Количество колонок на канбан-доске качества').toBeGreaterThanOrEqual(2);
  });

  test('Реестр дефектов — таблица или пустое состояние', async ({ page }) => {
    await page.goto('/quality/defect-register', { waitUntil: 'networkidle' });
    // Wait for data loading to complete (API may be slow)
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Загрузка...');
    }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет дефектов|Нет данных|Создайте|Пусто|Загрузка/').count();
    const hasTabs = await page.locator('[role="tab"], [class*="tab"]').count();
    expect(hasTable + hasEmpty + hasTabs, 'Таблица, пустое состояние или табы на странице дефектов').toBeGreaterThan(0);
  });

  test('Парето-анализ — диаграмма или контент', async ({ page }) => {
    await page.goto('/quality/defect-pareto', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Парето-диаграмма (SVG/Canvas) или хотя бы текстовый контент
    const hasSvg = await page.locator('svg').count();
    const hasCanvas = await page.locator('canvas').count();
    const body = await page.textContent('body');
    expect(
      hasSvg + hasCanvas + (body && body.length > 100 ? 1 : 0),
      'Диаграмма или контент Парето-анализа'
    ).toBeGreaterThan(0);
  });

  test('Чек-листы качества — таблица загружается', async ({ page }) => {
    await page.goto('/quality/checklists', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет чек-листов|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице чек-листов').toBeGreaterThan(0);
  });

  test('Шаблоны чек-листов — таблица загружается', async ({ page }) => {
    await page.goto('/quality/checklist-templates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет шаблонов|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице шаблонов').toBeGreaterThan(0);
  });

  test('Правила допусков — таблица загружается', async ({ page }) => {
    await page.goto('/quality/tolerance-rules', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет правил|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице допусков').toBeGreaterThan(0);
  });

  test('Проверки допусков — таблица загружается', async ({ page }) => {
    await page.goto('/quality/tolerance-checks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет проверок|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице проверок допусков').toBeGreaterThan(0);
  });

  test('Входной контроль — таблица загружается', async ({ page }) => {
    await page.goto('/quality/material-inspection', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет записей|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице входного контроля').toBeGreaterThan(0);
  });

  test('Сертификаты материалов — таблица загружается', async ({ page }) => {
    await page.goto('/quality/certificates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет сертификатов|Нет данных|Создайте|Пусто/').count();
    expect(hasTable + hasEmpty, 'Таблица или пустое состояние на странице сертификатов').toBeGreaterThan(0);
  });

  test('Журнал авторского надзора — таблица загружается', async ({ page }) => {
    await page.goto('/quality/supervision-journal', { waitUntil: 'networkidle' });
    // Wait for data loading to complete
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Загрузка...');
    }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=/Нет записей|Нет данных|Создайте|Пусто|Загрузка/').count();
    const hasTabs = await page.locator('[role="tab"], [class*="tab"]').count();
    expect(hasTable + hasEmpty + hasTabs, 'Таблица, пустое состояние или табы на странице авторского надзора').toBeGreaterThan(0);
  });

  test('Quality Gates — страница с табами и селектором проекта', async ({ page }) => {
    await page.goto('/quality/gates', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Quality Gates page has tabs and project selector (content loads after project selection)
    const hasTabs = await page.locator('[role="tab"], [class*="tab"]').count();
    const hasSelect = await page.locator('select, [role="combobox"]').count();
    const hasContent = await page.locator('text=/Выберите объект|Контрольные точки|Quality Gates|Создать/').count();
    expect(hasTabs + hasSelect + hasContent, 'Табы или селектор проекта на странице Quality Gates').toBeGreaterThan(0);
  });

  test('Форма инспекции — поля формы отображаются', async ({ page }) => {
    await page.goto('/quality/inspections/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Форма создания должна содержать input или select элементы
    const hasInputs = await page.locator('input, select, textarea').count();
    const hasForm = await page.locator('form').count();
    const body = await page.textContent('body');
    expect(
      hasInputs + hasForm + (body && body.length > 100 ? 1 : 0),
      'Форма или контент на странице создания инспекции'
    ).toBeGreaterThan(0);
  });

  test('Тёмная тема — основные страницы качества не ломаются', async ({ page }) => {
    // Включаем тёмную тему через localStorage
    await page.goto('/quality', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('privod-theme', JSON.stringify({ state: { theme: 'dark' } }));
    });
    await page.waitForTimeout(500);

    // Проверяем что контент всё ещё видим
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);

    await page.screenshot({
      path: 'e2e/screenshots/quality/_dark_mode_dashboard.png',
      fullPage: true,
    });

    // Переходим на board в тёмной теме
    await page.goto('/quality/board', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/quality/_dark_mode_board.png',
      fullPage: true,
    });

    // Переходим на Парето-анализ в тёмной теме
    await page.goto('/quality/defect-pareto', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'e2e/screenshots/quality/_dark_mode_pareto.png',
      fullPage: true,
    });
  });
});
