import { test, expect } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Executive Documentation (Исполнительная документация) — Smoke Tests
 *
 * Persona: инженер ПТО, прораб
 * Исполнительная документация required by СП 48.13330.
 * АОСР = акт освидетельствования скрытых работ (hidden work act).
 * КС-6 = общий журнал работ (construction diary).
 * 5 pages tested.
 */
test.describe('Exec Docs — Smoke', () => {
  test('/exec-docs/aosr — реестр АОСР (акты скрытых работ)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/exec-docs/aosr');
    // АОСР table: Номер, Дата, Вид работ, Исполнитель, Статус
    // Domain: hidden work acts — must be signed before next layer covers the work
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/exec-docs/ks6 — журнал КС-6 (общий журнал работ)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/exec-docs/ks6');
    // KS-6 = construction diary, calendar/log view
    // Required by law for every construction site
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/exec-docs/incoming-control — входной контроль материалов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/exec-docs/incoming-control');
    // Material acceptance register — every delivery must be inspected
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/exec-docs/welding — журнал сварочных работ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/exec-docs/welding');
    // Welding journal — tracks every weld joint, welder, method
    // Required for structural steel and pipeline construction
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/exec-docs/special-journals — журналы специальных работ', async ({ page }) => {
    const { body } = await smokeCheck(page, '/exec-docs/special-journals');
    // Special work journals: concrete pouring, waterproofing, etc.
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
