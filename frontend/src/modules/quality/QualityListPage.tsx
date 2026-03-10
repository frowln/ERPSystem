import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardCheck, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { qualityApi, type QualityCheck } from '@/api/quality';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

// ---- Status maps ----
const checkStatusColorMap: Record<string, 'yellow' | 'blue' | 'green' | 'gray'> = {
  planned: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
};
const getCheckStatusLabels = (): Record<string, string> => ({
  planned: t('quality.list.statusPlanned'),
  in_progress: t('quality.list.statusInProgress'),
  completed: t('quality.list.statusCompleted'),
  cancelled: t('quality.list.statusCancelled'),
});
const checkResultColorMap: Record<string, 'green' | 'red' | 'yellow' | 'gray'> = {
  passed: 'green',
  failed: 'red',
  conditional: 'yellow',
  pending: 'gray',
};
const getCheckResultLabels = (): Record<string, string> => ({
  passed: t('quality.list.resultPassed'),
  failed: t('quality.list.resultFailed'),
  conditional: t('quality.list.resultConditional'),
  pending: t('quality.list.resultPending'),
});
const getCheckTypeLabels = (): Record<string, string> => ({
  incoming: t('quality.list.typeIncoming'),
  in_process: t('quality.list.typeInProcess'),
  final: t('quality.list.typeFinal'),
  audit: t('quality.list.typeAudit'),
});

type TabId = 'all' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

const QualityListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const deleteCheckMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await qualityApi.deleteCheck(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checks'] });
      toast.success(t('quality.list.toastDeleted'));
    },
    onError: () => {
      toast.error(t('quality.list.toastDeleteError'));
    },
  });

  const { data: checksData, isLoading } = useQuery({
    queryKey: ['quality-checks'],
    queryFn: () => qualityApi.getChecks(),
  });

  const checks = checksData?.content ?? [];

  const filteredChecks = useMemo(() => {
    let filtered = checks;
    if (activeTab !== 'all') filtered = filtered.filter((c) => c.status === activeTab);
    if (typeFilter) filtered = filtered.filter((c) => c.type === typeFilter);
    if (resultFilter) filtered = filtered.filter((c) => c.result === resultFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.number.toLowerCase().includes(lower) ||
          c.projectName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [checks, activeTab, typeFilter, resultFilter, search]);

  const tabCounts = useMemo(() => ({
    all: checks.length,
    planned: checks.filter((c) => c.status === 'PLANNED').length,
    in_progress: checks.filter((c) => c.status === 'IN_PROGRESS').length,
    completed: checks.filter((c) => c.status === 'COMPLETED').length,
  }), [checks]);

  const columns = useMemo<ColumnDef<QualityCheck, unknown>[]>(() => {
    const checkTypeLabels = getCheckTypeLabels();
    const checkStatusLabels = getCheckStatusLabels();
    const checkResultLabels = getCheckResultLabels();
    return [
    {
      accessorKey: 'number',
      header: t('quality.list.colNumber'),
      size: 90,
      cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name',
      header: t('quality.list.colName'),
      size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('quality.list.colType'),
      size: 140,
      cell: ({ getValue }) => <span className="text-neutral-600">{checkTypeLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: t('quality.list.colStatus'),
      size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={checkStatusColorMap} label={checkStatusLabels[getValue<string>()]} />,
    },
    {
      accessorKey: 'result',
      header: t('quality.list.colResult'),
      size: 140,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={checkResultColorMap} label={checkResultLabels[getValue<string>()]} />,
    },
    {
      accessorKey: 'inspectorName',
      header: t('quality.list.colInspector'),
      size: 150,
    },
    {
      accessorKey: 'scheduledDate',
      header: t('quality.list.colDate'),
      size: 110,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'nonConformanceCount',
      header: t('quality.list.colNonConformances'),
      size: 120,
      cell: ({ getValue }) => {
        const count = getValue<number>();
        return count > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600">
            <AlertTriangle size={12} />
            {count}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">0</span>
        );
      },
    },
  ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.list.title')}
        subtitle={t('quality.list.subtitle', { count: String(checks.length) })}
        breadcrumbs={[
          { label: t('quality.list.breadcrumbHome'), href: '/' },
          { label: t('quality.list.breadcrumbQuality') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" iconLeft={<AlertTriangle size={16} />} onClick={() => navigate('/quality/non-conformances')}>
              {t('quality.list.btnNonConformances')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/quality/new')}>
              {t('quality.list.btnNewCheck')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('quality.list.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('quality.list.tabPlanned'), count: tabCounts.planned },
          { id: 'IN_PROGRESS', label: t('quality.list.tabInProgress'), count: tabCounts.in_progress },
          { id: 'COMPLETED', label: t('quality.list.tabCompleted'), count: tabCounts.completed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('quality.list.filterAllTypes') },
            ...Object.entries(getCheckTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: t('quality.list.filterAllResults') },
            ...Object.entries(getCheckResultLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<QualityCheck>
        data={filteredChecks}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('quality.list.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('quality.list.confirmDeleteTitle', { count: String(ids.length) }),
                description: t('quality.list.confirmDeleteDescription'),
                confirmLabel: t('quality.list.confirmDeleteBtn'),
                cancelLabel: t('quality.list.confirmCancelBtn'),
              });
              if (!isConfirmed) return;
              deleteCheckMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('quality.list.emptyTitle')}
        emptyDescription={t('quality.list.emptyDescription')}
      />
    </div>
  );
};

export default QualityListPage;
