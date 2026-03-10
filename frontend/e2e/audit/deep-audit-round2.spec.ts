/**
 * DEEP AUDIT ROUND 2 — Targeted ЖК Приморский + interactive elements + dark mode
 * Covers everything missed in Round 1:
 *   - FM/КП/Contract for the REAL project (not E2E test data)
 *   - Interactive elements: modals, dropdowns, form validation
 *   - Dark mode screenshots
 *   - All contract tabs
 *   - Edit flows
 *   - Competitive list
 *   - Full data chain validation
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIR = path.resolve(__dirname, '../audit-screenshots-r2');

test.use({ storageState: 'e2e/.auth/user.json' });

test('Round 2: Deep audit of ЖК Приморский + interactions + dark mode', async ({ page }) => {
  test.setTimeout(600_000); // 10 min

  let shotIndex = 0;
  const shot = async (name: string) => {
    await page.waitForTimeout(1500);
    const idx = String(shotIndex++).padStart(2, '0');
    await page.screenshot({ path: `${DIR}/${idx}-${name}.png`, fullPage: true });
  };

  const go = async (url: string) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
  };

  /** Force-close any open modals/overlays */
  const closeModals = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const overlay = page.locator('.fixed.inset-0, [role="dialog"]').first();
      if (await overlay.isVisible({ timeout: 300 }).catch(() => false)) {
        // Try close/cancel button first
        const closeBtn = page.locator('button:has-text("Отмена"), button:has-text("Закрыть"), button:has-text("×"), [aria-label="Close"]').first();
        if (await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => {});
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }
  };

  /** Safely try an interactive action (click button, screenshot modal, close) */
  const tryAction = async (buttonText: string, screenshotName: string) => {
    await closeModals();
    const btn = page.locator(`button:has-text("${buttonText}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      try {
        await btn.click({ timeout: 5000 });
        await page.waitForTimeout(1200);
        await shot(screenshotName);
      } catch (e) {
        // Button click failed — take screenshot of current state
        await shot(`${screenshotName}-BLOCKED`);
      }
      await closeModals();
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PART 1: Find ЖК Приморский IDs (project, budget, spec, etc.)
  // ═══════════════════════════════════════════════════════════════

  // --- 1a. Find project ID ---
  await go('/projects');
  let projectId = '';
  const projRows = page.locator('table tbody tr');
  const projCount = await projRows.count();
  for (let i = 0; i < projCount; i++) {
    const text = await projRows.nth(i).innerText();
    if (text.includes('Приморский') || text.includes('PRJ-00062')) {
      // Extract href or click and get URL
      await projRows.nth(i).click();
      await page.waitForURL(/\/projects\//);
      await page.waitForTimeout(1500);
      projectId = page.url().match(/\/projects\/([^/?#]+)/)?.[1] || '';
      break;
    }
  }
  await shot('p1-project-overview');

  // --- 1b. Find budget for ЖК Приморский ---
  await go('/budgets');
  await page.waitForTimeout(1000);
  let budgetId = '';
  const budgetRows = page.locator('table tbody tr, [class*="list"] a, [class*="row"]');
  // Search for ЖК Приморский budget by scanning visible text
  const allBudgetText = await page.locator('body').innerText();

  // Click on the ЖК Приморский budget specifically
  const primorskBudget = page.locator('text=ЖК Приморский — инженерные системы').first();
  if (await primorskBudget.isVisible()) {
    await primorskBudget.click();
    await page.waitForTimeout(2000);
    budgetId = page.url().match(/\/budgets\/([^/?#]+)/)?.[1] || '';
  }
  await shot('p1-primorsk-budget-detail');

  // --- 1c. Find spec for ЖК Приморский ---
  await go('/specifications');
  await page.waitForTimeout(1000);
  let specId = '';
  // Search for a spec related to Приморский
  const specLink = page.locator('table tbody tr').filter({ hasText: 'Приморский' }).first();
  if (await specLink.count() > 0) {
    await specLink.click();
    await page.waitForTimeout(2000);
    specId = page.url().match(/\/specifications\/([^/?#]+)/)?.[1] || '';
    await shot('p1-primorsk-spec-detail');
  } else {
    await shot('p1-specs-no-primorsk-found');
  }

  // --- 1d. Find estimate for ЖК Приморский ---
  await go('/estimates');
  await page.waitForTimeout(1000);
  let estimateId = '';
  const estLink = page.locator('table tbody tr').filter({ hasText: 'Приморский' }).first();
  if (await estLink.count() > 0) {
    await estLink.click();
    await page.waitForTimeout(2000);
    estimateId = page.url().match(/\/estimates\/([^/?#]+)/)?.[1] || '';
    await shot('p1-primorsk-estimate-detail');
  }

  // --- 1e. Find КП for ЖК Приморский ---
  await go('/commercial-proposals');
  await page.waitForTimeout(1000);
  let cpId = '';
  const cpLink = page.locator('table tbody tr').filter({ hasText: 'Приморский' }).first();
  if (await cpLink.count() > 0) {
    await cpLink.click();
    await page.waitForTimeout(2000);
    cpId = page.url().match(/\/commercial-proposals\/([^/?#]+)/)?.[1] || '';
    await shot('p1-primorsk-cp-detail');
  } else {
    await shot('p1-cp-no-primorsk-found');
  }

  // --- 1f. Find contract for ЖК Приморский ---
  await go('/contracts');
  await page.waitForTimeout(1000);
  let contractId = '';
  const contractLink = page.locator('table tbody tr').filter({ hasText: 'Приморский' }).first();
  if (await contractLink.count() > 0) {
    await contractLink.click();
    await page.waitForTimeout(2000);
    contractId = page.url().match(/\/contracts\/([^/?#]+)/)?.[1] || '';
    await shot('p1-primorsk-contract-detail');
  } else {
    // If no Приморский contract, try first contract with real data
    const firstContract = page.locator('table tbody tr').first();
    if (await firstContract.isVisible()) {
      await firstContract.click();
      await page.waitForTimeout(2000);
      contractId = page.url().match(/\/contracts\/([^/?#]+)/)?.[1] || '';
    }
    await shot('p1-contract-detail-fallback');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 2: ФМ for ЖК Приморский — the critical chain
  // ═══════════════════════════════════════════════════════════════

  if (budgetId) {
    await go(`/budgets/${budgetId}/fm`);
    await shot('p2-primorsk-fm-all');

    // Check all FM tabs
    const fmTabs = ['Все', 'Работы', 'Материалы', 'Оборудование', 'CVR', 'Снимки', 'Оптимизация'];
    for (const tabName of fmTabs) {
      const tab = page.locator(`button, [role="tab"]`).filter({ hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1200);
        await shot(`p2-fm-tab-${tabName}`);
      }
    }

    // Test FM interactive buttons — each safely opens and closes modal
    await tryAction('Добавить позицию', 'p2-fm-add-item-modal');
    await tryAction('Управление разделами', 'p2-fm-sections-modal');
    await tryAction('Создать КП', 'p2-fm-create-cp-modal');
    await tryAction('Сценарии', 'p2-fm-scenarios-modal');
    await tryAction('Собственные затраты', 'p2-fm-own-costs-modal');

    // Budget detail page (Обзор)
    await go(`/budgets/${budgetId}`);
    await shot('p2-primorsk-budget-overview');

    // Budget tabs
    const budgetTabs = ['Статьи', 'Диаграмма'];
    for (const tabName of budgetTabs) {
      const tab = page.locator(`button, [role="tab"]`).filter({ hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1200);
        await shot(`p2-budget-tab-${tabName}`);
      }
    }

    // Budget dashboard
    await go(`/budgets/${budgetId}/dashboard`);
    await shot('p2-primorsk-budget-dashboard');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 3: Contract deep dive — ALL tabs
  // ═══════════════════════════════════════════════════════════════

  if (contractId) {
    await go(`/contracts/${contractId}`);
    await page.waitForTimeout(1500);
    await shot('p3-contract-overview');

    // All contract tabs
    const contractTabs = ['Согласование', 'Документы', 'Финансы', 'Позиции ФМ'];
    for (const tabName of contractTabs) {
      const tab = page.locator(`button, [role="tab"]`).filter({ hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1500);
        await shot(`p3-contract-tab-${tabName}`);
        // Scroll down to see full content
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await shot(`p3-contract-tab-${tabName}-bottom`);
      }
    }

    // Test "Сменить статус" dropdown
    await tryAction('Сменить статус', 'p3-contract-status-dropdown');

    // Test edit contract
    await go(`/contracts/${contractId}/edit`);
    await page.waitForTimeout(1500);
    await shot('p3-contract-edit-top');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('p3-contract-edit-bottom');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 4: Specification deep dive + competitive list
  // ═══════════════════════════════════════════════════════════════

  if (specId) {
    await go(`/specifications/${specId}`);
    await page.waitForTimeout(1500);

    // All spec tabs
    const specTabs = ['Спецификация', 'Конкурентный лист', 'Коммерческое предложение', 'Внешние модули'];
    for (const tabName of specTabs) {
      const tab = page.locator(`button, [role="tab"]`).filter({ hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1500);
        await shot(`p4-spec-tab-${tabName}`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await shot(`p4-spec-tab-${tabName}-bottom`);
      }
    }

    // Test action buttons on spec
    const specActions = ['Импорт', 'Передать в ФМ', 'Создать смету', 'Тендер закупки', 'Добавить позицию', 'Новая версия'];
    for (const actionName of specActions) {
      await tryAction(actionName, `p4-spec-action-${actionName}`);
    }

    // Edit spec
    const editSpecBtn = page.locator('button:has-text("Редактировать"), a:has-text("Редактировать")').first();
    if (await editSpecBtn.isVisible()) {
      await editSpecBtn.click();
      await page.waitForTimeout(1500);
      await shot('p4-spec-edit-form');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await shot('p4-spec-edit-form-bottom');
      // Go back without saving
      await page.goBack();
      await page.waitForTimeout(1000);
    }

    // Competitive list page (if exists)
    const compListLink = page.locator('a[href*="competitive-list"], button:has-text("Конкурентный лист")').first();
    if (await compListLink.isVisible()) {
      await compListLink.click();
      await page.waitForTimeout(2000);
      await shot('p4-competitive-list-page');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await shot('p4-competitive-list-bottom');
    }

    // Supply dashboard
    await go(`/specifications/${specId}/supply-dashboard`);
    await page.waitForTimeout(1500);
    await shot('p4-supply-dashboard');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 5: Estimate deep dive
  // ═══════════════════════════════════════════════════════════════

  if (estimateId) {
    await go(`/estimates/${estimateId}`);
    await page.waitForTimeout(1500);
    await shot('p5-estimate-detail-top');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('p5-estimate-detail-bottom');

    // Normative view
    await go(`/estimates/${estimateId}/normative`);
    await page.waitForTimeout(1500);
    await shot('p5-estimate-normative');

    // FM reconciliation
    await go(`/estimates/${estimateId}/fm-reconciliation`);
    await page.waitForTimeout(1500);
    await shot('p5-estimate-fm-reconciliation');
  }

  // Estimate import page
  await go('/estimates/import');
  await page.waitForTimeout(1500);
  await shot('p5-estimate-import');

  // Estimate pivot
  await go('/estimates/pivot');
  await page.waitForTimeout(1500);
  await shot('p5-estimate-pivot');

  // ═══════════════════════════════════════════════════════════════
  // PART 6: КП deep dive
  // ═══════════════════════════════════════════════════════════════

  if (cpId) {
    await go(`/commercial-proposals/${cpId}`);
    await page.waitForTimeout(1500);

    // КП tabs
    const cpTabs = ['Материалы', 'Работы'];
    for (const tabName of cpTabs) {
      const tab = page.locator(`button, [role="tab"]`).filter({ hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(1200);
        await shot(`p6-cp-tab-${tabName}`);
      }
    }

    // КП action buttons
    const cpActions = ['Экспорт PDF', 'Новая версия', 'Реквизиты', 'На проверку'];
    for (const actionName of cpActions) {
      await tryAction(actionName, `p6-cp-action-${actionName}`);
    }

    // Navigation chain links on КП
    const fmLink = page.locator('button:has-text("Финансовая модель"), a:has-text("Финансовая модель")').first();
    if (await fmLink.isVisible()) {
      await shot('p6-cp-chain-links-visible');
    }
  }

  // КП create page
  await go('/commercial-proposals/new');
  await page.waitForTimeout(1500);
  await shot('p6-cp-create-form');

  // ═══════════════════════════════════════════════════════════════
  // PART 7: Project interactive elements
  // ═══════════════════════════════════════════════════════════════

  if (projectId) {
    // --- Risk Register interactions ---
    await go(`/projects/${projectId}/risks`);
    await page.waitForTimeout(1500);

    // Click "Добавить риск"
    await tryAction('Добавить риск', 'p7-risk-add-modal');

    // Click on a risk row to see detail/edit
    const riskRow = page.locator('table tbody tr').first();
    if (await riskRow.isVisible({ timeout: 1000 }).catch(() => false)) {
      try {
        await riskRow.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        await shot('p7-risk-row-click');
      } catch { /* ignore */ }
      await closeModals();
    }

    // --- Meeting interactions ---
    await go(`/projects/${projectId}/meeting`);
    await page.waitForTimeout(1500);

    // Toggle a decision checkbox
    const decisionCheckbox = page.locator('input[type="checkbox"]').first();
    if (await decisionCheckbox.isVisible()) {
      await shot('p7-meeting-before-toggle');
      await decisionCheckbox.click();
      await page.waitForTimeout(800);
      await shot('p7-meeting-after-toggle');
      // Toggle back
      await decisionCheckbox.click();
      await page.waitForTimeout(500);
    }

    // --- Project edit flow ---
    await go(`/projects/${projectId}/edit`);
    await page.waitForTimeout(1500);
    await shot('p7-project-edit-top');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('p7-project-edit-bottom');

    // --- Project team: Add member ---
    await go(`/projects/${projectId}`);
    await page.waitForTimeout(1000);
    // Click "Команда" tab
    const teamTab = page.locator('button:has-text("Команда")').first();
    if (await teamTab.isVisible()) {
      await teamTab.click();
      await page.waitForTimeout(1000);
    }
    await tryAction('Добавить участника', 'p7-team-add-member-modal');

    // --- Project Preconstruction tab interactions ---
    const preconTab = page.locator('button:has-text("Предстроительный этап")').first();
    if (await preconTab.isVisible()) {
      await preconTab.click();
      await page.waitForTimeout(1500);
      await shot('p7-precon-tab');

      // Try clicking "Добавить" buttons in panels
      const addBtns = page.locator('button:has-text("Добавить")');
      const addCount = await addBtns.count();
      for (let i = 0; i < Math.min(addCount, 4); i++) {
        await closeModals();
        const btn = addBtns.nth(i);
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          try {
            await btn.click({ timeout: 5000 });
            await page.waitForTimeout(1000);
            await shot(`p7-precon-add-modal-${i}`);
          } catch { /* ignore */ }
          await closeModals();
        }
      }

      // Try clicking "Реестр рисков" and "Стартовое совещание" links
      const riskLink = page.locator('button:has-text("Реестр рисков"), a:has-text("Реестр рисков")').first();
      if (await riskLink.isVisible()) {
        await shot('p7-precon-risk-link-visible');
      }
      const meetingLink = page.locator('button:has-text("Стартовое совещание"), a:has-text("Стартовое совещание")').first();
      if (await meetingLink.isVisible()) {
        await shot('p7-precon-meeting-link-visible');
      }
    }

    // --- Project Status change ---
    await go(`/projects/${projectId}`);
    await page.waitForTimeout(1000);
    const projStatusBtn = page.locator('button:has-text("Статус")').first();
    if (await projStatusBtn.isVisible()) {
      await projStatusBtn.click();
      await page.waitForTimeout(800);
      await shot('p7-project-status-dropdown');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // --- Project Documents tab ---
    const docsTab = page.locator('button:has-text("Документы")').first();
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await page.waitForTimeout(1500);
      await shot('p7-project-docs-tab');
    }

    // --- Project Finance tab ---
    const finTab = page.locator('button:has-text("Финансы")').first();
    if (await finTab.isVisible()) {
      await finTab.click();
      await page.waitForTimeout(1500);
      await shot('p7-project-finance-tab');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await shot('p7-project-finance-tab-bottom');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 8: CRM interactions
  // ═══════════════════════════════════════════════════════════════

  await go('/crm/dashboard');
  await page.waitForTimeout(1000);

  // Quick actions
  const newLeadQuick = page.locator('button:has-text("Новый лид"), a:has-text("Новый лид")').last();
  if (await newLeadQuick.isVisible()) {
    await newLeadQuick.click();
    await page.waitForTimeout(1500);
    await shot('p8-crm-new-lead-form');
    // Go back
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Leads page - click "+ Новый лид" header button
  await go('/crm/leads');
  await page.waitForTimeout(1000);
  const newLeadBtn = page.locator('button:has-text("Новый лид")').first();
  if (await newLeadBtn.isVisible()) {
    await newLeadBtn.click();
    await page.waitForTimeout(1500);
    await shot('p8-crm-new-lead-modal-or-page');
    // Try close/back
    const cancelBtn = page.locator('button:has-text("Отмена"), button:has-text("Закрыть")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.goBack();
      await page.waitForTimeout(1000);
    }
  }

  // Lead detail - check all sections
  await go('/crm/leads');
  await page.waitForTimeout(1000);
  // Switch to list view
  const listBtn = page.locator('button:has-text("Список")');
  if (await listBtn.isVisible()) {
    await listBtn.click();
    await page.waitForTimeout(800);
  }
  const leadRow = page.locator('table tbody tr').first();
  if (await leadRow.isVisible()) {
    await leadRow.click();
    await page.waitForTimeout(1500);
    await shot('p8-lead-detail-full');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('p8-lead-detail-bottom');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 9: Procurement deep dive
  // ═══════════════════════════════════════════════════════════════

  await go('/procurement');
  await page.waitForTimeout(1500);

  // Try different procurement items (the first one crashed in Round 1)
  const procRows = page.locator('table tbody tr');
  const procCount = await procRows.count();

  // Try clicking a row that might work (skip first few, try one in the middle)
  for (let i = Math.min(procCount - 1, 5); i >= 0; i--) {
    await go('/procurement');
    await page.waitForTimeout(1000);
    if (i < await procRows.count()) {
      const rowText = await procRows.nth(i).innerText();
      await procRows.nth(i).click();
      await page.waitForTimeout(2000);
      // Check if we got an error page
      const errorEl = page.locator('text=Произошла ошибка');
      if (await errorEl.isVisible()) {
        await shot(`p9-procurement-detail-${i}-ERROR`);
      } else {
        await shot(`p9-procurement-detail-${i}-OK`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await shot(`p9-procurement-detail-${i}-bottom`);
        break;
      }
    }
  }

  // Procurement "Заказы на поставку" button
  await go('/procurement');
  await page.waitForTimeout(1000);
  const supplyOrdersBtn = page.locator('button:has-text("Заказы на поставку"), a:has-text("Заказы на поставку")').first();
  if (await supplyOrdersBtn.isVisible()) {
    await supplyOrdersBtn.click();
    await page.waitForTimeout(1500);
    await shot('p9-supply-orders');
  }

  // New procurement request
  const newProcBtn = page.locator('button:has-text("Новая заявка")').first();
  if (await newProcBtn.isVisible()) {
    await newProcBtn.click();
    await page.waitForTimeout(1500);
    await shot('p9-new-procurement-form');
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 10: EVM with project selected
  // ═══════════════════════════════════════════════════════════════

  await go('/planning/evm');
  await page.waitForTimeout(1500);

  // Try selecting ЖК Приморский from the dropdown
  const evmProjectSelect = page.locator('select, [role="combobox"], button:has-text("Выберите объект")').first();
  if (await evmProjectSelect.isVisible()) {
    await evmProjectSelect.click();
    await page.waitForTimeout(800);
    await shot('p10-evm-project-dropdown');
    // Try to find Приморский option
    const primorskOption = page.locator('option, [role="option"], li').filter({ hasText: 'Приморский' }).first();
    if (await primorskOption.isVisible()) {
      await primorskOption.click();
      await page.waitForTimeout(2000);
      await shot('p10-evm-with-primorsk');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await shot('p10-evm-with-primorsk-bottom');
    } else {
      // Try first option
      const firstOption = page.locator('option:not(:first-child), [role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(2000);
        await shot('p10-evm-with-first-project');
      }
      await page.keyboard.press('Escape');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 11: DARK MODE — toggle and screenshot key pages
  // ═══════════════════════════════════════════════════════════════

  // Toggle dark mode via the moon/sun icon in header
  const darkModeToggle = page.locator('button[aria-label*="тем"], button[aria-label*="theme"], header button svg.lucide-moon, header button svg.lucide-sun').first();

  // Try clicking the dark mode button (moon icon in the header)
  const headerBtns = page.locator('header button, nav button');
  const headerBtnCount = await headerBtns.count();
  let darkModeFound = false;

  for (let i = 0; i < headerBtnCount; i++) {
    const btn = headerBtns.nth(i);
    const svg = btn.locator('svg');
    if (await svg.count() > 0) {
      const classList = await svg.getAttribute('class') || '';
      if (classList.includes('moon') || classList.includes('sun')) {
        await btn.click();
        darkModeFound = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
  }

  // Fallback: look for moon icon button by position (usually 2nd or 3rd button in header right section)
  if (!darkModeFound) {
    // The dark mode toggle is typically near notifications/user in the header
    const moonBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await moonBtn.isVisible()) {
      await moonBtn.click();
      await page.waitForTimeout(1000);
      darkModeFound = true;
    }
  }

  if (darkModeFound) {
    await shot('p11-dark-mode-check');

    // Key pages in dark mode
    await go('/');
    await shot('p11-dark-dashboard');

    if (projectId) {
      await go(`/projects/${projectId}`);
      await page.waitForTimeout(1000);
      await shot('p11-dark-project-overview');

      // Preconstruction tab in dark
      const preconTab = page.locator('button:has-text("Предстроительный этап")').first();
      if (await preconTab.isVisible()) {
        await preconTab.click();
        await page.waitForTimeout(1200);
        await shot('p11-dark-preconstruction');
      }

      await go(`/projects/${projectId}/risks`);
      await page.waitForTimeout(1000);
      await shot('p11-dark-risk-register');
    }

    if (budgetId) {
      await go(`/budgets/${budgetId}/fm`);
      await page.waitForTimeout(1000);
      await shot('p11-dark-fm');
    }

    await go('/crm/dashboard');
    await page.waitForTimeout(1000);
    await shot('p11-dark-crm');

    await go('/contracts');
    await page.waitForTimeout(1000);
    await shot('p11-dark-contracts-list');

    await go('/procurement');
    await page.waitForTimeout(1000);
    await shot('p11-dark-procurement');

    await go('/specifications');
    await page.waitForTimeout(1000);
    await shot('p11-dark-specs');

    await go('/estimates');
    await page.waitForTimeout(1000);
    await shot('p11-dark-estimates');

    // Toggle back to light mode
    const lightToggle = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await lightToggle.isVisible()) {
      await lightToggle.click();
      await page.waitForTimeout(500);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 12: Form validation checks
  // ═══════════════════════════════════════════════════════════════

  // Try submitting empty project form
  await go('/projects/new');
  await page.waitForTimeout(1000);
  const submitProjectBtn = page.locator('button:has-text("Создать объект")');
  if (await submitProjectBtn.isVisible()) {
    await submitProjectBtn.click();
    await page.waitForTimeout(1000);
    await shot('p12-project-form-validation');
  }

  // Try submitting empty contract form
  await go('/contracts/new');
  await page.waitForTimeout(1000);
  const submitContractBtn = page.locator('button:has-text("Создать договор")');
  if (await submitContractBtn.isVisible()) {
    await submitContractBtn.click();
    await page.waitForTimeout(1000);
    await shot('p12-contract-form-validation');
  }

  // Try submitting empty spec form
  await go('/specifications/new');
  await page.waitForTimeout(1000);
  const submitSpecBtn = page.locator('button:has-text("Создать спецификацию")');
  if (await submitSpecBtn.isVisible()) {
    await submitSpecBtn.click();
    await page.waitForTimeout(1000);
    await shot('p12-spec-form-validation');
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 13: Search functionality
  // ═══════════════════════════════════════════════════════════════

  await go('/');
  await page.waitForTimeout(1000);
  // Global search
  const globalSearch = page.locator('input[placeholder*="Поиск"]').first();
  if (await globalSearch.isVisible()) {
    await globalSearch.click();
    await page.waitForTimeout(500);
    await globalSearch.fill('Приморский');
    await page.waitForTimeout(1500);
    await shot('p13-global-search-results');
    await globalSearch.clear();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 14: Remaining pages not covered in Round 1
  // ═══════════════════════════════════════════════════════════════

  // Contract board view
  await go('/contracts/board');
  await page.waitForTimeout(1500);
  await shot('p14-contracts-board');

  // Site assessment - new form
  await go('/site-assessments');
  await page.waitForTimeout(1000);
  const newAssessBtn = page.locator('button:has-text("Новое обследование"), button:has-text("Провести обследование")').first();
  if (await newAssessBtn.isVisible()) {
    await newAssessBtn.click();
    await page.waitForTimeout(1500);
    await shot('p14-site-assessment-form');
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Counterparty create form
  await go('/counterparties');
  await page.waitForTimeout(1000);
  const newCounterBtn = page.locator('button:has-text("Создать контрагент")');
  if (await newCounterBtn.isVisible()) {
    await newCounterBtn.click();
    await page.waitForTimeout(1500);
    await shot('p14-counterparty-form');
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Prequalification - add vendor
  await go('/procurement/prequalification');
  await page.waitForTimeout(1000);
  await tryAction('Добавить подрядчика', 'p14-prequalification-add-modal');

  // Tenders - new tender form
  await go('/portfolio/tenders');
  await page.waitForTimeout(1000);
  const newTenderBtn = page.locator('button:has-text("Новое предложение")');
  if (await newTenderBtn.isVisible()) {
    await newTenderBtn.click();
    await page.waitForTimeout(1500);
    await shot('p14-tender-form');
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Opportunities - new opportunity
  await go('/portfolio/opportunities');
  await page.waitForTimeout(1000);
  await tryAction('Новая возможность', 'p14-opportunity-form');

  // Estimate pricing - material analogues
  await go('/estimates/pricing/analogues');
  await page.waitForTimeout(1500);
  await shot('p14-material-analogues');

  // Estimate pricing - substitution requests
  await go('/estimates/pricing/substitutions');
  await page.waitForTimeout(1500);
  await shot('p14-substitution-requests');

  // ═══════════════════════════════════════════════════════════════
  // PART 15: Bid comparison with real data
  // ═══════════════════════════════════════════════════════════════

  await go('/portfolio/bid-comparison');
  await page.waitForTimeout(1500);
  await shot('p15-bid-comparison');

  // ═══════════════════════════════════════════════════════════════
  // DONE — Summary log
  // ═══════════════════════════════════════════════════════════════

  console.log(`\n=== AUDIT ROUND 2 COMPLETE ===`);
  console.log(`Total screenshots: ${shotIndex}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Budget ID: ${budgetId}`);
  console.log(`Spec ID: ${specId}`);
  console.log(`Estimate ID: ${estimateId}`);
  console.log(`CP ID: ${cpId}`);
  console.log(`Contract ID: ${contractId}`);
});
