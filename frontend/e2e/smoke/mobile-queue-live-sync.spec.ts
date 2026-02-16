import { expect, test } from '@playwright/test';

const QUEUE_KEY = 'mobile_field_report_submission_queue_v1';
const QUEUE_UPDATED_EVENT = 'mobile_submission_queue_updated';

const queueFixture = [
  {
    id: 'queue-live-1',
    payload: {
      title: 'Live queue sync',
      description: 'Проверка live обновления очереди',
      projectId: '1',
      reportDate: '2026-02-15',
    },
    photos: [
      {
        assetId: 'photo-live-1',
        fileName: 'live-1.jpg',
        fileType: 'image/jpeg',
        fileSize: 64000,
        lastModified: 1760000000000,
      },
      {
        assetId: 'photo-live-2',
        fileName: 'live-2.jpg',
        fileType: 'image/jpeg',
        fileSize: 65000,
        lastModified: 1760000001000,
      },
    ],
    status: 'queued',
    attempts: 0,
    queuedAt: '2026-02-15T09:00:00.000Z',
  },
];

test.describe('Mobile queue live sync UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, JSON.stringify([]));
    }, QUEUE_KEY);
  });

  test('updates queue banner on reports page without reload', async ({ page }) => {
    await page.goto('/mobile/reports');

    await page.evaluate(
      ([key, eventName, queue]) => {
        window.localStorage.setItem(key, JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent(eventName, { detail: queue }));
      },
      [QUEUE_KEY, QUEUE_UPDATED_EVENT, queueFixture],
    );

    await expect(page.locator('body')).toContainText('Локальная очередь: 1 отчёт(ов), 2 фото.');
  });

  test('updates queue banner on photos page without reload', async ({ page }) => {
    await page.goto('/mobile/photos');

    await page.evaluate(
      ([key, eventName, queue]) => {
        window.localStorage.setItem(key, JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent(eventName, { detail: queue }));
      },
      [QUEUE_KEY, QUEUE_UPDATED_EVENT, queueFixture],
    );

    await expect(page.locator('body')).toContainText('В локальной очереди: 2 фото из 1 отчёт(ов).');
  });
});
