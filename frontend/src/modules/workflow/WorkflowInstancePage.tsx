import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { workflowApi } from '@/api/workflow';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import type { AutomationExecution, ExecutionStatus } from './types';

const executionStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  COMPLETED: 'green',
  FAILED: 'red',
  SKIPPED: 'gray',
  PENDING: 'yellow',
  RUNNING: 'blue',
};

const getExecutionStatusLabels = (): Record<string, string> => ({
  COMPLETED: t('workflow.execStatusSuccess'),
  FAILED: t('workflow.execStatusFailure'),
  SKIPPED: t('workflow.execStatusSkipped'),
  PENDING: t('workflow.execStatusPending'),
  RUNNING: t('workflow.execStatusRunning'),
});

type TabId = 'all' | 'COMPLETED' | 'FAILED' | 'PENDING';

const WorkflowInstancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => workflowApi.getExecutions(),
  });

  const executions = data?.content ?? [];

  const executionStatusLabels = getExecutionStatusLabels();

  const filtered = useMemo(() => {
    let result = executions;
    if (activeTab === 'COMPLETED') result = result.filter((e) => e.executionStatus === 'COMPLETED');
    else if (activeTab === 'FAILED') result = result.filter((e) => e.executionStatus === 'FAILED');
    else if (activeTab === 'PENDING') result = result.filter((e) => e.executionStatus === 'PENDING');

    if (statusFilter) result = result.filter((e) => e.executionStatus === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) =>
          (e.entityType ?? '').toLowerCase().includes(lower) ||
          (e.entityId ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [executions, activeTab, statusFilter, search]);

  const counts = useMemo(() => ({
    all: executions.length,
    completed: executions.filter((e) => e.executionStatus === 'COMPLETED').length,
    failed: executions.filter((e) => e.executionStatus === 'FAILED').length,
    pending: executions.filter((e) => e.executionStatus === 'PENDING').length,
  }), [executions]);

  const avgDuration = useMemo(() => {
    const completed = executions.filter((e) => e.startedAt && e.completedAt);
    if (completed.length === 0) return 0;
    return completed.reduce((sum, e) => {
      const start = new Date(e.startedAt).getTime();
      const end = new Date(e.completedAt!).getTime();
      return sum + (end - start);
    }, 0) / completed.length;
  }, [executions]);

  const columns = useMemo<ColumnDef<AutomationExecution, unknown>[]>(
    () => [
      {
        accessorKey: 'entityType',
        header: t('workflow.colEntityType'),
        size: 160,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.entityType}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[140px]">ID: {row.original.entityId}</p>
          </div>
        ),
      },
      {
        accessorKey: 'executionStatus',
        header: t('workflow.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={executionStatusColorMap}
            label={executionStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'duration',
        header: t('workflow.colDuration'),
        size: 100,
        cell: ({ row }) => {
          const e = row.original;
          if (!e.startedAt || !e.completedAt) return <span className="text-neutral-400">---</span>;
          const ms = new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime();
          return <span className="font-mono text-xs tabular-nums">{ms} {t('workflow.msAbbrev')}</span>;
        },
      },
      {
        accessorKey: 'startedAt',
        header: t('workflow.colStartedAt'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{getValue<string>() ? formatDateTime(getValue<string>()) : '---'}</span>
        ),
      },
      {
        accessorKey: 'errorMessage',
        header: t('workflow.colError'),
        size: 200,
        cell: ({ getValue }) => {
          const err = getValue<string | undefined>();
          return err ? <span className="text-danger-600 text-xs truncate max-w-[190px] block">{err}</span> : <span className="text-neutral-400">---</span>;
        },
      },
    ],
    [executionStatusLabels],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('workflow.executionsTitle')}
        subtitle={t('workflow.executionsCount', { count: executions.length })}
        breadcrumbs={[
          { label: t('workflow.breadcrumbHome'), href: '/' },
          { label: t('workflow.breadcrumbWorkflows'), href: '/workflow/templates' },
          { label: t('workflow.breadcrumbExecutions') },
        ]}
        tabs={[
          { id: 'all', label: t('workflow.tabAll'), count: counts.all },
          { id: 'COMPLETED', label: t('workflow.tabSuccess'), count: counts.completed },
          { id: 'FAILED', label: t('workflow.tabFailure'), count: counts.failed },
          { id: 'PENDING', label: t('workflow.tabPending'), count: counts.pending },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Activity size={18} />} label={t('workflow.metricTotalExecutions')} value={counts.all} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('workflow.tabSuccess')} value={counts.completed} trend={{ direction: 'up', value: `${((counts.completed / Math.max(counts.all, 1)) * 100).toFixed(0)}%` }} />
        <MetricCard icon={<XCircle size={18} />} label={t('workflow.tabFailure')} value={counts.failed} trend={{ direction: counts.failed > 0 ? 'down' : 'neutral', value: counts.failed > 0 ? t('workflow.needAttention') : t('workflow.noErrors') }} />
        <MetricCard icon={<Clock size={18} />} label={t('workflow.metricAvgTime')} value={`${avgDuration.toFixed(0)} ${t('workflow.msAbbrev')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('workflow.searchExecutionPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('workflow.filterAllStatuses') },
            ...Object.entries(executionStatusLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<AutomationExecution>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('workflow.emptyExecutionsTitle')}
        emptyDescription={t('workflow.emptyExecutionsDescription')}
      />
    </div>
  );
};

export default WorkflowInstancePage;
