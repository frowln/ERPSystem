import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { QualityChecklistEntry, ChecklistExecutionStatusType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  DRAFT: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'yellow',
};

const getStatusLabels = (): Record<string, string> => ({
  DRAFT: t('quality.checklists.statusDraft'),
  IN_PROGRESS: t('quality.checklists.statusInProgress'),
  COMPLETED: t('quality.checklists.statusCompleted'),
  CANCELLED: t('quality.checklists.statusCancelled'),
});

const getWorkTypeLabels = (): Record<string, string> => ({
  CONCRETING: t('quality.checklists.wtConcreting'),
  STEEL_INSTALLATION: t('quality.checklists.wtSteelInstallation'),
  WELDING: t('quality.checklists.wtWelding'),
  WATERPROOFING: t('quality.checklists.wtWaterproofing'),
  FINISHING: t('quality.checklists.wtFinishing'),
  EARTHWORKS: t('quality.checklists.wtEarthworks'),
  ROOFING: t('quality.checklists.wtRoofing'),
  PLUMBING: t('quality.checklists.wtPlumbing'),
  ELECTRICAL: t('quality.checklists.wtElectrical'),
  HVAC: t('quality.checklists.wtHvac'),
  FACADE: t('quality.checklists.wtFacade'),
  LANDSCAPING: t('quality.checklists.wtLandscaping'),
  OTHER: t('quality.checklists.wtOther'),
});

type TabId = 'all' | 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

const QualityChecklistListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');

  const { data: checklistsData, isLoading } = useQuery({
    queryKey: ['quality-checklists'],
    queryFn: () => qualityApi.getChecklists({ size: 200 }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await qualityApi.deleteChecklist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklists'] });
      toast.success(t('quality.checklists.toastDeleted'));
    },
    onError: () => toast.error(t('quality.checklists.toastDeleteError')),
  });

  const checklists = checklistsData?.content ?? [];

  const filteredChecklists = useMemo(() => {
    let filtered = checklists;
    if (activeTab !== 'all') filtered = filtered.filter(c => c.status === activeTab);
    if (workTypeFilter) filtered = filtered.filter(c => c.workType === workTypeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        (c.code ?? '').toLowerCase().includes(lower) ||
        (c.wbsStage ?? '').toLowerCase().includes(lower) ||
        (c.inspectorName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [checklists, activeTab, workTypeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: checklists.length,
    draft: checklists.filter(c => c.status === 'DRAFT').length,
    in_progress: checklists.filter(c => c.status === 'IN_PROGRESS').length,
    completed: checklists.filter(c => c.status === 'COMPLETED').length,
  }), [checklists]);

  const metrics = useMemo(() => {
    const total = checklists.length;
    const completed = checklists.filter(c => c.status === 'COMPLETED').length;
    const totalItems = checklists.reduce((sum, c) => sum + (c.totalItems ?? 0), 0);
    const passedItems = checklists.reduce((sum, c) => sum + (c.passedItems ?? 0), 0);
    const failedItems = checklists.reduce((sum, c) => sum + (c.failedItems ?? 0), 0);
    const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
    return { total, completed, passRate, failedItems };
  }, [checklists]);

  const columns = useMemo<ColumnDef<QualityChecklistEntry, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    const workTypeLabels = getWorkTypeLabels();
    return [
      {
        accessorKey: 'code',
        header: t('quality.checklists.colCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('quality.checklists.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.wbsStage && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.wbsStage}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'workType',
        header: t('quality.checklists.colWorkType'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {workTypeLabels[getValue<string>()] ?? getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('quality.checklists.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()]}
          />
        ),
      },
      {
        id: 'progress',
        header: t('quality.checklists.colProgress'),
        size: 160,
        cell: ({ row }) => {
          const totalItems = row.original.totalItems ?? 0;
          const passedItems = row.original.passedItems ?? 0;
          const failedItems = row.original.failedItems ?? 0;
          const naItems = row.original.naItems ?? 0;
          const checked = passedItems + failedItems + naItems;
          const pct = totalItems > 0 ? Math.round((checked / totalItems) * 100) : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${(failedItems) > 0 ? 'bg-danger-500' : 'bg-success-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400 w-10 text-right">
                {checked}/{totalItems}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'inspectorName',
        header: t('quality.checklists.colInspector'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>() || '—'}</span>
        ),
      },
      {
        accessorKey: 'scheduledDate',
        header: t('quality.checklists.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs">{getValue<string>() ? formatDate(getValue<string>()) : '—'}</span>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.checklists.title')}
        subtitle={t('quality.checklists.subtitle', { count: String(checklists.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.list.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.checklists.breadcrumbChecklists') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/quality/checklists/new')}>
            {t('quality.checklists.btnNew')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('quality.checklists.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('quality.checklists.tabDraft'), count: tabCounts.draft },
          { id: 'IN_PROGRESS', label: t('quality.checklists.tabInProgress'), count: tabCounts.in_progress },
          { id: 'COMPLETED', label: t('quality.checklists.tabCompleted'), count: tabCounts.completed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={16} />}
          label={t('quality.checklists.metricTotal')}
          value={metrics.total}
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('quality.checklists.metricCompleted')}
          value={metrics.completed}
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('quality.checklists.metricPassRate')}
          value={`${metrics.passRate}%`}
          loading={isLoading}
        />
        <MetricCard
          icon={<XCircle size={16} />}
          label={t('quality.checklists.metricFailed')}
          value={metrics.failedItems}
          subtitle={metrics.failedItems > 0 ? t('quality.checklists.trendNeedAttention') : undefined}
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.checklists.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.checklists.filterAllWorkTypes') },
            ...Object.entries(getWorkTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {/* Table */}
      <DataTable<QualityChecklistEntry>
        data={filteredChecklists}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        onRowClick={(row) => navigate(`/quality/checklists/${row.id}`)}
        bulkActions={[
          {
            label: t('quality.checklists.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map(r => r.id);
              const ok = await confirm({
                title: t('quality.checklists.confirmDeleteTitle', { count: String(ids.length) }),
                description: t('quality.checklists.confirmDeleteDescription'),
                confirmLabel: t('quality.checklists.confirmDeleteBtn'),
                cancelLabel: t('common.cancel'),
              });
              if (!ok) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('quality.checklists.emptyTitle')}
        emptyDescription={t('quality.checklists.emptyDescription')}
      />
    </div>
  );
};

export default QualityChecklistListPage;
