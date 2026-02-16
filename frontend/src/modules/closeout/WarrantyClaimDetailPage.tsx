import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert, Calendar, User, Building2, MapPin, Wrench } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'cyan'> = {
  OPEN: 'yellow',
  IN_REVIEW: 'blue',
  APPROVED: 'cyan',
  IN_REPAIR: 'orange',
  RESOLVED: 'green',
  REJECTED: 'red',
  CLOSED: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  OPEN: t('closeout.warrantyStatusOpen'),
  IN_REVIEW: t('closeout.warrantyStatusInReview'),
  APPROVED: t('closeout.warrantyStatusApproved'),
  IN_REPAIR: t('closeout.warrantyStatusInRepair'),
  RESOLVED: t('closeout.warrantyStatusResolved'),
  REJECTED: t('closeout.warrantyStatusRejected'),
  CLOSED: t('closeout.warrantyStatusClosed'),
});

const getDefectTypeLabels = (): Record<string, string> => ({
  STRUCTURAL: t('closeout.defectTypeStructural'),
  MECHANICAL: t('closeout.defectTypeMechanical'),
  ELECTRICAL: t('closeout.defectTypeElectrical'),
  PLUMBING: t('closeout.defectTypePlumbing'),
  FINISHING: t('closeout.defectTypeFinishing'),
  WATERPROOFING: t('closeout.defectTypeWaterproofing'),
  OTHER: t('closeout.defectTypeOther'),
});

const WarrantyClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: claim,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['warranty-claim', id],
    queryFn: () => closeoutApi.getWarrantyClaim(id!),
    enabled: Boolean(id),
  });

  const statusLabels = getStatusLabels();
  const defectTypeLabels = getDefectTypeLabels();

  if (!id) {
    return <EmptyState variant="ERROR" title={t('closeout.warrantyDetailInvalidId')} />;
  }

  if (isError && !claim) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('closeout.warrantyDetailTitle')}
          breadcrumbs={[
            { label: t('closeout.breadcrumbHome'), href: '/' },
            { label: t('closeout.breadcrumbWarranty'), href: '/closeout/warranty' },
          ]}
          actions={(
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/warranty')}>
              {t('closeout.backToList')}
            </Button>
          )}
        />
        <EmptyState
          variant="ERROR"
          title={t('closeout.warrantyDetailErrorTitle')}
          description={t('closeout.checkConnection')}
          actionLabel={t('closeout.retryAction')}
          onAction={() => { void refetch(); }}
        />
      </div>
    );
  }

  if (isLoading && !claim) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400">
        {t('closeout.warrantyDetailLoading')}
      </div>
    );
  }

  if (!claim) {
    return <EmptyState variant="ERROR" title={t('closeout.warrantyDetailNotFound')} />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={claim.claimNumber}
        subtitle={claim.title}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbWarranty'), href: '/closeout/warranty' },
          { label: claim.claimNumber },
        ]}
        actions={(
          <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/closeout/warranty')}>
            {t('closeout.backToList')}
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.warrantyDetailStatusTitle')}</h3>
              <StatusBadge
                status={claim.status}
                colorMap={statusColorMap}
                label={statusLabels[claim.status] ?? claim.status}
              />
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{claim.description}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('closeout.warrantyDetailFinanceTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('closeout.warrantyDetailEstimatedCost')}</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(claim.estimatedCost)}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('closeout.warrantyDetailActualCost')}</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(claim.actualCost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-3">
            <InfoRow icon={<ShieldAlert size={14} />} label={t('closeout.warrantyDetailDefectType')} value={defectTypeLabels[claim.defectType] ?? claim.defectType} />
            <InfoRow icon={<Building2 size={14} />} label={t('closeout.warrantyDetailProject')} value={claim.projectName} />
            <InfoRow icon={<MapPin size={14} />} label={t('closeout.warrantyDetailLocation')} value={claim.location ?? '\u2014'} />
            <InfoRow icon={<User size={14} />} label={t('closeout.warrantyDetailReporter')} value={claim.reportedByName} />
            <InfoRow icon={<Wrench size={14} />} label={t('closeout.warrantyDetailAssignee')} value={claim.assignedToName ?? '\u2014'} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.warrantyDetailReportedDate')} value={formatDate(claim.reportedDate)} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.warrantyDetailWarrantyExpiry')} value={formatDate(claim.warrantyExpiryDate)} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.warrantyDetailResolvedDate')} value={formatDate(claim.resolvedDate)} />
            <InfoRow icon={<Calendar size={14} />} label={t('closeout.warrantyDetailCreatedAt')} value={formatDateTime(claim.createdAt)} />
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

export default WarrantyClaimDetailPage;
