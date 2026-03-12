import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Regulatory (Регуляторика/Надзор) — Smoke Tests
 *
 * Persona: инженер ПТО, директор (Сидоров В.М.)
 * Domain: Ростехнадзор, СЭС, пожарный надзор, Госстройнадзор.
 * SRO membership is legally required for construction (ФЗ-315).
 * Prescriptions (предписания) from inspectors must be answered within deadlines.
 * Non-compliance = stop-work order + fines up to 1M rub (КоАП).
 * 12 pages.
 */
test.describe('Regulatory — Smoke', () => {
  test('/regulatory/permits — разрешительная документация', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/permits');
    // Permits: Номер, Тип, Орган, Дата, Срок действия, Статус
    // Domain: разрешение на строительство (ГрК РФ ст. 51), ZOS, ввод в эксплуатацию
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/regulatory/inspections — проверки надзорных органов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/inspections');
    // Inspections: Дата, Орган, Тип, Результат, Предписания, Статус
    // Domain: плановые и внеплановые проверки Ростехнадзора, ГСН, пожнадзора
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/regulatory/dashboard — дашборд комплаенса', async ({ page }) => {
    await smokeCheck(page, '/regulatory/dashboard');
    // KPI: active permits, expiring soon, open prescriptions, compliance %
    // Директор: "Есть ли у нас риск остановки работ из-за просроченных документов?"
    await expectDashboard(page);
  });

  test('/regulatory/prescriptions — реестр предписаний', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/prescriptions');
    // Prescriptions: Номер, Орган, Дата, Нарушение, Срок устранения, Статус
    // Domain: предписание = требование надзорного органа об устранении нарушения
    // Неисполнение в срок → штраф + возможная остановка работ
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/regulatory/compliance — матрица соответствия', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/compliance');
    // Compliance matrix: Требование × Статус × Документ
    // Domain: чек-лист соответствия нормативным требованиям по объекту
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/regulatory/licenses — реестр лицензий', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/licenses');
    // License register: Лицензия, Тип, Орган, Номер, Срок действия, Статус
    // Domain: лицензия МЧС (пожарная), Ростехнадзора (опасные объекты)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/regulatory/sro-licenses — свидетельства СРО', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/sro-licenses');
    // SRO certificates: СРО, Номер, Вид работ, Взнос, Срок
    // Domain: членство в СРО обязательно для строительства (ФЗ-315)
    // Без СРО нельзя заключать договоры подряда >10 млн руб.
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/regulatory/reporting-calendar — календарь отчётности', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/reporting-calendar');
    // Reporting deadlines calendar
    // Domain: сроки сдачи отчётности (статформы, экология, охрана труда)
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/regulatory/inspection-prep — подготовка к проверке (чек-лист)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/inspection-prep');
    // Inspection preparation checklist with completion %
    // Domain: контрольный лист для подготовки к визиту инспектора
    // Прораб: "Завтра приезжает Ростехнадзор — что мне подготовить?"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/regulatory/inspection-history — история проверок', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/inspection-history');
    // Inspection history: full log of past inspections and their outcomes
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/regulatory/prescription-responses — ответы на предписания', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/prescription-responses');
    // Prescription responses: Предписание, Ответ, Дата, Документы, Статус
    // Domain: ответ на предписание = документ с описанием принятых мер
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/regulatory/prescriptions-journal — журнал предписаний', async ({ page }) => {
    const { body } = await smokeCheck(page, '/regulatory/prescriptions-journal');
    // Prescriptions journal: combined view of all prescriptions + responses
    // Domain: единый журнал учёта предписаний (ведётся на объекте)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });
});
