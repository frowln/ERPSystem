import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Wallet, Link2, FileText, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { financeApi } from '@/api/finance';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { FinanceExpenseItem, BudgetItemDocStatus } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DISCIPLINE_MARKS = ['АР', 'ОВ', 'ВК', 'ЭО', 'ЭМ', 'ЭОМ', 'АОВ', 'СС', 'ПБ', 'КЖ', 'ТХ'] as const;

const DOC_STATUSES: { value: BudgetItemDocStatus | ''; label: string }[] = [
  { value: '',           label: t('finance.expenses.allStatuses') },
  { value: 'PLANNED',    label: t('finance.docStatusPlanned') },
  { value: 'CONTRACTED', label: t('finance.docStatusContracted') },
  { value: 'ACT_SIGNED', label: t('finance.docStatusActSigned') },
  { value: 'INVOICED',   label: t('finance.docStatusInvoiced') },
  { value: 'PAID',       label: t('finance.docStatusPaid') },
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  WORKS:     t('finance.itemTypeWorks'),
  MATERIALS: t('finance.itemTypeMaterials'),
  EQUIPMENT: t('finance.itemTypeEquipment'),
  OVERHEAD:  t('finance.costCategoryOverhead'),
  OTHER:     t('finance.itemTypeOther'),
};

const DOC_STATUS_CONFIG: Record<BudgetItemDocStatus, { label: string; cls: string }> = {
  PLANNED:    { label: t('finance.docStatusPlanned'),   cls: 'bg-neutral-100 text-neutral-600' },
  TENDERED:   { label: t('finance.docStatusTendered'),          cls: 'bg-blue-50 text-blue-700' },
  CONTRACTED: { label: t('finance.docStatusContracted'), cls: 'bg-primary-50 text-primary-700' },
  ACT_SIGNED: { label: t('finance.docStatusActSigned'),    cls: 'bg-orange-50 text-orange-700' },
  INVOICED:   { label: t('finance.docStatusInvoiced'),  cls: 'bg-purple-50 text-purple-700' },
  PAID:       { label: t('finance.docStatusPaid'),        cls: 'bg-success-50 text-success-700' },
};

const MARK_COLORS: Record<string, string> = {
  ОВ:  'bg-blue-50 text-blue-700',
  ВК:  'bg-cyan-50 text-cyan-700',
  ЭО:  'bg-yellow-50 text-yellow-700',
  ЭМ:  'bg-yellow-50 text-yellow-700',
  ЭОМ: 'bg-yellow-50 text-yellow-700',
  АОВ: 'bg-purple-50 text-purple-700',
  АР:  'bg-neutral-100 text-neutral-600',
  КЖ:  'bg-stone-100 text-stone-600',
  СС:  'bg-indigo-50 text-indigo-700',
  ПБ:  'bg-red-50 text-red-700',
  ТХ:  'bg-teal-50 text-teal-700',
  КМ:  'bg-lime-50 text-lime-700',
  ГП:  'bg-green-50 text-green-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// Small badge components
// ─────────────────────────────────────────────────────────────────────────────

const DocStatusBadge: React.FC<{ status: BudgetItemDocStatus }> = ({ status }) => {
  const cfg = DOC_STATUS_CONFIG[status] ?? DOC_STATUS_CONFIG.PLANNED;
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
      cfg.cls,
    )}>
      {cfg.label}
    </span>
  );
};

