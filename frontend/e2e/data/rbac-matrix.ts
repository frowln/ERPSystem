/**
 * RBAC permission matrix for E2E testing.
 *
 * Maps 5 test roles to expected access across all major route groups.
 * Built from frontend/src/config/routePermissions.ts.
 *
 * Test roles → backend UserRole mapping:
 *   admin      → ADMIN
 *   manager    → MANAGER (also matches PROJECT_MANAGER)
 *   engineer   → ENGINEER
 *   accountant → ACCOUNTANT
 *   viewer     → VIEWER
 */

import type { Role } from '../fixtures/auth.fixture';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RoutePermission {
  /** Route path (without leading /) */
  route: string;
  /** Human-readable label for test output */
  label: string;
  /** Module group for reporting */
  group: string;
  /** Which roles can view this route (page loads without 403) */
  canView: Record<Role, boolean>;
  /** Which roles can create entities (POST) */
  canCreate: Record<Role, boolean>;
  /** Which roles can edit entities (PUT) */
  canEdit: Record<Role, boolean>;
  /** Which roles can delete entities (DELETE) */
  canDelete: Record<Role, boolean>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** All 5 roles can access */
const ALL_VIEW: Record<Role, boolean> = {
  admin: true,
  manager: true,
  engineer: true,
  accountant: true,
  viewer: true,
};

/** Nobody can — used as a starting point for canDelete on most modules */
const NONE: Record<Role, boolean> = {
  admin: false,
  manager: false,
  engineer: false,
  accountant: false,
  viewer: false,
};

function roles(...allowed: Role[]): Record<Role, boolean> {
  return {
    admin: allowed.includes('admin'),
    manager: allowed.includes('manager'),
    engineer: allowed.includes('engineer'),
    accountant: allowed.includes('accountant'),
    viewer: allowed.includes('viewer'),
  };
}

// ── Permission Matrix ──────────────────────────────────────────────────────

/**
 * Full RBAC matrix.
 *
 * Source: routePermissions.ts role groups:
 *   ADMIN_ONLY:       [ADMIN]
 *   MANAGER_PLUS:     [ADMIN, PROJECT_MANAGER, MANAGER]
 *   ENGINEER_PLUS:    [ADMIN, PROJECT_MANAGER, MANAGER, ENGINEER, FOREMAN]
 *   FINANCE_PLUS:     [ADMIN, PROJECT_MANAGER, MANAGER, ACCOUNTANT, ...]
 *   SAFETY_PLUS:      [ADMIN, PROJECT_MANAGER, MANAGER, ENGINEER, ...]
 *   HR_PLUS:          [ADMIN, PROJECT_MANAGER, MANAGER, HR_MANAGER]
 *   PROCUREMENT_PLUS: [ADMIN, PROJECT_MANAGER, MANAGER, ENGINEER, ...]
 *   QUALITY_PLUS:     [ADMIN, PROJECT_MANAGER, MANAGER, ENGINEER, ...]
 *
 * Routes not listed in routePermissions → accessible to all authenticated users.
 */
export const rbacMatrix: RoutePermission[] = [
  // ── Projects (accessible to all authenticated) ─────────────────────────
  {
    route: 'projects',
    label: 'Проекты',
    group: 'projects',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'projects/new',
    label: 'Создание проекта',
    group: 'projects',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager'),
    canEdit: NONE,
    canDelete: NONE,
  },
  {
    route: 'dashboard',
    label: 'Дашборд',
    group: 'projects',
    canView: ALL_VIEW,
    canCreate: NONE,
    canEdit: NONE,
    canDelete: NONE,
  },

  // ── Settings (ADMIN_ONLY) ──────────────────────────────────────────────
  {
    route: 'settings',
    label: 'Настройки системы',
    group: 'settings',
    canView: roles('admin'),
    canCreate: roles('admin'),
    canEdit: roles('admin'),
    canDelete: roles('admin'),
  },
  {
    route: 'admin',
    label: 'Администрирование',
    group: 'settings',
    canView: roles('admin'),
    canCreate: roles('admin'),
    canEdit: roles('admin'),
    canDelete: roles('admin'),
  },

  // ── Finance (FINANCE_PLUS: admin, manager, accountant) ─────────────────
  {
    route: 'budgets',
    label: 'Бюджеты',
    group: 'finance',
    canView: roles('admin', 'manager', 'accountant'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager', 'accountant'),
    canDelete: roles('admin'),
  },
  {
    route: 'invoices',
    label: 'Счета',
    group: 'finance',
    canView: roles('admin', 'manager', 'accountant'),
    canCreate: roles('admin', 'manager', 'accountant'),
    canEdit: roles('admin', 'manager', 'accountant'),
    canDelete: roles('admin'),
  },
  {
    route: 'payments',
    label: 'Платежи',
    group: 'finance',
    canView: roles('admin', 'manager', 'accountant'),
    canCreate: roles('admin', 'manager', 'accountant'),
    canEdit: roles('admin', 'manager', 'accountant'),
    canDelete: roles('admin'),
  },
  {
    route: 'cash-flow',
    label: 'Движение денег (БДДС)',
    group: 'finance',
    canView: roles('admin', 'manager', 'accountant'),
    canCreate: NONE,
    canEdit: NONE,
    canDelete: NONE,
  },
  {
    route: 'cost-management',
    label: 'Управление затратами',
    group: 'finance',
    canView: roles('admin', 'manager', 'accountant'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager', 'accountant'),
    canDelete: roles('admin'),
  },
  {
    route: 'revenue',
    label: 'Выручка',
    group: 'finance',
    canView: roles('admin', 'manager'),
    canCreate: NONE,
    canEdit: NONE,
    canDelete: NONE,
  },
  {
    route: 'financial-models',
    label: 'Финансовые модели',
    group: 'finance',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },

  // ── HR (HR_PLUS: admin, manager) ──────────────────────────────────────
  {
    route: 'employees',
    label: 'Сотрудники',
    group: 'hr',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'timesheets',
    label: 'Табели',
    group: 'hr',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'crew',
    label: 'Бригады',
    group: 'hr',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'leave',
    label: 'Отпуска',
    group: 'hr',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },

  // ── Safety (SAFETY_PLUS: admin, manager, engineer) ────────────────────
  {
    route: 'safety',
    label: 'Охрана труда',
    group: 'safety',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Warehouse & Procurement (PROCUREMENT_PLUS: admin, manager, engineer) ─
  {
    route: 'warehouse',
    label: 'Склад',
    group: 'warehouse',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'procurement',
    label: 'Снабжение',
    group: 'warehouse',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'dispatch',
    label: 'Диспетчеризация',
    group: 'warehouse',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Specifications (ENGINEER_PLUS: admin, manager, engineer) ──────────
  {
    route: 'specifications',
    label: 'Спецификации',
    group: 'specifications',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Estimates (ENGINEER_PLUS: admin, manager, engineer) ───────────────
  {
    route: 'estimates',
    label: 'Сметы (ЛСР)',
    group: 'estimates',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Planning (ENGINEER_PLUS) ──────────────────────────────────────────
  {
    route: 'planning',
    label: 'Планирование',
    group: 'planning',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Operations (ENGINEER_PLUS) ────────────────────────────────────────
  {
    route: 'operations',
    label: 'Производство работ',
    group: 'operations',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Quality (QUALITY_PLUS: admin, manager, engineer) ──────────────────
  {
    route: 'quality',
    label: 'Контроль качества',
    group: 'quality',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'defects',
    label: 'Дефекты',
    group: 'quality',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'punchlist',
    label: 'Замечания',
    group: 'quality',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Regulatory (QUALITY_PLUS) ─────────────────────────────────────────
  {
    route: 'regulatory',
    label: 'Нормативные документы',
    group: 'regulatory',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── BIM (ENGINEER_PLUS) ───────────────────────────────────────────────
  {
    route: 'bim',
    label: 'BIM-модели',
    group: 'bim',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Fleet (ENGINEER_PLUS + fleet roles) ───────────────────────────────
  {
    route: 'fleet',
    label: 'Автопарк',
    group: 'fleet',
    canView: roles('admin', 'manager', 'engineer'),
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },

  // ── Portfolio (MANAGER_PLUS) ──────────────────────────────────────────
  {
    route: 'portfolio',
    label: 'Портфель проектов',
    group: 'portfolio',
    canView: roles('admin', 'manager'),
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },

  // ── Accessible to all authenticated users ─────────────────────────────
  {
    route: 'tasks',
    label: 'Задачи',
    group: 'tasks',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'documents',
    label: 'Документы',
    group: 'documents',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager', 'engineer'),
    canEdit: roles('admin', 'manager', 'engineer'),
    canDelete: roles('admin'),
  },
  {
    route: 'contracts',
    label: 'Договоры',
    group: 'contracts',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'closing',
    label: 'КС-2 / КС-3',
    group: 'closing',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager', 'engineer', 'accountant'),
    canEdit: roles('admin', 'manager', 'engineer', 'accountant'),
    canDelete: roles('admin'),
  },
  {
    route: 'crm',
    label: 'CRM',
    group: 'crm',
    canView: ALL_VIEW,
    canCreate: roles('admin', 'manager'),
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'support',
    label: 'Поддержка',
    group: 'support',
    canView: ALL_VIEW,
    canCreate: ALL_VIEW,
    canEdit: roles('admin', 'manager'),
    canDelete: roles('admin'),
  },
  {
    route: 'notifications',
    label: 'Уведомления',
    group: 'notifications',
    canView: ALL_VIEW,
    canCreate: NONE,
    canEdit: NONE,
    canDelete: NONE,
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────

/** Get permission entry for a specific route */
export function getRoutePermission(route: string): RoutePermission | undefined {
  return rbacMatrix.find((p) => p.route === route);
}

/** Get all routes in a group */
export function getRoutesByGroup(group: string): RoutePermission[] {
  return rbacMatrix.filter((p) => p.group === group);
}

/** Get all routes a specific role can view */
export function getViewableRoutes(role: Role): RoutePermission[] {
  return rbacMatrix.filter((p) => p.canView[role]);
}

/** Get all routes a specific role CANNOT view (for negative testing) */
export function getForbiddenRoutes(role: Role): RoutePermission[] {
  return rbacMatrix.filter((p) => !p.canView[role]);
}

/** All unique groups */
export function getAllGroups(): string[] {
  return [...new Set(rbacMatrix.map((p) => p.group))];
}
