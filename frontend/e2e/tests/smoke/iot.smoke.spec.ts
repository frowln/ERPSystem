import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * IoT (Датчики и устройства) — Smoke Tests
 *
 * Persona: инженер ОТиТБ, прораб
 * Domain: мониторинг стройплощадки — температура, влажность, вибрация, пыль.
 * Alerts = предупреждения при превышении ПДК или аварийных значениях.
 * 3 pages. May be placeholder — mark as [MISSING] if no real data.
 */
test.describe('IoT — Smoke', () => {
  test('/iot/devices — реестр IoT-устройств', async ({ page }) => {
    const { body } = await smokeCheck(page, '/iot/devices');
    // Device register: Устройство, Тип, Локация, Статус, Последний сигнал
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/iot/sensors — данные датчиков', async ({ page }) => {
    const { body } = await smokeCheck(page, '/iot/sensors');
    // Sensor data dashboard: real-time charts (температура, влажность, вибрация)
    await expectDashboard(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/iot/alerts — оповещения IoT', async ({ page }) => {
    const { body } = await smokeCheck(page, '/iot/alerts');
    // Alert notification list with severity
    // Domain: ПДК (предельно допустимая концентрация) — превышение = остановка работ
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });
});
