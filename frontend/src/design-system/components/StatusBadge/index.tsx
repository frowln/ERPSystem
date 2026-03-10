import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export type BadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, BadgeColor | string>;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const colorStyles: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  gray: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-300', dot: 'bg-neutral-400' },
  blue: { bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300', dot: 'bg-primary-500' },
  green: { bg: 'bg-success-50 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300', dot: 'bg-success-500' },
  yellow: { bg: 'bg-warning-50 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', dot: 'bg-warning-500' },
  red: { bg: 'bg-danger-50 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-300', dot: 'bg-danger-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
};

/**
 * Creates a Record<string, string> where each value is lazily resolved
 * via the i18n t() function at access time. This ensures translations
 * update correctly when the user switches locale.
 */
function i18nLabels(prefix: string, keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    Object.defineProperty(result, key, {
      get: () => t(`${prefix}.${key}`),
      enumerable: true,
      configurable: true,
    });
  }
  return result;
}

// =============================================================================
// PROJECT
// =============================================================================

export const projectStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PLANNING: 'blue',
  IN_PROGRESS: 'green',
  ON_HOLD: 'yellow',
  COMPLETED: 'purple',
  CANCELLED: 'red',
};

export const projectStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.projectStatus',
  ['DRAFT', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
);

export const documentStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  ARCHIVED: 'purple',
};

export const paymentStatusColorMap: Record<string, BadgeColor> = {
  PENDING: 'yellow',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
  PARTIAL: 'orange',
};

export const priorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  NORMAL: 'blue',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const priorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.priority',
  ['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

export const projectTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.projectType',
  ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION'],
);

// =============================================================================
// CONTRACT
// =============================================================================

export const contractStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  ON_APPROVAL: 'yellow',
  LAWYER_APPROVED: 'cyan',
  MANAGEMENT_APPROVED: 'cyan',
  FINANCE_APPROVED: 'cyan',
  APPROVED: 'blue',
  SIGNED: 'purple',
  ACTIVE: 'green',
  CLOSED: 'gray',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

export const contractStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.contractStatus',
  ['DRAFT', 'ON_APPROVAL', 'LAWYER_APPROVED', 'MANAGEMENT_APPROVED', 'FINANCE_APPROVED', 'APPROVED', 'SIGNED', 'ACTIVE', 'CLOSED', 'REJECTED', 'CANCELLED'],
);

// =============================================================================
// SPECIFICATION
// =============================================================================

export const specificationStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  IN_REVIEW: 'yellow',
  APPROVED: 'blue',
  ACTIVE: 'green',
};

export const specificationStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.specificationStatus',
  ['DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE'],
);

// =============================================================================
// ESTIMATE
// =============================================================================

export const estimateStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  IN_WORK: 'yellow',
  APPROVED: 'blue',
  ACTIVE: 'green',
};

export const estimateStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.estimateStatus',
  ['DRAFT', 'IN_WORK', 'APPROVED', 'ACTIVE'],
);

// =============================================================================
// CLOSING DOCUMENT
// =============================================================================

export const closingDocStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  SIGNED: 'blue',
  CLOSED: 'green',
};

export const closingDocStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.closingDocStatus',
  ['DRAFT', 'SUBMITTED', 'SIGNED', 'CLOSED'],
);

// =============================================================================
// PURCHASE REQUEST
// =============================================================================

export const purchaseRequestStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  IN_APPROVAL: 'orange',
  APPROVED: 'blue',
  REJECTED: 'red',
  ASSIGNED: 'cyan',
  ORDERED: 'purple',
  DELIVERED: 'green',
  CLOSED: 'gray',
  CANCELLED: 'gray',
};

export const purchaseRequestStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.purchaseRequestStatus',
  ['DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED', 'CANCELLED'],
);

export const purchaseRequestPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const purchaseRequestPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.purchaseRequestPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

// =============================================================================
// SPEC ITEM TYPE
// =============================================================================

export const specItemTypeColorMap: Record<string, BadgeColor> = {
  MATERIAL: 'blue',
  EQUIPMENT: 'orange',
  WORK: 'green',
};

export const specItemTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.specItemType',
  ['MATERIAL', 'EQUIPMENT', 'WORK'],
);

// =============================================================================
// BUDGET
// =============================================================================

export const budgetStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  APPROVED: 'blue',
  ACTIVE: 'green',
  FROZEN: 'orange',
  CLOSED: 'gray',
};

