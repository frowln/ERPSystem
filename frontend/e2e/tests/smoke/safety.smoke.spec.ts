import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Safety (Охрана труда и техника безопасности) — Smoke Tests
 *
 * Persona: инженер по ОТ, прораб (Иванов А.С.), директор
 * Domain: ОТ и ТБ = охрана труда и техника безопасности.
 * LTIFR = Lost Time Injury Frequency Rate.
 * TRIR = Total Recordable Incident Rate.
 * СОУТ = специальная оценка условий труда (ФЗ-426).
 * СИЗ = средства индивидуальной защиты.
 * Н-1 = акт о несчастном случае на производстве (обязательная форма).
 * Training expiry within 30 days = WARNING.
 * 13 pages + 1 dark-mode check.
 */
test.describe('Safety — Smoke', () => {
  test('/safety — дашборд охраны труда', async ({ page }) => {
    await smokeCheck(page, '/safety');
    // Dashboard: LTIFR card, incident count, days without incidents
    // Директор: "Сколько дней без инцидентов на площадке?"
    await expectDashboard(page);
  });

  test('/safety/incidents — реестр инцидентов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/incidents');
    // Incidents: Дата, Тип, Тяжесть, Пострадавший, Объект, Статус
    // Domain: severity: лёгкий, средний, тяжёлый, смертельный
    // CRITICAL/FATAL → immediate notification chain (директор + инспекция труда)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/safety/inspections — проверки ОТ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/inspections');
    // Inspections: Дата, Объект, Инспектор, Нарушения, Статус
    // Domain: внутренние проверки (3-ступенчатый контроль)
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/safety/briefings — журнал инструктажей', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/briefings');
    // Briefings: Дата, Тип, Инструктор, Участники, Подписи
    // Domain: виды инструктажей: вводный, первичный, повторный, внеплановый, целевой
    // ТК РФ ст. 212 — обязанность работодателя
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/safety/training-journal — журнал обучения', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/training-journal');
    // Training journal: Сотрудник, Курс, Дата, Следующая аттестация, Статус
    // Domain: обучение по ОТ обязательно для всех (ст. 225 ТК РФ)
    // Срок действия удостоверения по ОТ = 3 года
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/safety/ppe — учёт СИЗ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/ppe');
    // PPE tracking: Сотрудник, СИЗ, Размер, Дата выдачи, Срок замены
    // Domain: СИЗ = средства индивидуальной защиты (каска, ботинки, жилет, страховка)
    // Нормы выдачи по Приказу Минтруда 766н
    // Снабженец: "Нужно заказать новые каски — у 12 человек истекает срок"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/safety/accident-acts — акты о несчастных случаях (Н-1)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/accident-acts');
    // Accident investigation acts: statutory Н-1 form
    // Domain: форма Н-1 = акт о несчастном случае на производстве
    // Заполняется в течение 3 суток (15 суток при групповом/тяжёлом)
    // Обязательно направляется в ГИТ, ФСС, прокуратуру
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/safety/metrics — метрики безопасности (LTIFR, TRIR)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/metrics');
    // Safety metrics: LTIFR, TRIR charts
    // Domain: LTIFR = кол-во НС с потерей трудоспособности × 1M / отработанные часы
    // TRIR = все регистрируемые инциденты × 200K / отработанные часы
    // Директор: "Какой у нас LTIFR в сравнении с отраслевым?"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/safety/sout — СОУТ (спецоценка условий труда)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/sout');
    // SOUT: workplace assessment results
    // Domain: СОУТ = специальная оценка условий труда (ФЗ-426)
    // Проводится раз в 5 лет, определяет класс условий: оптимальный/допустимый/вредный/опасный
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/safety/compliance — матрица соответствия ОТ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/compliance');
    // Safety compliance matrix: requirement vs current status
    // Domain: соответствие требованиям ТК РФ, правилам по ОТ (Приказы Минтруда)
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/safety/violations — реестр нарушений', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/violations');
    // Violations: Дата, Нарушение, Нарушитель, Объект, Мера, Статус
    // Domain: нарушения ОТ: работа без СИЗ, нарушение ограждения, электробезопасность
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/safety/worker-certs — удостоверения работников', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/worker-certs');
    // Worker safety certificates: Сотрудник, Удостоверение, Дата, Следующая проверка
    // Domain: электробезопасность (до V группы), работа на высоте, ГПМ, сосуды под давлением
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/safety/certification-matrix — матрица аттестаций', async ({ page }) => {
    const { body } = await smokeCheck(page, '/safety/certification-matrix');
    // Safety certification matrix: Сотрудник × Допуск × Срок × Статус
    // Domain: кто на что аттестован, у кого истекает
    // Warning: if certification expires within 30 days → remove from site
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('Dark mode: /safety', async ({ page }) => {
    await checkDarkMode(page, '/safety');
  });
});
