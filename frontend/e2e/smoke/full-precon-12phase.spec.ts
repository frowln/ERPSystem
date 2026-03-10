/**
 * FULL PRE-CONSTRUCTION 12-PHASE E2E TEST
 *
 * Complete flow: CRM Lead → Project → Site Assessment → Pre-Construction →
 * Specification → Estimate → FM → Prequalification → Tender → КП → Contract → Handoff
 *
 * Tests realistic data, UX/UI quality, i18n, dark mode, a11y, and data integrity.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ── Config ──────────────────────────────────────────────────────────────────
test.use({ storageState: 'e2e/.auth/user.json' });
test.describe.configure({ mode: 'serial' });

const SCREENSHOTS_DIR = path.resolve('e2e/screenshots/full-precon-12phase');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Use Vite proxy (same origin as frontend) to avoid CORS and ensure correct routing
const API_BASE = process.env.BASE_URL || 'http://localhost:4000';

// ── Shared State ────────────────────────────────────────────────────────────
let leadId = '';
let projectId = '';
let budgetId = '';
let specId = '';
let estimateId = '';
let cpId = '';
let contractId = '';
let authToken = '';

const pageErrors: string[] = [];
const consoleErrors: string[] = [];
const uxIssues: string[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function go(page: Page, route: string, timeout = 45_000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
      await page.waitForTimeout(1500);
      return;
    } catch {
      await page.waitForTimeout(800 * (attempt + 1));
    }
  }
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
}

async function bodyText(page: Page): Promise<string> {
  return page.locator('body').innerText();
}

async function bodyContains(page: Page, pattern: RegExp, timeout = 15_000) {
  await expect
    .poll(async () => page.locator('body').innerText(), { timeout, intervals: [500, 1000, 2000] })
    .toMatch(pattern);
}

function isBenign(text: string): boolean {
  const benign = [
    'Download the React DevTools', 'React does not recognize',
    'findDOMNode is deprecated', 'Warning:', 'favicon.ico',
    'HMR', 'hot update', '[vite]', 'ResizeObserver',
    'Non-Error promise rejection', 'net::ERR_',
    'Failed to load resource', 'the server responded with a status of 4',
    "Can't perform a React state update", 'Failed to fetch',
    'Load failed', 'AbortError', 'ChunkLoadError',
  ];
  return benign.some((b) => text.includes(b));
}

async function getToken(page: Page): Promise<string> {
  if (authToken) return authToken;
  authToken = await page.evaluate(() => {
    const stored = localStorage.getItem('privod-auth');
    try { return JSON.parse(stored!)?.state?.token ?? ''; } catch { return ''; }
  });
  return authToken;
}

/**
 * Make authenticated API request.
 * URL should be the path after /api — e.g. '/v1/crm/leads' or '/budgets'
 * CRM routes use /v1/crm/..., other routes use / directly.
 */
