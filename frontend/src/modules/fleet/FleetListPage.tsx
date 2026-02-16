import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2, Truck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { fleetApi, type Vehicle } from '@/api/fleet';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

// ---- Status maps ----
const vehicleStatusColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'orange' | 'gray'> = {
  available: 'green',
  in_use: 'blue',
  maintenance: 'yellow',
  repair: 'orange',
  decommissioned: 'gray',
};
const getVehicleStatusLabels = (): Record<string, string> => ({
  available: t('fleet.list.statusAvailable'),
  in_use: t('fleet.list.statusInUse'),
  maintenance: t('fleet.list.statusMaintenance'),
  repair: t('fleet.list.statusRepair'),
  decommissioned: t('fleet.list.statusDecommissioned'),
});
const getVehicleTypeLabels = (): Record<string, string> => ({
  excavator: t('fleet.list.typeExcavator'),
  crane: t('fleet.list.typeCrane'),
  truck: t('fleet.list.typeTruck'),
  loader: t('fleet.list.typeLoader'),
  bulldozer: t('fleet.list.typeBulldozer'),
  concrete_mixer: t('fleet.list.typeConcreteMixer'),
  generator: t('fleet.list.typeGenerator'),
  compressor: t('fleet.list.typeCompressor'),
  other: t('fleet.list.typeOther'),
});

type TabId = 'all' | 'IN_USE' | 'AVAILABLE' | 'MAINTENANCE';

const FleetListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const deleteVehicleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await fleetApi.deleteVehicle(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      toast.success(t('fleet.list.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('fleet.list.deleteError'));
    },
  });

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: () => fleetApi.getVehicles(),
  });

  const vehicles = vehiclesData?.content ?? [];

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (activeTab === 'IN_USE') filtered = filtered.filter((v) => v.status === 'IN_USE');
    else if (activeTab === 'AVAILABLE') filtered = filtered.filter((v) => v.status === 'AVAILABLE');
    else if (activeTab === 'MAINTENANCE') filtered = filtered.filter((v) => v.status === 'MAINTENANCE' || v.status === 'REPAIR');

    if (typeFilter) filtered = filtered.filter((v) => v.type === typeFilter);
    if (statusFilter) filtered = filtered.filter((v) => v.status === statusFilter);

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(lower) ||
          v.code.toLowerCase().includes(lower) ||
          (v.licensePlate ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [vehicles, activeTab, typeFilter, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: vehicles.length,
    in_use: vehicles.filter((v) => v.status === 'IN_USE').length,
    available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE' || v.status === 'REPAIR').length,
  }), [vehicles]);

  const columns = useMemo<ColumnDef<Vehicle, unknown>[]>(() => {
    const vehicleStatusLabels = getVehicleStatusLabels();
    const vehicleTypeLabels = getVehicleTypeLabels();
    return [
      {
        accessorKey: 'code',
        header: t('fleet.list.colCode'),
        size: 90,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'name',
        header: t('fleet.list.colName'),
        size: 220,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
              <Truck size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.brand} {row.original.model}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('fleet.list.colType'),
        size: 140,
        cell: ({ getValue }) => <span className="text-neutral-600">{vehicleTypeLabels[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        accessorKey: 'licensePlate',
        header: t('fleet.list.colLicensePlate'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return v ? <span className="font-mono text-sm">{v}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'status',
        header: t('fleet.list.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<string>()} colorMap={vehicleStatusColorMap} label={vehicleStatusLabels[getValue<string>()]} />
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('fleet.list.colProject'),
        size: 160,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return v ? <span className="text-neutral-600">{v}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        accessorKey: 'nextMaintenanceDate',
        header: t('fleet.list.colNextMaintenance'),
        size: 130,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          if (!v) return <span className="text-neutral-400">—</span>;
          const dt = new Date(v);
          const isOverdue = dt < new Date();
          return (
            <span className={cn('tabular-nums', isOverdue ? 'text-danger-600 font-medium' : 'text-neutral-600')}>
              {formatDate(v)}
            </span>
          );
        },
      },
    ];
  }, []);

  const handleRowClick = useCallback(
    (vehicle: Vehicle) => navigate(`/fleet/${vehicle.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('fleet.list.title')}
        subtitle={`${vehicles.length} ${t('fleet.list.subtitleUnits')}`}
        breadcrumbs={[
          { label: t('fleet.list.breadcrumbHome'), href: '/' },
          { label: t('fleet.list.breadcrumbFleet') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => toast(t('fleet.list.createHint'))}>
            {t('fleet.list.addVehicle')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('fleet.list.tabAll'), count: tabCounts.all },
          { id: 'IN_USE', label: t('fleet.list.tabInUse'), count: tabCounts.in_use },
          { id: 'AVAILABLE', label: t('fleet.list.tabAvailable'), count: tabCounts.available },
          { id: 'MAINTENANCE', label: t('fleet.list.tabMaintenance'), count: tabCounts.maintenance },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('fleet.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('fleet.list.allTypes') },
            ...Object.entries(getVehicleTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: t('fleet.list.allStatuses') },
            ...Object.entries(getVehicleStatusLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable<Vehicle>
        data={filteredVehicles}
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
            label: t('fleet.list.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('fleet.list.confirmDeleteTitle', { count: String(ids.length) }),
                description: t('fleet.list.confirmDeleteDescription'),
                confirmLabel: t('fleet.list.confirmDeleteConfirm'),
                cancelLabel: t('fleet.list.confirmDeleteCancel'),
              });
              if (!isConfirmed) return;
              deleteVehicleMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('fleet.list.emptyTitle')}
        emptyDescription={t('fleet.list.emptyDescription')}
      />
    </div>
  );
};

export default FleetListPage;
