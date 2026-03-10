import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Table2,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  CalendarDays,
  FileText,
  HardHat,
  Bug,
  Truck,
  ClipboardList,
  ExternalLink,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { projectsApi } from '@/api/projects';
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

// ---------------------------------------------------------------------------
// Health computation (Procore-like thresholds)
// ---------------------------------------------------------------------------

function computeRag(project: Project): Omit<ProjectHealth, 'project'> {
  const spent = project.spentAmount ?? 0;
  const budget = project.budget ?? project.budgetAmount ?? 1;
  const pctSpent = budget > 0 ? (spent / budget) * 100 : 0;

  // Budget: green <90%, yellow 90-100%, red >100%
  let budgetRag: RagStatus = 'green';
  if (pctSpent > 100) budgetRag = 'red';
  else if (pctSpent >= 90) budgetRag = 'yellow';

  // Schedule: based on progress and date proximity
  const now = new Date();
  const end = project.plannedEndDate ? new Date(project.plannedEndDate) : null;
  const diffDays = end ? Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const progress = project.progress ?? 0;
  let scheduleRag: RagStatus = 'green';
  if (diffDays < -7) scheduleRag = 'red';
  else if (diffDays < 0) scheduleRag = 'yellow';
  else if (progress < 50 && diffDays < 30) scheduleRag = 'yellow';

  // Documentation: simulate from progress
  const docPct = Math.min(100, progress + 15);
  let docRag: RagStatus = 'green';
  if (docPct < 70) docRag = 'red';
  else if (docPct < 90) docRag = 'yellow';

  // Safety: simulate — use hash for deterministic pseudo-random
  const safetyIncidents = hashCode(project.id + 'safety') % 5;
  let safetyRag: RagStatus = 'green';
  if (safetyIncidents >= 3) safetyRag = 'red';
  else if (safetyIncidents >= 1) safetyRag = 'yellow';

  // Quality: open defects simulation
  const openDefects = hashCode(project.id + 'quality') % 25;
  let qualityRag: RagStatus = 'green';
  if (openDefects > 15) qualityRag = 'red';
  else if (openDefects >= 5) qualityRag = 'yellow';

  // Procurement: delayed orders simulation
  const delayed = hashCode(project.id + 'proc') % 6;
  let procRag: RagStatus = 'green';
  if (delayed > 3) procRag = 'red';
  else if (delayed >= 1) procRag = 'yellow';

  // ITD: completion simulation
  const itdPct = Math.min(100, progress + 5);
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

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Mock data (realistic Russian project names for demo)
// ---------------------------------------------------------------------------

const MOCK_PROJECTS: Project[] = [
  makeProject('e1a2b3c4-0001-4000-8000-000000000001', 'ЖК-001', 'ЖК "Солнечный квартал"', 'IN_PROGRESS', 72, 450_000_000, 380_000_000, 'Иванов А.С.', '2024-03-01', '2026-09-30'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000002', 'СК-015', 'Складской комплекс "Логистик"', 'IN_PROGRESS', 45, 280_000_000, 300_000_000, 'Петров В.М.', '2024-06-01', '2025-12-31'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000003', 'ОФ-008', 'Бизнес-центр "Горизонт"', 'IN_PROGRESS', 88, 620_000_000, 540_000_000, 'Сидорова Е.К.', '2023-01-15', '2025-06-30'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000004', 'ШК-022', 'Школа №47 (реконструкция)', 'IN_PROGRESS', 35, 180_000_000, 90_000_000, 'Козлов Д.И.', '2024-09-01', '2025-08-31'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000005', 'ДС-003', 'Детский сад "Радуга"', 'PLANNING', 12, 95_000_000, 25_000_000, 'Морозова Н.П.', '2025-01-10', '2026-03-01'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000006', 'МД-044', 'Мост через р. Вятка', 'IN_PROGRESS', 60, 1_200_000_000, 850_000_000, 'Волков С.А.', '2023-06-01', '2026-12-31'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000007', 'ТЦ-011', 'ТРЦ "Центральный"', 'ON_HOLD', 28, 350_000_000, 120_000_000, 'Кузнецов Р.Л.', '2024-04-01', '2026-06-30'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000008', 'АД-007', 'Автодорога М-7 (участок 12км)', 'IN_PROGRESS', 55, 800_000_000, 620_000_000, 'Новикова А.Г.', '2024-01-15', '2025-10-15'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000009', 'ЖД-002', 'ЖК "Речной парк"', 'IN_PROGRESS', 92, 520_000_000, 490_000_000, 'Лебедев М.В.', '2022-11-01', '2025-04-30'),
  makeProject('e1a2b3c4-0001-4000-8000-000000000010', 'ПР-019', 'Промзона "Восток" (корпус 3)', 'DRAFT', 5, 220_000_000, 15_000_000, 'Федоров К.Ю.', '2025-06-01', '2027-01-31'),
];

function makeProject(
  id: string, code: string, name: string, status: string,
  progress: number, budget: number, spent: number, manager: string,
  start: string, end: string,
): Project {
  return {
    id, code, name,
    status: status as Project['status'],
    type: 'RESIDENTIAL',
    priority: 'NORMAL',
    progress,
    budget,
    spentAmount: spent,
    managerId: id,
    managerName: manager,
    customerName: 'Заказчик',
    membersCount: Math.floor(Math.random() * 30) + 5,
    plannedStartDate: start,
    plannedEndDate: end,
    createdAt: start,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// RAG dot component
// ---------------------------------------------------------------------------

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

const RAG_LABELS: Record<RagStatus, string> = {
  green: 'ragGreen',
  yellow: 'ragYellow',
  red: 'ragRed',
  gray: 'ragGray',
};

const RagDot: React.FC<{ status: RagStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => (
  <span
    className={cn(
      'inline-block rounded-full ring-2',
      RAG_COLORS[status],
      RAG_RING_COLORS[status],
      size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5',
    )}
    title={t(`portfolioHealth.${RAG_LABELS[status]}`)}
  />
);

// ---------------------------------------------------------------------------
// Health score bar
// ---------------------------------------------------------------------------

const HealthScoreBar: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
        {score}/{max}
      </span>
      <div className="w-20 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Aggregate pie chart (pure SVG)
// ---------------------------------------------------------------------------

const MiniPieChart: React.FC<{ green: number; yellow: number; red: number }> = ({ green, yellow, red }) => {
  const total = green + yellow + red || 1;
  const gAngle = (green / total) * 360;
  const yAngle = (yellow / total) * 360;

  function arc(startAngle: number, endAngle: number, color: string) {
    if (endAngle - startAngle <= 0) return null;
    const r = 40;
    const cx = 50;
    const cy = 50;
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startAngle - 90));
    const y1 = cy + r * Math.sin(rad(startAngle - 90));
    const x2 = cx + r * Math.cos(rad(endAngle - 90));
    const y2 = cy + r * Math.sin(rad(endAngle - 90));
    return (
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={color}
      />
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      {arc(0, gAngle, '#10b981')}
      {arc(gAngle, gAngle + yAngle, '#f59e0b')}
      {arc(gAngle + yAngle, 360, '#ef4444')}
      {total === 0 && <circle cx="50" cy="50" r="40" fill="#d4d4d4" />}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Status label
// ---------------------------------------------------------------------------

function getStatusLabels(): Record<string, string> {
  return {
    DRAFT: t('portfolioHealth.statusDraft'),
    PLANNING: t('portfolioHealth.statusPlanning'),
    IN_PROGRESS: t('portfolioHealth.statusInProgress'),
    ON_HOLD: t('portfolioHealth.statusOnHold'),
    COMPLETED: t('portfolioHealth.statusCompleted'),
    CANCELLED: t('portfolioHealth.statusCancelled'),
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  PLANNING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ON_HOLD: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface Filters {
  status: string;
  manager: string;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'typeResidential',
  COMMERCIAL: 'typeCommercial',
  INDUSTRIAL: 'typeIndustrial',
  INFRASTRUCTURE: 'typeInfrastructure',
  RENOVATION: 'typeRenovation',
};

const FilterBar: React.FC<{
  filters: Filters;
  onFilterChange: (f: Filters) => void;
  managers: string[];
}> = ({ filters, onFilterChange, managers }) => {
  const selectCn = 'text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={selectCn}
        value={filters.status}
        onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
      >
        <option value="">{t('portfolioHealth.allStatuses')}</option>
        {Object.entries(getStatusLabels()).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select
        className={selectCn}
        value={filters.type}
        onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
      >
        <option value="">{t('portfolioHealth.allTypes')}</option>
        {Object.entries(TYPE_LABELS).map(([k, lk]) => (
          <option key={k} value={k}>{t(`portfolioHealth.${lk}`)}</option>
        ))}
      </select>
      <select
        className={selectCn}
        value={filters.manager}
        onChange={(e) => onFilterChange({ ...filters, manager: e.target.value })}
      >
        <option value="">{t('portfolioHealth.allManagers')}</option>
        {managers.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table View (Procore-style)
// ---------------------------------------------------------------------------

const METRIC_COLS: { key: keyof Omit<ProjectHealth, 'project' | 'healthScore' | 'maxScore'>; icon: React.ElementType; labelKey: string }[] = [
  { key: 'budget', icon: Wallet, labelKey: 'portfolioHealth.colBudget' },
  { key: 'schedule', icon: CalendarDays, labelKey: 'portfolioHealth.colSchedule' },
  { key: 'documentation', icon: FileText, labelKey: 'portfolioHealth.colDocumentation' },
  { key: 'safety', icon: HardHat, labelKey: 'portfolioHealth.colSafety' },
  { key: 'quality', icon: Bug, labelKey: 'portfolioHealth.colQuality' },
  { key: 'procurement', icon: Truck, labelKey: 'portfolioHealth.colProcurement' },
  { key: 'itd', icon: ClipboardList, labelKey: 'portfolioHealth.colItd' },
];

type SortKey = 'name' | 'healthScore' | keyof Omit<ProjectHealth, 'project' | 'healthScore' | 'maxScore'>;
type SortDir = 'asc' | 'desc';

const RAG_ORDER: Record<RagStatus, number> = { green: 0, yellow: 1, red: 2, gray: 3 };

const TableView: React.FC<{ items: ProjectHealth[] }> = ({ items }) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('healthScore');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.project.name.localeCompare(b.project.name, 'ru');
      else if (sortKey === 'healthScore') cmp = a.healthScore - b.healthScore;
      else cmp = RAG_ORDER[a[sortKey]] - RAG_ORDER[b[sortKey]];
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-primary-500" /> : <ArrowDown className="w-3 h-3 text-primary-500" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th
              className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3 px-4 w-64 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              onClick={() => toggleSort('name')}
            >
              <span className="inline-flex items-center gap-1">
                {t('portfolioHealth.colProject')} <SortIcon col="name" />
              </span>
            </th>
            <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3 px-3 w-28">
              {t('portfolioHealth.colStatus')}
            </th>
            {METRIC_COLS.map((col) => (
              <th
                key={col.key}
                className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3 px-2 w-20 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                onClick={() => toggleSort(col.key)}
              >
                <div className="flex flex-col items-center gap-1">
                  <col.icon className="w-3.5 h-3.5" />
                  <span className="inline-flex items-center gap-0.5">{t(col.labelKey)} <SortIcon col={col.key} /></span>
                </div>
              </th>
            ))}
            <th
              className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3 px-3 w-36 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              onClick={() => toggleSort('healthScore')}
            >
              <span className="inline-flex items-center gap-1">
                {t('portfolioHealth.colHealthScore')} <SortIcon col="healthScore" />
              </span>
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
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">
                    {item.project.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {item.project.code} &middot; {item.project.managerName}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[item.project.status] || '')}>
                  {getStatusLabels()[item.project.status] || item.project.status}
                </span>
              </td>
              {METRIC_COLS.map((col) => (
                <td key={col.key} className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center">
                    <RagDot status={item[col.key]} />
                  </div>
                </td>
              ))}
              <td className="py-3 px-3">
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
// Card View (Asana-style)
// ---------------------------------------------------------------------------

const BORDER_COLOR_MAP: Record<string, string> = {
  healthy: 'border-l-emerald-500',
  atRisk: 'border-l-amber-400',
  critical: 'border-l-red-500',
};

function overallLevel(score: number, max: number): 'healthy' | 'atRisk' | 'critical' {
  const pct = score / max;
  if (pct >= 0.7) return 'healthy';
  if (pct >= 0.4) return 'atRisk';
  return 'critical';
}

function formatBudget(v: number | undefined | null): string {
  const val = v ?? 0;
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} ${t('portfolioHealth.unitBln')}`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} ${t('portfolioHealth.unitMln')}`;
  return val.toLocaleString('ru-RU');
}

const CardView: React.FC<{ items: ProjectHealth[] }> = ({ items }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => {
        const level = overallLevel(item.healthScore, item.maxScore);
        return (
          <div
            key={item.project.id}
            className={cn(
              'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 border-l-4 p-5 cursor-pointer hover:shadow-md transition-shadow',
              BORDER_COLOR_MAP[level],
            )}
            onClick={() => navigate(`/projects/${item.project.id}`)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {item.project.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {item.project.code} &middot; {item.project.managerName}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('portfolioHealth.progress')}
                </span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {item.project.progress}%
                </span>
              </div>
              <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${item.project.progress}%` }}
                />
              </div>
            </div>

            {/* RAG dots row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {METRIC_COLS.map((col) => (
                <div key={col.key} className="flex items-center gap-1" title={t(col.labelKey)}>
                  <RagDot status={item[col.key]} size="sm" />
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                    {t(col.labelKey)}
                  </span>
                </div>
              ))}
            </div>

            {/* Budget vs Actual */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-500 dark:text-neutral-400">{t('portfolioHealth.budgetVsActual')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatBudget(item.project.spentAmount)} / {formatBudget(item.project.budget)}
              </span>
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">{t('portfolioHealth.dates')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatDate(item.project.plannedStartDate)} - {formatDate(item.project.plannedEndDate)}
              </span>
            </div>

            {/* Health Score */}
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <HealthScoreBar score={item.healthScore} max={item.maxScore} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Aggregate summary section
// ---------------------------------------------------------------------------

const AggregateSummary: React.FC<{ items: ProjectHealth[] }> = ({ items }) => {
  const { greenCount, yellowCount, redCount, alerts } = useMemo(() => {
    let g = 0, y = 0, r = 0;
    const alertList: string[] = [];
    let budgetExceeded = 0;
    let scheduleDelayed = 0;

    for (const item of items) {
      const level = overallLevel(item.healthScore, item.maxScore);
      if (level === 'healthy') g++;
      else if (level === 'atRisk') y++;
      else r++;

      if (item.budget === 'red') budgetExceeded++;
      if (item.schedule === 'red') scheduleDelayed++;
    }

    if (budgetExceeded > 0) {
      alertList.push(t('portfolioHealth.alertBudgetExceeded', { count: String(budgetExceeded) }));
    }
    if (scheduleDelayed > 0) {
      alertList.push(t('portfolioHealth.alertScheduleDelay', { count: String(scheduleDelayed) }));
    }

    return { greenCount: g, yellowCount: y, redCount: r, alerts: alertList };
  }, [items]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        {/* Pie chart */}
        <div className="shrink-0">
          <MiniPieChart green={greenCount} yellow={yellowCount} red={redCount} />
        </div>

        {/* Summary stats */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('portfolioHealth.projectsHealthy', { count: String(greenCount), total: String(items.length) })}
          </h3>
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('portfolioHealth.healthy')}: {greenCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('portfolioHealth.atRisk')}: {yellowCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('portfolioHealth.critical')}: {redCount}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-1">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

type ViewMode = 'table' | 'cards';

function exportToCSV(items: ProjectHealth[]) {
  const ragLabel = (s: RagStatus) => ({ green: '✓', yellow: '⚠', red: '✗', gray: '—' })[s];
  const header = [t('portfolioHealth.colProject'), t('portfolioHealth.colStatus'), ...METRIC_COLS.map(c => t(c.labelKey)), t('portfolioHealth.colHealthScore')];
  const rows = items.map(item => [
    item.project.name,
    getStatusLabels()[item.project.status] || item.project.status,
    ...METRIC_COLS.map(c => ragLabel(item[c.key])),
    `${item.healthScore}/${item.maxScore}`,
  ]);
  const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio-health.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const PortfolioHealthPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<Filters>({ status: '', manager: '', type: '' });

  // Try to load real projects; fall back to mock data
  const { data: apiProjects } = useQuery({
    queryKey: ['projects', 'portfolio-health'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
    staleTime: 5 * 60_000,
  });

  const projects = useMemo(() => {
    const raw = apiProjects?.content?.length ? apiProjects.content : MOCK_PROJECTS;
    return raw;
  }, [apiProjects]);

  const managers = useMemo(() => {
    const set = new Set(projects.map((p) => p.managerName).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.manager && p.managerName !== filters.manager) return false;
      return true;
    });
  }, [projects, filters]);

  const healthItems: ProjectHealth[] = useMemo(() => {
    return filteredProjects.map((p) => ({
      project: p,
      ...computeRag(p),
    }));
  }, [filteredProjects]);

  const activeCount = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('portfolioHealth.title')}
        subtitle={t('portfolioHealth.subtitle', { count: String(activeCount) })}
        actions={
          <div className="flex items-center gap-3">
            <FilterBar filters={filters} onFilterChange={setFilters} managers={managers} />
            {/* Export */}
            <button
              onClick={() => exportToCSV(healthItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              title={t('portfolioHealth.exportExcel')}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('portfolioHealth.exportExcel')}</span>
            </button>
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                  view === 'table'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                )}
                onClick={() => setView('table')}
              >
                <Table2 className="w-4 h-4" />
                {t('portfolioHealth.viewTable')}
              </button>
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-l border-neutral-200 dark:border-neutral-700',
                  view === 'cards'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                )}
                onClick={() => setView('cards')}
              >
                <LayoutGrid className="w-4 h-4" />
                {t('portfolioHealth.viewCards')}
              </button>
            </div>
          </div>
        }
      />

      {/* Aggregate summary */}
      <AggregateSummary items={healthItems} />

      {/* Data view */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        {view === 'table' ? (
          <TableView items={healthItems} />
        ) : (
          <div className="p-5">
            <CardView items={healthItems} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {healthItems.length === 0 && (
        <div className="text-center py-16">
          <ShieldCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('portfolioHealth.emptyState')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioHealthPage;
