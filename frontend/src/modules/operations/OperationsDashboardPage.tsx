import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList, Wrench, Users, Truck, TrendingUp,
  Calendar, AlertTriangle, CheckCircle2, BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  workOrderStatusColorMap,
  workOrderStatusLabels,
  dailyLogStatusColorMap,
  dailyLogStatusLabels,
} from '@/design-system/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { operationsApi } from '@/api/operations';

interface RecentActivity {
  id: string;
  type: 'DAILY_LOG' | 'WORK_ORDER';
  title: string;
  status: string;
  project: string;
  date: string;
}

interface ResourceSummary {
  project: string;
  workers: number;
  equipment: number;
  activeOrders: number;
}


const OperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: dailyLogsData,
    isLoading: dailyLogsLoading,
    isError: dailyLogsError,
  } = useQuery({
    queryKey: ['operations-dashboard-daily-logs'],
    queryFn: () => operationsApi.getDailyLogs({ size: 5 }),
  });

  const {
    data: workOrdersData,
    isLoading: workOrdersLoading,
    isError: workOrdersError,
  } = useQuery({
    queryKey: ['operations-dashboard-work-orders'],
    queryFn: () => operationsApi.getWorkOrders({ size: 5 }),
  });

  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    isError: resourcesError,
  } = useQuery({
    queryKey: ['operations-dashboard-resources'],
    queryFn: () => operationsApi.getResourceSchedules({ size: 100 }),
  });

  const isLoading = dailyLogsLoading || workOrdersLoading || resourcesLoading;
  const isError = dailyLogsError && workOrdersError && resourcesError;

  const dailyLogs = dailyLogsData?.content ?? [];
  const workOrders = workOrdersData?.content ?? [];
  const resourceSchedules = resourcesData?.content ?? [];

  const recentActivities: RecentActivity[] = [
    ...dailyLogs.map((dl) => ({
      id: dl.id,
      type: 'DAILY_LOG' as const,
      title: `${t('operations.dashboard.dailyLog')} ${dl.logDate ? formatDate(dl.logDate) : ''}`,
      status: dl.status,
      project: dl.projectName ?? '',
      date: dl.logDate ?? '',
    })),
    ...workOrders.map((wo) => ({
      id: wo.id,
      type: 'WORK_ORDER' as const,
      title: `${wo.number ?? ''} ${wo.title ?? ''}`.trim(),
      status: wo.status,
      project: wo.projectName ?? '',
      date: wo.plannedStartDate ?? '',
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  // Aggregate resource summaries by project
  const resourceMap = new Map<string, ResourceSummary>();
  for (const r of resourceSchedules) {
    const key = r.projectName ?? r.projectId ?? 'unknown';
    const existing = resourceMap.get(key) ?? { project: key, workers: 0, equipment: 0, activeOrders: 0 };
    if (r.resourceType === 'LABOR') existing.workers += r.quantity ?? 0;
    else if (r.resourceType === 'EQUIPMENT') existing.equipment += r.quantity ?? 0;
    existing.activeOrders++;
    resourceMap.set(key, existing);
  }
  const resourceSummaries = Array.from(resourceMap.values()).slice(0, 5);

  const totalWorkers = resourceSummaries.reduce((s, r) => s + r.workers, 0);
  const totalEquipment = resourceSummaries.reduce((s, r) => s + r.equipment, 0);
  const activeOrders = workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length;
  const completedOrders = workOrders.filter((wo) => wo.status === 'COMPLETED').length;
  const overdueCount = workOrders.filter((wo) => {
    if (wo.status === 'COMPLETED' || wo.status === 'CANCELLED') return false;
    if (!wo.plannedEndDate) return false;
    return new Date(wo.plannedEndDate) < new Date();
  }).length;
  const unapprovedLogCount = dailyLogs.filter((dl) => dl.status === 'SUBMITTED').length;
  const readinessPercent = workOrders.length
    ? Math.round((completedOrders / workOrders.length) * 100)
    : 0;

  if (isError) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('operations.dashboard.title')}
          subtitle={t('operations.dashboard.subtitle')}
          breadcrumbs={[
            { label: t('operations.dashboard.breadcrumbHome'), href: '/' },
            { label: t('operations.dashboard.breadcrumbOperations') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.dashboard.title')}
        subtitle={t('operations.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('operations.dashboard.breadcrumbHome'), href: '/' },
          { label: t('operations.dashboard.breadcrumbOperations') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/operations/daily-logs')}>
              {t('operations.dashboard.dailyLog')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/operations/work-orders')}>
              {t('operations.dashboard.workOrders')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Users size={18} />}
          label={t('operations.dashboard.workersOnSite')}
          value={totalWorkers}
          trend={{ direction: 'up', value: t('operations.dashboard.today') }}
          loading={isLoading}
        />
        <MetricCard
          icon={<Truck size={18} />}
          label={t('operations.dashboard.equipmentUnits')}
          value={totalEquipment}
          loading={isLoading}
        />
        <MetricCard
          icon={<Wrench size={18} />}
          label={t('operations.dashboard.activeOrders')}
          value={activeOrders}
          loading={isLoading}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('operations.dashboard.averageReadiness')}
          value={`${readinessPercent}%`}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('operations.dashboard.recentActivity')}</h3>
              <Button variant="ghost" size="xs" onClick={() => navigate('/operations/daily-logs')}>
                {t('operations.dashboard.allEntries')}
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 size={32} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('operations.dashboard.noRecentActivity')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() =>
                      navigate(item.type === 'DAILY_LOG'
                        ? `/operations/daily-logs/${item.id}`
                        : `/operations/work-orders/${item.id}`)
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.type === 'DAILY_LOG' ? (
                        <ClipboardList size={18} className="text-neutral-400 flex-shrink-0" />
                      ) : (
                        <Wrench size={18} className="text-neutral-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge
                        status={item.status}
                        colorMap={item.type === 'DAILY_LOG' ? dailyLogStatusColorMap : workOrderStatusColorMap}
                        label={item.type === 'DAILY_LOG' ? dailyLogStatusLabels[item.status] : workOrderStatusLabels[item.status]}
                      />
                      {item.date && (
                        <span className="text-xs text-neutral-400 tabular-nums">{formatDate(item.date)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.dashboard.resourcesByProject')}</h3>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : resourceSummaries.length === 0 ? (
              <div className="text-center py-6">
                <Users size={24} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('operations.dashboard.noResources')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resourceSummaries.map((res) => (
                  <div key={res.project} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">{res.project}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('operations.dashboard.workers')}</p>
                        <p className="text-sm font-semibold tabular-nums">{res.workers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('operations.dashboard.equipment')}</p>
                        <p className="text-sm font-semibold tabular-nums">{res.equipment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('operations.dashboard.orders')}</p>
                        <p className="text-sm font-semibold tabular-nums">{res.activeOrders}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.dashboard.warnings')}</h3>
            <div className="space-y-3">
              {overdueCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                  <AlertTriangle size={16} className="text-danger-600 dark:text-danger-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-danger-800 dark:text-danger-300">
                      {t('operations.dashboard.overdueOrders', { count: overdueCount })}
                    </p>
                    <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">{t('operations.dashboard.requireUrgentAttention')}</p>
                  </div>
                </div>
              )}
              {unapprovedLogCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <Calendar size={16} className="text-warning-600 dark:text-warning-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
                      {t('operations.dashboard.unapprovedLog', { count: unapprovedLogCount })}
                    </p>
                    <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">{t('operations.dashboard.awaitingApproval')}</p>
                  </div>
                </div>
              )}
              {completedOrders > 0 && (
                <div className="flex items-start gap-3 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <CheckCircle2 size={16} className="text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success-800 dark:text-success-300">
                      {t('operations.dashboard.completedOrders', { count: completedOrders })}
                    </p>
                    <p className="text-xs text-success-600 dark:text-success-400 mt-0.5">{t('operations.dashboard.thisMonth')}</p>
                  </div>
                </div>
              )}
              {overdueCount === 0 && unapprovedLogCount === 0 && completedOrders === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-success-400" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('operations.dashboard.noWarnings')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboardPage;
