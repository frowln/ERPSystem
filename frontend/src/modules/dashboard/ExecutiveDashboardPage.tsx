import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Wallet,
  AlertTriangle,
  HardHat,
  CalendarDays,
  FileText,
  Bug,
  Truck,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Users,
  ShoppingCart,
  FileBarChart,
  Banknote,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { MetricCardSkeleton } from '@/design-system/components/Skeleton';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { projectsApi } from '@/api/projects';
import { safetyApi } from '@/api/safety';
import { defectsApi } from '@/api/defects';
import { procurementApi } from '@/api/procurement';
import type { Project } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RagStatus = 'green' | 'yellow' | 'red' | 'gray';

interface ProjectHealth {
  project: Project;
  budget: RagStatus;
  schedule: RagStatus;
  documentation: RagStatus;
  safety: RagStatus;
  quality: RagStatus;
  procurement: RagStatus;
  itd: RagStatus;
  healthScore: number;
  maxScore: number;
}

interface HealthAggregates {
  openIncidentsByProject: Record<string, number>;
  openDefectsByProject: Record<string, number>;
  overdueOrdersByProject: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Health computation (identical to PortfolioHealthPage)
// ---------------------------------------------------------------------------

function computeRag(project: Project, aggregates: HealthAggregates): Omit<ProjectHealth, 'project'> {
  const spent = project.spentAmount ?? 0;
  const budget = project.budget ?? project.budgetAmount ?? 1;
  const pctSpent = budget > 0 ? (spent / budget) * 100 : 0;

  let budgetRag: RagStatus = 'green';
  if (pctSpent > 100) budgetRag = 'red';
  else if (pctSpent >= 90) budgetRag = 'yellow';

  const now = new Date();
  const end = project.plannedEndDate ? new Date(project.plannedEndDate) : null;
  const diffDays = end ? Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const progress = project.progress ?? 0;
  let scheduleRag: RagStatus = 'green';
  if (diffDays < -7) scheduleRag = 'red';
  else if (diffDays < 0) scheduleRag = 'yellow';
  else if (progress < 50 && diffDays < 30) scheduleRag = 'yellow';

  const docPct = Math.min(100, progress * 1.1 + 10);
  let docRag: RagStatus = 'green';
  if (docPct < 70) docRag = 'red';
  else if (docPct < 90) docRag = 'yellow';

  const openIncidents = aggregates.openIncidentsByProject[project.id] ?? 0;
  let safetyRag: RagStatus = 'green';
  if (openIncidents >= 3) safetyRag = 'red';
  else if (openIncidents >= 1) safetyRag = 'yellow';

  const openDefects = aggregates.openDefectsByProject[project.id] ?? 0;
  let qualityRag: RagStatus = 'green';
  if (openDefects >= 15) qualityRag = 'red';
  else if (openDefects >= 5) qualityRag = 'yellow';

  const overdueOrders = aggregates.overdueOrdersByProject[project.id] ?? 0;
  let procRag: RagStatus = 'green';
  if (overdueOrders >= 3) procRag = 'red';
  else if (overdueOrders >= 1) procRag = 'yellow';

  const itdPct = Math.min(100, progress * 1.05);
  let itdRag: RagStatus = 'green';
  if (itdPct < 70) itdRag = 'red';
  else if (itdPct < 90) itdRag = 'yellow';

  const metrics: RagStatus[] = [budgetRag, scheduleRag, docRag, safetyRag, qualityRag, procRag, itdRag];
  const healthScore = metrics.filter((m) => m === 'green').length;

  return {
    budget: budgetRag,
    schedule: scheduleRag,
    documentation: docRag,
    safety: safetyRag,
    quality: qualityRag,
    procurement: procRag,
    itd: itdRag,
    healthScore,
    maxScore: 7,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPEN_INCIDENT_STATUSES = new Set(['REPORTED', 'UNDER_INVESTIGATION', 'CORRECTIVE_ACTION']);
const OPEN_DEFECT_STATUSES = new Set(['OPEN', 'IN_PROGRESS']);
const OVERDUE_ORDER_STATUSES = new Set(['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_DELIVERED']);

const RAG_COLORS: Record<RagStatus, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
  gray: 'bg-neutral-300 dark:bg-neutral-600',
};

const RAG_RING_COLORS: Record<RagStatus, string> = {
  green: 'ring-emerald-200 dark:ring-emerald-900',
  yellow: 'ring-amber-200 dark:ring-amber-900',
  red: 'ring-red-200 dark:ring-red-900',
  gray: 'ring-neutral-200 dark:ring-neutral-700',
};

type MetricKey = 'budget' | 'schedule' | 'documentation' | 'safety' | 'quality' | 'procurement' | 'itd';

const METRIC_COLS: { key: MetricKey; abbr: string; labelKey: string }[] = [
  { key: 'budget', abbr: 'B', labelKey: 'portfolioHealth.colBudget' },
  { key: 'schedule', abbr: 'S', labelKey: 'portfolioHealth.colSchedule' },
  { key: 'documentation', abbr: 'D', labelKey: 'portfolioHealth.colDocumentation' },
  { key: 'safety', abbr: 'Sa', labelKey: 'portfolioHealth.colSafety' },
  { key: 'quality', abbr: 'Q', labelKey: 'portfolioHealth.colQuality' },
  { key: 'procurement', abbr: 'P', labelKey: 'portfolioHealth.colProcurement' },
  { key: 'itd', abbr: 'I', labelKey: 'portfolioHealth.colItd' },
];

const QUICK_LINKS: { icon: React.ElementType; labelKey: string; href: string }[] = [
  { icon: FolderKanban, labelKey: 'navigation.items.projects-list', href: '/projects' },
  { icon: Banknote, labelKey: 'navigation.groups.finance', href: '/budgets' },
  { icon: HardHat, labelKey: 'navigation.groups.safety', href: '/safety' },
  { icon: ShieldCheck, labelKey: 'navigation.groups.quality', href: '/quality' },
  { icon: ShoppingCart, labelKey: 'navigation.groups.supply', href: '/procurement' },
  { icon: Users, labelKey: 'navigation.groups.hr', href: '/employees' },
  { icon: BarChart3, labelKey: 'navigation.items.an-dashboards', href: '/analytics' },
  { icon: FileBarChart, labelKey: 'navigation.items.an-reports', href: '/reports' },
];

// ---------------------------------------------------------------------------
// RAG dot component
// ---------------------------------------------------------------------------

const RagDot: React.FC<{ status: RagStatus }> = ({ status }) => (
  <span
    className={cn(
      'inline-block rounded-full ring-2 w-3 h-3',
      RAG_COLORS[status],
      RAG_RING_COLORS[status],
    )}
    title={t(`portfolioHealth.rag${status.charAt(0).toUpperCase() + status.slice(1)}` as 'portfolioHealth.ragGreen')}
  />
);

// ---------------------------------------------------------------------------
// Health score bar (compact)
// ---------------------------------------------------------------------------

const HealthScoreBar: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
        {score}/{max}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Date range picker
// ---------------------------------------------------------------------------

const DateRangePicker: React.FC<{
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}> = ({ from, to, onChange }) => {
  const inputCn = 'text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hidden sm:inline">
        {t('executiveDashboard.dateRange')}:
      </span>
      <input
        type="date"
        className={inputCn}
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
      />
      <span className="text-neutral-400">&mdash;</span>
      <input
        type="date"
        className={inputCn}
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Compact RAG Matrix
// ---------------------------------------------------------------------------

const CompactRagMatrix: React.FC<{ items: ProjectHealth[] }> = ({ items }) => {
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    return [...items]
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 15);
  }, [items]);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('portfolioHealth.emptyState')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2 px-3">
              {t('portfolioHealth.colProject')}
            </th>
            {METRIC_COLS.map((col) => (
              <th
                key={col.key}
                className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2 px-1.5 w-10"
                title={t(col.labelKey)}
              >
                {col.abbr}
              </th>
            ))}
            <th className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2 px-2 w-24">
              {t('portfolioHealth.colHealthScore')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr
              key={item.project.id}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${item.project.id}`)}
            >
              <td className="py-2 px-3">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate block max-w-[200px]">
                  {item.project.name}
                </span>
              </td>
              {METRIC_COLS.map((col) => (
                <td key={col.key} className="py-2 px-1.5 text-center">
                  <div className="flex items-center justify-center">
                    <RagDot status={item[col.key]} />
                  </div>
                </td>
              ))}
              <td className="py-2 px-2">
                <div className="flex items-center justify-center">
                  <HealthScoreBar score={item.healthScore} max={item.maxScore} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Red Flags Panel
// ---------------------------------------------------------------------------

interface RedFlag {
  projectName: string;
  projectId: string;
  redMetrics: string[];
}

const RedFlagsPanel: React.FC<{ items: ProjectHealth[] }> = ({ items }) => {
  const navigate = useNavigate();

  const redFlags = useMemo<RedFlag[]>(() => {
    const flags: RedFlag[] = [];
    for (const item of items) {
      const redMetrics: string[] = [];
      for (const col of METRIC_COLS) {
        if (item[col.key] === 'red') {
          redMetrics.push(t(col.labelKey));
        }
      }
      if (redMetrics.length >= 2) {
        flags.push({
          projectName: item.project.name,
          projectId: item.project.id,
          redMetrics,
        });
      }
    }
    return flags.sort((a, b) => b.redMetrics.length - a.redMetrics.length).slice(0, 10);
  }, [items]);

  if (redFlags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ShieldCheck className="w-10 h-10 text-emerald-400 dark:text-emerald-500 mb-3" />
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {t('executiveDashboard.noRedFlags')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        {t('executiveDashboard.projectsWithIssues', { count: String(redFlags.length) })}
      </p>
      {redFlags.map((flag) => (
        <div
          key={flag.projectId}
          className="px-3 py-2.5 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={() => navigate(`/projects/${flag.projectId}`)}
        >
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {flag.projectName}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {flag.redMetrics.map((metric) => (
              <span
                key={metric}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                {metric}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Quick Links
// ---------------------------------------------------------------------------

const QuickLinks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {QUICK_LINKS.map((link) => (
        <button
          key={link.href}
          onClick={() => navigate(link.href)}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
            'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700',
            'hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800',
            'text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400',
          )}
        >
          <link.icon className="w-5 h-5" />
          <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
            {t(link.labelKey)}
          </span>
        </button>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

const ExecutiveDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  // Load projects
  const { data: apiProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'executive-dashboard'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
    staleTime: 5 * 60_000,
  });

  // Safety: open incidents
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['safety-incidents', 'executive-dashboard'],
    queryFn: () => safetyApi.getIncidents({ page: 0, size: 500 }),
    staleTime: 5 * 60_000,
  });

  // Quality: defect dashboard
  const { data: defectDashboard } = useQuery({
    queryKey: ['defects-dashboard', 'executive-dashboard'],
    queryFn: () => defectsApi.getDashboard(),
    staleTime: 5 * 60_000,
  });

  // Procurement: purchase orders
  const { data: purchaseOrdersData } = useQuery({
    queryKey: ['purchase-orders', 'executive-dashboard'],
    queryFn: () => procurementApi.getPurchaseOrders({ page: 0, size: 500 }),
    staleTime: 5 * 60_000,
  });

  // Build health aggregates from real data
  const healthAggregates = useMemo<HealthAggregates>(() => {
    const openIncidentsByProject: Record<string, number> = {};
    if (incidentsData?.content) {
      for (const incident of incidentsData.content) {
        if (OPEN_INCIDENT_STATUSES.has(incident.status) && incident.projectId) {
          openIncidentsByProject[incident.projectId] = (openIncidentsByProject[incident.projectId] ?? 0) + 1;
        }
      }
    }

    const openDefectsByProject: Record<string, number> = {};
    if (defectDashboard?.byProject) {
      for (const entry of defectDashboard.byProject) {
        const openCount = (entry.open ?? 0) + (entry.inProgress ?? 0);
        if (openCount > 0) {
          openDefectsByProject[entry.id] = openCount;
        }
      }
    }

    const overdueOrdersByProject: Record<string, number> = {};
    const now = new Date();
    if (purchaseOrdersData?.content) {
      for (const order of purchaseOrdersData.content) {
        if (
          OVERDUE_ORDER_STATUSES.has(order.status) &&
          order.expectedDeliveryDate &&
          new Date(order.expectedDeliveryDate) < now &&
          order.projectId
        ) {
          overdueOrdersByProject[order.projectId] = (overdueOrdersByProject[order.projectId] ?? 0) + 1;
        }
      }
    }

    return { openIncidentsByProject, openDefectsByProject, overdueOrdersByProject };
  }, [incidentsData, defectDashboard, purchaseOrdersData]);

  // Projects
  const projects = useMemo(() => apiProjects?.content ?? [], [apiProjects]);

  // Filter by date range
  const filteredProjects = useMemo(() => {
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    return projects.filter((p) => {
      if (fromDate && p.plannedEndDate && new Date(p.plannedEndDate) < fromDate) return false;
      if (toDate && p.plannedStartDate && new Date(p.plannedStartDate) > toDate) return false;
      return true;
    });
  }, [projects, dateRange]);

  // Health items
  const healthItems: ProjectHealth[] = useMemo(() => {
    return filteredProjects.map((p) => ({
      project: p,
      ...computeRag(p, healthAggregates),
    }));
  }, [filteredProjects, healthAggregates]);

  // KPI computations
  const kpis = useMemo(() => {
    const active = filteredProjects.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING',
    );

    // Budget utilization: average (spent/budget) across projects with budget > 0
    const projectsWithBudget = active.filter((p) => (p.budget ?? p.budgetAmount ?? 0) > 0);
    const avgBudgetUtil = projectsWithBudget.length > 0
      ? projectsWithBudget.reduce((sum, p) => {
          const budget = p.budget ?? p.budgetAmount ?? 1;
          return sum + ((p.spentAmount ?? 0) / budget) * 100;
        }, 0) / projectsWithBudget.length
      : 0;

    // Overdue tasks: count projects past deadline with low progress
    const overdueTasks = active.filter((p) => {
      if (!p.plannedEndDate) return false;
      const end = new Date(p.plannedEndDate);
      return end < new Date() && (p.progress ?? 0) < 100;
    }).length;

    // Safety: total open incidents in period
    const totalOpenIncidents = Object.values(healthAggregates.openIncidentsByProject).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      activeProjects: active.length,
      budgetUtil: Math.round(avgBudgetUtil),
      overdueTasks,
      safetyIncidents: totalOpenIncidents,
    };
  }, [filteredProjects, healthAggregates]);

  const isLoading = projectsLoading || incidentsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('executiveDashboard.title')}
        subtitle={t('executiveDashboard.subtitle')}
        actions={
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(from, to) => setDateRange({ from, to })}
          />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              icon={<FolderKanban className="w-4 h-4" />}
              label={t('executiveDashboard.kpiActiveProjects')}
              value={kpis.activeProjects}
              subtitle={t('executiveDashboard.subtitle')}
            />
            <MetricCard
              icon={<Wallet className="w-4 h-4" />}
              label={t('executiveDashboard.kpiBudgetUtil')}
              value={`${kpis.budgetUtil}%`}
              trend={
                kpis.budgetUtil > 95
                  ? { direction: 'down', value: t('portfolioHealth.ragRed') }
                  : kpis.budgetUtil > 80
                    ? { direction: 'neutral', value: t('portfolioHealth.ragYellow') }
                    : { direction: 'up', value: t('portfolioHealth.ragGreen') }
              }
            />
            <MetricCard
              icon={<Activity className="w-4 h-4" />}
              label={t('executiveDashboard.kpiOverdueTasks')}
              value={kpis.overdueTasks}
              trend={
                kpis.overdueTasks > 5
                  ? { direction: 'down', value: t('portfolioHealth.ragRed') }
                  : kpis.overdueTasks > 0
                    ? { direction: 'neutral', value: t('portfolioHealth.ragYellow') }
                    : { direction: 'up', value: t('portfolioHealth.ragGreen') }
              }
            />
            <MetricCard
              icon={<HardHat className="w-4 h-4" />}
              label={t('executiveDashboard.kpiSafetyScore')}
              value={kpis.safetyIncidents}
              trend={
                kpis.safetyIncidents >= 3
                  ? { direction: 'down', value: t('portfolioHealth.ragRed') }
                  : kpis.safetyIncidents >= 1
                    ? { direction: 'neutral', value: t('portfolioHealth.ragYellow') }
                    : { direction: 'up', value: t('portfolioHealth.ragGreen') }
              }
            />
          </>
        )}
      </div>

      {/* RAG Matrix + Red Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RAG Matrix — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-neutral-400" />
            {t('executiveDashboard.ragMatrix')}
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded" />
              ))}
            </div>
          ) : (
            <CompactRagMatrix items={healthItems} />
          )}
        </div>

        {/* Red Flags — 1/3 width */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {t('executiveDashboard.redFlags')}
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <RedFlagsPanel items={healthItems} />
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('executiveDashboard.quickLinks')}
        </h2>
        <QuickLinks />
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
