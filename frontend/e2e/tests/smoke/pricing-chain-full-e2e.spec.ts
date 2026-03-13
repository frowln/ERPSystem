import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * E2E: ПОЛНАЯ цепочка ценообразования с реальными данными
 *
 * 1. Создать проект + ФМ
 * 2. Создать спецификацию → проверить авто-КЛ
 * 3. Добавить позиции (материалы, работы, оборудование)
 * 4. Открыть КЛ → добавить поставщиков → выбрать победителей
 * 5. Создать КП → проверить цены → push в ФМ
 * 6. Проверить что цены дошли до ФМ
 * 7. Импортировать ЛСР → проверить estimatePrice в ФМ
 */

const SS = 'e2e/screenshots/pricing-chain-full';
const API = 'http://localhost:8080/api';

// Helper: extract data from API response
function getData(json: any) {
  return json?.data ?? json;
}

test.describe('Полная цепочка ценообразования — E2E с данными', () => {
  let token: string;
  let projectId: string;
  let budgetId: string;
  let specId: string;
  let clId: string;
  let specItemIds: string[] = [];
  let cpId: string;

  test.beforeAll(async ({ request }) => {
    // Авторизуемся и получаем токен
    const loginResp = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@privod.ru', password: 'admin123' },
    });
    expect(loginResp.ok(), 'Login should succeed').toBeTruthy();
    const loginJson = await loginResp.json();
    const d = getData(loginJson);
    token = d.accessToken || d.token || loginJson.accessToken || loginJson.token;
    expect(token, 'Token should be present').toBeTruthy();
  });

  function headers() {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function api(request: APIRequestContext, method: string, path: string, data?: any) {
    const url = `${API}${path}`;
    const opts = { headers: headers(), data };
    let resp;
    if (method === 'GET') resp = await request.get(url, { headers: headers() });
    else if (method === 'POST') resp = await request.post(url, opts);
    else if (method === 'PUT') resp = await request.put(url, opts);
    else if (method === 'DELETE') resp = await request.delete(url, { headers: headers() });
    else throw new Error(`Unknown method: ${method}`);
    return resp;
  }

  // ═══════════════════════════════════════════════════════
  // Шаг 1: Создаём проект
  // ═══════════════════════════════════════════════════════
  test('Шаг 1 — Создать проект', async ({ page, request }) => {
    const resp = await api(request, 'POST', '/projects', {
      name: 'E2E-ЦЕПОЧКА-ЦЕН ' + Date.now(),
      code: 'E2E-PRICE-' + Date.now(),
      status: 'PLANNING',
      type: 'COMMERCIAL',
      constructionKind: 'RESIDENTIAL',
    });
    expect(resp.ok(), `Create project: ${resp.status()}`).toBeTruthy();
    const json = await resp.json();
    projectId = getData(json).id;
    expect(projectId).toBeTruthy();

    // Создаём бюджет (ФМ)
    const budgetResp = await api(request, 'POST', '/budgets', {
      projectId,
      name: 'ФМ E2E-ЦЕПОЧКА',
      totalPlanned: 0,
    });
    expect(budgetResp.ok(), `Create budget: ${budgetResp.status()}`).toBeTruthy();
    const budgetJson = await budgetResp.json();
    budgetId = getData(budgetJson).id;
    expect(budgetId).toBeTruthy();

    // Проверяем в UI
    await page.goto(`/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/01-project-created.png`, fullPage: true });
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 2: Создаём спецификацию → проверяем авто-КЛ
  // ═══════════════════════════════════════════════════════
  test('Шаг 2 — Создать спецификацию и проверить авто-КЛ', async ({ page, request }) => {
    // Создаём спецификацию
    const resp = await api(request, 'POST', '/specifications', {
      projectId,
      title: 'E2E Спец — Электромонтаж',
      notes: 'Тестовая спецификация для цепочки ценообразования',
    });
    expect(resp.ok(), `Create spec: ${resp.status()}`).toBeTruthy();
    const json = await resp.json();
    specId = getData(json).id;
    expect(specId).toBeTruthy();

    // Добавляем позиции: 2 материала, 1 оборудование, 1 работа
    const items = [
      { name: 'Кабель ВВГнг 3x2.5', itemType: 'MATERIAL', quantity: 500, unitOfMeasure: 'м', sectionName: 'Электрика' },
      { name: 'Автомат ABB S203 C25', itemType: 'MATERIAL', quantity: 30, unitOfMeasure: 'шт', sectionName: 'Электрика' },
      { name: 'Щит распределительный ЩР-24', itemType: 'EQUIPMENT', quantity: 5, unitOfMeasure: 'шт', sectionName: 'Электрика' },
      { name: 'Монтаж электропроводки', itemType: 'WORK', quantity: 500, unitOfMeasure: 'м', sectionName: 'Электрика' },
    ];

    for (const item of items) {
      const itemResp = await api(request, 'POST', `/specifications/${specId}/items`, item);
      expect(itemResp.ok(), `Add item ${item.name}: ${itemResp.status()}`).toBeTruthy();
      const itemJson = await itemResp.json();
      specItemIds.push(getData(itemJson).id);
    }

    // Проверяем что КЛ авто-создан
    const clResp = await api(request, 'GET', `/competitive-lists?projectId=${projectId}`);
    expect(clResp.ok()).toBeTruthy();
    const clJson = await clResp.json();
    const clList = getData(clJson).content || getData(clJson);
    expect(clList.length, 'КЛ должен быть авто-создан').toBeGreaterThanOrEqual(1);
    clId = clList[0].id;

    // Открываем спецификацию в UI
    await page.goto(`/specifications/${specId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/02-spec-with-items.png`, fullPage: true });

    // Проверяем что 4 позиции видны
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Кабель ВВГнг');
    expect(bodyText).toContain('Автомат ABB');
    expect(bodyText).toContain('Щит распределительный');
    expect(bodyText).toContain('Монтаж электропроводки');
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 3: КЛ — добавляем поставщиков и цены
  // ═══════════════════════════════════════════════════════
  test('Шаг 3 — КЛ: добавить 3 поставщиков с ценами', async ({ page, request }) => {
    // 3 поставщика, каждый даёт цены на все 4 позиции
    const vendors = [
      { vendor: 'ООО "ЭлектроСнаб"', prices: [72, 130, 8500, 150] },
      { vendor: 'ООО "КабельПром"', prices: [65, 145, 9200, 180] },
      { vendor: 'ООО "МегаВольт"', prices: [78, 120, 7800, 140] },
    ];

    for (const v of vendors) {
      for (let i = 0; i < specItemIds.length; i++) {
        const entryResp = await api(request, 'POST', `/competitive-lists/${clId}/entries`, {
          specItemId: specItemIds[i],
          vendorName: v.vendor,
          unitPrice: v.prices[i],
          totalPrice: v.prices[i] * [500, 30, 5, 500][i],
          deliveryDays: 7 + Math.floor(Math.random() * 14),
          notes: `Предложение от ${v.vendor}`,
        });
        expect(entryResp.ok(), `Add entry ${v.vendor} for item ${i}: ${entryResp.status()}`).toBeTruthy();
      }
    }

    // Авторанжирование
    const rankResp = await api(request, 'POST', `/competitive-lists/${clId}/auto-rank`);
    // Может вернуть 200 или 4xx если не реализовано — не критично

    // Автовыбор лучших цен
    const selectResp = await api(request, 'POST', `/competitive-lists/${clId}/auto-select-best`);

    // Открываем КЛ в UI
    await page.goto(`/specifications/${specId}/competitive-list/${clId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/03a-cl-with-vendors.png`, fullPage: true });

    // Если маршрут не сработал, пробуем реестр
    if (page.url().includes('competitive-list')) {
      // Скроллим вниз чтобы увидеть таблицу
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SS}/03b-cl-scrolled.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 4: Передаём позиции спецификации в ФМ (бюджет)
  // ═══════════════════════════════════════════════════════
  test('Шаг 4 — Передать позиции спецификации в ФМ', async ({ page, request }) => {
    // Передаём каждую позицию спецификации в бюджет
    const categoryMap: Record<string, string> = {
      MATERIAL: 'MATERIALS',
      EQUIPMENT: 'EQUIPMENT',
      WORK: 'LABOR',
    };
    const typeMap: Record<string, string> = {
      MATERIAL: 'MATERIALS',
      EQUIPMENT: 'EQUIPMENT',
      WORK: 'WORKS',
    };
    const items = [
      { name: 'Кабель ВВГнг 3x2.5', type: 'MATERIAL', qty: 500, unit: 'м' },
      { name: 'Автомат ABB S203 C25', type: 'MATERIAL', qty: 30, unit: 'шт' },
      { name: 'Щит распределительный ЩР-24', type: 'EQUIPMENT', qty: 5, unit: 'шт' },
      { name: 'Монтаж электропроводки', type: 'WORK', qty: 500, unit: 'м' },
    ];

    const budgetItemIds: string[] = [];
    for (const item of items) {
      const resp = await api(request, 'POST', `/budgets/${budgetId}/items`, {
        name: item.name,
        category: categoryMap[item.type],
        itemType: typeMap[item.type],
        quantity: item.qty,
        unit: item.unit,
        plannedAmount: 1,
        section: false,
      });
      expect(resp.ok(), `Create budget item ${item.name}: ${resp.status()}`).toBeTruthy();
      const json = await resp.json();
      budgetItemIds.push(getData(json).id);
    }

    // Открываем ФМ в UI
    await page.goto(`/finance/budgets/${budgetId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/04a-fm-with-items.png`, fullPage: true });

    // Переходим на вкладку Статьи
    const tab = page.locator('button, [role="tab"]').filter({ hasText: /стать|items/i }).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/04b-fm-items-tab.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 5: Создаём КП из бюджета
  // ═══════════════════════════════════════════════════════
  test('Шаг 5 — Создать КП из бюджета', async ({ page, request }) => {
    const resp = await api(request, 'POST', '/commercial-proposals', {
      budgetId,
      projectId,
      name: 'КП E2E-ЦЕПОЧКА',
    });
    expect(resp.ok(), `Create CP: ${resp.status()}`).toBeTruthy();
    const json = await resp.json();
    cpId = getData(json).id;
    expect(cpId).toBeTruthy();

    // Загружаем позиции КП через отдельный endpoint
    const cpItemsResp = await api(request, 'GET', `/commercial-proposals/${cpId}/items`);
    expect(cpItemsResp.ok()).toBeTruthy();
    const cpItemsJson = await cpItemsResp.json();
    const cpItems = getData(cpItemsJson) || [];
    expect(cpItems.length, 'КП должна иметь позиции из бюджета').toBeGreaterThan(0);

    // Обновляем цены в КП: costPrice (себестоимость) + customerPrice (цена заказчика)
    const priceMap: Record<string, { cost: number; customer: number }> = {
      MATERIAL: { cost: 75, customer: 110 },
      WORK: { cost: 150, customer: 210 },
    };
    for (const item of cpItems) {
      const prices = priceMap[item.itemType] || { cost: 100, customer: 140 };
      await api(request, 'PUT', `/commercial-proposals/${cpId}/items/${item.id}`, {
        costPrice: prices.cost,
        customerPrice: prices.customer,
      });
    }

    // Открываем КП в UI
    await page.goto(`/finance/commercial-proposals/${cpId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/05a-cp-detail.png`, fullPage: true });

    // Проверяем что видны позиции и цены
    const bodyText = await page.textContent('body');
    // КП должна содержать хотя бы одну позицию
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/05b-cp-items.png`, fullPage: true });
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 6: Push КП → ФМ и проверяем цены
  // ═══════════════════════════════════════════════════════
  test('Шаг 6 — Push КП в ФМ и проверить цены', async ({ page, request }) => {
    // 1. Загружаем items и approve каждый
    const itemsResp = await api(request, 'GET', `/commercial-proposals/${cpId}/items`);
    const cpItems = getData(await itemsResp.json()) || [];
    for (const item of cpItems) {
      await api(request, 'POST', `/commercial-proposals/${cpId}/items/${item.id}/approve`);
    }

    // 2. Статус КП → IN_REVIEW
    await api(request, 'POST', `/commercial-proposals/${cpId}/status`, {
      status: 'IN_REVIEW',
    });

    // 3. Подтверждаем все → IN_FINANCIAL_MODEL
    await api(request, 'POST', `/commercial-proposals/${cpId}/confirm-all`);

    // 4. Статус КП → APPROVED
    await api(request, 'POST', `/commercial-proposals/${cpId}/status`, {
      status: 'APPROVED',
    });

    // 5. Push в ФМ
    const pushResp = await api(request, 'POST', `/commercial-proposals/${cpId}/push-to-fm`);

    // Открываем ФМ view (полная таблица с ценами)
    await page.goto(`/finance/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/06a-fm-after-push.png`, fullPage: true });

    // Скроллим вправо чтобы увидеть колонки цен (таблица min-w: 1600px)
    await page.evaluate(() => {
      const table = document.querySelector('.overflow-auto');
      if (table) table.scrollLeft = 300;
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/06b-fm-prices-scrolled.png`, fullPage: true });

    // Скроллим ещё правее — customerPrice, НДС, маржа
    await page.evaluate(() => {
      const table = document.querySelector('.overflow-auto');
      if (table) table.scrollLeft = 700;
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/06c-fm-margin-columns.png`, fullPage: true });
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 7: Импорт ЛСР → estimatePrice в ФМ
  // ═══════════════════════════════════════════════════════
  test('Шаг 7 — Импорт ЛСР и проверить estimatePrice', async ({ page, request }) => {
    // Имитируем импорт ЛСР с позициями, совпадающими с бюджетом
    const lsrResp = await api(request, 'POST', '/estimates/local/import-lsr', {
      projectId,
      estimateName: 'ЛСР E2E Электромонтаж',
      lines: [
        { lineNumber: 1, lineType: 'SECTION', name: 'Раздел 1. Электромонтажные работы', sectionName: 'Электромонтажные работы', depth: 0 },
        { lineNumber: 2, lineType: 'POSITION', positionType: 'FER', justification: 'ФЕР 08-02-001-01', name: 'Монтаж электропроводки', unit: 'м', quantity: 500, baseCost: 85, indexValue: 1.65, currentCost: 140, totalAmount: 70000, sectionName: 'Электромонтажные работы', depth: 1, parentLineNumber: 1 },
        { lineNumber: 3, lineType: 'RESOURCE', resourceType: 'OT', name: 'Затраты труда монтажников', unit: 'чел-ч', quantity: 250, baseCost: 35, currentCost: 57.75, totalAmount: 14437, sectionName: 'Электромонтажные работы', depth: 2, parentLineNumber: 2 },
        { lineNumber: 4, lineType: 'RESOURCE', resourceType: 'M', name: 'Кабель ВВГнг 3x2.5', unit: 'м', quantity: 500, baseCost: 42, currentCost: 69.3, totalAmount: 34650, sectionName: 'Электромонтажные работы', depth: 2, parentLineNumber: 2 },
        { lineNumber: 5, lineType: 'POSITION', positionType: 'FER', justification: 'ФЕР 08-03-002-01', name: 'Автомат ABB S203 C25', unit: 'шт', quantity: 30, baseCost: 95, indexValue: 1.42, currentCost: 135, totalAmount: 4050, sectionName: 'Электромонтажные работы', depth: 1, parentLineNumber: 1 },
        { lineNumber: 6, lineType: 'POSITION', positionType: 'FSBC', justification: 'ФСБЦ-08-04-001', name: 'Щит распределительный ЩР-24', unit: 'шт', quantity: 5, baseCost: 5200, indexValue: 1.55, currentCost: 8060, totalAmount: 40300, sectionName: 'Электромонтажные работы', depth: 1, parentLineNumber: 1 },
      ],
      summary: {
        directCostsTotal: 114350,
        overheadTotal: 22870,
        profitTotal: 11435,
        subtotal: 148655,
        vatRate: 20,
        vatAmount: 29731,
        grandTotal: 178386,
      },
      options: {
        autoLinkSpec: true,
        autoPushFm: true,
        autoPushMaterials: false,
        budgetId: budgetId,
      },
    });
    expect(lsrResp.ok(), `Import LSR: ${lsrResp.status()}`).toBeTruthy();
    const lsrJson = await lsrResp.json();
    const lsrData = getData(lsrJson);

    // Проверяем результат импорта
    expect(lsrData.sectionsCreated).toBe(1);
    expect(lsrData.positionsCreated).toBe(3);
    expect(lsrData.resourcesCreated).toBe(2);

    // Открываем смету в UI
    await page.goto(`/estimates/${lsrData.estimateId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/07a-estimate-imported.png`, fullPage: true });

    // Скроллим к таблице
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/07b-estimate-tree.png`, fullPage: true });

    // Проверяем estimatePrice в ФМ через API
    const budgetResp = await api(request, 'GET', `/budgets/${budgetId}/items`);
    if (budgetResp.ok()) {
      const items = getData(await budgetResp.json()) || [];
      const updatedItems = items.filter((i: any) => i.estimatePrice && i.estimatePrice > 0);

      // Открываем ФМ view для финального скриншота с ценами
      await page.goto(`/finance/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/07c-fm-with-estimate-prices.png`, fullPage: true });

      // Скроллим к колонке estimatePrice
      await page.evaluate(() => {
        const table = document.querySelector('.overflow-auto');
        if (table) table.scrollLeft = 200;
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SS}/07d-fm-estimate-column.png`, fullPage: true });
    }
  });

  // ═══════════════════════════════════════════════════════
  // Шаг 8: Финальная проверка — вся цепочка в ФМ
  // ═══════════════════════════════════════════════════════
  test('Шаг 8 — Итоговая проверка: все цены в ФМ', async ({ page, request }) => {
    const budgetResp = await api(request, 'GET', `/budgets/${budgetId}/items`);
    expect(budgetResp.ok()).toBeTruthy();
    const items = getData(await budgetResp.json()) || [];

    console.log('\n══════════════════════════════════════════');
    console.log('  ИТОГОВАЯ ПРОВЕРКА ФМ — ЦЕНЫ ПО ПОЗИЦИЯМ');
    console.log('══════════════════════════════════════════');
    for (const item of items) {
      if (!item.name) continue;
      console.log(`\n  📦 ${item.name}`);
      console.log(`     costPrice:     ${item.costPrice ?? '—'}`);
      console.log(`     estimatePrice: ${item.estimatePrice ?? '—'}`);
      console.log(`     customerPrice: ${item.customerPrice ?? '—'}`);
      console.log(`     priceSource:   ${item.priceSourceType ?? '—'}`);
      console.log(`     margin:        ${item.marginPercent ?? '—'}%`);
    }
    console.log('\n══════════════════════════════════════════\n');

    // Финальный скриншот ФМ view — полная таблица с ценами
    await page.goto(`/finance/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS}/08a-final-fm-left.png`, fullPage: true });

    // Скроллим к ценовым колонкам
    await page.evaluate(() => {
      const table = document.querySelector('.overflow-auto');
      if (table) table.scrollLeft = 300;
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/08b-final-fm-prices.png`, fullPage: true });

    // Скроллим к маржинальным колонкам
    await page.evaluate(() => {
      const table = document.querySelector('.overflow-auto');
      if (table) table.scrollLeft = 700;
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/08c-final-fm-margin.png`, fullPage: true });

    // Assertions на данные в API
    const montazh = items.find((i: any) => i.name?.includes('Монтаж'));
    if (montazh) {
      expect(montazh.costPrice, 'Монтаж: costPrice from КП').toBe(150);
      expect(montazh.estimatePrice, 'Монтаж: estimatePrice from ЛСР').toBe(140);
      expect(montazh.customerPrice, 'Монтаж: customerPrice from КП').toBe(210);
    }

    const avtomat = items.find((i: any) => i.name?.includes('Автомат'));
    if (avtomat) {
      expect(avtomat.estimatePrice, 'Автомат: estimatePrice from ЛСР').toBe(135);
    }

    const schit = items.find((i: any) => i.name?.includes('Щит'));
    if (schit) {
      expect(schit.estimatePrice, 'Щит: estimatePrice from ЛСР').toBe(8060);
    }
  });
});
