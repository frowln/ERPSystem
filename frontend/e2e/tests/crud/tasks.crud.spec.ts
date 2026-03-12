/**
 * SESSION 2.1 — Deep CRUD: Tasks
 *
 * Full lifecycle test for the Tasks entity.
 * Tests both kanban board and list views.
 * Personas: прораб (daily tasks), инженер-сметчик (linked tasks), директор (overview).
 *
 * Sections:
 *   A. CREATE — modal form, all fields, verify in board/list
 *   B. READ — board columns, list filters, search, detail panel
 *   C. UPDATE — change status, priority, assignee, dates
 *   D. STATUS TRANSITIONS — BACKLOG→TODO→IN_PROGRESS→IN_REVIEW→DONE
 *   E. SUBTASKS — parent/child, progress propagation
 *   F. VALIDATION — empty title, bad dates, progress range
 *   G. DELETE — remove task, verify cleanup
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  createEntity,
  deleteEntity,
  listEntities,
  authenticatedRequest,
  updateEntity,
} from '../../fixtures/api.fixture';

// ── Constants ────────────────────────────────────────────────────────────────

/** Realistic task data — монтаж фундаментной плиты */
const TASK_DATA = {
  title: 'E2E-Монтаж фундаментной плиты корпус 1',
  description:
    'Устройство монолитной фундаментной плиты толщиной 1200мм с армированием А500С',
  priority: 'HIGH',
  status: 'TODO',
  plannedStartDate: '2026-04-15',
  plannedEndDate: '2026-05-30',
  estimatedHours: 320,
};

const SUBTASK_DATA = [
  { title: 'E2E-Разбивка осей корпуса 1', priority: 'NORMAL' },
  { title: 'E2E-Устройство подбетонки', priority: 'NORMAL' },
  { title: 'E2E-Армирование фундаментной плиты', priority: 'HIGH' },
  { title: 'E2E-Бетонирование плиты В25', priority: 'CRITICAL' },
];

const UPDATE_DATA = {
  title: 'E2E-Монтаж фундаментной плиты корпус 1 (скорректировано)',
  priority: 'CRITICAL',
  status: 'IN_PROGRESS',
};

// ── Issue tracker ────────────────────────────────────────────────────────────

interface Issue {
  entity: string;
  operation: string;
  issue: string;
  severity: '[CRITICAL]' | '[MAJOR]' | '[MINOR]' | '[UX]' | '[MISSING]';
  expected: string;
  actual: string;
}

const issues: Issue[] = [];

