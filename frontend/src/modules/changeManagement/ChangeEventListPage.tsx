import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  changeEventStatusColorMap,
  changeEventStatusLabels,
  changeEventSourceColorMap,
  changeEventSourceLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { changeManagementApi } from '@/api/changeManagement';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { ChangeEvent } from './types';

type TabId = 'all' | 'IDENTIFIED' | 'EVALUATING' | 'PENDING_APPROVAL' | 'APPROVED';

const getStatusFilterOptions = () => [
  { value: '', label: t('changeManagement.eventList.filterAllStatuses') },
  { value: 'IDENTIFIED', label: t('changeManagement.eventList.filterIdentified') },
  { value: 'EVALUATING', label: t('changeManagement.eventList.filterEvaluating') },
  { value: 'PENDING_APPROVAL', label: t('changeManagement.eventList.filterPendingApproval') },
  { value: 'APPROVED', label: t('changeManagement.eventList.filterApproved') },
  { value: 'REJECTED', label: t('changeManagement.eventList.filterRejected') },
];

const getSourceFilterOptions = () => [
  { value: '', label: t('changeManagement.eventList.filterAllSources') },
  { value: 'RFI', label: 'RFI' },
  { value: 'ISSUE', label: t('changeManagement.eventList.filterIssue') },
  { value: 'DESIGN_CHANGE', label: t('changeManagement.eventList.filterDesignChange') },
  { value: 'OWNER_REQUEST', label: t('changeManagement.eventList.filterOwnerRequest') },
  { value: 'FIELD_CONDITION', label: t('changeManagement.eventList.filterFieldCondition') },
  { value: 'REGULATORY', label: t('changeManagement.eventList.filterRegulatory') },
];

const ChangeEventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const { data: eventData, isLoading } = useQuery({
    queryKey: ['change-events'],
    queryFn: () => changeManagementApi.getChangeEvents(),
  });

  const events = eventData?.content ?? [];

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeTab !== 'all') {
      filtered = filtered.filter((e) => e.status === activeTab);
    }
    if (sourceFilter) {
      filtered = filtered.filter((e) => e.source === sourceFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.number.toLowerCase().includes(lower) ||
          e.title.toLowerCase().includes(lower) ||
          e.requestedByName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [events, activeTab, sourceFilter, search]);

  const tabCounts = useMemo(() => ({
    all: events.length,
    identified: events.filter((e) => e.status === 'IDENTIFIED').length,
    evaluating: events.filter((e) => e.status === 'EVALUATING').length,
    pending_approval: events.filter((e) => e.status === 'PENDING_APPROVAL').length,
    approved: events.filter((e) => e.status === 'APPROVED').length,
  }), [events]);

  const metrics = useMemo(() => {
    const totalImpact = events.reduce((s, e) => s + e.costImpact, 0);
    const approvedImpact = events.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + e.costImpact, 0);
    const avgScheduleImpact = events.length > 0
      ? Math.round(events.reduce((s, e) => s + e.scheduleImpactDays, 0) / events.length)
      : 0;
    return { total: events.length, totalImpact, approvedImpact, avgScheduleImpact };
  }, [events]);

  const columns = useMemo<ColumnDef<ChangeEvent, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('changeManagement.eventList.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('changeManagement.eventList.colTitle'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('changeManagement.eventList.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={changeEventStatusColorMap}
            label={changeEventStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'source',
        header: t('changeManagement.eventList.colSource'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={changeEventSourceColorMap}
            label={changeEventSourceLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'costImpact',
        header: t('changeManagement.eventList.colCostImpact'),
        size: 170,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={`tabular-nums text-sm font-medium ${val > 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {val > 0 ? `+${formatMoneyCompact(val)}` : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'scheduleImpactDays',
        header: t('changeManagement.eventList.colScheduleImpact'),
        size: 140,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return (
            <span className={`tabular-nums text-sm ${days > 0 ? 'text-warning-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {days > 0 ? `+${days} ${t('changeManagement.eventList.days')}` : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'requestedByName',
        header: t('changeManagement.eventList.colInitiator'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('changeManagement.eventList.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (event: ChangeEvent) => navigate(`/change-management/events/${event.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('changeManagement.eventList.title')}
        subtitle={`${events.length} ${t('changeManagement.eventList.subtitleEvents')}`}
        breadcrumbs={[
          { label: t('changeManagement.eventList.breadcrumbHome'), href: '/' },
          { label: t('changeManagement.eventList.breadcrumbChangeManagement') },
          { label: t('changeManagement.eventList.breadcrumbEvents') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/change-management/events/new')}>
            {t('changeManagement.eventList.newEvent')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('changeManagement.eventList.tabAll'), count: tabCounts.all },
          { id: 'IDENTIFIED', label: t('changeManagement.eventList.tabIdentified'), count: tabCounts.identified },
          { id: 'EVALUATING', label: t('changeManagement.eventList.tabEvaluating'), count: tabCounts.evaluating },
          { id: 'PENDING_APPROVAL', label: t('changeManagement.eventList.tabPendingApproval'), count: tabCounts.pending_approval },
          { id: 'APPROVED', label: t('changeManagement.eventList.tabApproved'), count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<AlertTriangle size={18} />} label={t('changeManagement.eventList.metricTotal')} value={metrics.total} />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('changeManagement.eventList.metricTotalImpact')}
          value={formatMoneyCompact(metrics.totalImpact)}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('changeManagement.eventList.metricApproved')}
          value={formatMoneyCompact(metrics.approvedImpact)}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('changeManagement.eventList.metricAvgScheduleImpact')}
          value={`${metrics.avgScheduleImpact} ${t('changeManagement.eventList.days')}`}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('changeManagement.eventList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getSourceFilterOptions()}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<ChangeEvent>
        data={filteredEvents}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('changeManagement.eventList.emptyTitle')}
        emptyDescription={t('changeManagement.eventList.emptyDescription')}
      />
    </div>
  );
};

export default ChangeEventListPage;
