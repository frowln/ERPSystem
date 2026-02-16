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
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useAuthStore } from '@/stores/authStore';
import { projectsApi } from '@/api/projects';
import { formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { OnboardingChecklist } from '@/modules/onboarding/OnboardingChecklist';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const DashboardChartsFallback: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-[320px] animate-pulse" />
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-[320px] animate-pulse" />
  </div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  const data = dashboard;
  const today = format(new Date(), "d MMMM yyyy, EEEE", { locale: ru });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShouldLoadCharts(true);
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, []);

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

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard
          icon={<FolderKanban size={18} />}
          label={t('dashboard.activeProjects')}
          value={String(data?.activeProjects ?? 0)}
          trend={{ direction: 'up', value: '+3', label: t('dashboard.perMonth') }}
          loading={isLoading}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('dashboard.onControl')}
          value={String(data?.onWatch ?? 0)}
          trend={{ direction: 'neutral', value: '0' }}
          subtitle={t('dashboard.needAttention')}
          loading={isLoading}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('dashboard.overdueProjects')}
          value={String(data?.overdue ?? 0)}
          trend={{ direction: 'down', value: '-1' }}
          subtitle={t('dashboard.projectsWord')}
          loading={isLoading}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('dashboard.totalBudget')}
          value={formatMoneyCompact(data?.totalBudget ?? 0)}
          loading={isLoading}
        />
      </div>

      {/* Computed financial totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<FileText size={18} />}
          label={t('dashboard.contractVolume')}
          value={formatMoneyCompact(data?.computedTotalContractAmount ?? 0)}
          subtitle={t('dashboard.sumOfContracts')}
          loading={isLoading}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('dashboard.plannedBudget')}
          value={formatMoneyCompact(data?.computedTotalPlannedBudget ?? 0)}
          subtitle={t('dashboard.allProjectsScope')}
          loading={isLoading}
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label={t('dashboard.actualCosts')}
          value={formatMoneyCompact(data?.computedTotalActualCost ?? 0)}
          subtitle={t('dashboard.allProjectsScope')}
          loading={isLoading}
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

      {/* Charts row */}
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
                  {t('projects.budget')}
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
                    'border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:bg-neutral-800',
                    idx % 2 === 1 && 'bg-neutral-25',
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
