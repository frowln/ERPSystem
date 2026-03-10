import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  Wallet,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  FileText,
  CreditCard,
  Banknote,
  ShieldCheck,
  ListChecks,
  Calendar,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useAuthStore } from '@/stores/authStore';
import { projectsApi } from '@/api/projects';
import { analyticsApi } from '@/api/analytics';
import { formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { OnboardingChecklist } from '@/modules/onboarding/OnboardingChecklist';

const DashboardCharts = lazy(() => import('./DashboardCharts'));
const BudgetChart = lazy(() => import('@/modules/analytics/components/BudgetChart'));
const TaskStatusChart = lazy(() => import('@/modules/analytics/components/TaskStatusChart'));
const SpendTrendChart = lazy(() => import('@/modules/analytics/components/SpendTrendChart'));

const ChartFallback: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-[340px] animate-pulse" />
);

const DashboardChartsFallback: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <ChartFallback />
    <ChartFallback />
  </div>
);

const milestoneStatusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  OVERDUE: 'Просрочена',
};

const milestoneStatusColors: Record<string, string> = {
  PENDING: 'yellow',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  OVERDUE: 'red',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  // New analytics queries
  const { data: orgDashboard, isLoading: orgLoading } = useQuery({
    queryKey: ['analytics', 'org-dashboard'],
    queryFn: analyticsApi.fetchOrgDashboard,
  });

  const { data: financialSummary } = useQuery({
    queryKey: ['analytics', 'financial-summary'],
    queryFn: analyticsApi.fetchFinancialSummary,
    enabled: shouldLoadCharts,
  });

  const { data: taskAnalytics } = useQuery({
    queryKey: ['analytics', 'task-analytics'],
    queryFn: analyticsApi.fetchTaskAnalytics,
    enabled: shouldLoadCharts,
  });

  const { data: safetyMetrics } = useQuery({
    queryKey: ['analytics', 'safety-metrics'],
    queryFn: analyticsApi.fetchSafetyMetrics,
    enabled: shouldLoadCharts,
  });

  const data = dashboard;
  const today = format(new Date(), "d MMMM yyyy, EEEE", { locale: ru });

  // Fallback: when analytics financials have all-zero budgets, use project-level data
  const budgetChartData = (() => {
    const analytics = financialSummary?.projectFinancials ?? [];
    const hasRealData = analytics.some((p) => p.budget > 0 || p.spent > 0);
    if (hasRealData) return analytics;
    // Build from recent projects
    return (data?.recentProjects ?? [])
      .filter((p) => (p.budget ?? p.budgetAmount ?? 0) > 0)
      .map((p) => ({
        projectId: p.id,
        projectName: p.name,
        budget: p.budget ?? p.budgetAmount ?? 0,
        spent: (p.spentAmount ?? 0),
        committed: 0,
        utilizationPercent: 0,
      }));
  })();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShouldLoadCharts(true);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const metricsLoading = isLoading || orgLoading;

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {t('dashboard.welcome')}{user ? `, ${user.firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 capitalize">{today}</p>
        </div>
        <Button
          iconLeft={<Plus size={16} />}
          onClick={() => navigate('/projects/new')}
        >
          {t('dashboard.newProject')}
        </Button>
      </div>

      {/* Onboarding checklist for new users */}
      <OnboardingChecklist />

      {/* Top row: 4 key MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard
          icon={<FolderKanban size={18} />}
          label={t('dashboard.activeProjects')}
          value={String(orgDashboard?.activeProjects ?? data?.activeProjects ?? 0)}
          subtitle={t('dashboard.allProjectsScope')}
          loading={metricsLoading}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('dashboard.budgetUtilization')}
          value={`${(orgDashboard?.budgetUtilization ?? 0).toFixed(1)}%`}
          trend={orgDashboard?.budgetUtilization != null
            ? { direction: orgDashboard.budgetUtilization < 90 ? 'up' as const : 'down' as const, value: `${orgDashboard.budgetUtilization.toFixed(1)}%` }
            : undefined}
          subtitle={t('dashboard.allProjectsScope')}
          loading={metricsLoading}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('dashboard.overdueTasksLabel')}
          value={String(orgDashboard?.overdueTasks ?? 0)}
          trend={(orgDashboard?.overdueTasks ?? 0) > 0
            ? { direction: 'down' as const, value: String(orgDashboard?.overdueTasks ?? 0) }
            : undefined}
          subtitle={t('dashboard.tasksWord')}
          loading={metricsLoading}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label={t('dashboard.safetyScore')}
          value={`${(orgDashboard?.safetyScore ?? 100).toFixed(0)}%`}
          trend={orgDashboard?.safetyScore != null
            ? { direction: orgDashboard.safetyScore >= 90 ? 'up' as const : 'down' as const, value: `${orgDashboard.safetyScore.toFixed(0)}%` }
            : undefined}
          loading={metricsLoading}
        />
      </div>

      {/* Computed financial totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<FileText size={18} />}
          label={t('dashboard.contractVolume')}
          value={formatMoneyCompact(data?.computedTotalContractAmount || data?.totalContractAmount || 0)}
          subtitle={t('dashboard.sumOfContracts')}
          loading={isLoading}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('dashboard.totalBudget')}
          value={formatMoneyCompact(orgDashboard?.totalBudget ?? data?.totalBudget ?? 0)}
          subtitle={t('dashboard.allProjectsScope')}
          loading={metricsLoading}
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label={t('dashboard.actualCosts')}
          value={formatMoneyCompact(orgDashboard?.totalSpent ?? data?.computedTotalActualCost ?? 0)}
          subtitle={t('dashboard.allProjectsScope')}
          loading={metricsLoading}
        />
        <MetricCard
          icon={<Banknote size={18} />}
          label={t('dashboard.cashFlow')}
          value={formatMoneyCompact(data?.computedTotalCashFlow ?? 0)}
          trend={{
            direction: (data?.computedTotalCashFlow ?? 0) >= 0 ? 'up' : 'down',
            value: (data?.computedTotalCashFlow ?? 0) >= 0 ? t('dashboard.positive') : t('dashboard.negative'),
          }}
          loading={isLoading}
        />
      </div>

      {/* Charts section: Budget by project, Tasks by status, Monthly spend trend */}
      {shouldLoadCharts ? (
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <ChartFallback />
            <ChartFallback />
            <ChartFallback />
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <BudgetChart data={budgetChartData} />
            <TaskStatusChart data={taskAnalytics?.tasksByStatus ?? {}} />
            <SpendTrendChart data={financialSummary?.monthlySpend ?? []} />
          </div>
        </Suspense>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <ChartFallback />
          <ChartFallback />
          <ChartFallback />
        </div>
      )}

      {/* Legacy charts row */}
      {shouldLoadCharts ? (
        <Suspense fallback={<DashboardChartsFallback />}>
          <DashboardCharts
            projectsByStatus={data?.projectsByStatus ?? []}
            budgetVsActual={data?.budgetVsActual ?? []}
          />
        </Suspense>
      ) : (
        <DashboardChartsFallback />
      )}

      {/* Activity & Milestones row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming milestones */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.upcomingMilestones')}</h2>
            </div>
          </div>
          <div className="p-4">
            {(orgDashboard?.upcomingMilestones ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noUpcomingMilestones')}</p>
            ) : (
              <div className="space-y-3">
                {(orgDashboard?.upcomingMilestones ?? []).slice(0, 5).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{m.milestoneName}</p>
                      {m.projectName && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{m.projectName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-xs text-neutral-500 tabular-nums">{m.dueDate}</span>
                      <StatusBadge status={m.status} colorMap={milestoneStatusColors} label={milestoneStatusLabels[m.status] ?? m.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.recentActivity')}</h2>
            </div>
          </div>
          <div className="p-4">
            {(orgDashboard?.recentActivities ?? []).length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">{t('dashboard.noRecentActivity')}</p>
            ) : (
              <div className="space-y-3">
                {(orgDashboard?.recentActivities ?? []).slice(0, 5).map((a, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ListChecks size={14} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">{a.description}</p>
                      {a.projectName && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{a.projectName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety quick stats (if data available) */}
      {safetyMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<ShieldCheck size={18} />}
            label={t('dashboard.totalInspections')}
            value={String(safetyMetrics.totalInspections)}
            subtitle={t('dashboard.inspectionsCount')}
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label={t('dashboard.openViolations')}
            value={String(safetyMetrics.openViolations)}
            trend={safetyMetrics.openViolations > 0
              ? { direction: 'down' as const, value: String(safetyMetrics.openViolations) }
              : undefined}
          />
          <MetricCard
            label={t('dashboard.inspectionPassRate')}
            value={`${safetyMetrics.passRate.toFixed(1)}%`}
            trend={{ direction: safetyMetrics.passRate >= 80 ? 'up' as const : 'down' as const, value: `${safetyMetrics.passRate.toFixed(1)}%` }}
          />
          <MetricCard
            label={t('dashboard.trainingCompliance')}
            value={`${safetyMetrics.trainingComplianceRate.toFixed(1)}%`}
            trend={{ direction: safetyMetrics.trainingComplianceRate >= 90 ? 'up' as const : 'down' as const, value: `${safetyMetrics.trainingComplianceRate.toFixed(1)}%` }}
          />
        </div>
      )}

      {/* Recent projects */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.recentProjects')}</h2>
          <Button
            variant="ghost"
            size="xs"
            iconRight={<ArrowRight size={14} />}
            onClick={() => navigate('/projects')}
          >
            {t('dashboard.allProjectsLink')}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('dashboard.code')}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('dashboard.name')}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('dashboard.manager')}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('projects.budgetLabel')}
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('projects.progress')}
                </th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentProjects ?? []).map((project, idx) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={cn(
                    'border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    idx % 2 === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/30',
                  )}
                >
                  <td className="px-5 py-3 text-sm font-mono text-neutral-500 dark:text-neutral-400">{project.code}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{project.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{project.customerName}</p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{project.managerName}</td>
                  <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-right font-medium tabular-nums">
                    {formatMoneyCompact(project.budget)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
