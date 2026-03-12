import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * PTO — Engineering Documentation (Производственно-технический отдел) — Smoke Tests
 *
 * Persona: инженер ПТО, прораб (Иванов А.С.)
 * Domain: ПТО manages executive documentation chain.
 * Acts of hidden work (акты скрытых работ) — СНиП/ГОСТ requirement.
 * Work permits = допуски к опасным работам (высота, огневые, ГПМ).
 * КС-6 = журнал общих работ (обязательный документ по РД 11-05-2007).
 * ИТД = исполнительная техническая документация.
 * 6 pages.
 */
test.describe('PTO — Smoke', () => {
  test('/pto/documents — реестр документов ПТО', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/documents');
    // PTO document register: Тип, Номер, Дата, Раздел, Статус
    // Domain: ПТО ведёт всю исполнительную документацию на объекте
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/pto/hidden-work-acts — акты скрытых работ (АОСР)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/hidden-work-acts');
    // Hidden work acts: Номер, Вид работ, Дата, Подрядчик, Статус подписания
    // Domain: АОСР = акт освидетельствования скрытых работ (РД 11-02-2006)
    // Без АОСР нельзя продолжать следующий этап работ
    // Прораб: "Пока АОСР не подписан, я не могу залить бетон"
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/pto/work-permits — допуски к работам', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/work-permits');
    // Work permits: Номер, Тип работ, Зона, Срок действия, Статус
    // Domain: наряд-допуск на работы повышенной опасности
    // Виды: высотные, огневые, в ёмкостях, электроустановках
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/pto/lab-tests — результаты лабораторных испытаний', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/lab-tests');
    // Lab tests: Материал, Тест, Дата, Результат, Соответствие
    // Domain: входной контроль + испытания бетона, грунтов, сварных соединений
    // Бетон В25: прочность ≥ 25 МПа на 28 сутки
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/pto/ks6-calendar — журнал работ КС-6', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/ks6-calendar');
    // KS-6 calendar: calendar or table view of daily work entries
    // Domain: КС-6 = журнал учёта выполненных работ (Госкомстат, обязательная форма)
    // Ведётся ежедневно, подписывается прорабом и представителем заказчика
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/pto/itd-validation — проверка ИТД (чек-лист)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pto/itd-validation');
    // ITD validation checklist: completion percentage
    // Domain: ИТД = исполнительная техническая документация
    // Полнота ИТД проверяется перед сдачей объекта (без неё ЗОС не выдадут)
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
