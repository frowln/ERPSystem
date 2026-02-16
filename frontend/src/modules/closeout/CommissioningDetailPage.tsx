import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ClipboardCheck, Calendar, User, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatDateTime, formatPercent } from '@/lib/format';
import { t } from '@/i18n';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  ON_HOLD: 'orange',
};

const getStatusLabels = (): Record<string, string> => ({
  NOT_STARTED: t('closeout.commStatusNotStarted'),
  IN_PROGRESS: t('closeout.commStatusInProgress'),
  COMPLETED: t('closeout.commStatusCompleted'),
  FAILED: t('closeout.commStatusFailed'),
  ON_HOLD: t('closeout.commStatusOnHold'),
});

const CommissioningDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: checklist,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['commissioning-checklist', id],
    queryFn: () => closeoutApi.getCommissioningChecklist(id!),
    enabled: Boolean(id),
  });

  const statusLabels = getStatusLabels();

  if (!id) {
    return <EmptyState variant="ERROR" title={t('closeout.commDetailInvalidId')} />;
  }

  if (isError && !checklist) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('closeout.commDetailChecklistTitle')}
          breadcrumbs={[
            { label: t('closeout.breadcrumbHome'), href: '/' },
            { label: t('closeout.breadcrumbCommissioning'), href: '/closeout/commissioning' },
          ]}
          actions={(
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/commissioning')}>
              {t('closeout.backToList')}
            </Button>
          )}
        />
        <EmptyState
          variant="ERROR"
          title={t('closeout.commDetailErrorTitle')}
          description={t('closeout.checkConnection')}
          actionLabel={t('closeout.retryAction')}
          onAction={() => { void refetch(); }}
        />
      </div>
    );
  }

  if (isLoading && !checklist) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400">
        {t('closeout.commDetailLoading')}
      </div>
    );
  }

  if (!checklist) {
    return <EmptyState variant="ERROR" title={t('closeout.commDetailNotFound')} />;
  }

  const progressPercent = checklist.totalItems > 0
    ? (checklist.completedItems / checklist.totalItems) * 100
    : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={checklist.checklistNumber}
        subtitle={checklist.systemName}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCommissioning'), href: '/closeout/commissioning' },
          { label: checklist.checklistNumber },
        ]}
        actions={(
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/commissioning')}>
            {t('closeout.backToList')}
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.commDetailStatusAndProgress')}</h3>
              <StatusBadge
                status={checklist.status}
                colorMap={statusColorMap}
                label={statusLabels[checklist.status] ?? checklist.status}
              />
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-2">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-sm text-neutral-600">{t('closeout.commDetailCompletion', { percent: formatPercent(progressPercent) })}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('closeout.commDetailResultsTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('closeout.commDetailTotalItems')}</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{checklist.totalItems}</p>
              </div>
              <div className="rounded-lg border border-success-200 bg-success-50 p-4">
                <p className="text-xs text-success-700 mb-1">{t('closeout.commDetailPassed')}</p>
                <p className="text-lg font-semibold text-success-700 flex items-center gap-1">
                  <CheckCircle2 size={16} />
                  {checklist.passedItems}
                </p>
              </div>
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                <p className="text-xs text-danger-700 mb-1">{t('closeout.commDetailFailed')}</p>
                <p className="text-lg font-semibold text-danger-700 flex items-center gap-1">
                  <XCircle size={16} />
                  {checklist.failedItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('closeout.commDetailNotesTitle')}</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{checklist.notes ?? t('closeout.commDetailNoNotes')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
            <InfoRow icon={<ClipboardCheck size={14} />} label={t('closeout.commDetailSystem')} value={checklist.systemName} />
            <InfoRow icon={<ClipboardCheck size={14} />} label={t('closeout.commDetailSubsystem')} value={checklist.subsystem ?? '\u2014'} />
            <InfoRow icon={<User size={14} />} label={t('closeout.commDetailInspector')} value={checklist.inspectorName} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.commDetailInspectionDate')} value={formatDate(checklist.inspectionDate)} />
            <InfoRow icon={<Building2 size={14} />} label={t('closeout.commDetailProject')} value={checklist.projectName} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.commDetailCreatedAt')} value={formatDateTime(checklist.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-neutral-400 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-sm text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  </div>
);

export default CommissioningDetailPage;
