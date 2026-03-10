import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Calculator, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
} from '@/design-system/components/StatusBadge';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatNumber } from '@/lib/format';
import type { LocalEstimateLine } from '@/types';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

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

  const { data, isLoading } = useQuery({
    queryKey: ['local-estimate', id],
    queryFn: () => estimatesApi.getLocalEstimate(id!),
    enabled: !!id,
  });

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

  const estimate = data?.estimate;
  const lines = data?.lines ?? [];

  const columns = useMemo<ColumnDef<LocalEstimateLine, unknown>[]>(
    () => [
      {
        accessorKey: 'lineNumber',
        header: '#',
        size: 50,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'justification',
        header: t('estimates.normative.colJustification'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'normativeCode',
        header: t('estimates.normative.colNormCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-primary-600 dark:text-primary-400">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'normativeSource',
        header: t('estimates.normative.normativeSource'),
        size: 80,
        cell: ({ getValue }) => {
          const source = getValue<string | undefined>();
          if (!source) return <span className="text-neutral-400">—</span>;
          const cfg: Record<string, { label: string; cls: string }> = {
            GESN: { label: t('estimates.normative.gesn'), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            FER: { label: t('estimates.normative.fer'), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            TER: { label: t('estimates.normative.ter'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            MANUAL: { label: t('estimates.normative.manual'), cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300' },
          };
          const c = cfg[source] ?? cfg.MANUAL;
          return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c!.cls}`}>{c!.label}</span>;
        },
      },
      {
        accessorKey: 'name',
        header: t('estimates.normative.colName'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('estimates.normative.colUnit'),
        size: 60,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('estimates.normative.colQty'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'normHours',
        header: t('estimates.normative.colNormHours'),
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block text-neutral-600 dark:text-neutral-400">{v != null ? formatNumber(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'basePrice2001',
        header: t('estimates.normative.colBasePrice2001'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block text-neutral-600 dark:text-neutral-400">{v != null ? formatMoney(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'priceIndex',
        header: t('estimates.normative.colPriceIndex'),
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block font-medium text-primary-600 dark:text-primary-400">{v != null ? v.toFixed(4) : '—'}</span>;
        },
      },
      {
        accessorKey: 'currentPrice',
        header: t('estimates.normative.colCurrentPrice'),
        size: 120,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block font-semibold">{v != null ? formatMoney(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'directCosts',
        header: t('estimates.normative.colDirectCosts'),
        size: 120,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block">{v != null ? formatMoney(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'overheadCosts',
        header: t('estimates.normative.colOverheadCosts'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block text-neutral-600 dark:text-neutral-400">{v != null ? formatMoney(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'estimatedProfit',
        header: t('estimates.normative.colProfit'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return <span className="tabular-nums text-right block text-success-600 dark:text-success-400">{v != null ? formatMoney(v) : '—'}</span>;
        },
      },
      {
        accessorKey: 'currentTotal',
        header: t('estimates.normative.colTotal'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

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
          <div className="flex items-center gap-3">
            {estimate && (
              <StatusBadge
                status={estimate.status}
                colorMap={statusColorMap}
                label={t(statusLabels[estimate.status] ?? estimate.status)}
                size="md"
              />
            )}
            {estimate?.status === 'DRAFT' && (
              <button
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
              >
                <Calculator size={16} />
                {t('estimates.normative.btnCalculate')}
              </button>
            )}
          </div>
        }
      />

      {/* Metrics */}
      {estimate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricDirectCost')}
            value={formatMoney(estimate.totalDirectCost)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricOverhead')}
            value={formatMoney(estimate.totalOverhead)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricProfit')}
            value={formatMoney(estimate.totalEstimatedProfit)}
          />
          <MetricCard
            icon={<FileSpreadsheet size={18} />}
            label={t('estimates.normative.metricTotalVat')}
            value={formatMoney(estimate.totalWithVat)}
          />
        </div>
      )}

      {/* Normative lines table */}
      <DataTable<LocalEstimateLine>
        data={lines}
        columns={columns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={50}
        loading={isLoading}
        emptyTitle={t('estimates.normative.emptyTitle')}
        emptyDescription={t('estimates.normative.emptyDescription')}
      />

      {/* Totals footer */}
      {lines.length > 0 && (
        <div className="mt-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('estimates.normative.totals')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colDirectCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(lines.reduce((s, l) => s + (l.directCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colOverheadCosts')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(lines.reduce((s, l) => s + (l.overheadCosts ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colProfit')}</p>
              <p className="text-sm font-semibold tabular-nums text-success-600">{formatMoney(lines.reduce((s, l) => s + (l.estimatedProfit ?? 0), 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.colTotal')}</p>
              <p className="text-base font-bold tabular-nums">{formatMoney(lines.reduce((s, l) => s + l.currentTotal, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('estimates.normative.linesCount')}</p>
              <p className="text-sm font-semibold tabular-nums">{lines.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateNormativeView;
