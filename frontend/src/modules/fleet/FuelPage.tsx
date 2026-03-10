import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Fuel, TrendingUp, DollarSign, Gauge } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FuelRecord {
  id: string;
  vehicle: string;
  vehiclePlate: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometer: number;
  driver: string;
  fuelType: 'diesel' | 'gasoline_92' | 'gasoline_95';
  station: string;
  projectName?: string;
}

const getFuelTypeLabels = (): Record<string, string> => ({
  diesel: t('fleet.fuel.fuelDiesel'),
  gasoline_92: t('fleet.fuel.fuelGasoline92'),
  gasoline_95: t('fleet.fuel.fuelGasoline95'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FuelPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();
  const { data: fuelData, isLoading } = useQuery({
    queryKey: ['fleet-fuel'],
    queryFn: () => fleetApi.getFuelRecords('all'),
  });

  const records = ((fuelData ?? []) as unknown) as FuelRecord[];

  const filtered = useMemo(() => {
    let result = records;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) => r.vehicle.toLowerCase().includes(lower) || r.vehiclePlate.toLowerCase().includes(lower) || r.driver.toLowerCase().includes(lower),
      );
    }
    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);
    return result;
  }, [records, search, dateFrom, dateTo]);

  const totalCost = records.reduce((s, r) => s + r.totalCost, 0);
  const totalLiters = records.reduce((s, r) => s + r.liters, 0);

  // Top consumers by vehicle
  const vehicleTotals = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      map.set(r.vehicle, (map.get(r.vehicle) ?? 0) + r.liters);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [records]);

  const avgConsumption = totalLiters / (records.length || 1);

  const columns = useMemo<ColumnDef<FuelRecord, unknown>[]>(() => {
    const fuelTypeLabels = getFuelTypeLabels();
    return [
      {
        accessorKey: 'vehicle',
        header: t('fleet.fuel.colVehicle'),
        size: 190,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.vehicle}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.vehiclePlate}</p>
          </div>
        ),
      },
      { accessorKey: 'date', header: t('fleet.fuel.colDate'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
      { accessorKey: 'fuelType', header: t('fleet.fuel.colFuelType'), size: 80, cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{fuelTypeLabels[getValue<string>()] ?? getValue<string>()}</span> },
      { accessorKey: 'liters', header: t('fleet.fuel.colLiters'), size: 80, cell: ({ getValue }) => <span className="tabular-nums font-medium">{formatNumber(getValue<number>())}</span> },
      { accessorKey: 'totalCost', header: t('fleet.fuel.colAmount'), size: 120, cell: ({ getValue }) => <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span> },
      { accessorKey: 'odometer', header: t('fleet.fuel.colMileage'), size: 110, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
      { accessorKey: 'driver', header: t('fleet.fuel.colDriver'), size: 150 },
      { accessorKey: 'station', header: t('fleet.fuel.colStation'), size: 170, cell: ({ getValue }) => <span className="text-neutral-600">{getValue<string>()}</span> },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('fleet.fuel.title')}
        subtitle={t('fleet.fuel.subtitle')}
        breadcrumbs={[{ label: t('fleet.fuel.breadcrumbHome'), href: '/' }, { label: t('fleet.fuel.breadcrumbFleet'), href: '/fleet' }, { label: t('fleet.fuel.breadcrumbFuel') }]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => navigate('/fleet/fuel/new')}>{t('fleet.fuel.addRefueling')}</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign size={18} />} label={t('fleet.fuel.totalCosts')} value={formatMoney(totalCost)} trend={{ direction: 'up', value: '+12%' }} subtitle={t('fleet.fuel.currentMonth')} />
        <MetricCard icon={<Fuel size={18} />} label={t('fleet.fuel.totalConsumption')} value={`${formatNumber(totalLiters)} ${t('fleet.fuel.litersShort')}`} />
        <MetricCard icon={<Gauge size={18} />} label={t('fleet.fuel.avgConsumption')} value={`${avgConsumption.toFixed(0)} ${t('fleet.fuel.litersShort')}`} />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('fleet.fuel.topConsumer')}
          value={vehicleTotals[0]?.[0] ?? '---'}
          subtitle={vehicleTotals[0] ? `${formatNumber(vehicleTotals[0][1])} ${t('fleet.fuel.litersShort')}` : ''}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('fleet.fuel.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('fleet.fuel.dateFrom')}</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('fleet.fuel.dateTo')}</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      <DataTable<FuelRecord>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('fleet.fuel.emptyTitle')}
        emptyDescription={t('fleet.fuel.emptyDescription')}
      />
    </div>
  );
};

export default FuelPage;
