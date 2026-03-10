import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  FolderKanban,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { crmApi } from '@/api/crm';
import { projectsApi } from '@/api/projects';
import { financeApi } from '@/api/finance';
import { permitsApi } from '@/api/permits';
import { risksApi } from '@/api/risks';
import { surveysApi } from '@/api/surveys';
import type { Project, ProjectRisk, ConstructionPermit, EngineeringSurvey } from '@/types';
import type { CrmLead } from '@/modules/crm/types';

// ---------------------------------------------------------------------------
// Pre-construction statuses
// ---------------------------------------------------------------------------
const PRECON_STATUSES = ['DRAFT', 'PLANNING', 'ESTIMATION', 'IN_PROGRESS', 'ON_HOLD'];

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------
const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
    <div className="animate-pulse">
      <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
      <div className="h-7 w-28 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
      <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 h-[320px] animate-pulse" />
);

// ---------------------------------------------------------------------------
// Conversion Funnel Chart
// ---------------------------------------------------------------------------
interface FunnelProps {
  data: { label: string; value: number }[];
}

const ConversionFunnel: React.FC<FunnelProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('preconDashboard.conversionFunnel')}
      </h3>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const pct = max > 0 ? (item.value / max) * 100 : 0;
          const prevValue = idx > 0 ? data[idx - 1].value : null;
          const convRate = prevValue && prevValue > 0 ? Math.round((item.value / prevValue) * 100) : null;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {item.value}{convRate !== null && <span className="text-neutral-400 font-normal ml-1">({convRate}%)</span>}
                </span>
              </div>
              <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                <div
                  className="h-full bg-primary-500 dark:bg-primary-600 rounded-md transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status Distribution Chart
// ---------------------------------------------------------------------------
interface StatusDistItem {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-400',
  PLANNING: 'bg-primary-400',
  ESTIMATION: 'bg-cyan-400',
  IN_PROGRESS: 'bg-success-500',
  ON_HOLD: 'bg-warning-500',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-danger-500',
};

