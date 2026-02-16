import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ClipboardCheck,
  Package,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { closeoutApi } from '@/api/closeout';
import { formatPercent, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { CommissioningChecklist, WarrantyClaim, HandoverPackage } from './types';

const checklistStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  ON_HOLD: 'orange',
};

const getChecklistStatusLabels = (): Record<string, string> => ({
  NOT_STARTED: t('closeout.commStatusNotStarted'),
  IN_PROGRESS: t('closeout.commStatusInProgress'),
  COMPLETED: t('closeout.commStatusCompleted'),
  FAILED: t('closeout.commStatusFailed'),
  ON_HOLD: t('closeout.commStatusOnHold'),
});

const warrantyStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'cyan'> = {
  OPEN: 'yellow',
  IN_REVIEW: 'blue',
  APPROVED: 'cyan',
  IN_REPAIR: 'orange',
  RESOLVED: 'green',
  REJECTED: 'red',
  CLOSED: 'gray',
};

const getWarrantyStatusLabels = (): Record<string, string> => ({
  OPEN: t('closeout.warrantyStatusOpen'),
  IN_REVIEW: t('closeout.warrantyStatusInReview'),
  APPROVED: t('closeout.warrantyStatusApproved'),
  IN_REPAIR: t('closeout.warrantyStatusInRepair'),
  RESOLVED: t('closeout.warrantyStatusResolved'),
  REJECTED: t('closeout.warrantyStatusRejected'),
  CLOSED: t('closeout.warrantyStatusClosed'),
});

const CloseoutDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: commData,
    isError: commissioningError,
    refetch: refetchCommissioning,
  } = useQuery({
    queryKey: ['dashboard-commissioning'],
    queryFn: () => closeoutApi.getCommissioningChecklists({ page: 0, size: 5 }),
  });

  const {
    data: warrantyData,
    isError: warrantyError,
    refetch: refetchWarranty,
  } = useQuery({
    queryKey: ['dashboard-warranty'],
    queryFn: () => closeoutApi.getWarrantyClaims({ page: 0, size: 5 }),
  });

  const {
    data: handoverData,
    isError: handoverError,
    refetch: refetchHandover,
  } = useQuery({
    queryKey: ['dashboard-handover'],
    queryFn: () => closeoutApi.getHandoverPackages({ page: 0, size: 50 }),
  });

  const checklists = commData?.content ?? [];
  const claims = warrantyData?.content ?? [];
  const packages = handoverData?.content ?? [];

  const metrics = useMemo(() => {
    const totalChecklists = commData?.totalElements ?? checklists.length;
    const completedChecklists = checklists.filter((checklist) => checklist.status === 'COMPLETED').length;
    const openClaims = claims.filter((claim) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(claim.status)).length;
    const totalWarrantyCost = claims.reduce((sum, claim) => sum + (claim.estimatedCost ?? 0), 0);
    const pendingPackages = packages.filter((pkg) => ['DRAFT', 'PREPARED', 'SUBMITTED'].includes(pkg.status)).length;

    return {
      totalChecklists,
      completedChecklists,
      openClaims,
      totalWarrantyCost,
      pendingPackages,
    };
  }, [checklists, claims, packages, commData]);

  const checklistStatusLabels = getChecklistStatusLabels();
  const warrantyStatusLabels = getWarrantyStatusLabels();

  const commColumns = useMemo<ColumnDef<CommissioningChecklist, unknown>[]>(
    () => [
      {
        accessorKey: 'checklistNumber',
        header: t('closeout.dashboardColNumber'),
        size: 120,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'systemName',
        header: t('closeout.dashboardColSystem'),
        size: 220,
      },
      {
        accessorKey: 'status',
        header: t('closeout.dashboardColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={checklistStatusColorMap}
            label={checklistStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'progress',
        header: t('closeout.dashboardColProgress'),
        size: 130,
        cell: ({ row }) => {
          const progressPercent = row.original.totalItems > 0
            ? (row.original.completedItems / row.original.totalItems) * 100
            : 0;
          return <span className="text-sm tabular-nums">{formatPercent(progressPercent)}</span>;
        },
      },
    ],
    [checklistStatusLabels],
  );

  const claimColumns = useMemo<ColumnDef<WarrantyClaim, unknown>[]>(
    () => [
      {
        accessorKey: 'claimNumber',
        header: t('closeout.dashboardColClaimNumber'),
        size: 120,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'title',
        header: t('closeout.dashboardColDefect'),
        size: 260,
        cell: ({ getValue }) => <span className="truncate max-w-[240px] block">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: t('closeout.dashboardColClaimStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={warrantyStatusColorMap}
            label={warrantyStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'estimatedCost',
        header: t('closeout.dashboardColEstimate'),
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
    ],
    [warrantyStatusLabels],
  );

  const isFatal = checklists.length === 0 && claims.length === 0 && packages.length === 0
    && commissioningError && warrantyError && handoverError;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.dashboardTitle')}
        subtitle={t('closeout.dashboardSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout') },
        ]}
      />

      {isFatal ? (
        <EmptyState
          variant="ERROR"
          title={t('closeout.dashboardErrorTitle')}
          description={t('closeout.dashboardErrorDesc')}
          actionLabel={t('closeout.retryAction')}
          onAction={() => {
            void Promise.all([
              refetchCommissioning(),
              refetchWarranty(),
              refetchHandover(),
            ]);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard icon={<ClipboardCheck size={18} />} label={t('closeout.dashboardMetricTotalChecklists')} value={metrics.totalChecklists} />
            <MetricCard icon={<CheckCircle2 size={18} />} label={t('closeout.dashboardMetricCompletedCommissioning')} value={metrics.completedChecklists} />
            <MetricCard icon={<Package size={18} />} label={t('closeout.dashboardMetricPendingPackages')} value={metrics.pendingPackages} subtitle={t('closeout.dashboardMetricPendingSubtitle')} />
            <MetricCard
              icon={<ShieldAlert size={18} />}
              label={t('closeout.dashboardMetricOpenClaims')}
              value={metrics.openClaims}
              trend={{ direction: metrics.openClaims > 2 ? 'up' : 'neutral', value: t('closeout.dashboardPiecesUnit', { count: String(metrics.openClaims) }) }}
            />
            <MetricCard icon={<TrendingUp size={18} />} label={t('closeout.dashboardMetricRepairCost')} value={formatMoney(metrics.totalWarrantyCost)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => navigate('/closeout/commissioning')}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <ClipboardCheck size={20} className="text-primary-600" />
                <ArrowRight size={16} className="text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.dashboardCommissioningCard')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('closeout.dashboardCommissioningCardDesc')}</p>
            </button>

            <button
              onClick={() => navigate('/closeout/handover')}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Package size={20} className="text-primary-600" />
                <ArrowRight size={16} className="text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.dashboardHandoverCard')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('closeout.dashboardHandoverCardDesc')}</p>
            </button>

            <button
              onClick={() => navigate('/closeout/warranty')}
              className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert size={20} className="text-primary-600" />
                <ArrowRight size={16} className="text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.dashboardWarrantyCard')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('closeout.dashboardWarrantyCardDesc')}</p>
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.dashboardRecentChecks')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/closeout/commissioning')}>
                {t('closeout.dashboardAllChecks')}
              </Button>
            </div>
            <DataTable<CommissioningChecklist>
              data={checklists}
              columns={commColumns}
              onRowClick={(checklist) => navigate(`/closeout/commissioning/${checklist.id}`)}
              pageSize={5}
              emptyTitle={t('closeout.dashboardEmptyChecks')}
              emptyDescription={t('closeout.dashboardEmptyChecksDesc')}
            />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('closeout.dashboardActiveWarranty')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/closeout/warranty')}>
                {t('closeout.dashboardAllClaims')}
              </Button>
            </div>
            <DataTable<WarrantyClaim>
              data={claims}
              columns={claimColumns}
              onRowClick={(claim) => navigate(`/closeout/warranty/${claim.id}`)}
              pageSize={5}
              emptyTitle={t('closeout.dashboardEmptyClaims')}
              emptyDescription={t('closeout.dashboardEmptyClaimsDesc')}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CloseoutDashboardPage;