export const budgetStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.budgetStatus',
  ['DRAFT', 'APPROVED', 'ACTIVE', 'FROZEN', 'CLOSED'],
);

// =============================================================================
// PAYMENT
// =============================================================================

export const paymentStatusLowerColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'blue',
  PAID: 'green',
  CANCELLED: 'gray',
};

export const paymentStatusLowerLabels: Record<string, string> = i18nLabels(
  'statusLabels.paymentStatusLower',
  ['DRAFT', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'],
);

export const paymentTypeColorMap: Record<string, BadgeColor> = {
  INCOMING: 'green',
  OUTGOING: 'red',
};

export const paymentTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.paymentType',
  ['INCOMING', 'OUTGOING'],
);

// =============================================================================
// INVOICE
// =============================================================================

export const invoiceStatusColorMap: Record<string, BadgeColor> = {
  NEW: 'gray',
  UNDER_REVIEW: 'blue',
  LINKED_TO_POSITION: 'purple',
  ON_APPROVAL: 'yellow',
  APPROVED: 'cyan',
  CLOSED: 'green',
  REJECTED: 'red',
  DRAFT: 'gray',
  SENT: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

export const invoiceStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.invoiceStatus',
  [
    'NEW',
    'UNDER_REVIEW',
    'LINKED_TO_POSITION',
    'ON_APPROVAL',
    'APPROVED',
    'PAID',
    'CLOSED',
    'REJECTED',
    'DRAFT',
    'SENT',
    'PARTIALLY_PAID',
    'OVERDUE',
    'CANCELLED',
  ],
);

export const invoiceTypeColorMap: Record<string, BadgeColor> = {
  ISSUED: 'blue',
  RECEIVED: 'purple',
};

export const invoiceTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.invoiceType',
  ['ISSUED', 'RECEIVED'],
);

// =============================================================================
// STOCK MOVEMENT
// =============================================================================

export const stockMovementStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  CONFIRMED: 'blue',
  DONE: 'green',
  CANCELLED: 'gray',
};

export const stockMovementStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.stockMovementStatus',
  ['DRAFT', 'CONFIRMED', 'DONE', 'CANCELLED'],
);

export const stockMovementTypeColorMap: Record<string, BadgeColor> = {
  RECEIPT: 'green',
  ISSUE: 'red',
  TRANSFER: 'blue',
  ADJUSTMENT: 'orange',
  RETURN: 'purple',
  WRITE_OFF: 'gray',
};

export const stockMovementTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.stockMovementType',
  ['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF'],
);

// =============================================================================
// WAREHOUSE ORDER
// =============================================================================

export const warehouseOrderStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  CONFIRMED: 'green',
  CANCELLED: 'red',
};

export const warehouseOrderStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.warehouseOrderStatus',
  ['DRAFT', 'CONFIRMED', 'CANCELLED'],
);

export const warehouseOrderTypeColorMap: Record<string, BadgeColor> = {
  RECEIPT: 'green',
  ISSUE: 'red',
  INTERNAL_TRANSFER: 'blue',
  RETURN: 'purple',
};

export const warehouseOrderTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.warehouseOrderType',
  ['RECEIPT', 'ISSUE', 'INTERNAL_TRANSFER', 'RETURN'],
);

// =============================================================================
// LIMIT FENCE SHEET
// =============================================================================

export const limitFenceSheetStatusColorMap: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  EXHAUSTED: 'red',
  CLOSED: 'gray',
  CANCELLED: 'gray',
};

export const limitFenceSheetStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.limitFenceSheetStatus',
  ['ACTIVE', 'EXHAUSTED', 'CLOSED', 'CANCELLED'],
);

// =============================================================================
// MATERIAL CATEGORY
// =============================================================================

export const materialCategoryColorMap: Record<string, BadgeColor> = {
  CONCRETE: 'gray',
  METAL: 'blue',
  WOOD: 'orange',
  INSULATION: 'yellow',
  PIPES: 'cyan',
  ELECTRICAL: 'red',
  FINISHING: 'purple',
  FASTENERS: 'gray',
  TOOLS: 'green',
  OTHER: 'gray',
};

export const materialCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.materialCategory',
  ['CONCRETE', 'METAL', 'WOOD', 'INSULATION', 'PIPES', 'ELECTRICAL', 'FINISHING', 'FASTENERS', 'TOOLS', 'OTHER'],
);

