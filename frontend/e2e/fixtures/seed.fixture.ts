/**
 * Seed fixture — creates and cleans up realistic E2E test data via API.
 *
 * ALL entities use "E2E-" prefix for identification and cleanup.
 * Uses the API fixture (api.fixture.ts) for direct REST calls.
 *
 * Usage in tests:
 *   import { seedProject, seedFinanceData, cleanupAllE2E } from '../fixtures/seed.fixture';
 *
 *   test.beforeAll(async () => { project = await seedProject(); });
 *   test.afterAll(async () => { await cleanupAllE2E(); });
 */

import {
  authenticatedRequest,
  createEntity,
  deleteEntity,
  listEntities,
} from './api.fixture';
import {
  createTestProject,
  createTestBudgetItem,
  createTestInvoice,
  createTestPayment,
  createTestEmployee,
  createTestTimesheet,
  createTestMaterial,
  createTestSafetyIncident,
  createTestSafetyTraining,
  createTestSafetyInspection,
  createTestSpecItem,
  createTestCompetitiveListEntry,
  resetCounters,
} from '../data/test-entities';

// ── Types for API responses ────────────────────────────────────────────────

interface IdEntity {
  id: string;
  [key: string]: unknown;
}

// ── Registry of created entities (for cleanup) ─────────────────────────────

interface CreatedEntity {
  endpoint: string;
  id: string;
}

const createdEntities: CreatedEntity[] = [];

function track(endpoint: string, id: string): void {
  createdEntities.push({ endpoint, id });
}

/** Safe create — tracks entity for cleanup */
async function safeCreate<T extends IdEntity>(
  endpoint: string,
  data: Record<string, unknown>,
): Promise<T> {
  const entity = await createEntity<T>(endpoint, data);
  track(endpoint, entity.id);
  return entity;
}

// ── Seed: Project ──────────────────────────────────────────────────────────

export interface SeededProject {
  id: string;
  name: string;
  code: string;
  budgetId?: string;
}

/**
 * Create "E2E-ЖК Солнечный квартал" with budget.
 * Manager: Иванов А.С. (uses current admin user as managerId).
 */
export async function seedProject(): Promise<SeededProject> {
  resetCounters();

  // Get current user for managerId
  const meRes = await authenticatedRequest('admin', 'GET', '/api/auth/me');
  const me = meRes.ok ? await meRes.json().then((j: Record<string, unknown>) => j.data ?? j) : null;
  const managerId = (me as IdEntity)?.id ?? undefined;

  const projectData = createTestProject({
    name: 'E2E-ЖК Солнечный квартал',
    code: 'E2E-SK-001',
    type: 'RESIDENTIAL',
    budget: 450_000_000,
    customerName: 'E2E-ООО СтройИнвест',
  });

  const project = await safeCreate<IdEntity>('/api/projects', {
    ...projectData,
    ...(managerId ? { managerId } : {}),
  });

  // Try to create budget for the project
  let budgetId: string | undefined;
  try {
    const budget = await safeCreate<IdEntity>('/api/budgets', {
      name: `E2E-Бюджет ${projectData.name}`,
      projectId: project.id,
      totalAmount: projectData.budget,
    });
    budgetId = budget.id;
  } catch {
    // Budget may be auto-created with project — try to find it
    try {
      const budgets = await listEntities<IdEntity>('/api/budgets', {
        projectId: project.id,
      });
      if (budgets.length > 0) {
        budgetId = budgets[0].id;
      }
    } catch {
      // Budget creation optional — continue
    }
  }

  return {
    id: project.id,
    name: projectData.name,
    code: projectData.code,
    budgetId,
  };
}

// ── Seed: Finance Data ─────────────────────────────────────────────────────

export interface SeededFinanceData {
  budgetItemIds: string[];
  invoiceIds: string[];
  paymentIds: string[];
}

/**
 * Create budget items, invoices, and payments for a project.
 */
