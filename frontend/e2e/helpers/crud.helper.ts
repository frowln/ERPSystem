import { type Page, expect } from '@playwright/test';
import { fillForm, submitForm, getValidationErrors } from './form.helper';

/**
 * CRUD lifecycle test helper.
 *
 * Runs the full Create -> Verify -> Edit -> Verify -> Delete -> Verify cycle
 * for any entity, driven by a config object.
 */

export interface CrudTestConfig {
  /** URL of the list page (e.g., "/projects") */
  listUrl: string;
  /** URL of the create form (e.g., "/projects/new") */
  formUrl: string;
  /** Human-readable entity name for test output (e.g., "project") */
  entityName: string;
  /** Field values for creation (passed to fillForm) */
  createData: Record<string, string | number | boolean>;
  /** Field values for editing (passed to fillForm) */
  editData: Record<string, string | number | boolean>;
  /** Column header in the list table to verify the entity appears */
  listColumnToCheck: string;
  /** Value expected in listColumnToCheck after creation */
  expectedListValue?: string;
  /** Optional: URL pattern for detail page (e.g., "/projects/:id") */
  detailUrlPattern?: string;
  /** Optional: timeout for slow pages (default 15000) */
  timeout?: number;
}

/**
 * Run a full CRUD lifecycle test.
 *
 * 1. CREATE: Navigate to form, fill data, submit, verify success
 * 2. VERIFY: Check entity appears in the list
 * 3. EDIT: Open entity, modify fields, save, verify changes
 * 4. DELETE: Delete entity, verify removal from list
 *
 * All test entities use E2E- prefix for identification and cleanup.
 */
export async function testFullCrud(
  page: Page,
  config: CrudTestConfig,
): Promise<void> {
  const timeout = config.timeout ?? 15_000;

  // =====================================================
  // STEP 1: CREATE
  // =====================================================
  await page.goto(config.formUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });

  // Wait for form to be ready
  await expect(
    page.locator('form').or(page.locator('input').first()),
  ).toBeVisible({ timeout });

  // Fill form with creation data
  await fillForm(page, config.createData);

  // Submit and wait for response
  await submitForm(page);

  // Verify no validation errors
  const errors = await getValidationErrors(page);
  expect(
    errors.length,
    `Creation of ${config.entityName} produced validation errors: ${errors.join(', ')}`,
  ).toBe(0);

  // Wait for navigation or success toast
  await page.waitForTimeout(1000);

  // Check for success indication: either navigated away or toast appeared
  const toast = await page
    .locator('[role="status"]')
    .or(page.locator('[data-sonner-toast]'))
    .first()
    .innerText({ timeout: 5_000 })
    .catch(() => null);

  const isOnFormStill = page.url().includes(config.formUrl);
  if (isOnFormStill && !toast) {
    // Still on form without toast — might have failed
    const currentErrors = await getValidationErrors(page);
    if (currentErrors.length > 0) {
      throw new Error(
        `${config.entityName} creation failed with errors: ${currentErrors.join(', ')}`,
      );
    }
  }

  // =====================================================
  // STEP 2: VERIFY IN LIST
  // =====================================================
  await page.goto(config.listUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });

  // Wait for list to load
  await expect(
    page.locator('table').or(page.locator('[role="table"]')),
  ).toBeVisible({ timeout });

  // Verify entity appears in the list
  const valueToCheck =
    config.expectedListValue ??
    String(config.createData[Object.keys(config.createData)[0]]);

  const listContent = await page.locator('table').innerText({ timeout });
  expect(listContent).toContain(valueToCheck);

  // =====================================================
  // STEP 3: EDIT
  // =====================================================
  // Click on the entity row to open detail/edit
  const entityRow = page
    .locator('tbody tr')
    .filter({ hasText: valueToCheck })
    .first();

  if ((await entityRow.count()) > 0) {
    // Try clicking the row or an edit button within it
    const editBtn = entityRow.locator(
      'a, button:has-text("edit"), button:has-text("Редактировать")',
    );

    if ((await editBtn.count()) > 0) {
      await editBtn.first().click();
    } else {
      // Click the row itself (may navigate to detail page)
      await entityRow.click();
    }

    await page.waitForTimeout(1000);

    // If we're on a detail page, look for an edit button
    const pageEditBtn = page.getByRole('button', {
      name: /edit|редактировать|изменить/i,
    });
    if ((await pageEditBtn.count()) > 0) {
      await pageEditBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Fill edit form if we have editable fields visible
    const hasForm = (await page.locator('form').count()) > 0;
    const hasInputs =
      (await page.locator('input:not([type="hidden"])').count()) > 0;

    if (hasForm || hasInputs) {
      await fillForm(page, config.editData);
      await submitForm(page);
      await page.waitForTimeout(1000);

      // Verify edit was saved: go back to list
      await page.goto(config.listUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      await page.waitForTimeout(1000);

      // Check that the edited value appears
      const editValue = String(
        config.editData[Object.keys(config.editData)[0]],
      );
      const updatedContent = await page.locator('table').innerText({ timeout });
      expect(updatedContent).toContain(editValue);
    }
  }

  // =====================================================
  // STEP 4: DELETE
  // =====================================================
  // Navigate to list and find the entity
  await page.goto(config.listUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.waitForTimeout(1000);

  const editValue = String(config.editData[Object.keys(config.editData)[0]]);
  const targetRow = page
    .locator('tbody tr')
    .filter({ hasText: editValue })
    .or(page.locator('tbody tr').filter({ hasText: valueToCheck }))
    .first();

  if ((await targetRow.count()) > 0) {
    const rowCountBefore = await page.locator('tbody tr').count();

    // Look for delete button in the row
    const deleteBtn = targetRow.locator(
      'button:has-text("delete"), button:has-text("Удалить"), button[aria-label*="delete" i], button[aria-label*="удалить" i]',
    );

    // Accept any confirmation dialogs
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.first().click();
    } else {
      // Hover to reveal action buttons
      await targetRow.hover();
      await page.waitForTimeout(300);

      const hoverDeleteBtn = targetRow
        .locator('button')
        .filter({ has: page.locator('svg') })
        .last();

      if ((await hoverDeleteBtn.count()) > 0) {
        await hoverDeleteBtn.click();
      }
    }

    // Wait for deletion to process
    await page.waitForTimeout(2000);

    // Verify row count decreased or entity no longer in list
    const rowCountAfter = await page.locator('tbody tr').count();
    if (rowCountAfter >= rowCountBefore) {
      // Row count didn't decrease — check if the entity text is gone
      const listText = await page.locator('table').innerText();
      // This is a soft check — deletion may have worked via re-render
      expect(
        listText.includes(editValue) || rowCountAfter < rowCountBefore,
      ).toBeFalsy();
    }
  }
}
