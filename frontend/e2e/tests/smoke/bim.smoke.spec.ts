import { test } from '@playwright/test';
import { smokeCheck } from '../../helpers/smoke.helper';

/**
 * BIM Module — Smoke Tests
 *
 * Persona: инженер / прораб
 * 6 pages under /bim/*
 * Note: BIM pages may show placeholder if no 3D models uploaded.
 * Mark [MISSING] if no real functionality beyond stub.
 */
test.describe('BIM — Smoke', () => {
  test('/bim/models — BIM модели', async ({ page }) => {
    await smokeCheck(page, '/bim/models');
  });

  test('/bim/clash-detection — поиск коллизий', async ({ page }) => {
    await smokeCheck(page, '/bim/clash-detection');
  });

  test('/bim/drawing-overlay — наложение чертежей', async ({ page }) => {
    await smokeCheck(page, '/bim/drawing-overlay');
  });

  test('/bim/drawing-pins — пины на чертежах', async ({ page }) => {
    await smokeCheck(page, '/bim/drawing-pins');
  });

  test('/bim/construction-progress — ход строительства BIM', async ({
    page,
  }) => {
    await smokeCheck(page, '/bim/construction-progress');
  });

  test('/bim/defect-heatmap — тепловая карта дефектов', async ({ page }) => {
    await smokeCheck(page, '/bim/defect-heatmap');
  });
});
