import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Download,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { formatNumber, formatPercent } from '@/lib/format';
import type { M29ReportEntry } from './types';

const currentYear = new Date().getFullYear();

const projectOptions = [
  { value: 'p1', label: 'ЖК Солнечный' },
  { value: 'p2', label: 'БЦ Кристалл' },
  { value: 'p3', label: 'ТЦ Метрополис' },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2020, i).toLocaleString('ru-RU', { month: 'long' }),
}));

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - 2 + i),
  label: String(currentYear - 2 + i),
}));

const M29ReportPage: React.FC = () => {
  const [projectId, setProjectId] = useState('p1');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));

  const { data: report, isLoading } = useQuery({
    queryKey: ['m29-report', projectId, month, year],
    queryFn: () => warehouseApi.getM29Report(projectId, Number(month), Number(year)),
  });

  const entries = report?.entries ?? [];

  const metrics = useMemo(() => {
    const totalPlan = report?.totalPlan ?? entries.reduce((s, e) => s + e.planQty, 0);
    const totalFact = report?.totalFact ?? entries.reduce((s, e) => s + e.factQty, 0);
    const savingsPercent = totalPlan > 0 ? ((totalPlan - totalFact) / totalPlan) * 100 : 0;
    const overuseCount = entries.filter((e) => e.factQty > e.planQty).length;
    return { totalPlan, totalFact, savingsPercent, overuseCount };
  }, [report, entries]);

  const columns = useMemo<ColumnDef<M29ReportEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'materialName',
        header: t('warehouse.m29Report.columnMaterial'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('warehouse.m29Report.columnUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'planQty',
        header: t('warehouse.m29Report.columnPlanQty'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'factQty',
        header: t('warehouse.m29Report.columnFactQty'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'variance',
        header: t('warehouse.m29Report.columnVariance'),
        size: 120,
        cell: ({ row }) => {
          const v = row.original.variance;
          const color = v > 0 ? 'text-danger-600' : v < 0 ? 'text-success-600' : 'text-neutral-500';
          return (
            <span className={`tabular-nums font-medium ${color}`}>
              {v > 0 ? '+' : ''}
              {formatNumber(v)}
            </span>
          );
        },
      },
      {
        accessorKey: 'variancePercent',
        header: t('warehouse.m29Report.columnVariancePercent'),
        size: 100,
        cell: ({ row }) => {
          const v = row.original.variancePercent;
          const color = v > 0 ? 'text-danger-600' : v < 0 ? 'text-success-600' : 'text-neutral-500';
          return (
            <span className={`tabular-nums ${color}`}>
              {v > 0 ? '+' : ''}
              {formatPercent(v)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleExport = () => {
    toast.success(t('warehouse.m29Report.exportToast'));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.m29Report.title')}
        subtitle={t('warehouse.m29Report.subtitle')}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.m29Report.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Download size={16} />} onClick={handleExport}>
            {t('warehouse.m29Report.exportBtn')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={18} />}
          label={t('warehouse.m29Report.metricTotalPlan')}
          value={formatNumber(metrics.totalPlan)}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label={t('warehouse.m29Report.metricTotalFact')}
          value={formatNumber(metrics.totalFact)}
        />
        <MetricCard
          icon={<TrendingDown size={18} />}
          label={t('warehouse.m29Report.metricSavings')}
          value={formatPercent(metrics.savingsPercent)}
          trend={
            metrics.savingsPercent > 0
              ? { direction: 'up', value: t('warehouse.m29Report.trendSaving') }
              : metrics.savingsPercent < 0
                ? { direction: 'down', value: t('warehouse.m29Report.trendOveruse') }
                : { direction: 'neutral', value: t('warehouse.m29Report.trendNeutral') }
          }
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.m29Report.metricOveruseCount')}
          value={metrics.overuseCount}
          trend={
            metrics.overuseCount > 0
              ? { direction: 'down', value: t('warehouse.m29Report.trendNeedAttention') }
              : { direction: 'neutral', value: t('warehouse.m29Report.trendAllNormal') }
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          options={projectOptions}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-56"
        />
        <Select
          options={monthOptions}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
        />
        <Select
          options={yearOptions}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-28"
        />
      </div>

      {/* Table */}
      <DataTable<M29ReportEntry>
        data={entries}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={50}
        emptyTitle={t('warehouse.m29Report.emptyTitle')}
        emptyDescription={t('warehouse.m29Report.emptyDescription')}
      />

      {/* Summary row */}
      {entries.length > 0 && (
        <div className="mt-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('warehouse.m29Report.summaryTotal')}
          </span>
          <div className="flex items-center gap-8">
            <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
              {t('warehouse.m29Report.summaryPlan')}: <strong>{formatNumber(metrics.totalPlan)}</strong>
            </span>
            <span className="text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
              {t('warehouse.m29Report.summaryFact')}: <strong>{formatNumber(metrics.totalFact)}</strong>
            </span>
            <span className={`text-sm tabular-nums font-medium ${metrics.totalFact > metrics.totalPlan ? 'text-danger-600' : 'text-success-600'}`}>
              {t('warehouse.m29Report.summaryVariance')}: {formatNumber(metrics.totalFact - metrics.totalPlan)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default M29ReportPage;