export async function seedFinanceData(projectId: string): Promise<SeededFinanceData> {
  const budgetItemIds: string[] = [];
  const invoiceIds: string[] = [];
  const paymentIds: string[] = [];

  // Budget items (6 items covering works, materials, equipment)
  for (let i = 0; i < 6; i++) {
    const item = createTestBudgetItem();
    try {
      const created = await safeCreate<IdEntity>('/api/budgets/items', {
        ...item,
        projectId,
      });
      budgetItemIds.push(created.id);
    } catch {
      // Continue if budget item creation fails
    }
  }

  // Invoices (3 from different vendors)
  for (let i = 0; i < 3; i++) {
    const invoice = createTestInvoice();
    try {
      const created = await safeCreate<IdEntity>('/api/invoices', {
        ...invoice,
        projectId,
      });
      invoiceIds.push(created.id);

      // Create payment for first invoice
      if (i === 0) {
        const payment = createTestPayment(invoice.totalWithVat, 0);
        try {
          const createdPayment = await safeCreate<IdEntity>('/api/payments', {
            ...payment,
            invoiceId: created.id,
            projectId,
          });
          paymentIds.push(createdPayment.id);
        } catch {
          // Continue
        }
      }
    } catch {
      // Continue if invoice creation fails
    }
  }

  return { budgetItemIds, invoiceIds, paymentIds };
}

// ── Seed: HR Data ──────────────────────────────────────────────────────────

export interface SeededHRData {
  employeeIds: string[];
  timesheetIds: string[];
}

/**
 * Create employees (Иванов, Петрова, Сидоров, Козлов, Морозова) and timesheets.
 */
export async function seedHRData(): Promise<SeededHRData> {
  const employeeIds: string[] = [];
  const timesheetIds: string[] = [];

  // 5 core employees from business rules
  for (let i = 0; i < 5; i++) {
    const emp = createTestEmployee();
    try {
      const created = await safeCreate<IdEntity>('/api/employees', { ...emp });
      employeeIds.push(created.id);

      // Create 5 timesheets per employee
      for (let t = 0; t < 5; t++) {
        const ts = createTestTimesheet();
        try {
          const createdTs = await safeCreate<IdEntity>('/api/timesheets', {
            ...ts,
            employeeId: created.id,
          });
          timesheetIds.push(createdTs.id);
        } catch {
          // Continue
        }
      }
    } catch {
      // Continue if employee creation fails
    }
  }

  return { employeeIds, timesheetIds };
}

// ── Seed: Warehouse Data ───────────────────────────────────────────────────

export interface SeededWarehouseData {
  materialIds: string[];
}

/**
 * Create materials: Кирпич М150, Арматура А500С, Кабель ВВГнг, Бетон В25.
 */
export async function seedWarehouseData(): Promise<SeededWarehouseData> {
  const materialIds: string[] = [];

  for (let i = 0; i < 4; i++) {
    const mat = createTestMaterial();
    try {
      const created = await safeCreate<IdEntity>('/api/materials', { ...mat });
      materialIds.push(created.id);
    } catch {
      // Continue
    }
  }

  return { materialIds };
}

// ── Seed: Safety Data ──────────────────────────────────────────────────────

export interface SeededSafetyData {
  incidentIds: string[];
  trainingIds: string[];
  inspectionIds: string[];
}

/**
 * Create safety incidents, trainings, and inspections.
 */
export async function seedSafetyData(): Promise<SeededSafetyData> {
  const incidentIds: string[] = [];
  const trainingIds: string[] = [];
  const inspectionIds: string[] = [];

  // 3 incidents
  for (let i = 0; i < 3; i++) {
    const incident = createTestSafetyIncident();
    try {
      const created = await safeCreate<IdEntity>('/api/safety/incidents', { ...incident });
      incidentIds.push(created.id);
    } catch {
      // Continue
    }
  }

  // 3 trainings
  for (let i = 0; i < 3; i++) {
    const training = createTestSafetyTraining();
    try {
      const created = await safeCreate<IdEntity>('/api/safety/trainings', { ...training });
      trainingIds.push(created.id);
    } catch {
      // Continue
    }
  }

  // 2 inspections
  for (let i = 0; i < 2; i++) {
    const inspection = createTestSafetyInspection();
    try {
      const created = await safeCreate<IdEntity>('/api/safety/inspections', { ...inspection });
      inspectionIds.push(created.id);
    } catch {
      // Continue
    }
  }

  return { incidentIds, trainingIds, inspectionIds };
}

// ── Seed: Specification Data ───────────────────────────────────────────────

export interface SeededSpecificationData {
  specificationId: string;
  specItemIds: string[];
  competitiveListId?: string;
}

/**
 * Create specification with 5 items (электро + вент) and a competitive list.
 */
