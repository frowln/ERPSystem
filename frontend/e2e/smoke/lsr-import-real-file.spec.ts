import { test, expect } from '@playwright/test';

const LSR_FILE = '/Users/damirkasimov/Downloads/Раздел ПД №12_Том 12.3_ЛСР-02-01-06-ИОС4.1 вентиляция зд.23к - ЛСР по Методике 2020 (РИМ).xlsx';
const SCREENSHOT_DIR = '/Users/damirkasimov/Desktop/lsr-import-screenshots';

test.describe('LSR Import — Real File Test', () => {
  test.setTimeout(180_000);

  test('Full import flow with real GRAND-Smeta RIM file', async ({ page }) => {
    // — Estimates list —
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-estimates-list.png`, fullPage: true });

    // — Click Import LSR button —
    const importBtn = page.getByRole('button', { name: /импорт/i }).first();
    await expect(importBtn).toBeVisible({ timeout: 10_000 });
    await importBtn.click();
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-wizard-step1-upload.png`, fullPage: true });

    // — Upload via the hidden file input (data-testid="lsr-file-input") —
    const fileInput = page.locator('[data-testid="lsr-file-input"]');
    await expect(fileInput).toBeAttached({ timeout: 10_000 });
    await fileInput.setInputFiles(LSR_FILE);
    console.log('File selected:', LSR_FILE);

    // Wait for parsing — 9665-row file takes time in browser
    await page.waitForTimeout(12_000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-parsing.png`, fullPage: true });

    // Wizard step 1 → 2 (Kolонки)
    let nextBtn = page.getByRole('button', { name: /далее/i }).first();
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1_500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-wizard-kolki.png`, fullPage: true });
    }

    // Wizard step 2 → 3 (Просмотр)
    nextBtn = page.getByRole('button', { name: /далее/i }).first();
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2_000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-wizard-preview.png`, fullPage: true });

      // Scroll to see more preview rows
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-wizard-preview-scrolled.png`, fullPage: true });
      await page.mouse.wheel(0, -600); // scroll back
    }

    // Wizard step 3 → 4 (Параметры)
    nextBtn = page.getByRole('button', { name: /далее/i }).first();
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2_000);
    }

    // Step 4: Параметры — must select a project first
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-wizard-params.png`, fullPage: true });

    // Select first available project in the dropdown
    const projectSelect = page.locator('select').first();
    if (await projectSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const options = await projectSelect.locator('option').all();
      console.log('Project options count:', options.length);
      // Pick the second option (first is placeholder)
      if (options.length > 1) {
        const firstProjectValue = await options[1].getAttribute('value');
        console.log('Selecting project:', firstProjectValue);
        await projectSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1_000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-project-selected.png`, fullPage: true });
      }
    }

    // Now Далее should be enabled → triggers final Import step
    nextBtn = page.getByRole('button', { name: /далее/i }).first();
    if (await nextBtn.isEnabled({ timeout: 5_000 }).catch(() => false)) {
      await nextBtn.click();
      console.log('Clicked Далее → Import step');
      await page.waitForTimeout(1_500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-wizard-import-step.png`, fullPage: true });
    }

    // Click the Импортировать button on the final import step
    const importSubmitBtn = page.getByRole('button', { name: /импортировать|начать импорт/i }).first();
    if (await importSubmitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await importSubmitBtn.click();
      console.log('Clicked Импортировать');
    } else {
      // Maybe it auto-imports or the button has a different label
      const finalBtn = page.getByRole('button', { name: /запуск|старт|ок|готово/i }).first();
      if (await finalBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await finalBtn.click();
      }
    }

    // Wait for DB save (780 positions × 6794 resources = ~7597 lines)
    await page.waitForTimeout(20_000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-import-complete.png`, fullPage: true });

    // — Return to estimates list —
    await page.goto('/estimates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-estimates-list-after-import.png`, fullPage: true });

    // — Open the first/latest estimate —
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Try clicking the name link in the first row
      const nameLink = firstRow.locator('a').first();
      if (await nameLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await nameLink.click();
      } else {
        await firstRow.click();
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3_000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/10-estimate-detail-top.png`, fullPage: true });

      // Scroll to see KPI cards and tree
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/11-estimate-kpi-cards.png`, fullPage: true });

      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-estimate-tree-top.png`, fullPage: true });

      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-estimate-tree-middle.png`, fullPage: true });

      // Log stats
      const pageText = await page.textContent('body') || '';
      const bigNumbers = pageText.match(/(?:\d[\d\s]*[\.,]\d\d)/g) || [];
      console.log('Numbers in page:', bigNumbers.slice(0, 10));
    } else {
      console.log('No table rows found — check screenshot 09');
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-final.png`, fullPage: true });
    console.log('Done — screenshots in:', SCREENSHOT_DIR);
  });
});
