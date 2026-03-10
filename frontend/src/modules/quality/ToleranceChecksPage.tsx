import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ScanLine, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { toleranceApi } from '@/api/tolerance';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ToleranceCheck } from './types';

const checkStatusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'red' | 'orange'> = {
  planned: 'gray',
  in_progress: 'yellow',
  passed: 'green',
  failed: 'red',
  deviation_accepted: 'orange',
};

const getCheckStatusLabels = (): Record<string, string> => ({
  planned: t('quality.toleranceChecks.statusPlanned'),
  in_progress: t('quality.toleranceChecks.statusInProgress'),
  passed: t('quality.toleranceChecks.statusPassed'),
  failed: t('quality.toleranceChecks.statusFailed'),
  deviation_accepted: t('quality.toleranceChecks.statusDeviationAccepted'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('quality.toleranceChecks.filterAllStatuses') },
  { value: 'PLANNED', label: t('quality.toleranceChecks.statusPlanned') },
  { value: 'IN_PROGRESS', label: t('quality.toleranceChecks.statusInProgress') },
  { value: 'PASSED', label: t('quality.toleranceChecks.statusPassed') },
  { value: 'FAILED', label: t('quality.toleranceChecks.statusFailed') },
  { value: 'DEVIATION_ACCEPTED', label: t('quality.toleranceChecks.statusDeviationAccepted') },
];

type TabId = 'all' | 'PLANNED' | 'PASSED' | 'FAILED';

const ToleranceChecksPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: checksData, isLoading } = useQuery({
    queryKey: ['tolerance-checks'],
    queryFn: () => toleranceApi.getChecks(),
  });

  const checks = checksData?.content ?? [];

  const filteredChecks = useMemo(() => {
    let filtered = checks;

    if (activeTab === 'PLANNED') {
      filtered = filtered.filter((c) => c.status === 'PLANNED' || c.status === 'IN_PROGRESS');
    } else if (activeTab === 'PASSED') {
      filtered = filtered.filter((c) => c.status === 'PASSED' || c.status === 'DEVIATION_ACCEPTED');
    } else if (activeTab === 'FAILED') {
      filtered = filtered.filter((c) => c.status === 'FAILED');
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.number.toLowerCase().includes(lower) ||
          c.toleranceRuleName.toLowerCase().includes(lower) ||
          c.toleranceRuleCode.toLowerCase().includes(lower) ||
          (c.location ?? '').toLowerCase().includes(lower) ||
          c.inspectorName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [checks, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: checks.length,
    planned: checks.filter((c) => c.status === 'PLANNED' || c.status === 'IN_PROGRESS').length,
    passed: checks.filter((c) => c.status === 'PASSED' || c.status === 'DEVIATION_ACCEPTED').length,
    failed: checks.filter((c) => c.status === 'FAILED').length,
  }), [checks]);

  const metrics = useMemo(() => {
    const completed = checks.filter((c) => ['PASSED', 'FAILED', 'DEVIATION_ACCEPTED'].includes(c.status));
    const passed = checks.filter((c) => c.status === 'PASSED').length;
    const failed = checks.filter((c) => c.status === 'FAILED').length;
    const passRate = completed.length > 0 ? ((passed / completed.length) * 100).toFixed(1) : '0';
    return { total: checks.length, passed, failed, passRate };
  }, [checks]);

  const columns = useMemo<ColumnDef<ToleranceCheck, unknown>[]>(
    () => {
      const checkStatusLabels = getCheckStatusLabels();
      return [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'toleranceRuleName',
        header: t('quality.toleranceChecks.colToleranceRule'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.toleranceRuleName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.toleranceRuleCode} | {row.original.location ?? row.original.projectName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('quality.toleranceChecks.colStatus'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={checkStatusColorMap}
            label={checkStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'measurement',
        header: t('quality.toleranceChecks.colMeasurement'),
        size: 200,
        cell: ({ row }) => {
          const { measuredValue, nominalValue, deviation, tolerancePlus, toleranceMinus, unitOfMeasure, status } = row.original;
          if (status === 'PLANNED' || status === 'IN_PROGRESS') {
            return <span className="text-neutral-400">---</span>;
          }
          const isOutOfTolerance = deviation > tolerancePlus || deviation < -toleranceMinus;
          return (
            <div className="text-xs font-mono tabular-nums">
              <p className="text-neutral-700 dark:text-neutral-300">
                {t('quality.toleranceChecks.measured')}: <span className="font-medium">{measuredValue}</span> {unitOfMeasure}
              </p>
              <p className={cn(
                'mt-0.5 font-medium',
                isOutOfTolerance ? 'text-danger-600' : 'text-success-600',
              )}>
                {t('quality.toleranceChecks.deviation')}: {deviation > 0 ? '+' : ''}{deviation} {unitOfMeasure}
                {' '}({t('quality.toleranceChecks.tolerance')}: -{toleranceMinus}/+{tolerancePlus})
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'inspectorName',
        header: t('quality.toleranceChecks.colInspector'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'checkDate',
        header: t('quality.toleranceChecks.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
    ];
    },
    [],
  );

  const handleRowClick = useCallback(
    (check: ToleranceCheck) => navigate(`/quality/tolerance-checks/${check.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.toleranceChecks.title')}
        subtitle={t('quality.toleranceChecks.subtitle', { count: String(checks.length) })}
        breadcrumbs={[
          { label: t('quality.toleranceChecks.breadcrumbHome'), href: '/' },
          { label: t('quality.toleranceChecks.breadcrumbQuality') },
          { label: t('quality.toleranceChecks.breadcrumbTolerances'), href: '/quality/tolerance-rules' },
          { label: t('quality.toleranceChecks.breadcrumbChecks') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/quality/tolerance-checks/new')}>
            {t('quality.toleranceChecks.btnNewCheck')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('quality.toleranceChecks.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('quality.toleranceChecks.tabInProgress'), count: tabCounts.planned },
          { id: 'PASSED', label: t('quality.toleranceChecks.tabPassed'), count: tabCounts.passed },
          { id: 'FAILED', label: t('quality.toleranceChecks.tabFailed'), count: tabCounts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ScanLine size={18} />}
          label={t('quality.toleranceChecks.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('quality.toleranceChecks.metricPassed')}
          value={metrics.passed}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('quality.toleranceChecks.metricFailed')}
          value={metrics.failed}
          trend={metrics.failed > 0 ? { direction: 'down', value: t('quality.toleranceChecks.trendNeedFix') } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('quality.toleranceChecks.metricPassRate')}
          value={`${metrics.passRate}%`}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.toleranceChecks.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<ToleranceCheck>
        data={filteredChecks}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.toleranceChecks.emptyTitle')}
        emptyDescription={t('quality.toleranceChecks.emptyDescription')}
      />
    </div>
  );
};

export default ToleranceChecksPage;
