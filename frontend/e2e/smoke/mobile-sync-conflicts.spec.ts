import { expect, test } from '@playwright/test';

const QUEUE_KEY = 'mobile_field_report_submission_queue_v1';

const queueFixture = [
  {
    id: 'queue-conflict-1',
    payload: {
      title: 'Оффлайн отчёт: конфликт',
      description: 'Тестовый конфликт синхронизации',
      projectId: '1',
      reportDate: '2026-02-15',
    },
    photos: [
      {
        assetId: 'photo-asset-1',
        fileName: 'conflict-photo.jpg',
        fileType: 'image/jpeg',
        fileSize: 128000,
        lastModified: 1760000000000,
      },
    ],
    remoteId: 'report-remote-1',
    status: 'conflict',
    attempts: 2,
    lastError: 'Конфликт версии данных. Требуется ручное решение.',
    queuedAt: '2026-02-15T09:00:00.000Z',
  },
];

test.describe('Mobile sync conflict queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, queue]) => {
        window.localStorage.setItem(key, JSON.stringify(queue));
      },
      [QUEUE_KEY, queueFixture],
    );

    await page.goto('/mobile/dashboard');
    await expect(page.locator('body')).toContainText(/Требуется решение конфликтов синхронизации/i);
  });

  test('shows conflict card actions', async ({ page }) => {
    const conflictCard = page.locator('div').filter({ hasText: 'Оффлайн отчёт: конфликт' }).first();

    await expect(conflictCard).toBeVisible();
    await expect(conflictCard.getByRole('button', { name: 'Повторить' })).toBeVisible();
    await expect(conflictCard.getByRole('button', { name: 'Отправить как новый' })).toBeVisible();
    await expect(conflictCard.getByRole('button', { name: 'Удалить из очереди' })).toBeVisible();
  });

  test('resolves conflict by sending item as new', async ({ page }) => {
    const conflictCard = page.locator('div').filter({ hasText: 'Оффлайн отчёт: конфликт' }).first();
    await conflictCard.getByRole('button', { name: 'Отправить как новый' }).click();

    const queue = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, QUEUE_KEY);

    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe('queued');
    expect(queue[0].remoteId).toBeUndefined();
  });

  test('moves conflict item back to retry queue', async ({ page }) => {
    const conflictCard = page.locator('div').filter({ hasText: 'Оффлайн отчёт: конфликт' }).first();
    await conflictCard.getByRole('button', { name: 'Повторить' }).click();

    const queue = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, QUEUE_KEY);

    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe('queued');
    expect(queue[0].remoteId).toBe('report-remote-1');
  });

  test('opens confirm dialog for removing queue item', async ({ page }) => {
    const conflictCard = page.locator('div').filter({ hasText: 'Оффлайн отчёт: конфликт' }).first();
    await conflictCard.getByRole('button', { name: 'Удалить из очереди' }).click();

    await expect(page.getByRole('dialog')).toContainText('Удалить элемент из очереди синхронизации?');
  });

  test('removes queue item after confirmation', async ({ page }) => {
    const conflictCard = page.locator('div').filter({ hasText: 'Оффлайн отчёт: конфликт' }).first();
    await conflictCard.getByRole('button', { name: 'Удалить из очереди' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Удалить$/ }).click();

    const queue = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, QUEUE_KEY);

    expect(queue).toHaveLength(0);
    await expect(page.locator('body')).not.toContainText('Оффлайн отчёт: конфликт');
  });
});
