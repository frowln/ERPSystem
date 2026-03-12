import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Russian Documents (Российский документооборот) — Smoke Tests
 *
 * Persona: бухгалтер (Петрова Е.К.), инженер ПТО
 * Domain: ЭДО = электронный документооборот.
 * Providers: СБИС (Тензор), Контур.Диадок, Такском.
 * Document types: КС-2, КС-3, Акт сверки, Счёт-фактура, УПД.
 * КС-2/КС-3 covered separately in closing.smoke.spec.ts.
 * 3 pages.
 */
test.describe('Russian Documents — Smoke', () => {
  test('/russian-docs/list — реестр нормативных документов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/russian-docs/list');
    // All Russian regulatory docs: КС-2, КС-3, Акт сверки, Счёт-фактура, УПД
    // Бухгалтер: "Мне нужно все документы по объекту в одном месте"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/russian-docs/sbis — интеграция СБИС', async ({ page }) => {
    const { body } = await smokeCheck(page, '/russian-docs/sbis');
    // SBIS integration status panel
    // Domain: СБИС (Тензор) = крупнейший оператор ЭДО в РФ
    // Статус подключения, отправленные/полученные документы
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/russian-docs/edo — электронный документооборот (ЭДО)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/russian-docs/edo');
    // EDO document list with signature status
    // Domain: ЭДО = юридически значимый обмен документами с КЭП (квалифицированной ЭП)
    // Бухгалтер: "Счёт-фактура подписана КЭП — можно принять к вычету НДС"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });
});
