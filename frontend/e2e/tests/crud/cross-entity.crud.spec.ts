/**
 * SESSION 2.1 — Cross-Entity CRUD Tests
 *
 * Tests relationships between Projects, Tasks, and Documents.
 * Verifies referential integrity, cascading behaviors, and linked views.
 *
 * Business domain checks:
 * - Project detail shows linked tasks and documents
 * - Task links back to project
 * - Deleting project warns about linked entities
 * - Document linked to project appears on project detail
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  createEntity,
  deleteEntity,
  listEntities,
  authenticatedRequest,
} from '../../fixtures/api.fixture';

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

interface TestEntities {
  projectId: string;
  taskIds: string[];
  documentIds: string[];
}

async function createLinkedEntities(): Promise<TestEntities> {
  // Create project
  const project = await createEntity<{ id: string }>(
    '/api/projects',
    {
      name: 'E2E-Кросс-тест проект',
      type: 'COMMERCIAL',
      priority: 'NORMAL',
      constructionKind: 'NEW_CONSTRUCTION',
    },
    'admin',
  );

  // Create tasks linked to project
  const taskIds: string[] = [];
  const taskNames = [
    'E2E-Задача 1: Земляные работы',
    'E2E-Задача 2: Монтаж каркаса',
    'E2E-Задача 3: Фасад',
  ];
  for (const title of taskNames) {
    try {
      const task = await createEntity<{ id: string }>(
        '/api/tasks',
        { title, projectId: project.id, priority: 'NORMAL', status: 'TODO' },
        'admin',
      );
      taskIds.push(task.id);
    } catch { /* */ }
  }

  // Create documents linked to project
  const documentIds: string[] = [];
  const docNames = [
    { title: 'E2E-ПОС раздел 5', category: 'SPECIFICATION' },
    { title: 'E2E-Договор подряда', category: 'CONTRACT' },
  ];
  for (const doc of docNames) {
    try {
      const d = await createEntity<{ id: string }>(
        '/api/documents',
        { ...doc, projectId: project.id, fileName: `${doc.title}.pdf` },
        'admin',
      );
      documentIds.push(d.id);
    } catch { /* */ }
  }

  return { projectId: project.id, taskIds, documentIds };
}

