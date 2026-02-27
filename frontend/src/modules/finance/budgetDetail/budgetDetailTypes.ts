import type { BudgetItemDocStatus, BudgetItemPriceSource } from '@/types';
import { t } from '@/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// Form / state types
// ─────────────────────────────────────────────────────────────────────────────

export interface ItemFormState {
  section: boolean;
  parentId: string;
  itemType: string;
  category: string;
  name: string;
  quantity: string;
  unit: string;
  costPrice: string;
  estimatePrice: string;
  customerPrice: string;
  coefficient: string;
  vatRate: string;
  overheadRate: string;
  profitRate: string;
  contingencyRate: string;
  notes: string;
  priceSourceType: string;
  priceSourceId: string;
  disciplineMark: string;
}

export interface SelectedTenderInfo {
  prId: string;
  prName: string;
  itemName: string;
  price: number;
}

export interface SelectedEstimateInfo {
  estimateId: string;
  estimateName: string;
  itemName: string;
  price: number;
}

export interface SelectedInvoiceInfo {
  invoiceId: string;
  invoiceNumber: string;
  itemName: string;
  price: number;
}

export interface PriceSourceLinePreview {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice: number;
  amount?: number;
  matched: boolean;
}

export interface PriceSourceDetails {
  sourceType: BudgetItemPriceSource;
  sourceLabel: string;
  sourceId?: string;
  documentTitle: string;
  documentStatus?: string;
  documentTotal?: number;
  documentLink?: string;
  note?: string;
  lines: PriceSourceLinePreview[];
}

export interface SectionTotals {
  planned: number;
  contracted: number;
  actSigned: number;
  invoiced: number;
  paid: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FORM: ItemFormState = {
  section: false,
  parentId: '',
  itemType: 'WORKS',
  category: 'OTHER',
  name: '',
  quantity: '1',
  unit: t('finance.unitPcs'),
  costPrice: '0',
  estimatePrice: '0',
  customerPrice: '0',
  coefficient: '1',
  vatRate: '22',
  overheadRate: '15',
  profitRate: '8',
  contingencyRate: '3',
  notes: '',
  priceSourceType: 'MANUAL',
  priceSourceId: '',
  disciplineMark: '',
};

export const ITEM_TYPES = [
  { value: 'WORKS',     label: t('finance.itemTypeWorks') },
  { value: 'MATERIALS', label: t('finance.itemTypeMaterials') },
  { value: 'EQUIPMENT', label: t('finance.itemTypeEquipment') },
  { value: 'OVERHEAD',  label: t('finance.itemTypeOverhead') },
  { value: 'OTHER',     label: t('finance.itemTypeOther') },
];

export const BUDGET_CATEGORIES = [
  { value: 'LABOR',       label: t('finance.costCategoryLabor') },
  { value: 'MATERIALS',   label: t('finance.itemTypeMaterials') },
  { value: 'EQUIPMENT',   label: t('finance.itemTypeEquipment') },
  { value: 'SUBCONTRACT', label: t('finance.costCategorySubcontract') },
  { value: 'OVERHEAD',    label: t('finance.costCategoryOverhead') },
  { value: 'OTHER',       label: t('finance.itemTypeOther') },
];

export const UNITS = ['шт', 'м²', 'м³', 'м', 'т', 'кг', 'л', 'компл', 'чел/ч', 'маш/ч', 'смена'];

export const DISCIPLINE_MARKS = ['АР', 'ОВ', 'ВК', 'ЭО', 'ЭМ', 'ЭОМ', 'АОВ', 'СС', 'ПБ', 'КЖ', 'КМ', 'ТХ', 'ГП'];

export const DOC_STATUS_CONFIG: Record<BudgetItemDocStatus, { label: string; cls: string }> = {
  PLANNED:    { label: t('finance.docStatusPlanned'),    cls: 'bg-neutral-100 text-neutral-600' },
  TENDERED:   { label: t('finance.docStatusTendered'),   cls: 'bg-blue-50 text-blue-700' },
  CONTRACTED: { label: t('finance.docStatusContracted'), cls: 'bg-primary-50 text-primary-700' },
  ACT_SIGNED: { label: t('finance.docStatusActSigned'),  cls: 'bg-orange-50 text-orange-700' },
  INVOICED:   { label: t('finance.docStatusInvoiced'),   cls: 'bg-purple-50 text-purple-700' },
  PAID:       { label: t('finance.docStatusPaid'),       cls: 'bg-success-50 text-success-700' },
};

export const PRICE_SOURCE_LABEL: Record<BudgetItemPriceSource, string> = {
  MANUAL: t('finance.priceSourceManual'),
  WORKS_TENDER: t('finance.priceSourceWorksTender'),
  MATERIALS_TENDER: t('finance.priceSourceMaterialsTender'),
  ESTIMATE: t('finance.priceSourceEstimate'),
  INVOICE: t('finance.priceSourceInvoice'),
};

export const PRICE_SOURCE_BADGE_CLASS: Record<BudgetItemPriceSource, string> = {
  MANUAL: 'bg-neutral-100 text-neutral-600',
  WORKS_TENDER: 'bg-blue-50 text-blue-700',
  MATERIALS_TENDER: 'bg-amber-50 text-amber-700',
  ESTIMATE: 'bg-primary-50 text-primary-700',
  INVOICE: 'bg-purple-50 text-purple-700',
};