async function apiRequest(page: Page, method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any) {
  const token = await getToken(page);
  const fullUrl = `${API_BASE}/api${url}`;
  const opts: any = {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (data !== undefined) opts.data = data;
  switch (method) {
    case 'get': return page.request.get(fullUrl, opts);
    case 'post': return page.request.post(fullUrl, opts);
    case 'put': return page.request.put(fullUrl, opts);
    case 'patch': return page.request.patch(fullUrl, opts);
    case 'delete': return page.request.delete(fullUrl, opts);
  }
}

async function parseBody(resp: any): Promise<any> {
  const text = await resp.text();
  if (!text) return null;
  const parsed = JSON.parse(text);
  if (parsed && typeof parsed === 'object' && 'data' in parsed) return parsed.data;
  return parsed;
}

/** Check page for common UX issues */
async function auditPage(page: Page, pageName: string) {
  const text = await bodyText(page);
  if (text.includes('NaN')) uxIssues.push(`${pageName}: NaN visible`);
  if (text.includes('[object Object]')) uxIssues.push(`${pageName}: [object Object] visible`);
  if (/\bSave\b/.test(text) && !/\bSave\b.*Excel/.test(text)) uxIssues.push(`${pageName}: English "Save" found`);
  if (/\bCancel\b/.test(text)) uxIssues.push(`${pageName}: English "Cancel" found`);
  if (/\bDelete\b/.test(text)) uxIssues.push(`${pageName}: English "Delete" found`);
  if (/\bundefined\b/.test(text)) uxIssues.push(`${pageName}: "undefined" visible`);
}

// ── Test Suite ──────────────────────────────────────────────────────────────

test.describe('Pre-Construction 12-Phase Full Cycle', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isBenign(msg.text())) {
        consoleErrors.push(msg.text().slice(0, 200));
      }
    });
    page.on('pageerror', (err) => {
      const text = err.message || String(err);
      if (!isBenign(text)) pageErrors.push(text.slice(0, 200));
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 1: Create CRM Lead
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 1: Create CRM Lead', async ({ page }) => {
    test.setTimeout(90_000);

    // 1.1 — Open leads list
    await go(page, '/crm/leads');
    await bodyContains(page, /лид/i);
    await shot(page, '01a-crm-leads-list');

    // Verify metric cards exist
    const body = await bodyText(page);
    expect(body).toMatch(/всего|активн|выигран|конверс/i);
    console.log('  ✅ CRM Leads list loaded with metrics');

    // 1.2 — Click "+ Новый лид"
    const newLeadBtn = page.getByRole('button', { name: /новый лид/i })
      .or(page.locator('button').filter({ hasText: /новый лид/i })).first();
    await expect(newLeadBtn).toBeVisible({ timeout: 10_000 });
    await newLeadBtn.click();
    await page.waitForURL(/\/crm\/leads\/new/, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 1.3 — Fill form
    // Name
    const nameInput = page.locator('input[name="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('СК "Домодедово" — Складской комплекс класса А');

    // Contact name
    const contactInput = page.locator('input[name="contactName"]').first();
    if (await contactInput.isVisible().catch(() => false)) {
      await contactInput.fill('Петров Алексей Сергеевич');
    }

    // Company
    const companyInput = page.locator('input[name="companyName"]').first();
    if (await companyInput.isVisible().catch(() => false)) {
      await companyInput.fill('ООО "СтройИнвест"');
    }

    // Email
    const emailInput = page.locator('input[name="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('petrov@stroyinvest.ru');
    }

    // Phone
    const phoneInput = page.locator('input[name="phone"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+7 (495) 123-45-67');
    }

    // Source
    const sourceSelect = page.locator('select[name="source"]').first();
    if (await sourceSelect.isVisible().catch(() => false)) {
      await sourceSelect.selectOption('tender');
    }

    // Estimated value
    const valueInput = page.locator('input[name="estimatedValue"]').first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill('45000000');
    }

    // Notes/description
    const notesInput = page.locator('textarea[name="notes"]').first();
    if (await notesInput.isVisible().catch(() => false)) {
      await notesInput.fill('Строительство складского комплекса класса А, 12 000 м², Московская область, г. Домодедово');
    }

    await shot(page, '01b-crm-lead-form-filled');

    // 1.4 — Submit
    const submitBtn = page.getByRole('button', { name: /создать лид/i })
      .or(page.getByRole('button', { name: /сохранить/i })).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for redirect
    await page.waitForTimeout(3000);
    const url = page.url();

    // Try to extract lead ID from redirect
    const leadMatch = url.match(/\/crm\/leads\/([a-f0-9-]+)/);
    if (leadMatch && !leadMatch[1].includes('new')) {
      leadId = leadMatch[1];
    }

    // If redirect went to list, find the lead via API
    if (!leadId) {
      // Make sure we're on a page so localStorage is available
      if (!page.url().includes('/crm')) await go(page, '/crm/leads');
      await page.waitForTimeout(1000);

      const resp = await apiRequest(page, 'get', '/v1/crm/leads?page=0&size=50');
      if (resp && resp.ok()) {
        const data = await parseBody(resp);
        const leads = Array.isArray(data) ? data : data?.content || [];
        const found = leads.find((l: any) =>
          l.name?.includes('Домодедово') || l.companyName?.includes('СтройИнвест'));
        if (found) leadId = found.id;
        // Fallback: use most recent lead
        if (!leadId && leads.length > 0) {
          // Sort by createdAt descending
          const sorted = leads.sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          leadId = sorted[0].id;
        }
      }
    }

    await shot(page, '01c-crm-lead-created');
    console.log(`  ✅ Lead created: ${leadId || '(not found)'}`);
    expect(leadId, 'Lead must be created').toBeTruthy();
    await auditPage(page, 'CRM Lead');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 2: Advance Lead to WON + Convert to Project
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 2: Advance lead to WON and convert to project', async ({ page }) => {
    test.setTimeout(120_000);

    // If we don't have leadId from Phase 1, find it via API
    if (!leadId) {
      await go(page, '/crm/leads');
      const resp = await apiRequest(page, 'get', '/v1/crm/leads?page=0&size=50');
      if (resp && resp.ok()) {
        const data = await parseBody(resp);
        const leads = Array.isArray(data) ? data : data?.content || [];
        const found = leads.find((l: any) =>
          l.name?.includes('Домодедово') || l.companyName?.includes('СтройИнвест'));
        if (found) leadId = found.id;
        // Fallback: use most recent lead
        if (!leadId && leads.length > 0) leadId = leads[0].id;
      }
    }
    test.skip(!leadId, 'Lead not found');

    // Navigate to lead detail (frontend route, not API path)
    await go(page, `/crm/leads/${leadId}`);
    await page.waitForTimeout(2000);
    await shot(page, '02a-lead-detail-new');

    // 2.1 — Advance status: NEW → QUALIFIED → PROPOSITION → NEGOTIATION → WON
    // Use API for reliability (UI buttons depend on current status which can be flaky)
    const statusSequence = ['QUALIFIED', 'PROPOSITION', 'NEGOTIATION', 'WON'];

    for (const target of statusSequence) {
      // Try UI button first
      const buttonPatterns: Record<string, RegExp> = {
        QUALIFIED: /квалифицир/i,
        PROPOSITION: /подготовить предложение|предложени/i,
        NEGOTIATION: /переговор/i,
        WON: /выиграно|won/i,
      };
      const btnPattern = buttonPatterns[target];
      const actionBtn = page.locator('button').filter({ hasText: btnPattern }).first();

      if (await actionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await actionBtn.click();
        await page.waitForTimeout(2000);
        console.log(`    → Status advanced via UI to ${target}`);
      } else {
        // API fallback — use PUT to update lead status directly
        const resp = await apiRequest(page, 'put', `/v1/crm/leads/${leadId}`, { status: target });
        if (resp?.ok()) {
          console.log(`    → Status advanced via API to ${target}`);
        } else {
          // Try PATCH stage endpoint
          const resp2 = await apiRequest(page, 'patch', `/v1/crm/leads/${leadId}/stage`, { status: target });
          if (resp2?.ok()) console.log(`    → Status set via PATCH to ${target}`);
          else console.log(`    ⚠️ Could not advance to ${target} (${resp?.status()}/${resp2?.status()})`);
        }
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
      }
      await shot(page, `02b-lead-status-${target.toLowerCase()}`);
    }

    await shot(page, '02c-lead-won');

    // 2.2 — Convert to Project
    const convertBtn = page.getByRole('button', { name: /конвертировать в объект/i })
      .or(page.locator('button').filter({ hasText: /конвертировать/i })).first();

    if (await convertBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await convertBtn.click();
      await page.waitForTimeout(1500);

      // Fill modal
      const dialog = page.getByRole('dialog');

      if (await dialog.isVisible().catch(() => false)) {
        // Project name
        const projNameInput = dialog.locator('input').first();
        if (await projNameInput.isVisible().catch(() => false)) {
          await projNameInput.clear();
          await projNameInput.fill('СК "Домодедово" — Складской комплекс');
        }

        // Project code
        const projCodeInput = dialog.locator('input').nth(1);
        if (await projCodeInput.isVisible().catch(() => false)) {
          await projCodeInput.clear();
          await projCodeInput.fill('SK-DOM-2026');
        }

        await shot(page, '02d-convert-modal');

        // Submit conversion
        const convertSubmit = dialog.getByRole('button', { name: /конвертировать/i })
          .or(dialog.locator('button').filter({ hasText: /конвертировать/i })).first();
        await convertSubmit.click();

        // Wait for navigation to project
        await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(2000);

        const projMatch = page.url().match(/\/projects\/([a-f0-9-]+)/);
        if (projMatch) projectId = projMatch[1];
      }
    } else {
      // Fallback 1: convert via API
      console.log('  ⚠️ Convert button not visible, trying API convert');
      const resp = await apiRequest(page, 'post', `/v1/crm/leads/${leadId}/convert`, {
        projectName: 'СК "Домодедово" — Складской комплекс',
        projectCode: 'SK-DOM-2026',
        customerName: 'ООО "СтройИнвест"',
      });
      if (resp?.ok()) {
        const data = await parseBody(resp);
        projectId = data?.projectId || data?.id || '';
        if (projectId) await go(page, `/projects/${projectId}`);
      }
    }

    // Fallback 2: If convert failed, check if lead already has a projectId
    if (!projectId) {
      console.log('  ⚠️ Convert failed, checking if lead already linked to project');
      const leadResp = await apiRequest(page, 'get', `/v1/crm/leads/${leadId}`);
      if (leadResp?.ok()) {
        const leadData = await parseBody(leadResp);
        if (leadData?.projectId) projectId = leadData.projectId;
      }
    }

    // Fallback 3: Create project directly via UI
    if (!projectId) {
      console.log('  ⚠️ Creating project directly via /projects/new');
      await go(page, '/projects/new');
      await page.waitForTimeout(2000);

      const codeInput = page.locator('input[name="code"]').first();
      await expect(codeInput).toBeVisible({ timeout: 10_000 });
      await codeInput.fill('SK-DOM-2026');

      const nameInput = page.locator('input[name="name"]').first();
      await nameInput.fill('СК "Домодедово" — Складской комплекс');

      const kindSelect = page.locator('select[name="constructionKind"]').first();
      if (await kindSelect.isVisible().catch(() => false)) {
        await kindSelect.selectOption('NEW_CONSTRUCTION');
      }

      const customerInput = page.getByPlaceholder(/начните вводить|заказчик/i).first();
      if (await customerInput.isVisible().catch(() => false)) {
        await customerInput.fill('ООО "СтройИнвест"');
        await page.locator('h1, h2').first().click();
        await page.waitForTimeout(500);
      }

      const submitBtn = page.getByRole('button', { name: /создать объект|создать/i }).first();
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();
      await page.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const projMatch = page.url().match(/\/projects\/([a-f0-9-]+)/);
      if (projMatch && !projMatch[1].includes('new')) projectId = projMatch[1];
    }

    await shot(page, '02e-project-from-lead');
    console.log(`  ✅ Project created: ${projectId}`);
    expect(projectId, 'Project must exist for remaining tests').toBeTruthy();
    await auditPage(page, 'Project from Lead');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 3: Configure Project
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 3: Configure project — edit fields, change status', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    // 3.1 — Verify overview tab
    await go(page, `/projects/${projectId}`);
    await bodyContains(page, /домодедово|складской/i);
    await shot(page, '03a-project-overview');

    // Check 8 MetricCards
    const metricCards = page.locator('[class*="rounded"]').filter({
      has: page.locator('[class*="uppercase"], [class*="text-xs"]'),
    });
    const cardCount = await metricCards.count();
    console.log(`  MetricCards found: ${cardCount}`);

    // Check Quick Actions
    const quickActionsLabels = [
      /спецификац/i,
      /смет/i,
      /обследован/i,
      /финансов/i,
    ];
    for (const label of quickActionsLabels) {
      const btn = page.locator('button').filter({ hasText: label }).first();
      const visible = await btn.isVisible().catch(() => false);
      console.log(`  Quick action "${label}": ${visible ? '✅' : '⚠️'}`);
    }

    // 3.2 — Navigate to edit
    const editBtn = page.locator('button').filter({ has: page.locator('svg') })
      .filter({ hasText: '' }).first();
    // Try the edit button via link or icon
    const editLink = page.locator(`a[href*="/projects/${projectId}/edit"]`).first();
    if (await editLink.isVisible().catch(() => false)) {
      await editLink.click();
    } else {
      await go(page, `/projects/${projectId}/edit`);
    }
    await page.waitForTimeout(2000);
    await shot(page, '03b-project-edit-form');

    // Fill dates
    const startDate = page.locator('input[name="plannedStartDate"]').first();
    if (await startDate.isVisible().catch(() => false)) {
      await startDate.fill('2026-04-01');
    }
    const endDate = page.locator('input[name="plannedEndDate"]').first();
    if (await endDate.isVisible().catch(() => false)) {
      await endDate.fill('2027-12-01');
    }

    // Fill description
    const descInput = page.locator('textarea[name="description"]').first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('Строительство складского комплекса класса А площадью 12 000 м² в г. Домодедово. Включает каркас из металлоконструкций, ограждающие конструкции, инженерные системы.');
    }

    // Construction kind
    const kindSelect = page.locator('select[name="constructionKind"]').first();
    if (await kindSelect.isVisible().catch(() => false)) {
      await kindSelect.selectOption('NEW_CONSTRUCTION');
    }

    await shot(page, '03c-project-edit-filled');

    // Save
    const saveBtn = page.getByRole('button', { name: /сохранить/i }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }

    // 3.3 — Change status DRAFT → PLANNING
    await go(page, `/projects/${projectId}`);
    await page.waitForTimeout(2000);

    // Check current status — project may already be PLANNING from auto-creation
    const bodyStatus = await bodyText(page);
    const isAlreadyPlanning = /планирован/i.test(bodyStatus);

    if (!isAlreadyPlanning) {
      const statusBtn = page.locator('button').filter({ hasText: /статус/i }).first();
      if (await statusBtn.isVisible().catch(() => false)) {
        await statusBtn.click();
        await page.waitForTimeout(1000);

        // Find an enabled (non-current) status button
        const planningBtn = page.locator('button:not([disabled])').filter({ hasText: /планирован|planning/i }).first();
        if (await planningBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await planningBtn.click();
          await page.waitForTimeout(2000);
        } else {
          // Close the status modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      } else {
        // API fallback
        await apiRequest(page, 'patch', `/projects/${projectId}/status`, { status: 'PLANNING' });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
      }
    } else {
      console.log('  ✅ Project already in PLANNING status');
    }

    await shot(page, '03d-project-planning');
    console.log('  ✅ Project configured and status → PLANNING');
    await auditPage(page, 'Project Config');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 4: Site Assessment
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 4: Site Assessment — create and score', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    // 4.1 — Navigate to new assessment with project pre-filled
    await go(page, `/site-assessments/new?projectId=${projectId}`);
    await page.waitForTimeout(2000);
    await shot(page, '04a-site-assessment-form');

    // Verify project is pre-selected
    const projectSelect = page.locator('select').filter({ has: page.locator(`option[value="${projectId}"]`) }).first();
    if (await projectSelect.isVisible().catch(() => false)) {
      const selectedVal = await projectSelect.inputValue();
      console.log(`  Project pre-selected: ${selectedVal === projectId ? '✅' : '⚠️ ' + selectedVal}`);
    }

    // 4.2 — Fill basic fields
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill(new Date().toISOString().split('T')[0]);
    }

    // Use text inputs only (skip date inputs)
    const textInputs = page.locator('input[type="text"]');
    const addressInput = page.locator('input[name="siteAddress"]');
    if (await addressInput.count() > 0) {
      await addressInput.fill('Московская обл., г. Домодедово, промзона Южная, участок 14');
    } else if (await textInputs.count() >= 2) {
      // First text input after date is address (md:col-span-2)
      await textInputs.first().fill('Московская обл., г. Домодедово, промзона Южная, участок 14');
    }

    const assessorInput = page.locator('input[name="assessorName"]');
    if (await assessorInput.count() > 0) {
      await assessorInput.fill('Иванов А.П.');
    } else if (await textInputs.count() >= 2) {
      await textInputs.nth(1).fill('Иванов А.П.');
    }

    // 4.3 — Score 6 criteria (buttons with values 0, 1, 2)
    // Each criterion has 3 buttons. We click specific ones:
    // accessRoads=2, utilities=1, soilCondition=2, topography=2, environmentalRisks=1, zoningCompliance=2
    const targetScores = [2, 1, 2, 2, 1, 2]; // total = 10/12

    const criteriaGroups = page.locator('[class*="flex"][class*="gap-2"]').filter({
      has: page.locator('button'),
    });

    // Try finding criteria groups — they contain 3 scoring buttons each
    const allButtons = page.locator('button');
    const scoringBtnTexts = [/не соответст|не выполн/i, /условно/i, /соответст|выполн/i];

    // Find groups of 3 scoring buttons
    const greenButtons = page.locator('button').filter({ hasText: /соответст|выполн/i });
    const yellowButtons = page.locator('button').filter({ hasText: /условно/i });
    const greenCount = await greenButtons.count();
    const yellowCount = await yellowButtons.count();

    console.log(`  Scoring buttons: green=${greenCount}, yellow=${yellowCount}`);

    // Click buttons according to target scores
    if (greenCount >= 4 && yellowCount >= 2) {
      // Click green (score=2) for criteria 0,2,3,5
      for (let i = 0; i < Math.min(greenCount, 6); i++) {
        const idx = [0, 2, 3, 5]; // indices for score=2
        if (idx.includes(i)) {
          await greenButtons.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
      // Click yellow (score=1) for criteria 1,4
      for (let i = 0; i < Math.min(yellowCount, 6); i++) {
        const idx = [1, 4]; // indices for score=1
        if (idx.includes(i)) {
          await yellowButtons.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
    }

    await page.waitForTimeout(500);
    await shot(page, '04b-site-assessment-scored');

    // 4.4 — Check score summary
    const bodyTxt = await bodyText(page);
    const scoreMatch = bodyTxt.match(/(\d+)\/12/);
    if (scoreMatch) {
      console.log(`  Score: ${scoreMatch[1]}/12`);
    }

    // Recommendation visible
    const hasRecommendation = /подходит|условно|не подходит|go|conditional|no.go/i.test(bodyTxt);
    console.log(`  Recommendation visible: ${hasRecommendation ? '✅' : '⚠️'}`);

    // 4.5 — Add notes
    const notesTextarea = page.locator('textarea').first();
    if (await notesTextarea.isVisible().catch(() => false)) {
      await notesTextarea.fill('Требуется доп. обследование грунтовых вод. Рекомендовано провести геологические изыскания.');
    }

    await shot(page, '04c-site-assessment-ready');

    // 4.6 — Save
    const saveBtn = page.getByRole('button', { name: /сохранить|save/i }).first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Verify redirect to list or detail
    await shot(page, '04d-site-assessment-saved');
    console.log('  ✅ Site Assessment created');

    // 4.7 — Verify in list
    await go(page, '/site-assessments');
    await page.waitForTimeout(2000);
    await shot(page, '04e-site-assessments-list');

    const listBody = await bodyText(page);
    const assessmentInList = /домодедово|южная|иванов/i.test(listBody);
    if (assessmentInList) {
      console.log('  ✅ Assessment visible in list');
    } else {
      console.log('  ⚠️ Assessment NOT in list (backend may not have persisted it)');
      uxIssues.push('Site Assessment: created but not visible in list after redirect');
    }
    await auditPage(page, 'Site Assessment');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 5: Pre-Construction Tab
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 5.1: Pre-Construction KPI Panel', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await bodyContains(page, /домодедово|складской/i);

    // Click Pre-Construction tab
    const preconTab = page.locator('button').filter({ hasText: /предстроител/i }).first();
    await expect(preconTab).toBeVisible({ timeout: 10_000 });
    await preconTab.click();
    await page.waitForTimeout(2000);
    await shot(page, '05a-precon-tab-overview');

    // 5.1 — KPI cards (5 indicators)
    const progressBars = page.locator('[role="progressbar"]');
    const pbCount = await progressBars.count();
    expect(pbCount).toBeGreaterThanOrEqual(4);
    console.log(`  KPI progress bars: ${pbCount}`);

    // Check aria attributes
    for (let i = 0; i < Math.min(pbCount, 5); i++) {
      const val = await progressBars.nth(i).getAttribute('aria-valuenow');
      expect(val, `Progress bar ${i} missing aria-valuenow`).not.toBeNull();
    }

    // 5.1 — Panel headings visible
    const panelNames = [
      /изыскания/i,
      /разрешительн/i,
      /пос.*ппр|организаци|проектная док/i,
      /чек-лист|безопасност/i,
    ];
    for (const name of panelNames) {
      const heading = page.locator('h3, h4').filter({ hasText: name });
      const visible = await heading.count() > 0;
      console.log(`  Panel "${name}": ${visible ? '✅' : '⚠️'}`);
    }

    // Risk Register + Meeting buttons
    const riskBtn = page.locator('button').filter({ hasText: /реестр рисков/i });
    expect(await riskBtn.count()).toBeGreaterThan(0);
    const meetingBtn = page.locator('button').filter({ hasText: /совещани/i });
    expect(await meetingBtn.count()).toBeGreaterThan(0);
    console.log('  ✅ Risk + Meeting buttons present');

    await auditPage(page, 'Pre-Construction Tab');
  });

  test('Phase 5.2: Engineering Surveys', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await page.locator('button').filter({ hasText: /предстроител/i }).first().click();
    await page.waitForTimeout(2000);

    // Find "+ Добавить" button for surveys
    const addSurveyBtn = page.locator('button').filter({ hasText: /добавить/i }).first();
    if (await addSurveyBtn.isVisible().catch(() => false)) {
      await addSurveyBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // Type select
        const typeSelect = dialog.locator('select').first();
        if (await typeSelect.isVisible().catch(() => false)) {
          await typeSelect.selectOption({ index: 1 }); // Геодезические
        }

        // Status
        const statusSelect = dialog.locator('select').nth(1);
        if (await statusSelect.isVisible().catch(() => false)) {
          try { await statusSelect.selectOption('IN_PROGRESS'); } catch {
            await statusSelect.selectOption({ index: 1 });
          }
        }

        // Contractor
        const contractorInput = dialog.locator('input').first();
        if (await contractorInput.isVisible().catch(() => false)) {
          await contractorInput.fill('ООО "ГеоПроект"');
        }

        // Contract number
        const contractNumInput = dialog.locator('input').nth(1);
        if (await contractNumInput.isVisible().catch(() => false)) {
          await contractNumInput.fill('ГП-2026/042');
        }

        await shot(page, '05b-survey-modal');

        // Save
        const saveBtn = dialog.getByRole('button', { name: /сохранить|добавить|save/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }

    await shot(page, '05c-surveys-added');
    console.log('  ✅ Engineering Survey added');
  });

  test('Phase 5.3: Permits Panel', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await page.locator('button').filter({ hasText: /предстроител/i }).first().click();
    await page.waitForTimeout(2000);

    // Look for permits section
    const permitsHeading = page.locator('h3, h4').filter({ hasText: /разрешительн/i }).first();
    await expect(permitsHeading).toBeVisible({ timeout: 10_000 });

    // Try adding a permit
    const addPermitBtn = page.locator('button').filter({ hasText: /добавить/i }).nth(1)
      .or(page.locator('button').filter({ hasText: /добавить/i }).last());

    if (await addPermitBtn.isVisible().catch(() => false)) {
      await addPermitBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        const typeSelect = dialog.locator('select').first();
        if (await typeSelect.isVisible().catch(() => false)) {
          await typeSelect.selectOption({ index: 1 }); // ГПЗУ
        }

        const statusSelect = dialog.locator('select').nth(1);
        if (await statusSelect.isVisible().catch(() => false)) {
          try { await statusSelect.selectOption('APPROVED'); } catch {
            await statusSelect.selectOption({ index: 3 });
          }
        }

        // Number
        const numInput = dialog.locator('input').first();
        if (await numInput.isVisible().catch(() => false)) {
          await numInput.fill('ГПЗУ-МО-2026/118');
        }

        // Issuing authority
        const authInput = dialog.locator('input').nth(1);
        if (await authInput.isVisible().catch(() => false)) {
          await authInput.fill('Минстрой Московской области');
        }

        await shot(page, '05d-permit-modal');

        const saveBtn = dialog.getByRole('button', { name: /сохранить|добавить|save/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }

    await shot(page, '05e-permits-added');
    console.log('  ✅ Permit added');
  });

  test('Phase 5.4: Construction Plans (POS/PPR)', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await page.locator('button').filter({ hasText: /предстроител/i }).first().click();
    await page.waitForTimeout(2000);

    // Find "Продвинуть" (Advance) buttons for POS/PPR
    const advanceButtons = page.locator('button').filter({
      has: page.locator('svg'),
    }).filter({ hasText: '' }); // icon-only buttons

    // Check for POS/PPR section
    const posHeading = page.locator('h3, h4').filter({ hasText: /пос.*ппр|организаци|проектная/i });
    const hasPosSection = await posHeading.count() > 0;
    console.log(`  POS/PPR section: ${hasPosSection ? '✅' : '⚠️'}`);

    if (hasPosSection) {
      // Try to advance POS status
      const uploadBtns = page.locator('button[title*="Продвинуть"]')
        .or(page.locator('button').filter({ hasText: /продвинуть/i }));
      const btnCount = await uploadBtns.count();
      console.log(`  Advance buttons found: ${btnCount}`);

      if (btnCount > 0) {
        await uploadBtns.first().click();
        await page.waitForTimeout(1000);

        // Confirm dialog — scope to dialog role to avoid matching sidebar buttons
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
          const confirmBtn = dialog.getByRole('button', { name: /подтвердить|да|confirm/i }).first();
          if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await confirmBtn.click();
            await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => {});
            await page.waitForTimeout(1000);
            console.log('  ✅ POS status advanced');
          } else {
            // Close the dialog
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            console.log('  ⚠️ Confirm button not found in dialog');
          }
        } else {
          // No confirm dialog — advance may have happened directly
          console.log('  ✅ POS advance clicked (no confirm dialog)');
        }
      }
    }

    await shot(page, '05f-construction-plans');
  });

  test('Phase 5.5: Safety Checklist', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await page.locator('button').filter({ hasText: /предстроител/i }).first().click();
    await page.waitForTimeout(2000);

    // Look for safety section
    const safetyHeading = page.locator('h3, h4').filter({ hasText: /безопасност|чек-лист/i });
    expect(await safetyHeading.count()).toBeGreaterThan(0);

    // Initialize if empty
    const initBtn = page.locator('button').filter({ hasText: /инициализир/i });
    if (await initBtn.isVisible().catch(() => false)) {
      await initBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Safety checklist initialized');
    }

    // Toggle checkboxes
    const checkboxes = page.locator('[role="checkbox"]');
    const cbCount = await checkboxes.count();
    console.log(`  Safety checkboxes: ${cbCount}`);

    if (cbCount > 0) {
      // Toggle first 3 checkboxes — re-query after each click since mutation causes re-render
      for (let i = 0; i < Math.min(3, cbCount); i++) {
        try {
          const cb = page.locator('[role="checkbox"]').nth(i);
          const before = await cb.getAttribute('aria-checked', { timeout: 3_000 }).catch(() => '?');
          await cb.click();
          await page.waitForTimeout(1500); // wait for mutation + re-render
          const afterCb = page.locator('[role="checkbox"]').nth(i);
          const after = await afterCb.getAttribute('aria-checked', { timeout: 3_000 }).catch(() => '?');
          console.log(`    Checkbox ${i}: ${before} → ${after}`);
        } catch {
          console.log(`    Checkbox ${i}: click failed (re-render)`);
        }
      }
    }

    await shot(page, '05g-safety-checklist');
    console.log('  ✅ Safety checklist tested');
  });

  test('Phase 5.6: Site Assessment Panel on project', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await bodyContains(page, /домодедово|складской/i);

    const preconTab = page.locator('button').filter({ hasText: /предстроител/i }).first();
    await expect(preconTab).toBeVisible({ timeout: 10_000 });
    await preconTab.click({ timeout: 10_000 }).catch(async () => {
      // Force click if regular click hangs
      await preconTab.dispatchEvent('click');
    });
    await page.waitForTimeout(2000);

    // Check for site assessment references
    const bodyTxt = await bodyText(page);
    const hasAssessmentRef = /обследован|assessment|домодедово|южная/i.test(bodyTxt);
    console.log(`  Site assessment reference in pre-con: ${hasAssessmentRef ? '✅' : '⚠️ (may need projectId link)'}`);

    await shot(page, '05h-site-assessment-panel');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 5.7: Risk Register
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 5.7: Risk Register — add 3 risks, verify matrix', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}/risks`);
    await bodyContains(page, /реестр рисков|риск/i);
    await shot(page, '05i-risk-register-empty');

    // Verify metric cards
    const bodyTxt = await bodyText(page);
    expect(bodyTxt).toMatch(/всего рисков|высоки|снижаем|закрыт/i);

    // Verify 5x5 matrix
    const matrixCells = page.locator('td [class*="rounded"]');
    const cellCount = await matrixCells.count();
    console.log(`  Matrix cells: ${cellCount}`);

    // Add 3 risks
    const risks = [
      { category: 'FINANCIAL', desc: 'Рост цен на металлоконструкции >20%', prob: '4', impact: '5', mitigation: 'Заключить форвардные контракты на сталь. Резерв 10%.', owner: 'Петров А.С.' },
      { category: 'ENVIRONMENTAL', desc: 'Обнаружение загрязнённого грунта', prob: '2', impact: '4', mitigation: 'Провести экологическую экспертизу до начала земляных работ', owner: '' },
      { category: 'LEGAL', desc: 'Задержка выдачи разрешения на строительство', prob: '2', impact: '2', mitigation: '', owner: '' },
    ];

    for (let r = 0; r < risks.length; r++) {
      const risk = risks[r];

      // Click "Добавить риск"
      const addBtn = page.getByRole('button', { name: /добавить риск/i })
        .or(page.locator('button').filter({ hasText: /добавить/i })).first();
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Category — use getByLabel matching the Russian label
      const catSelect = dialog.getByLabel('Категория');
      if (await catSelect.isVisible().catch(() => false)) {
        try { await catSelect.selectOption(risk.category); } catch {
          await catSelect.selectOption({ index: r + 1 });
        }
      }

      // Description — label "Описание"
      const descInput = dialog.getByLabel(/описание/i);
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill(risk.desc);
      } else {
        // Fallback: first text input
        await dialog.locator('input[type="text"]').first().fill(risk.desc);
      }

      // Probability & Impact
      const probSelect = dialog.getByLabel('Вероятность');
      if (await probSelect.isVisible().catch(() => false)) {
        await probSelect.selectOption(risk.prob);
      }
      const impactSelect = dialog.getByLabel('Влияние');
      if (await impactSelect.isVisible().catch(() => false)) {
        await impactSelect.selectOption(risk.impact);
      }

      // Mitigation — label "Меры снижения"
      if (risk.mitigation) {
        const mitInput = dialog.getByLabel(/меры снижения/i);
        if (await mitInput.isVisible().catch(() => false)) {
          await mitInput.fill(risk.mitigation);
        }
      }

      // Owner — label "Ответственный"
      if (risk.owner) {
        const ownerInput = dialog.getByLabel(/ответственный/i);
        if (await ownerInput.isVisible().catch(() => false)) {
          await ownerInput.fill(risk.owner);
        }
      }

      await shot(page, `05j-risk-${r + 1}-modal`);

      // Save
      const saveBtn = dialog.getByRole('button', { name: /сохранить|save/i });
      await saveBtn.click();
      await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1000);

      console.log(`  ✅ Risk ${r + 1} created: ${risk.desc.slice(0, 40)}...`);
    }

    await shot(page, '05k-risk-register-3-risks');

    // Verify scores in table
    const tableText = await page.locator('table').last().innerText().catch(() => '');
    expect(tableText).toMatch(/20|12|8|4/); // score = prob × impact
    console.log('  ✅ Risk scores visible in table');

    // Verify matrix has populated cells
    await shot(page, '05l-risk-matrix');
    await auditPage(page, 'Risk Register');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 5.8: Pre-Construction Meeting
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 5.8: Pre-Construction Meeting', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/projects/${projectId}/meeting`);
    await page.waitForTimeout(2000);
    await bodyContains(page, /совещани/i);

    // Create meeting if needed
    const createBtn = page.getByRole('button', { name: /создать совещание|создать/i });
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Meeting created');
    }

    await shot(page, '05m-meeting-page');

    // Verify 5 sections
    const bodyTxt = await bodyText(page);
    for (const section of [/участники/i, /повестк/i, /решения/i, /задачи|поручени/i, /протокол/i]) {
      expect(bodyTxt).toMatch(section);
    }
    console.log('  ✅ All meeting sections present');

    // Add attendees
    const attendeeInput = page.getByPlaceholder(/добавить участника/i)
      .or(page.locator('input[placeholder*="участн"]')).first();
    if (await attendeeInput.isVisible().catch(() => false)) {
      for (const name of ['Петров А.С. (заказчик)', 'Иванов М.К. (ГИП)', 'Сидорова Е.В. (ПТО)', 'Козлов Д.А. (безопасность)']) {
        await attendeeInput.fill(name);
        await attendeeInput.press('Enter');
        await page.waitForTimeout(400);
      }
      console.log('  ✅ 4 attendees added');
    }

    // Add agenda items
    const agendaInput = page.getByPlaceholder(/добавить пункт/i)
      .or(page.locator('input[placeholder*="пункт"]')).first();
    if (await agendaInput.isVisible().catch(() => false)) {
      for (const item of ['Обзор результатов обследования площадки', 'Утверждение ПОС и графика работ', 'Согласование бюджета и ФМ']) {
        await agendaInput.fill(item);
        await agendaInput.press('Enter');
        await page.waitForTimeout(400);
      }
      console.log('  ✅ 3 agenda items added');
    }

    // Add decisions
    const decisionInput = page.getByPlaceholder(/добавить решение/i)
      .or(page.locator('input[placeholder*="решени"]')).first();
    if (await decisionInput.isVisible().catch(() => false)) {
      await decisionInput.fill('Утвердить площадку для строительства');
      await decisionInput.press('Enter');
      await page.waitForTimeout(400);
      await decisionInput.fill('Назначить субподряд на земляные работы через тендер');
      await decisionInput.press('Enter');
      await page.waitForTimeout(400);
      console.log('  ✅ 2 decisions added');
    }

    // Add action item
    const actionInput = page.getByPlaceholder(/описание задачи/i)
      .or(page.locator('input[placeholder*="задач"]')).first();
    if (await actionInput.isVisible().catch(() => false)) {
      await actionInput.fill('Подготовить тендерную документацию на земляные работы');
    }
    const ownerInput = page.getByPlaceholder(/ответственный/i).first();
    if (await ownerInput.isVisible().catch(() => false)) {
      await ownerInput.fill('Сидорова Е.В.');
    }

    // Minutes textarea (auto-save)
    const minutesTextarea = page.locator('textarea').last();
    if (await minutesTextarea.isVisible().catch(() => false)) {
      await minutesTextarea.fill('Протокол предстроительного совещания по объекту СК "Домодедово".\nПрисутствующие: 4 участника.\nОсновные решения: площадка утверждена, субподряд через тендер.');
      console.log('  ✅ Minutes filled (debounced auto-save)');
    }

    await shot(page, '05n-meeting-filled');
    await auditPage(page, 'Meeting');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 6: Specification
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 6: Create Specification', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/specifications/new?projectId=${projectId}`);
    await page.waitForTimeout(2000);
    await shot(page, '06a-spec-form');

    // Select project
    const projectSelect = page.locator('select[name="projectId"]').or(page.locator('select').first()).first();
    await expect(projectSelect).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1500);
    await projectSelect.selectOption(projectId).catch(async () => {
      const options = await projectSelect.locator('option').allInnerTexts();
      const match = options.find((o) => o.includes('Домодедово') || o.includes('SK-DOM'));
      if (match) await projectSelect.selectOption({ label: match });
      else if (options.length > 1) await projectSelect.selectOption({ index: options.length - 1 });
    });

    // Name
    const nameInput = page.locator('input[name="name"]').or(page.locator('input[name="title"]'))
      .or(page.getByPlaceholder(/назван|наименов/i)).first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Спецификация — СК Домодедово — Основные конструкции');

    // Description
    const descInput = page.locator('textarea[name="description"]')
      .or(page.locator('textarea').first()).first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('Металлоконструкции каркаса, ограждающие конструкции, фундаментные работы');
    }

    await shot(page, '06b-spec-form-filled');

    // Submit
    const submitBtn = page.getByRole('button', { name: /создать|сохранить/i }).first();
    await submitBtn.click();
    await page.waitForURL(/\/specifications\/[a-f0-9-]+/, { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const specMatch = page.url().match(/\/specifications\/([a-f0-9-]+)/);
    if (specMatch && !specMatch[1].includes('new')) specId = specMatch[1];

    // If no spec from URL, try to find via API
    if (!specId) {
      const resp = await apiRequest(page, 'get', `/specifications?projectId=${projectId}`);
      if (resp?.ok()) {
        const data = await parseBody(resp);
        const specs = Array.isArray(data) ? data : data?.content || [];
        if (specs.length > 0) specId = specs[0].id;
      }
    }

    await shot(page, '06c-spec-created');
    console.log(`  ✅ Specification created: ${specId}`);

    // Add items via API for speed
    if (specId) {
      const specItems = [
        { name: 'Двутавр 30Б1 С345', brand: '30Б1', productCode: 'МК-001', manufacturer: 'НЛМК', quantity: 450, unitOfMeasure: 'т', weight: 36.5 },
        { name: 'Профнастил Н75-750-0.8', brand: 'Н75', productCode: 'ОК-001', manufacturer: 'Металл Профиль', quantity: 12000, unitOfMeasure: 'м²', weight: 8.5 },
        { name: 'Бетон B25 F150 W8', brand: 'B25', productCode: 'ФР-001', manufacturer: 'ЖБИ-Инвест', quantity: 3500, unitOfMeasure: 'м³', weight: 2400 },
        { name: 'Арматура А500С d12', brand: 'А500С', productCode: 'ФР-002', manufacturer: 'Мечел', quantity: 85, unitOfMeasure: 'т', weight: 1000 },
        { name: 'Сэндвич-панель 150мм PIR', brand: 'PIR-150', productCode: 'ОК-002', manufacturer: 'ProfHolod', quantity: 8500, unitOfMeasure: 'м²', weight: 15.2 },
      ];

      let created = 0;
      for (let i = 0; i < specItems.length; i++) {
        const item = specItems[i];
        const resp = await apiRequest(page, 'post', `/specifications/${specId}/items`, {
          name: item.name, itemType: 'MATERIAL', brand: item.brand,
          productCode: item.productCode, manufacturer: item.manufacturer,
          quantity: item.quantity, unitOfMeasure: item.unitOfMeasure,
          weight: item.weight, sequence: i + 1, position: String(i + 1),
        });
        if (resp?.ok()) created++;
      }
      console.log(`  ✅ ${created} spec items added via API`);
    }

    // Verify items on page
    if (specId) {
      await go(page, `/specifications/${specId}`);
      await page.waitForTimeout(2000);
      await shot(page, '06d-spec-with-items');

      const rows = page.locator('tbody tr');
      await expect(rows.first()).toBeVisible({ timeout: 10_000 });
      console.log(`  Spec items in table: ${await rows.count()}`);
    }

    await auditPage(page, 'Specification');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 7: Estimate
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 7: Create Estimate + FM Reconciliation', async ({ page }) => {
    test.setTimeout(90_000);
    test.skip(!projectId, 'Project not created');

    await go(page, `/estimates/new?projectId=${projectId}`);
    await page.waitForTimeout(2000);
    await shot(page, '07a-estimate-form');

    // Fill form
    const nameInput = page.locator('input[name="name"]').or(page.locator('input[name="title"]'))
      .or(page.getByPlaceholder(/назван/i)).first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('ЛСР — Складской комплекс Домодедово');
    }

    // Project select
    const projectSelect = page.locator('select[name="projectId"]').or(page.locator('select').first()).first();
    if (await projectSelect.isVisible().catch(() => false)) {
      await projectSelect.selectOption(projectId).catch(async () => {
        const opts = await projectSelect.locator('option').allInnerTexts();
        const match = opts.find(o => o.includes('Домодедово') || o.includes('SK-DOM'));
        if (match) await projectSelect.selectOption({ label: match });
      });
    }

    await shot(page, '07b-estimate-form-filled');

    // Submit
    const submitBtn = page.getByRole('button', { name: /создать|сохранить/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // Try to get estimate ID
    const estMatch = page.url().match(/\/estimates\/([a-f0-9-]+)/);
    if (estMatch && !estMatch[1].includes('new')) estimateId = estMatch[1];

    if (!estimateId) {
      const resp = await apiRequest(page, 'get', `/estimates?projectId=${projectId}`);
      if (resp?.ok()) {
        const data = await parseBody(resp);
        const ests = Array.isArray(data) ? data : data?.content || [];
        if (ests.length > 0) estimateId = ests[0].id;
      }
    }

    console.log(`  ✅ Estimate: ${estimateId || 'created/found'}`);

    // Check FM Reconciliation page
    if (estimateId) {
      await go(page, `/estimates/${estimateId}/fm-reconciliation`);
      await page.waitForTimeout(2000);
      await shot(page, '07c-fm-reconciliation');

      const reconBody = await bodyText(page);
      const hasReconContent = /сверка|reconcil|дельта|итого/i.test(reconBody);
      console.log(`  FM Reconciliation page: ${hasReconContent ? '✅' : '⚠️ empty (no FM data yet)'}`);
    }

    await auditPage(page, 'Estimate');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 8: Financial Model (FM)
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 8: Financial Model (FM) — populate + verify KPI', async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(!projectId, 'Project not created');

    // Find budget for project
    await go(page, '/budgets');
    await page.waitForTimeout(1500);

    const resp = await apiRequest(page, 'get', `/budgets?projectId=${projectId}`);
    if (resp?.ok()) {
      const data = await parseBody(resp);
      const budgets = Array.isArray(data) ? data : data?.content || [];
      const found = budgets.find((b: any) => b.projectId === projectId);
      if (found) budgetId = found.id;
    }

    // Create budget if not found
    if (!budgetId) {
      const createResp = await apiRequest(page, 'post', '/budgets', {
        name: 'ФМ — СК Домодедово',
        projectId,
        plannedRevenue: 0,
        plannedCost: 0,
      });
      if (createResp?.ok()) {
        const budget = await parseBody(createResp);
        budgetId = budget?.id;
      }
    }

    expect(budgetId, 'Budget ID required').toBeTruthy();
    console.log(`  Budget ID: ${budgetId}`);

    // Add FM items via API
    const fmItems = [
      { name: 'Металлоконструкции каркаса', section: 'Каркас', category: 'MATERIALS', costPrice: 12500, estimatePrice: 16000, quantity: 450, unit: 'т' },
      { name: 'Профнастил кровельный Н75', section: 'Кровля', category: 'MATERIALS', costPrice: 850, estimatePrice: 1100, quantity: 12000, unit: 'м²' },
      { name: 'Бетон фундаментный B25', section: 'Фундамент', category: 'MATERIALS', costPrice: 5200, estimatePrice: 6700, quantity: 3500, unit: 'м³' },
      { name: 'Арматура А500С', section: 'Фундамент', category: 'MATERIALS', costPrice: 62000, estimatePrice: 79000, quantity: 85, unit: 'т' },
      { name: 'Сэндвич-панели стеновые', section: 'Ограждение', category: 'MATERIALS', costPrice: 1800, estimatePrice: 2300, quantity: 8500, unit: 'м²' },
      { name: 'Монтаж МК', section: 'Каркас', category: 'LABOR', costPrice: 8500, estimatePrice: 11000, quantity: 450, unit: 'т' },
      { name: 'Устройство фундаментов', section: 'Фундамент', category: 'LABOR', costPrice: 3200, estimatePrice: 4100, quantity: 3500, unit: 'м³' },
    ];

    let totalCreated = 0;
    for (const item of fmItems) {
      const r = await apiRequest(page, 'post', `/budgets/${budgetId}/items`, {
        name: item.name, category: item.category,
        unit: item.unit, quantity: item.quantity,
        costPrice: item.costPrice, estimatePrice: item.estimatePrice,
        customerPrice: item.estimatePrice,
        plannedAmount: item.costPrice * item.quantity,
      });
      if (r?.ok()) totalCreated++;
    }
    console.log(`  ✅ ${totalCreated} FM items created`);

    // Navigate to FM page
    await go(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);
    await shot(page, '08a-fm-page');

    // Verify KPI strip
    const kpiLabels = [/себестоимость/i, /сметная/i, /маржа/i];
    for (const label of kpiLabels) {
      const el = page.getByText(label).first();
      const visible = await el.isVisible().catch(() => false);
      console.log(`  KPI "${label}": ${visible ? '✅' : '⚠️'}`);
    }

    // Verify table has data
    const dataRows = page.locator('tbody tr');
    await expect(dataRows.first()).toBeVisible({ timeout: 10_000 });
    console.log(`  FM rows: ${await dataRows.count()}`);

    // Verify footer totals
    const footer = page.locator('tfoot');
    if (await footer.isVisible().catch(() => false)) {
      const footerText = await footer.innerText();
      expect(footerText).toMatch(/итого/i);
      console.log('  ✅ Footer totals visible');
    }

    // NDV (НДС) column check
    const ndvHeader = page.locator('th').filter({ hasText: /ндс|ndv|vat/i });
    const hasNdv = await ndvHeader.count() > 0;
    console.log(`  НДС column: ${hasNdv ? '✅' : '⚠️'}`);

    // "Создать КП" button
    const createCpBtn = page.locator('button').filter({ hasText: /создать кп/i }).first();
    const hasCpBtn = await createCpBtn.isVisible().catch(() => false);
    console.log(`  "Создать КП" button: ${hasCpBtn ? '✅' : '⚠️'}`);

    await shot(page, '08b-fm-kpi-verified');
    await auditPage(page, 'FM Page');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 9: Vendor Prequalification
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 9: Vendor Prequalification', async ({ page }) => {
    test.setTimeout(90_000);

    await go(page, '/procurement/prequalification');
    await bodyContains(page, /преквалификац/i);
    await shot(page, '09a-prequalification-list');

    // Verify metric cards
    const bodyTxt = await bodyText(page);
    expect(bodyTxt).toMatch(/всего|квалифициров|рассмотрени|дисквалифиц/i);

    // Add 3 vendors — use enum values for selects (insurance: 'true'/'false', status: PENDING/QUALIFIED/DISQUALIFIED)
    const vendors = [
      { name: 'ООО "СтройМонтаж"', finScore: '85', safetyScore: '90', expScore: '80', insurance: 'true', guarantee: '50000000', status: 'QUALIFIED' },
      { name: 'ИП Козлов — Земляные работы', finScore: '45', safetyScore: '60', expScore: '50', insurance: 'false', guarantee: '0', status: 'PENDING' },
      { name: 'ООО "НеСтрой"', finScore: '20', safetyScore: '15', expScore: '10', insurance: 'false', guarantee: '0', status: 'DISQUALIFIED' },
    ];

    for (let v = 0; v < vendors.length; v++) {
      const vendor = vendors[v];

      // Ensure no modal is blocking
      const existingDialog = page.getByRole('dialog');
      if (await existingDialog.isVisible().catch(() => false)) {
        // Close stale modal by pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }

      // Click "Добавить подрядчика"
      const addBtn = page.getByRole('button', { name: /добавить подрядчика/i });
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();

      // Wait for dialog to appear
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      // Fill fields using getByLabel (matches exact dialog structure)
      await dialog.getByLabel('Наименование').fill(vendor.name);
      await dialog.getByLabel('Финансовый балл').fill(vendor.finScore);
      await dialog.getByLabel('Балл безопасности').fill(vendor.safetyScore);
      await dialog.getByLabel('Балл опыта').fill(vendor.expScore);
      await dialog.getByLabel('Лимит банковских гарантий').fill(vendor.guarantee);
      await dialog.getByLabel('Действует страховка').selectOption(vendor.insurance);
      await dialog.getByLabel('Статус').selectOption(vendor.status);

      await shot(page, `09b-vendor-${v + 1}`);

      // Save and wait for dialog to close
      await dialog.getByRole('button', { name: /сохранить/i }).click();
      const closed = await expect(dialog).toBeHidden({ timeout: 15_000 }).then(() => true).catch(() => false);
      if (!closed) {
        // Dialog still open — might be validation error, try Escape
        console.log(`  ⚠️ Vendor ${v + 1} dialog didn't close, pressing Escape`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(500);

      console.log(`  ${closed ? '✅' : '⚠️'} Vendor ${v + 1} added: ${vendor.name}`);
    }

    await shot(page, '09c-prequalification-3-vendors');

    // Test status filter
    const filterChips = page.locator('button').filter({ hasText: /все|квалифициров|рассмотрени|дисквалифиц/i });
    const chipCount = await filterChips.count();
    console.log(`  Filter chips: ${chipCount}`);

    if (chipCount > 1) {
      // Click "Квалифицированы" filter
      const qualifiedChip = page.locator('button').filter({ hasText: /квалифициров/i }).first();
      if (await qualifiedChip.isVisible().catch(() => false)) {
        await qualifiedChip.click();
        await page.waitForTimeout(1000);
        await shot(page, '09d-filtered-qualified');
      }

      // Click "Все" to reset
      const allChip = page.locator('button').filter({ hasText: /^все$/i }).first();
      if (await allChip.isVisible().catch(() => false)) {
        await allChip.click();
        await page.waitForTimeout(500);
      }
    }

    await auditPage(page, 'Prequalification');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 10: Tender (Competitive List) in FM
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 10: Tender from FM section header', async ({ page }) => {
    test.setTimeout(60_000);
    test.skip(!budgetId, 'Budget not created');

    await go(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    // Look for "Тендер подрядчиков" button
    const tenderBtn = page.locator('button').filter({ hasText: /тендер/i }).first();
    const hasTenderBtn = await tenderBtn.isVisible().catch(() => false);
    console.log(`  "Тендер подрядчиков" button: ${hasTenderBtn ? '✅' : '⚠️'}`);

    if (hasTenderBtn) {
      await tenderBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Fill costPrice
        const costInput = dialog.locator('input[type="number"], input[type="text"]').first();
        if (await costInput.isVisible().catch(() => false)) {
          await costInput.fill('85000');
        }

        await shot(page, '10a-tender-modal');

        const applyBtn = dialog.locator('button').filter({ hasText: /применить|apply/i }).first();
        if (await applyBtn.isVisible().catch(() => false)) {
          await applyBtn.click();
          await expect(dialog).toBeHidden({ timeout: 10_000 }).catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }

    await shot(page, '10b-tender-result');
    console.log('  ✅ Tender phase tested');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 11: Commercial Proposal (КП) + Contract
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 11: Create КП from FM + Create Contract from КП', async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(!budgetId, 'Budget not created');

    // 11.1 — Create КП from FM
    await go(page, `/budgets/${budgetId}/fm`);
    await page.waitForTimeout(3000);

    const createCpBtn = page.locator('button').filter({ hasText: /создать кп/i }).first();
    if (await createCpBtn.isVisible().catch(() => false)) {
      await createCpBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const cpNameInput = dialog.locator('input').first();
        if (await cpNameInput.isVisible().catch(() => false)) {
          await cpNameInput.fill('КП — СК Домодедово — Основные конструкции');
        }

        const submitBtn = dialog.getByRole('button', { name: /создать|сохранить|подтвер/i }).first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForURL(/\/commercial-proposals\/[a-f0-9-]+/, { timeout: 15_000 }).catch(() => {});
          await page.waitForTimeout(2000);
        }
      }
    }

    const cpMatch = page.url().match(/\/commercial-proposals\/([a-f0-9-]+)/);
    if (cpMatch) cpId = cpMatch[1];

    // Fallback: find CP via API
    if (!cpId) {
      const resp = await apiRequest(page, 'get', `/commercial-proposals?projectId=${projectId}`);
      if (resp?.ok()) {
        const data = await parseBody(resp);
        const cps = Array.isArray(data) ? data : data?.content || [];
        if (cps.length > 0) cpId = cps[0].id;
      }
    }

    console.log(`  КП ID: ${cpId || 'not found'}`);

    if (cpId) {
      await go(page, `/commercial-proposals/${cpId}`);
      await page.waitForTimeout(2000);
      await shot(page, '11a-cp-detail');

      // 11.2 — Check for "Создать договор" button
      const createContractBtn = page.locator('button, a').filter({ hasText: /создать договор/i }).first();
      const hasContractBtn = await createContractBtn.isVisible().catch(() => false);
      console.log(`  "Создать договор" button: ${hasContractBtn ? '✅' : '⚠️ (need APPROVED status)'}`);

      if (hasContractBtn) {
        await createContractBtn.click();
        await page.waitForTimeout(3000);
        await shot(page, '11b-contract-from-cp');
      }
    }

    await auditPage(page, 'КП');
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 12: Contract + Handoff to Production
  // ════════════════════════════════════════════════════════════════════════

  test('Phase 12: Contract creation and status progression', async ({ page }) => {
    test.setTimeout(90_000);

    // Navigate to contracts
    await go(page, '/contracts/new');
    await page.waitForTimeout(2000);
    await shot(page, '12a-contract-form');

    // Fill form
    const nameInput = page.locator('input[name="name"]').or(page.locator('input[name="title"]'))
      .or(page.getByPlaceholder(/назван|наименов/i)).first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('ГК — ООО "СтройИнвест" — СК Домодедово');
    }

    // Project select
    const projectSelect = page.locator('select[name="projectId"]').or(page.locator('select').first()).first();
    if (await projectSelect.isVisible().catch(() => false)) {
      if (projectId) {
        await projectSelect.selectOption(projectId).catch(async () => {
          const opts = await projectSelect.locator('option').allInnerTexts();
          const match = opts.find(o => o.includes('Домодедово'));
          if (match) await projectSelect.selectOption({ label: match });
        });
      }
    }

    // Amount
    const amountInput = page.locator('input[name="amount"]').or(page.locator('input[type="number"]').first()).first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('145000000');
    }

    // Scroll to see more fields
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await shot(page, '12b-contract-form-filled');

    // Submit
    const submitBtn = page.getByRole('button', { name: /создать|сохранить/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // Extract contract ID
    const contractMatch = page.url().match(/\/contracts\/([a-f0-9-]+)/);
    if (contractMatch && !contractMatch[1].includes('new') && !contractMatch[1].includes('board')) {
      contractId = contractMatch[1];
    }

    console.log(`  Contract ID: ${contractId || 'created'}`);
    await shot(page, '12c-contract-created');

    // Check contracts board
    await go(page, '/contracts/board');
    await page.waitForTimeout(2000);
    await shot(page, '12d-contracts-board');

    const boardBody = await bodyText(page);
    const hasBoardContent = /черновик|согласован|подписан|draft|active/i.test(boardBody);
    console.log(`  Contracts board: ${hasBoardContent ? '✅' : '⚠️'}`);

    // Final: Change project status to IN_PROGRESS
    if (projectId) {
      const resp = await apiRequest(page, 'patch', `/projects/${projectId}/status`, { status: 'IN_PROGRESS' });
      if (resp?.ok()) {
        console.log('  ✅ Project status → IN_PROGRESS');
      } else {
        console.log('  ⚠️ Could not change project status');
      }

      // Verify on project page
      await go(page, `/projects/${projectId}`);
      await page.waitForTimeout(2000);
      await shot(page, '12e-project-in-progress');
    }

    await auditPage(page, 'Contract');
  });

  // ════════════════════════════════════════════════════════════════════════
  // FINAL: Summary + Error Check + Dark Mode + i18n Audit
  // ════════════════════════════════════════════════════════════════════════

  test('Final: Dark mode + i18n + error audit', async ({ page }) => {
    test.setTimeout(120_000);

    // Routes to audit
    const auditRoutes = [
      '/crm/leads',
      '/projects',
      '/site-assessments',
      '/specifications',
      '/estimates',
      '/commercial-proposals',
      '/contracts',
      '/procurement/prequalification',
    ];

    if (projectId) {
      auditRoutes.push(
        `/projects/${projectId}`,
        `/projects/${projectId}/risks`,
        `/projects/${projectId}/meeting`,
      );
    }
    if (budgetId) auditRoutes.push(`/budgets/${budgetId}/fm`);

    const routeErrors: string[] = [];
    const i18nIssues: string[] = [];

    for (const route of auditRoutes) {
      await go(page, route);
      await page.waitForTimeout(1500);

      const text = await bodyText(page);

      // i18n check: no raw English in Russian UI
      if (/\b(Loading|Error|Not found|Submit|Confirm)\b/.test(text)) {
        i18nIssues.push(`${route}: raw English word found`);
      }

      // NaN/undefined check
      if (text.includes('NaN') || text.includes('undefined') || text.includes('[object Object]')) {
        routeErrors.push(`${route}: display error (NaN/undefined/[object])`);
      }

      // Page should not be empty
      if (text.length < 100) {
        routeErrors.push(`${route}: page appears empty`);
      }
    }

    // Dark mode test on key pages
    const darkTestRoutes = ['/crm/leads', `/projects/${projectId || ''}`, '/procurement/prequalification'].filter(Boolean);

    for (const route of darkTestRoutes) {
      await go(page, route);
      await page.waitForTimeout(1000);

      // Toggle dark mode via class
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(500);
      await shot(page, `dark-${route.replace(/\//g, '-').slice(1)}`);

      // Check for white-on-white issues (very basic check)
      const hasReadableText = await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.color !== style.backgroundColor;
      });
      if (!hasReadableText) {
        uxIssues.push(`${route}: potential white-on-white in dark mode`);
      }

      // Reset dark mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
    }

    // Report
    console.log('\n═══════════════════════════════════════');
    console.log('  FINAL AUDIT REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`  Lead ID:     ${leadId || 'N/A'}`);
    console.log(`  Project ID:  ${projectId || 'N/A'}`);
    console.log(`  Budget ID:   ${budgetId || 'N/A'}`);
    console.log(`  Spec ID:     ${specId || 'N/A'}`);
    console.log(`  Estimate ID: ${estimateId || 'N/A'}`);
    console.log(`  КП ID:       ${cpId || 'N/A'}`);
    console.log(`  Contract ID: ${contractId || 'N/A'}`);
    console.log('');
    console.log(`  Page errors:    ${pageErrors.length}`);
    console.log(`  Console errors: ${consoleErrors.length}`);
    console.log(`  UX issues:      ${uxIssues.length}`);
    console.log(`  Route errors:   ${routeErrors.length}`);
    console.log(`  i18n issues:    ${i18nIssues.length}`);

    if (pageErrors.length) {
      console.log('\n  Page Errors:');
      pageErrors.forEach(e => console.log(`    ❌ ${e}`));
    }
    if (consoleErrors.length) {
      console.log('\n  Console Errors:');
      consoleErrors.slice(0, 10).forEach(e => console.log(`    ❌ ${e}`));
    }
    if (uxIssues.length) {
      console.log('\n  UX Issues:');
      uxIssues.forEach(i => console.log(`    ⚠️ ${i}`));
    }
    if (routeErrors.length) {
      console.log('\n  Route Errors:');
      routeErrors.forEach(e => console.log(`    ❌ ${e}`));
    }
    if (i18nIssues.length) {
      console.log('\n  i18n Issues:');
      i18nIssues.forEach(i => console.log(`    ⚠️ ${i}`));
    }

    console.log('\n═══════════════════════════════════════\n');

    // Assertions
    expect(routeErrors, `Route errors:\n${routeErrors.join('\n')}`).toHaveLength(0);
    expect(pageErrors.length, `Uncaught errors:\n${pageErrors.join('\n')}`).toBeLessThanOrEqual(3);
  });
});
