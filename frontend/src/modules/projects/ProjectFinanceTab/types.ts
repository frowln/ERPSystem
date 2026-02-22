import type { BudgetItem, BudgetItemDocStatus, FinanceExpenseItem } from '@/types';
import { t } from '@/i18n';

// ─── Shared interfaces ──────────────────────────────────────────────────────

export interface ChangeOrder {
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: number;
  originalContractAmount: number;
  revisedContractAmount: number;
  contractId: string;
  changeOrderType: string;
}

export interface ProjectBudgetItem extends BudgetItem {
  budgetName?: string;
  projectId?: string;
  projectName?: string;
  sequence?: number;
}

export interface BudgetTreeNode {
  item: ProjectBudgetItem;
  children: BudgetTreeNode[];
  totals: {
    planned: number;
    contracted: number;
    actSigned: number;
    paid: number;
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  GENERAL: t('projects.finance.contractTypeGeneral'),
  SUBCONTRACT: t('projects.finance.contractTypeSubcontract'),
  SUPPLY: t('projects.finance.contractTypeSupply'),
  SERVICE: t('projects.finance.contractTypeService'),
  DESIGN: t('projects.finance.contractTypeDesign'),
};

export const CONTRACT_TYPE_ORDER = ['GENERAL', 'SUBCONTRACT', 'SUPPLY', 'DESIGN', 'SERVICE'];

export const DOC_STATUS_CFG: Record<BudgetItemDocStatus, { label: string; cls: string }> = {
  PLANNED:    { label: t('finance.docStatusPlanned'),   cls: 'bg-neutral-100 text-neutral-500' },
  TENDERED:   { label: t('finance.docStatusTendered'),          cls: 'bg-blue-50 text-blue-700' },
  CONTRACTED: { label: t('finance.docStatusContractedShort'),     cls: 'bg-primary-50 text-primary-700' },
  ACT_SIGNED: { label: t('finance.docStatusActSigned'),    cls: 'bg-orange-50 text-orange-700' },
  INVOICED:   { label: t('finance.docStatusInvoiced'),  cls: 'bg-purple-50 text-purple-700' },
  PAID:       { label: t('finance.docStatusPaid'),        cls: 'bg-success-50 text-success-700' },
};

export const MARK_COLORS: Record<string, string> = {
  'АР': 'bg-neutral-100 text-neutral-600', 'КЖ': 'bg-stone-100 text-stone-600',
  'ОВ': 'bg-blue-50 text-blue-700',        'ВК': 'bg-cyan-50 text-cyan-700',
  'ЭО': 'bg-yellow-50 text-yellow-700',    'ЭМ': 'bg-yellow-50 text-yellow-700',
  'ЭОМ': 'bg-yellow-50 text-yellow-700',   'АОВ': 'bg-purple-50 text-purple-700',
  'СС': 'bg-indigo-50 text-indigo-700',    'ПБ': 'bg-red-50 text-red-700',
};

// ─── Table header CSS helpers ───────────────────────────────────────────────

export const TABLE_HEADER_CLS = 'px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap';
export const TABLE_HEADER_RIGHT_CLS = TABLE_HEADER_CLS + ' text-right';
