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
  SUCCESS: 'green',
  FAILURE: 'red',
  SKIPPED: 'gray',
  PENDING: 'yellow',
};

const getExecutionStatusLabels = (): Record<string, string> => ({
  SUCCESS: t('workflow.execStatusSuccess'),
  FAILURE: t('workflow.execStatusFailure'),
  SKIPPED: t('workflow.execStatusSkipped'),
  PENDING: t('workflow.execStatusPending'),
});

const getTriggerTypeLabels = (): Record<string, string> => ({
  STATUS_CHANGE: t('workflow.triggerStatusChange'),
  FIELD_UPDATE: t('workflow.triggerFieldUpdate'),
  TIME_BASED: t('workflow.triggerTimeBased'),
  APPROVAL: t('workflow.triggerApproval'),
  CREATION: t('workflow.triggerCreation'),
});

const getActionTypeLabels = (): Record<string, string> => ({
  SEND_NOTIFICATION: t('workflow.actionNotification'),
  ASSIGN_ROLE: t('workflow.actionAssignRole'),
  UPDATE_STATUS: t('workflow.actionUpdateStatus'),
  CREATE_TASK: t('workflow.actionCreateTask'),
  SEND_EMAIL: t('workflow.actionSendEmail'),
  WEBHOOK: 'Webhook',
});

type TabId = 'all' | 'SUCCESS' | 'failure' | 'PENDING';

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
  const triggerTypeLabels = getTriggerTypeLabels();
  const actionTypeLabels = getActionTypeLabels();

  const filtered = useMemo(() => {
    let result = executions;
    if (activeTab === 'SUCCESS') result = result.filter((e) => e.status === 'SUCCESS');
    else if (activeTab === 'failure') result = result.filter((e) => e.status === 'FAILURE');
    else if (activeTab === 'PENDING') result = result.filter((e) => e.status === 'PENDING');

    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.ruleName.toLowerCase().includes(lower) ||
          e.entityId.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [executions, activeTab, statusFilter, search]);

  const counts = useMemo(() => ({
    all: executions.length,
    success: executions.filter((e) => e.status === 'SUCCESS').length,
    failure: executions.filter((e) => e.status === 'FAILURE').length,
    pending: executions.filter((e) => e.status === 'PENDING').length,
  }), [executions]);

  const avgDuration = useMemo(() => {
    const completed = executions.filter((e) => e.durationMs);
    if (completed.length === 0) return 0;
    return completed.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / completed.length;
  }, [executions]);

  const columns = useMemo<ColumnDef<AutomationExecution, unknown>[]>(
    () => [
      {
        accessorKey: 'ruleName',
        header: t('workflow.colRule'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.ruleName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">ID: {row.original.entityId}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
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
        accessorKey: 'triggerType',
        header: t('workflow.colTrigger'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{triggerTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'actionType',
        header: t('workflow.colAction'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{actionTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'durationMs',
        header: t('workflow.colDuration'),
        size: 100,
        cell: ({ getValue }) => {
          const ms = getValue<number | undefined>();
          return <span className="font-mono text-xs tabular-nums">{ms != null ? `${ms} ${t('workflow.msAbbrev')}` : '---'}</span>;
        },
      },
      {
        accessorKey: 'startedAt',
        header: t('workflow.colStartedAt'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDateTime(getValue<string>())}</span>
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
    [executionStatusLabels, triggerTypeLabels, actionTypeLabels],
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
          { id: 'SUCCESS', label: t('workflow.tabSuccess'), count: counts.success },
          { id: 'failure', label: t('workflow.tabFailure'), count: counts.failure },
          { id: 'PENDING', label: t('workflow.tabPending'), count: counts.pending },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Activity size={18} />} label={t('workflow.metricTotalExecutions')} value={counts.all} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('workflow.tabSuccess')} value={counts.success} trend={{ direction: 'up', value: `${((counts.success / Math.max(counts.all, 1)) * 100).toFixed(0)}%` }} />
        <MetricCard icon={<XCircle size={18} />} label={t('workflow.tabFailure')} value={counts.failure} trend={{ direction: counts.failure > 0 ? 'down' : 'neutral', value: counts.failure > 0 ? t('workflow.needAttention') : t('workflow.noErrors') }} />
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