export async function seedSpecificationData(
  projectId: string,
): Promise<SeededSpecificationData> {
  const specItemIds: string[] = [];

  // Create specification
  const spec = await safeCreate<IdEntity>('/api/specifications', {
    name: 'E2E-Спецификация ЭОМ+ОВ',
    projectId,
    description: 'Электроснабжение и вентиляция — тестовая спецификация',
    status: 'DRAFT',
  });

  // 5 spec items
  for (let i = 0; i < 5; i++) {
    const item = createTestSpecItem();
    try {
      const created = await safeCreate<IdEntity>(
        `/api/specifications/${spec.id}/items`,
        { ...item },
      );
      specItemIds.push(created.id);
    } catch {
      // Continue
    }
  }

  // Create competitive list for this spec
  let competitiveListId: string | undefined;
  try {
    const cl = await safeCreate<IdEntity>('/api/competitive-lists', {
      name: 'E2E-КЛ Электрооборудование',
      projectId,
      specificationId: spec.id,
      status: 'COLLECTING',
    });
    competitiveListId = cl.id;

    // Add 3 vendor entries per competitive list (minimum for procurement rules)
    for (let v = 0; v < 3; v++) {
      const entry = createTestCompetitiveListEntry(150_000, v);
      try {
        await safeCreate<IdEntity>(`/api/competitive-lists/${cl.id}/entries`, {
          ...entry,
        });
      } catch {
        // Continue
      }
    }
  } catch {
    // Competitive list creation optional
  }

  return {
    specificationId: spec.id,
    specItemIds,
    competitiveListId,
  };
}

// ── Seed All ───────────────────────────────────────────────────────────────

export interface SeededAllData {
  project: SeededProject;
  finance: SeededFinanceData;
  hr: SeededHRData;
  warehouse: SeededWarehouseData;
  safety: SeededSafetyData;
  specification: SeededSpecificationData;
}

/**
 * Seed everything: project + finance + hr + warehouse + safety + specs.
 * Convenience for tests that need a fully populated environment.
 */
export async function seedAll(): Promise<SeededAllData> {
  const project = await seedProject();
  const [finance, hr, warehouse, safety, specification] = await Promise.all([
    seedFinanceData(project.id),
    seedHRData(),
    seedWarehouseData(),
    seedSafetyData(),
    seedSpecificationData(project.id),
  ]);
  return { project, finance, hr, warehouse, safety, specification };
}

// ── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Delete ALL entities matching "E2E-" prefix, in reverse dependency order.
 * First deletes tracked entities (reverse order), then scans for any remaining.
 */
export async function cleanupAllE2E(): Promise<void> {
  // 1. Delete tracked entities in reverse order (child → parent)
  const reversed = [...createdEntities].reverse();
  for (const { endpoint, id } of reversed) {
    try {
      await deleteEntity(endpoint, id);
    } catch {
      // Entity may already be deleted — ignore
    }
  }
  createdEntities.length = 0;

  // 2. Scan for any remaining E2E entities by listing and filtering
  const scanEndpoints = [
    // Delete in dependency order: children first, parents last
    '/api/payments',
    '/api/invoices',
    '/api/timesheets',
    '/api/safety/inspections',
    '/api/safety/trainings',
    '/api/safety/incidents',
    '/api/competitive-lists',
    '/api/specifications',
    '/api/materials',
    '/api/employees',
    '/api/budgets/items',
    '/api/budgets',
    '/api/projects',
  ];

  for (const endpoint of scanEndpoints) {
    try {
      const entities = await listEntities<IdEntity>(endpoint);
      const e2eEntities = entities.filter((e) => {
        const name = (e.name ?? e.title ?? e.number ?? '') as string;
        return name.startsWith('E2E-');
      });

      for (const entity of e2eEntities) {
        try {
          await deleteEntity(endpoint, entity.id);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      // Endpoint may not support listing — skip
    }
  }
}

/**
 * Quick cleanup — only deletes tracked entities (faster than full scan).
 * Use this in afterEach for speed; use cleanupAllE2E in afterAll for thoroughness.
 */
export async function cleanupTracked(): Promise<void> {
  const reversed = [...createdEntities].reverse();
  for (const { endpoint, id } of reversed) {
    try {
      await deleteEntity(endpoint, id);
    } catch {
      // Ignore
    }
  }
  createdEntities.length = 0;
}
