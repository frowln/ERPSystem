import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PDF_PATH = '/Users/damirkasimov/Downloads/Раздел_ПД_№5_Подраздел_ПД_№4_Том_5_4_2.pdf';
const SCREENSHOTS_DIR = path.resolve('e2e/screenshots/preconstruction-strict-ui');
const MANUAL_SPEC_LINE_FALLBACK = process.env.PRECONSTRUCTION_MANUAL_LINE === 'true';

function isCriticalError(text: string): boolean {
  const benign = [
    'Download the React DevTools',
    'React does not recognize',
    'findDOMNode is deprecated',
    'Warning:',
    'favicon.ico',
    'HMR',
    'hot update',
    '[vite]',
    'ResizeObserver',
    'Non-Error promise rejection',
    'net::ERR_',
    'Failed to load resource',
    'the server responded with a status of 4',
    "Can't perform a React state update on a component that hasn't mounted yet",
  ];
  return !benign.some((b) => text.includes(b));
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: false,
  });
}

async function gotoStable(page: Page, route: string, retries = 3) {
  for (let i = 0; i < retries; i += 1) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1200);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(800 * (i + 1));
    }
  }
}

test.describe.serial('Preconstruction strict UI-only flow', () => {
  test('project -> specification -> FM fully formed (no API fallback)', async ({ page }) => {
    test.setTimeout(180_000);

    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && isCriticalError(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      const text = err.message || String(err);
      if (isCriticalError(text)) {
        pageErrors.push(text);
      }
    });

    const runId = Date.now().toString();
    const shortId = runId.slice(-6);
    const projectCode = `UI-${shortId}`;
    const projectName = `UI Strict Preconstruction ${shortId}`;
    const specName = `UI Spec ${shortId}`;

    let projectId = '';
    let specId = '';
    let budgetId = '';

    // 1) Create project
    await gotoStable(page, '/projects/new');
    await screenshot(page, '01-project-form-empty');

    const codeInput = page.locator('input[name="code"]')
      .or(page.getByPlaceholder('2024-МСК-001'))
      .first();
    await expect(codeInput).toBeVisible({ timeout: 10_000 });
    await codeInput.fill(projectCode);

    const nameInput = page.locator('input[name="name"]')
      .or(page.getByPlaceholder('Введите название объекта'))
      .first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(projectName);

    const kindSelect = page.locator('select[name="constructionKind"]')
      .or(page.locator('select').filter({ has: page.locator('option[value="RECONSTRUCTION"]') }))
      .first();
    await expect(kindSelect).toBeVisible({ timeout: 10_000 });
    await kindSelect.selectOption('RECONSTRUCTION');

    const customerInput = page.locator('input[name="customerName"]')
      .or(page.getByPlaceholder(/заказчик|начните вводить/i))
      .first();
    await expect(customerInput).toBeVisible({ timeout: 10_000 });
    await customerInput.fill('ФКП Авангард');
    await page.waitForTimeout(1200);

    const customerSuggestion = page.locator(
      '[role="option"], [class*="suggestion"], [class*="dropdown"] button, [class*="dropdown"] li, [class*="listbox"] li',
    ).first();
    if (await customerSuggestion.isVisible().catch(() => false)) {
      await customerSuggestion.click();
    }

    const projectForm = codeInput.locator('xpath=ancestor::form[1]');
    let submitProjectBtn = page.getByRole('button', { name: /^создать объект$/i }).first();
    if (!(await submitProjectBtn.isVisible().catch(() => false))) {
      submitProjectBtn = page.getByRole('button', { name: /^создать проект$/i }).first();
    }
    if (!(await submitProjectBtn.isVisible().catch(() => false))) {
      submitProjectBtn = projectForm.locator('button[type="submit"]').first();
    }
    await expect(submitProjectBtn).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '02-project-form-filled');
    await submitProjectBtn.click();

    await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 25_000 });
    projectId = page.url().match(/\/projects\/([a-f0-9-]+)/)?.[1] ?? '';
    expect(projectId).toMatch(/^[a-f0-9-]{36}$/);
    await screenshot(page, '03-project-created');

    // 2) Create specification with PDF import
    await gotoStable(page, '/specifications/new');
    await screenshot(page, '04-spec-form-empty');

    const projectSelect = page.locator('select[name="projectId"]')
      .or(page.locator('select').first())
      .first();
    await expect(projectSelect).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1200);
    await projectSelect.selectOption(projectId).catch(async () => {
      const options = await projectSelect.locator('option').allInnerTexts();
      const matchingOption = options.find((label) => label.includes(projectCode) || label.includes(projectName));
      expect(matchingOption, 'Cannot find created project in specification form dropdown').toBeTruthy();
      await projectSelect.selectOption({ label: matchingOption! });
    });

    const specNameInput = page.locator('input[name="name"]')
      .or(page.locator('input[name="title"]'))
      .or(page.getByPlaceholder(/назван|наименов|title/i))
      .first();
    await expect(specNameInput).toBeVisible({ timeout: 10_000 });
    await specNameInput.fill(specName);

    const pdfButton = page.locator('button').filter({ hasText: /импорт.*pdf|pdf.*импорт|загрузить.*pdf/i }).first();
    const pdfInput = page.locator('input[accept*=".pdf"], input[accept*="pdf"], input[type="file"]').first();
    if (await pdfButton.isVisible().catch(() => false)) {
      await pdfButton.click();
      await page.waitForTimeout(500);
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toHaveCount(1);
      await fileInput.setInputFiles(PDF_PATH);
    } else {
      await expect(pdfInput).toHaveCount(1);
      await pdfInput.setInputFiles(PDF_PATH);
    }

    await page.waitForTimeout(5000);
    const positionNameCell = page.getByRole('textbox', { name: /наименование позиции/i }).first();
    await expect(positionNameCell).toBeVisible({ timeout: 15_000 });
    const currentPositionName = await positionNameCell.inputValue().catch(() => '');
    if (MANUAL_SPEC_LINE_FALLBACK && !currentPositionName.trim()) {
      await positionNameCell.fill(`UI позиция ${shortId}`);
    }
    await screenshot(page, '05-spec-pdf-imported');

    const submitSpecBtn = page.getByRole('button', { name: /создать|сохранить|submit/i }).first();
    await expect(submitSpecBtn).toBeVisible({ timeout: 10_000 });
    await submitSpecBtn.click();

    await page.waitForURL(/\/specifications\/[a-f0-9-]+/, { timeout: 25_000 });
    specId = page.url().match(/\/specifications\/([a-f0-9-]+)/)?.[1] ?? '';
    expect(specId).toMatch(/^[a-f0-9-]{36}$/);
    await screenshot(page, '06-spec-created');

    // 3) Open Financial Model from specification (UI-only chain)
    const fmButton = page.locator('button').filter({ hasText: /финансовая модель/i }).first();
    await expect(fmButton, 'Financial model button is not visible on specification page').toBeVisible({ timeout: 20_000 });
    await fmButton.click();

    await page.waitForURL(/\/budgets\/[a-f0-9-]+\/fm/, { timeout: 25_000 });
    budgetId = page.url().match(/\/budgets\/([a-f0-9-]+)\/fm/)?.[1] ?? '';
    expect(budgetId).toMatch(/^[a-f0-9-]{36}$/);
    await screenshot(page, '07-fm-opened');

    // 4) Verify FM is actually formed (not just shell page)
    await expect(page.locator('body')).toContainText(/себестоимость|маржа|сметн|финансовая модель/i);
    await expect.poll(
      async () => page.locator('tbody tr').count(),
      {
        timeout: 30_000,
        intervals: [1000, 2000, 3000, 5000],
        message: 'FM page opened, but no items appeared from specification.',
      },
    ).toBeGreaterThan(0);
    await screenshot(page, '08-fm-has-rows');

    expect(
      consoleErrors,
      `Critical console errors detected:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0);
    expect(
      pageErrors,
      `Uncaught page errors detected:\n${pageErrors.join('\n')}`,
    ).toHaveLength(0);
  });
});