// =============================================================================
// EMPLOYEE
// =============================================================================

export const employeeStatusColorMap: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  ON_LEAVE: 'yellow',
  TERMINATED: 'gray',
  SUSPENDED: 'red',
};

export const employeeStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.employeeStatus',
  ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED'],
);

// =============================================================================
// TIMESHEET
// =============================================================================

export const timesheetStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

export const timesheetStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.timesheetStatus',
  ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
);

// =============================================================================
// INCIDENT
// =============================================================================

export const incidentSeverityColorMap: Record<string, BadgeColor> = {
  MINOR: 'green',
  MODERATE: 'yellow',
  SERIOUS: 'orange',
  CRITICAL: 'red',
  FATAL: 'gray',
};

export const incidentSeverityLabels: Record<string, string> = i18nLabels(
  'statusLabels.incidentSeverity',
  ['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL', 'FATAL'],
);

export const incidentStatusColorMap: Record<string, BadgeColor> = {
  REPORTED: 'yellow',
  UNDER_INVESTIGATION: 'orange',
  CORRECTIVE_ACTION: 'blue',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

export const incidentStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.incidentStatus',
  ['REPORTED', 'UNDER_INVESTIGATION', 'CORRECTIVE_ACTION', 'RESOLVED', 'CLOSED'],
);

// =============================================================================
// TASK
// =============================================================================

export const taskStatusColorMap: Record<string, BadgeColor> = {
  BACKLOG: 'gray',
  TODO: 'blue',
  IN_PROGRESS: 'yellow',
  IN_REVIEW: 'purple',
  DONE: 'green',
  CANCELLED: 'gray',
};

export const taskStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.taskStatus',
  ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'],
);

export const taskPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
  CRITICAL: 'red',
};

export const taskPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.taskPriority',
  ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'],
);

// =============================================================================
// DOCUMENT
// =============================================================================

export const documentStatusLowerColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  UNDER_REVIEW: 'yellow',
  APPROVED: 'blue',
  ACTIVE: 'green',
  ARCHIVED: 'purple',
  CANCELLED: 'gray',
};

export const documentStatusLowerLabels: Record<string, string> = i18nLabels(
  'statusLabels.documentStatusLower',
  ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'ARCHIVED', 'CANCELLED'],
);

export const documentCategoryColorMap: Record<string, BadgeColor> = {
  CONTRACT: 'blue',
  ESTIMATE: 'green',
  SPECIFICATION: 'cyan',
  DRAWING: 'purple',
  PERMIT: 'orange',
  ACT: 'yellow',
  INVOICE: 'red',
  PROTOCOL: 'gray',
  CORRESPONDENCE: 'gray',
  PHOTO: 'cyan',
  REPORT: 'blue',
  OTHER: 'gray',
};

export const documentCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.documentCategory',
  ['CONTRACT', 'ESTIMATE', 'SPECIFICATION', 'DRAWING', 'PERMIT', 'ACT', 'INVOICE', 'PROTOCOL', 'CORRESPONDENCE', 'PHOTO', 'REPORT', 'OTHER'],
);

// =============================================================================
// BUDGET CATEGORY
// =============================================================================

export const budgetCategoryColorMap: Record<string, BadgeColor> = {
  MATERIALS: 'blue',
  LABOR: 'green',
  EQUIPMENT: 'orange',
  SUBCONTRACT: 'purple',
  OVERHEAD: 'yellow',
  OTHER: 'gray',
};

export const budgetCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.budgetCategory',
  ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER'],
);

// =============================================================================
// RFI
// =============================================================================

export const rfiStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  OPEN: 'blue',
  ASSIGNED: 'yellow',
  ANSWERED: 'green',
  CLOSED: 'purple',
  OVERDUE: 'red',
  VOID: 'gray',
};

export const rfiStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.rfiStatus',
  ['DRAFT', 'OPEN', 'ASSIGNED', 'ANSWERED', 'CLOSED', 'OVERDUE', 'VOID'],
);

export const rfiPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const rfiPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.rfiPriority',
  ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
);

// =============================================================================
// SUBMITTAL
// =============================================================================

export const submittalStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  REVISED: 'orange',
};

export const submittalStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.submittalStatus',
  ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISED'],
);

