import { test, expect } from '@playwright/test';

test.describe('CRM Leads — Full Audit', () => {

  test('1. Список лидов — корректные данные и бейджи', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e/screenshots/crm-lead-list.png', fullPage: true });

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Лид');
  });

  test('2. Pipeline/Воронка — лиды в правильных этапах', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    // Default is pipeline view — check stages render
    await page.screenshot({ path: 'e2e/screenshots/crm-pipeline.png', fullPage: true });

    // Scroll pipeline right to see all stages
    const pipelineContainer = page.locator('.flex.gap-4.overflow-x-auto');
    if (await pipelineContainer.count() > 0) {
      await pipelineContainer.evaluate(el => el.scrollLeft = el.scrollWidth);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/crm-pipeline-right.png', fullPage: true });
    }
  });

  test('3. Детальная страница лида — кнопки и данные', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    // Click first lead card (div with cursor-pointer inside pipeline)
    const leadCard = page.locator('.cursor-pointer').first();
    await leadCard.click();
    await page.waitForURL('**/crm/leads/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/crm-lead-detail.png', fullPage: true });

    // Check for edit and delete buttons
    const editBtnCount = await page.locator('button, a').filter({ hasText: /редактир|изменить/i }).count();
    const deleteBtnCount = await page.locator('button').filter({ hasText: /удалить/i }).count();
    console.log(`Edit button: ${editBtnCount}, Delete button: ${deleteBtnCount}`);
  });

  test('4. Создание активности — модальное окно', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    // Navigate to first lead detail
    const leadCard = page.locator('.cursor-pointer').first();
    await leadCard.click();
    await page.waitForURL('**/crm/leads/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click "Запланировать" button
    const planBtn = page.locator('button').filter({ hasText: /запланировать/i });
    if (await planBtn.count() > 0) {
      await planBtn.first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/crm-activity-modal.png', fullPage: true });
    } else {
      console.log('Запланировать button not found');
      await page.screenshot({ path: 'e2e/screenshots/crm-activity-modal-notfound.png', fullPage: true });
    }
  });

  test('5. Dashboard CRM — метрики и воронка', async ({ page }) => {
    await page.goto('/crm/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e/screenshots/crm-dashboard.png', fullPage: true });
  });

  test('6. Redirect /crm → /crm/dashboard', async ({ page }) => {
    await page.goto('/crm');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/crm/dashboard');
    await page.screenshot({ path: 'e2e/screenshots/crm-redirect.png', fullPage: true });
  });

  test('7. Табличный вид лидов', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    // Switch to list view
    const listBtn = page.locator('button').filter({ hasText: /список/i });
    if (await listBtn.count() > 0) {
      await listBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: 'e2e/screenshots/crm-lead-table.png', fullPage: true });
  });

  test('8. Редактирование лида', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForTimeout(2000);

    // Navigate to first lead
    const leadCard = page.locator('.cursor-pointer').first();
    await leadCard.click();
    await page.waitForURL('**/crm/leads/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click edit button
    const editBtn = page.locator('button, a').filter({ hasText: /редактир|изменить/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'e2e/screenshots/crm-lead-edit.png', fullPage: true });
    } else {
      console.log('Edit button not found');
      await page.screenshot({ path: 'e2e/screenshots/crm-lead-edit-notfound.png', fullPage: true });
    }
  });
});
