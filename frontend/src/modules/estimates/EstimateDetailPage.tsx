import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Wallet, CreditCard, Receipt, TrendingUp, Pencil, Printer, FolderTree, Table2, Calculator, FileSpreadsheet, Trash2, CheckCircle2, Archive, ArrowRightCircle, Edit3, ArrowUpRight } from 'lucide-react';
import { EditableCell } from '@/components/ui/EditableCell';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  estimateStatusColorMap,
  estimateStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Select } from '@/design-system/components/FormField';
import { estimatesApi } from '@/api/estimates';
import { financeApi } from '@/api/finance';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Estimate, EstimateItem, LocalEstimateLine, Budget } from '@/types';
import { t } from '@/i18n';
import { printEstimate } from '@/components/PrintTemplates/EstimatePrintTemplate';
import toast from 'react-hot-toast';
import LsrTreeTable from './components/LsrTreeTable';

/* ─── View mode ─── */
type ViewMode = 'tree' | 'flat';

/* ─── Inline editable price cell ─── */
const EditablePriceCell: React.FC<{
  value: number;
  itemId: string;
  field: 'unitPrice' | 'unitPriceCustomer';
  onSave: (itemId: string, field: string, value: number) => void;
  isSaving: boolean;
}> = ({ value, itemId, field, onSave, isSaving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value > 0 ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    const num = parseFloat(draft.replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onSave(itemId, field, num);
    }
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="w-24 px-2 py-1 text-sm tabular-nums text-right border border-primary-400 rounded-md bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={commit}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={isSaving}
      className={cn(
        'group flex items-center gap-1.5 w-full justify-end tabular-nums',
        value === 0
          ? 'text-warning-500 hover:text-warning-600'
          : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600',
      )}
      title={t('estimates.detail.clickToEditPrice', { defaultValue: 'Нажмите чтобы изменить цену' })}
    >
      <span>{formatMoney(value)}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
};

/* ─── Normative status maps ─── */
const normativeStatusColorMap: Record<string, string> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  APPROVED: 'success',
  ARCHIVED: 'warning',
};

const normativeStatusLabels: Record<string, string> = {
  DRAFT: 'estimates.normative.statusDraft',
  CALCULATED: 'estimates.normative.statusCalculated',
  APPROVED: 'estimates.normative.statusApproved',
  ARCHIVED: 'estimates.normative.statusArchived',
};

/* ─── Status transitions ─── */
const ESTIMATE_TRANSITIONS: Record<string, { next: string; label: string; icon: React.ReactNode }[]> = {
  DRAFT: [{ next: 'IN_WORK', label: 'estimates.detail.actionStartWork', icon: <ArrowRightCircle size={14} /> }],
  IN_WORK: [{ next: 'ACTIVE', label: 'estimates.detail.actionActivate', icon: <CheckCircle2 size={14} /> }],
  ACTIVE: [{ next: 'APPROVED', label: 'estimates.detail.actionApprove', icon: <CheckCircle2 size={14} /> }],
  APPROVED: [],
};

const LOCAL_TRANSITIONS: Record<string, { action: string; label: string; icon: React.ReactNode }[]> = {
  DRAFT: [{ action: 'calculate', label: 'estimates.normative.btnCalculate', icon: <Calculator size={14} /> }],
  CALCULATED: [{ action: 'approve', label: 'estimates.detail.actionApprove', icon: <CheckCircle2 size={14} /> }],
  APPROVED: [{ action: 'archive', label: 'estimates.detail.actionArchive', icon: <Archive size={14} /> }],
  ARCHIVED: [],
};

const EstimateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pushFmOpen, setPushFmOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');

  /* ─── Simple estimate data ─── */
  const { data: estimate } = useQuery({
    queryKey: ['ESTIMATE', id],
    queryFn: () => estimatesApi.getEstimate(id!),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['estimate-items', id],
    queryFn: () => estimatesApi.getEstimateItems(id!),
    enabled: !!id,
  });

  /* ─── Normative (hierarchical) data — try loading ─── */
  const { data: localData } = useQuery({
    queryKey: ['local-estimate', id],
    queryFn: () => estimatesApi.getLocalEstimate(id!),
    enabled: !!id,
    retry: false,
  });

  const localEstimate = localData?.estimate;
  const localLines = localData?.lines ?? [];
  const hasTreeData = localLines.length > 0 && localLines.some(l => l.lineType === 'SECTION' || l.lineType === 'POSITION');

  /* ─── View mode: tree if hierarchical data exists ─── */
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const effectiveView = hasTreeData ? viewMode : 'flat';

  const e = estimate;
  const estimateItems = items ?? [];

  /* ─── Calculate mutation (for normative estimates) ─── */
  const calculateMutation = useMutation({
    mutationFn: () => estimatesApi.calculateLocalEstimate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['ESTIMATE', id] });
      toast.success(t('estimates.normative.toastCalculated'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Status change mutation (regular estimates) ─── */
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => estimatesApi.changeEstimateStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ESTIMATE', id] });
      toast.success(t('estimates.detail.toastStatusChanged'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  /* ─── Approve local estimate mutation ─── */
  const approveMutation = useMutation({
    mutationFn: () => estimatesApi.approveLocalEstimate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-estimate', id] });
      toast.success(t('estimates.detail.toastApproved'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  /* ─── Delete mutation ─── */
  const deleteMutation = useMutation({
    mutationFn: () => localEstimate
      ? estimatesApi.deleteLocalEstimate(id!)
      : estimatesApi.deleteEstimate(id!),
    onSuccess: () => {
      toast.success(t('estimates.detail.toastDeleted'));
      navigate('/estimates');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  /* ─── Update local estimate line mutation ─── */
  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, field, value }: { lineId: string; field: string; value: string | number }) => {
      return estimatesApi.updateLocalEstimateLine(id!, lineId, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-estimate', id] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleUpdateLine = useCallback((lineId: string, field: string, value: string | number) => {
    updateLineMutation.mutate({ lineId, field, value });
  }, [updateLineMutation]);

  /* ─── Budgets for push-to-FM ─── */
  const projectId = localEstimate?.projectId ?? e?.projectId;
  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', 'by-project', projectId],
    queryFn: () => financeApi.getBudgets({ projectId: projectId!, page: 0, size: 20 }),
    enabled: !!projectId,
  });
  const budgets = (budgetsData?.content ?? []) as Budget[];

  /* ─── Push to FM mutation ─── */
  const pushToFmMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      // Push local estimate totals as budget items
      const sections = localLines.filter(l => l.lineType === 'SECTION');
      const positions = localLines.filter(l => l.lineType === 'POSITION');
      let pushed = 0;
      if (sections.length > 0) {
        for (const section of sections) {
          const sectionItem = await financeApi.createBudgetItem(budgetId, {
            name: section.sectionName || section.name,
            category: 'LABOR',
            section: true,
            plannedAmount: section.totalAmount ?? section.currentTotal ?? 0,
          });
          const children = positions.filter(p => {
            const parentLine = localLines.find(l => l.id === p.parentLineId);
            return parentLine?.id === section.id;
          });
          for (const pos of children) {
            await financeApi.createBudgetItem(budgetId, {
              name: pos.name,
              category: 'LABOR',
              section: false,
              unit: pos.unit,
              quantity: pos.quantity,
              parentId: sectionItem.id,
              plannedAmount: pos.totalAmount ?? pos.currentTotal ?? 0,
              estimatePrice: pos.totalAmount ?? pos.currentTotal ?? 0,
            });
            pushed++;
          }
        }
      } else {
        // No sections — push positions directly
        for (const pos of positions) {
          await financeApi.createBudgetItem(budgetId, {
            name: pos.name,
            category: 'LABOR',
            section: false,
            unit: pos.unit,
            quantity: pos.quantity,
            plannedAmount: pos.totalAmount ?? pos.currentTotal ?? 0,
            estimatePrice: pos.totalAmount ?? pos.currentTotal ?? 0,
          });
          pushed++;
        }
      }
      return pushed;
    },
    onSuccess: (pushed) => {
      toast.success(t('estimates.detail.pushToFmSuccess', { count: String(pushed) }));
      setPushFmOpen(false);
      if (selectedBudgetId) navigate(`/finance/budgets/${selectedBudgetId}/fm`);
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, field, value }: { itemId: string; field: string; value: string | number }) => {
      return estimatesApi.updateEstimateItem(itemId, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', id] });
      queryClient.invalidateQueries({ queryKey: ['ESTIMATE', id] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleSave = useCallback((itemId: string, field: string, value: string | number) => {
    updateItemMutation.mutate({ itemId, field, value });
  }, [updateItemMutation]);

  const handleLocalAction = useCallback((action: string) => {
    if (action === 'calculate') calculateMutation.mutate();
    else if (action === 'approve') approveMutation.mutate();
    // Archive not yet supported in backend, but ready for when it is
  }, [calculateMutation, approveMutation]);

  /* ─── Derived metrics ─── */
  const totalAmount = localEstimate?.totalWithVat ?? e?.totalAmount ?? 0;
  const totalSpent = e?.totalSpent ?? 0;
  const orderedAmount = e?.orderedAmount ?? 0;
  const executionPercent = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;
  const orderedPercent = totalAmount > 0 ? (orderedAmount / totalAmount) * 100 : 0;

  /* ─── Title / subtitle ─── */
  const displayName = localEstimate?.name ?? e?.name ?? '';
  const displaySubtitle = localEstimate?.objectName
    ?? ([e?.projectName, e?.specificationName].filter(Boolean).join(' / ') || undefined);

  /* ─── Status display ─── */
  const displayStatus = localEstimate?.status ?? e?.status ?? '';
  const statusColor = localEstimate ? normativeStatusColorMap : estimateStatusColorMap;
  const statusLabel = localEstimate
    ? t(normativeStatusLabels[displayStatus] ?? displayStatus)
    : (estimateStatusLabels[displayStatus] ?? displayStatus);

  /* ─── Flat columns ─── */
  const columns = useMemo<ColumnDef<EstimateItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('estimates.detail.colItemName'),
        size: 240,
        cell: ({ row }) => (
          <EditableCell
            value={row.original.name}
            type="text"
            onSave={(v) => handleSave(row.original.id, 'name', v)}
            className="font-medium text-neutral-900 dark:text-neutral-100"
          />
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('estimates.detail.colQuantity'),
        size: 100,
        cell: ({ row }) => (
          <EditableCell
            value={row.original.quantity}
            type="number"
            onSave={(v) => handleSave(row.original.id, 'quantity', v)}
            format={(n) => `${new Intl.NumberFormat('ru-RU').format(n)} ${row.original.unitOfMeasure}`}
            min={0}
          />
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: t('estimates.detail.colUnitPrice'),
        size: 140,
        cell: ({ row }) => (
          <EditablePriceCell
            value={row.original.unitPrice}
            itemId={row.original.id}
            field="unitPrice"
            onSave={handleSave}
            isSaving={updateItemMutation.isPending}
          />
        ),
      },
      {
        accessorKey: 'unitPriceCustomer',
        header: t('estimates.detail.colUnitPriceCustomer'),
        size: 140,
        cell: ({ row }) => (
          <EditablePriceCell
            value={row.original.unitPriceCustomer ?? 0}
            itemId={row.original.id}
            field="unitPriceCustomer"
            onSave={handleSave}
            isSaving={updateItemMutation.isPending}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: t('estimates.detail.colAmountPlan'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'orderedAmount',
        header: t('estimates.detail.colOrdered'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'invoicedAmount',
        header: t('estimates.detail.colPaid'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'balance',
        header: t('estimates.detail.colBalance'),
        size: 140,
        cell: ({ row }) => {
          const balance = row.original.amount - row.original.invoicedAmount;
          return (
            <span className={cn(
              'tabular-nums text-right block font-medium',
              balance > 0 ? 'text-success-600' : balance < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
            )}>
              {formatMoney(balance)}
            </span>
          );
        },
      },
      {
        id: 'execution',
        header: t('estimates.detail.colExecution'),
        size: 100,
        cell: ({ row }) => {
          const pct = row.original.amount > 0
            ? (row.original.invoicedAmount / row.original.amount) * 100
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-10 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct >= 90 ? 'bg-success-500' : pct >= 50 ? 'bg-primary-500' : 'bg-warning-500',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{pct.toFixed(0)}%</span>
            </div>
          );
        },
      },
    ],
    [handleSave, updateItemMutation.isPending],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={displayName}
        subtitle={displaySubtitle}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.detail.breadcrumbHome'), href: '/' },
          { label: t('estimates.detail.breadcrumbEstimates'), href: '/estimates' },
          { label: displayName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle (only when tree data available) */}
            {hasTreeData && (
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('tree')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                  )}
                >
                  <FolderTree size={14} />
                  {t('estimates.detail.viewTree', { defaultValue: 'ЛСР' })}
                </button>
                <button
                  onClick={() => setViewMode('flat')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'flat'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                  )}
                >
                  <Table2 size={14} />
                  {t('estimates.detail.viewFlat', { defaultValue: 'Таблица' })}
                </button>
              </div>
            )}

            {/* Status transition buttons — LOCAL estimates */}
            {localEstimate && (LOCAL_TRANSITIONS[localEstimate.status] ?? []).map((tr) => (
              <Button
                key={tr.action}
                size="sm"
                variant={tr.action === 'approve' ? 'primary' : 'secondary'}
                iconLeft={tr.icon}
                onClick={() => handleLocalAction(tr.action)}
                disabled={calculateMutation.isPending || approveMutation.isPending}
              >
                {t(tr.label)}
              </Button>
            ))}

            {/* Status transition buttons — REGULAR estimates */}
            {!localEstimate && e && (ESTIMATE_TRANSITIONS[e.status] ?? []).map((tr) => (
              <Button
                key={tr.next}
                size="sm"
                variant="primary"
                iconLeft={tr.icon}
                onClick={() => statusMutation.mutate(tr.next)}
                disabled={statusMutation.isPending}
              >
                {t(tr.label)}
              </Button>
            ))}

            {/* Push to FM button */}
            {(localEstimate || e) && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<ArrowUpRight size={14} />}
                onClick={() => {
                  setSelectedBudgetId(budgets[0]?.id ?? '');
                  setPushFmOpen(true);
                }}
              >
                {t('estimates.detail.pushToFm')}
              </Button>
            )}

            {/* Edit button (regular estimates only) */}
            {!localEstimate && e && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Edit3 size={14} />}
                onClick={() => navigate(`/estimates/${id}/edit`)}
              >
                {t('estimates.detail.actionEdit')}
              </Button>
            )}

            <StatusBadge
              status={displayStatus}
              colorMap={statusColor}
              label={statusLabel}
              size="md"
            />

            {/* Print button */}
            {e && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Printer size={14} />}
                onClick={() => {
                  printEstimate({
                    name: e.name,
                    projectName: e.projectName ?? '',
                    status: e.status,
                    statusDisplayName: estimateStatusLabels[e.status] ?? e.status,
                    totalAmount: e.totalAmount,
                    orderedAmount: e.orderedAmount,
                    invoicedAmount: e.invoicedAmount,
                    totalSpent: e.totalSpent,
                    balance: e.balance,
                    createdAt: e.createdAt,
                    notes: e.notes,
                    items: (estimateItems ?? []).map((item, idx) => ({
                      rowNumber: idx + 1,
                      name: item.name,
                      unitOfMeasure: item.unitOfMeasure,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      amount: item.amount,
                      unitPriceCustomer: item.unitPriceCustomer,
                      amountCustomer: item.amountCustomer,
                    })),
                  });
                }}
              >
                {t('export.common.print')}
              </Button>
            )}

            {/* Delete button */}
            <Button
              size="sm"
              variant="danger"
              iconLeft={<Trash2 size={14} />}
              onClick={() => {
                if (confirmDelete) {
                  deleteMutation.mutate();
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {confirmDelete ? t('estimates.detail.confirmDelete') : t('estimates.detail.actionDelete')}
            </Button>
          </div>
        }
      />

      {/* ─── Key metrics ─── */}
      {hasTreeData && localEstimate ? (
        /* Normative metrics: ПЗ, НР, СП, Итого с НДС */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricDirectCost')}
            value={formatMoneyCompact(localEstimate.totalDirectCost)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricOverhead')}
            value={formatMoneyCompact(localEstimate.totalOverhead)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricProfit')}
            value={formatMoneyCompact(localEstimate.totalEstimatedProfit)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricTotalVat')}
            value={formatMoneyCompact(localEstimate.totalWithVat)}
          />
        </div>
      ) : (
        /* Simple financial metrics */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Wallet size={18} />}
            label={t('estimates.detail.metricPlanned')}
            value={formatMoneyCompact(e?.totalAmount ?? 0)}
          />
          <MetricCard
            icon={<Receipt size={18} />}
            label={t('estimates.detail.metricOrdered')}
            value={formatMoneyCompact(orderedAmount)}
            trend={{ direction: 'up', value: formatPercent(orderedPercent) }}
          />
          <MetricCard
            icon={<CreditCard size={18} />}
            label={t('estimates.detail.metricPaid')}
            value={formatMoneyCompact(totalSpent)}
            trend={{ direction: 'up', value: formatPercent(executionPercent) }}
          />
          <MetricCard
            icon={<TrendingUp size={18} />}
            label={t('estimates.detail.metricBalance')}
            value={formatMoneyCompact(e?.balance ?? 0)}
            trend={{
              direction: (e?.balance ?? 0) > 0 ? 'up' : 'down',
              value: formatPercent(100 - executionPercent),
            }}
          />
        </div>
      )}

      {/* ─── Budget execution progress (flat mode only) ─── */}
      {effectiveView === 'flat' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.detail.budgetExecution')}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('estimates.detail.metricOrdered')}</p>
                <p className="text-xs font-medium text-neutral-600 tabular-nums">
                  {formatPercent(orderedPercent)}
                </p>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-400 rounded-full transition-all"
                  style={{ width: `${Math.min(orderedPercent, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('estimates.detail.metricPaid')}</p>
                <p className="text-xs font-medium text-neutral-600 tabular-nums">
                  {formatPercent(executionPercent)}
                </p>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    executionPercent > 90 ? 'bg-success-500' : 'bg-success-400',
                  )}
                  style={{ width: `${Math.min(executionPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tree view (ГРАНД-Смета 12-column structure) ─── */}
      {effectiveView === 'tree' && hasTreeData && (
        <LsrTreeTable lines={localLines} onUpdateLine={handleUpdateLine} />
      )}

      {/* ─── Flat view (simple items table) ─── */}
      {effectiveView === 'flat' && (
        <>
          {estimateItems.some(item => item.unitPrice === 0) && (
            <div className="mb-4 px-4 py-3 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-300">
              <Pencil size={14} className="inline mr-2 -mt-0.5" />
              {t('estimates.detail.editHint', {
                defaultValue: `Нажмите на цену в столбце «${t('estimates.detail.colUnitPrice')}» для редактирования. Позиции с нулевой ценой выделены.`,
              })}
            </div>
          )}

          <DataTable<EstimateItem>
            data={estimateItems}
            columns={columns}
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle={t('estimates.detail.emptyItemsTitle')}
            emptyDescription={t('estimates.detail.emptyItemsDescription')}
          />
        </>
      )}

      {/* ─── Totals footer (tree mode) ─── */}
      {effectiveView === 'tree' && localLines.length > 0 && (
        <div className="mt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.normative.totals')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colDirectCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(localEstimate?.totalDirectCost ?? localLines.reduce((s, l) => s + (l.directCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colOverheadCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(localEstimate?.totalOverhead ?? localLines.reduce((s, l) => s + (l.overheadCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colProfit')}</p>
              <p className="text-sm font-semibold tabular-nums text-success-600">{formatMoney(localEstimate?.totalEstimatedProfit ?? localLines.reduce((s, l) => s + (l.estimatedProfit ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colTotal')}</p>
              <p className="text-base font-bold tabular-nums">{formatMoney(localEstimate?.totalWithVat ?? localLines.reduce((s, l) => s + l.currentTotal, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.linesCount')}</p>
              <p className="text-sm font-semibold tabular-nums">{localLines.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Financial summary (flat mode) ─── */}
      {effectiveView === 'flat' && (
        <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.detail.financialSummary')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricPlanned')}</p>
              <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(e?.totalAmount ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricOrdered')}</p>
              <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(orderedAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.detail.metricPaid')}</p>
              <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {orderedAmount === 0 && totalSpent === 0
                  ? t('estimates.detail.labelBudgetRemaining', { defaultValue: 'Остаток бюджета' })
                  : (e?.variancePercent ?? 0) < 0
                    ? t('estimates.detail.labelOverspend', { defaultValue: 'Перерасход' })
                    : t('estimates.detail.labelVariance')}
              </p>
              <p className={cn(
                'text-base font-semibold tabular-nums',
                orderedAmount === 0 && totalSpent === 0
                  ? 'text-neutral-600 dark:text-neutral-400'
                  : (e?.variancePercent ?? 0) > 0 ? 'text-success-600' : (e?.variancePercent ?? 0) < 0 ? 'text-danger-600' : 'text-neutral-600',
              )}>
                {orderedAmount === 0 && totalSpent === 0
                  ? formatMoney(e?.totalAmount ?? 0)
                  : <>
                      {(e?.variancePercent ?? 0) > 0 ? '+' : ''}{formatPercent(Math.abs(e?.variancePercent ?? 0))}
                    </>}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ─── Push to FM Modal ─── */}
      <Modal
        open={pushFmOpen}
        onClose={() => setPushFmOpen(false)}
        title={t('estimates.detail.pushToFmTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('estimates.detail.pushToFmHint')}
          </p>
          {budgets.length === 0 ? (
            <div className="px-4 py-3 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-300">
              {t('estimates.detail.pushToFmNoBudgets')}
            </div>
          ) : (
            <>
              <Select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                options={budgets.map((b) => ({ value: b.id, label: b.name }))}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setPushFmOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={() => selectedBudgetId && pushToFmMutation.mutate(selectedBudgetId)}
                  disabled={!selectedBudgetId || pushToFmMutation.isPending}
                >
                  {pushToFmMutation.isPending ? t('common.saving') : t('estimates.detail.pushToFmConfirm')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EstimateDetailPage;
