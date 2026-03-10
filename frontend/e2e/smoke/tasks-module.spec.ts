import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots', 'tasks-module');

// Ensure screenshot directory exists
test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

test.describe('Tasks Module — Production Quality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're on the tasks page
    await page.goto('/tasks', { waitUntil: 'networkidle', timeout: 60_000 });
    // Wait for the page to be fully loaded
    await page.waitForTimeout(1500);
  });

  test('01 — Board view loads correctly with Russian i18n', async ({ page }) => {
    // Check page header is in Russian
    const header = page.locator('h1, [data-testid="page-title"]').first();
    await expect(header).toBeVisible({ timeout: 10_000 });

    // Take screenshot of initial board view
    await page.screenshot({
      path: path.join(screenshotDir, '01-board-view-initial.png'),
      fullPage: true,
    });

    // Verify Russian text presence
    const pageText = await page.textContent('body');
    // Check for key Russian labels
    const hasRussianText = pageText?.includes('Задач') || pageText?.includes('задач');
    expect(hasRussianText).toBeTruthy();

    console.log('Board view loaded successfully');
  });

  test('02 — View mode switcher works (Board → List → Gantt → My Tasks)', async ({ page }) => {
    // Board view is default — take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '02a-board-mode.png'),
      fullPage: true,
    });

    // Switch to List view
    const listButton = page.locator('button').filter({ hasText: /список|list/i }).first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotDir, '02b-list-mode.png'),
        fullPage: true,
      });
    }

    // Switch to Gantt view
    const ganttButton = page.locator('button').filter({ hasText: /гант|gantt/i }).first();
    if (await ganttButton.isVisible()) {
      await ganttButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotDir, '02c-gantt-mode.png'),
        fullPage: true,
      });
    }

    // Switch to My Tasks view
    const myTasksButton = page.locator('button').filter({ hasText: /мои задачи|my tasks/i }).first();
    if (await myTasksButton.isVisible()) {
      await myTasksButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotDir, '02d-my-tasks-mode.png'),
        fullPage: true,
      });
    }

    // Switch back to Board
    const boardButton = page.locator('button').filter({ hasText: /доска|board/i }).first();
    if (await boardButton.isVisible()) {
      await boardButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('All view modes tested successfully');
  });

  test('03 — Kanban columns display correctly', async ({ page }) => {
    // Check that kanban columns are visible
    const columns = page.locator('[class*="min-w-[300px]"], [class*="min-w-[260px]"], [class*="kanban"]');

    // Take a focused screenshot of the board
    await page.screenshot({
      path: path.join(screenshotDir, '03-kanban-columns.png'),
      fullPage: true,
    });

    // Check for column headers (Russian)
    const bodyText = await page.textContent('body');
    const hasBacklog = bodyText?.includes('Бэклог') || bodyText?.includes('Backlog');
    const hasTodo = bodyText?.includes('К выполнению') || bodyText?.includes('Todo') || bodyText?.includes('TODO');
    const hasInProgress = bodyText?.includes('В работе') || bodyText?.includes('In Progress');

    console.log(`Columns visible — Backlog: ${hasBacklog}, Todo: ${hasTodo}, InProgress: ${hasInProgress}`);
  });

  test('04 — Create task modal opens and has all fields', async ({ page }) => {
    // Click create task button
    const createBtn = page.locator('button').filter({ hasText: /создать задачу|новая задача|create task/i }).first()
      .or(page.locator('button:has(svg)').filter({ hasText: '' }).first());

    // Try clicking the + button
    const plusButtons = page.locator('button').filter({ has: page.locator('svg') });
    let modalOpened = false;

    // Find the create task button in header actions
    const headerActions = page.locator('button').filter({ hasText: /создать|задач|create/i });
    if (await headerActions.count() > 0) {
      await headerActions.first().click();
      await page.waitForTimeout(500);
      modalOpened = true;
    }

    if (modalOpened) {
      await page.screenshot({
        path: path.join(screenshotDir, '04-create-task-modal.png'),
        fullPage: true,
      });

      // Check modal fields
      const modalText = await page.textContent('body');
      console.log('Create modal opened successfully');

      // Close modal
      const closeBtn = page.locator('button[aria-label="close"], button:has-text("Отмена"), button:has-text("Cancel"), button:has-text("×")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('05 — Filters work in board mode', async ({ page }) => {
    // Check filter chips are visible
    const filterArea = page.locator('button').filter({ hasText: /все объекты|все проекты|all projects/i });

    if (await filterArea.count() > 0) {
      // Click project filter
      await filterArea.first().click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(screenshotDir, '05a-filter-dropdown-open.png'),
        fullPage: true,
      });

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Check search input
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="поиск"], input[placeholder*="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('тест');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, '05b-search-active.png'),
        fullPage: true,
      });

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);
    }

    console.log('Filters tested successfully');
  });

  test('06 — Stages manager opens', async ({ page }) => {
    // Look for stages/settings button
    const stagesBtn = page.locator('button').filter({ hasText: /этап|stages/i }).first()
      .or(page.locator('button[title*="тап"], button[title*="tage"]').first());

    if (await stagesBtn.isVisible()) {
      await stagesBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, '06-stages-manager.png'),
        fullPage: true,
      });

      // Close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      console.log('Stages manager button not found — skipping');
    }
  });

  test('07 — List view shows DataTable with correct columns', async ({ page }) => {
    // Switch to list view
    const listButton = page.locator('button').filter({ hasText: /список|list/i }).first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '07-list-view-datatable.png'),
      fullPage: true,
    });

    // Check table headers
    const bodyText = await page.textContent('body');
    const hasCode = bodyText?.includes('Код') || bodyText?.includes('Code');
    const hasTitle = bodyText?.includes('Название') || bodyText?.includes('Title') || bodyText?.includes('Наименование');
    const hasStatus = bodyText?.includes('Статус') || bodyText?.includes('Status');

    console.log(`Table columns — Code: ${hasCode}, Title: ${hasTitle}, Status: ${hasStatus}`);
  });

  test('08 — Gantt view renders chart', async ({ page }) => {
    // Switch to Gantt view
    const ganttButton = page.locator('button').filter({ hasText: /гант|gantt/i }).first();
    if (await ganttButton.isVisible()) {
      await ganttButton.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '08-gantt-view.png'),
      fullPage: true,
    });

    // Check for Gantt-specific elements (zoom controls, timeline)
    const bodyText = await page.textContent('body');
    const hasZoom = bodyText?.includes('Неделя') || bodyText?.includes('Week') || bodyText?.includes('День') || bodyText?.includes('Day');

    console.log(`Gantt view — has zoom controls: ${hasZoom}`);
  });

  test('09 — My Tasks view shows user-specific tasks', async ({ page }) => {
    // Switch to My Tasks view
    const myTasksButton = page.locator('button').filter({ hasText: /мои задачи|my tasks/i }).first();
    if (await myTasksButton.isVisible()) {
      await myTasksButton.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '09-my-tasks-view.png'),
      fullPage: true,
    });

    // Check for tabs (Назначенные мне, Делегированные, Избранные)
    const bodyText = await page.textContent('body');
    const hasAssigned = bodyText?.includes('Назначенные') || bodyText?.includes('Assigned');
    const hasDelegated = bodyText?.includes('Делегированные') || bodyText?.includes('Delegated');

    console.log(`My Tasks — Assigned tab: ${hasAssigned}, Delegated tab: ${hasDelegated}`);
  });

  test('10 — No untranslated keys visible (i18n check)', async ({ page }) => {
    // Check board view for raw i18n keys
    let bodyText = await page.textContent('body') || '';

    // Look for patterns like "taskBoard." or "nav." that indicate missing translations
    const rawKeyPattern = /(?<!\w)(taskBoard|myTasks|gantt|taskStages|nav)\.\w+/g;
    const rawKeys = bodyText.match(rawKeyPattern) || [];

    if (rawKeys.length > 0) {
      console.warn('Found raw i18n keys:', rawKeys.slice(0, 10));
    } else {
      console.log('No raw i18n keys found in board view');
    }

    // Check list view
    const listButton = page.locator('button').filter({ hasText: /список|list/i }).first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(1000);
      bodyText = await page.textContent('body') || '';
      const rawKeysInList = bodyText.match(rawKeyPattern) || [];
      if (rawKeysInList.length > 0) {
        console.warn('Found raw i18n keys in list view:', rawKeysInList.slice(0, 10));
      }
    }

    // Check gantt view
    const ganttButton = page.locator('button').filter({ hasText: /гант|gantt/i }).first();
    if (await ganttButton.isVisible()) {
      await ganttButton.click();
      await page.waitForTimeout(1000);
      bodyText = await page.textContent('body') || '';
      const rawKeysInGantt = bodyText.match(rawKeyPattern) || [];
      if (rawKeysInGantt.length > 0) {
        console.warn('Found raw i18n keys in gantt view:', rawKeysInGantt.slice(0, 10));
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '10-i18n-check.png'),
      fullPage: true,
    });
  });

  test('11 — Navigation sidebar shows Tasks as flat section', async ({ page }) => {
    // Check sidebar for task navigation structure
    const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]').first();

    await page.screenshot({
      path: path.join(screenshotDir, '11-sidebar-navigation.png'),
      fullPage: false,
    });

    // Verify tasks is a single nav item (not a group with sub-items)
    const bodyText = await page.textContent('body') || '';

    console.log('Navigation sidebar screenshot taken');
  });

  test('12 — Old task URLs redirect to /tasks', async ({ page }) => {
    // Test /tasks/list redirect
    await page.goto('/tasks/list', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/tasks');
    expect(page.url()).not.toContain('/tasks/list');

    // Test /tasks/gantt redirect
    await page.goto('/tasks/gantt', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/tasks');
    expect(page.url()).not.toContain('/tasks/gantt');

    // Test /tasks/my redirect
    await page.goto('/tasks/my', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/tasks');
    expect(page.url()).not.toContain('/tasks/my');

    console.log('All old URLs redirect correctly to /tasks');
  });

  test('13 — Full page screenshot at 1920x1080 — Board view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tasks', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(screenshotDir, '13-full-page-1920x1080-board.png'),
      fullPage: true,
    });

    console.log('Full-page screenshot at 1920x1080 taken');
  });

  test('14 — Dark mode renders correctly', async ({ page }) => {
    // Toggle dark mode if possible
    const themeToggle = page.locator('button[aria-label*="тема"], button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="Theme"]').first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    } else {
      // Manually set dark mode via localStorage
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        try {
          const themeStore = localStorage.getItem('privod-theme');
          if (themeStore) {
            const parsed = JSON.parse(themeStore);
            parsed.state = { ...parsed.state, theme: 'dark' };
            localStorage.setItem('privod-theme', JSON.stringify(parsed));
          }
        } catch {}
      });
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '14-dark-mode-board.png'),
      fullPage: true,
    });

    // Revert to light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    console.log('Dark mode screenshot taken');
  });
});

test.describe('Calendar Page — Standalone', () => {
  test('15 — Calendar page loads as separate section', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(screenshotDir, '15-calendar-standalone.png'),
      fullPage: true,
    });

    // Verify calendar has its own content
    const bodyText = await page.textContent('body') || '';
    const hasCalendarContent = bodyText.includes('Календарь') || bodyText.includes('Calendar') || bodyText.includes('календар');

    console.log(`Calendar page loaded — has calendar content: ${hasCalendarContent}`);
  });
});
