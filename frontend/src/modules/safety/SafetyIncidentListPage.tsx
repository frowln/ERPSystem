import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, AlertTriangle, Shield, Clock, Activity, UserX, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { Input, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { SafetyIncident } from './types';
const SafetyIncidentCreateModal = React.lazy(() => import('./SafetyIncidentCreateModal'));

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple'> = {
  reported: 'blue', under_investigation: 'yellow', corrective_action: 'orange', resolved: 'green', closed: 'gray',
};
const getStatusLabels = (): Record<string, string> => ({
  reported: t('safety.incidentList.statusReported'), under_investigation: t('safety.incidentList.statusUnderInvestigation'), corrective_action: t('safety.incidentList.statusCorrectiveAction'), resolved: t('safety.incidentList.statusResolved'), closed: t('safety.incidentList.statusClosed'),
});
const severityColorMap: Record<string, 'gray' | 'blue' | 'yellow' | 'orange' | 'red'> = {
  minor: 'gray', moderate: 'blue', serious: 'yellow', critical: 'orange', fatal: 'red',
};
const getSeverityLabels = (): Record<string, string> => ({
  minor: t('safety.incidentList.severityMinor'), moderate: t('safety.incidentList.severityModerate'), serious: t('safety.incidentList.severitySerious'), critical: t('safety.incidentList.severityCritical'), fatal: t('safety.incidentList.severityFatal'),
});
const getTypeLabels = (): Record<string, string> => ({
  fall: t('safety.incidentList.typeFall'), struck_by: t('safety.incidentList.typeStruckBy'), caught_in: t('safety.incidentList.typeCaughtIn'), electrocution: t('safety.incidentList.typeElectrocution'),
  collapse: t('safety.incidentList.typeCollapse'), fire: t('safety.incidentList.typeFire'), chemical: t('safety.incidentList.typeChemical'), equipment: t('safety.incidentList.typeEquipment'), other: t('safety.incidentList.typeOther'),
});

const getSeverityFilterOptions = () => [
  { value: '', label: t('safety.incidentList.filterAllLevels') },
  ...Object.entries(getSeverityLabels()).map(([v, l]) => ({ value: v, label: l })),
];

type TabId = 'all' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';

const SafetyIncidentListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const deleteIncidentMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await safetyApi.deleteIncident(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      toast.success(t('safety.incidentList.toastDeleted'));
    },
    onError: () => {
      toast.error(t('safety.incidentList.toastDeleteError'));
    },
  });

  const { data: incData, isLoading } = useQuery({
    queryKey: ['safety-incidents'],
    queryFn: () => safetyApi.getIncidents(),
  });

  const incidents = incData?.content ?? [];

  const filteredIncidents = useMemo(() => {
    let filtered = incidents;
    if (activeTab === 'ACTIVE') filtered = filtered.filter((i) => ['REPORTED', 'UNDER_INVESTIGATION', 'CORRECTIVE_ACTION'].includes(i.status));
    else if (activeTab === 'RESOLVED') filtered = filtered.filter((i) => i.status === 'RESOLVED');
    else if (activeTab === 'CLOSED') filtered = filtered.filter((i) => i.status === 'CLOSED');
    if (severityFilter) filtered = filtered.filter((i) => i.severity === severityFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) => i.number.toLowerCase().includes(lower) || (i.projectName ?? '').toLowerCase().includes(lower) || i.description.toLowerCase().includes(lower) || i.locationDescription.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [incidents, activeTab, severityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: incidents.length,
    active: incidents.filter((i) => ['REPORTED', 'UNDER_INVESTIGATION', 'CORRECTIVE_ACTION'].includes(i.status)).length,
    resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
    closed: incidents.filter((i) => i.status === 'CLOSED').length,
  }), [incidents]);

  const metrics = useMemo(() => ({
    total: incidents.length,
    active: tabCounts.active,
    totalInjured: incidents.filter((i) => i.injuredEmployeeName).length,
    totalDaysLost: incidents.reduce((s, i) => s + (i.workDaysLost ?? 0), 0),
  }), [incidents, tabCounts]);

  const columns = useMemo<ColumnDef<SafetyIncident, unknown>[]>(() => [
    { accessorKey: 'number', header: '\u2116', size: 100, cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span> },
    {
      accessorKey: 'incidentDate', header: t('safety.incidentList.columnDate'), size: 110,
      cell: ({ row }) => (
        <div>
          <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(row.original.incidentDate)}</span>
          {row.original.incidentTime && <span className="text-xs text-neutral-400 ml-1">{row.original.incidentTime}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'description', header: t('safety.incidentList.columnDescription'), size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.description.slice(0, 60)}...</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
        </div>
      ),
    },
    {
      accessorKey: 'severity', header: t('safety.incidentList.columnSeverity'), size: 130,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={severityColorMap} label={getSeverityLabels()[getValue<string>()] ?? getValue<string>()} />,
    },
    {
      accessorKey: 'status', header: t('safety.incidentList.columnStatus'), size: 150,
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={getStatusLabels()[getValue<string>()] ?? getValue<string>()} />,
    },
    { accessorKey: 'projectName', header: t('safety.incidentList.columnProject'), size: 170, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 truncate">{getValue<string>()}</span> },
    {
      accessorKey: 'incidentType', header: t('safety.incidentList.columnType'), size: 130,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{getTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>,
    },
    { accessorKey: 'injuredPersons', header: t('safety.incidentList.columnInjured'), size: 90, cell: ({ getValue }) => { const v = getValue<number>(); return <span className={v > 0 ? 'text-danger-600 font-semibold tabular-nums' : 'text-neutral-500 dark:text-neutral-400 tabular-nums'}>{v}</span>; } },
    {
      id: 'actions', header: '', size: 80,
      cell: ({ row }) => <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); navigate(`/safety/incidents/${row.original.id}`); }}>{t('safety.incidentList.actionOpen')}</Button>,
    },
  ], [navigate]);

  const handleRowClick = useCallback(
    (inc: SafetyIncident) => navigate(`/safety/incidents/${inc.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.incidentList.title')}
        subtitle={`${incidents.length} ${t('safety.incidentList.subtitleCount')}`}
        breadcrumbs={[{ label: t('safety.incidentList.breadcrumbHome'), href: '/' }, { label: t('safety.incidentList.breadcrumbSafety') }, { label: t('safety.incidentList.breadcrumbIncidents') }]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            {t('safety.incidentList.actionRegisterIncident')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('safety.incidentList.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('safety.incidentList.tabActive'), count: tabCounts.active },
          { id: 'RESOLVED', label: t('safety.incidentList.tabResolved'), count: tabCounts.resolved },
          { id: 'CLOSED', label: t('safety.incidentList.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Shield size={18} />} label={t('safety.incidentList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('safety.incidentList.metricActive')} value={metrics.active} trend={metrics.active > 2 ? { direction: 'down', value: t('safety.incidentList.metricRequireAttention') } : undefined} />
        <MetricCard icon={<UserX size={18} />} label={t('safety.incidentList.metricInjured')} value={metrics.totalInjured} trend={metrics.totalInjured > 0 ? { direction: 'down', value: `${metrics.totalInjured} ${t('safety.incidentList.metricPersons')}` } : undefined} />
        <MetricCard icon={<Clock size={18} />} label={t('safety.incidentList.metricDaysLost')} value={metrics.totalDaysLost} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('safety.incidentList.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getSeverityFilterOptions()} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<SafetyIncident>
        data={filteredIncidents}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('safety.incidentList.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: `${t('safety.incidentList.confirmDeleteTitle')} ${ids.length}?`,
                description: t('safety.incidentList.confirmDeleteDescription'),
                confirmLabel: t('safety.incidentList.confirmDeleteConfirm'),
                cancelLabel: t('safety.incidentList.confirmDeleteCancel'),
              });
              if (!isConfirmed) return;
              deleteIncidentMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('safety.incidentList.emptyTitle')}
        emptyDescription={t('safety.incidentList.emptyDescription')}
      />

      {createModalOpen && (
        <React.Suspense fallback={null}>
          <SafetyIncidentCreateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
};

export default SafetyIncidentListPage;
