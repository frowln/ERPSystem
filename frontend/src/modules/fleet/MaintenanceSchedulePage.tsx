import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  CalendarClock,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import {
  fleetApi,
  type MaintenanceScheduleRule,
  type MaintenanceDueItem,
  type ComplianceDashboard,
  type ComplianceItem,
} from '@/api/fleet';
import { useVehicleOptions } from '@/hooks/useSelectOptions';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

type TabId = 'rules' | 'due' | 'compliance';

const activeColorMap = { yes: 'green' as const, no: 'gray' as const };
const overdueColorMap = { overdue: 'red' as const, approaching: 'yellow' as const };
const expiredColorMap = { expired: 'red' as const };

const getMaintenanceTypeOptions = () => [
  { value: 'SCHEDULED', label: t('fleet.schedule.typeScheduled') },
  { value: 'UNSCHEDULED', label: t('fleet.schedule.typeUnscheduled') },
  { value: 'REPAIR', label: t('fleet.schedule.typeRepair') },
  { value: 'INSPECTION', label: t('fleet.schedule.typeInspection') },
];

const MaintenanceSchedulePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('rules');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MaintenanceScheduleRule | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formType, setFormType] = useState('SCHEDULED');
  const [formIntervalHours, setFormIntervalHours] = useState('');
  const [formIntervalMileage, setFormIntervalMileage] = useState('');
  const [formIntervalDays, setFormIntervalDays] = useState('');
  const [formLeadTimeHours, setFormLeadTimeHours] = useState('');
  const [formLeadTimeMileage, setFormLeadTimeMileage] = useState('');
  const [formLeadTimeDays, setFormLeadTimeDays] = useState('');
  const [formAllVehicles, setFormAllVehicles] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  const { options: vehicleOptions } = useVehicleOptions();

  // --- Queries ---
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['fleet-schedule-rules'],
    queryFn: () => fleetApi.getScheduleRules({ size: 200, page: 0 }),
    enabled: activeTab === 'rules',
  });

  const { data: dueItems, isLoading: dueLoading } = useQuery({
    queryKey: ['fleet-schedule-due'],
    queryFn: () => fleetApi.getDueMaintenanceItems(),
    enabled: activeTab === 'due',
  });

  const { data: compliance, isLoading: compLoading } = useQuery({
    queryKey: ['fleet-schedule-compliance'],
    queryFn: () => fleetApi.getComplianceDashboard(),
    enabled: activeTab === 'compliance',
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createScheduleRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedule-rules'] });
      toast.success(t('fleet.schedule.toastRuleCreated'));
      closeForm();
    },
    onError: () => toast.error(t('fleet.schedule.toastError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fleetApi.updateScheduleRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedule-rules'] });
      toast.success(t('fleet.schedule.toastRuleUpdated'));
      closeForm();
    },
    onError: () => toast.error(t('fleet.schedule.toastError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fleetApi.deleteScheduleRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedule-rules'] });
      toast.success(t('fleet.schedule.toastRuleDeleted'));
    },
    onError: () => toast.error(t('fleet.schedule.toastError')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fleetApi.toggleScheduleRule(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-schedule-rules'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // --- Helpers ---
  function openCreate() {
    setEditingRule(null);
    setFormName('');
    setFormDescription('');
    setFormVehicleId('');
    setFormType('SCHEDULED');
    setFormIntervalHours('');
    setFormIntervalMileage('');
    setFormIntervalDays('');
    setFormLeadTimeHours('50');
    setFormLeadTimeMileage('500');
    setFormLeadTimeDays('7');
    setFormAllVehicles(false);
    setFormNotes('');
    setShowForm(true);
  }

  function openEdit(rule: MaintenanceScheduleRule) {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description ?? '');
    setFormVehicleId(rule.vehicleId ?? '');
    setFormType(rule.maintenanceType);
    setFormIntervalHours(rule.intervalHours?.toString() ?? '');
    setFormIntervalMileage(rule.intervalMileage?.toString() ?? '');
    setFormIntervalDays(rule.intervalDays?.toString() ?? '');
    setFormLeadTimeHours(rule.leadTimeHours?.toString() ?? '50');
    setFormLeadTimeMileage(rule.leadTimeMileage?.toString() ?? '500');
    setFormLeadTimeDays(rule.leadTimeDays?.toString() ?? '7');
    setFormAllVehicles(rule.appliesToAllVehicles);
    setFormNotes(rule.notes ?? '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRule(null);
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      name: formName,
      description: formDescription || null,
      vehicleId: formVehicleId || null,
      maintenanceType: formType,
      intervalHours: formIntervalHours ? Number(formIntervalHours) : null,
      intervalMileage: formIntervalMileage ? Number(formIntervalMileage) : null,
      intervalDays: formIntervalDays ? Number(formIntervalDays) : null,
      leadTimeHours: formLeadTimeHours ? Number(formLeadTimeHours) : null,
      leadTimeMileage: formLeadTimeMileage ? Number(formLeadTimeMileage) : null,
      leadTimeDays: formLeadTimeDays ? Number(formLeadTimeDays) : null,
      appliesToAllVehicles: formAllVehicles,
      notes: formNotes || null,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const rules = rulesData?.content ?? [];

  // --- Rules columns ---
  const rulesColumns = useMemo<ColumnDef<MaintenanceScheduleRule>[]>(
    () => [
      { accessorKey: 'name', header: t('fleet.schedule.colName'), size: 200 },
      {
        accessorKey: 'vehicleName',
        header: t('fleet.schedule.colVehicle'),
        cell: ({ row }) =>
          row.original.appliesToAllVehicles
            ? t('fleet.schedule.allVehicles')
            : row.original.vehicleName ?? t('fleet.schedule.specificVehicle'),
      },
      {
        accessorKey: 'maintenanceTypeDisplayName',
        header: t('fleet.schedule.colType'),
      },
      {
        accessorKey: 'intervalHours',
        header: t('fleet.schedule.colIntervalHours'),
        cell: ({ row }) => row.original.intervalHours ? formatNumber(row.original.intervalHours) : '—',
      },
      {
        accessorKey: 'intervalMileage',
        header: t('fleet.schedule.colIntervalMileage'),
        cell: ({ row }) => row.original.intervalMileage ? formatNumber(row.original.intervalMileage) : '—',
      },
      {
        accessorKey: 'intervalDays',
        header: t('fleet.schedule.colIntervalDays'),
        cell: ({ row }) => row.original.intervalDays ?? '—',
      },
      {
        accessorKey: 'isActive',
        header: t('fleet.schedule.colActive'),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isActive ? 'yes' : 'no'}
            colorMap={activeColorMap}
            label={row.original.isActive ? t('fleet.schedule.active') : t('fleet.schedule.inactive')}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleMutation.mutate({ id: row.original.id, active: !row.original.isActive })}
            >
              {row.original.isActive ? '⏸' : '▶'}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // --- Due items columns ---
  const dueColumns = useMemo<ColumnDef<MaintenanceDueItem>[]>(
    () => [
      { accessorKey: 'vehicleName', header: t('fleet.schedule.colVehicle'), size: 200 },
      { accessorKey: 'ruleName', header: t('fleet.schedule.colRule') },
      { accessorKey: 'maintenanceType', header: t('fleet.schedule.colType') },
      {
        accessorKey: 'triggerReason',
        header: t('fleet.schedule.colTrigger'),
        cell: ({ row }) =>
          t(`fleet.schedule.trigger${row.original.triggerReason}` as 'fleet.schedule.triggerHOURS_EXCEEDED'),
      },
      {
        accessorKey: 'currentHours',
        header: t('fleet.schedule.colCurrentHours'),
        cell: ({ row }) => row.original.currentHours != null ? formatNumber(row.original.currentHours) : '—',
      },
      {
        accessorKey: 'thresholdHours',
        header: t('fleet.schedule.colThresholdHours'),
        cell: ({ row }) => row.original.thresholdHours != null ? formatNumber(row.original.thresholdHours) : '—',
      },
      {
        accessorKey: 'currentMileage',
        header: t('fleet.schedule.colCurrentMileage'),
        cell: ({ row }) => row.original.currentMileage != null ? formatNumber(row.original.currentMileage) : '—',
      },
      {
        accessorKey: 'thresholdMileage',
        header: t('fleet.schedule.colThresholdMileage'),
        cell: ({ row }) => row.original.thresholdMileage != null ? formatNumber(row.original.thresholdMileage) : '—',
      },
      {
        accessorKey: 'overdue',
        header: t('fleet.schedule.colOverdue'),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.overdue ? 'overdue' : 'approaching'}
            colorMap={overdueColorMap}
            label={row.original.overdue ? t('fleet.schedule.overdue') : t('fleet.schedule.approaching')}
          />
        ),
      },
    ],
    [],
  );

  // --- Compliance alert columns ---
  const complianceColumns = useMemo<ColumnDef<ComplianceItem>[]>(
    () => [
      { accessorKey: 'vehicleCode', header: t('fleet.schedule.colVehicle'), size: 120 },
      { accessorKey: 'vehicleName', header: t('fleet.schedule.colName'), size: 200 },
      { accessorKey: 'expiryDate', header: t('fleet.schedule.colExpiryDate') },
      {
        accessorKey: 'daysRemaining',
        header: t('fleet.schedule.colDaysRemaining'),
        cell: ({ row }) =>
          row.original.expired ? (
            <StatusBadge status="expired" colorMap={expiredColorMap} label={t('fleet.schedule.expired')} />
          ) : (
            <span className="text-sm tabular-nums">
              {row.original.daysRemaining} {t('fleet.schedule.daysLeft')}
            </span>
          ),
      },
    ],
    [],
  );

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'rules', label: t('fleet.schedule.tabRules'), icon: CalendarClock },
    { id: 'due', label: t('fleet.schedule.tabDue'), icon: AlertTriangle },
    { id: 'compliance', label: t('fleet.schedule.tabCompliance'), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.schedule.title')}
        subtitle={t('fleet.schedule.subtitle')}
        breadcrumbs={[
          { label: t('fleet.schedule.breadcrumbHome'), href: '/' },
          { label: t('fleet.schedule.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.schedule.breadcrumbSchedule') },
        ]}
        actions={
          activeTab === 'rules' ? (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              {t('fleet.schedule.newRule')}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <DataTable
          columns={rulesColumns}
          data={rules}
          loading={rulesLoading}
          emptyTitle={t('fleet.schedule.rulesEmpty')}
          emptyDescription={t('fleet.schedule.rulesEmptyDesc')}
        />
      )}

      {/* Due Items Tab */}
      {activeTab === 'due' && (
        <DataTable
          columns={dueColumns}
          data={dueItems ?? []}
          loading={dueLoading}
          emptyTitle={t('fleet.schedule.dueEmpty')}
          emptyDescription={t('fleet.schedule.dueEmptyDesc')}
        />
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <ComplianceTab data={compliance} loading={compLoading} columns={complianceColumns} />
      )}

      {/* Rule Form Modal */}
      {showForm && (
        <Modal
          open={showForm}
          onClose={closeForm}
          title={t('fleet.schedule.formTitle')}
        >
          <div className="space-y-4">
            <FormField label={t('fleet.schedule.formName')} required>
              <Input
                placeholder={t('fleet.schedule.formNamePlaceholder')}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.schedule.formDescription')}>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </FormField>
            <FormField label={t('fleet.schedule.formType')}>
              <Select
                options={getMaintenanceTypeOptions()}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </FormField>
            {!formAllVehicles && (
              <FormField label={t('fleet.schedule.formVehicle')}>
                <Select
                  options={[{ value: '', label: t('fleet.schedule.formVehiclePlaceholder') }, ...vehicleOptions]}
                  value={formVehicleId}
                  onChange={(e) => setFormVehicleId(e.target.value)}
                />
              </FormField>
            )}
            <Checkbox
              label={t('fleet.schedule.formAllVehicles')}
              checked={formAllVehicles}
              onChange={(e) => setFormAllVehicles(e.target.checked)}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('fleet.schedule.formIntervalHours')}>
                <Input
                  type="number"
                  value={formIntervalHours}
                  onChange={(e) => setFormIntervalHours(e.target.value)}
                />
              </FormField>
              <FormField label={t('fleet.schedule.formIntervalMileage')}>
                <Input
                  type="number"
                  value={formIntervalMileage}
                  onChange={(e) => setFormIntervalMileage(e.target.value)}
                />
              </FormField>
              <FormField label={t('fleet.schedule.formIntervalDays')}>
                <Input
                  type="number"
                  value={formIntervalDays}
                  onChange={(e) => setFormIntervalDays(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label={t('fleet.schedule.formLeadTimeHours')}>
                <Input
                  type="number"
                  value={formLeadTimeHours}
                  onChange={(e) => setFormLeadTimeHours(e.target.value)}
                />
              </FormField>
              <FormField label={t('fleet.schedule.formLeadTimeMileage')}>
                <Input
                  type="number"
                  value={formLeadTimeMileage}
                  onChange={(e) => setFormLeadTimeMileage(e.target.value)}
                />
              </FormField>
              <FormField label={t('fleet.schedule.formLeadTimeDays')}>
                <Input
                  type="number"
                  value={formLeadTimeDays}
                  onChange={(e) => setFormLeadTimeDays(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label={t('fleet.schedule.formNotes')}>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={closeForm}>
                {t('fleet.schedule.formBtnCancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName || createMutation.isPending || updateMutation.isPending}
              >
                {editingRule ? t('fleet.schedule.formBtnUpdate') : t('fleet.schedule.formBtnCreate')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Compliance Sub-component ---
function ComplianceTab({
  data,
  loading,
  columns,
}: {
  data?: ComplianceDashboard;
  loading: boolean;
  columns: ColumnDef<ComplianceItem>[];
}) {
  if (loading || !data) {
    return <div className="py-12 text-center text-neutral-500">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard
          label={t('fleet.schedule.metricTotal')}
          value={data.totalVehicles}
          icon={<Truck className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricOverdue')}
          value={data.overdueMaintenanceCount}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricApproaching')}
          value={data.approachingMaintenanceCount}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricExpiredIns')}
          value={data.expiredInsuranceCount}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricExpiringIns')}
          value={data.expiringInsuranceCount}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricExpiredTech')}
          value={data.expiredTechInspectionCount}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <MetricCard
          label={t('fleet.schedule.metricExpiringTech')}
          value={data.expiringTechInspectionCount}
          icon={<CalendarDays className="w-5 h-5" />}
        />
      </div>

      {/* Insurance alerts */}
      {data.insuranceAlerts.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">{t('fleet.schedule.sectionInsurance')}</h3>
          <DataTable columns={columns} data={data.insuranceAlerts} />
        </div>
      )}

      {/* Tech inspection alerts */}
      {data.techInspectionAlerts.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">{t('fleet.schedule.sectionTechInspection')}</h3>
          <DataTable columns={columns} data={data.techInspectionAlerts} />
        </div>
      )}

      {data.insuranceAlerts.length === 0 && data.techInspectionAlerts.length === 0 && (
        <div className="py-8 text-center text-neutral-500">
          {t('fleet.schedule.dueEmptyDesc')}
        </div>
      )}
    </div>
  );
}

export default MaintenanceSchedulePage;
