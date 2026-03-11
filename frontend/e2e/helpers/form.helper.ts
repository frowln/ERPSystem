import { type Page, expect } from '@playwright/test';

/**
 * Form interaction helpers for E2E tests.
 *
 * Auto-detects field types (input, select, textarea, checkbox, date picker)
 * and fills them accordingly.
 */

/**
 * Fill a form by mapping field labels/names/placeholders to values.
 *
 * @param page - Playwright Page
 * @param fieldMap - Record of field identifier (label text, name attr, placeholder) to value
 *
 * Field detection priority:
 * 1. label text match → find associated input
 * 2. name attribute match
 * 3. placeholder text match
 *
 * Value handling:
 * - string → fill text input / select option / textarea
 * - number → convert to string and fill
 * - boolean → toggle checkbox
 */
export async function fillForm(
  page: Page,
  fieldMap: Record<string, string | number | boolean>,
): Promise<void> {
  for (const [field, value] of Object.entries(fieldMap)) {
    // Try to find the field by multiple strategies
    const fieldLocator = await findField(page, field);

    if (!fieldLocator) {
      throw new Error(`Could not find form field: "${field}"`);
    }

    const tagName = await fieldLocator.evaluate((el) =>
      el.tagName.toLowerCase(),
    );
    const inputType = await fieldLocator
      .evaluate((el) => (el as HTMLInputElement).type?.toLowerCase() ?? '')
      .catch(() => '');

    if (typeof value === 'boolean') {
      // Checkbox / toggle
      if (inputType === 'checkbox') {
        const isChecked = await fieldLocator.isChecked();
        if (isChecked !== value) {
          await fieldLocator.click();
        }
      } else {
        // May be a toggle button/switch
        await fieldLocator.click();
      }
    } else if (tagName === 'select') {
      // Native select
      await fieldLocator.selectOption(String(value));
    } else if (tagName === 'textarea') {
      await fieldLocator.fill(String(value));
    } else if (inputType === 'date') {
      // Date input — fill with ISO format
      await fieldLocator.fill(String(value));
    } else if (inputType === 'number') {
      await fieldLocator.fill(String(value));
    } else {
      // Default: text input
      await fieldLocator.fill(String(value));
    }
  }
}

/**
 * Find a form field by label, name, or placeholder.
 */
async function findField(page: Page, identifier: string) {
  // Strategy 1: Find by associated label text
  const byLabel = page.locator(`label`).filter({ hasText: identifier });
  if ((await byLabel.count()) > 0) {
    const forAttr = await byLabel.first().getAttribute('for');
    if (forAttr) {
      const byId = page.locator(`#${CSS.escape(forAttr)}`);
      if ((await byId.count()) > 0) {
        return byId.first();
      }
    }
    // Label might wrap the input directly
    const nestedInput = byLabel
      .first()
      .locator('input, select, textarea')
      .first();
    if ((await nestedInput.count()) > 0) {
      return nestedInput;
    }
    // Look for the next sibling input (common pattern: label + input)
    const siblingInput = byLabel
      .first()
      .locator('~ input, ~ select, ~ textarea, ~ div input, ~ div select')
      .first();
    if ((await siblingInput.count()) > 0) {
      return siblingInput;
    }
  }

  // Strategy 2: Find by name attribute
  const byName = page.locator(
    `input[name="${identifier}"], select[name="${identifier}"], textarea[name="${identifier}"]`,
  );
  if ((await byName.count()) > 0) {
    return byName.first();
  }

  // Strategy 3: Find by placeholder
  const byPlaceholder = page.getByPlaceholder(identifier);
  if ((await byPlaceholder.count()) > 0) {
    return byPlaceholder.first();
  }

  // Strategy 4: Find by aria-label
  const byAria = page.locator(`[aria-label="${identifier}"]`);
  if ((await byAria.count()) > 0) {
    return byAria.first();
  }

  return null;
}

/**
 * Submit the form by clicking the submit button and waiting for a response.
 *
 * Looks for buttons with text like: Submit, Save, Create, OK,
 * Сохранить, Создать, Отправить.
 */
export async function submitForm(page: Page): Promise<void> {
  const submitBtn = page
    .getByRole('button', {
      name: /submit|save|create|ok|сохранить|создать|отправить|добавить/i,
    })
    .or(page.locator('button[type="submit"]'));

  await expect(submitBtn.first()).toBeVisible({ timeout: 5_000 });
  await expect(submitBtn.first()).toBeEnabled({ timeout: 5_000 });

  // Wait for either navigation or API response after click
  await Promise.all([
    page
      .waitForResponse(
        (resp) => resp.url().includes('/api/') && resp.status() < 500,
        { timeout: 15_000 },
      )
      .catch(() => null),
    submitBtn.first().click(),
  ]);
}

/**
 * Collect all visible validation error messages on the page.
 * Looks for common patterns: .text-red, .error, [role="alert"], .field-error.
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
  const errorLocators = page
    .locator('.text-red-500, .text-red-600, .text-destructive')
    .or(page.locator('[role="alert"]'))
    .or(page.locator('.field-error, .error-message'))
    .or(page.locator('[data-testid*="error"]'));

  const errors: string[] = [];
  const count = await errorLocators.count();

  for (let i = 0; i < count; i++) {
    const text = (await errorLocators.nth(i).innerText()).trim();
    if (text) {
      errors.push(text);
    }
  }

  return errors;
}
