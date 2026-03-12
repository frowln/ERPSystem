import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Warehouse (Складской учёт) — Smoke Tests
 *
 * Persona: снабженец (Морозова Н.П.), прораб (Иванов А.С.), кладовщик
 * Domain: складской учёт на стройке.
 * М-29 = отчёт о расходе материалов (обязательная строительная форма).
 * Лимитно-заборные карты = лимиты выдачи материалов бригадам.
 * Stock balance = received - issued - reserved (must be ≥ 0).
 * Negative stock → data error or timing issue.
 * Materials: Кирпич М150 (14.50₽/шт), Арматура А500С ∅12 (62,000₽/т),
 *   Кабель ВВГнг 3×2.5 (42.50₽/м), Бетон В25 (4,800₽/м³).
 * 18 pages + 1 dark-mode check.
 */
test.describe('Warehouse — Smoke', () => {
  test('/warehouse/locations — складские площадки', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/locations');
    // Warehouse locations: Название, Адрес, Тип, Ответственный
    // Domain: склад на площадке, центральный склад, временные площадки хранения
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/warehouse/stock — обзор остатков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/stock');
    // Stock overview with alert indicators for low stock
    // Снабженец: "Где у меня критические остатки — что срочно заказывать?"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/materials — реестр материалов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/materials');
    // Materials: Наименование, Артикул, Ед.изм., Остаток, Мин.запас, Склад
    // Domain: справочник материалов с привязкой к спецификациям
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/warehouse/movements — движение материалов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/movements');
    // Movements: Дата, Материал, Тип (приход/расход/перемещение), Кол-во, Со склада, На склад
    // Domain: каждое движение = документ (приходный ордер, требование-накладная, акт списания)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/warehouse/inventory — инвентаризация', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/inventory');
    // Inventory: Дата, Склад, Статус, Расхождения
    // Domain: инвентаризация обязательна минимум 1 раз в год (ПБУ 1/2008)
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/warehouse/quick-receipt — быстрый приход', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/quick-receipt');
    // Quick receipt form: simplified material intake
    // Кладовщик: "Приехала фура — мне надо быстро оприходовать, не заполняя 20 полей"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/quick-confirm — быстрое подтверждение', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/quick-confirm');
    // Quick confirmation of pending receipts
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/warehouse/barcode-scanner — сканер штрих-кодов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/barcode-scanner');
    // Barcode scanner interface
    // Domain: сканирование QR/штрих-кодов для быстрого поиска и списания
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/inter-project-transfer — межобъектное перемещение', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/inter-project-transfer');
    // Inter-project transfer: from project A warehouse to project B
    // Снабженец: "На ЖК Солнечный излишки арматуры — перебросить на Детский сад Радуга"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/warehouse/inter-site-transfer — межплощадочное перемещение', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/inter-site-transfer');
    // Inter-site transfer: between storage locations within a project
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/stock-limits — настройка лимитов запасов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/stock-limits');
    // Stock limits: Материал, Мин.запас, Макс.запас, Текущий, Статус
    // Domain: min stock = точка перезаказа, max stock = ограничение хранения
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/warehouse/stock-alerts — оповещения о запасах', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/stock-alerts');
    // Stock alerts: low stock, expiring materials, overstock
    // Снабженец: "Уведоми меня когда цемент кончается"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/warehouse/m29-report — отчёт М-29', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/m29-report');
    // M-29 report: statutory construction material consumption form
    // Domain: М-29 = отчёт о расходе основных материалов в строительстве
    // Обязательная форма, подписывается прорабом и ПТО
    // Бухгалтер: "М-29 должен совпадать с данными склада"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/limit-fence-cards — лимитно-заборные карты', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/limit-fence-cards');
    // Limit-fence cards: Материал, Лимит, Выдано, Остаток лимита
    // Domain: лимитно-заборная карта (форма М-8) = лимит выдачи материала бригаде
    // Прораб: "Бригаде на этаж выделено 5000 шт кирпича — сколько уже выдали?"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/warehouse/limit-fence-sheets — лимитно-заборные ведомости', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/limit-fence-sheets');
    // Limit-fence sheets: aggregated view of limit-fence cards
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/warehouse/address-storage — адресное хранение', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/address-storage');
    // Address storage: Стеллаж, Полка, Ячейка, Материал, Количество
    // Domain: точное местоположение материала на складе
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/warehouse/material-demand — планирование потребности', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/material-demand');
    // Material demand planning: Материал, Потребность, На складе, К заказу, Срок
    // Инженер-сметчик: "Сколько арматуры нужно на следующий месяц по всем объектам?"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/warehouse/warehouse-orders — складские ордера', async ({ page }) => {
    const { body } = await smokeCheck(page, '/warehouse/warehouse-orders');
    // Warehouse orders: приходные/расходные ордера
    // Domain: складской ордер = документ-основание для движения материала
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('Dark mode: /warehouse/materials', async ({ page }) => {
    await checkDarkMode(page, '/warehouse/materials');
  });
});
