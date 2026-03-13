import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, waybillStatusColorMap, waybillStatusLabels } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { fleetApi, type FleetWaybill } from '@/api/fleet';
import { useVehicleOptions } from '@/hooks/useSelectOptions';
import { formatDate, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
type TabId = 'all' | 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

const WaybillListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-waybills', activeTab, vehicleFilter],
    queryFn: () =>
      fleetApi.getWaybills({
        status: activeTab === 'all' ? undefined : (activeTab as FleetWaybill['status']),
        vehicleId: vehicleFilter || undefined,
        size: 200,
        page: 0,
      }),
  });

  const waybills = data?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return waybills;
    const q = search.toLowerCase();
    return waybills.filter(
      (w) =>
        w.number?.toLowerCase().includes(q) ||
        w.driverName?.toLowerCase().includes(q) ||
        w.routeDescription?.toLowerCase().includes(q) ||
        w.vehicleName?.toLowerCase().includes(q),
    );
  }, [waybills, search]);

  // Metrics
  const totalCount = waybills.length;
  const draftCount = waybills.filter((w) => w.status === 'DRAFT').length;
  const inProgressCount = waybills.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedCount = waybills.filter((w) => w.status === 'COMPLETED').length;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: t('fleet.waybills.tabAll'), count: totalCount },
    { id: 'DRAFT', label: t('fleet.waybills.tabDraft'), count: draftCount },
    { id: 'ISSUED', label: t('fleet.waybills.tabIssued'), count: waybills.filter((w) => w.status === 'ISSUED').length },
    { id: 'IN_PROGRESS', label: t('fleet.waybills.tabInProgress'), count: inProgressCount },
    { id: 'COMPLETED', label: t('fleet.waybills.tabCompleted'), count: completedCount },
    { id: 'CLOSED', label: t('fleet.waybills.tabClosed'), count: waybills.filter((w) => w.status === 'CLOSED').length },
  ];

  const columns = useMemo<ColumnDef<FleetWaybill, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('fleet.waybills.colNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium text-primary-600 dark:text-primary-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'waybillDate',
        header: t('fleet.waybills.colDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        id: 'vehicle',
        header: t('fleet.waybills.colVehicle'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <div className="font-medium truncate">{row.original.vehicleName ?? '—'}</div>
            {row.original.vehicleLicensePlate && (
              <div className="text-xs text-neutral-500">{row.original.vehicleLicensePlate}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'driverName',
        header: t('fleet.waybills.colDriver'),
        size: 160,
        cell: ({ getValue }) => getValue<string>() || <span className="text-neutral-400">—</span>,
      },
      {
        id: 'route',
        header: t('fleet.waybills.colRoute'),
        size: 200,
        cell: ({ row }) => {
          const dep = row.original.departurePoint;
          const dest = row.original.destinationPoint;
          if (dep && dest) return <span className="truncate">{dep} → {dest}</span>;
          return <span className="text-neutral-400 truncate">{row.original.routeDescription || '—'}</span>;
        },
      },
      {
        id: 'distance',
        header: t('fleet.waybills.colDistance'),
        size: 100,
        cell: ({ row }) => {
          const d = row.original.distance;
          return d != null ? <span className="tabular-nums">{formatNumber(d)}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        id: 'fuel',
        header: t('fleet.waybills.colFuelConsumed'),
        size: 100,
        cell: ({ row }) => {
          const f = row.original.fuelConsumed;
          return f != null ? <span className="tabular-nums">{formatNumber(f)}</span> : <span className="text-neutral-400">—</span>;
        },
      },
      {
        id: 'preTrip',
        header: t('fleet.waybills.colMedical'),
        size: 80,
        cell: ({ row }) =>
          row.original.medicalExamPassed ? (
            <CheckCircle className="w-4 h-4 text-success-500" />
          ) : (
            <XCircle className="w-4 h-4 text-neutral-300" />
          ),
      },
      {
        accessorKey: 'status',
        header: t('fleet.waybills.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return (
            <StatusBadge
              status={s}
              colorMap={waybillStatusColorMap}
              label={waybillStatusLabels[s] ?? s}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.waybills.title')}
        subtitle={t('fleet.waybills.subtitle')}
        breadcrumbs={[
          { label: t('fleet.waybills.breadcrumbHome'), href: '/' },
          { label: t('fleet.waybills.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.waybills.breadcrumbWaybills') },
        ]}
        actions={
          <Button onClick={() => navigate('/fleet/waybills/new')} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('fleet.waybills.newWaybill')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label={t('fleet.waybills.metricTotal')} value={totalCount} icon={<FileText className="w-5 h-5" />} />
        <MetricCard label={t('fleet.waybills.metricDraft')} value={draftCount} icon={<FileText className="w-5 h-5" />} />
        <MetricCard label={t('fleet.waybills.metricInProgress')} value={inProgressCount} icon={<FileText className="w-5 h-5" />} />
        <MetricCard label={t('fleet.waybills.metricCompleted')} value={completedCount} icon={<FileText className="w-5 h-5" />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-neutral-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('fleet.waybills.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="w-56"
          options={vehicleOptions}
          placeholder={t('fleet.waybills.filterAllVehicles')}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onRowClick={(row) => navigate(`/fleet/waybills/${row.id}`)}
        emptyTitle={t('fleet.waybills.emptyTitle')}
        emptyDescription={t('fleet.waybills.emptyDescription')}
        enableExport
      />
    </div>
  );
};

export default WaybillListPage;
