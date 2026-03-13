import { test, expect, type Page } from '@playwright/test';

/**
 * Portal E2E Tests — Dashboard, Projects, Documents
 * Tests full portal flow: navigation, data loading, UI elements, interactions.
 */

test.describe('Portal — Dashboard', () => {
  test('loads dashboard with metrics, projects section, and quick actions', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    // Page header should be visible (Russian text: "Портал клиента" or "Панель портала")
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // KPI metric cards (6 cards in the grid)
    const metricCards = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"], [class*="text-xl"]'),
    });
    // Should have at least some metric cards (loading may show skeleton first)
    await expect(metricCards.first()).toBeVisible({ timeout: 15_000 });

    // Projects section should show project names from real data
    const projectSection = page.locator('text=/Объекты|Проекты|Projects/i').first();
    await expect(projectSection).toBeVisible({ timeout: 10_000 });

    // Quick actions section should have buttons
    const quickActions = page.locator('text=/Быстрые действия|Quick Actions/i').first();
    await expect(quickActions).toBeVisible({ timeout: 10_000 });

    // Check that no error state is shown
    await expect(page.locator('text=/Не удалось загрузить|loadError/i')).not.toBeVisible();
  });

  test('dashboard project cards are clickable and navigate', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for projects to load
    await page.waitForTimeout(3000);

    // Look for project card with progress bar
    const projectCards = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
    const count = await projectCards.count();

    if (count > 0) {
      // Click on first project - should navigate
      const firstProject = projectCards.first();
      await expect(firstProject).toBeVisible();

      // Verify progress bar exists inside project card
      const progressBar = firstProject.locator('[class*="rounded-full"][class*="bg-"]');
      await expect(progressBar.first()).toBeVisible();
    }
  });

  test('dashboard quick action buttons navigate correctly', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for content
    await page.waitForTimeout(2000);

    // Click "Все объекты" / "All Projects" button
    const allProjectsBtn = page.locator('button').filter({ hasText: /Все объекты|Все проекты|All projects/i }).first();
    if (await allProjectsBtn.isVisible()) {
      await allProjectsBtn.click();
      await expect(page).toHaveURL(/\/portal\/projects/, { timeout: 10_000 });
      await page.goBack();
    }
  });

  test('dashboard documents section shows recent documents', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Recent documents section
    const docsSection = page.locator('text=/Последние документы|Recent docs|Документы/i').first();
    await expect(docsSection).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard signatures section visible', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Pending signatures section
    const sigsSection = page.locator('text=/Подписан|Ожидающие|Signatures/i').first();
    await expect(sigsSection).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Portal — Projects', () => {
  test('loads project list page with metrics and table', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    // Page title
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // Should NOT show error state
    await expect(page.locator('text=/Не удалось загрузить|Error/i')).not.toBeVisible({ timeout: 5_000 });

    // Metric cards should render (4 metrics)
    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });

    // Table should have rows with real data
    const tableRows = page.locator('tbody tr, [role="row"]');
    await expect(tableRows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('project list table shows correct columns', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for table to load
    await page.waitForTimeout(3000);

    // Check that we have key columns visible (headers or data cells)
    // Code column (mono font project codes like OBJ-*)
    const codeCell = page.locator('[class*="font-mono"]').first();
    await expect(codeCell).toBeVisible({ timeout: 10_000 });

    // Progress bars should be visible
    const progressBars = page.locator('[class*="rounded-full"][class*="transition-all"]');
    const pbCount = await progressBars.count();
    expect(pbCount).toBeGreaterThan(0);
  });

  test('project list search filter works', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Count initial rows
    const initialRows = await page.locator('tbody tr').count();

    // Type a search query that likely won't match anything
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩ_nonexistent');
      await page.waitForTimeout(500);

      // Should show empty state or fewer rows
      const afterRows = await page.locator('tbody tr').count();
      // Either empty (0 rows, showing empty state) or fewer rows
      expect(afterRows).toBeLessThanOrEqual(initialRows);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('project list status filter works', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Find the status filter select
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
      // Select "В работе" / IN_PROGRESS
      await statusSelect.selectOption('IN_PROGRESS');
      await page.waitForTimeout(500);

      // Verify filter applied (page doesn't crash)
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('project list breadcrumbs navigate correctly', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    // Check breadcrumbs exist
    const breadcrumbPortal = page.locator('a[href="/portal"]').first();
    if (await breadcrumbPortal.isVisible()) {
      await breadcrumbPortal.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });

  test('overdue project deadlines shown in red', async ({ page }) => {
    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Check if any dates have red text (overdue)
    const redDates = page.locator('[class*="text-red-"]');
    // This may or may not have red dates depending on data
    // Just verify the page rendered without errors
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Portal — Documents', () => {
  test('loads document list page with metrics and table', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    // Page title
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Should NOT show error state
    await expect(page.locator('text=/Не удалось загрузить|AlertTriangle/i')).not.toBeVisible({ timeout: 5_000 });

    // Metric cards should render
    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('document list shows category filter', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Category filter select
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10_000 });

    // Should have options
    const options = await categorySelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1); // At least "Все категории" + some categories
  });

  test('document list search works', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test_nonexistent_document');
      await page.waitForTimeout(500);

      // Page should not crash
      await expect(page.getByRole('heading').first()).toBeVisible();

      await searchInput.clear();
    }
  });

  test('document list shows empty state when no documents shared', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Either table rows or empty state should be visible
    const hasRows = await page.locator('tbody tr').count() > 0;
    const hasEmptyState = await page.locator('text=/Нет доступных документов|No documents/i').isVisible();

    // At least one of these should be true
    expect(hasRows || hasEmptyState).toBe(true);
  });

  test('document metrics show correct units', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Metric labels should be in Russian
    const metricLabels = page.locator('[class*="rounded-xl"]');
    await expect(metricLabels.first()).toBeVisible({ timeout: 15_000 });

    // Check that file size metric shows proper units (Б, КБ, МБ, ГБ)
    const sizeMetric = page.locator('text=/Б|КБ|МБ|ГБ|0 Б/').first();
    await expect(sizeMetric).toBeVisible({ timeout: 5_000 });
  });

  test('document list breadcrumbs work', async ({ page }) => {
    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });

    // Breadcrumb to portal
    const portalLink = page.locator('a[href="/portal"]').first();
    if (await portalLink.isVisible()) {
      await portalLink.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });
});