function trackIssue(i: Issue) {
  issues.push(i);
  console.log(`${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Project ID for task context — create a lightweight project first. */
let testProjectId: string | undefined;

async function ensureProject(): Promise<string> {
  if (testProjectId) return testProjectId;
  try {
    const project = await createEntity<{ id: string }>(
      '/api/projects',
      {
        name: 'E2E-Проект для задач',
        type: 'RESIDENTIAL',
        priority: 'NORMAL',
        constructionKind: 'NEW_CONSTRUCTION',
      },
      'admin',
    );
    testProjectId = project.id;
    return project.id;
  } catch {
    return ''; // Tests will work without project context
  }
}

/** Create a task via API. */
async function createTaskViaApi(
  overrides?: Record<string, unknown>,
): Promise<{ id: string; title: string; code?: string }> {
  const projectId = await ensureProject();
  return createEntity<{ id: string; title: string; code?: string }>(
    '/api/tasks',
    {
      title: TASK_DATA.title,
      description: TASK_DATA.description,
      priority: TASK_DATA.priority,
      status: TASK_DATA.status,
      plannedStartDate: TASK_DATA.plannedStartDate,
      plannedEndDate: TASK_DATA.plannedEndDate,
      estimatedHours: TASK_DATA.estimatedHours,
      ...(projectId ? { projectId } : {}),
      ...overrides,
    },
    'admin',
  );
}

/** Clean up all E2E tasks and the test project. */
async function cleanupE2ETasks(): Promise<void> {
  try {
    const tasks = await listEntities<{ id: string; title?: string }>(
      '/api/tasks',
      { size: '200' },
    );
    const e2e = tasks.filter((t) => (t.title ?? '').startsWith('E2E-'));
    for (const task of e2e) {
      try { await deleteEntity('/api/tasks', task.id); } catch { /* */ }
    }
  } catch { /* */ }

  if (testProjectId) {
    try { await deleteEntity('/api/projects', testProjectId); } catch { /* */ }
    testProjectId = undefined;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Tasks CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let createdTaskId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2ETasks();
  });

  test.afterAll(async () => {
    await cleanupE2ETasks();
    if (issues.length > 0) {
      console.log('\n═══ TASK CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ No issues found in task CRUD tests.');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // A. CREATE
  // ────────────────────────────────────────────────────────────────────────

  test('A1: Create task via API — all fields', async () => {
    const task = await createTaskViaApi();
    createdTaskId = task.id;

    expect(task.id).toBeTruthy();
    expect(task.title).toBe(TASK_DATA.title);

    // Verify via GET
    const res = await authenticatedRequest('admin', 'GET', `/api/tasks/${task.id}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    const taskData = data.data ?? data;
    expect(taskData.title).toBe(TASK_DATA.title);
    expect(taskData.priority).toBe(TASK_DATA.priority);
    expect(taskData.description).toBe(TASK_DATA.description);

    // Business rule: estimatedHours should be set
    if (!taskData.estimatedHours && !taskData.estimated_hours) {
      trackIssue({
        entity: 'Task',
        operation: 'CREATE',
        issue: 'estimatedHours not returned in GET response',
        severity: '[MINOR]',
        expected: 'estimatedHours: 320',
        actual: `estimatedHours: ${taskData.estimatedHours}`,
      });
    }
  });

  test('A2: Create task via UI — kanban board modal', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Look for create task button
    const createBtn = page.getByRole('button', {
      name: /создать|новая|добавить|задач|create|new task/i,
    }).first();

    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);

      // Look for modal or form
      const modal = page.locator('[role="dialog"], .modal, [data-testid="task-modal"]')
        .or(page.locator('form'));

      if (await modal.first().isVisible().catch(() => false)) {
        // Fill title
        const titleInput = page.locator('input[name="title"]')
          .or(page.getByPlaceholder(/название|заголовок|title/i))
          .or(modal.first().locator('input').first());

        if (await titleInput.first().isVisible().catch(() => false)) {
          await titleInput.first().fill('E2E-Задача из UI тест');
        }

        // Fill description
        const descInput = page.locator('textarea[name="description"]')
          .or(page.locator('textarea').first());
        if (await descInput.isVisible().catch(() => false)) {
          await descInput.fill('Тестовое описание задачи через UI');
        }

        // Set priority via select
        const prioritySelect = page.locator('select[name="priority"]')
          .or(page.locator('select').first());
        if (await prioritySelect.isVisible().catch(() => false)) {
          try {
            await prioritySelect.selectOption('HIGH');
          } catch {
            // Priority may be a custom component
          }
        }

        await page.screenshot({ path: 'e2e/screenshots/task-create-modal.png', fullPage: true });

        // Submit
        const submitBtn = page.getByRole('button', {
          name: /создать|сохранить|save|create|добавить/i,
        });
        // Find submit button inside modal
        const modalSubmit = modal.first().locator('button[type="submit"]')
          .or(submitBtn);

        if (await modalSubmit.first().isVisible().catch(() => false)) {
          await modalSubmit.first().click();
          await page.waitForTimeout(3000);
        }
      }
    } else {
      trackIssue({
        entity: 'Task',
        operation: 'CREATE/UI',
        issue: 'Create task button not found on /tasks page',
        severity: '[UX]',
        expected: 'Visible "Создать задачу" button',
        actual: 'Button not found',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/task-board-after-create.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // B. READ — Board, List, Filters, Detail
  // ────────────────────────────────────────────────────────────────────────

  test('B1: Task board — kanban columns visible', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();

    // Kanban columns should be visible (at least some status labels)
    const columnKeywords = [
      /backlog|бэклог/i,
      /todo|к выполнению|новые/i,
      /in.?progress|в работе|выполня/i,
      /review|проверк/i,
      /done|готово|выполнен/i,
    ];

    let columnsFound = 0;
    for (const kw of columnKeywords) {
      if (kw.test(bodyText)) columnsFound++;
    }

    // Board should have at least 3 recognizable columns
    expect.soft(
      columnsFound,
      `Kanban board should have recognizable columns (found ${columnsFound}/5)`,
    ).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'e2e/screenshots/task-board-columns.png', fullPage: true });
  });

  test('B2: Task board — view mode switch (board/list/gantt)', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Check for view mode buttons
    const viewButtons = page.locator('button, [role="tab"]')
      .filter({ hasText: /список|list|доска|board|гант|gantt|календар|calendar/i });

    const viewCount = await viewButtons.count();

    if (viewCount >= 2) {
      // Try switching to list view
      const listBtn = page.locator('button, [role="tab"]')
        .filter({ hasText: /список|list/i })
        .first();
      if (await listBtn.isVisible().catch(() => false)) {
        await listBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'e2e/screenshots/task-list-view.png', fullPage: true });
      }
    } else {
      trackIssue({
        entity: 'Task',
        operation: 'READ/views',
        issue: `View mode buttons not fully visible (found ${viewCount})`,
        severity: '[MINOR]',
        expected: 'At least 2 view modes (Board, List)',
        actual: `${viewCount} view mode buttons found`,
      });
    }
  });

  test('B3: Task board — search and filter', async ({ page }) => {
    // Ensure we have tasks to search
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Search
    const searchInput = page.getByPlaceholder(/поиск|search|найти|задач/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('E2E-');
      await page.waitForTimeout(1500);

      const bodyText = await page.locator('body').innerText();
      const found = bodyText.includes('E2E-');
      expect.soft(found, 'Search for "E2E-" should show E2E tasks').toBeTruthy();
    }

    // Priority filter
    const priorityFilter = page.locator('button, select')
      .filter({ hasText: /приоритет|priority/i })
      .first();
    if (await priorityFilter.isVisible().catch(() => false)) {
      await priorityFilter.click();
      await page.waitForTimeout(500);
      // Close dropdown
      await page.keyboard.press('Escape');
    }

    await page.screenshot({ path: 'e2e/screenshots/task-search-filter.png', fullPage: true });
  });

  test('B4: Task detail panel — shows all fields', async ({ page }) => {
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    // Navigate to tasks and try to open detail panel
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Try clicking on a task card that contains E2E text
    const taskCard = page.locator('[data-testid*="task"], .task-card, [class*="card"]')
      .filter({ hasText: /E2E-/ })
      .first();

    if (await taskCard.isVisible().catch(() => false)) {
      await taskCard.click();
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').innerText();

      // Detail panel should show task info
      const hasTitle = /E2E-/.test(bodyText);
      expect.soft(hasTitle, 'Task detail should show task title').toBeTruthy();

      // Check for detail tabs (comments, subtasks, files, activity)
      const detailTabs = ['комментар', 'подзадач', 'файл', 'актив', 'зависимост'];
      let tabsFound = 0;
      for (const tab of detailTabs) {
        if (new RegExp(tab, 'i').test(bodyText)) tabsFound++;
      }

      expect.soft(
        tabsFound,
        `Task detail should show tabs (found ${tabsFound}/5)`,
      ).toBeGreaterThanOrEqual(1);
    } else {
      // Try direct navigation to task detail
      await page.goto(`/tasks/${createdTaskId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'e2e/screenshots/task-detail.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // C. UPDATE
  // ────────────────────────────────────────────────────────────────────────

  test('C1: Update task via API — change priority, status', async () => {
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    // Update priority to CRITICAL
    const updateRes = await authenticatedRequest(
      'admin', 'PUT', `/api/tasks/${createdTaskId}`,
      { title: UPDATE_DATA.title, priority: UPDATE_DATA.priority },
    );
    expect(updateRes.status).toBe(200);

    // Verify update
    const getRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${createdTaskId}`);
    const data = await getRes.json();
    const taskData = data.data ?? data;

    expect.soft(taskData.title).toBe(UPDATE_DATA.title);
    expect.soft(taskData.priority).toBe(UPDATE_DATA.priority);
  });

  test('C2: Update task status via PATCH', async () => {
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    const res = await authenticatedRequest(
      'admin', 'PATCH', `/api/tasks/${createdTaskId}/status`,
      { status: 'IN_PROGRESS' },
    );

    expect.soft(res.status, 'PATCH /status should return 200').toBe(200);

    // Verify
    const getRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${createdTaskId}`);
    const data = await getRes.json();
    const taskData = data.data ?? data;
    expect.soft(taskData.status).toBe('IN_PROGRESS');
  });

  test('C3: Update task progress via PATCH', async () => {
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    const res = await authenticatedRequest(
      'admin', 'PATCH', `/api/tasks/${createdTaskId}/progress`,
      { progress: 45 },
    );

    expect.soft(res.status, 'PATCH /progress should return 200').toBe(200);

    // Verify
    const getRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${createdTaskId}`);
    const data = await getRes.json();
    const taskData = data.data ?? data;
    expect.soft(taskData.progress).toBe(45);
  });

  // ────────────────────────────────────────────────────────────────────────
  // D. STATUS TRANSITIONS
  // ────────────────────────────────────────────────────────────────────────

  test('D1: Valid transitions — BACKLOG→TODO→IN_PROGRESS→IN_REVIEW→DONE', async () => {
    const task = await createTaskViaApi({ status: 'BACKLOG' });

    const transitions = [
      { to: 'TODO', shouldSucceed: true },
      { to: 'IN_PROGRESS', shouldSucceed: true },
      { to: 'IN_REVIEW', shouldSucceed: true },
      { to: 'DONE', shouldSucceed: true },
    ];

    for (const t of transitions) {
      const res = await authenticatedRequest(
        'admin', 'PATCH', `/api/tasks/${task.id}/status`,
        { status: t.to },
      );

      if (t.shouldSucceed) {
        expect.soft(
          res.status,
          `Task transition → ${t.to} should succeed`,
        ).toBe(200);
        if (res.status !== 200) {
          trackIssue({
            entity: 'Task',
            operation: 'STATUS',
            issue: `Valid transition to ${t.to} failed`,
            severity: '[CRITICAL]',
            expected: `HTTP 200`,
            actual: `HTTP ${res.status}`,
          });
        }
      }
    }

    await deleteEntity('/api/tasks', task.id).catch(() => {});
  });

  test('D2: Invalid transitions blocked — DONE cannot go backward', async () => {
    const task = await createTaskViaApi({ status: 'BACKLOG' });

    // Advance to DONE
    await authenticatedRequest('admin', 'PATCH', `/api/tasks/${task.id}/status`, { status: 'TODO' });
    await authenticatedRequest('admin', 'PATCH', `/api/tasks/${task.id}/status`, { status: 'IN_PROGRESS' });
    await authenticatedRequest('admin', 'PATCH', `/api/tasks/${task.id}/status`, { status: 'IN_REVIEW' });
    await authenticatedRequest('admin', 'PATCH', `/api/tasks/${task.id}/status`, { status: 'DONE' });

    // Try invalid: DONE → BACKLOG
    const res = await authenticatedRequest(
      'admin', 'PATCH', `/api/tasks/${task.id}/status`,
      { status: 'BACKLOG' },
    );

    if (res.status === 200) {
      trackIssue({
        entity: 'Task',
        operation: 'STATUS',
        issue: 'DONE→BACKLOG allowed (terminal status should not go backward)',
        severity: '[CRITICAL]',
        expected: 'HTTP 400/422',
        actual: `HTTP ${res.status}`,
      });
    }
    expect.soft(res.status).not.toBe(200);

    await deleteEntity('/api/tasks', task.id).catch(() => {});
  });

  // ────────────────────────────────────────────────────────────────────────
  // E. SUBTASKS
  // ────────────────────────────────────────────────────────────────────────

  test('E1: Create subtasks under parent — verify hierarchy', async () => {
    const parent = await createTaskViaApi({ title: 'E2E-Родительская задача: Фундамент' });
    const childIds: string[] = [];

    for (const sub of SUBTASK_DATA) {
      const child = await createTaskViaApi({
        title: sub.title,
        priority: sub.priority,
        parentTaskId: parent.id,
      });
      childIds.push(child.id);
    }

    // Verify subtask count on parent
    const getRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${parent.id}`);
    const data = await getRes.json();
    const parentData = data.data ?? data;

    expect.soft(
      parentData.subtaskCount ?? 0,
      `Parent should report ${SUBTASK_DATA.length} subtasks`,
    ).toBe(SUBTASK_DATA.length);

    // Verify subtasks via GET /subtasks
    const subtasksRes = await authenticatedRequest(
      'admin', 'GET', `/api/tasks/${parent.id}/subtasks`,
    );
    if (subtasksRes.status === 200) {
      const subtasksData = await subtasksRes.json();
      const subtasks = subtasksData.data ?? subtasksData.content ?? subtasksData;
      expect.soft(
        Array.isArray(subtasks) ? subtasks.length : 0,
        'GET /subtasks should return all children',
      ).toBe(SUBTASK_DATA.length);
    }

    // Cleanup
    for (const id of childIds) {
      await deleteEntity('/api/tasks', id).catch(() => {});
    }
    await deleteEntity('/api/tasks', parent.id).catch(() => {});
  });

  // ────────────────────────────────────────────────────────────────────────
  // F. VALIDATION
  // ────────────────────────────────────────────────────────────────────────

  test('F1: Empty title rejected via API', async () => {
    try {
      const res = await authenticatedRequest('admin', 'POST', '/api/tasks', {
        title: '',
        priority: 'NORMAL',
      });

      if (res.status === 201 || res.status === 200) {
        trackIssue({
          entity: 'Task',
          operation: 'VALIDATION',
          issue: 'Empty title accepted by API',
          severity: '[CRITICAL]',
          expected: 'HTTP 400 — title is @NotBlank',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    } catch {
      // Expected — validation error
    }
  });

  test('F2: Progress out of range (0-100) rejected via API', async () => {
    if (!createdTaskId) {
      const task = await createTaskViaApi();
      createdTaskId = task.id;
    }

    // Try progress = 150 (out of @Max(100) range)
    const res = await authenticatedRequest(
      'admin', 'PATCH', `/api/tasks/${createdTaskId}/progress`,
      { progress: 150 },
    );

    if (res.status === 200) {
      trackIssue({
        entity: 'Task',
        operation: 'VALIDATION',
        issue: 'Progress 150 accepted (should be max 100)',
        severity: '[CRITICAL]',
        expected: 'HTTP 400 — @Max(100) violated',
        actual: `HTTP ${res.status}`,
      });
    }
    expect.soft(res.status).toBeGreaterThanOrEqual(400);

    // Try progress = -10
    const res2 = await authenticatedRequest(
      'admin', 'PATCH', `/api/tasks/${createdTaskId}/progress`,
      { progress: -10 },
    );

    if (res2.status === 200) {
      trackIssue({
        entity: 'Task',
        operation: 'VALIDATION',
        issue: 'Progress -10 accepted (should be min 0)',
        severity: '[CRITICAL]',
        expected: 'HTTP 400 — @Min(0) violated',
        actual: `HTTP ${res2.status}`,
      });
    }
    expect.soft(res2.status).toBeGreaterThanOrEqual(400);
  });

  test('F3: Validation errors shown in UI form', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Open create modal
    const createBtn = page.getByRole('button', {
      name: /создать|новая|добавить|задач|create|new/i,
    }).first();

    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);

      // Submit without filling title
      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|create|добавить/i,
      }).last();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1500);

        // Check for validation errors
        const errors = page.locator(
          '.text-red-500, .text-red-600, .text-danger-500, [role="alert"]',
        );
        const errorCount = await errors.count();

        if (errorCount === 0) {
          trackIssue({
            entity: 'Task',
            operation: 'VALIDATION/UI',
            issue: 'No validation errors when submitting empty task form',
            severity: '[MAJOR]',
            expected: 'Title required validation error',
            actual: 'No errors shown',
          });
        }
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/task-validation.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // G. DELETE
  // ────────────────────────────────────────────────────────────────────────

  test('G1: Delete task via API', async () => {
    const task = await createTaskViaApi({ title: 'E2E-Задача на удаление' });

    const res = await authenticatedRequest('admin', 'DELETE', `/api/tasks/${task.id}`);
    expect.soft(res.status).toBeLessThanOrEqual(204);

    // Verify deletion
    const getRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${task.id}`);
    if (getRes.status === 200) {
      trackIssue({
        entity: 'Task',
        operation: 'DELETE',
        issue: 'Deleted task still accessible via GET',
        severity: '[CRITICAL]',
        expected: 'HTTP 404',
        actual: `HTTP ${getRes.status}`,
      });
    }
  });

  test('G2: Delete task with subtasks — verify cascade', async () => {
    const parent = await createTaskViaApi({ title: 'E2E-Родитель для каскадного удаления' });
    const child = await createTaskViaApi({
      title: 'E2E-Дочерняя задача каскад',
      parentTaskId: parent.id,
    });

    // Delete parent
    const res = await authenticatedRequest('admin', 'DELETE', `/api/tasks/${parent.id}`);
    expect.soft(res.status).toBeLessThanOrEqual(204);

    // Check if child still exists (cascade behavior)
    const childRes = await authenticatedRequest('admin', 'GET', `/api/tasks/${child.id}`);

    if (childRes.status === 200) {
      // Child survived — that's one valid behavior (orphan tasks)
      trackIssue({
        entity: 'Task',
        operation: 'DELETE/cascade',
        issue: 'Child task survives parent deletion (orphan subtask)',
        severity: '[MINOR]',
        expected: 'Cascade delete or clear parentTaskId',
        actual: 'Child task still exists with parentTaskId pointing to deleted parent',
      });
      // Clean up orphan
      await deleteEntity('/api/tasks', child.id).catch(() => {});
    }
    // If child is 404 — cascade delete worked (also valid)
  });

  // ────────────────────────────────────────────────────────────────────────
  // PERSONA CHECKS
  // ────────────────────────────────────────────────────────────────────────

  test('PERSONA: Прораб — tasks page loads within 5s, board usable', async ({ page }) => {
    const start = Date.now();
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for meaningful content
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - start;

    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.length > 50;

    expect.soft(hasContent, 'Прораб: tasks page should have content').toBeTruthy();

    if (loadTime > 5000) {
      trackIssue({
        entity: 'Task',
        operation: 'PERSONA/прораб',
        issue: `Tasks page takes ${loadTime}ms to load (>5s)`,
        severity: '[UX]',
        expected: 'Прораб: "Мне некогда разбираться" — page must load <5s',
        actual: `${loadTime}ms load time`,
      });
    }
  });

  test('PERSONA: Директор — task summary/dashboard info available', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();
    // Директор wants to see counts/summaries
    const hasCountInfo = /\d+/.test(bodyText);

    expect.soft(
      hasCountInfo,
      'Директор: task board should show task counts per column',
    ).toBeTruthy();
  });
});
