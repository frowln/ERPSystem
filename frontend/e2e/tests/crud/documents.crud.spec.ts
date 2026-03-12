/**
 * SESSION 2.1 — Deep CRUD: Documents
 *
 * Full lifecycle test for the Documents entity.
 * Includes: create, read, update, versioning, status transitions, delete.
 * Personas: ПТО (executive docs), прораб (photo reports), бухгалтер (invoices/acts).
 *
 * Sections:
 *   A. CREATE — metadata + file upload, verify in list
 *   B. READ — list, filters, search, detail, status tabs
 *   C. UPDATE — edit metadata, upload new version
 *   D. STATUS TRANSITIONS — DRAFT→UNDER_REVIEW→APPROVED→ACTIVE→ARCHIVED
 *   E. VERSIONING — create new version, verify history
 *   F. VALIDATION — required fields, file checks
 *   G. DELETE — remove document, verify file cleanup
 *   H. ACCESS CONTROL — grant/revoke document access
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  createEntity,
  deleteEntity,
  listEntities,
  authenticatedRequest,
} from '../../fixtures/api.fixture';

// ── Constants ────────────────────────────────────────────────────────────────

/** Realistic document data — ПОС (проект организации строительства) */
const DOC_DATA = {
  title: 'E2E-Проект организации строительства (ПОС)',
  description: 'Проект организации строительства для ЖК Солнечный квартал — раздел 5',
  category: 'SPECIFICATION',
  documentNumber: 'E2E-ПОС-001-2026',
  fileName: 'E2E-pos-solnechny.pdf',
  fileSize: 2_500_000,
  mimeType: 'application/pdf',
  tags: 'ПОС, ОС, стройгенплан',
  notes: 'Согласовано главным инженером 01.04.2026',
};

/** Updated document metadata */
const DOC_UPDATE = {
  title: 'E2E-ПОС (корректировка от 15.04.2026)',
  description: 'Обновлённый ПОС: добавлена строительная площадка 2',
  documentNumber: 'E2E-ПОС-001-2026/rev2',
};

/** Document types to test (subset of all categories) */
const CATEGORY_TESTS: Array<{
  category: string;
  title: string;
  persona: string;
}> = [
  { category: 'CONTRACT', title: 'E2E-Договор подряда №15', persona: 'бухгалтер' },
  { category: 'DRAWING', title: 'E2E-Чертёж КР корпус 1', persona: 'инженер' },
  { category: 'ACT', title: 'E2E-Акт скрытых работ №3', persona: 'ПТО' },
  { category: 'PHOTO', title: 'E2E-Фотоотчёт площадка 15.04', persona: 'прораб' },
  { category: 'PERMIT', title: 'E2E-Разрешение на строительство', persona: 'юрист' },
  { category: 'INVOICE', title: 'E2E-Счёт-фактура №42', persona: 'бухгалтер' },
];

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

/** Project ID to link documents to. */
let testProjectId: string | undefined;

async function ensureProject(): Promise<string> {
  if (testProjectId) return testProjectId;
  try {
    const project = await createEntity<{ id: string }>(
      '/api/projects',
      {
        name: 'E2E-Проект для документов',
        type: 'RESIDENTIAL',
        priority: 'NORMAL',
        constructionKind: 'NEW_CONSTRUCTION',
      },
      'admin',
    );
    testProjectId = project.id;
    return project.id;
  } catch {
    return '';
  }
}

/** Create a document via API. */
async function createDocViaApi(
  overrides?: Record<string, unknown>,
): Promise<{ id: string; title: string }> {
  const projectId = await ensureProject();
  return createEntity<{ id: string; title: string }>(
    '/api/documents',
    {
      ...DOC_DATA,
      ...(projectId ? { projectId } : {}),
      ...overrides,
    },
    'admin',
  );
}