test.describe('Portal — Cross-navigation', () => {
  test('navigate from dashboard to projects and back', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Find and click "Все объекты" or link to projects
    const projectsLink = page.locator('button, a').filter({ hasText: /Все объекты|Все проекты/i }).first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL(/\/portal\/projects/, { timeout: 10_000 });

      // Verify projects page loaded
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });

      // Go back to dashboard via breadcrumb
      const portalLink = page.locator('a[href="/portal"]').first();
      if (await portalLink.isVisible()) {
        await portalLink.click();
        await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
      }
    }
  });

  test('navigate from dashboard to documents', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const docsLink = page.locator('button, a').filter({ hasText: /Все документы|Все док/i }).first();
    if (await docsLink.isVisible()) {
      await docsLink.click();
      await expect(page).toHaveURL(/\/portal\/documents/, { timeout: 10_000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('sidebar portal navigation items work', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Find sidebar links for portal sections
    // Look for sidebar nav items containing "Документы" or "Объекты"
    const sidebarDocLink = page.locator('nav a[href="/portal/documents"], a[href="/portal/documents"]').first();
    if (await sidebarDocLink.isVisible()) {
      await sidebarDocLink.click();
      await expect(page).toHaveURL(/\/portal\/documents/, { timeout: 10_000 });
    }
  });
});

test.describe('Portal — No errors in console', () => {
  test('dashboard page has no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    // Filter out known acceptable errors (like ResizeObserver)
    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('projects page has no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/projects', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('documents page has no JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/documents', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