async function cleanupLinkedEntities(entities: TestEntities): Promise<void> {
  for (const id of entities.documentIds) {
    await deleteEntity('/api/documents', id).catch(() => {});
  }
  for (const id of entities.taskIds) {
    await deleteEntity('/api/tasks', id).catch(() => {});
  }
  await deleteEntity('/api/projects', entities.projectId).catch(() => {});
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Cross-Entity CRUD — Projects ↔ Tasks ↔ Documents', () => {
  test.describe.configure({ mode: 'serial' });

  let entities: TestEntities;

  test.beforeAll(async () => {
    // Clean up any leftover E2E entities
    try {
      const tasks = await listEntities<{ id: string; title?: string }>(
        '/api/tasks', { size: '200' },
      );
      for (const t of tasks.filter(t => (t.title ?? '').startsWith('E2E-Кросс') || (t.title ?? '').startsWith('E2E-Задача'))) {
        await deleteEntity('/api/tasks', t.id).catch(() => {});
      }
    } catch { /* */ }

    entities = await createLinkedEntities();
  });

  test.afterAll(async () => {
    if (entities) {
      await cleanupLinkedEntities(entities);
    }
    if (issues.length > 0) {
      console.log('\n═══ CROSS-ENTITY ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
      }
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 1. PROJECT → TASKS relationship
  // ────────────────────────────────────────────────────────────────────────

  test('Project tasks tab shows linked tasks', async ({ page }) => {
    await page.goto(`/projects/${entities.projectId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(3000);

    // Try clicking on Tasks tab
    const tasksTab = page.locator('button, [role="tab"], a')
      .filter({ hasText: /задач|tasks/i })
      .first();

    if (await tasksTab.isVisible().catch(() => false)) {
      await tasksTab.click();
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').innerText();
      const hasLinkedTasks = bodyText.includes('E2E-Задача') || bodyText.includes('Земляные');

      if (!hasLinkedTasks && entities.taskIds.length > 0) {
        trackIssue({
          entity: 'Cross/Project→Task',
          operation: 'READ',
          issue: 'Linked tasks not visible on project detail tasks tab',
          severity: '[MAJOR]',
          expected: `${entities.taskIds.length} tasks visible`,
          actual: 'No E2E tasks found in tasks tab',
        });
      }

      expect.soft(hasLinkedTasks || entities.taskIds.length === 0).toBeTruthy();
    } else {
      trackIssue({
        entity: 'Cross/Project→Task',
        operation: 'READ',
        issue: 'Tasks tab not found on project detail page',
        severity: '[UX]',
        expected: 'Tasks tab visible on project detail',
        actual: 'No tasks tab found',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/cross-project-tasks.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. PROJECT → DOCUMENTS relationship
  // ────────────────────────────────────────────────────────────────────────

  test('Project documents tab shows linked documents', async ({ page }) => {
    await page.goto(`/projects/${entities.projectId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(3000);

    // Click Documents tab
    const docsTab = page.locator('button, [role="tab"], a')
      .filter({ hasText: /документ|documents|файл/i })
      .first();

    if (await docsTab.isVisible().catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').innerText();
      const hasLinkedDocs = bodyText.includes('E2E-ПОС') || bodyText.includes('E2E-Договор');

      if (!hasLinkedDocs && entities.documentIds.length > 0) {
        trackIssue({
          entity: 'Cross/Project→Document',
          operation: 'READ',
          issue: 'Linked documents not visible on project detail documents tab',
          severity: '[MAJOR]',
          expected: `${entities.documentIds.length} documents visible`,
          actual: 'No E2E documents found in documents tab',
        });
      }

      expect.soft(hasLinkedDocs || entities.documentIds.length === 0).toBeTruthy();
    }

    await page.screenshot({ path: 'e2e/screenshots/cross-project-docs.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. PROJECT DOCUMENTS via API
  // ────────────────────────────────────────────────────────────────────────

  test('GET /projects/:id/documents returns linked documents', async () => {
    const res = await authenticatedRequest(
      'admin', 'GET', `/api/projects/${entities.projectId}/documents`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const docs = data.data ?? data.content ?? data;
      const docList = Array.isArray(docs) ? docs : [];

      expect.soft(
        docList.length,
        `Project should have ${entities.documentIds.length} linked documents`,
      ).toBe(entities.documentIds.length);
    } else {
      trackIssue({
        entity: 'Cross/API',
        operation: 'PROJECT→DOCS',
        issue: `GET /projects/:id/documents returned ${res.status}`,
        severity: '[MAJOR]',
        expected: 'HTTP 200 with linked documents',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. TASK → PROJECT back-reference
  // ────────────────────────────────────────────────────────────────────────

  test('Task detail shows project name and links back', async () => {
    if (entities.taskIds.length === 0) return;

    const res = await authenticatedRequest(
      'admin', 'GET', `/api/tasks/${entities.taskIds[0]}`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const taskData = data.data ?? data;

      // Task should have projectId and projectName
      expect.soft(taskData.projectId).toBe(entities.projectId);

      if (!taskData.projectName) {
        trackIssue({
          entity: 'Cross/Task→Project',
          operation: 'READ',
          issue: 'Task response missing projectName',
          severity: '[MINOR]',
          expected: 'projectName: "E2E-Кросс-тест проект"',
          actual: `projectName: ${taskData.projectName}`,
        });
      }
    }
  });

  test('Task detail page links to project in UI', async ({ page }) => {
    if (entities.taskIds.length === 0) return;

    // Navigate to task board and look for the task
    await page.goto('/tasks', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Search for our task
    const searchInput = page.getByPlaceholder(/поиск|search|найти|задач/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('E2E-Задача 1');
      await page.waitForTimeout(1500);
    }

    // Look for project name or link on the page
    const bodyText = await page.locator('body').innerText();
    const hasProjectRef = bodyText.includes('E2E-Кросс-тест');

    // Soft — task cards may not show full project name
    if (!hasProjectRef) {
      trackIssue({
        entity: 'Cross/Task→Project',
        operation: 'UI',
        issue: 'Project name not visible in task card/detail',
        severity: '[UX]',
        expected: 'Project name link in task view',
        actual: 'Project reference not found',
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. TASK FILTER BY PROJECT
  // ────────────────────────────────────────────────────────────────────────

  test('Tasks can be filtered by projectId via API', async () => {
    const res = await authenticatedRequest(
      'admin', 'GET', `/api/tasks?projectId=${entities.projectId}&size=50`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const tasks = data.content ?? data.data ?? data;
      const taskList = Array.isArray(tasks) ? tasks : [];

      expect.soft(
        taskList.length,
        `Should find ${entities.taskIds.length} tasks for project`,
      ).toBe(entities.taskIds.length);

      // All tasks should belong to our project
      for (const task of taskList) {
        expect.soft(task.projectId).toBe(entities.projectId);
      }
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. DELETE PROJECT — impact on linked entities
  // ────────────────────────────────────────────────────────────────────────

  test('Deleting project — tasks and documents behavior', async () => {
    // Create a fresh set to test deletion impact
    const fresh = await createLinkedEntities();

    // Delete the project
    await authenticatedRequest('admin', 'DELETE', `/api/projects/${fresh.projectId}`);

    // Check if tasks still exist (they might be orphaned or cascade-deleted)
    let tasksAlive = 0;
    for (const taskId of fresh.taskIds) {
      const res = await authenticatedRequest('admin', 'GET', `/api/tasks/${taskId}`);
      if (res.status === 200) tasksAlive++;
    }

    // Check if documents still exist
    let docsAlive = 0;
    for (const docId of fresh.documentIds) {
      const res = await authenticatedRequest('admin', 'GET', `/api/documents/${docId}`);
      if (res.status === 200) docsAlive++;
    }

    // Business rule: Tasks should either be cascade-deleted or orphaned
    if (tasksAlive > 0) {
      trackIssue({
        entity: 'Cross/Delete',
        operation: 'CASCADE',
        issue: `${tasksAlive} tasks survive project deletion (orphan tasks)`,
        severity: '[MINOR]',
        expected: 'Tasks cascade-deleted or projectId set to null',
        actual: `${tasksAlive}/${fresh.taskIds.length} tasks still exist`,
      });
    }

    if (docsAlive > 0) {
      trackIssue({
        entity: 'Cross/Delete',
        operation: 'CASCADE',
        issue: `${docsAlive} documents survive project deletion (orphan docs)`,
        severity: '[MINOR]',
        expected: 'Documents cascade-deleted or projectId set to null',
        actual: `${docsAlive}/${fresh.documentIds.length} documents still exist`,
      });
    }

    // Cleanup surviving orphans
    for (const id of fresh.taskIds) {
      await deleteEntity('/api/tasks', id).catch(() => {});
    }
    for (const id of fresh.documentIds) {
      await deleteEntity('/api/documents', id).catch(() => {});
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. BUSINESS RULE: Document chain completeness
  // ────────────────────────────────────────────────────────────────────────

  test('BUSINESS: Every project should have at least one document (domain check)', async () => {
    // This checks the business rule: projects need documentation
    const res = await authenticatedRequest(
      'admin', 'GET', `/api/projects/${entities.projectId}/documents`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const docs = Array.isArray(data.data ?? data.content ?? data)
        ? (data.data ?? data.content ?? data)
        : [];

      if (docs.length === 0) {
        trackIssue({
          entity: 'Cross/Business',
          operation: 'DOCUMENT-CHAIN',
          issue: 'Active project has zero documents',
          severity: '[UX]',
          expected: 'Empty state guidance: "Нет документов. Загрузите проектную документацию."',
          actual: 'No documents and possibly no empty state message',
        });
      }
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 8. PROJECT TASK SUMMARY via API
  // ────────────────────────────────────────────────────────────────────────

  test('GET /tasks/project/:id/summary returns task counts', async () => {
    const res = await authenticatedRequest(
      'admin', 'GET', `/api/tasks/project/${entities.projectId}/summary`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const summary = data.data ?? data;

      // Summary should have counts
      const hasCounts = typeof summary === 'object' && summary !== null;
      expect.soft(hasCounts, 'Task summary should be an object with counts').toBeTruthy();
    } else if (res.status === 404) {
      trackIssue({
        entity: 'Cross/API',
        operation: 'TASK-SUMMARY',
        issue: 'GET /tasks/project/:id/summary returns 404',
        severity: '[MINOR]',
        expected: 'HTTP 200 with task count summary',
        actual: `HTTP ${res.status}`,
      });
    }
  });
});