const MarkBadge: React.FC<{ mark?: string }> = ({ mark }) => {
  if (!mark) return <span className="text-neutral-300">—</span>;
  const cls = MARK_COLORS[mark] ?? 'bg-neutral-100 text-neutral-600';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold', cls)}>
      {mark}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AmountCell with optional progress bar
// ─────────────────────────────────────────────────────────────────────────────

interface AmountCellProps {
  value: number;
  percent?: number;
  barColor?: string;
  textClass?: string;
}

const AmountCell: React.FC<AmountCellProps> = ({
  value,
  percent,
  barColor = 'bg-primary-400',
  textClass,
}) => {
  if (value === 0) return <span className="text-neutral-300 tabular-nums">—</span>;
  return (
    <div>
      <span className={cn('font-medium tabular-nums text-right block', textClass)}>
        {formatMoney(value)}
      </span>
      {percent !== undefined && percent > 0 && (
        <div className="mt-0.5 h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const FinanceExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { options: projectOptions } = useProjectOptions();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [projectId, setProjectId]       = useState('');
  const [disciplineMark, setDisciplineMark] = useState('');
  const [docStatus, setDocStatus]       = useState('');

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['finance-expenses', projectId, disciplineMark, docStatus],
    queryFn: () =>
      financeApi.getExpenses({
        projectId:      projectId || undefined,
        disciplineMark: disciplineMark || undefined,
        docStatus:      docStatus || undefined,
        page:  0,
        size:  500,
      }),
  });

  const allItems: FinanceExpenseItem[] = data?.content ?? [];

  // ── Client-side filter (discipline mark + status on top of server result) ─
  const items = useMemo(() => {
    let list = allItems;
    if (disciplineMark) {
      list = list.filter((i) => i.disciplineMark === disciplineMark);
    }
    if (docStatus) {
      list = list.filter((i) => i.docStatus === docStatus);
    }
    return list;
  }, [allItems, disciplineMark, docStatus]);

  // ── Metric totals ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const positions = items.filter((i) => !i.section);
    return {
      planned:    positions.reduce((s, i) => s + (i.plannedAmount    ?? 0), 0),
      contracted: positions.reduce((s, i) => s + (i.contractedAmount ?? 0), 0),
      actSigned:  positions.reduce((s, i) => s + (i.actSignedAmount  ?? 0), 0),
      paid:       positions.reduce((s, i) => s + (i.paidAmount       ?? 0), 0),
    };
  }, [items]);

  const contractedPct = totals.planned > 0
    ? Math.round((totals.contracted / totals.planned) * 100)
    : 0;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo((): ColumnDef<FinanceExpenseItem>[] => [
    {
      id:     'disciplineMark',
      header: t('finance.expenses.colMark'),
      size:   80,
      cell:   ({ row }) => <MarkBadge mark={row.original.disciplineMark} />,
    },
    {
      accessorKey: 'name',
      header: t('finance.colName'),
      size:   280,
      cell:   ({ getValue }) => (
        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate block max-w-[280px]">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'itemType',
      header: t('finance.expenses.colType'),
      size:   90,
      cell:   ({ getValue }) => {
        const val = getValue<string>();
        const label = ITEM_TYPE_LABELS[val] ?? val;
        return (
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
            val === 'WORKS'     && 'bg-blue-50 text-blue-700',
            val === 'MATERIALS' && 'bg-amber-50 text-amber-700',
            val === 'EQUIPMENT' && 'bg-purple-50 text-purple-700',
            (val === 'OVERHEAD' || val === 'OTHER') && 'bg-neutral-100 text-neutral-600',
          )}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'contractNumber',
      header: t('finance.expenses.colContract'),
      size:   140,
      cell:   ({ row }) => {
        const { contractId, contractNumber } = row.original;
        if (contractId && contractNumber) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${contractId}`); }}
              className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium"
            >
              {contractNumber}
            </button>
          );
        }
        return <span className="text-neutral-300">—</span>;
      },
    },
    {
      accessorKey: 'contractPartnerName',
      header: t('finance.expenses.colCounterparty'),
      size:   160,
      cell:   ({ getValue }) => {
        const val = getValue<string | undefined>();
        return val
          ? <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate block max-w-[160px]">{val}</span>
          : <span className="text-neutral-300">—</span>;
      },
    },
    {
      accessorKey: 'plannedAmount',
      header: t('finance.colPlanned'),
      size:   130,
      meta:   { align: 'right' },
      cell:   ({ getValue }) => (
        <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
          {formatMoney(getValue<number>() ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'contractedAmount',
      header: t('finance.colContracted'),
      size:   140,
      meta:   { align: 'right' },
      cell:   ({ row }) => {
        const { contractedAmount, plannedAmount } = row.original;
        const pct = plannedAmount > 0 ? (contractedAmount / plannedAmount) * 100 : 0;
        return (
          <AmountCell
            value={contractedAmount ?? 0}
            percent={pct}
            barColor="bg-primary-400"
            textClass="text-primary-700"
          />
        );
      },
    },
    {
      accessorKey: 'actSignedAmount',
      header: t('finance.colActSigned'),
      size:   130,
      meta:   { align: 'right' },
      cell:   ({ row }) => {
        const { actSignedAmount, contractedAmount } = row.original;
        const pct = (contractedAmount ?? 0) > 0 ? ((actSignedAmount ?? 0) / contractedAmount) * 100 : 0;
        return (
          <AmountCell
            value={actSignedAmount ?? 0}
            percent={pct}
            barColor="bg-orange-400"
            textClass="text-orange-600"
          />
        );
      },
    },
    {
      accessorKey: 'invoicedAmount',
      header: t('finance.expenses.colInvoiced'),
      size:   130,
      meta:   { align: 'right' },
      cell:   ({ getValue }) => (
        <AmountCell
          value={getValue<number>() ?? 0}
          textClass="text-purple-700"
        />
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: t('finance.colPaid'),
      size:   130,
      meta:   { align: 'right' },
      cell:   ({ getValue }) => (
        <AmountCell
          value={getValue<number>() ?? 0}
          textClass="text-success-700 font-semibold"
        />
      ),
    },
    {
      accessorKey: 'remainingAmount',
      header: t('finance.expenses.colRemaining'),
      size:   130,
      meta:   { align: 'right' },
      cell:   ({ row }) => {
        const planned = row.original.plannedAmount ?? 0;
        const paid    = row.original.paidAmount    ?? 0;
        const remaining = planned - paid;
        if (remaining <= 0) return <span className="text-neutral-300">—</span>;
        return (
          <span className="tabular-nums text-right block text-danger-600 font-medium">
            {formatMoney(remaining)}
          </span>
        );
      },
    },
    {
      accessorKey: 'docStatus',
      header: t('finance.colStatus'),
      size:   140,
      cell:   ({ getValue }) => (
        <DocStatusBadge status={(getValue<string>() ?? 'PLANNED') as BudgetItemDocStatus} />
      ),
    },
  ], [navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={t('finance.expenses.title')}
        subtitle={t('finance.expenses.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.title'), href: '/budgets' },
          { label: t('finance.expenses.breadcrumb') },
        ]}
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Project select */}
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
        >
          <option value="">{t('finance.expenses.allProjects')}</option>
          {projectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Discipline mark chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setDisciplineMark('')}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              disciplineMark === ''
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-300',
            )}
          >
            {t('finance.expenses.allMarks')}
          </button>
          {DISCIPLINE_MARKS.map((mark) => (
            <button
              key={mark}
              onClick={() => setDisciplineMark(disciplineMark === mark ? '' : mark)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold border transition-colors',
                disciplineMark === mark
                  ? 'bg-primary-600 text-white border-primary-600'
                  : cn(
                    'border-neutral-200 dark:border-neutral-700 hover:border-primary-300',
                    MARK_COLORS[mark] ?? 'bg-white text-neutral-600',
                  ),
              )}
            >
              {mark}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={docStatus}
          onChange={(e) => setDocStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {DOC_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* ── Metric cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          icon={<Wallet size={16} className="text-blue-600" />}
          label={t('finance.expenses.plannedAmount')}
          value={formatMoneyCompact(totals.planned)}
          loading={isLoading}
        />
        <MetricCard
          icon={<Link2 size={16} className="text-primary-600" />}
          label={t('finance.contracted')}
          value={formatMoneyCompact(totals.contracted)}
          subtitle={totals.planned > 0 ? `${contractedPct}% ${t('finance.expenses.ofPlan')}` : undefined}
          loading={isLoading}
        />
        <MetricCard
          icon={<FileText size={16} className="text-orange-500" />}
          label={t('finance.expenses.actsSigned')}
          value={formatMoneyCompact(totals.actSigned)}
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} className="text-success-600" />}
          label={t('finance.paid')}
          value={formatMoneyCompact(totals.paid)}
          loading={isLoading}
        />
      </div>

      {/* ── Main table ─────────────────────────────────────────────────── */}
      <DataTable<FinanceExpenseItem>
        columns={columns}
        data={items}
        loading={isLoading}
        enableExport
        enableColumnVisibility
        pageSize={25}
        onRowClick={(row) => {
          if (row.budgetId) {
            navigate(`/budgets/${row.budgetId}`);
          }
        }}
        emptyTitle={t('finance.expenses.emptyTitle')}
        emptyDescription={t('finance.expenses.emptyDescription')}
      />
    </div>
  );
};

export default FinanceExpensesPage;
