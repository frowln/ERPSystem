import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HealthScoreWidget } from '@/design-system/components/HealthScore';
import type { HealthLevel, HealthMetric } from '@/design-system/components/HealthScore';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Helpers — compute health level from project data
// ---------------------------------------------------------------------------

function budgetHealth(budgetSpentPct: number): { level: HealthLevel; value: string } {
  if (budgetSpentPct < 0) return { level: 'gray', value: t('healthScore.noData') };
  if (budgetSpentPct <= 90) return { level: 'green', value: `${budgetSpentPct}% ${t('healthScore.spent')}` };
  if (budgetSpentPct <= 100) return { level: 'yellow', value: `${budgetSpentPct}% ${t('healthScore.spent')}` };
  return { level: 'red', value: t('healthScore.overBudget') };
}

function scheduleHealth(daysLate: number): { level: HealthLevel; value: string } {
  if (daysLate < 0) return { level: 'gray', value: t('healthScore.noData') };
  if (daysLate === 0) return { level: 'green', value: t('healthScore.onTrack') };
  if (daysLate <= 7) return { level: 'yellow', value: t('healthScore.daysLate', { count: String(daysLate) }) };
  return { level: 'red', value: t('healthScore.daysLate', { count: String(daysLate) }) };
}

function countHealth(count: number, unit: string, thresholds: [number, number] = [1, 3]): { level: HealthLevel; value: string } {
  if (count < 0) return { level: 'gray', value: t('healthScore.noData') };
  if (count === 0) return { level: 'green', value: t('healthScore.good') };
  if (count < thresholds[1]) return { level: 'yellow', value: `${count} ${unit}` };
  return { level: 'red', value: `${count} ${unit}` };
}

function pctHealth(pct: number, label: string): { level: HealthLevel; value: string } {
  if (pct < 0) return { level: 'gray', value: t('healthScore.noData') };
  if (pct >= 90) return { level: 'green', value: `${pct}% ${label}` };
  if (pct >= 70) return { level: 'yellow', value: `${pct}% ${label}` };
  return { level: 'red', value: `${pct}% ${label}` };
}

// ---------------------------------------------------------------------------
// Mock project health data (until real API endpoints exist)
// ---------------------------------------------------------------------------

interface ProjectHealthData {
  id: string;
  name: string;
  budgetSpentPct: number;
  daysLate: number;
  docCompletePct: number;
  safetyIncidents: number;
  qualityDefects: number;
  procurementOverdue: number;
  itdCompletePct: number;
}

const MOCK_HEALTH: ProjectHealthData[] = [
  {
    id: '1',
    name: 'ЖК Речной',
    budgetSpentPct: 72,
    daysLate: 0,
    docCompletePct: 95,
    safetyIncidents: 0,
    qualityDefects: 1,
    procurementOverdue: 0,
    itdCompletePct: 88,
  },
  {
    id: '2',
    name: 'БЦ Горизонт',
    budgetSpentPct: 94,
    daysLate: 3,
    docCompletePct: 78,
    safetyIncidents: 1,
    qualityDefects: 4,
    procurementOverdue: 2,
    itdCompletePct: 62,
  },
  {
    id: '3',
    name: 'Мост Вятка',
    budgetSpentPct: 105,
    daysLate: 12,
    docCompletePct: 60,
    safetyIncidents: 3,
    qualityDefects: 8,
    procurementOverdue: 5,
    itdCompletePct: 45,
  },
];

function buildMetrics(p: ProjectHealthData): HealthMetric[] {
  const b = budgetHealth(p.budgetSpentPct);
  const s = scheduleHealth(p.daysLate);
  const doc = pctHealth(p.docCompletePct, t('healthScore.complete'));
  const saf = countHealth(p.safetyIncidents, t('healthScore.incidents'), [1, 3]);
  const q = countHealth(p.qualityDefects, t('healthScore.defects'), [3, 6]);
  const pr = countHealth(p.procurementOverdue, t('healthScore.overdue'), [1, 3]);
  const itd = pctHealth(p.itdCompletePct, t('healthScore.complete'));

  return [
    { key: 'budget', label: t('healthScore.budget'), ...b, tooltip: `${t('healthScore.budget')}: ${b.value}` },
    { key: 'schedule', label: t('healthScore.schedule'), ...s, tooltip: `${t('healthScore.schedule')}: ${s.value}` },
    { key: 'documentation', label: t('healthScore.documentation'), ...doc, tooltip: `${t('healthScore.documentation')}: ${doc.value}` },
    { key: 'safety', label: t('healthScore.safety'), ...saf, tooltip: `${t('healthScore.safety')}: ${saf.value}` },
    { key: 'quality', label: t('healthScore.quality'), ...q, tooltip: `${t('healthScore.quality')}: ${q.value}` },
    { key: 'procurement', label: t('healthScore.procurement'), ...pr, tooltip: `${t('healthScore.procurement')}: ${pr.value}` },
    { key: 'itd', label: t('healthScore.itd'), ...itd, tooltip: `${t('healthScore.itd')}: ${itd.value}` },
  ];
}

// ---------------------------------------------------------------------------
// Section Component
// ---------------------------------------------------------------------------

export const HealthScoreSection: React.FC = () => {
  // Try to use recent projects from API so names are real; fall back to mock
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  const projects = useMemo(() => {
    const recentNames = (dashboard?.recentProjects ?? []).slice(0, 5).map((p: any) => p.name);

    // Merge real project names into mock health data
    return MOCK_HEALTH.map((mock, idx) => ({
      ...mock,
      name: recentNames[idx] ?? mock.name,
    }));
  }, [dashboard]);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('healthScore.title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <HealthScoreWidget
            key={p.id}
            title={p.name}
            metrics={buildMetrics(p)}
          />
        ))}
      </div>
    </div>
  );
};
