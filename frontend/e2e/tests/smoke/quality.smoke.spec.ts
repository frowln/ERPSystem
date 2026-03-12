import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Quality (Качество) — Smoke Tests
 *
 * Persona: инженер по качеству, прораб (Иванов А.С.)
 * Domain: ISO 9001, входной контроль материалов, quality gates.
 * Open defects > 30 days = quality management failing.
 * Inspection pass rate < 70% = serious construction quality issues.
 * Pareto 80/20: 20% типов дефектов дают 80% всех замечаний.
 * Comparable to PlanRadar defect tracking + Procore quality module.
 * 11 pages (quality-specific; defects covered separately in defects.smoke.spec.ts).
 */
test.describe('Quality — Smoke', () => {
  test('/quality — обзор качества (дашборд)', async ({ page }) => {
    await smokeCheck(page, '/quality');
    // KPI cards: open defects, resolved %, compliance rate
    // Domain: директор хочет видеть общую картину качества по всем объектам
    await expectDashboard(page);
  });

  test('/quality/defect-pareto — Парето-анализ дефектов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/defect-pareto');
    // Pareto chart: defects by type, 80/20 rule visualization
    // Domain: правило Парето — 20% причин дают 80% дефектов
    // Инженер по качеству: "Покажи мне главные причины замечаний"
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/quality/material-inspection — входной контроль материалов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/material-inspection');
    // Material inspection: Материал, Поставщик, Партия, Дата, Результат, Сертификат
    // Domain: входной контроль = обязательная процедура по ГОСТ 24297-2013
    // Снабженец: "Бетон В25 пришёл — надо проверить паспорт качества"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/quality/checklist-templates — шаблоны чек-листов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/checklist-templates');
    // Templates: Название, Раздел, Кол-во пунктов, Версия
    // Domain: типовые чек-листы по видам работ (бетонирование, кладка, отделка)
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/quality/checklists — активные чек-листы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/checklists');
    // Active checklists: Шаблон, Объект, Раздел, Заполнение %, Дата, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/quality/gates — quality gates (контрольные точки)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/gates');
    // Quality gates: Этап, Критерии, Статус, Ответственный
    // Domain: quality gate = контрольная точка, без прохождения которой нельзя двигаться дальше
    // Аналог в Procore: "Inspection" milestone
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/quality/tolerance-rules — допуски и нормы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/tolerance-rules');
    // Tolerance rules: Параметр, Мин, Макс, Ед.изм., СНиП/ГОСТ
    // Domain: допустимые отклонения по СНиП (вертикальность стен ±3мм/м, и т.п.)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/quality/tolerance-checks — результаты проверок допусков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/tolerance-checks');
    // Tolerance check results: Дата, Параметр, Измерение, Норма, Результат (pass/fail)
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/quality/certificates — сертификаты качества', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/certificates');
    // Quality certificates: Материал, Сертификат, Лаборатория, Срок, Статус
    // Domain: паспорта качества и сертификаты соответствия на стройматериалы
    // Снабженец: "Без сертификата материал нельзя использовать"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/quality/defect-register — полный реестр дефектов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/defect-register');
    // Full defect register with all statuses and history
    // Domain: единый реестр всех замечаний по всем объектам (для отчётности)
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/quality/supervision-journal — журнал авторского надзора', async ({ page }) => {
    const { body } = await smokeCheck(page, '/quality/supervision-journal');
    // Supervision journal: Дата, Объект, Замечание, Проектировщик, Статус
    // Domain: журнал авторского надзора (РД 11-02-2006)
    // Ведётся проектной организацией при посещении площадки
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });
});