export const submittalTypeColorMap: Record<string, BadgeColor> = {
  SHOP_DRAWING: 'blue',
  PRODUCT_DATA: 'green',
  SAMPLE: 'orange',
  MOCK_UP: 'purple',
  TEST_REPORT: 'cyan',
  CERTIFICATE: 'yellow',
  CALCULATION: 'purple',
  DESIGN_MIX: 'cyan',
  OTHER: 'gray',
};

export const submittalTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.submittalType',
  ['SHOP_DRAWING', 'PRODUCT_DATA', 'SAMPLE', 'MOCK_UP', 'TEST_REPORT', 'CERTIFICATE', 'CALCULATION', 'DESIGN_MIX', 'OTHER'],
);

// =============================================================================
// ISSUE
// =============================================================================

export const issueStatusColorMap: Record<string, BadgeColor> = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  ON_HOLD: 'orange',
  RESOLVED: 'green',
  CLOSED: 'purple',
};

export const issueStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.issueStatus',
  ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'],
);

export const issueTypeColorMap: Record<string, BadgeColor> = {
  DEFECT: 'red',
  SAFETY: 'orange',
  DESIGN: 'blue',
  COORDINATION: 'purple',
  SCHEDULE: 'yellow',
  OTHER: 'gray',
};

export const issueTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.issueType',
  ['DEFECT', 'SAFETY', 'DESIGN', 'COORDINATION', 'SCHEDULE', 'OTHER'],
);

export const issuePriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const issuePriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.issuePriority',
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

// =============================================================================
// CHANGE EVENT
// =============================================================================

export const changeEventStatusColorMap: Record<string, BadgeColor> = {
  IDENTIFIED: 'gray',
  EVALUATING: 'blue',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  VOID: 'gray',
};

export const changeEventStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.changeEventStatus',
  ['IDENTIFIED', 'EVALUATING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'VOID'],
);

export const changeEventSourceColorMap: Record<string, BadgeColor> = {
  RFI: 'blue',
  ISSUE: 'orange',
  DESIGN_CHANGE: 'purple',
  OWNER_REQUEST: 'cyan',
  FIELD_CONDITION: 'yellow',
  REGULATORY: 'red',
  OTHER: 'gray',
};

export const changeEventSourceLabels: Record<string, string> = i18nLabels(
  'statusLabels.changeEventSource',
  ['RFI', 'ISSUE', 'DESIGN_CHANGE', 'OWNER_REQUEST', 'FIELD_CONDITION', 'REGULATORY', 'OTHER'],
);

// =============================================================================
// CHANGE ORDER
// =============================================================================

export const changeOrderStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  APPROVED: 'green',
  EXECUTED: 'purple',
  REJECTED: 'red',
  VOID: 'gray',
};

export const changeOrderStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.changeOrderStatus',
  ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'EXECUTED', 'REJECTED', 'VOID'],
);

export const changeOrderTypeColorMap: Record<string, BadgeColor> = {
  ADDITION: 'green',
  DEDUCTION: 'red',
  NO_COST: 'gray',
  TIME_EXTENSION: 'blue',
};

export const changeOrderTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.changeOrderType',
  ['ADDITION', 'DEDUCTION', 'NO_COST', 'TIME_EXTENSION'],
);

// =============================================================================
// COMMITMENT
// =============================================================================

export const commitmentStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  APPROVED: 'blue',
  COMMITTED: 'green',
  CLOSED: 'purple',
  VOID: 'gray',
};

export const commitmentStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.commitmentStatus',
  ['DRAFT', 'PENDING', 'APPROVED', 'COMMITTED', 'CLOSED', 'VOID'],
);

export const commitmentTypeColorMap: Record<string, BadgeColor> = {
  SUBCONTRACT: 'purple',
  PURCHASE_ORDER: 'blue',
  SERVICE_AGREEMENT: 'green',
  RENTAL: 'orange',
};

export const commitmentTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.commitmentType',
  ['SUBCONTRACT', 'PURCHASE_ORDER', 'SERVICE_AGREEMENT', 'RENTAL'],
);

// =============================================================================
// RUSSIAN DOCUMENTS
// =============================================================================

export const russianDocTypeColorMap: Record<string, BadgeColor> = {
  KS2: 'blue',
  KS3: 'purple',
  M29: 'orange',
  EXECUTIVE_SCHEME: 'cyan',
  HIDDEN_WORKS_ACT: 'green',
  GENERAL_JOURNAL: 'gray',
  COMMISSIONING_ACT: 'yellow',
  PASSPORT: 'blue',
  PROTOCOL: 'gray',
};