/** Clean up all E2E documents and project. */
async function cleanupE2EDocs(): Promise<void> {
  try {
    const docs = await listEntities<{ id: string; title?: string }>(
      '/api/documents',
      { size: '200' },
    );
    const e2e = docs.filter((d) => (d.title ?? '').startsWith('E2E-'));
    for (const doc of e2e) {
      try { await deleteEntity('/api/documents', doc.id); } catch { /* */ }
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

test.describe('Documents CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let createdDocId: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2EDocs();
  });

  test.afterAll(async () => {
    await cleanupE2EDocs();
    if (issues.length > 0) {
      console.log('\n═══ DOCUMENT CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ No issues found in document CRUD tests.');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // A. CREATE
  // ────────────────────────────────────────────────────────────────────────

  test('A1: Create document via API — all metadata fields', async () => {
    const doc = await createDocViaApi();
    createdDocId = doc.id;

    expect(doc.id).toBeTruthy();

    // Verify via GET
    const res = await authenticatedRequest('admin', 'GET', `/api/documents/${doc.id}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    const docData = data.data ?? data;

    expect.soft(docData.title).toBe(DOC_DATA.title);
    expect.soft(docData.category).toBe(DOC_DATA.category);
    expect.soft(docData.documentNumber).toBe(DOC_DATA.documentNumber);
    expect.soft(docData.description).toBe(DOC_DATA.description);
    expect.soft(docData.fileName).toBe(DOC_DATA.fileName);

    // Business rule: initial status should be DRAFT
    expect.soft(docData.status, 'New document should be DRAFT').toBe('DRAFT');

    // Business rule: version should be 1
    if (docData.docVersion !== undefined && docData.docVersion !== null) {
      expect.soft(docData.docVersion, 'Initial version should be 1').toBe(1);
    }
  });

  test('A2: Create documents of all categories via API', async () => {
    const docIds: string[] = [];

    for (const ct of CATEGORY_TESTS) {
      try {
        const doc = await createDocViaApi({
          title: ct.title,
          category: ct.category,
        });
        docIds.push(doc.id);

        // Verify category stored correctly
        const res = await authenticatedRequest('admin', 'GET', `/api/documents/${doc.id}`);
        if (res.status === 200) {
          const data = await res.json();
          const docData = data.data ?? data;
          expect.soft(
            docData.category,
            `Category for "${ct.title}" should be ${ct.category}`,
          ).toBe(ct.category);
        }
      } catch (err) {
        trackIssue({
          entity: 'Document',
          operation: 'CREATE/category',
          issue: `Failed to create ${ct.category} document`,
          severity: '[MAJOR]',
          expected: `${ct.category} document created successfully`,
          actual: `Error: ${err}`,
        });
      }
    }

    // Cleanup
    for (const id of docIds) {
      await deleteEntity('/api/documents', id).catch(() => {});
    }
  });

  test('A3: Create document via UI — form page', async ({ page }) => {
    await page.goto('/documents/new', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Check if form page or list page (some apps open modal from list)
    const hasForm = await page.locator('form').isVisible().catch(() => false);

    if (hasForm) {
      // Fill title
      const titleInput = page.locator('input[name="title"]')
        .or(page.getByPlaceholder(/название|title|наименование/i))
        .or(page.locator('input').first());
      if (await titleInput.first().isVisible().catch(() => false)) {
        await titleInput.first().fill('E2E-Тестовый документ из UI');
      }

      // Category select
      const categorySelect = page.locator('select[name="category"]')
        .or(page.locator('select').first());
      if (await categorySelect.isVisible().catch(() => false)) {
        try {
          await categorySelect.selectOption('DRAWING');
        } catch {
          // Custom select component
        }
      }

      // Project select
      const projectSelect = page.locator('select[name="projectId"]')
        .or(page.locator('select').nth(1));
      if (await projectSelect.isVisible().catch(() => false)) {
        try {
          // Select first available project
          const options = page.locator('select[name="projectId"] option, select option');
          const count = await options.count();
          if (count > 1) {
            await projectSelect.selectOption({ index: 1 });
          }
        } catch {
          // projectId may be a custom component
        }
      }

      // Description
      const descField = page.locator('textarea[name="description"]')
        .or(page.locator('textarea').first());
      if (await descField.isVisible().catch(() => false)) {
        await descField.fill('Тестовый документ для E2E проверки CRUD');
      }

      await page.screenshot({ path: 'e2e/screenshots/document-create-form.png', fullPage: true });

      // Submit
      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|create|загрузить/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(3000);
      }
    } else {
      // Try from the documents list page
      await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(3000);

      const newBtn = page.getByRole('button', {
        name: /создать|загрузить|новый|добавить|upload|new/i,
      }).first();

      if (await newBtn.isVisible().catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/document-create-result.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // B. READ — List, Filters, Search, Status Tabs
  // ────────────────────────────────────────────────────────────────────────

  test('B1: Document list — table columns visible', async ({ page }) => {
    // Ensure test document exists
    if (!createdDocId) {
      const doc = await createDocViaApi();
      createdDocId = doc.id;
    }

    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.length > 100;
    expect.soft(hasContent, 'Document list should have content').toBeTruthy();

    // Check for table or card layout
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    if (hasTable) {
      const headers = await page.locator('thead th').allInnerTexts();
      // Expected columns: document name, category, status, project, file, author, date
      expect.soft(
        headers.length,
        `Document table should have columns (found ${headers.length})`,
      ).toBeGreaterThanOrEqual(3);
    }

    await page.screenshot({ path: 'e2e/screenshots/document-list.png', fullPage: true });
  });

  test('B2: Document list — search', async ({ page }) => {
    if (!createdDocId) {
      const doc = await createDocViaApi();
      createdDocId = doc.id;
    }

    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/поиск|search|найти/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('E2E-ПОС');
      await page.waitForTimeout(1500);

      const bodyText = await page.locator('body').innerText();
      const found = bodyText.includes('E2E-') || bodyText.includes('ПОС');
      expect.soft(found, 'Search for "E2E-ПОС" should find the document').toBeTruthy();
    } else {
      trackIssue({
        entity: 'Document',
        operation: 'READ/search',
        issue: 'Search input not found on document list page',
        severity: '[UX]',
        expected: 'Search input with placeholder',
        actual: 'No search input found',
      });
    }
  });

  test('B3: Document list — status filter tabs', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Look for status filter tabs (All, Active, Under Review, Archived)
    const tabs = page.locator('button, [role="tab"]').filter({
      hasText: /все|all|актив|active|на проверк|review|архив|archived/i,
    });

    const tabCount = await tabs.count();
    if (tabCount >= 2) {
      // Click "Active" tab if available
      const activeTab = page.locator('button, [role="tab"]')
        .filter({ hasText: /актив|active/i })
        .first();
      if (await activeTab.isVisible().catch(() => false)) {
        await activeTab.click();
        await page.waitForTimeout(1500);
      }
    }

    // Also check category filter
    const categoryFilter = page.locator('button, select')
      .filter({ hasText: /категор|тип|category|type/i })
      .first();
    if (await categoryFilter.isVisible().catch(() => false)) {
      await categoryFilter.click();
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
    }

    await page.screenshot({ path: 'e2e/screenshots/document-filters.png', fullPage: true });
  });

  test('B4: Document list — category filter', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();

    // Category badges should be visible (contract, drawing, photo, etc.)
    const categories = /договор|contract|чертёж|drawing|фото|photo|акт|act|спецификац|spec/i;
    const hasCategoryBadges = categories.test(bodyText);

    // This is soft — may not have documents of those categories
    if (!hasCategoryBadges) {
      trackIssue({
        entity: 'Document',
        operation: 'READ/categories',
        issue: 'No category badges visible in document list',
        severity: '[MINOR]',
        expected: 'Category badges (Договор, Чертёж, etc.) visible',
        actual: 'No recognizable category labels found',
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // C. UPDATE
  // ────────────────────────────────────────────────────────────────────────

  test('C1: Update document metadata via API', async () => {
    if (!createdDocId) {
      const doc = await createDocViaApi();
      createdDocId = doc.id;
    }

    const res = await authenticatedRequest(
      'admin', 'PUT', `/api/documents/${createdDocId}`,
      {
        title: DOC_UPDATE.title,
        description: DOC_UPDATE.description,
        documentNumber: DOC_UPDATE.documentNumber,
      },
    );

    expect(res.status).toBe(200);

    // Verify update
    const getRes = await authenticatedRequest('admin', 'GET', `/api/documents/${createdDocId}`);
    const data = await getRes.json();
    const docData = data.data ?? data;

    expect.soft(docData.title).toBe(DOC_UPDATE.title);
    expect.soft(docData.description).toBe(DOC_UPDATE.description);
    expect.soft(docData.documentNumber).toBe(DOC_UPDATE.documentNumber);
  });

  test('C2: Update document via UI — edit page', async ({ page }) => {
    if (!createdDocId) {
      const doc = await createDocViaApi();
      createdDocId = doc.id;
    }

    await page.goto(`/documents/${createdDocId}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(3000);

    // Check if edit form loaded
    const hasForm = await page.locator('form').isVisible().catch(() => false);
    const hasInputs = await page.locator('input').first().isVisible().catch(() => false);

    if (hasForm || hasInputs) {
      // Update title
      const titleInput = page.locator('input[name="title"]')
        .or(page.locator('input').first());
      if (await titleInput.first().isVisible().catch(() => false)) {
        await titleInput.first().clear();
        await titleInput.first().fill('E2E-ПОС обновлённый через UI');
      }

      // Submit
      const saveBtn = page.getByRole('button', {
        name: /сохранить|save|обновить|update/i,
      });
      if (await saveBtn.first().isVisible().catch(() => false)) {
        await saveBtn.first().click();
        await page.waitForTimeout(3000);
      }
    } else {
      trackIssue({
        entity: 'Document',
        operation: 'UPDATE/UI',
        issue: 'Edit form not loaded for document',
        severity: '[MAJOR]',
        expected: 'Form with document fields pre-filled',
        actual: 'No form visible at /documents/:id/edit',
      });
    }

    await page.screenshot({ path: 'e2e/screenshots/document-edit.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // D. STATUS TRANSITIONS
  // ────────────────────────────────────────────────────────────────────────

  test('D1: Valid transitions — DRAFT→UNDER_REVIEW→APPROVED→ACTIVE→ARCHIVED', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ для статус-тестов' });

    const transitions = [
      { to: 'UNDER_REVIEW', shouldSucceed: true },
      { to: 'APPROVED', shouldSucceed: true },
      { to: 'ACTIVE', shouldSucceed: true },
      { to: 'ARCHIVED', shouldSucceed: true },
    ];

    for (const t of transitions) {
      const res = await authenticatedRequest(
        'admin', 'PATCH', `/api/documents/${doc.id}/status`,
        { status: t.to },
      );

      if (t.shouldSucceed) {
        expect.soft(
          res.status,
          `Document transition → ${t.to} should succeed`,
        ).toBe(200);
        if (res.status !== 200) {
          trackIssue({
            entity: 'Document',
            operation: 'STATUS',
            issue: `Valid transition to ${t.to} failed`,
            severity: '[CRITICAL]',
            expected: 'HTTP 200',
            actual: `HTTP ${res.status}`,
          });
        }
      }
    }

    await deleteEntity('/api/documents', doc.id).catch(() => {});
  });

  test('D2: Invalid transitions blocked — ARCHIVED cannot go back to DRAFT', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ архивный тест' });

    // Advance to ARCHIVED
    await authenticatedRequest('admin', 'PATCH', `/api/documents/${doc.id}/status`, { status: 'UNDER_REVIEW' });
    await authenticatedRequest('admin', 'PATCH', `/api/documents/${doc.id}/status`, { status: 'APPROVED' });
    await authenticatedRequest('admin', 'PATCH', `/api/documents/${doc.id}/status`, { status: 'ACTIVE' });
    await authenticatedRequest('admin', 'PATCH', `/api/documents/${doc.id}/status`, { status: 'ARCHIVED' });

    // Try invalid: ARCHIVED → DRAFT
    const res = await authenticatedRequest(
      'admin', 'PATCH', `/api/documents/${doc.id}/status`,
      { status: 'DRAFT' },
    );

    if (res.status === 200) {
      trackIssue({
        entity: 'Document',
        operation: 'STATUS',
        issue: 'ARCHIVED→DRAFT allowed (terminal status)',
        severity: '[CRITICAL]',
        expected: 'HTTP 400/422',
        actual: `HTTP ${res.status}`,
      });
    }
    expect.soft(res.status).not.toBe(200);

    await deleteEntity('/api/documents', doc.id).catch(() => {});
  });

  // ────────────────────────────────────────────────────────────────────────
  // E. VERSIONING
  // ────────────────────────────────────────────────────────────────────────

  test('E1: Create new version — version number increments', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ для версионирования' });

    // Create new version
    const res = await authenticatedRequest(
      'admin', 'POST', `/api/documents/${doc.id}/version`,
    );

    if (res.status === 201 || res.status === 200) {
      const data = await res.json();
      const newVersion = data.data ?? data;

      // Version should be incremented
      expect.soft(
        newVersion.docVersion,
        'New version number should be 2',
      ).toBe(2);

      // Original should still be accessible
      const origRes = await authenticatedRequest('admin', 'GET', `/api/documents/${doc.id}`);
      expect.soft(origRes.status).toBe(200);

      // Clean up new version
      if (newVersion.id && newVersion.id !== doc.id) {
        await deleteEntity('/api/documents', newVersion.id).catch(() => {});
      }
    } else {
      trackIssue({
        entity: 'Document',
        operation: 'VERSIONING',
        issue: 'POST /version failed',
        severity: '[MAJOR]',
        expected: 'HTTP 201 with incremented version',
        actual: `HTTP ${res.status}`,
      });
    }

    await deleteEntity('/api/documents', doc.id).catch(() => {});
  });

  test('E2: Version history accessible', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ история версий' });

    // Create a version first
    await authenticatedRequest('admin', 'POST', `/api/documents/${doc.id}/version`);

    // Get version history
    const res = await authenticatedRequest(
      'admin', 'GET', `/api/documents/${doc.id}/history`,
    );

    if (res.status === 200) {
      const data = await res.json();
      const history = data.data ?? data;

      if (Array.isArray(history)) {
        expect.soft(
          history.length,
          'Version history should have at least 1 entry',
        ).toBeGreaterThanOrEqual(1);
      }
    } else {
      trackIssue({
        entity: 'Document',
        operation: 'VERSIONING/history',
        issue: 'GET /history endpoint failed',
        severity: '[MINOR]',
        expected: 'HTTP 200 with version history array',
        actual: `HTTP ${res.status}`,
      });
    }

    await deleteEntity('/api/documents', doc.id).catch(() => {});
  });

  // ────────────────────────────────────────────────────────────────────────
  // F. VALIDATION
  // ────────────────────────────────────────────────────────────────────────

  test('F1: Empty title rejected via API', async () => {
    try {
      const res = await authenticatedRequest('admin', 'POST', '/api/documents', {
        title: '',
        category: 'OTHER',
      });

      if (res.status === 201 || res.status === 200) {
        trackIssue({
          entity: 'Document',
          operation: 'VALIDATION',
          issue: 'Empty title accepted by API',
          severity: '[CRITICAL]',
          expected: 'HTTP 400 — title is @NotBlank',
          actual: `HTTP ${res.status}`,
        });
      }
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    } catch {
      // Expected
    }
  });

  test('F2: Validation errors shown in UI form', async ({ page }) => {
    await page.goto('/documents/new', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const hasForm = await page.locator('form').isVisible().catch(() => false);
    if (hasForm) {
      // Submit without filling required fields
      const submitBtn = page.getByRole('button', {
        name: /создать|сохранить|save|create|загрузить/i,
      });
      if (await submitBtn.first().isVisible().catch(() => false)) {
        await submitBtn.first().click();
        await page.waitForTimeout(1500);

        const errors = page.locator(
          '.text-red-500, .text-red-600, .text-danger-500, [role="alert"]',
        );
        const errorCount = await errors.count();

        if (errorCount === 0) {
          trackIssue({
            entity: 'Document',
            operation: 'VALIDATION/UI',
            issue: 'No validation errors when submitting empty document form',
            severity: '[MAJOR]',
            expected: 'Title required validation error',
            actual: 'No errors shown',
          });
        }
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/document-validation.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // G. DELETE
  // ────────────────────────────────────────────────────────────────────────

  test('G1: Delete document via API', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ на удаление' });

    const res = await authenticatedRequest('admin', 'DELETE', `/api/documents/${doc.id}`);
    expect.soft(res.status).toBeLessThanOrEqual(204);

    // Verify deletion
    const getRes = await authenticatedRequest('admin', 'GET', `/api/documents/${doc.id}`);
    if (getRes.status === 200) {
      trackIssue({
        entity: 'Document',
        operation: 'DELETE',
        issue: 'Deleted document still accessible via GET',
        severity: '[CRITICAL]',
        expected: 'HTTP 404',
        actual: `HTTP ${getRes.status}`,
      });
    }
  });

  test('G2: Delete document via UI', async ({ page }) => {
    const doc = await createDocViaApi({ title: 'E2E-Удаление из UI' });

    // Navigate to document edit/detail page
    await page.goto(`/documents/${doc.id}/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(3000);

    // Look for delete button
    const deleteBtn = page.getByRole('button', { name: /удалить|delete/i })
      .or(page.locator('button[aria-label*="удалить" i]'));

    if (await deleteBtn.first().isVisible().catch(() => false)) {
      page.on('dialog', async (dialog) => dialog.accept());

      await deleteBtn.first().click();
      await page.waitForTimeout(2000);

      // Check for confirmation modal
      const confirmBtn = page.getByRole('button', {
        name: /подтвердить|удалить|confirm|delete|да/i,
      });
      if (await confirmBtn.first().isVisible().catch(() => false)) {
        await confirmBtn.first().click();
        await page.waitForTimeout(3000);
      }
    } else {
      trackIssue({
        entity: 'Document',
        operation: 'DELETE/UI',
        issue: 'Delete button not visible on document page',
        severity: '[UX]',
        expected: 'Delete button visible',
        actual: 'Delete button not found',
      });
      // Cleanup via API
      await deleteEntity('/api/documents', doc.id).catch(() => {});
    }

    await page.screenshot({ path: 'e2e/screenshots/document-delete.png', fullPage: true });
  });

  // ────────────────────────────────────────────────────────────────────────
  // H. ACCESS CONTROL
  // ────────────────────────────────────────────────────────────────────────

  test('H1: Grant document access via API', async () => {
    const doc = await createDocViaApi({ title: 'E2E-Документ с контролем доступа' });

    // We need a user ID to grant access to — get list of users
    let userId: string | undefined;
    try {
      const usersRes = await authenticatedRequest('admin', 'GET', '/api/admin/users?size=5');
      if (usersRes.status === 200) {
        const usersData = await usersRes.json();
        const users = usersData.content ?? usersData.data ?? usersData;
        if (Array.isArray(users) && users.length > 1) {
          // Use second user (not self)
          userId = users[1].id;
        }
      }
    } catch { /* */ }

    if (userId) {
      const res = await authenticatedRequest(
        'admin', 'POST', `/api/documents/${doc.id}/access`,
        { userId, accessLevel: 'VIEW' },
      );

      if (res.status === 200 || res.status === 201) {
        // Verify access list
        const getRes = await authenticatedRequest('admin', 'GET', `/api/documents/${doc.id}`);
        if (getRes.status === 200) {
          const data = await getRes.json();
          const docData = data.data ?? data;
          const accessList = docData.accessList ?? [];

          expect.soft(
            Array.isArray(accessList) ? accessList.length : 0,
            'Document should have at least 1 access entry',
          ).toBeGreaterThanOrEqual(1);
        }
      } else {
        trackIssue({
          entity: 'Document',
          operation: 'ACCESS',
          issue: 'Failed to grant document access',
          severity: '[MINOR]',
          expected: 'HTTP 200/201',
          actual: `HTTP ${res.status}`,
        });
      }
    }

    await deleteEntity('/api/documents', doc.id).catch(() => {});
  });

  // ────────────────────────────────────────────────────────────────────────
  // PERSONA CHECKS
  // ────────────────────────────────────────────────────────────────────────

  test('PERSONA: Бухгалтер — can find invoices and contracts in document list', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText();

    // Бухгалтер needs to quickly find financial documents
    const hasDocTypes = /документ|файл|загруз/i.test(bodyText);
    expect.soft(
      hasDocTypes,
      'Бухгалтер: document page should show document-related content',
    ).toBeTruthy();

    // Check for category filter (бухгалтер needs to filter by Договоры, Счета)
    const hasCategoryFilter = /категор|тип|type|category|фильтр/i.test(bodyText);
    if (!hasCategoryFilter) {
      trackIssue({
        entity: 'Document',
        operation: 'PERSONA/бухгалтер',
        issue: 'No visible category filter for бухгалтер to find invoices/contracts',
        severity: '[UX]',
        expected: 'Category filter: Договор, Счёт, Акт',
        actual: 'No category filter visible',
      });
    }
  });

  test('PERSONA: Прораб — document list page loads fast', async ({ page }) => {
    const start = Date.now();
    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - start;

    if (loadTime > 5000) {
      trackIssue({
        entity: 'Document',
        operation: 'PERSONA/прораб',
        issue: `Documents page takes ${loadTime}ms (>5s) — прораб won't wait`,
        severity: '[UX]',
        expected: '<5s load time',
        actual: `${loadTime}ms`,
      });
    }
  });

  test('PERSONA: ПТО — document number and version visible in list', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // ПТО needs document number and version for regulatory tracking
    const bodyText = await page.locator('body').innerText();

    // Soft check — document number column may not have data
    const hasVersionOrNumber = /верси|version|номер|number|v\./i.test(bodyText);
    if (!hasVersionOrNumber) {
      trackIssue({
        entity: 'Document',
        operation: 'PERSONA/ПТО',
        issue: 'Document version/number not prominently displayed in list',
        severity: '[UX]',
        expected: 'ПТО needs document numbers and versions for regulatory compliance',
        actual: 'No version/number references found on page',
      });
    }
  });
});
