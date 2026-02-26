import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  ArrowRight,
  PlayCircle,
  Ban,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { useVehicleOptions } from '@/hooks/useSelectOptions';
import { formatDate, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Waybill, WaybillEsmStatus } from './types';
import type { BadgeColor } from '@/design-system/components/StatusBadge';

const waybillStatusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  ISSUED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'red',
  // legacy lowercase support
  active: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

type TabId = 'all' | WaybillEsmStatus;

const WaybillsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(null);

  // Create form state
  const [formNumber, setFormNumber] = useState('');
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRouteFrom, setFormRouteFrom] = useState('');
  const [formRouteTo, setFormRouteTo] = useState('');
  const [formRouteDescription, setFormRouteDescription] = useState('');
  const [formDepartureTime, setFormDepartureTime] = useState('');
  const [formMileageStart, setFormMileageStart] = useState('');

  // Complete form state
  const [completeMileageEnd, setCompleteMileageEnd] = useState('');
  const [completeOdometerEnd, setCompleteOdometerEnd] = useState('');
  const [completeFuelConsumed, setCompleteFuelConsumed] = useState('');
  const [completeReturnTime, setCompleteReturnTime] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-waybills-esm', activeTab],
    queryFn: () =>
      fleetApi.getWaybillsEsm({
        size: 200,
        page: 0,
        status: activeTab === 'all' ? undefined : activeTab,
      }),
  });

  const waybills = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = waybills;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.number.toLowerCase().includes(q) ||
          w.vehicleName.toLowerCase().includes(q) ||
          w.driverName.toLowerCase().includes(q) ||
          w.routeFrom?.toLowerCase().includes(q) ||
          w.routeTo?.toLowerCase().includes(q),
      );
    }
    if (vehicleFilter) result = result.filter((w) => w.vehicleId === vehicleFilter);
    if (driverFilter) {
      const dq = driverFilter.toLowerCase();
      result = result.filter((w) => w.driverName.toLowerCase().includes(dq));
    }
    if (dateFrom) result = result.filter((w) => w.date >= dateFrom);
    if (dateTo) result = result.filter((w) => w.date <= dateTo);
    return result;
  }, [waybills, search, vehicleFilter, driverFilter, dateFrom, dateTo]);

  // Metrics
  const totalCount = waybills.length;
  const draftCount = waybills.filter((w) => w.status === 'DRAFT').length;
  const inProgressCount = waybills.filter(
    (w) => w.status === 'IN_PROGRESS' || w.status === 'ISSUED' || w.status === ('active' as WaybillEsmStatus),
  ).length;
  const completedCount = waybills.filter(
    (w) => w.status === 'COMPLETED' || w.status === ('completed' as WaybillEsmStatus),
  ).length;
  const totalMileage = waybills.reduce((s, w) => s + (w.totalMileage ?? 0), 0);
  const totalFuelConsumed = waybills.reduce((s, w) => s + (w.fuelConsumed ?? 0), 0);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: t('fleet.waybillsEsm.tabAll'), count: totalCount },
    { id: 'DRAFT', label: t('fleet.waybillsEsm.tabDraft'), count: draftCount },
    { id: 'ISSUED', label: t('fleet.waybillsEsm.tabIssued'), count: waybills.filter((w) => w.status === 'ISSUED').length },
    { id: 'IN_PROGRESS', label: t('fleet.waybillsEsm.tabInProgress'), count: inProgressCount },
    { id: 'COMPLETED', label: t('fleet.waybillsEsm.tabCompleted'), count: completedCount },
    { id: 'CANCELLED', label: t('fleet.waybillsEsm.tabCancelled'), count: waybills.filter((w) => w.status === 'CANCELLED').length },
  ];

  const statusLabels: Record<string, string> = {
    DRAFT: t('fleet.waybillsEsm.statusDraft'),
    ISSUED: t('fleet.waybillsEsm.statusIssued'),
    IN_PROGRESS: t('fleet.waybillsEsm.statusInProgress'),
    COMPLETED: t('fleet.waybillsEsm.statusCompleted'),
    CANCELLED: t('fleet.waybillsEsm.statusCancelled'),
    active: t('fleet.waybillsEsm.statusActive'),
    completed: t('fleet.waybillsEsm.statusCompleted'),
    cancelled: t('fleet.waybillsEsm.statusCancelled'),
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createWaybillEsm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills-esm'] });
      toast.success(t('fleet.waybillsEsm.toastCreated'));
      closeCreate();
    },
    onError: () => toast.error(t('fleet.waybillsEsm.toastError')),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fleetApi.completeWaybillEsm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills-esm'] });
      toast.success(t('fleet.waybillsEsm.toastCompleted'));
      closeComplete();
    },
    onError: () => toast.error(t('fleet.waybillsEsm.toastError')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fleetApi.changeWaybillEsmStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills-esm'] });
      toast.success(t('fleet.waybillsEsm.toastStatusChanged'));
    },
    onError: () => toast.error(t('fleet.waybillsEsm.toastError')),
  });

  function openCreate() {
    setFormNumber('');
    setFormVehicleId('');
    setFormDriverName('');
    setFormDate('');
    setFormRouteFrom('');
    setFormRouteTo('');
    setFormRouteDescription('');
    setFormDepartureTime('');
    setFormMileageStart('');
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  function openComplete(waybill: Waybill) {
    setSelectedWaybill(waybill);
    setCompleteMileageEnd('');
    setCompleteOdometerEnd('');
    setCompleteFuelConsumed('');
    setCompleteReturnTime('');
    setShowComplete(true);
  }

  function closeComplete() {
    setShowComplete(false);
    setSelectedWaybill(null);
  }

  function handleCreate() {
    createMutation.mutate({
      number: formNumber,
      vehicleId: formVehicleId,
      driverName: formDriverName,
      date: formDate,
      routeFrom: formRouteFrom || null,
      routeTo: formRouteTo || null,
      routeDescription: formRouteDescription || null,
      departureTime: formDepartureTime,
      mileageStart: formMileageStart ? Number(formMileageStart) : 0,
      status: 'DRAFT',
    });
  }

  function handleComplete() {
    if (!selectedWaybill) return;
    completeMutation.mutate({
      id: selectedWaybill.id,
      data: {
        mileageEnd: Number(completeMileageEnd),
        odometerEnd: Number(completeOdometerEnd) || undefined,
        fuelConsumed: Number(completeFuelConsumed),
        returnTime: completeReturnTime,
      },
    });
  }

  async function handlePrint(id: string) {
    try {
      const blob = await fleetApi.printWaybillEsm(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success(t('fleet.waybillsEsm.toastPrintReady'));
    } catch {
      toast.error(t('fleet.waybillsEsm.toastPrintError'));
    }
  }

  const columns = useMemo<ColumnDef<Waybill, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('fleet.waybillsEsm.colNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-medium text-primary-600 dark:text-primary-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'vehicleName',
        header: t('fleet.waybillsEsm.colVehicle'),
        size: 170,
      },
      {
        accessorKey: 'driverName',
        header: t('fleet.waybillsEsm.colDriver'),
        size: 150,
      },
      {
        accessorKey: 'date',
        header: t('fleet.waybillsEsm.colDate'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        id: 'route',
        header: t('fleet.waybillsEsm.colRoute'),
        size: 200,
        cell: ({ row }) => {
          const from = row.original.routeFrom;
          const to = row.original.routeTo;
          if (from && to) {
            return (
              <span className="flex items-center gap-1 text-sm truncate">
                <span className="text-neutral-700 dark:text-neutral-300">{from}</span>
                <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300">{to}</span>
              </span>
            );
          }
          return (
            <span className="text-neutral-400 text-sm truncate">
              {row.original.routeDescription || '\u2014'}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalMileage',
        header: t('fleet.waybillsEsm.colMileage'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return v != null ? (
            <span className="tabular-nums font-medium">
              {formatNumber(v)} {t('fleet.waybillsEsm.km')}
            </span>
          ) : (
            <span className="text-neutral-400">\u2014</span>
          );
        },
      },
      {
        accessorKey: 'fuelConsumed',
        header: t('fleet.waybillsEsm.colFuelConsumed'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return v != null ? (
            <span className="tabular-nums font-medium">
              {formatNumber(v)} {t('fleet.waybillsEsm.litersShort')}
            </span>
          ) : (
            <span className="text-neutral-400">\u2014</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('fleet.waybillsEsm.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return <StatusBadge status={s} colorMap={waybillStatusColorMap} label={statusLabels[s] ?? s} />;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => {
          const w = row.original;
          const canComplete =
            w.status === 'IN_PROGRESS' || w.status === 'ISSUED' || w.status === ('active' as WaybillEsmStatus);
          const canIssue = w.status === 'DRAFT';
          const canCancel =
            w.status === 'DRAFT' || w.status === 'ISSUED';
          return (
            <div className="flex items-center gap-1">
              {canIssue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    statusMutation.mutate({ id: w.id, status: 'ISSUED' });
                  }}
                  className="p-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                  title={t('fleet.waybillsEsm.actionIssue')}
                >
                  <PlayCircle className="w-4 h-4" />
                </button>
              )}
              {canComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openComplete(w);
                  }}
                  className="p-1 text-success-500 hover:text-success-700 dark:hover:text-success-300"
                  title={t('fleet.waybillsEsm.actionComplete')}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {canCancel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    statusMutation.mutate({ id: w.id, status: 'CANCELLED' });
                  }}
                  className="p-1 text-danger-500 hover:text-danger-700 dark:hover:text-danger-300"
                  title={t('fleet.waybillsEsm.actionCancel')}
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(w.id);
                }}
                className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                title={t('fleet.waybillsEsm.actionPrint')}
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.waybillsEsm.title')}
        subtitle={t('fleet.waybillsEsm.subtitle')}
        breadcrumbs={[
          { label: t('fleet.waybillsEsm.breadcrumbHome'), href: '/' },
          { label: t('fleet.waybillsEsm.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.waybillsEsm.breadcrumbWaybills') },
        ]}
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('fleet.waybillsEsm.newWaybill')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label={t('fleet.waybillsEsm.metricTotal')}
          value={totalCount}
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.waybillsEsm.metricDraft')}
          value={draftCount}
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.waybillsEsm.metricInProgress')}
          value={inProgressCount}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.waybillsEsm.metricCompleted')}
          value={completedCount}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.waybillsEsm.metricTotalMileage')}
          value={`${formatNumber(totalMileage)} ${t('fleet.waybillsEsm.km')}`}
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.waybillsEsm.metricTotalFuel')}
          value={`${formatNumber(totalFuelConsumed)} ${t('fleet.waybillsEsm.litersShort')}`}
          icon={<FileText className="w-5 h-5" />}
        />
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
            placeholder={t('fleet.waybillsEsm.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="w-56"
          options={vehicleOptions}
          placeholder={t('fleet.waybillsEsm.filterAllVehicles')}
        />
        <div className="relative flex-shrink-0 min-w-[180px] max-w-xs">
          <Input
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            placeholder={t('fleet.waybillsEsm.filterDriver')}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('fleet.waybillsEsm.dateFrom')}
          </span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('fleet.waybillsEsm.dateTo')}
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
        emptyTitle={t('fleet.waybillsEsm.emptyTitle')}
        emptyDescription={t('fleet.waybillsEsm.emptyDescription')}
      />

      {/* Create Modal */}
      {showCreate && (
        <Modal open={showCreate} onClose={closeCreate} title={t('fleet.waybillsEsm.modalTitle')} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.waybillsEsm.formNumber')} required>
                <Input
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="ESM-2-001"
                />
              </FormField>
              <FormField label={t('fleet.waybillsEsm.formDate')} required>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </FormField>
            </div>
            <FormField label={t('fleet.waybillsEsm.formVehicle')} required>
              <Select
                options={vehicleOptions}
                value={formVehicleId}
                onChange={(e) => setFormVehicleId(e.target.value)}
                placeholder={t('fleet.waybillsEsm.formVehiclePlaceholder')}
              />
            </FormField>
            <FormField label={t('fleet.waybillsEsm.formDriver')} required>
              <Input
                value={formDriverName}
                onChange={(e) => setFormDriverName(e.target.value)}
                placeholder={t('fleet.waybillsEsm.formDriverPlaceholder')}
              />
            </FormField>

            {/* Route */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.waybillsEsm.formRouteFrom')}>
                <Input
                  value={formRouteFrom}
                  onChange={(e) => setFormRouteFrom(e.target.value)}
                  placeholder={t('fleet.waybillsEsm.formRouteFromPlaceholder')}
                />
              </FormField>
              <FormField label={t('fleet.waybillsEsm.formRouteTo')}>
                <Input
                  value={formRouteTo}
                  onChange={(e) => setFormRouteTo(e.target.value)}
                  placeholder={t('fleet.waybillsEsm.formRouteToPlaceholder')}
                />
              </FormField>
            </div>
            <FormField label={t('fleet.waybillsEsm.formRouteDescription')}>
              <Textarea
                value={formRouteDescription}
                onChange={(e) => setFormRouteDescription(e.target.value)}
                placeholder={t('fleet.waybillsEsm.formRouteDescriptionPlaceholder')}
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.waybillsEsm.formDeparture')}>
                <Input
                  type="time"
                  value={formDepartureTime}
                  onChange={(e) => setFormDepartureTime(e.target.value)}
                />
              </FormField>
              <FormField label={t('fleet.waybillsEsm.formMileageStart')}>
                <Input
                  type="number"
                  value={formMileageStart}
                  onChange={(e) => setFormMileageStart(e.target.value)}
                  placeholder="0"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeCreate}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !formNumber || !formVehicleId || !formDriverName || !formDate || createMutation.isPending
                }
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Waybill Modal */}
      {showComplete && selectedWaybill && (
        <Modal
          open={showComplete}
          onClose={closeComplete}
          title={t('fleet.waybillsEsm.completeModalTitle')}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-400">
                <span>{t('fleet.waybillsEsm.colNumber')}:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedWaybill.number}
                </span>
                <span>{t('fleet.waybillsEsm.colVehicle')}:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedWaybill.vehicleName}
                </span>
                <span>{t('fleet.waybillsEsm.formMileageStart')}:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatNumber(selectedWaybill.mileageStart)} {t('fleet.waybillsEsm.km')}
                </span>
              </div>
            </div>

            <FormField label={t('fleet.waybillsEsm.completeMileageEnd')} required>
              <Input
                type="number"
                value={completeMileageEnd}
                onChange={(e) => setCompleteMileageEnd(e.target.value)}
                placeholder={t('fleet.waybillsEsm.completeMileageEndPlaceholder')}
              />
            </FormField>
            <FormField label={t('fleet.waybillsEsm.completeOdometerEnd')}>
              <Input
                type="number"
                value={completeOdometerEnd}
                onChange={(e) => setCompleteOdometerEnd(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.waybillsEsm.completeFuelConsumed')} required>
              <Input
                type="number"
                value={completeFuelConsumed}
                onChange={(e) => setCompleteFuelConsumed(e.target.value)}
                placeholder={t('fleet.waybillsEsm.completeFuelConsumedPlaceholder')}
              />
            </FormField>
            <FormField label={t('fleet.waybillsEsm.completeReturnTime')} required>
              <Input
                type="time"
                value={completeReturnTime}
                onChange={(e) => setCompleteReturnTime(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeComplete}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!completeMileageEnd || !completeFuelConsumed || !completeReturnTime || completeMutation.isPending}
              >
                {t('fleet.waybillsEsm.completeBtn')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WaybillsPage;
