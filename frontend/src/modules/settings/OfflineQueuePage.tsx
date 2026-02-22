import React, { useMemo, useState, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { RefreshCw, Trash2, RotateCcw, WifiOff, CheckCircle } from 'lucide-react';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useOfflineQueue, type OfflineRequest } from '@/stores/offlineQueue';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatAge(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return t('offline.queue.justNow');
  if (diffMin < 60) return t('offline.queue.minutesAgo').replace('{count}', String(diffMin));
  const diffHr = Math.floor(diffMin / 60);
  return t('offline.queue.hoursAgo').replace('{count}', String(diffHr));
}

// ---------------------------------------------------------------------------
// Status color map
// ---------------------------------------------------------------------------

const queueStatusColorMap: Record<string, string> = {
  pending: 'yellow',
  failed: 'red',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OfflineQueuePage: React.FC = () => {
  const queue = useOfflineQueue((s) => s.queue);
  const removeRequest = useOfflineQueue((s) => s.removeRequest);
  const clearQueue = useOfflineQueue((s) => s.clearQueue);
  const triggerSync = useOfflineQueue((s) => s.triggerSync);
  const { isOnline } = useOfflineStatus();

  const [clearModalOpen, setClearModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  const totalQueued = queue.length;
  const failedCount = 0; // Store does not track per-item failure state yet
  const oldestAge = useMemo(() => {
    if (queue.length === 0) return '\u2014';
    const oldest = Math.min(...queue.map((r) => r.timestamp));
    return formatAge(oldest);
  }, [queue]);

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------

  const columns = useMemo<ColumnDef<OfflineRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'description',
        header: () => t('offline.queue.colDescription'),
        cell: ({ row }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {row.original.description || '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'url',
        header: () => t('offline.queue.colUrl'),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[240px] block">
            {row.original.url}
          </span>
        ),
      },
      {
        accessorKey: 'method',
        header: () => t('offline.queue.colMethod'),
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {row.original.method}
          </span>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: () => t('offline.queue.colTimestamp'),
        cell: ({ row }) => (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatTimestamp(row.original.timestamp)}
          </span>
        ),
      },
      {
        id: 'status',
        header: () => t('offline.queue.colStatus'),
        cell: () => (
          <StatusBadge
            status="pending"
            colorMap={queueStatusColorMap}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={t('offline.queue.retry')}
              onClick={() => {
                triggerSync();
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t('offline.queue.delete')}
              onClick={() => removeRequest(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [removeRequest, triggerSync],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSyncNow = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const handleClearConfirm = useCallback(() => {
    clearQueue();
    setClearModalOpen(false);
  }, [clearQueue]);

  // ---------------------------------------------------------------------------
  // Breadcrumbs
  // ---------------------------------------------------------------------------

  const breadcrumbs = useMemo(
    () => [
      { label: t('offline.queue.breadcrumbHome'), href: '/' },
      { label: t('offline.queue.breadcrumbSettings'), href: '/settings' },
      { label: t('offline.queue.breadcrumbQueue') },
    ],
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('offline.queue.title')}
        subtitle={t('offline.queue.subtitle')}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSyncNow}
              disabled={!isOnline || queue.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t('offline.queue.syncNow')}
            </Button>
            <Button
              variant="danger"
              onClick={() => setClearModalOpen(true)}
              disabled={queue.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('offline.queue.clearAll')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<WifiOff className="h-5 w-5" />}
          label={t('offline.queue.metricQueued')}
          value={totalQueued}
        />
        <MetricCard
          icon={<Trash2 className="h-5 w-5" />}
          label={t('offline.queue.metricFailed')}
          value={failedCount}
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={t('offline.queue.metricOldest')}
          value={oldestAge}
        />
      </div>

      {/* Queue Table */}
      {queue.length === 0 ? (
        <EmptyState
          title={t('offline.queue.empty')}
          description={t('offline.queue.emptyDescription')}
        />
      ) : (
        <DataTable<OfflineRequest>
          data={queue}
          columns={columns}
          loading={false}
          pageSize={20}
          tableLabel={t('offline.queue.title')}
        />
      )}

      {/* Clear Confirmation Modal */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title={t('offline.queue.clearConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('offline.queue.clearConfirmDescription')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setClearModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleClearConfirm}>
              {t('offline.queue.clearConfirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OfflineQueuePage;
