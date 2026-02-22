import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Edit2, Trash2, Fuel } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { AuditFooter } from '@/design-system/components/AuditFooter';
import { fleetApi, type EquipmentUsageLog } from '@/api/fleet';
import { formatDate, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-right">{children}</span>
    </div>
  );
}

const UsageLogDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const { data: logEntry, isLoading } = useQuery<EquipmentUsageLog>({
    queryKey: ['fleet-usage-log', id],
    queryFn: () => fleetApi.getUsageLog(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => fleetApi.deleteUsageLog(id!),
    onSuccess: () => {
      toast.success(t('fleet.usageLogs.toastDeleted'));
      navigate('/fleet/usage-logs');
    },
  });

  if (isLoading || !logEntry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('fleet.usageLogs.detailTitle')} — ${formatDate(logEntry.usageDate)}`}
        breadcrumbs={[
          { label: t('fleet.usageLogs.breadcrumbHome'), href: '/' },
          { label: t('fleet.usageLogs.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.usageLogs.breadcrumbUsageLogs'), href: '/fleet/usage-logs' },
          { label: formatDate(logEntry.usageDate) },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/fleet/usage-logs/${id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-1" />
              {t('fleet.usageLogs.editButton')}
            </Button>
            <Button variant="danger" size="sm" onClick={async () => {
              const ok = await confirm({
                title: t('fleet.usageLogs.confirmDeleteTitle'),
                description: t('fleet.usageLogs.confirmDeleteDescription'),
                confirmLabel: t('fleet.usageLogs.confirmDeleteConfirm'),
                cancelLabel: t('fleet.usageLogs.confirmDeleteCancel'),
                confirmVariant: 'danger',
              });
              if (ok) deleteMutation.mutate();
            }}>
              <Trash2 className="w-4 h-4 mr-1" />
              {t('fleet.usageLogs.deleteButton')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
              <Clock className="w-5 h-5 text-primary-500" />
              {t('fleet.usageLogs.labelHoursWorked')}
            </h3>
            <div className="space-y-0">
              <InfoRow label={t('fleet.usageLogs.labelDate')}>{formatDate(logEntry.usageDate)}</InfoRow>
              <InfoRow label={t('fleet.usageLogs.labelVehicle')}>{logEntry.vehicleName ?? '—'}</InfoRow>
              {logEntry.projectName && (
                <InfoRow label={t('fleet.usageLogs.labelProject')}>{logEntry.projectName}</InfoRow>
              )}
              <InfoRow label={t('fleet.usageLogs.labelOperator')}>{logEntry.operatorName || '—'}</InfoRow>
              <InfoRow label={t('fleet.usageLogs.labelHoursWorked')}>
                <span className="font-semibold text-primary-600">
                  {formatNumber(logEntry.hoursWorked)} {t('fleet.usageLogs.hours')}
                </span>
              </InfoRow>
              {logEntry.hoursStart != null && (
                <InfoRow label={t('fleet.usageLogs.labelHoursStart')}>
                  {formatNumber(logEntry.hoursStart)} {t('fleet.usageLogs.hours')}
                </InfoRow>
              )}
              {logEntry.hoursEnd != null && (
                <InfoRow label={t('fleet.usageLogs.labelHoursEnd')}>
                  {formatNumber(logEntry.hoursEnd)} {t('fleet.usageLogs.hours')}
                </InfoRow>
              )}
            </div>
          </div>

          {/* Fuel */}
          {logEntry.fuelConsumed != null && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                <Fuel className="w-5 h-5 text-primary-500" />
                {t('fleet.usageLogs.labelFuelConsumed')}
              </h3>
              <InfoRow label={t('fleet.usageLogs.labelFuelConsumed')}>
                {formatNumber(logEntry.fuelConsumed)} {t('fleet.usageLogs.liters')}
              </InfoRow>
            </div>
          )}

          {/* Description */}
          {logEntry.description && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold mb-3">{t('fleet.usageLogs.labelDescription')}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{logEntry.description}</p>
            </div>
          )}

          {/* Notes */}
          {logEntry.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold mb-3">{t('fleet.usageLogs.labelNotes')}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{logEntry.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <AuditFooter data={logEntry} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageLogDetailPage;
