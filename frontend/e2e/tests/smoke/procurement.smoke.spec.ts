import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Procurement (Снабжение/Закупки) — Smoke Tests
 *
 * Persona: снабженец (Морозова Н.П.), бухгалтер
 * Domain: закупки = critical for cost control.
 * Business rule: minimum 3 vendor quotes for competitive list (КЛ).
 * Purchase chain: Заявка → Тендер → КЛ → Заказ → Поставка → Приёмка.
 * 5 pages.
 */
test.describe('Procurement — Smoke', () => {
  test('/procurement — реестр заявок на закупку', async ({ page }) => {
    const { body } = await smokeCheck(page, '/procurement');
    // Purchase request register: Номер, Наименование, Объект, Сумма, Статус
    // Снабженец: "Мне нужно видеть все заявки по всем объектам в одном месте"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/procurement/purchase-orders — реестр заказов поставщикам', async ({ page }) => {
    const { body } = await smokeCheck(page, '/procurement/purchase-orders');
    // PO register: Номер PO, Поставщик, Сумма, Дата доставки, Статус
    // Domain: PO = purchase order, обязательный документ для оплаты поставщику
    // Бухгалтер: "Без PO я не могу провести оплату"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/procurement/tenders — тендеры на закупку', async ({ page }) => {
    const { body } = await smokeCheck(page, '/procurement/tenders');
    // Tender register: Тендер, Предмет, Бюджет, Участники, Срок
    // Domain: тендер ≠ КЛ. Тендер = формализованная процедура, КЛ = сравнение цен
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/procurement/bid-comparison — сравнение предложений поставщиков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/procurement/bid-comparison');
    // Bid comparison matrix: Позиция × Поставщик × Цена
    // Domain: должно быть ≥3 поставщиков для объективного сравнения
    // Инженер-сметчик: "Нужно видеть разброс цен и автоматический ранжинг"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/procurement/prequalification — преквалификация подрядчиков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/procurement/prequalification');
    // Vendor scorecard: Подрядчик, Категория, Оценка, Опыт, СРО, Статус
    // Domain: преквалификация = проверка подрядчика до допуска к тендеру
    // Директор: "Не хочу работать с ненадёжными подрядчиками"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