export const russianDocTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.russianDocType',
  ['KS2', 'KS3', 'M29', 'EXECUTIVE_SCHEME', 'HIDDEN_WORKS_ACT', 'GENERAL_JOURNAL', 'COMMISSIONING_ACT', 'PASSPORT', 'PROTOCOL'],
);

export const russianDocStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  IN_REVIEW: 'yellow',
  ON_SIGNING: 'orange',
  SIGNED: 'green',
  REJECTED: 'red',
  ARCHIVED: 'purple',
};

export const russianDocStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.russianDocStatus',
  ['DRAFT', 'IN_REVIEW', 'ON_SIGNING', 'SIGNED', 'REJECTED', 'ARCHIVED'],
);

// =============================================================================
// DAILY LOG
// =============================================================================

export const dailyLogStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export const dailyLogStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.dailyLogStatus',
  ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
);

// =============================================================================
// WORK ORDER
// =============================================================================

export const workOrderStatusColorMap: Record<string, BadgeColor> = {
  PLANNED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  ON_HOLD: 'yellow',
  CANCELLED: 'red',
};

export const workOrderStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.workOrderStatus',
  ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
);

export const workOrderPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export const workOrderPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.workOrderPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
);

// =============================================================================
// WEATHER
// =============================================================================

export const weatherColorMap: Record<string, BadgeColor> = {
  CLEAR: 'yellow',
  CLOUDY: 'gray',
  RAIN: 'blue',
  SNOW: 'cyan',
  WIND: 'orange',
  FROST: 'purple',
  FOG: 'gray',
};

export const weatherLabels: Record<string, string> = i18nLabels(
  'statusLabels.weather',
  ['CLEAR', 'CLOUDY', 'RAIN', 'SNOW', 'WIND', 'FROST', 'FOG'],
);

// =============================================================================
// REGULATORY -- PERMITS
// =============================================================================

export const permitStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  APPROVED: 'cyan',
  ACTIVE: 'green',
  EXPIRED: 'red',
  REVOKED: 'red',
  REJECTED: 'red',
};

export const permitStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.permitStatus',
  ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'REJECTED'],
);

export const permitTypeColorMap: Record<string, BadgeColor> = {
  BUILDING_PERMIT: 'blue',
  DEMOLITION_PERMIT: 'red',
  EXCAVATION_PERMIT: 'orange',
  ENVIRONMENTAL_PERMIT: 'green',
  FIRE_SAFETY: 'red',
  SANITARY: 'cyan',
  ROSTECHNADZOR: 'purple',
  OTHER: 'gray',
};

export const permitTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.permitType',
  ['BUILDING_PERMIT', 'DEMOLITION_PERMIT', 'EXCAVATION_PERMIT', 'ENVIRONMENTAL_PERMIT', 'FIRE_SAFETY', 'SANITARY', 'ROSTECHNADZOR', 'OTHER'],
);

// =============================================================================
// REGULATORY -- LICENSES
// =============================================================================

export const licenseStatusColorMap: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  EXPIRING_SOON: 'yellow',
  EXPIRED: 'red',
  SUSPENDED: 'orange',
  REVOKED: 'red',
};

export const licenseStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.licenseStatus',
  ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'REVOKED'],
);

// =============================================================================
// REGULATORY -- INSPECTIONS
// =============================================================================

export const inspectionStatusColorMap: Record<string, BadgeColor> = {
  SCHEDULED: 'blue',
  IN_PROGRESS: 'yellow',
  PASSED: 'green',
  FAILED: 'red',
  RESCHEDULED: 'orange',
  CANCELLED: 'gray',
};

export const inspectionStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.inspectionStatus',
  ['SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'RESCHEDULED', 'CANCELLED'],
);

export const inspectionTypeColorMap: Record<string, BadgeColor> = {
  ROSTECHNADZOR: 'purple',
  FIRE_INSPECTION: 'red',
  SANITARY: 'cyan',
  ENVIRONMENTAL: 'green',
  LABOR_INSPECTION: 'orange',
  INTERNAL_AUDIT: 'blue',
  CUSTOMER_INSPECTION: 'yellow',
  OTHER: 'gray',
};

