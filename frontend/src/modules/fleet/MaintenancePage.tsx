import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Wrench, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { fleetApi } from '@/api/fleet';
import type { PaginatedResponse } from '@/types';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Maintenance {
  id: string;
  vehicle: string;
  vehiclePlate: string;
  type: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  scheduledDate: string;
  completedDate?: string;
  mechanic: string;
  cost: number;
  description: string;
  projectName?: string;
}

type TabId = 'all' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

const statusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  OVERDUE: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  PLANNED: t('fleet.maintenance.statusPlanned'),
  IN_PROGRESS: t('fleet.maintenance.statusInProgress'),
  COMPLETED: t('fleet.maintenance.statusCompleted'),
  OVERDUE: t('fleet.maintenance.statusOverdue'),
});


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { data: maintData, isLoading } = useQuery<PaginatedResponse<Maintenance>>({
    queryKey: ['fleet-maintenance'],
    queryFn: async () => {
      const records = await fleetApi.getMaintenanceScheduleRecords();
      return { content: records, totalElements: records.length, totalPages: 1, size: records.length, page: 0 } as unknown as PaginatedResponse<Maintenance>;
    },
  });

  const maintenance = maintData?.content ?? [];

  const filtered = useMemo(() => {
    let result = maintenance;
    if (activeTab === 'PLANNED') result = result.filter((m) => m.status === 'PLANNED' || m.status === 'OVERDUE');
    else if (activeTab === 'IN_PROGRESS') result = result.filter((m) => m.status === 'IN_PROGRESS');
    else if (activeTab === 'COMPLETED') result = result.filter((m) => m.status === 'COMPLETED');

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m) => m.vehicle.toLowerCase().includes(lower) || m.vehiclePlate.toLowerCase().includes(lower) || m.mechanic.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [maintenance, activeTab, search]);

  const totalCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const overdueCount = maintenance.filter((m) => m.status === 'OVERDUE').length;
  const thisMonthCost = maintenance
    .filter((m) => m.status === 'COMPLETED' || m.status === 'IN_PROGRESS')
    .reduce((s, m) => s + m.cost, 0);

  const columns = useMemo<ColumnDef<Maintenance, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'vehicle',
        header: t('fleet.maintenance.colVehicle'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.vehicle}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.vehiclePlate}</p>
          </div>
        ),
      },
      { accessorKey: 'type', header: t('fleet.maintenance.colMaintenanceType'), size: 160 },
      {
        accessorKey: 'status',
        header: t('fleet.maintenance.colStatus'),
        size: 130,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} />,
      },
      {
        accessorKey: 'scheduledDate',
        header: t('fleet.maintenance.colScheduledDate'),
        size: 110,
        cell: ({ getValue, row }) => {
          const isOverdue = row.original.status === 'OVERDUE';
          return <span className={cn('tabular-nums', isOverdue && 'text-danger-600 font-medium')}>{formatDate(getValue<string>())}</span>;
        },
      },
      { accessorKey: 'mechanic', header: t('fleet.maintenance.colMechanic'), size: 150 },
      {
        accessorKey: 'cost',
        header: t('fleet.maintenance.colCost'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span>,
      },
      { accessorKey: 'projectName', header: t('fleet.maintenance.colProject'), size: 160, cell: ({ getValue }) => <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '---'}</span> },
    ];
  }, []);

  const tabCounts = useMemo(() => ({
    all: maintenance.length,
    planned: maintenance.filter((m) => m.status === 'PLANNED' || m.status === 'OVERDUE').length,
    in_progress: maintenance.filter((m) => m.status === 'IN_PROGRESS').length,
    completed: maintenance.filter((m) => m.status === 'COMPLETED').length,
  }), [maintenance]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('fleet.maintenance.title')}
        subtitle={t('fleet.maintenance.subtitle')}
        breadcrumbs={[{ label: t('fleet.maintenance.breadcrumbHome'), href: '/' }, { label: t('fleet.maintenance.breadcrumbFleet'), href: '/fleet' }, { label: t('fleet.maintenance.breadcrumbMaintenance') }]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => navigate('/fleet/maintenance/new')}>{t('fleet.maintenance.newMaintenance')}</Button>}
        tabs={[
          { id: 'all', label: t('fleet.maintenance.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('fleet.maintenance.tabPlanned'), count: tabCounts.planned },
          { id: 'IN_PROGRESS', label: t('fleet.maintenance.tabInProgress'), count: tabCounts.in_progress },
          { id: 'COMPLETED', label: t('fleet.maintenance.tabCompleted'), count: tabCounts.completed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={<Wrench size={18} />} label={t('fleet.maintenance.totalRecords')} value={maintenance.length} />
        <MetricCard icon={<AlertCircle size={18} />} label={t('fleet.maintenance.overdue')} value={overdueCount} trend={overdueCount > 0 ? { direction: 'up', value: `${overdueCount}` } : { direction: 'neutral', value: '0' }} />
        <MetricCard icon={<DollarSign size={18} />} label={t('fleet.maintenance.costsCurrentMonth')} value={formatMoney(thisMonthCost)} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('fleet.maintenance.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<Maintenance>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('fleet.maintenance.emptyTitle')}
        emptyDescription={t('fleet.maintenance.emptyDescription')}
      />
    </div>
  );
};

export default MaintenancePage;
