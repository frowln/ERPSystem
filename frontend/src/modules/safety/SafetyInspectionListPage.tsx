import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ClipboardCheck, AlertTriangle, CheckCircle, Star, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { SafetyInspection } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  scheduled: 'blue', in_progress: 'yellow', completed: 'green', failed: 'red', cancelled: 'gray',
};
const getStatusLabels = (): Record<string, string> => ({
  scheduled: t('safety.inspectionList.statusScheduled'), in_progress: t('safety.inspectionList.statusInProgress'), completed: t('safety.inspectionList.statusCompleted'), failed: t('safety.inspectionList.statusFailed'), cancelled: t('safety.inspectionList.statusCancelled'),
});
const getTypeLabels = (): Record<string, string> => ({
  routine: t('safety.inspectionList.typeRoutine'), unscheduled: t('safety.inspectionList.typeUnscheduled'), follow_up: t('safety.inspectionList.typeFollowUp'), pre_work: t('safety.inspectionList.typePreWork'), regulatory: t('safety.inspectionList.typeRegulatory'),
});
const ratingColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  satisfactory: 'green', needs_improvement: 'yellow', unsatisfactory: 'orange', critical: 'red',
};
const getRatingLabels = (): Record<string, string> => ({
  satisfactory: t('safety.inspectionList.ratingSatisfactory'), needs_improvement: t('safety.inspectionList.ratingNeedsImprovement'), unsatisfactory: t('safety.inspectionList.ratingUnsatisfactory'), critical: t('safety.inspectionList.ratingCritical'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('safety.inspectionList.filterAllStatuses') },
  ...Object.entries(getStatusLabels()).map(([v, l]) => ({ value: v, label: l })),
];

const getTypeFilterOptions = () => [
  { value: '', label: t('safety.inspectionList.filterAllTypes') },
  ...Object.entries(getTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
];

type TabId = 'all' | 'SCHEDULED' | 'COMPLETED' | 'FAILED';

const SafetyInspectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: inspData, isLoading } = useQuery({
    queryKey: ['safety-inspections'],
    queryFn: () => safetyApi.getInspections(),
  });

  const inspections = inspData?.content ?? [];

  const filteredInspections = useMemo(() => {
    let filtered = inspections;
    if (activeTab === 'SCHEDULED') filtered = filtered.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));
    else if (activeTab === 'COMPLETED') filtered = filtered.filter((i) => i.status === 'COMPLETED');
    else if (activeTab === 'FAILED') filtered = filtered.filter((i) => i.status === 'FAILED');
    if (typeFilter) filtered = filtered.filter((i) => i.inspectionType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.number.toLowerCase().includes(lower) || i.projectName.toLowerCase().includes(lower) || i.inspectorName.toLowerCase().includes(lower) || i.location.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [inspections, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: inspections.length,
    scheduled: inspections.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length,
    completed: inspections.filter((i) => i.status === 'COMPLETED').length,
    failed: inspections.filter((i) => i.status === 'FAILED').length,
  }), [inspections]);

  const metrics = useMemo(() => {
    const completed = inspections.filter((i) => i.status === 'COMPLETED');
    const avgScore = completed.length > 0 ? completed.reduce((s, i) => s + i.score, 0) / completed.length : 0;
    const totalViolations = inspections.reduce((s, i) => s + i.violationCount, 0);
    return { total: inspections.length, avgScore, totalViolations, failedCount: inspections.filter((i) => i.status === 'FAILED').length };
  }, [inspections]);

  const columns = useMemo<ColumnDef<SafetyInspection, unknown>[]>(() => [
    { accessorKey: 'number', header: '\u2116', size: 100, cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span> },
    {
      accessorKey: 'inspectionDate', header: t('safety.inspectionList.columnDate'), size: 110,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'projectName', header: t('safety.inspectionList.columnProjectLocation'), size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.projectName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
        </div>
      ),
    },
    {
      accessorKey: 'inspectionType', header: t('safety.inspectionList.columnType'), size: 130,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{getTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status', header: t('safety.inspectionList.columnStatus'), size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={getStatusLabels()[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'rating', header: t('safety.inspectionList.columnRating'), size: 160,
      cell: ({ getValue }) => {
        const val = getValue<string>();
        if (!val) return <span className="text-neutral-400">---</span>;
        return <StatusBadge status={val} colorMap={ratingColorMap} label={getRatingLabels()[val] ?? val} />;
      },
    },
    {
      accessorKey: 'score', header: t('safety.inspectionList.columnScore'), size: 80,
      cell: ({ getValue }) => {
        const s = getValue<number>();
        if (s === 0) return <span className="text-neutral-400">---</span>;
        return <span className={`font-semibold tabular-nums ${s >= 80 ? 'text-success-600' : s >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>{s}</span>;
      },
    },
    { accessorKey: 'inspectorName', header: t('safety.inspectionList.columnInspector'), size: 150, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    { accessorKey: 'violationCount', header: t('safety.inspectionList.columnViolations'), size: 100, cell: ({ getValue }) => { const v = getValue<number>(); return <span className={v > 0 ? 'text-danger-600 font-medium tabular-nums' : 'text-neutral-500 dark:text-neutral-400 tabular-nums'}>{v}</span>; } },
    {
      id: 'actions', header: '', size: 80,
      cell: ({ row }) => <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); navigate(`/safety/inspections/${row.original.id}`); }}>{t('safety.inspectionList.actionOpen')}</Button>,
    },
  ], [navigate]);

  const handleRowClick = useCallback(
    (insp: SafetyInspection) => navigate(`/safety/inspections/${insp.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.inspectionList.title')}
        subtitle={`${inspections.length} ${t('safety.inspectionList.subtitleCount')}`}
        breadcrumbs={[{ label: t('safety.inspectionList.breadcrumbHome'), href: '/' }, { label: t('safety.inspectionList.breadcrumbSafety'), href: '/safety/inspections' }, { label: t('safety.inspectionList.breadcrumbInspections') }]}
        tabs={[
          { id: 'all', label: t('safety.inspectionList.tabAll'), count: tabCounts.all },
          { id: 'SCHEDULED', label: t('safety.inspectionList.tabScheduled'), count: tabCounts.scheduled },
          { id: 'COMPLETED', label: t('safety.inspectionList.tabCompleted'), count: tabCounts.completed },
          { id: 'FAILED', label: t('safety.inspectionList.tabFailed'), count: tabCounts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('safety.inspectionList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Star size={18} />} label={t('safety.inspectionList.metricAvgScore')} value={metrics.avgScore.toFixed(0)} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('safety.inspectionList.metricViolations')} value={metrics.totalViolations} trend={metrics.totalViolations > 5 ? { direction: 'down', value: t('safety.inspectionList.metricRequireAttention') } : undefined} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('safety.inspectionList.metricFailed')} value={metrics.failedCount} trend={metrics.failedCount > 0 ? { direction: 'down', value: t('safety.inspectionList.metricCritical') } : { direction: 'neutral', value: t('safety.inspectionList.metricNone') }} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('safety.inspectionList.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<SafetyInspection>
        data={filteredInspections}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('safety.inspectionList.emptyTitle')}
        emptyDescription={t('safety.inspectionList.emptyDescription')}
      />
    </div>
  );
};

export default SafetyInspectionListPage;
