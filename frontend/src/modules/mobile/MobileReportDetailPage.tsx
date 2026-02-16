import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Cloud, FileText, MapPin, Thermometer, Users } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { mobileApi } from '@/api/mobile';
import { formatDate, formatDateTime } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import type { PhotoCapture } from './types';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const reportStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  REVIEWED: 'yellow',
  APPROVED: 'green',
};

const getReportStatusLabels = (): Record<string, string> => ({
  DRAFT: t('mobileModule.reportDetail.statusDraft'),
  SUBMITTED: t('mobileModule.reportDetail.statusSubmitted'),
  REVIEWED: t('mobileModule.reportDetail.statusReviewed'),
  APPROVED: t('mobileModule.reportDetail.statusApproved'),
});

const syncStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  SYNCED: 'green',
  PENDING: 'yellow',
  ERROR: 'red',
  OFFLINE: 'gray',
};

const getSyncStatusLabels = (): Record<string, string> => ({
  SYNCED: t('mobileModule.reportDetail.syncSynced'),
  PENDING: t('mobileModule.reportDetail.syncPending'),
  ERROR: t('mobileModule.reportDetail.syncError'),
  OFFLINE: t('mobileModule.reportDetail.syncOffline'),
});

const MobileReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['mobile-field-report', id],
    queryFn: () => mobileApi.getFieldReport(id!),
    enabled: Boolean(id),
    retry: 0,
  });

  const { data: photos } = useQuery({
    queryKey: ['mobile-field-report-photos', id],
    queryFn: () => mobileApi.getPhotos(id!),
    enabled: Boolean(id),
    retry: 0,
  });

  const submitMutation = useMutation({
    mutationFn: () => mobileApi.submitFieldReport(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-field-report', id] });
      queryClient.invalidateQueries({ queryKey: ['mobile-field-reports'] });
      toast.success(t('mobileModule.reportDetail.submitSuccess'));
    },
    onError: () => {
      toast.error(t('mobileModule.reportDetail.submitError'));
    },
  });

  if (!id) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('mobileModule.reportDetail.notFoundTitle')}
          subtitle={t('mobileModule.reportDetail.notFoundSubtitle')}
          backTo="/mobile/reports"
        />
      </div>
    );
  }

  const reportPhotos: PhotoCapture[] = photos ?? report?.photos ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={report?.title ?? t('mobileModule.reportDetail.defaultTitle')}
        subtitle={report?.number ?? t('mobileModule.reportDetail.defaultSubtitle')}
        backTo="/mobile/reports"
        breadcrumbs={[
          { label: t('mobileModule.reportDetail.breadcrumbHome'), href: '/' },
          { label: t('mobileModule.reportDetail.breadcrumbMobile'), href: '/mobile/dashboard' },
          { label: t('mobileModule.reportDetail.breadcrumbReports'), href: '/mobile/reports' },
          { label: report?.number ?? t('mobileModule.reportDetail.breadcrumbReport') },
        ]}
        actions={
          report && report.status === 'DRAFT' ? (
            <Button
              loading={submitMutation.isPending}
              onClick={() => {
                if (guardDemoModeAction(t('mobileModule.reportDetail.demoSubmitAction'))) return;
                submitMutation.mutate();
              }}
            >
              {t('mobileModule.reportDetail.submitForReview')}
            </Button>
          ) : undefined
        }
      />

      {isError && (
        <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          {t('mobileModule.reportDetail.loadError')}
        </div>
      )}

      {!isLoading && !report && !isError && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-sm text-neutral-600">
          {t('mobileModule.reportDetail.notFoundOrUnavailable')}
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<CalendarDays size={18} />}
              label={t('mobileModule.reportDetail.reportDate')}
              value={formatDate(report.reportDate)}
            />
            <MetricCard
              icon={<Users size={18} />}
              label={t('mobileModule.reportDetail.workersOnSite')}
              value={report.workersOnSite ?? '---'}
            />
            <MetricCard
              icon={<FileText size={18} />}
              label={t('mobileModule.reportDetail.photos')}
              value={reportPhotos.length}
            />
            <MetricCard
              icon={<Cloud size={18} />}
              label={t('mobileModule.reportDetail.weather')}
              value={report.weatherCondition ?? '---'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('mobileModule.reportDetail.reportSummary')}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelStatus')}</span>
                  <StatusBadge
                    status={report.status}
                    colorMap={reportStatusColorMap}
                    label={getReportStatusLabels()[report.status] ?? report.status}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelSync')}</span>
                  <StatusBadge
                    status={report.syncStatus}
                    colorMap={syncStatusColorMap}
                    label={getSyncStatusLabels()[report.syncStatus] ?? report.syncStatus}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelProject')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{report.projectName ?? '---'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelAuthor')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{report.authorName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelCreated')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{formatDateTime(report.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelUpdated')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100">{formatDateTime(report.updatedAt)}</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelLocation')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100 text-right inline-flex items-center gap-1">
                    <MapPin size={13} />
                    {report.location ?? '---'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.labelTemperature')}</span>
                  <span className="text-neutral-900 dark:text-neutral-100 inline-flex items-center gap-1">
                    <Thermometer size={13} />
                    {report.temperature != null ? `${report.temperature}°C` : '---'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('mobileModule.reportDetail.workDescription')}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {report.description || t('mobileModule.reportDetail.noDescription')}
              </p>

              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('mobileModule.reportDetail.photoDocumentation')}</h4>
                {reportPhotos.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('mobileModule.reportDetail.noPhotos')}</p>
                ) : (
                  <div className="space-y-2">
                    {reportPhotos.map((photo) => (
                      <div key={photo.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
                        <div>
                          <p className="text-sm text-neutral-900 dark:text-neutral-100">{photo.fileName}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateTime(photo.takenAt)}</p>
                        </div>
                        <StatusBadge
                          status={photo.syncStatus}
                          colorMap={syncStatusColorMap}
                          label={getSyncStatusLabels()[photo.syncStatus] ?? photo.syncStatus}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="secondary" onClick={() => navigate('/mobile/reports')}>
              {t('mobileModule.reportDetail.backToList')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileReportDetailPage;
