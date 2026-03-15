import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, FileSpreadsheet, CheckCircle2, Archive, Trash2, Printer, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
} from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Select } from '@/design-system/components/FormField';
import { EditableCell } from '@/components/ui/EditableCell';
import { estimatesApi } from '@/api/estimates';
import { financeApi } from '@/api/finance';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import type { LocalEstimateLine, Budget } from '@/types';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import LsrTreeTable from './components/LsrTreeTable';
import { DataTable } from '@/design-system/components/DataTable';
import { type ColumnDef } from '@tanstack/react-table';
import { formatNumber } from '@/lib/format';

const statusColorMap: Record<string, string> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  APPROVED: 'success',
  ARCHIVED: 'warning',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'estimates.normative.statusDraft',
  CALCULATED: 'estimates.normative.statusCalculated',
  APPROVED: 'estimates.normative.statusApproved',
  ARCHIVED: 'estimates.normative.statusArchived',
};

const EstimateNormativeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pushFmOpen, setPushFmOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['local-estimate', id],
    queryFn: () => estimatesApi.getLocalEstimate(id!),
    enabled: !!id,
  });

  const estimate = data?.estimate;
  const lines = data?.lines ?? [];
  const hasTreeData = lines.some(l => l.lineType === 'SECTION' || l.lineType === 'POSITION');

  /* ─── Budgets for push-to-FM ─── */
  const projectId = estimate?.projectId;
  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', 'by-project', projectId],
    queryFn: () => financeApi.getBudgets({ projectId: projectId!, page: 0, size: 20 }),
    enabled: !!projectId,
  });
  const budgets = (budgetsData?.content ?? []) as Budget[];

  const calculateMutation = useMutation({
    mutationFn: () => estimatesApi.calculateLocalEstimate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-estimate', id] });
      toast.success(t('estimates.normative.toastCalculated'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => estimatesApi.approveLocalEstimate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-estimate', id] });
      toast.success(t('estimates.detail.toastApproved'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => estimatesApi.deleteLocalEstimate(id!),
    onSuccess: () => {
      toast.success(t('estimates.detail.toastDeleted'));
      navigate('/estimates');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  /* ─── Update local estimate line (inline editing) ─── */
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

  /* ─── Push to FM mutation ─── */
  const pushToFmMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const sections = lines.filter(l => l.lineType === 'SECTION');
      const positions = lines.filter(l => l.lineType === 'POSITION');
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
            return p.parentLineId === section.id;
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

  const isBusy = calculateMutation.isPending || approveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={estimate?.name ?? t('estimates.normative.title')}
        subtitle={estimate?.objectName ?? t('estimates.normative.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.estimates'), href: '/estimates' },
          { label: estimate?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Calculate button — only for DRAFT */}
            {estimate?.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Calculator size={14} />}
                onClick={() => calculateMutation.mutate()}
                disabled={isBusy}
              >
                {t('estimates.normative.btnCalculate')}
              </Button>
            )}

            {/* Approve button — only for CALCULATED */}
            {estimate?.status === 'CALCULATED' && (
              <Button
                size="sm"
                variant="primary"
                iconLeft={<CheckCircle2 size={14} />}
                onClick={() => approveMutation.mutate()}
                disabled={isBusy}
              >
                {t('estimates.detail.actionApprove')}
              </Button>
            )}

            {/* Push to FM */}
            {estimate && (
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

            {estimate && (
              <StatusBadge
                status={estimate.status}
                colorMap={statusColorMap}
                label={t(statusLabels[estimate.status] ?? estimate.status)}
                size="md"
              />
            )}

            {/* Print */}
            <Button
              size="sm"
              variant="secondary"
              iconLeft={<Printer size={14} />}
              onClick={() => window.print()}
            >
              {t('export.common.print')}
            </Button>

            {/* Delete */}
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
              disabled={isBusy}
            >
              {confirmDelete ? t('estimates.detail.confirmDelete') : t('estimates.detail.actionDelete')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      {estimate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricDirectCost')}
            value={formatMoneyCompact(estimate.totalDirectCost)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricOverhead')}
            value={formatMoneyCompact(estimate.totalOverhead)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricProfit')}
            value={formatMoneyCompact(estimate.totalEstimatedProfit)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricTotalVat')}
            value={formatMoneyCompact(estimate.totalWithVat)}
          />
        </div>
      )}

      {/* Hierarchical tree view (ГОСТ 12-column) */}
      {hasTreeData ? (
        <LsrTreeTable lines={lines} onUpdateLine={handleUpdateLine} />
      ) : lines.length > 0 ? (
        /* Fallback: flat table when no tree structure */
        <FlatLinesTable lines={lines} onUpdateLine={handleUpdateLine} />
      ) : null}

      {/* Loading state */}
      {isLoading && lines.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && lines.length === 0 && (
        <div className="text-center py-20">
          <FileSpreadsheet size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('estimates.normative.emptyTitle')}</h3>
          <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.normative.emptyDescription')}</p>
        </div>
      )}

      {/* Totals footer */}
      {lines.length > 0 && (
        <div className="mt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.normative.totals')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colDirectCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(estimate?.totalDirectCost ?? lines.reduce((s, l) => s + (l.directCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colOverheadCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(estimate?.totalOverhead ?? lines.reduce((s, l) => s + (l.overheadCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colProfit')}</p>
              <p className="text-sm font-semibold tabular-nums text-success-600">{formatMoney(estimate?.totalEstimatedProfit ?? lines.reduce((s, l) => s + (l.estimatedProfit ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colTotal')}</p>
              <p className="text-base font-bold tabular-nums">{formatMoney(estimate?.totalWithVat ?? lines.reduce((s, l) => s + l.currentTotal, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.linesCount')}</p>
              <p className="text-sm font-semibold tabular-nums">{lines.length}</p>
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

/* ─── Flat fallback table for non-hierarchical lines ─── */
const FlatLinesTable: React.FC<{
  lines: LocalEstimateLine[];
  onUpdateLine?: (lineId: string, field: string, value: string | number) => void;
}> = ({ lines, onUpdateLine }) => {
  const editable = !!onUpdateLine;
  const columns = useMemo<ColumnDef<LocalEstimateLine, unknown>[]>(() => [
    { accessorKey: 'lineNumber', header: '#', size: 50 },
    {
      accessorKey: 'normativeCode',
      header: t('estimates.normative.colNormCode'),
      size: 100,
      cell: ({ row }) => editable ? (
        <EditableCell value={row.original.normativeCode} type="text" onSave={(v) => onUpdateLine!(row.original.id, 'normativeCode', v)} />
      ) : <span>{row.original.normativeCode}</span>,
    },
    {
      accessorKey: 'name',
      header: t('estimates.normative.colName'),
      size: 260,
      cell: ({ row }) => editable ? (
        <EditableCell value={row.original.name} type="text" onSave={(v) => onUpdateLine!(row.original.id, 'name', v)} className="font-medium" />
      ) : <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'unit',
      header: t('estimates.normative.colUnit'),
      size: 60,
      cell: ({ row }) => editable ? (
        <EditableCell value={row.original.unit} type="text" onSave={(v) => onUpdateLine!(row.original.id, 'unit', v)} />
      ) : <span>{row.original.unit}</span>,
    },
    {
      accessorKey: 'quantity',
      header: t('estimates.normative.colQty'),
      size: 80,
      cell: ({ row }) => editable ? (
        <EditableCell value={row.original.quantity} type="number" onSave={(v) => onUpdateLine!(row.original.id, 'quantity', v)} format={formatNumber} min={0} />
      ) : <span className="tabular-nums text-right block">{formatNumber(row.original.quantity)}</span>,
    },
    {
      accessorKey: 'currentTotal',
      header: t('estimates.normative.colTotal'),
      size: 130,
      cell: ({ row }) => editable ? (
        <EditableCell value={row.original.currentTotal} type="number" onSave={(v) => onUpdateLine!(row.original.id, 'currentTotal', v)} format={formatMoney} min={0} className="font-semibold" />
      ) : <span className="font-semibold tabular-nums text-right block">{formatMoney(row.original.currentTotal)}</span>,
    },
  ], [editable, onUpdateLine]);

  return (
    <DataTable<LocalEstimateLine>
      data={lines}
      columns={columns}
      enableColumnVisibility
      enableDensityToggle
      enableExport
      pageSize={50}
      emptyTitle={t('estimates.normative.emptyTitle')}
      emptyDescription={t('estimates.normative.emptyDescription')}
    />
  );
};

export default EstimateNormativeView;