const StatusDistribution: React.FC<{ data: StatusDistItem[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('preconDashboard.statusDistribution')}
      </h3>
      <div className="space-y-2">
        {data.map((item) => {
          const pct = max > 0 ? (item.count / max) * 100 : 0;
          return (
            <div key={item.status} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0">
                <StatusBadge status={item.status} size="sm" />
              </div>
              <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                <div
                  className={cn('h-full rounded transition-all duration-500', STATUS_COLORS[item.status] ?? 'bg-neutral-400')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums w-6 text-right">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Risk Heatmap
// ---------------------------------------------------------------------------
const HEATMAP_COLORS: Record<number, string> = {
  0: 'bg-neutral-50 dark:bg-neutral-800',
  1: 'bg-green-100 dark:bg-green-900/40',
  2: 'bg-yellow-100 dark:bg-yellow-900/40',
  3: 'bg-orange-200 dark:bg-orange-900/40',
  4: 'bg-red-200 dark:bg-red-900/40',
  5: 'bg-red-400 dark:bg-red-800',
};

function getHeatmapColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS[0];
  if (count <= 1) return HEATMAP_COLORS[1];
  if (count <= 2) return HEATMAP_COLORS[2];
  if (count <= 3) return HEATMAP_COLORS[3];
  if (count <= 5) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

const RiskHeatmap: React.FC<{ risks: ProjectRisk[] }> = ({ risks }) => {
  // Build 5x5 grid: probability (rows 1-5) x impact (cols 1-5)
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0) as number[]);

  for (const r of risks) {
    const pRow = Math.max(1, Math.min(5, Math.round(r.probability))) - 1;
    const iCol = Math.max(1, Math.min(5, Math.round(r.impact))) - 1;
    grid[pRow][iCol]++;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('preconDashboard.riskHeatmap')}
      </h3>
      {risks.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-neutral-500 dark:text-neutral-400">
          {t('preconDashboard.noRisks')}
        </div>
      ) : (
      <div className="flex items-end gap-1">
        {/* Y-axis label */}
        <div className="flex flex-col items-center justify-center mr-1">
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 writing-mode-vertical"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {t('preconDashboard.probability')}
          </span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1">
            {/* rows: 5(top) -> 1(bottom), so reverse */}
            {[...grid].reverse().map((row, ri) => (
              row.map((count, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className={cn(
                    'aspect-square rounded flex items-center justify-center text-[10px] font-semibold',
                    getHeatmapColor(count),
                    count > 0 ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600',
                  )}
                >
                  {count > 0 ? count : ''}
                </div>
              ))
            ))}
          </div>
          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {t('preconDashboard.impact')}
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Budget Variance Chart (SVG polyline)
// ---------------------------------------------------------------------------
interface VariancePoint {
  label: string;
  planned: number;
  actual: number;
}

const BudgetVarianceChart: React.FC<{ data: VariancePoint[] }> = ({ data }) => {
  const W = 400;
  const H = 180;
  const PAD = 30;

  const maxVal = Math.max(...data.flatMap((d) => [d.planned, d.actual]), 1);
  const toX = (i: number) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - (v / maxVal) * (H - PAD * 2);

  const plannedPoints = data.map((d, i) => `${toX(i)},${toY(d.planned)}`).join(' ');
  const actualPoints = data.map((d, i) => `${toX(i)},${toY(d.actual)}`).join(' ');

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('preconDashboard.budgetVariance')}
      </h3>
      {data.length < 2 ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-neutral-400 dark:text-neutral-500">
          {t('preconDashboard.noData')}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-auto">
          {/* Y-axis labels */}
          <text x={PAD - 4} y={PAD} textAnchor="end" className="text-[9px] fill-neutral-400 dark:fill-neutral-500">{(maxVal / 1_000_000).toFixed(1)}M</text>
          <text x={PAD - 4} y={H / 2} textAnchor="end" className="text-[9px] fill-neutral-400 dark:fill-neutral-500">{(maxVal / 2_000_000).toFixed(1)}M</text>
          <text x={PAD - 4} y={H - PAD} textAnchor="end" className="text-[9px] fill-neutral-400 dark:fill-neutral-500">0</text>
          {/* X-axis project labels */}
          {data.map((d, i) => (
            <text key={i} x={toX(i)} y={H - PAD + 14} textAnchor="middle" className="text-[8px] fill-neutral-400 dark:fill-neutral-500">{d.label}</text>
          ))}
          {/* Grid lines */}
          <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="0.5" />
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="0.5" />
          <polyline
            points={plannedPoints}
            fill="none"
            stroke="currentColor"
            className="text-primary-400 dark:text-primary-500"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={actualPoints}
            fill="none"
            stroke="currentColor"
            className="text-success-500 dark:text-success-400"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
          {/* Legend */}
          <line x1={PAD} y1={H + 8} x2={PAD + 20} y2={H + 8} stroke="currentColor" className="text-primary-400" strokeWidth="2" />
          <text x={PAD + 24} y={H + 12} className="text-[10px] fill-neutral-500 dark:fill-neutral-400">
            {t('preconDashboard.planned')}
          </text>
          <line x1={PAD + 80} y1={H + 8} x2={PAD + 100} y2={H + 8} stroke="currentColor" className="text-success-500" strokeWidth="2" strokeDasharray="6 3" />
          <text x={PAD + 104} y={H + 12} className="text-[10px] fill-neutral-500 dark:fill-neutral-400">
            {t('preconDashboard.actual')}
          </text>
        </svg>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Readiness Table
// ---------------------------------------------------------------------------
interface ReadinessRow {
  project: Project;
  siteAssessmentCount: number;
  siteAssessmentRec: string | null;
  permitCount: number;
  totalPermits: number;
  hasBudget: boolean;
  riskCount: number;
  maxRiskSeverity: 'low' | 'medium' | 'high';
  hasSurveys: boolean;
  readinessPercent: number;
}

const ReadinessTable: React.FC<{ rows: ReadinessRow[]; loading: boolean }> = ({ rows, loading }) => {
  const navigate = useNavigate();

  const severityColor: Record<string, string> = {
    low: 'text-success-600 dark:text-success-400',
    medium: 'text-warning-600 dark:text-warning-400',
    high: 'text-danger-600 dark:text-danger-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('preconDashboard.readinessTable')}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              {[
                t('preconDashboard.colProject'),
                t('preconDashboard.colStatus'),
                t('preconDashboard.colSiteAssessment'),
                t('preconDashboard.colPermits'),
                t('preconDashboard.colBudget'),
                t('preconDashboard.colRisks'),
                t('preconDashboard.colSurveys'),
                t('preconDashboard.colReadiness'),
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {t('preconDashboard.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.project.id}
                  onClick={() => navigate(`/projects/${row.project.id}`)}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                      {row.project.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{row.project.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.project.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {row.siteAssessmentRec === 'GO' ? (
                      <span className="text-success-600 dark:text-success-400">&#10003;</span>
                    ) : row.siteAssessmentRec === 'CONDITIONAL' ? (
                      <span className="text-warning-600 dark:text-warning-400">&#9888;</span>
                    ) : row.siteAssessmentCount > 0 ? (
                      <span className="text-danger-600 dark:text-danger-400">&#10007;</span>
                    ) : (
                      <span className="text-neutral-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 tabular-nums">
                    {row.totalPermits > 0 ? `${row.permitCount}/${row.totalPermits}` : <span className="text-neutral-400">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {row.hasBudget ? (
                      <span className="text-success-600 dark:text-success-400">&#10003;</span>
                    ) : (
                      <span className="text-neutral-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    <span className={severityColor[row.maxRiskSeverity] ?? ''}>
                      {row.riskCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {row.hasSurveys ? (
                      <span className="text-success-600 dark:text-success-400">&#10003;</span>
                    ) : (
                      <span className="text-neutral-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            row.readinessPercent >= 75
                              ? 'bg-success-500'
                              : row.readinessPercent >= 40
                                ? 'bg-warning-500'
                                : 'bg-danger-500',
                          )}
                          style={{ width: `${row.readinessPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums w-8 text-right">
                        {row.readinessPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
const PreConstructionDashboardPage: React.FC = () => {
  // ---- Data fetching ----
  const { data: leadsResponse, isLoading: leadsLoading } = useQuery({
    queryKey: ['precon-dash-leads'],
    queryFn: () => crmApi.getLeads({ size: 500 }),
  });

  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['precon-dash-projects'],
    queryFn: () => projectsApi.getProjects({ size: 500 }),
  });

  const { data: budgetsResponse, isLoading: budgetsLoading } = useQuery({
    queryKey: ['precon-dash-budgets'],
    queryFn: () => financeApi.getBudgets({ size: 500 }),
  });

  const leads: CrmLead[] = leadsResponse?.content ?? [];
  const projects: Project[] = projectsResponse?.content ?? [];
  const budgets = budgetsResponse?.content ?? [];

  // Pre-con projects
  const preconProjects = useMemo(
    () => projects.filter((p) => PRECON_STATUSES.includes(p.status)),
    [projects],
  );

  // Per-project queries: permits, risks, surveys
  const projectIds = useMemo(() => preconProjects.map((p) => p.id), [preconProjects]);

  const { data: allPermitsMap, isLoading: permitsLoading } = useQuery({
    queryKey: ['precon-dash-permits', projectIds],
    queryFn: async () => {
      const result: Record<string, ConstructionPermit[]> = {};
      await Promise.all(
        projectIds.map(async (pid) => {
          try {
            result[pid] = await permitsApi.getPermits(pid);
          } catch {
            result[pid] = [];
          }
        }),
      );
      return result;
    },
    enabled: projectIds.length > 0,
  });

  const { data: allRisksMap, isLoading: risksLoading } = useQuery({
    queryKey: ['precon-dash-risks', projectIds],
    queryFn: async () => {
      const result: Record<string, ProjectRisk[]> = {};
      await Promise.all(
        projectIds.map(async (pid) => {
          try {
            result[pid] = await risksApi.getRisks(pid);
          } catch {
            result[pid] = [];
          }
        }),
      );
      return result;
    },
    enabled: projectIds.length > 0,
  });

  const { data: allSurveysMap, isLoading: surveysLoading } = useQuery({
    queryKey: ['precon-dash-surveys', projectIds],
    queryFn: async () => {
      const result: Record<string, EngineeringSurvey[]> = {};
      await Promise.all(
        projectIds.map(async (pid) => {
          try {
            result[pid] = await surveysApi.getSurveys(pid);
          } catch {
            result[pid] = [];
          }
        }),
      );
      return result;
    },
    enabled: projectIds.length > 0,
  });

  const { data: allSiteAssessMap, isLoading: saLoading } = useQuery({
    queryKey: ['precon-dash-site-assessments', projectIds],
    queryFn: async () => {
      const { siteAssessmentsApi } = await import('@/api/siteAssessments');
      const result: Record<string, any[]> = {};
      await Promise.all(
        projectIds.map(async (pid) => {
          try {
            result[pid] = await siteAssessmentsApi.getByProject(pid);
          } catch {
            result[pid] = [];
          }
        }),
      );
      return result;
    },
    enabled: projectIds.length > 0,
  });

  const isLoading = leadsLoading || projectsLoading || budgetsLoading;
  const isDetailLoading = permitsLoading || risksLoading || surveysLoading || saLoading;

  // ---- Computed KPIs ----
  const kpis = useMemo(() => {
    // 1. Lead conversion
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.status === 'WON').length;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    // 2. Active pre-con projects
    const activeCount = preconProjects.length;

    // 3. Permits compliance
    const allPermitsFlat = Object.values(allPermitsMap ?? {}).flat();
    const approvedPermits = allPermitsFlat.filter((p) => p.status === 'APPROVED').length;
    const permitCompliance =
      allPermitsFlat.length > 0 ? Math.round((approvedPermits / allPermitsFlat.length) * 100) : 0;

    // 4. Average risk score
    const allRisksFlat = Object.values(allRisksMap ?? {}).flat();
    const avgRisk =
      allRisksFlat.length > 0
        ? (allRisksFlat.reduce((sum, r) => sum + r.score, 0) / allRisksFlat.length).toFixed(1)
        : '0';

    // 5. Budget readiness
    const projectsWithBudget = preconProjects.filter((p) =>
      budgets.some((b) => b.projectId === p.id),
    ).length;
    const budgetReadiness =
      preconProjects.length > 0 ? Math.round((projectsWithBudget / preconProjects.length) * 100) : 0;

    // 6. Bid coverage (placeholder)
    const bidCoverage = 0;

    return { conversionRate, activeCount, permitCompliance, avgRisk, budgetReadiness, bidCoverage };
  }, [leads, preconProjects, allPermitsMap, allRisksMap, budgets]);

  // ---- Funnel data ----
  const funnelData = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter(
      (l) => l.status !== 'NEW' && l.status !== 'LOST',
    ).length;
    const proposals = leads.filter(
      (l) => l.status === 'PROPOSITION' || l.status === 'NEGOTIATION' || l.status === 'WON',
    ).length;
    const won = leads.filter((l) => l.status === 'WON').length;
    return [
      { label: t('preconDashboard.leads'), value: total },
      { label: t('preconDashboard.qualified'), value: qualified },
      { label: t('preconDashboard.proposals'), value: proposals },
      { label: t('preconDashboard.won'), value: won },
    ];
  }, [leads]);

  // ---- Status distribution data ----
  const statusDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // ---- All risks flat for heatmap ----
  const allRisksFlat = useMemo(
    () => Object.values(allRisksMap ?? {}).flat(),
    [allRisksMap],
  );

  // ---- Budget variance data ----
  const varianceData = useMemo(() => {
    return preconProjects.slice(0, 8).map((p) => ({
      label: p.code || p.name.slice(0, 10),
      planned: p.budget ?? p.budgetAmount ?? 0,
      actual: p.spentAmount ?? 0,
    }));
  }, [preconProjects]);

  // ---- Readiness table rows ----
  const readinessRows: ReadinessRow[] = useMemo(() => {
    return preconProjects.map((project) => {
      const siteAssessments = allSiteAssessMap?.[project.id] ?? [];
      const saGo = siteAssessments.find((s: any) => s.recommendation === 'GO');
      const saCond = siteAssessments.find((s: any) => s.recommendation === 'CONDITIONAL');
      const siteAssessmentRec = saGo ? 'GO' : saCond ? 'CONDITIONAL' : siteAssessments.length > 0 ? 'NO_GO' : null;

      const permits = allPermitsMap?.[project.id] ?? [];
      const approvedPermits = permits.filter((p) => p.status === 'APPROVED').length;
      const risks = allRisksMap?.[project.id] ?? [];
      const surveys = allSurveysMap?.[project.id] ?? [];
      const hasBudget = budgets.some((b) => b.projectId === project.id);
      const hasSurveys = surveys.length > 0;

      const maxScore = risks.length > 0 ? Math.max(...risks.map((r) => r.score)) : 0;
      const maxRiskSeverity: 'low' | 'medium' | 'high' =
        maxScore > 15 ? 'high' : maxScore > 8 ? 'medium' : 'low';

      // Readiness calculation: 5 criteria, each worth 20%
      let score = 0;
      if (hasBudget) score += 20;
      if (permits.length > 0 && approvedPermits > 0) score += 20;
      if (hasSurveys) score += 20;
      if (risks.length > 0) score += 20;
      if (siteAssessmentRec === 'GO' || siteAssessmentRec === 'CONDITIONAL') score += 20;

      return {
        project,
        siteAssessmentCount: siteAssessments.length,
        siteAssessmentRec,
        permitCount: approvedPermits,
        totalPermits: permits.length,
        hasBudget,
        riskCount: risks.length,
        maxRiskSeverity,
        hasSurveys,
        readinessPercent: Math.min(score, 100),
      };
    });
  }, [preconProjects, allSiteAssessMap, allPermitsMap, allRisksMap, allSurveysMap, budgets]);

  // ---- Render ----
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('preconDashboard.title')} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('preconDashboard.conversionRate')}
              value={`${kpis.conversionRate}%`}
            />
            <MetricCard
              icon={<FolderKanban size={18} />}
              label={t('preconDashboard.activeProjects')}
              value={String(kpis.activeCount)}
            />
            <MetricCard
              icon={<ShieldCheck size={18} />}
              label={t('preconDashboard.permitCompliance')}
              value={`${kpis.permitCompliance}%`}
            />
            <MetricCard
              icon={<AlertTriangle size={18} />}
              label={t('preconDashboard.avgRiskScore')}
              value={kpis.avgRisk}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('preconDashboard.budgetReadiness')}
              value={`${kpis.budgetReadiness}%`}
            />
            <MetricCard
              icon={<Target size={18} />}
              label={t('preconDashboard.bidCoverage')}
              value={`${kpis.bidCoverage}%`}
              subtitle={kpis.bidCoverage > 0 ? undefined : t('common.notStarted')}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ConversionFunnel data={funnelData} />
            <StatusDistribution data={statusDistData} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading || isDetailLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <RiskHeatmap risks={allRisksFlat} />
            <BudgetVarianceChart data={varianceData} />
          </>
        )}
      </div>

      {/* Readiness Table */}
      <ReadinessTable rows={readinessRows} loading={isLoading || isDetailLoading} />
    </div>
  );
};

export default PreConstructionDashboardPage;
