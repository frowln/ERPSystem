import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, FileDown } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { financeApi } from '@/api/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface FmSectionSummary {
  section: string;
  planned: number;
  contracted: number;
  actual: number;
}

interface FmRiskPosition {
  itemId: string;
  name: string;
  section: string;
  planned: number;
  actual: number;
  overrun: number;
  overrunPercent: number;
}

interface FmDashboard {
  budgetId: string;
  totalCost: number;
  totalCustomer: number;
  margin: number;
  marginPercent: number;
  totalContracted: number;
  totalActSigned: number;
  totalPaid: number;
  sections: FmSectionSummary[];
  riskPositions: FmRiskPosition[];
}

const FmDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['fm-dashboard', id],
    queryFn: () => financeApi.getFmDashboard(id!),
    enabled: !!id,
  });

  const d = dashboard as FmDashboard | undefined;

  const cvrPercent = d && d.totalCost > 0 ? (d.totalContracted / d.totalCost) * 100 : 0;

  // Section bar chart data
  const maxSectionValue = useMemo(() => {
    if (!d?.sections?.length) return 1;
    return Math.max(...d.sections.map(s => Math.max(s.planned, s.contracted, s.actual)), 1);
  }, [d?.sections]);

  const riskColumns = useMemo<ColumnDef<FmRiskPosition, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('finance.fmDashboard.colName'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'section',
        header: t('finance.fmDashboard.colSection'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'planned',
        header: t('finance.fmDashboard.colPlanned'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'actual',
        header: t('finance.fmDashboard.colActual'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'overrun',
        header: t('finance.fmDashboard.colOverrun'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-semibold text-danger-600">
            +{formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'overrunPercent',
        header: t('finance.fmDashboard.colOverrunPercent'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-semibold text-danger-600">
            +{formatPercent(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.fmDashboard.title')}
        subtitle={t('finance.fmDashboard.subtitle')}
        backTo={`/finance/budgets/${id}/fm`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.finance'), href: '/finance' },
          { label: t('finance.fmDashboard.breadcrumb') },
        ]}
        actions={
          <button
            onClick={() => navigate(`/finance/budgets/${id}/fm`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium"
          >
            <BarChart3 size={16} />
            {t('finance.fmDashboard.goToFm')}
          </button>
        }
      />

      {/* KPI metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('finance.fmDashboard.metricCost')}
          value={formatMoney(d?.totalCost ?? 0)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('finance.fmDashboard.metricCustomer')}
          value={formatMoney(d?.totalCustomer ?? 0)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('finance.fmDashboard.metricMargin')}
          value={formatMoney(d?.margin ?? 0)}
          trend={{ direction: (d?.margin ?? 0) >= 0 ? 'up' : 'down', value: formatPercent(d?.marginPercent ?? 0) }}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('finance.fmDashboard.metricCvr')}
          value={formatPercent(cvrPercent)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('finance.fmDashboard.metricPaid')}
          value={formatMoney(d?.totalPaid ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CVR Progress */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.fmDashboard.cvrProgress')}</h3>
          <div className="space-y-4">
            {[
              { label: t('finance.fmDashboard.contracted'), value: d?.totalContracted ?? 0, total: d?.totalCost ?? 0, color: 'bg-primary-500' },
              { label: t('finance.fmDashboard.actSigned'), value: d?.totalActSigned ?? 0, total: d?.totalCost ?? 0, color: 'bg-success-500' },
              { label: t('finance.fmDashboard.paid'), value: d?.totalPaid ?? 0, total: d?.totalCost ?? 0, color: 'bg-warning-500' },
            ].map((item) => {
              const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.label}</p>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">
                      {formatMoney(item.value)} ({formatPercent(pct)})
                    </p>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Margin breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.fmDashboard.marginBreakdown')}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.fmDashboard.metricCost')}</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(d?.totalCost ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.fmDashboard.metricCustomer')}</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(d?.totalCustomer ?? 0)}</p>
            </div>
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('finance.fmDashboard.metricMargin')}</p>
              <p className={cn(
                'text-xl font-bold tabular-nums',
                (d?.margin ?? 0) >= 0 ? 'text-success-600' : 'text-danger-600',
              )}>
                {formatMoney(d?.margin ?? 0)} ({formatPercent(d?.marginPercent ?? 0)})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section bar chart */}
      {d?.sections && d.sections.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.fmDashboard.bySection')}</h3>
          <div className="space-y-4">
            {d.sections.map(s => (
              <div key={s.section}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{s.section}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {t('finance.fmDashboard.colPlanned')}: {formatMoney(s.planned)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-20 text-neutral-400">{t('finance.fmDashboard.colPlanned')}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-300 rounded-full" style={{ width: `${(s.planned / maxSectionValue) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-20 text-neutral-400">{t('finance.fmDashboard.contracted')}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(s.contracted / maxSectionValue) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-20 text-neutral-400">{t('finance.fmDashboard.colActual')}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full',
                        s.actual > s.planned * 1.1 ? 'bg-danger-500' : 'bg-success-500',
                      )} style={{ width: `${(s.actual / maxSectionValue) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk positions table */}
      {d?.riskPositions && d.riskPositions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-danger-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('finance.fmDashboard.riskPositions')}</h3>
          </div>
          <DataTable<FmRiskPosition>
            data={d.riskPositions}
            columns={riskColumns}
            enableColumnVisibility
            enableExport
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};

export default FmDashboardPage;
