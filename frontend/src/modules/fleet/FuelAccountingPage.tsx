import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Fuel, DollarSign, Gauge, AlertTriangle, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { useVehicleOptions } from '@/hooks/useSelectOptions';
import { formatDate, formatNumber, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { FuelAccountingRecord } from './types';

const FUEL_TYPE_OPTIONS = [
  { value: 'diesel', label: () => t('fleet.fuelAccounting.fuelDiesel') },
  { value: 'gasoline_92', label: () => t('fleet.fuelAccounting.fuelGasoline92') },
  { value: 'gasoline_95', label: () => t('fleet.fuelAccounting.fuelGasoline95') },
  { value: 'gasoline_98', label: () => t('fleet.fuelAccounting.fuelGasoline98') },
  { value: 'lpg', label: () => t('fleet.fuelAccounting.fuelLpg') },
];

const FuelAccountingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formFuelType, setFormFuelType] = useState('diesel');
  const [formLiters, setFormLiters] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStation, setFormStation] = useState('');
  const [formMileage, setFormMileage] = useState('');
  const [formDriverName, setFormDriverName] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['fleet-fuel-accounting', vehicleFilter, fuelTypeFilter],
    queryFn: () =>
      fleetApi.getFuelAccountingRecords({
        size: 500,
        page: 0,
        vehicleId: vehicleFilter || undefined,
        fuelType: fuelTypeFilter || undefined,
      }),
  });

  const filtered = useMemo(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.vehicleName.toLowerCase().includes(q) ||
          r.station.toLowerCase().includes(q) ||
          r.fuelType.toLowerCase().includes(q) ||
          r.driverName?.toLowerCase().includes(q),
      );
    }
    if (dateFrom) result = result.filter((r) => r.refuelDate >= dateFrom);
    if (dateTo) result = result.filter((r) => r.refuelDate <= dateTo);
    return result;
  }, [records, search, dateFrom, dateTo]);

  // Metrics
  const totalCost = filtered.reduce((s, r) => s + r.cost, 0);
  const totalLiters = filtered.reduce((s, r) => s + r.liters, 0);
  const recordsWithConsumption = filtered.filter((r) => r.consumptionPer100km != null);
  const avgConsumption =
    recordsWithConsumption.length > 0
      ? recordsWithConsumption.reduce((s, r) => s + (r.consumptionPer100km ?? 0), 0) /
        recordsWithConsumption.length
      : 0;
  const vehiclesAboveNorm = new Set(
    filtered
      .filter((r) => r.consumptionPer100km != null && r.consumptionPer100km > r.normPer100km)
      .map((r) => r.vehicleId),
  ).size;
  const totalDeviation = recordsWithConsumption.reduce((s, r) => {
    const dev = (r.consumptionPer100km ?? 0) - r.normPer100km;
    return s + dev;
  }, 0);
  const avgDeviation = recordsWithConsumption.length > 0 ? totalDeviation / recordsWithConsumption.length : 0;

  // Per-vehicle norm vs actual summary
  const vehicleSummary = useMemo(() => {
    const map = new Map<string, { name: string; actual: number; norm: number; count: number }>();
    for (const r of filtered) {
      if (r.consumptionPer100km == null) continue;
      const existing = map.get(r.vehicleId) ?? { name: r.vehicleName, actual: 0, norm: 0, count: 0 };
      existing.actual += r.consumptionPer100km;
      existing.norm += r.normPer100km;
      existing.count += 1;
      map.set(r.vehicleId, existing);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      vehicleId: id,
      vehicleName: v.name,
      avgActual: v.actual / v.count,
      avgNorm: v.norm / v.count,
      deviation: (v.actual / v.count) - (v.norm / v.count),
    })).sort((a, b) => b.deviation - a.deviation);
  }, [filtered]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createFuelAccountingRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-fuel-accounting'] });
      toast.success(t('fleet.fuelAccounting.toastCreated'));
      closeCreate();
    },
    onError: () => toast.error(t('fleet.fuelAccounting.toastError')),
  });

  function openCreate() {
    setFormVehicleId('');
    setFormDate('');
    setFormFuelType('diesel');
    setFormLiters('');
    setFormCost('');
    setFormStation('');
    setFormMileage('');
    setFormDriverName('');
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  function handleCreate() {
    createMutation.mutate({
      vehicleId: formVehicleId,
      refuelDate: formDate,
      fuelType: formFuelType,
      liters: Number(formLiters),
      cost: Number(formCost),
      station: formStation,
      mileageAtRefuel: Number(formMileage),
      driverName: formDriverName || undefined,
    });
  }

  const fuelTypeSelectOptions = FUEL_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label(),
  }));

  const columns = useMemo<ColumnDef<FuelAccountingRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'vehicleName',
        header: t('fleet.fuelAccounting.colVehicle'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'fuelType',
        header: t('fleet.fuelAccounting.colFuelType'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<string>();
          const opt = FUEL_TYPE_OPTIONS.find((o) => o.value === v);
          return <span>{opt ? opt.label() : v}</span>;
        },
      },
      {
        accessorKey: 'refuelDate',
        header: t('fleet.fuelAccounting.colDate'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'liters',
        header: t('fleet.fuelAccounting.colLiters'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'cost',
        header: t('fleet.fuelAccounting.colCost'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'station',
        header: t('fleet.fuelAccounting.colStation'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'mileageAtRefuel',
        header: t('fleet.fuelAccounting.colMileage'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: 'normConsumption',
        header: t('fleet.fuelAccounting.colNorm'),
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
            {row.original.normPer100km.toFixed(1)}
          </span>
        ),
      },
      {
        id: 'consumption',
        header: t('fleet.fuelAccounting.colConsumption'),
        size: 140,
        cell: ({ row }) => {
          const actual = row.original.consumptionPer100km;
          const norm = row.original.normPer100km;
          if (actual == null) return <span className="text-neutral-400">\u2014</span>;
          const overNorm = actual > norm;
          const deviation = actual - norm;
          return (
            <div className="flex items-center gap-2">
              <span
                className={`tabular-nums font-medium ${
                  overNorm
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-success-600 dark:text-success-400'
                }`}
              >
                {actual.toFixed(1)}
              </span>
              <span
                className={`text-xs tabular-nums ${
                  overNorm ? 'text-danger-500' : 'text-success-500'
                }`}
              >
                ({deviation > 0 ? '+' : ''}
                {deviation.toFixed(1)})
              </span>
              {overNorm && <AlertTriangle className="w-3.5 h-3.5 text-danger-500" />}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.fuelAccounting.title')}
        subtitle={t('fleet.fuelAccounting.subtitle')}
        breadcrumbs={[
          { label: t('fleet.fuelAccounting.breadcrumbHome'), href: '/' },
          { label: t('fleet.fuelAccounting.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.fuelAccounting.breadcrumbFuelAccounting') },
        ]}
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('fleet.fuelAccounting.newRecord')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('fleet.fuelAccounting.metricTotalCost')}
          value={formatMoney(totalCost)}
        />
        <MetricCard
          icon={<Fuel className="w-5 h-5" />}
          label={t('fleet.fuelAccounting.metricTotalLiters')}
          value={`${formatNumber(totalLiters)} ${t('fleet.fuelAccounting.litersShort')}`}
        />
        <MetricCard
          icon={<Gauge className="w-5 h-5" />}
          label={t('fleet.fuelAccounting.metricAvgConsumption')}
          value={`${avgConsumption.toFixed(1)} ${t('fleet.fuelAccounting.lPer100km')}`}
        />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label={t('fleet.fuelAccounting.metricAboveNorm')}
          value={vehiclesAboveNorm}
        />
        <MetricCard
          icon={<TrendingDown className="w-5 h-5" />}
          label={t('fleet.fuelAccounting.metricAvgDeviation')}
          value={`${avgDeviation > 0 ? '+' : ''}${avgDeviation.toFixed(1)} ${t('fleet.fuelAccounting.lPer100km')}`}
        />
      </div>

      {/* Vehicle Norm vs Actual Comparison */}
      {vehicleSummary.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('fleet.fuelAccounting.normComparisonTitle')}
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {vehicleSummary.slice(0, 10).map((v) => {
              const overNorm = v.deviation > 0;
              const pct = v.avgNorm > 0 ? Math.abs(v.deviation / v.avgNorm) * 100 : 0;
              return (
                <div key={v.vehicleId} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 w-40 truncate">
                    {v.vehicleName}
                  </span>
                  <div className="flex-1 h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full ${
                        overNorm ? 'bg-danger-400 dark:bg-danger-500' : 'bg-success-400 dark:bg-success-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium tabular-nums w-20 text-right ${
                      overNorm
                        ? 'text-danger-600 dark:text-danger-400'
                        : 'text-success-600 dark:text-success-400'
                    }`}
                  >
                    {v.avgActual.toFixed(1)} / {v.avgNorm.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('fleet.fuelAccounting.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="w-56"
          options={vehicleOptions}
          placeholder={t('fleet.fuelAccounting.filterAllVehicles')}
        />
        <Select
          value={fuelTypeFilter}
          onChange={(e) => setFuelTypeFilter(e.target.value)}
          className="w-44"
          options={fuelTypeSelectOptions}
          placeholder={t('fleet.fuelAccounting.filterAllFuelTypes')}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('fleet.fuelAccounting.dateFrom')}
          </span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('fleet.fuelAccounting.dateTo')}
          </span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('fleet.fuelAccounting.emptyTitle')}
        emptyDescription={t('fleet.fuelAccounting.emptyDescription')}
      />

      {/* Create Refueling Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={closeCreate}
          title={t('fleet.fuelAccounting.modalTitle')}
          size="lg"
        >
          <div className="space-y-4">
            <FormField label={t('fleet.fuelAccounting.formVehicle')} required>
              <Select
                options={vehicleOptions}
                value={formVehicleId}
                onChange={(e) => setFormVehicleId(e.target.value)}
                placeholder={t('fleet.fuelAccounting.formVehiclePlaceholder')}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.fuelAccounting.formDate')} required>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </FormField>
              <FormField label={t('fleet.fuelAccounting.formFuelType')} required>
                <Select
                  options={fuelTypeSelectOptions}
                  value={formFuelType}
                  onChange={(e) => setFormFuelType(e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.fuelAccounting.formLiters')} required>
                <Input
                  type="number"
                  value={formLiters}
                  onChange={(e) => setFormLiters(e.target.value)}
                  placeholder="0"
                />
              </FormField>
              <FormField label={t('fleet.fuelAccounting.formCost')} required>
                <Input
                  type="number"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.fuelAccounting.formStation')} required>
                <Input
                  value={formStation}
                  onChange={(e) => setFormStation(e.target.value)}
                  placeholder={t('fleet.fuelAccounting.formStationPlaceholder')}
                />
              </FormField>
              <FormField label={t('fleet.fuelAccounting.formMileage')} required>
                <Input
                  type="number"
                  value={formMileage}
                  onChange={(e) => setFormMileage(e.target.value)}
                  placeholder="0"
                />
              </FormField>
            </div>
            <FormField label={t('fleet.fuelAccounting.formDriver')}>
              <Input
                value={formDriverName}
                onChange={(e) => setFormDriverName(e.target.value)}
                placeholder={t('fleet.fuelAccounting.formDriverPlaceholder')}
              />
            </FormField>

            {/* Cost per liter preview */}
            {Number(formLiters) > 0 && Number(formCost) > 0 && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('fleet.fuelAccounting.costPerLiter')}:{' '}
                <span className="font-medium tabular-nums">
                  {(Number(formCost) / Number(formLiters)).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeCreate}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !formVehicleId ||
                  !formDate ||
                  !formLiters ||
                  !formCost ||
                  !formStation ||
                  !formMileage ||
                  createMutation.isPending
                }
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FuelAccountingPage;
