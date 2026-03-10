import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Camera, Search, MapPin, Calendar, User, Download } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate, formatDateTime } from '@/lib/format';
import type { PhotoCapture } from './types';
import { useMobileSubmissionQueue } from './useMobileSubmissionQueue';
import { mobileApi } from '@/api/mobile';
import { t } from '@/i18n';

const syncStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  synced: 'green',
  pending: 'yellow',
  error: 'red',
  offline: 'gray',
};

const getSyncStatusLabels = (): Record<string, string> => ({
  synced: t('mobileModule.photos.syncSynced'),
  pending: t('mobileModule.photos.syncPending'),
  error: t('mobileModule.photos.syncError'),
  offline: t('mobileModule.photos.syncOffline'),
});

const PhotoCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [syncFilter, setSyncFilter] = useState('');
  const localQueue = useMobileSubmissionQueue();

  const { data: reportData } = useQuery({
    queryKey: ['mobile-photo-reports'],
    queryFn: () => mobileApi.getFieldReports(),
  });

  const photos = useMemo<PhotoCapture[]>(
    () => (reportData?.content ?? []).flatMap((report) => report.photos ?? []),
    [reportData],
  );

  const localQueueStats = useMemo(() => ({
    reports: localQueue.length,
    photos: localQueue.reduce((sum, item) => sum + item.photos.length, 0),
    issues: localQueue.filter((item) => item.status === 'FAILED' || item.status === 'CONFLICT').length,
  }), [localQueue]);

  const filteredPhotos = useMemo(() => {
    let filtered = photos;

    if (syncFilter) {
      filtered = filtered.filter((p) => p.syncStatus === syncFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.caption ?? '').toLowerCase().includes(lower) ||
          p.fileName.toLowerCase().includes(lower) ||
          p.takenByName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [photos, syncFilter, search]);

  const metrics = useMemo(() => ({
    total: photos.length,
    synced: photos.filter((p) => p.syncStatus === 'SYNCED').length,
    pending: photos.filter((p) => p.syncStatus === 'PENDING').length + localQueueStats.photos,
    withGps: photos.filter((p) => p.gpsLatitude != null).length,
  }), [localQueueStats.photos, photos]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('mobileModule.photos.pageTitle')}
        subtitle={t('mobileModule.photos.pageSubtitle', { count: String(photos.length) })}
        breadcrumbs={[
          { label: t('mobileModule.photos.breadcrumbHome'), href: '/' },
          { label: t('mobileModule.photos.breadcrumbMobile') },
          { label: t('mobileModule.photos.breadcrumbPhotos') },
        ]}
        actions={
          <Button iconLeft={<Download size={16} />} onClick={() => toast(t('common.exportStarted'))}>
            {t('mobileModule.photos.downloadSelected')}
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Camera size={18} />} label={t('mobileModule.photos.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Camera size={18} />} label={t('mobileModule.photos.metricSynced')} value={metrics.synced} />
        <MetricCard
          icon={<Camera size={18} />}
          label={t('mobileModule.photos.metricPendingUpload')}
          value={metrics.pending}
          trend={{ direction: metrics.pending > 0 ? 'down' : 'neutral', value: metrics.pending > 0 ? t('mobileModule.photos.syncRequired') : t('mobileModule.photos.allUploaded') }}
        />
        <MetricCard icon={<MapPin size={18} />} label={t('mobileModule.photos.metricWithGps')} value={metrics.withGps} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('mobileModule.photos.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('mobileModule.photos.allStatuses') },
            ...Object.entries(getSyncStatusLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={syncFilter}
          onChange={(e) => setSyncFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {localQueueStats.reports > 0 && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-warning-800">
            {t('mobileModule.photos.localQueue', { photos: String(localQueueStats.photos), reports: String(localQueueStats.reports) })}
            {localQueueStats.issues > 0 && ` ${t('mobileModule.photos.localQueueIssues', { count: String(localQueueStats.issues) })}`}
          </p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/mobile/dashboard')}>
            {t('mobileModule.photos.syncCenter')}
          </Button>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow group"
          >
            {/* Photo placeholder */}
            <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center relative">
              <Camera size={32} className="text-neutral-300" />
              <div className="absolute top-2 right-2">
                <StatusBadge
                  status={photo.syncStatus}
                  colorMap={syncStatusColorMap}
                  label={getSyncStatusLabels()[photo.syncStatus]}
                />
              </div>
              {photo.gpsLatitude && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-neutral-900/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  <MapPin size={10} />
                  GPS
                </div>
              )}
            </div>

            {/* Photo info */}
            <div className="p-3">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2">
                {photo.caption ?? photo.fileName}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <User size={12} />
                  <span>{photo.takenByName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <Calendar size={12} />
                  <span>{formatDate(photo.takenAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="text-center py-16">
          <Camera size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('mobileModule.photos.emptyTitle')}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('mobileModule.photos.emptyDescription')}</p>
        </div>
      )}
    </div>
  );
};

export default PhotoCapturePage;
