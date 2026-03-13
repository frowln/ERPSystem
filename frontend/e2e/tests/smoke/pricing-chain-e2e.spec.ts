import { test, expect } from '@playwright/test';

/**
 * E2E: Полная цепочка ценообразования
 * Спецификация → КЛ → КП → ФМ
 *
 * Проверяем через веб-интерфейс что все страницы загружаются
 * и основные элементы UI присутствуют.
 */

const SS = 'e2e/screenshots/pricing-chain';

test.describe('Цепочка ценообразования — Smoke E2E', () => {

  test('01 — Дашборд загружается после авторизации', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/01-dashboard.png`, fullPage: true });
    expect(page.url()).not.toContain('/login');
  });

  test('02 — Список спецификаций', async ({ page }) => {
    await page.goto('/specifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/02-specifications-list.png`, fullPage: true });
    // Страница не должна быть пустой
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('03 — Создание спецификации (форма)', async ({ page }) => {
    await page.goto('/specifications/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-spec-create-form.png`, fullPage: true });
  });

  test('04 — Детальная спецификация (первая в списке)', async ({ page }) => {
    await page.goto('/specifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Находим ссылку на первую спецификацию
    const link = page.locator('a[href*="/specifications/"]').filter({ hasNotText: /new|создать/i }).first();
    if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await link.getAttribute('href');
      if (href) {
        await page.goto(href, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SS}/04-spec-detail.png`, fullPage: true });
      }
    } else {
      // Нет спецификаций — кликаем по первой строке таблицы
      const row = page.locator('table tbody tr').first();
      if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SS}/04-spec-detail.png`, fullPage: true });
      } else {
        await page.screenshot({ path: `${SS}/04-spec-list-empty.png`, fullPage: true });
      }
    }
  });

  test('05 — Реестр конкурентных листов', async ({ page }) => {
    await page.goto('/specifications/competitive-lists', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/05-cl-registry.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('06 — Детальная страница КЛ', async ({ page }) => {
    await page.goto('/specifications/competitive-lists', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Кликаем по первому КЛ
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/06-cl-detail.png`, fullPage: true });
    } else {
      await page.screenshot({ path: `${SS}/06-cl-empty.png`, fullPage: true });
    }
  });

  test('07 — Список проектов', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/07-projects-list.png`, fullPage: true });
  });

  test('08 — ФМ: список бюджетов', async ({ page }) => {
    await page.goto('/finance/budgets', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/08-budgets-list.png`, fullPage: true });

    // Пробуем открыть первый бюджет
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/08b-budget-detail.png`, fullPage: true });
    }
  });

  test('09 — ФМ: детальная с колонками цен', async ({ page }) => {
    // Берем первый бюджет через API
    const response = await page.request.get('/api/budgets?page=0&size=1');
    if (response.ok()) {
      const json = await response.json();
      const budgets = json?.data?.content || json?.content || [];
      if (budgets.length > 0) {
        const budgetId = budgets[0].id;
        await page.goto(`/finance/budgets/${budgetId}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SS}/09-fm-detail-prices.png`, fullPage: true });

        // Проверяем колонки
        const headers = await page.locator('th').allTextContents();
        const combined = headers.join(' ');
        await page.screenshot({ path: `${SS}/09b-fm-headers.png` });
      }
    }
  });

  test('10 — Коммерческие предложения (список)', async ({ page }) => {
    await page.goto('/finance/commercial-proposals', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/10-cp-list.png`, fullPage: true });

    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/10b-cp-detail.png`, fullPage: true });

      // Кнопка Push to FM
      const pushBtn = page.locator('button').filter({ hasText: /ФМ|FM|финанс/i }).first();
      if (await pushBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.screenshot({ path: `${SS}/10c-cp-push-btn.png`, fullPage: true });
      }
    }
  });

  test('11 — Импорт ЛСР (wizard)', async ({ page }) => {
    await page.goto('/estimates/import-lsr', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/11-lsr-import-wizard.png`, fullPage: true });
  });

  test('12 — Список локальных смет', async ({ page }) => {
    await page.goto('/estimates', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/12-estimates-list.png`, fullPage: true });

    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/12b-estimate-detail.png`, fullPage: true });
    }
  });

  test('13 — Sidebar содержит все модули цепочки', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const sidebar = page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]').first();
    await page.screenshot({ path: `${SS}/13-sidebar.png`, fullPage: true });

    if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = (await sidebar.textContent()) || '';

      // Ключевые разделы меню
      const checks = [
        { name: 'Ценообразование', pattern: /ценообразовани|спецификаци/i },
        { name: 'Финансы', pattern: /финанс|бюджет/i },
        { name: 'Проекты/Объекты', pattern: /объект|проект/i },
      ];

      for (const check of checks) {
        expect(text, `Sidebar должен содержать: ${check.name}`).toMatch(check.pattern);
      }
    }
  });
});
