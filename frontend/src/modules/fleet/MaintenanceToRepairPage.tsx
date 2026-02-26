import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
  Zap,
  Droplets,
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
import { formatDate, formatNumber, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';
import type { MaintenanceScheduleRecord, MaintenanceWorkType, MaintTriggerType } from './types';
import type { BadgeColor } from '@/design-system/components/StatusBadge';

const maintStatusColorMap: Record<string, BadgeColor> = {
  SCHEDULED: 'blue',
  OVERDUE: 'red',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  upcoming: 'yellow',
  overdue: 'red',
  completed: 'green',
};

const WORK_TYPE_KEYS: Record<MaintenanceWorkType, string> = {
  OIL_CHANGE: 'fleet.maintRepair.workOilChange',
  TIRE_ROTATION: 'fleet.maintRepair.workTireRotation',
  BRAKE_CHECK: 'fleet.maintRepair.workBrakeCheck',
  ENGINE_SERVICE: 'fleet.maintRepair.workEngineService',
  TRANSMISSION: 'fleet.maintRepair.workTransmission',
  HYDRAULIC: 'fleet.maintRepair.workHydraulic',
  ELECTRICAL: 'fleet.maintRepair.workElectrical',
  GENERAL_INSPECTION: 'fleet.maintRepair.workGeneralInspection',
  OTHER: 'fleet.maintRepair.workOther',
};

const WORK_TYPE_ICONS: Record<string, React.ReactNode> = {
  OIL_CHANGE: <Droplets className="w-3.5 h-3.5" />,
  ENGINE_SERVICE: <Settings className="w-3.5 h-3.5" />,
  ELECTRICAL: <Zap className="w-3.5 h-3.5" />,
  HYDRAULIC: <Droplets className="w-3.5 h-3.5" />,
};

type TabId = 'all' | 'SCHEDULED' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED';

const MaintenanceToRepairPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceScheduleRecord | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('');

  // Create form state
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formWorkType, setFormWorkType] = useState<MaintenanceWorkType>('OIL_CHANGE');
  const [formTriggerType, setFormTriggerType] = useState<MaintTriggerType>('DATE');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formScheduledMileage, setFormScheduledMileage] = useState('');
  const [formIntervalDays, setFormIntervalDays] = useState('');
  const [formIntervalMileage, setFormIntervalMileage] = useState('');
  const [formCost, setFormCost] = useState('');

  // Complete form state
  const [completeActualDate, setCompleteActualDate] = useState('');
  const [completeActualMileage, setCompleteActualMileage] = useState('');
  const [completeActualCost, setCompleteActualCost] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['fleet-maint-schedule-records', workTypeFilter],
    queryFn: () =>
      fleetApi.getMaintenanceScheduleRecords({
        workType: workTypeFilter || undefined,
      }),
  });

  const filtered = useMemo(() => {
    let result = records;
    if (activeTab !== 'all') {
      const tabNorm = activeTab.toLowerCase();
      result = result.filter(
        (r) => r.status === activeTab || r.status === tabNorm || r.status === (tabNorm === 'scheduled' ? 'upcoming' : tabNorm),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.vehicleName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.mechanicName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [records, activeTab, search]);

  // Sort overdue items first
  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOverdue = a.status === 'OVERDUE' || a.status === 'overdue' ? 0 : 1;
      const bOverdue = b.status === 'OVERDUE' || b.status === 'overdue' ? 0 : 1;
      return aOverdue - bOverdue;
    });
  }, [filtered]);

  // Metrics
  const scheduledCount = records.filter(
    (r) => r.status === 'SCHEDULED' || r.status === 'upcoming',
  ).length;
  const overdueCount = records.filter(
    (r) => r.status === 'OVERDUE' || r.status === 'overdue',
  ).length;
  const inProgressCount = records.filter((r) => r.status === 'IN_PROGRESS').length;
  const completedCount = records.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'completed',
  ).length;
  const totalCost = records.reduce((s, r) => s + (r.cost ?? 0), 0);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: t('fleet.maintRepair.tabAll'), count: records.length },
    { id: 'SCHEDULED', label: t('fleet.maintRepair.tabScheduled'), count: scheduledCount },
    { id: 'OVERDUE', label: t('fleet.maintRepair.tabOverdue'), count: overdueCount },
    { id: 'IN_PROGRESS', label: t('fleet.maintRepair.tabInProgress'), count: inProgressCount },
    { id: 'COMPLETED', label: t('fleet.maintRepair.tabCompleted'), count: completedCount },
  ];

  const workTypeOptions = (Object.keys(WORK_TYPE_KEYS) as MaintenanceWorkType[]).map((wt) => ({
    value: wt,
    label: t(WORK_TYPE_KEYS[wt]),
  }));

  const triggerTypeOptions = [
    { value: 'DATE', label: t('fleet.maintRepair.triggerDate') },
    { value: 'MILEAGE', label: t('fleet.maintRepair.triggerMileage') },
    { value: 'HOURS', label: t('fleet.maintRepair.triggerHours') },
  ];

  const statusLabels: Record<string, string> = {
    SCHEDULED: t('fleet.maintRepair.statusScheduled'),
    OVERDUE: t('fleet.maintRepair.statusOverdue'),
    IN_PROGRESS: t('fleet.maintRepair.statusInProgress'),
    COMPLETED: t('fleet.maintRepair.statusCompleted'),
    upcoming: t('fleet.maintRepair.statusUpcoming'),
    overdue: t('fleet.maintRepair.statusOverdue'),
    completed: t('fleet.maintRepair.statusCompleted'),
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createMaintenanceScheduleRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-maint-schedule-records'] });
      toast.success(t('fleet.maintRepair.toastCreated'));
      closeCreate();
    },
    onError: () => toast.error(t('fleet.maintRepair.toastError')),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fleetApi.completeMaintenanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-maint-schedule-records'] });
      toast.success(t('fleet.maintRepair.toastCompleted'));
      closeComplete();
    },
    onError: () => toast.error(t('fleet.maintRepair.toastError')),
  });

  function openCreate() {
    setFormVehicleId('');
    setFormWorkType('OIL_CHANGE');
    setFormTriggerType('DATE');
    setFormDescription('');
    setFormScheduledDate('');
    setFormScheduledMileage('');
    setFormIntervalDays('');
    setFormIntervalMileage('');
    setFormCost('');
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  function openComplete(rec: MaintenanceScheduleRecord) {
    setSelectedRecord(rec);
    setCompleteActualDate('');
    setCompleteActualMileage('');
    setCompleteActualCost('');
    setCompleteNotes('');
    setShowComplete(true);
  }

  function closeComplete() {
    setShowComplete(false);
    setSelectedRecord(null);
  }

  function handleCreate() {
    createMutation.mutate({
      vehicleId: formVehicleId,
      workType: formWorkType,
      triggerType: formTriggerType,
      description: formDescription,
      scheduledDate: formScheduledDate || undefined,
      scheduledMileage: formScheduledMileage ? Number(formScheduledMileage) : undefined,
      intervalDays: formIntervalDays ? Number(formIntervalDays) : undefined,
      intervalMileage: formIntervalMileage ? Number(formIntervalMileage) : undefined,
      estimatedCost: formCost ? Number(formCost) : undefined,
      maintenanceType: 'scheduled',
    });
  }

  function handleComplete() {
    if (!selectedRecord) return;
    completeMutation.mutate({
      id: selectedRecord.id,
      data: {
        actualDate: completeActualDate,
        actualMileage: completeActualMileage ? Number(completeActualMileage) : undefined,
        cost: completeActualCost ? Number(completeActualCost) : undefined,
        notes: completeNotes || undefined,
      },
    });
  }

  const columns = useMemo<ColumnDef<MaintenanceScheduleRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'vehicleName',
        header: t('fleet.maintRepair.colVehicle'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'workType',
        header: t('fleet.maintRepair.colWorkType'),
        size: 170,
        cell: ({ row }) => {
          const wt = row.original.workType;
          const icon = WORK_TYPE_ICONS[wt] ?? <Wrench className="w-3.5 h-3.5" />;
          const label = wt && WORK_TYPE_KEYS[wt] ? t(WORK_TYPE_KEYS[wt]) : row.original.maintenanceType;
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">{icon}</span>
              <span className="text-sm">{label}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'description',
        header: t('fleet.maintRepair.colDescription'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="truncate text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'scheduled',
        header: t('fleet.maintRepair.colScheduled'),
        size: 140,
        cell: ({ row }) => {
          const r = row.original;
          const dateStr = r.scheduledDate || r.dueDate;
          const mileage = r.scheduledMileage || r.dueMileage;
          return (
            <div className="text-sm">
              {dateStr && <div className="tabular-nums">{formatDate(dateStr)}</div>}
              {mileage != null && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {formatNumber(mileage)} {t('fleet.maintRepair.km')}
                </div>
              )}
              {!dateStr && mileage == null && <span className="text-neutral-400">\u2014</span>}
            </div>
          );
        },
      },
      {
        id: 'actual',
        header: t('fleet.maintRepair.colActual'),
        size: 140,
        cell: ({ row }) => {
          const r = row.original;
          const dateStr = r.actualDate || r.lastPerformed;
          const mileage = r.actualMileage;
          return (
            <div className="text-sm">
              {dateStr && <div className="tabular-nums">{formatDate(dateStr)}</div>}
              {mileage != null && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {formatNumber(mileage)} {t('fleet.maintRepair.km')}
                </div>
              )}
              {!dateStr && mileage == null && <span className="text-neutral-400">\u2014</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'cost',
        header: t('fleet.maintRepair.colCost'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return v != null ? (
            <span className="tabular-nums font-medium">{formatMoney(v)}</span>
          ) : (
            <span className="text-neutral-400">\u2014</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('fleet.maintRepair.colStatus'),
        size: 130,
        cell: ({ getValue, row }) => {
          const s = getValue<string>();
          const isOverdue = s === 'OVERDUE' || s === 'overdue';
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge
                status={s}
                colorMap={maintStatusColorMap}
                label={statusLabels[s] ?? s}
              />
              {isOverdue && (
                <AlertTriangle className="w-3.5 h-3.5 text-danger-500 animate-pulse" />
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => {
          const r = row.original;
          const canComplete =
            r.status === 'SCHEDULED' ||
            r.status === 'OVERDUE' ||
            r.status === 'IN_PROGRESS' ||
            r.status === 'upcoming' ||
            r.status === 'overdue';
          if (!canComplete) return null;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openComplete(r);
              }}
              className="p-1 text-success-500 hover:text-success-700 dark:hover:text-success-300"
              title={t('fleet.maintRepair.actionComplete')}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
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
        title={t('fleet.maintRepair.title')}
        subtitle={t('fleet.maintRepair.subtitle')}
        breadcrumbs={[
          { label: t('fleet.maintRepair.breadcrumbHome'), href: '/' },
          { label: t('fleet.maintRepair.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.maintRepair.breadcrumbMaintRepair') },
        ]}
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('fleet.maintRepair.newRecord')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label={t('fleet.maintRepair.metricScheduled')}
          value={scheduledCount}
        />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label={t('fleet.maintRepair.metricOverdue')}
          value={overdueCount}
        />
        <MetricCard
          icon={<Wrench className="w-5 h-5" />}
          label={t('fleet.maintRepair.metricInProgress')}
          value={inProgressCount}
        />
        <MetricCard
          icon={<CheckCircle className="w-5 h-5" />}
          label={t('fleet.maintRepair.metricCompleted')}
          value={completedCount}
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label={t('fleet.maintRepair.metricTotalCost')}
          value={formatMoney(totalCost)}
        />
      </div>

      {/* Overdue Alert Banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-3">
          <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0" />
          <span className="text-sm font-medium text-danger-700 dark:text-danger-300">
            {t('fleet.maintRepair.overdueAlert', { count: String(overdueCount) })}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
              tab.id === 'OVERDUE' && tab.count > 0 && activeTab !== tab.id
                ? 'text-danger-500 dark:text-danger-400'
                : '',
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1.5 text-xs',
              tab.id === 'OVERDUE' && tab.count > 0 ? 'text-danger-500' : 'text-neutral-400',
            )}>
              ({tab.count})
            </span>
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
            placeholder={t('fleet.maintRepair.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="w-56"
          options={workTypeOptions}
          placeholder={t('fleet.maintRepair.filterAllWorkTypes')}
        />
      </div>

      {/* Color Legend */}
      <div className="flex gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-success-500" />
          {t('fleet.maintRepair.legendUpToDate')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary-500" />
          {t('fleet.maintRepair.legendScheduled')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-warning-500" />
          {t('fleet.maintRepair.legendInProgress')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-danger-500" />
          {t('fleet.maintRepair.legendOverdue')}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={sortedFiltered}
        loading={isLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('fleet.maintRepair.emptyTitle')}
        emptyDescription={t('fleet.maintRepair.emptyDescription')}
      />

      {/* Create Modal */}
      {showCreate && (
        <Modal
          open={showCreate}
          onClose={closeCreate}
          title={t('fleet.maintRepair.modalTitle')}
          size="lg"
        >
          <div className="space-y-4">
            <FormField label={t('fleet.maintRepair.formVehicle')} required>
              <Select
                options={vehicleOptions}
                value={formVehicleId}
                onChange={(e) => setFormVehicleId(e.target.value)}
                placeholder={t('fleet.maintRepair.formVehiclePlaceholder')}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('fleet.maintRepair.formWorkType')} required>
                <Select
                  options={workTypeOptions}
                  value={formWorkType}
                  onChange={(e) => setFormWorkType(e.target.value as MaintenanceWorkType)}
                />
              </FormField>
              <FormField label={t('fleet.maintRepair.formTrigger')}>
                <Select
                  options={triggerTypeOptions}
                  value={formTriggerType}
                  onChange={(e) => setFormTriggerType(e.target.value as MaintTriggerType)}
                />
              </FormField>
            </div>
            <FormField label={t('fleet.maintRepair.formDescription')} required>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('fleet.maintRepair.formDescriptionPlaceholder')}
              />
            </FormField>

            {/* Trigger-specific fields */}
            {formTriggerType === 'DATE' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('fleet.maintRepair.formScheduledDate')}>
                  <Input
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                  />
                </FormField>
                <FormField label={t('fleet.maintRepair.formIntervalDays')}>
                  <Input
                    type="number"
                    value={formIntervalDays}
                    onChange={(e) => setFormIntervalDays(e.target.value)}
                    placeholder={t('fleet.maintRepair.formIntervalDaysPlaceholder')}
                  />
                </FormField>
              </div>
            )}
            {formTriggerType === 'MILEAGE' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('fleet.maintRepair.formScheduledMileage')}>
                  <Input
                    type="number"
                    value={formScheduledMileage}
                    onChange={(e) => setFormScheduledMileage(e.target.value)}
                    placeholder={t('fleet.maintRepair.formScheduledMileagePlaceholder')}
                  />
                </FormField>
                <FormField label={t('fleet.maintRepair.formIntervalMileage')}>
                  <Input
                    type="number"
                    value={formIntervalMileage}
                    onChange={(e) => setFormIntervalMileage(e.target.value)}
                    placeholder={t('fleet.maintRepair.formIntervalMileagePlaceholder')}
                  />
                </FormField>
              </div>
            )}
            {formTriggerType === 'HOURS' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('fleet.maintRepair.formScheduledDate')}>
                  <Input
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                  />
                </FormField>
                <FormField label={t('fleet.maintRepair.formIntervalDays')}>
                  <Input
                    type="number"
                    value={formIntervalDays}
                    onChange={(e) => setFormIntervalDays(e.target.value)}
                    placeholder={t('fleet.maintRepair.formIntervalHoursPlaceholder')}
                  />
                </FormField>
              </div>
            )}

            <FormField label={t('fleet.maintRepair.formCost')}>
              <Input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeCreate}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formVehicleId || !formDescription || createMutation.isPending}
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Modal */}
      {showComplete && selectedRecord && (
        <Modal
          open={showComplete}
          onClose={closeComplete}
          title={t('fleet.maintRepair.completeModalTitle')}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-400">
                <span>{t('fleet.maintRepair.colVehicle')}:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedRecord.vehicleName}
                </span>
                <span>{t('fleet.maintRepair.colWorkType')}:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedRecord.workType && WORK_TYPE_KEYS[selectedRecord.workType]
                    ? t(WORK_TYPE_KEYS[selectedRecord.workType])
                    : selectedRecord.maintenanceType}
                </span>
              </div>
            </div>

            <FormField label={t('fleet.maintRepair.completeActualDate')} required>
              <Input
                type="date"
                value={completeActualDate}
                onChange={(e) => setCompleteActualDate(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.maintRepair.completeActualMileage')}>
              <Input
                type="number"
                value={completeActualMileage}
                onChange={(e) => setCompleteActualMileage(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.maintRepair.completeActualCost')}>
              <Input
                type="number"
                value={completeActualCost}
                onChange={(e) => setCompleteActualCost(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.maintRepair.completeNotes')}>
              <Textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder={t('fleet.maintRepair.completeNotesPlaceholder')}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeComplete}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!completeActualDate || completeMutation.isPending}
              >
                {t('fleet.maintRepair.completeBtn')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceToRepairPage;
