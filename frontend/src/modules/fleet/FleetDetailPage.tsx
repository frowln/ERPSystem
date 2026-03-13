import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Truck, MapPin, Calendar, Fuel, Wrench, ClipboardCheck, Clock, User, QrCode,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { fleetApi } from '@/api/fleet';
import { t } from '@/i18n';
import { QrCodeButton } from '@/components/QrCode';
import type { Vehicle, VehicleAssignment, MaintenanceRecord, FuelRecord, InspectionRecord } from '@/api/fleet';

const vehicleStatusColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'orange' | 'gray'> = { available: 'green', in_use: 'blue', maintenance: 'yellow', repair: 'orange', decommissioned: 'gray', AVAILABLE: 'green', IN_USE: 'blue', MAINTENANCE: 'yellow', REPAIR: 'orange', DECOMMISSIONED: 'gray' };
const getVehicleStatusLabels = (): Record<string, string> => ({ available: t('fleet.detail.statusAvailable'), in_use: t('fleet.detail.statusInUse'), maintenance: t('fleet.detail.statusMaintenance'), repair: t('fleet.detail.statusRepair'), decommissioned: t('fleet.detail.statusDecommissioned'), AVAILABLE: t('fleet.detail.statusAvailable'), IN_USE: t('fleet.detail.statusInUse'), MAINTENANCE: t('fleet.detail.statusMaintenance'), REPAIR: t('fleet.detail.statusRepair'), DECOMMISSIONED: t('fleet.detail.statusDecommissioned') });
const assignmentStatusMap: Record<string, 'green' | 'blue' | 'gray'> = { active: 'green', completed: 'gray', cancelled: 'gray', ACTIVE: 'green', COMPLETED: 'gray', CANCELLED: 'gray' };
const getAssignmentStatusLabels = (): Record<string, string> => ({ active: t('fleet.detail.assignmentActive'), completed: t('fleet.detail.assignmentCompleted'), cancelled: t('fleet.detail.assignmentCancelled'), ACTIVE: t('fleet.detail.assignmentActive'), COMPLETED: t('fleet.detail.assignmentCompleted'), CANCELLED: t('fleet.detail.assignmentCancelled') });
const maintenanceStatusMap: Record<string, 'yellow' | 'blue' | 'green'> = { scheduled: 'yellow', in_progress: 'blue', completed: 'green', SCHEDULED: 'yellow', IN_PROGRESS: 'blue', COMPLETED: 'green' };
const getMaintenanceStatusLabels = (): Record<string, string> => ({ scheduled: t('fleet.detail.maintenanceScheduled'), in_progress: t('fleet.detail.maintenanceInProgress'), completed: t('fleet.detail.maintenanceCompleted'), SCHEDULED: t('fleet.detail.maintenanceScheduled'), IN_PROGRESS: t('fleet.detail.maintenanceInProgress'), COMPLETED: t('fleet.detail.maintenanceCompleted') });
const inspectionResultMap: Record<string, 'green' | 'red' | 'yellow'> = { passed: 'green', failed: 'red', conditional: 'yellow', PASSED: 'green', FAILED: 'red', CONDITIONAL: 'yellow' };
const getInspectionResultLabels = (): Record<string, string> => ({ PASSED: t('fleet.detail.inspectionPassed'), FAILED: t('fleet.detail.inspectionFailed'), CONDITIONAL: t('fleet.detail.inspectionConditional'), passed: t('fleet.detail.inspectionPassed'), failed: t('fleet.detail.inspectionFailed'), conditional: t('fleet.detail.inspectionConditional') });

type TabId = 'assignments' | 'maintenance' | 'fuel' | 'inspections';

const FleetDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicleData, isLoading } = useQuery<Vehicle>({
    queryKey: ['fleet-vehicle', id],
    queryFn: () => fleetApi.getVehicle(id!),
    enabled: !!id,
  });

  if (isLoading || !vehicleData) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }
  const vehicle = vehicleData;
  const [activeTab, setActiveTab] = useState<TabId>('assignments');

  const assignmentColumns = useMemo<ColumnDef<VehicleAssignment, unknown>[]>(() => {
    const assignmentStatusLabels = getAssignmentStatusLabels();
    return [
      { accessorKey: 'projectName', header: t('fleet.detail.colProject'), size: 200 },
      { accessorKey: 'operatorName', header: t('fleet.detail.colOperator'), size: 160 },
      { accessorKey: 'startDate', header: t('fleet.detail.colStart'), size: 120, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
      { accessorKey: 'endDate', header: t('fleet.detail.colEnd'), size: 120, cell: ({ getValue }) => { const v = getValue<string>(); return v ? <span className="tabular-nums">{formatDate(v)}</span> : <span className="text-neutral-400">—</span>; } },
      { accessorKey: 'status', header: t('fleet.detail.colStatus'), size: 120, cell: ({ getValue }) => { const s = getValue<string>(); return <StatusBadge status={s} colorMap={assignmentStatusMap} label={assignmentStatusLabels[s] ?? s} />; } },
      { accessorKey: 'hoursUsed', header: t('fleet.detail.colEngineHours'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
    ];
  }, []);

  const maintenanceColumns = useMemo<ColumnDef<MaintenanceRecord, unknown>[]>(() => {
    const maintenanceStatusLabels = getMaintenanceStatusLabels();
    return [
      { accessorKey: 'description', header: t('fleet.detail.colDescription'), size: 260 },
      { accessorKey: 'type', header: t('fleet.detail.colMaintType'), size: 120, cell: ({ getValue }) => { const getM = (): Record<string, string> => ({ scheduled: t('fleet.detail.maintTypeScheduled'), repair: t('fleet.detail.maintTypeRepair'), inspection: t('fleet.detail.maintTypeInspection') }); const m = getM(); return <span className="text-neutral-600">{m[getValue<string>()] ?? getValue<string>()}</span>; } },
      { accessorKey: 'scheduledDate', header: t('fleet.detail.colDate'), size: 120, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
      { accessorKey: 'COST', header: t('fleet.detail.colCost'), size: 140, cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatMoney(getValue<number>())}</span> },
      { accessorKey: 'performedBy', header: t('fleet.detail.colPerformer'), size: 180 },
      { accessorKey: 'status', header: t('fleet.detail.colStatus'), size: 130, cell: ({ getValue }) => { const s = getValue<string>(); return <StatusBadge status={s} colorMap={maintenanceStatusMap} label={maintenanceStatusLabels[s] ?? s} />; } },
    ];
  }, []);

  const fuelColumns = useMemo<ColumnDef<FuelRecord, unknown>[]>(() => [
    { accessorKey: 'date', header: t('fleet.detail.colDate'), size: 120, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    { accessorKey: 'quantity', header: t('fleet.detail.colQuantityLiters'), size: 120, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    { accessorKey: 'unitPrice', header: t('fleet.detail.colPricePerLiter'), size: 120, cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span> },
    { accessorKey: 'totalCost', header: t('fleet.detail.colAmount'), size: 140, cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatMoney(getValue<number>())}</span> },
    { accessorKey: 'odometer', header: t('fleet.detail.colEngineHours'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
    { accessorKey: 'filledBy', header: t('fleet.detail.colFilledBy'), size: 160 },
  ], []);

  const inspectionColumns = useMemo<ColumnDef<InspectionRecord, unknown>[]>(() => {
    const inspectionResultLabels = getInspectionResultLabels();
    return [
      { accessorKey: 'date', header: t('fleet.detail.colInspectionDate'), size: 130, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
      { accessorKey: 'inspectorName', header: t('fleet.detail.colInspector'), size: 160 },
      { accessorKey: 'result', header: t('fleet.detail.colResult'), size: 130, cell: ({ getValue }) => { const s = getValue<string>(); return <StatusBadge status={s} colorMap={inspectionResultMap} label={inspectionResultLabels[s] ?? s} />; } },
      { accessorKey: 'notes', header: t('fleet.detail.colNotes'), size: 300, cell: ({ getValue }) => <span className="text-neutral-600">{getValue<string>()}</span> },
      { accessorKey: 'nextInspectionDate', header: t('fleet.detail.colNextInspection'), size: 150, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    ];
  }, []);

  const vehicleStatusLabels = getVehicleStatusLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={vehicle.name}
        subtitle={`${vehicle.code} | ${vehicle.brand} ${vehicle.model}, ${vehicle.year}`}
        backTo="/fleet"
        breadcrumbs={[
          { label: t('fleet.detail.breadcrumbHome'), href: '/' },
          { label: t('fleet.detail.breadcrumbFleet'), href: '/fleet' },
          { label: vehicle.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <QrCodeButton
              url={`${window.location.origin}/fleet/${vehicle.id}`}
              label={vehicle.name}
              sublabel={vehicle.code}
            />
            <Button variant="secondary" onClick={() => navigate(`/fleet/${vehicle.id}/edit`)}>{t('fleet.detail.edit')}</Button>
          </div>
        }
      />

      {/* Vehicle info card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex gap-6">
          {/* Photo placeholder */}
          <div className="w-48 h-36 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-300 flex-shrink-0">
            <Truck size={48} strokeWidth={1} />
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoStatus')}</p>
              <StatusBadge status={vehicle.status} colorMap={vehicleStatusColorMap} label={vehicleStatusLabels[vehicle.status] ?? vehicle.status} />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoLicensePlate')}</p>
              <p className="text-sm font-mono font-medium text-neutral-900 dark:text-neutral-100">{vehicle.licensePlate || '\u2014'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoCurrentProject')}</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{vehicle.projectName ?? '---'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoOperator')}</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{vehicle.currentOperator ?? '---'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoEngineHours')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(vehicle.operatingHours)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoFuel')}</p>
              <p className="text-sm text-neutral-900 dark:text-neutral-100">{vehicle.fuelType}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoLastMaintenance')}</p>
              <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(vehicle.lastMaintenanceDate ?? '')}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('fleet.detail.infoNextMaintenance')}</p>
              <p className="text-sm font-medium text-warning-600">{formatDate(vehicle.nextMaintenanceDate ?? '')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 flex gap-0 mb-4">
        {([
          { id: 'assignments' as const, label: t('fleet.detail.tabAssignments'), icon: MapPin },
          { id: 'maintenance' as const, label: t('fleet.detail.tabMaintenance'), icon: Wrench },
          { id: 'fuel' as const, label: t('fleet.detail.tabFuel'), icon: Fuel },
          { id: 'inspections' as const, label: t('fleet.detail.tabInspections'), icon: ClipboardCheck },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
              'hover:text-neutral-700 dark:hover:text-neutral-300',
              activeTab === id
                ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 after:rounded-t'
                : 'text-neutral-500 dark:text-neutral-400',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'assignments' && (
        <DataTable<VehicleAssignment> data={[]} columns={assignmentColumns} pageSize={10} emptyTitle={t('fleet.detail.emptyAssignments')} enableExport />
      )}
      {activeTab === 'maintenance' && (
        <DataTable<MaintenanceRecord> data={[]} columns={maintenanceColumns} pageSize={10} emptyTitle={t('fleet.detail.emptyMaintenance')} enableExport />
      )}
      {activeTab === 'fuel' && (
        <DataTable<FuelRecord> data={[]} columns={fuelColumns} pageSize={10} emptyTitle={t('fleet.detail.emptyFuel')} enableExport />
      )}
      {activeTab === 'inspections' && (
        <DataTable<InspectionRecord> data={[]} columns={inspectionColumns} pageSize={10} emptyTitle={t('fleet.detail.emptyInspections')} enableExport />
      )}
    </div>
  );
};

export default FleetDetailPage;
