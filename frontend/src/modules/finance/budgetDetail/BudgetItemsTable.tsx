import React from 'react';
import {
  Plus, Trash2, ChevronRight, ChevronDown,
  TrendingUp, Edit2, Eye,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { BudgetItem, BudgetItemDocStatus, BudgetItemPriceSource } from '@/types';
import {
  formatMoneyWhole,
  calcSalePrice,
  calcVatAmount,
  calcTotalWithVat,
  thCls,
  thRCls,
  tdCls,
  tdRCls,
} from '@/modules/finance/budgetDetail/budgetDetailHelpers';
import {
  DOC_STATUS_CONFIG,
  PRICE_SOURCE_LABEL,
  PRICE_SOURCE_BADGE_CLASS,
} from '@/modules/finance/budgetDetail/budgetDetailTypes';
import type { SectionTotals } from '@/modules/finance/budgetDetail/budgetDetailTypes';

// ─────────────────────────────────────────────────────────────────────────────
// DocStatusBadge
// ─────────────────────────────────────────────────────────────────────────────

const DocStatusBadge: React.FC<{ status: BudgetItemDocStatus }> = ({ status }) => {
  const cfg = DOC_STATUS_CONFIG[status] ?? DOC_STATUS_CONFIG.PLANNED;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', cfg.cls)}>
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AmtCell — memoised for list perf
// ─────────────────────────────────────────────────────────────────────────────

const AmtCell: React.FC<{ v: number | undefined; dim?: boolean; accent?: 'success' | 'warn' }> = React.memo(({ v = 0, dim, accent }) => (
  <td className={cn(
    tdRCls,
    dim && 'text-neutral-300',
    accent === 'success' && 'text-success-700 font-medium',
    accent === 'warn'    && 'text-orange-600 font-medium',
    !dim && !accent      && 'text-neutral-700 dark:text-neutral-300',
  )}>
    {v === 0 ? <span className="text-neutral-300">—</span> : formatMoneyWhole(v)}
  </td>
));
AmtCell.displayName = 'AmtCell';

// ─────────────────────────────────────────────────────────────────────────────
// Discipline mark colour helper
// ─────────────────────────────────────────────────────────────────────────────

const disciplineMarkClass = (mark?: string) => {
  if (!mark) return 'bg-neutral-100 text-neutral-600';
  return cn(
    mark === 'ОВ'  && 'bg-blue-50 text-blue-700',
    mark === 'ВК'  && 'bg-cyan-50 text-cyan-700',
    (mark === 'ЭОМ' || mark === 'ЭО' || mark === 'ЭМ') && 'bg-yellow-50 text-yellow-700',
    mark === 'АОВ' && 'bg-purple-50 text-purple-700',
    mark === 'АР'  && 'bg-neutral-100 text-neutral-600',
    mark === 'КЖ'  && 'bg-stone-100 text-stone-600',
    mark === 'СС'  && 'bg-indigo-50 text-indigo-700',
    mark === 'ПБ'  && 'bg-red-50 text-red-700',
    mark === 'ТХ'  && 'bg-teal-50 text-teal-700',
    mark === 'КМ'  && 'bg-lime-50 text-lime-700',
    mark === 'ГП'  && 'bg-green-50 text-green-700',
    !['ОВ', 'ВК', 'ЭОМ', 'ЭО', 'ЭМ', 'АОВ', 'АР', 'КЖ', 'СС', 'ПБ', 'ТХ', 'КМ', 'ГП'].includes(mark) && 'bg-neutral-100 text-neutral-600',
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface BudgetItemsTableProps {
  items: BudgetItem[];
  sections: BudgetItem[];
  rootPositions: BudgetItem[];
  itemsByParent: Map<string, BudgetItem[]>;
  sectionTotals: Map<string, SectionTotals>;
  expandedSections: Set<string>;
  totals: { planned: number; contracted: number; actSigned: number; invoiced: number; paid: number };
  onToggleSection: (id: string) => void;
  onOpenAddModal: (parentId: string | null, isSection: boolean) => void;
  onOpenEditModal: (item: BudgetItem) => void;
  onDeleteConfirm: (id: string) => void;
  onOpenSourceInspect: (item: BudgetItem) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const BudgetItemsTable: React.FC<BudgetItemsTableProps> = ({
  items,
  sections,
  rootPositions,
  itemsByParent,
  sectionTotals,
  expandedSections,
  totals,
  onToggleSection,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteConfirm,
  onOpenSourceInspect,
}) => {
  // ── Position row ────────────────────────────────────────────────────────
  const renderPositionRow = (pos: BudgetItem, indent = 0) => {
    const sp  = pos.salePrice ?? calcSalePrice(pos.costPrice ?? 0, pos.coefficient ?? 1);
    const customerPrice = pos.customerPrice && pos.customerPrice > 0 ? pos.customerPrice : sp;
    const estimatePrice = pos.estimatePrice ?? (pos.priceSourceType === 'ESTIMATE' ? (pos.costPrice ?? 0) : 0);
    const va  = pos.vatAmount ?? calcVatAmount(sp, pos.vatRate ?? 22);
    const twv = pos.totalWithVat ?? calcTotalWithVat(sp, va);
    const status = (pos.docStatus ?? 'PLANNED') as BudgetItemDocStatus;
    const sourceType = (pos.priceSourceType ?? 'MANUAL') as BudgetItemPriceSource;
    const sourceLabel = PRICE_SOURCE_LABEL[sourceType] ?? sourceType;

    return (
      <tr key={pos.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 group">
        <td
          className={cn(
            tdCls,
            'max-w-[260px] sticky left-0 z-[1] bg-white dark:bg-neutral-900',
          )}
          style={{ paddingLeft: `${12 + indent * 20}px` }}
        >
          <div className="flex items-center gap-1.5">
            {pos.itemType && (
              <span className={cn(
                'shrink-0 px-1.5 py-0.5 rounded text-xs font-medium',
                pos.itemType === 'WORKS'     && 'bg-blue-50 text-blue-700',
                pos.itemType === 'MATERIALS' && 'bg-amber-50 text-amber-700',
                pos.itemType === 'EQUIPMENT' && 'bg-purple-50 text-purple-700',
                (pos.itemType === 'OVERHEAD' || pos.itemType === 'OTHER') && 'bg-neutral-100 text-neutral-600',
              )}>
                {pos.itemType === 'WORKS' ? t('finance.typeShortWorks') : pos.itemType === 'MATERIALS' ? t('finance.typeShortMaterials') : pos.itemType === 'EQUIPMENT' ? t('finance.typeShortEquipment') : t('finance.typeShortOther')}
              </span>
            )}
            <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{pos.name}</span>
          </div>
        </td>
        <td className={cn(tdCls, 'text-center text-neutral-500 text-xs')}>{pos.unit}</td>
        <td className={cn(tdRCls, 'text-neutral-600 text-xs')}>{pos.quantity?.toLocaleString('ru-RU') ?? '1'}</td>
        <AmtCell v={pos.costPrice} dim={!pos.costPrice} />
        <AmtCell v={estimatePrice} dim={!estimatePrice} />
        <td className={cn(tdRCls, 'text-neutral-500 text-xs')}>
          {pos.coefficient !== 1 && pos.coefficient != null
            ? <span className="font-medium text-primary-600">×{pos.coefficient}</span>
            : <span className="text-neutral-300">—</span>
          }
        </td>
        <AmtCell v={customerPrice} dim={!customerPrice} />
        <AmtCell v={va} dim />
        <td className={cn(tdRCls, 'font-semibold text-neutral-800 dark:text-neutral-200')}>
          {twv === 0 ? <span className="text-neutral-200">—</span> : formatMoneyWhole(twv)}
        </td>
        <td className={tdCls}>
          <button
            type="button"
            onClick={() => onOpenSourceInspect(pos)}
            className="inline-flex items-center gap-1.5 hover:opacity-90"
            title={t('finance.openPriceSource')}
          >
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
              PRICE_SOURCE_BADGE_CLASS[sourceType] ?? 'bg-neutral-100 text-neutral-600',
            )}>
              {sourceLabel}
            </span>
            <Eye size={12} className="text-neutral-400" />
          </button>
        </td>
        <AmtCell v={pos.plannedAmount} />
        <AmtCell v={pos.contractedAmount} accent={pos.contractedAmount ? 'success' : undefined} />
        <AmtCell v={pos.actSignedAmount}  accent={pos.actSignedAmount  ? 'warn'    : undefined} />
        <AmtCell v={pos.paidAmount}       accent={pos.paidAmount       ? 'success' : undefined} />
        <td className={tdCls}><DocStatusBadge status={status} /></td>
        <td className={cn(tdCls, 'opacity-0 group-hover:opacity-100 transition-opacity')}>
          <div className="flex items-center gap-1">
            <button onClick={() => onOpenEditModal(pos)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600">
              <Edit2 size={12} />
            </button>
            <button onClick={() => onDeleteConfirm(pos.id)} className="p-1 rounded hover:bg-danger-50 text-neutral-400 hover:text-danger-600">
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Section row (recursive) ─────────────────────────────────────────────
  const renderSectionRow = (section: BudgetItem, indent = 0): React.ReactNode => {
    const isExpanded = expandedSections.has(section.id);
    const children = itemsByParent.get(section.id) ?? [];
    const sTotals = sectionTotals.get(section.id) ?? { planned: 0, contracted: 0, actSigned: 0, invoiced: 0, paid: 0 };

    return (
      <React.Fragment key={section.id}>
        <tr
          className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 group"
          onClick={() => onToggleSection(section.id)}
        >
          <td
            className="px-3 py-2.5 font-semibold text-sm text-neutral-700 dark:text-neutral-300 sticky left-0 z-[1] bg-neutral-50 dark:bg-neutral-800/60"
            colSpan={10}
          >
            <div className="flex items-center gap-2" style={{ paddingLeft: `${indent * 20}px` }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="uppercase tracking-wide text-xs">{section.name}</span>
              {section.disciplineMark && (
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold',
                  disciplineMarkClass(section.disciplineMark),
                )}>
                  {section.disciplineMark}
                </span>
              )}
              <span className="text-xs font-normal text-neutral-400">({children.length} {t('finance.childItems')})</span>
            </div>
          </td>
          <td className={cn(thRCls, 'text-sm font-semibold text-neutral-700')}>
            {formatMoneyWhole(sTotals.planned)}
          </td>
          <td className={cn(thRCls, 'text-sm font-semibold text-primary-600')}>
            {sTotals.contracted ? formatMoneyWhole(sTotals.contracted) : <span className="text-neutral-300">—</span>}
          </td>
          <td className={cn(thRCls, 'text-sm font-semibold text-orange-600')}>
            {sTotals.actSigned ? formatMoneyWhole(sTotals.actSigned) : <span className="text-neutral-300">—</span>}
          </td>
          <td className={cn(thRCls, 'text-sm font-semibold text-success-700')}>
            {sTotals.paid ? formatMoneyWhole(sTotals.paid) : <span className="text-neutral-300">—</span>}
          </td>
          <td className="px-3 py-2.5" />
          <td className="px-3 py-2.5 opacity-0 group-hover:opacity-100">
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAddModal(section.id, true); }}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400"
                title={t('finance.addSubsection')}
              ><Plus size={12} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAddModal(section.id, false); }}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400"
                title={t('finance.addPosition')}
              ><Plus size={12} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenEditModal(section); }}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400"
                title={t('finance.editItem')}
              ><Edit2 size={12} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConfirm(section.id); }}
                className="p-1 rounded hover:bg-danger-50 text-neutral-400 hover:text-danger-600"
                title={t('finance.deleteItem')}
              ><Trash2 size={12} /></button>
            </div>
          </td>
        </tr>
        {isExpanded && children.map((child) => (
          child.section ? renderSectionRow(child, indent + 1) : renderPositionRow(child, indent + 1)
        ))}
        {isExpanded && (
          <tr className="border-b border-neutral-50 dark:border-neutral-800">
            <td colSpan={16} className="py-1.5" style={{ paddingLeft: `${32 + indent * 20}px` }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAddModal(section.id, true)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline flex items-center gap-1"
                >
                  <Plus size={11} /> {t('finance.addSubsection')}
                </button>
                <button
                  onClick={() => onOpenAddModal(section.id, false)}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                >
                  <Plus size={11} /> {t('finance.addPosition')}
                </button>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <TrendingUp size={28} className="text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('finance.noBudgetItems')}</p>
            <p className="text-xs text-neutral-400 mt-1">{t('finance.createSectionsHint')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onOpenAddModal(null, true)}>{t('finance.plusSection')}</Button>
            <Button variant="primary"   size="sm" onClick={() => onOpenAddModal(null, false)}>{t('finance.plusPosition')}</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Full table ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="max-h-[72vh] overflow-auto">
        <table className="w-full min-w-[1460px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className={cn(thCls, 'sticky top-0 left-0 z-30 bg-neutral-50 dark:bg-neutral-800')}  style={{ minWidth: 260 }}>{t('finance.colName')}</th>
              <th className={cn(thCls, 'text-center sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 48 }}>{t('finance.colUnit')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 64 }}>{t('finance.colQty')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 110 }}>{t('finance.colCostPrice')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 110 }}>{t('finance.colEstimatePrice')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 64 }}>{t('finance.colCoefficient')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 130 }}>{t('finance.colClientPrice')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 110 }}>{t('finance.colVat22')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 130 }}>{t('finance.colTotalWithVat')}</th>
              <th className={cn(thCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 150 }}>{t('finance.colSource')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 130 }}>{t('finance.colPlanned')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 130 }}>{t('finance.colContracted')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 120 }}>{t('finance.colActSigned')}</th>
              <th className={cn(thRCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')} style={{ width: 120 }}>{t('finance.colPaid')}</th>
              <th className={cn(thCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')}  style={{ width: 130 }}>{t('finance.colStatus')}</th>
              <th className={cn(thCls, 'sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-800')}  style={{ width: 64 }}></th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => renderSectionRow(section, 0))}
            {rootPositions.map((pos) => renderPositionRow(pos, 0))}
            {items.length > 0 && (
              <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 font-semibold">
                <td colSpan={10} className="px-3 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide sticky left-0 z-[1] bg-neutral-50 dark:bg-neutral-800">
                  {t('finance.budgetTotal')}
                </td>
                <td className={cn(tdRCls, 'font-bold text-neutral-800 dark:text-neutral-200')}>{formatMoneyWhole(totals.planned)}</td>
                <td className={cn(tdRCls, 'font-bold text-primary-700')}>{totals.contracted ? formatMoneyWhole(totals.contracted) : <span className="text-neutral-300">—</span>}</td>
                <td className={cn(tdRCls, 'font-bold text-orange-600')}>{totals.actSigned ? formatMoneyWhole(totals.actSigned) : <span className="text-neutral-300">—</span>}</td>
                <td className={cn(tdRCls, 'font-bold text-success-700')}>{totals.paid ? formatMoneyWhole(totals.paid) : <span className="text-neutral-300">—</span>}</td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetItemsTable;
