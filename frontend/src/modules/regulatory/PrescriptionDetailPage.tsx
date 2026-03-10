import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Scale,
  FileText,
  ExternalLink,
  Calendar,
  User,
  Building,
  Hash,
  DollarSign,
  Shield,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  prescriptionStatusColorMap,
  prescriptionStatusLabels,
  regulatoryBodyTypeColorMap,
  regulatoryBodyTypeLabels,
} from '@/design-system/components/StatusBadge';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { Select } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate, formatMoney } from '@/lib/format';
import toast from 'react-hot-toast';
import type { Prescription, PrescriptionStatus } from './types';
import { t } from '@/i18n';

const STATUS_OPTIONS: { value: PrescriptionStatus; label: string }[] = [
  { value: 'RECEIVED', label: t('regulatory.prescription.statusReceived') },
  { value: 'UNDER_REVIEW', label: t('regulatory.prescription.statusUnderReview') },
  { value: 'IN_PROGRESS', label: t('regulatory.prescription.statusInProgress') },
  { value: 'RESPONSE_SUBMITTED', label: t('regulatory.prescription.statusResponseSubmitted') },
  { value: 'COMPLETED', label: t('regulatory.prescription.statusCompleted') },
  { value: 'CLOSED', label: t('regulatory.prescription.statusClosed') },
];

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-neutral-400 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
        <div className="text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

const PrescriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDelete, setShowDelete] = useState(false);
  const [statusToChange, setStatusToChange] = useState('');

  const { data: prescription, isLoading } = useQuery<Prescription>({
    queryKey: ['prescription', id],
    queryFn: () => regulatoryApi.getPrescription(id!),
    enabled: !!id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: PrescriptionStatus) => regulatoryApi.changePrescriptionStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success(t('regulatory.toastStatusChanged'));
      setStatusToChange('');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const appealMutation = useMutation({
    mutationFn: () => regulatoryApi.fileAppeal(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success(t('regulatory.toastAppealFiled'));
    },
    onError: () => {
      toast.error(t('regulatory.toastAppealExpired'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => regulatoryApi.deletePrescription(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success(t('regulatory.toastPrescriptionDeleted'));
      navigate('/regulatory/prescriptions');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deadlineInfo = useMemo(() => {
    if (!prescription) return null;
    const days = prescription.daysUntilDeadline ?? 0;
    if (prescription.overdue) {
      return {
        type: 'overdue' as const,
        title: t('regulatory.warningOverdue'),
        desc: t('regulatory.warningOverdueDesc', { days: String(Math.abs(days)) }),
      };
    }
    if (days >= 0 && days <= 14) {
      return {
        type: 'approaching' as const,
        title: t('regulatory.warningApproachingDeadline'),
        desc: t('regulatory.warningApproachingDeadlineDesc', { days: String(days) }),
      };
    }
    return null;
  }, [prescription]);

  if (isLoading || !prescription) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleStatusChange = () => {
    if (statusToChange) {
      changeStatusMutation.mutate(statusToChange as PrescriptionStatus);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.prescriptionDetailTitle', { number: prescription.number })}
        subtitle={
          prescription.regulatoryBodyTypeDisplayName
            ? t('regulatory.prescriptionDetailSubtitle', { bodyType: prescription.regulatoryBodyTypeDisplayName })
            : undefined
        }
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory/dashboard' },
          { label: t('regulatory.breadcrumbPrescriptions'), href: '/regulatory/prescriptions' },
          { label: prescription.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/regulatory/prescriptions')}>
              <ArrowLeft size={16} className="mr-1" />
              {t('common.back')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Edit2 size={14} />}
              onClick={() => navigate(`/regulatory/prescriptions/${id}/edit`)}
            >
              {t('regulatory.prescriptionBtnEdit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setShowDelete(true)}>
              {t('regulatory.btnDeletePrescription')}
            </Button>
          </div>
        }
      />

      {/* Overdue / approaching deadline banner */}
      {deadlineInfo && (
        <div
          className={`rounded-lg border p-4 mb-6 flex items-start gap-3 ${
            deadlineInfo.type === 'overdue'
              ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
              : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
          }`}
        >
          <AlertTriangle
            size={20}
            className={deadlineInfo.type === 'overdue' ? 'text-danger-500 shrink-0 mt-0.5' : 'text-warning-500 shrink-0 mt-0.5'}
          />
          <div>
            <p
              className={`font-semibold text-sm ${
                deadlineInfo.type === 'overdue' ? 'text-danger-800 dark:text-danger-200' : 'text-warning-800 dark:text-warning-200'
              }`}
            >
              {deadlineInfo.title}
            </p>
            <p
              className={`text-sm mt-0.5 ${
                deadlineInfo.type === 'overdue' ? 'text-danger-700 dark:text-danger-300' : 'text-warning-700 dark:text-warning-300'
              }`}
            >
              {deadlineInfo.desc}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('regulatory.sectionPrescriptionDetails')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              {prescription.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <InfoRow
                icon={<Hash size={16} />}
                label={t('regulatory.labelPrescriptionNumber')}
                value={<span className="font-mono">{prescription.number}</span>}
              />
              <InfoRow
                icon={<Shield size={16} />}
                label={t('regulatory.labelBodyType')}
                value={
                  prescription.regulatoryBodyType ? (
                    <StatusBadge
                      status={prescription.regulatoryBodyType}
                      colorMap={regulatoryBodyTypeColorMap}
                      label={regulatoryBodyTypeLabels[prescription.regulatoryBodyType] ?? prescription.regulatoryBodyType}
                    />
                  ) : (
                    '---'
                  )
                }
              />
              <InfoRow
                icon={<Building size={16} />}
                label={t('regulatory.labelProject')}
                value={prescription.projectName ?? '---'}
              />
              <InfoRow
                icon={<User size={16} />}
                label={t('regulatory.prescriptionLabelResponsible')}
                value={prescription.responsibleName ?? '---'}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label={t('regulatory.labelReceivedDate')}
                value={prescription.receivedDate ? formatDate(prescription.receivedDate) : '---'}
              />
              <InfoRow
                icon={<Clock size={16} />}
                label={t('regulatory.labelDeadline')}
                value={prescription.deadline ? formatDate(prescription.deadline) : '---'}
              />
              {prescription.regulatoryReference && (
                <InfoRow
                  icon={<FileText size={16} />}
                  label={t('regulatory.labelRegulatoryReference')}
                  value={prescription.regulatoryReference}
                />
              )}
              <InfoRow
                icon={<AlertTriangle size={16} />}
                label={t('regulatory.labelViolationCount')}
                value={String(prescription.violationCount)}
              />
            </div>
          </div>

          {/* Financial card */}
          {(prescription.fineAmount || prescription.correctiveActionCost) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('regulatory.sectionFinancial')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {prescription.fineAmount != null && (
                  <InfoRow
                    icon={<DollarSign size={16} />}
                    label={t('regulatory.labelFineAmount')}
                    value={
                      <span className="text-danger-600 dark:text-danger-400 font-semibold">
                        {formatMoney(prescription.fineAmount)}
                      </span>
                    }
                  />
                )}
                {prescription.correctiveActionCost != null && (
                  <InfoRow
                    icon={<DollarSign size={16} />}
                    label={t('regulatory.labelCorrectiveActionCost')}
                    value={formatMoney(prescription.correctiveActionCost)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {prescription.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('regulatory.labelNotes')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Documents */}
          {(prescription.evidenceUrl || prescription.responseLetterUrl) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('regulatory.labelEvidenceUrl')}
              </h3>
              <div className="space-y-2">
                {prescription.evidenceUrl && (
                  <a
                    href={prescription.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink size={14} />
                    {t('regulatory.labelEvidenceUrl')}
                  </a>
                )}
                {prescription.responseLetterUrl && (
                  <a
                    href={prescription.responseLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink size={14} />
                    {t('regulatory.labelResponseLetterUrl')}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('regulatory.colPrescriptionStatus')}
            </h4>
            <StatusBadge
              status={prescription.status}
              colorMap={prescriptionStatusColorMap}
              label={prescriptionStatusLabels[prescription.status] ?? prescription.status}
              size="md"
            />

            {/* Change status */}
            <div className="mt-4 space-y-2">
              <Select
                options={[{ value: '', label: t('regulatory.btnChangeStatus') }, ...STATUS_OPTIONS]}
                value={statusToChange}
                onChange={(e) => setStatusToChange(e.target.value)}
              />
              {statusToChange && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleStatusChange}
                  loading={changeStatusMutation.isPending}
                >
                  {t('regulatory.btnChangeStatus')}
                </Button>
              )}
            </div>

            {/* Appeal button */}
            {prescription.appealWindowOpen && !prescription.appealFiled && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  iconLeft={<Scale size={14} />}
                  onClick={() => appealMutation.mutate()}
                  loading={appealMutation.isPending}
                >
                  {t('regulatory.btnFileAppeal')}
                </Button>
                {prescription.appealDeadline && (
                  <p className="text-xs text-neutral-500 mt-1.5 text-center">
                    {t('regulatory.labelAppealDeadline')}: {formatDate(prescription.appealDeadline)}
                  </p>
                )}
              </div>
            )}

            {prescription.appealFiled && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                  <Scale size={12} className="inline mr-1" />
                  {t('regulatory.tabAppealed')}
                </p>
                {prescription.appealDate && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                    {formatDate(prescription.appealDate)}
                  </p>
                )}
              </div>
            )}

            {!prescription.appealWindowOpen && !prescription.appealFiled && prescription.appealDeadline && (
              <p className="text-xs text-neutral-500 mt-3">{t('regulatory.appealWindowClosed')}</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('regulatory.sectionTimeline')}
            </h4>
            <div className="space-y-3 text-xs">
              {prescription.receivedDate && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-neutral-500">{formatDate(prescription.receivedDate)}</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{t('regulatory.tabReceived')}</span>
                </div>
              )}
              {prescription.responseSubmittedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-neutral-500">{formatDate(prescription.responseSubmittedAt)}</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {prescriptionStatusLabels['RESPONSE_SUBMITTED']}
                  </span>
                </div>
              )}
              {prescription.appealDate && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-neutral-500">{formatDate(prescription.appealDate)}</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{t('regulatory.tabAppealed')}</span>
                </div>
              )}
              {prescription.completedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-neutral-500">{formatDate(prescription.completedAt)}</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{t('regulatory.tabCompleted')}</span>
                </div>
              )}
              {prescription.createdAt && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                  <span className="text-neutral-500">{formatDate(prescription.createdAt)}</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{t('common.created')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('regulatory.confirmDeletePrescription')}
        description={t('regulatory.confirmDeletePrescriptionDesc')}
        confirmLabel={t('regulatory.confirmDeletePrescriptionBtn')}
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PrescriptionDetailPage;
