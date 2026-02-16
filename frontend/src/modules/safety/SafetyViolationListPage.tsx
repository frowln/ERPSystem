import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, AlertOctagon, Clock, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { Button } from '@/design-system/components/Button';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { SafetyViolation } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  open: 'red', in_progress: 'yellow', resolved: 'green', overdue: 'orange', closed: 'gray',
};
const getStatusLabels = (): Record<string, string> => ({
  open: t('safety.violationList.statusOpen'), in_progress: t('safety.violationList.statusInProgress'), resolved: t('safety.violationList.statusResolved'), overdue: t('safety.violationList.statusOverdue'), closed: t('safety.violationList.statusClosed'),
});
const severityColorMap: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  low: 'gray', medium: 'blue', high: 'orange', critical: 'red',
};
const getSeverityLabels = (): Record<string, string> => ({
  low: t('safety.violationList.severityLow'), medium: t('safety.violationList.severityMedium'), high: t('safety.violationList.severityHigh'), critical: t('safety.violationList.severityCritical'),
});

const getSeverityFilterOptions = () => [
  { value: '', label: t('safety.violationList.filterAllLevels') },
  ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
];

type TabId = 'all' | 'OPEN' | 'OVERDUE' | 'RESOLVED' | 'CLOSED';

const SafetyViolationListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const { data: violData, isLoading } = useQuery({
    queryKey: ['safety-violations'],
    queryFn: () => safetyApi.getViolations(),
  });

  const violations = violData?.content ?? [];

  const filteredViolations = useMemo(() => {
    let filtered = violations;
    if (activeTab === 'OPEN') filtered = filtered.filter((v) => ['OPEN', 'IN_PROGRESS'].includes(v.status));
    else if (activeTab === 'OVERDUE') filtered = filtered.filter((v) => v.status === 'OVERDUE');
    else if (activeTab === 'RESOLVED') filtered = filtered.filter((v) => v.status === 'RESOLVED');
    else if (activeTab === 'CLOSED') filtered = filtered.filter((v) => v.status === 'CLOSED');
    if (severityFilter) filtered = filtered.filter((v) => v.severity === severityFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (v) => v.number.toLowerCase().includes(lower) || v.description.toLowerCase().includes(lower) || v.responsibleName.toLowerCase().includes(lower) || v.projectName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [violations, activeTab, severityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: violations.length,
    open: violations.filter((v) => ['OPEN', 'IN_PROGRESS'].includes(v.status)).length,
    overdue: violations.filter((v) => v.status === 'OVERDUE').length,
    resolved: violations.filter((v) => v.status === 'RESOLVED').length,
    closed: violations.filter((v) => v.status === 'CLOSED').length,
  }), [violations]);

  const metrics = useMemo(() => ({
    total: violations.length,
    open: tabCounts.open,
    overdue: tabCounts.overdue,
    critical: violations.filter((v) => v.severity === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(v.status)).length,
  }), [violations, tabCounts]);

  const columns = useMemo<ColumnDef<SafetyViolation, unknown>[]>(() => [
    { accessorKey: 'number', header: '\u2116', size: 100, cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span> },
    {
      accessorKey: 'description', header: t('safety.violationList.columnDescription'), size: 300,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.description}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
        </div>
      ),
    },
    { accessorKey: 'severity', header: t('safety.violationList.columnSeverity'), size: 120, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={severityColorMap} label={getSeverityLabels()[getValue<string>()] ?? getValue<string>()} /> },
    { accessorKey: 'status', header: t('safety.violationList.columnStatus'), size: 120, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={getStatusLabels()[getValue<string>()] ?? getValue<string>()} /> },
    { accessorKey: 'projectName', header: t('safety.violationList.columnProject'), size: 170, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 truncate">{getValue<string>()}</span> },
    { accessorKey: 'responsibleName', header: t('safety.violationList.columnResponsible'), size: 150, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span> },
    {
      accessorKey: 'DEADLINE', header: t('safety.violationList.columnDeadline'), size: 110,
      cell: ({ row }) => {
        const dl = row.original.deadline;
        const isOverdue = dl && new Date(dl) < new Date() && !['RESOLVED', 'CLOSED'].includes(row.original.status);
        return <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>{formatDate(dl)}</span>;
      },
    },
    { accessorKey: 'detectedAt', header: t('safety.violationList.columnDetected'), size: 110, cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span> },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.violationList.title')}
        subtitle={`${violations.length} ${t('safety.violationList.subtitleCount')}`}
        breadcrumbs={[{ label: t('safety.violationList.breadcrumbHome'), href: '/' }, { label: t('safety.violationList.breadcrumbSafety') }, { label: t('safety.violationList.breadcrumbViolations') }]}
        tabs={[
          { id: 'all', label: t('safety.violationList.tabAll'), count: tabCounts.all },
          { id: 'OPEN', label: t('safety.violationList.tabOpen'), count: tabCounts.open },
          { id: 'OVERDUE', label: t('safety.violationList.tabOverdue'), count: tabCounts.overdue },
          { id: 'RESOLVED', label: t('safety.violationList.tabResolved'), count: tabCounts.resolved },
          { id: 'CLOSED', label: t('safety.violationList.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<AlertOctagon size={18} />} label={t('safety.violationList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('safety.violationList.metricOpen')} value={metrics.open} trend={metrics.open > 3 ? { direction: 'down', value: t('safety.violationList.metricRequireResolution') } : undefined} />
        <MetricCard icon={<Timer size={18} />} label={t('safety.violationList.metricOverdue')} value={metrics.overdue} trend={metrics.overdue > 0 ? { direction: 'down', value: t('safety.violationList.metricUrgent') } : { direction: 'neutral', value: t('safety.violationList.metricNone') }} />
        <MetricCard icon={<AlertOctagon size={18} />} label={t('safety.violationList.metricCriticalActive')} value={metrics.critical} trend={metrics.critical > 0 ? { direction: 'down', value: t('safety.violationList.metricCritical') } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('safety.violationList.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getSeverityFilterOptions()} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<SafetyViolation>
        data={filteredViolations}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('safety.violationList.emptyTitle')}
        emptyDescription={t('safety.violationList.emptyDescription')}
      />
    </div>
  );
};

export default SafetyViolationListPage;
