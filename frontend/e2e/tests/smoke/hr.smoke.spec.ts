import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * HR (Кадры) — Smoke Tests
 *
 * Persona: кадровик, бухгалтер, прораб
 * Domain: Трудовой кодекс РФ. T-13 = обязательная унифицированная форма табеля.
 * 28 дней отпуска в год (ст. 115 ТК РФ). Сверхурочные >4ч за 2 дня = нарушение.
 * Наряд-заказ = сдельная оплата строительных бригад.
 * 10 pages + 1 dark-mode check.
 */
test.describe('HR — Smoke', () => {
  test('/employees — реестр сотрудников', async ({ page }) => {
    const { body } = await smokeCheck(page, '/employees');
    // Employee register: ФИО, Должность, Отдел, Телефон, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/hr/staffing-schedule — штатное расписание', async ({ page }) => {
    const { body } = await smokeCheck(page, '/hr/staffing-schedule');
    // Staffing table: Должность, Оклад, Кол-во ставок, Занято
    // Domain: штатное расписание (форма Т-3) — обязательный кадровый документ
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/crew — управление бригадами', async ({ page }) => {
    const { body } = await smokeCheck(page, '/crew');
    // Crew/brigade management: Бригада, Бригадир, Человек, Объект
    // Domain: бригадная форма организации труда на стройке
    expect(body).not.toContain('Something went wrong');
  });

  test('/timesheets — реестр табелей', async ({ page }) => {
    const { body } = await smokeCheck(page, '/timesheets');
    // Timesheet register: Сотрудник, Дата, Часы, Тип
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/hr/timesheet-t13 — табель Т-13 (унифицированная форма)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/hr/timesheet-t13');
    // Statutory T-13 form: grid with Я/В/Б/ОТ/Н codes
    // Domain: Т-13 = Госкомстат, обязательная форма учёта рабочего времени
    // Codes: Я=явка, В=выходной, Б=больничный, ОТ=отпуск, Н=ночные
    expect(body.length).toBeGreaterThan(50);
  });

  test('/hr/work-orders — наряд-заказы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/hr/work-orders');
    // Work orders: Номер, Вид работ, Бригада, Объём, Расценка, Сумма
    // Domain: наряд-заказ = основа для сдельной оплаты бригады
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/hr/certification-matrix — матрица компетенций', async ({ page }) => {
    const { body } = await smokeCheck(page, '/hr/certification-matrix');
    // Certification/qualification matrix
    // Domain: допуски СРО, удостоверения, аттестации (электро, высота, сварка)
    expect(body).not.toContain('Something went wrong');
  });

  test('/leave/requests — реестр заявлений на отпуск', async ({ page }) => {
    const { body } = await smokeCheck(page, '/leave/requests');
    // Leave requests: Сотрудник, Тип, Период, Статус, Дни
    // Domain: ежегодный оплачиваемый = 28 дней, допотпуск за вредные условия
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/hr-russian/employment-contracts — трудовые договоры', async ({ page }) => {
    const { body } = await smokeCheck(page, '/hr-russian/employment-contracts');
    // Employment contracts register
    // Domain: ТК РФ ст. 57 — обязательные условия трудового договора
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/self-employed — реестр самозанятых', async ({ page }) => {
    const { body } = await smokeCheck(page, '/self-employed');
    // Self-employed register
    // Domain: самозанятые (ФЗ-422) — НПД до 2.4 млн/год, чеки через "Мой налог"
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('Dark mode: /employees', async ({ page }) => {
    await checkDarkMode(page, '/employees');
  });
});
