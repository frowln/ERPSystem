import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Shield,
  AlertTriangle,
  XCircle,
  Bug,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { closeoutApi } from '@/api/closeout';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { WarrantyRecord, WarrantyRecordStatus } from './types';

const statusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  active: 'green',
  expiring: 'yellow',
  expired: 'red',
};

const getStatusLabel = (status: WarrantyRecordStatus): string => {
  switch (status) {
    case 'active':
      return t('closeout.warrantyTrackingStatusActive');
    case 'expiring':
      return t('closeout.warrantyTrackingStatusExpiring');
    case 'expired':
      return t('closeout.warrantyTrackingStatusExpired');
    default:
      return status;
  }
};

type TabId = 'all' | 'active' | 'expiring' | 'expired';

const WarrantyTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [detailRecord, setDetailRecord] = useState<WarrantyRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['warranty-records'],
    queryFn: () => closeoutApi.getWarrantyRecords(),
  });

  const filtered = useMemo(() => {
    if (activeTab === 'all') return records;
    return records.filter((r) => r.status === activeTab);
  }, [records, activeTab]);

  const metrics = useMemo(() => {
    const active = records.filter((r) => r.status === 'active').length;
    const expiring = records.filter((r) => r.status === 'expiring').length;
    const expired = records.filter((r) => r.status === 'expired').length;
    const openDefects = records.reduce((sum, r) => sum + r.defectsCount, 0);
    return { active, expiring, expired, openDefects };
  }, [records]);

  const counts = useMemo(
    () => ({
      all: records.length,
      active: metrics.active,
      expiring: metrics.expiring,
      expired: metrics.expired,
    }),
    [records.length, metrics],
  );

  const getDaysColor = (status: WarrantyRecordStatus, days: number) => {
    if (status === 'expired' || days <= 0) return 'text-red-600 dark:text-red-400';
    if (status === 'expiring' || days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const handleRowClick = useCallback((record: WarrantyRecord) => {
    setDetailRecord(record);
  }, []);

  const columns = useMemo<ColumnDef<WarrantyRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'projectName',
        header: t('closeout.warrantyTrackingColProject'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'contractorName',
        header: t('closeout.warrantyTrackingColContractor'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'warrantyStart',
        header: t('closeout.warrantyTrackingColStart'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'warrantyEnd',
        header: t('closeout.warrantyTrackingColEnd'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'defectPeriodDays',
        header: t('closeout.warrantyTrackingColDaysRemaining'),
        size: 130,
        cell: ({ row }) => {
          const days = row.original.defectPeriodDays;
          return (
            <span
              className={`tabular-nums font-medium ${getDaysColor(row.original.status, days)}`}
            >
              {days <= 0
                ? t('closeout.warrantyTrackingStatusExpired')
                : `${days} ${t('closeout.warrantyTrackingDays')}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('closeout.warrantyTrackingColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabel(getValue<WarrantyRecordStatus>())}
          />
        ),
      },
      {
        accessorKey: 'defectsCount',
        header: t('closeout.warrantyTrackingColDefects'),
        size: 100,
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return (
            <span
              className={`tabular-nums font-medium ${count > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}
            >
              {count}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.warrantyTrackingTitle')}
        subtitle={t('closeout.warrantyTrackingSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.warrantyTrackingTitle') },
        ]}
        tabs={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'active', label: t('closeout.warrantyTrackingStatusActive'), count: counts.active },
          { id: 'expiring', label: t('closeout.warrantyTrackingStatusExpiring'), count: counts.expiring },
          { id: 'expired', label: t('closeout.warrantyTrackingStatusExpired'), count: counts.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Shield size={18} />}
          label={t('closeout.warrantyTrackingMetricActive')}
          value={metrics.active}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('closeout.warrantyTrackingMetricExpiring')}
          value={metrics.expiring}
          trend={
            metrics.expiring > 0
              ? { direction: 'up' as const, value: `${metrics.expiring}` }
              : undefined
          }
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('closeout.warrantyTrackingMetricExpired')}
          value={metrics.expired}
        />
        <MetricCard
          icon={<Bug size={18} />}
          label={t('closeout.warrantyTrackingMetricDefects')}
          value={metrics.openDefects}
        />
      </div>

      <DataTable<WarrantyRecord>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.warrantyTrackingEmpty')}
        emptyDescription={t('closeout.warrantyTrackingEmptyDesc')}
      />

      {/* Detail Modal */}
      <Modal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title={t('closeout.warrantyTrackingDetailTitle')}
      >
        {detailRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColProject')}:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {detailRecord.projectName}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColContractor')}:
              </span>
              <span className="text-neutral-900 dark:text-neutral-100">
                {detailRecord.contractorName}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColStart')}:
              </span>
              <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatDate(detailRecord.warrantyStart)}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColEnd')}:
              </span>
              <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatDate(detailRecord.warrantyEnd)}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColDaysRemaining')}:
              </span>
              <span
                className={`tabular-nums font-medium ${getDaysColor(detailRecord.status, detailRecord.defectPeriodDays)}`}
              >
                {detailRecord.defectPeriodDays <= 0
                  ? t('closeout.warrantyTrackingStatusExpired')
                  : `${detailRecord.defectPeriodDays} ${t('closeout.warrantyTrackingDays')}`}
              </span>

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColStatus')}:
              </span>
              <StatusBadge
                status={detailRecord.status}
                colorMap={statusColorMap}
                label={getStatusLabel(detailRecord.status)}
              />

              <span className="text-neutral-500 dark:text-neutral-400">
                {t('closeout.warrantyTrackingColDefects')}:
              </span>
              <span
                className={`tabular-nums font-medium ${detailRecord.defectsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}
              >
                {detailRecord.defectsCount}
              </span>
            </div>

            {/* Warranty terms */}
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                {t('closeout.warrantyTrackingTerms')}
              </h4>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {detailRecord.warrantyTerms || '\u2014'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WarrantyTrackingPage;