export const inspectionTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.inspectionType',
  ['ROSTECHNADZOR', 'FIRE_INSPECTION', 'SANITARY', 'ENVIRONMENTAL', 'LABOR_INSPECTION', 'INTERNAL_AUDIT', 'CUSTOMER_INSPECTION', 'OTHER'],
);

// =============================================================================
// COMPLIANCE
// =============================================================================

export const complianceResultColorMap: Record<string, BadgeColor> = {
  COMPLIANT: 'green',
  NON_COMPLIANT: 'red',
  PARTIALLY_COMPLIANT: 'yellow',
  PENDING: 'gray',
};

export const complianceResultLabels: Record<string, string> = i18nLabels(
  'statusLabels.complianceResult',
  ['COMPLIANT', 'NON_COMPLIANT', 'PARTIALLY_COMPLIANT', 'PENDING'],
);

// =============================================================================
// PUNCH LIST
// =============================================================================

export const punchItemStatusColorMap: Record<string, BadgeColor> = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  READY_FOR_REVIEW: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  CLOSED: 'purple',
};

export const punchItemStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.punchItemStatus',
  ['OPEN', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'],
);

export const punchItemPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const punchItemPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.punchItemPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

export const punchCategoryColorMap: Record<string, BadgeColor> = {
  STRUCTURAL: 'red',
  ARCHITECTURAL: 'blue',
  MECHANICAL: 'orange',
  ELECTRICAL: 'yellow',
  PLUMBING: 'cyan',
  FINISHING: 'purple',
  FIRE_SAFETY: 'red',
  LANDSCAPING: 'green',
  OTHER: 'gray',
};

export const punchCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.punchCategory',
  ['STRUCTURAL', 'ARCHITECTURAL', 'MECHANICAL', 'ELECTRICAL', 'PLUMBING', 'FINISHING', 'FIRE_SAFETY', 'LANDSCAPING', 'OTHER'],
);

export const punchListStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'blue',
  IN_REVIEW: 'yellow',
  COMPLETED: 'green',
  CLOSED: 'purple',
};

export const punchListStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.punchListStatus',
  ['DRAFT', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'CLOSED'],
);

// =============================================================================
// KEP (Digital Signature)
// =============================================================================

export const kepCertStatusColorMap: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  EXPIRING_SOON: 'yellow',
  EXPIRED: 'red',
  REVOKED: 'red',
  SUSPENDED: 'orange',
};

export const kepCertStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.kepCertStatus',
  ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REVOKED', 'SUSPENDED'],
);

export const kepSigningStatusColorMap: Record<string, BadgeColor> = {
  PENDING: 'yellow',
  SIGNED: 'green',
  REJECTED: 'red',
  EXPIRED: 'orange',
  CANCELLED: 'gray',
};

export const kepSigningStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.kepSigningStatus',
  ['PENDING', 'SIGNED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
);

export const kepPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const kepPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.kepPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

// =============================================================================
// DESIGN
// =============================================================================

export const designVersionStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  IN_REVIEW: 'yellow',
  APPROVED: 'green',
  SUPERSEDED: 'purple',
  REJECTED: 'red',
  ARCHIVED: 'blue',
};

export const designVersionStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.designVersionStatus',
  ['DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED', 'REJECTED', 'ARCHIVED'],
);

export const designReviewStatusColorMap: Record<string, BadgeColor> = {
  PENDING: 'gray',
  IN_PROGRESS: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  REVISION_REQUESTED: 'orange',
};

export const designReviewStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.designReviewStatus',
  ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
);

// =============================================================================
// DISPATCH
// =============================================================================

export const dispatchStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  DISPATCHED: 'yellow',
  IN_TRANSIT: 'orange',
  DELIVERED: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

export const dispatchStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.dispatchStatus',
  ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
);

// =============================================================================
// STOCK LIMITS & ALERTS
// =============================================================================

export const stockLimitTypeColorMap: Record<string, BadgeColor> = {
  MIN: 'red',
  MAX: 'orange',
  REORDER_POINT: 'blue',
  SAFETY_STOCK: 'green',
};

export const stockLimitTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.stockLimitType',
  ['MIN', 'MAX', 'REORDER_POINT', 'SAFETY_STOCK'],
);

export const stockAlertSeverityColorMap: Record<string, BadgeColor> = {
  INFO: 'blue',
  WARNING: 'yellow',
  CRITICAL: 'red',
};

