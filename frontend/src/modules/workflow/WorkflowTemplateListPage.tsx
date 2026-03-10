import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, GitBranch, Zap, PlayCircle, PauseCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { workflowApi } from '@/api/workflow';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { WorkflowDefinition } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('workflow.statusActive'),
  INACTIVE: t('workflow.statusInactive'),
});

const getEntityTypeLabels = (): Record<string, string> => ({
  CONTRACT: t('workflow.entityContract'),
  DOCUMENT: t('workflow.entityDocument'),
  PURCHASE_REQUEST: t('workflow.entityPurchaseRequest'),
  INVOICE: t('workflow.entityInvoice'),
  BUDGET: t('workflow.entityBudget'),
  CHANGE_ORDER: t('workflow.entityChangeOrder'),
});

function deriveStatus(wf: WorkflowDefinition): string {
  return wf.isActive ? 'ACTIVE' : 'INACTIVE';
}

type TabId = 'all' | 'ACTIVE' | 'INACTIVE';

const WorkflowTemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowApi.getWorkflows(),
  });

  const workflows = data?.content ?? [];

  const statusLabels = getStatusLabels();
  const entityTypeLabels = getEntityTypeLabels();

  const filtered = useMemo(() => {
    let result = workflows;
    if (activeTab === 'ACTIVE') result = result.filter((w) => w.isActive);
    else if (activeTab === 'INACTIVE') result = result.filter((w) => !w.isActive);

    if (entityFilter) result = result.filter((w) => w.entityType === entityFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(lower) ||
          (w.description ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [workflows, activeTab, entityFilter, search]);

  const counts = useMemo(() => ({
    all: workflows.length,
    active: workflows.filter((w) => w.isActive).length,
    inactive: workflows.filter((w) => !w.isActive).length,
  }), [workflows]);

  const columns = useMemo<ColumnDef<WorkflowDefinition, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('workflow.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[260px]">{row.original.description ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'entityType',
        header: t('workflow.colEntityType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{entityTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        id: 'status',
        header: t('workflow.colStatus'),
        size: 130,
        cell: ({ row }) => {
          const status = deriveStatus(row.original);
          return (
            <StatusBadge
              status={status}
              colorMap={statusColorMap}
              label={statusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: t('workflow.colUpdated'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/workflow/designer/${row.original.id}`); }}
          >
            {t('common.open')}
          </Button>
        ),
      },
    ],
    [navigate, statusLabels, entityTypeLabels],
  );

  const handleRowClick = useCallback(
    (wf: WorkflowDefinition) => navigate(`/workflow/designer/${wf.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('workflow.title')}
        subtitle={t('workflow.templatesCount', { count: workflows.length })}
        breadcrumbs={[
          { label: t('workflow.breadcrumbHome'), href: '/' },
          { label: t('workflow.breadcrumbWorkflows') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/workflow/designer')}>
            {t('workflow.newProcess')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('workflow.tabAll'), count: counts.all },
          { id: 'ACTIVE', label: t('workflow.tabActive'), count: counts.active },
          { id: 'INACTIVE', label: t('workflow.tabInactive'), count: counts.inactive },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<GitBranch size={18} />} label={t('workflow.metricTotalProcesses')} value={counts.all} />
        <MetricCard icon={<PlayCircle size={18} />} label={t('workflow.tabActive')} value={counts.active} />
        <MetricCard icon={<PauseCircle size={18} />} label={t('workflow.tabInactive')} value={counts.inactive} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('workflow.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('workflow.filterAllEntityTypes') },
            ...Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<WorkflowDefinition>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('workflow.emptyTitle')}
        emptyDescription={t('workflow.emptyDescription')}
      />
    </div>
  );
};

export default WorkflowTemplateListPage;
