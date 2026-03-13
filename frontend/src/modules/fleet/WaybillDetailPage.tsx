import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Edit2, Trash2, MapPin, Gauge, Fuel, ShieldCheck,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge, waybillStatusColorMap, waybillStatusLabels } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { AuditFooter } from '@/design-system/components/AuditFooter';
import { fleetApi, type FleetWaybill, type WaybillStatus } from '@/api/fleet';
import { formatDate, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const statusTransitions: Record<string, WaybillStatus[]> = {
  DRAFT: ['ISSUED'],
  ISSUED: ['IN_PROGRESS', 'DRAFT'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-right">{children}</span>
    </div>
  );
}

function BoolIndicator({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-success-600">
      <CheckCircle className="w-4 h-4" /> {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-neutral-400">
      <XCircle className="w-4 h-4" /> {falseLabel}
    </span>
  );
}

const WaybillDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const { data: waybill, isLoading } = useQuery<FleetWaybill>({
    queryKey: ['fleet-waybill', id],
    queryFn: () => fleetApi.getWaybill(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: WaybillStatus) => fleetApi.changeWaybillStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybill', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills'] });
      toast.success(t('fleet.waybills.toastStatusChanged'));
    },
    onError: () => toast.error(t('fleet.waybills.toastStatusError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fleetApi.deleteWaybill(id!),
    onSuccess: () => {
      toast.success(t('fleet.waybills.toastDeleted'));
      navigate('/fleet/waybills');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading || !waybill) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const nextStatuses = statusTransitions[waybill.status] ?? [];
  const fuelVariance = waybill.fuelVariancePercent;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('fleet.waybills.detailTitle')} ${waybill.number}`}
        breadcrumbs={[
          { label: t('fleet.waybills.breadcrumbHome'), href: '/' },
          { label: t('fleet.waybills.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.waybills.breadcrumbWaybills'), href: '/fleet/waybills' },
          { label: waybill.number },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/fleet/waybills/${id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-1" />
              {t('fleet.waybills.editButton')}
            </Button>
            <Button variant="danger" size="sm" onClick={async () => {
              const ok = await confirm({
                title: t('fleet.waybills.confirmDeleteTitle'),
                description: t('fleet.waybills.confirmDeleteDescription'),
                confirmLabel: t('fleet.waybills.confirmDeleteConfirm'),
                cancelLabel: t('fleet.waybills.confirmDeleteCancel'),
                confirmVariant: 'danger',
              });
              if (ok) deleteMutation.mutate();
            }}>
              <Trash2 className="w-4 h-4 mr-1" />
              {t('fleet.waybills.deleteButton')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
              <MapPin className="w-5 h-5 text-primary-500" />
              {t('fleet.waybills.sectionRoute')}
            </h3>
            <div className="space-y-0">
              <InfoRow label={t('fleet.waybills.labelNumber')}>{waybill.number}</InfoRow>
              <InfoRow label={t('fleet.waybills.labelDate')}>{formatDate(waybill.waybillDate)}</InfoRow>
              <InfoRow label={t('fleet.waybills.labelVehicle')}>
                {waybill.vehicleName ?? '—'}
                {waybill.vehicleLicensePlate && (
                  <span className="text-neutral-500 ml-2">({waybill.vehicleLicensePlate})</span>
                )}
              </InfoRow>
              {waybill.projectName && <InfoRow label={t('fleet.waybills.labelProject')}>{waybill.projectName}</InfoRow>}
              <InfoRow label={t('fleet.waybills.labelDriver')}>{waybill.driverName || '—'}</InfoRow>
              <InfoRow label={t('fleet.waybills.labelDeparturePoint')}>{waybill.departurePoint || '—'}</InfoRow>
              <InfoRow label={t('fleet.waybills.labelDestinationPoint')}>{waybill.destinationPoint || '—'}</InfoRow>
              {waybill.routeDescription && (
                <InfoRow label={t('fleet.waybills.labelRouteDescription')}>{waybill.routeDescription}</InfoRow>
              )}
              {waybill.departureTime && (
                <InfoRow label={t('fleet.waybills.labelDepartureTime')}>{formatDate(waybill.departureTime)}</InfoRow>
              )}
              {waybill.returnTime && (
                <InfoRow label={t('fleet.waybills.labelReturnTime')}>{formatDate(waybill.returnTime)}</InfoRow>
              )}
            </div>
          </div>

          {/* Mileage & Engine Hours */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
              <Gauge className="w-5 h-5 text-primary-500" />
              {t('fleet.waybills.sectionMileage')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div className="space-y-0">
                <InfoRow label={t('fleet.waybills.labelMileageStart')}>
                  {waybill.mileageStart != null ? `${formatNumber(waybill.mileageStart)} ${t('fleet.waybills.km')}` : '—'}
                </InfoRow>
                <InfoRow label={t('fleet.waybills.labelMileageEnd')}>
                  {waybill.mileageEnd != null ? `${formatNumber(waybill.mileageEnd)} ${t('fleet.waybills.km')}` : '—'}
                </InfoRow>
                <InfoRow label={t('fleet.waybills.labelDistance')}>
                  {waybill.distance != null ? (
                    <span className="font-semibold text-primary-600">{formatNumber(waybill.distance)} {t('fleet.waybills.km')}</span>
                  ) : '—'}
                </InfoRow>
              </div>
              <div className="space-y-0">
                <InfoRow label={t('fleet.waybills.labelEngineHoursStart')}>
                  {waybill.engineHoursStart != null ? `${formatNumber(waybill.engineHoursStart)} ${t('fleet.waybills.hours')}` : '—'}
                </InfoRow>
                <InfoRow label={t('fleet.waybills.labelEngineHoursEnd')}>
                  {waybill.engineHoursEnd != null ? `${formatNumber(waybill.engineHoursEnd)} ${t('fleet.waybills.hours')}` : '—'}
                </InfoRow>
                <InfoRow label={t('fleet.waybills.labelEngineHoursWorked')}>
                  {waybill.engineHoursWorked != null ? (
                    <span className="font-semibold text-primary-600">{formatNumber(waybill.engineHoursWorked)} {t('fleet.waybills.hours')}</span>
                  ) : '—'}
                </InfoRow>
              </div>
            </div>
          </div>

          {/* Fuel */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
              <Fuel className="w-5 h-5 text-primary-500" />
              {t('fleet.waybills.sectionFuel')}
            </h3>
            <div className="space-y-0">
              <InfoRow label={t('fleet.waybills.labelFuelDispensed')}>
                {waybill.fuelDispensed != null ? `${formatNumber(waybill.fuelDispensed)} ${t('fleet.waybills.liters')}` : '—'}
              </InfoRow>
              <InfoRow label={t('fleet.waybills.labelFuelConsumed')}>
                {waybill.fuelConsumed != null ? `${formatNumber(waybill.fuelConsumed)} ${t('fleet.waybills.liters')}` : '—'}
              </InfoRow>
              <InfoRow label={t('fleet.waybills.labelFuelNorm')}>
                {waybill.fuelNorm != null ? `${formatNumber(waybill.fuelNorm)} ${t('fleet.waybills.liters')}` : '—'}
              </InfoRow>
              <InfoRow label={t('fleet.waybills.labelFuelRemaining')}>
                {waybill.fuelRemaining != null ? `${formatNumber(waybill.fuelRemaining)} ${t('fleet.waybills.liters')}` : '—'}
              </InfoRow>
              {fuelVariance != null && (
                <InfoRow label={t('fleet.waybills.labelFuelVariance')}>
                  <span className={fuelVariance > 0 ? 'text-danger-600' : fuelVariance < 0 ? 'text-success-600' : ''}>
                    {fuelVariance > 0 ? '+' : ''}{formatNumber(fuelVariance)}%
                    {' '}
                    ({fuelVariance > 0 ? t('fleet.waybills.fuelOverNorm') : t('fleet.waybills.fuelUnderNorm')})
                  </span>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Pre-trip checks */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              {t('fleet.waybills.sectionPreTrip')}
            </h3>
            <div className="space-y-0">
              <InfoRow label={t('fleet.waybills.labelMedicalExam')}>
                <BoolIndicator
                  value={waybill.medicalExamPassed}
                  trueLabel={t('fleet.waybills.passed')}
                  falseLabel={t('fleet.waybills.notPassed')}
                />
              </InfoRow>
              {waybill.medicalExaminer && (
                <InfoRow label={t('fleet.waybills.labelMedicalExaminer')}>{waybill.medicalExaminer}</InfoRow>
              )}
              <InfoRow label={t('fleet.waybills.labelMechanicApproval')}>
                <BoolIndicator
                  value={waybill.mechanicApproved}
                  trueLabel={t('fleet.waybills.approved')}
                  falseLabel={t('fleet.waybills.notApproved')}
                />
              </InfoRow>
              {waybill.mechanicName && (
                <InfoRow label={t('fleet.waybills.labelMechanicName')}>{waybill.mechanicName}</InfoRow>
              )}
            </div>
          </div>

          {/* Notes */}
          {waybill.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold mb-3">{t('fleet.waybills.sectionNotes')}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{waybill.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-500">{t('fleet.waybills.colStatus')}</span>
              <StatusBadge
                status={waybill.status}
                colorMap={waybillStatusColorMap}
                label={waybillStatusLabels[waybill.status] ?? waybill.status}
                size="md"
              />
            </div>

            {nextStatuses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500 font-medium">{t('fleet.waybills.changeStatus')}</p>
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => statusMutation.mutate(s)}
                    disabled={statusMutation.isPending}
                  >
                    {waybillStatusLabels[s] ?? s}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <AuditFooter data={waybill} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default WaybillDetailPage;