export const stockAlertSeverityLabels: Record<string, string> = i18nLabels(
  'statusLabels.stockAlertSeverity',
  ['INFO', 'WARNING', 'CRITICAL'],
);

// =============================================================================
// TOLERANCE
// =============================================================================

export const toleranceCategoryColorMap: Record<string, BadgeColor> = {
  GEOMETRIC: 'blue',
  STRUCTURAL: 'red',
  THERMAL: 'orange',
  ACOUSTIC: 'cyan',
  WATERPROOFING: 'green',
  FIRE_RESISTANCE: 'red',
  SURFACE_FINISH: 'purple',
  ALIGNMENT: 'yellow',
  OTHER: 'gray',
};

export const toleranceCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.toleranceCategory',
  ['GEOMETRIC', 'STRUCTURAL', 'THERMAL', 'ACOUSTIC', 'WATERPROOFING', 'FIRE_RESISTANCE', 'SURFACE_FINISH', 'ALIGNMENT', 'OTHER'],
);

export const toleranceCheckStatusColorMap: Record<string, BadgeColor> = {
  PLANNED: 'gray',
  IN_PROGRESS: 'yellow',
  PASSED: 'green',
  FAILED: 'red',
  DEVIATION_ACCEPTED: 'orange',
};

export const toleranceCheckStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.toleranceCheckStatus',
  ['PLANNED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'DEVIATION_ACCEPTED'],
);

// =============================================================================
// RECRUITMENT
// =============================================================================

export const applicantStatusColorMap: Record<string, BadgeColor> = {
  NEW: 'blue',
  SCREENING: 'yellow',
  INTERVIEW: 'orange',
  OFFER: 'purple',
  HIRED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'gray',
};

export const applicantStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.applicantStatus',
  ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'],
);

export const applicantPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export const applicantPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.applicantPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
);

export const jobPositionStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  FILLED: 'green',
  CANCELLED: 'red',
};

export const jobPositionStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.jobPositionStatus',
  ['DRAFT', 'OPEN', 'IN_PROGRESS', 'FILLED', 'CANCELLED'],
);

export const employmentTypeColorMap: Record<string, BadgeColor> = {
  FULL_TIME: 'blue',
  PART_TIME: 'cyan',
  CONTRACT: 'orange',
  INTERNSHIP: 'purple',
};

export const employmentTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.employmentType',
  ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'],
);

// =============================================================================
// LEAVE
// =============================================================================

export const leaveRequestStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  APPROVED: 'green',
  REFUSED: 'red',
  CANCELLED: 'gray',
};

export const leaveRequestStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.leaveRequestStatus',
  ['DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED'],
);

export const leaveAllocationStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  APPROVED: 'green',
  EXPIRED: 'red',
};

export const leaveAllocationStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.leaveAllocationStatus',
  ['DRAFT', 'APPROVED', 'EXPIRED'],
);

// =============================================================================
// MAINTENANCE
// =============================================================================

export const maintenanceRequestStatusColorMap: Record<string, BadgeColor> = {
  NEW: 'blue',
  IN_PROGRESS: 'yellow',
  REPAIRED: 'green',
  SCRAP: 'gray',
  CANCELLED: 'red',
};

export const maintenanceRequestStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.maintenanceRequestStatus',
  ['NEW', 'IN_PROGRESS', 'REPAIRED', 'SCRAP', 'CANCELLED'],
);

export const maintenancePriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export const maintenancePriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.maintenancePriority',
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
);

export const maintenanceTypeColorMap: Record<string, BadgeColor> = {
  CORRECTIVE: 'red',
  PREVENTIVE: 'blue',
  PREDICTIVE: 'purple',
};

export const maintenanceTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.maintenanceType',
  ['CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE'],
);

export const equipmentStatusColorMap: Record<string, BadgeColor> = {
  OPERATIONAL: 'green',
  MAINTENANCE: 'yellow',
  OUT_OF_SERVICE: 'red',
  RETIRED: 'gray',
};

export const equipmentStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.equipmentStatus',
  ['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'],
);

// =============================================================================
// LEGAL
// =============================================================================

export const legalCaseStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  ON_HOLD: 'orange',
  RESOLVED: 'green',
  CLOSED: 'purple',
  APPEAL: 'red',
};

export const legalCaseStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.legalCaseStatus',
  ['DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'APPEAL'],
);

export const legalCaseTypeColorMap: Record<string, BadgeColor> = {
  LITIGATION: 'red',
  ARBITRATION: 'purple',
  CLAIM: 'orange',
  CONSULTATION: 'blue',
  CONTRACT_DISPUTE: 'yellow',
  REGULATORY: 'cyan',
};

export const legalCaseTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.legalCaseType',
  ['LITIGATION', 'ARBITRATION', 'CLAIM', 'CONSULTATION', 'CONTRACT_DISPUTE', 'REGULATORY'],
);

export const legalTemplateStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  ARCHIVED: 'purple',
};

export const legalTemplateStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.legalTemplateStatus',
  ['DRAFT', 'ACTIVE', 'ARCHIVED'],
);

export const legalTemplateCategoryColorMap: Record<string, BadgeColor> = {
  CONSTRUCTION: 'blue',
  SUPPLY: 'green',
  SERVICE: 'orange',
  SUBCONTRACT: 'purple',
  LEASE: 'cyan',
  NDA: 'yellow',
  OTHER: 'gray',
};

export const legalTemplateCategoryLabels: Record<string, string> = i18nLabels(
  'statusLabels.legalTemplateCategory',
  ['CONSTRUCTION', 'SUPPLY', 'SERVICE', 'SUBCONTRACT', 'LEASE', 'NDA', 'OTHER'],
);

// =============================================================================
// CRM
// =============================================================================

export const crmLeadStatusColorMap: Record<string, BadgeColor> = {
  NEW: 'blue',
  QUALIFIED: 'cyan',
  PROPOSITION: 'yellow',
  NEGOTIATION: 'orange',
  WON: 'green',
  LOST: 'red',
};

export const crmLeadStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.crmLeadStatus',
  ['NEW', 'QUALIFIED', 'PROPOSITION', 'NEGOTIATION', 'WON', 'LOST'],
);

export const crmLeadPriorityColorMap: Record<string, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const crmLeadPriorityLabels: Record<string, string> = i18nLabels(
  'statusLabels.crmLeadPriority',
  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
);

// =============================================================================
// StatusBadge Component
// =============================================================================

// Re-export prescription & regulatory body type config for consumers
// that import from the barrel (e.g. @/design-system/components/StatusBadge)
export const prescriptionStatusColorMap: Record<string, BadgeColor> = {
  RECEIVED: 'yellow',
  UNDER_REVIEW: 'blue',
  IN_PROGRESS: 'cyan',
  RESPONSE_SUBMITTED: 'purple',
  COMPLETED: 'green',
  APPEALED: 'orange',
  OVERDUE: 'red',
  CLOSED: 'gray',
};

export const prescriptionStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.prescriptionStatus',
  ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESPONSE_SUBMITTED', 'COMPLETED', 'APPEALED', 'OVERDUE', 'CLOSED'],
);

export const regulatoryBodyTypeColorMap: Record<string, BadgeColor> = {
  GIT: 'blue',
  ROSTEKHNADZOR: 'red',
  STROYNADZOR: 'orange',
  MCHS: 'red',
  ROSPOTREBNADZOR: 'green',
  ENVIRONMENTAL: 'cyan',
  OTHER: 'gray',
};

export const regulatoryBodyTypeLabels: Record<string, string> = i18nLabels(
  'statusLabels.regulatoryBodyType',
  ['GIT', 'ROSTEKHNADZOR', 'STROYNADZOR', 'MCHS', 'ROSPOTREBNADZOR', 'ENVIRONMENTAL', 'OTHER'],
);

// =============================================================================
// WAYBILL
// =============================================================================

export const waybillStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  ISSUED: 'blue',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CLOSED: 'purple',
};

export const waybillStatusLabels: Record<string, string> = i18nLabels(
  'statusLabels.waybillStatus',
  ['DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'],
);

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap = projectStatusColorMap,
  label,
  size = 'sm',
  className,
}) => {
  const rawColor = colorMap[status];
  const color: BadgeColor =
    rawColor && Object.prototype.hasOwnProperty.call(colorStyles, rawColor)
      ? (rawColor as BadgeColor)
      : 'gray';
  const styles = colorStyles[color];
  const displayLabel = label ?? projectStatusLabels[status] ?? status;

  return (
    <span
      className={cn(
        'status-badge inline-flex items-center gap-1.5 font-medium rounded-full',
        styles.bg,
        styles.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
      {displayLabel}
    </span>
  );
};
