import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Sparkles,
  Database,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatMoneyCompact, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { projectsApi } from '@/api/projects';
import { financeApi, type MonthlyDistribution } from '@/api/finance';
import {
  computeSCurve,
  generatePlannedDistribution,
  generateActualDistribution,
  type SCurveInput,
  type SCurveDataPoint,
} from '@/lib/sCurve';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(Math.round(value));
}

function shortMonth(monthKey: string): string {
  // "2024-01" -> "01.24"
  const [y, m] = monthKey.split('-');
  return `${m}.${y.slice(2)}`;
}

// ---------------------------------------------------------------------------
// SVG Chart sub-component
// ---------------------------------------------------------------------------

interface ChartProps {
  data: SCurveDataPoint[];
}

const CHART_W = 720;
const CHART_H = 400;
const PAD = { top: 24, right: 24, bottom: 48, left: 72 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const SCurveChart: React.FC<ChartProps> = ({ data }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxVal = useMemo(() => {
    let mx = 0;
    for (const p of data) {
      if (p.cumulativePlanned > mx) mx = p.cumulativePlanned;
      if (p.cumulativeActual > mx) mx = p.cumulativeActual;
    }
    return mx || 1;
  }, [data]);

  // Round up to a nice value
  const yMax = useMemo(() => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil(maxVal / magnitude) * magnitude;
  }, [maxVal]);

  const xScale = useCallback(
    (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * INNER_W : INNER_W / 2),
    [data.length],
  );
  const yScale = useCallback(
    (v: number) => PAD.top + INNER_H - (v / yMax) * INNER_H,
    [yMax],
  );

  const plannedPath = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.cumulativePlanned).toFixed(1)}`).join(' ');
  }, [data, xScale, yScale]);

  const actualPath = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.cumulativeActual).toFixed(1)}`).join(' ');
  }, [data, xScale, yScale]);

  // Filled area under planned line
  const plannedAreaPath = useMemo(() => {
    if (data.length === 0) return '';
    const base = yScale(0);
    const lineParts = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.cumulativePlanned).toFixed(1)}`).join(' ');
    return `${lineParts} L${xScale(data.length - 1).toFixed(1)},${base.toFixed(1)} L${xScale(0).toFixed(1)},${base.toFixed(1)} Z`;
  }, [data, xScale, yScale]);

  const actualAreaPath = useMemo(() => {
    if (data.length === 0) return '';
    const base = yScale(0);
    const lineParts = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.cumulativeActual).toFixed(1)}`).join(' ');
    return `${lineParts} L${xScale(data.length - 1).toFixed(1)},${base.toFixed(1)} L${xScale(0).toFixed(1)},${base.toFixed(1)} Z`;
  }, [data, xScale, yScale]);

  // Y-axis gridlines
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push((yMax / count) * i);
    }
    return ticks;
  }, [yMax]);

  // X-axis labels — show every Nth label to avoid overlap
  const labelStep = useMemo(() => {
    if (data.length <= 12) return 1;
    if (data.length <= 24) return 2;
    return 3;
  }, [data.length]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * CHART_W;
      // Find nearest data point
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dist = Math.abs(xScale(i) - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIdx(minDist < 40 ? closest : null);
    },
    [data, xScale],
  );

  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-auto max-h-[420px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            y1={yScale(tick)}
            x2={CHART_W - PAD.right}
            y2={yScale(tick)}
            className="stroke-neutral-200 dark:stroke-neutral-700"
            strokeDasharray="4 4"
            strokeWidth={0.5}
          />
          <text
            x={PAD.left - 8}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="fill-neutral-400 dark:fill-neutral-500"
            fontSize={10}
          >
            {formatYAxis(tick)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((p, i) =>
        i % labelStep === 0 ? (
          <text
            key={p.month}
            x={xScale(i)}
            y={CHART_H - PAD.bottom + 20}
            textAnchor="middle"
            className="fill-neutral-400 dark:fill-neutral-500"
            fontSize={10}
          >
            {shortMonth(p.month)}
          </text>
        ) : null,
      )}

      {/* Filled areas */}
      <path d={plannedAreaPath} fill="#3b82f6" opacity={0.08} />
      <path d={actualAreaPath} fill="#22c55e" opacity={0.10} />

      {/* Lines */}
      <path d={plannedPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={actualPath} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Data point dots */}
      {data.map((p, i) => (
        <React.Fragment key={`dots-${p.month}`}>
          <circle cx={xScale(i)} cy={yScale(p.cumulativePlanned)} r={2.5} fill="#3b82f6" />
          <circle cx={xScale(i)} cy={yScale(p.cumulativeActual)} r={2.5} fill="#22c55e" />
        </React.Fragment>
      ))}

      {/* Hover crosshair + tooltip */}
      {hoverIdx !== null && hoverPoint && (
        <>
          <line
            x1={xScale(hoverIdx)}
            y1={PAD.top}
            x2={xScale(hoverIdx)}
            y2={CHART_H - PAD.bottom}
            className="stroke-neutral-300 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
          <circle cx={xScale(hoverIdx)} cy={yScale(hoverPoint.cumulativePlanned)} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
          <circle cx={xScale(hoverIdx)} cy={yScale(hoverPoint.cumulativeActual)} r={5} fill="#22c55e" stroke="#fff" strokeWidth={2} />

          {/* Tooltip box */}
          {(() => {
            const tx = Math.min(xScale(hoverIdx) + 12, CHART_W - 180);
            const ty = Math.max(PAD.top, yScale(Math.max(hoverPoint.cumulativePlanned, hoverPoint.cumulativeActual)) - 10);
            return (
              <g>
                <rect x={tx} y={ty} width={160} height={62} rx={6} className="fill-white dark:fill-neutral-800" stroke="#e5e7eb" strokeWidth={0.5} />
                <text x={tx + 8} y={ty + 16} fontSize={11} fontWeight={600} className="fill-neutral-900 dark:fill-neutral-100">
                  {hoverPoint.month}
                </text>
                <circle cx={tx + 8} cy={ty + 30} r={4} fill="#3b82f6" />
                <text x={tx + 18} y={ty + 34} fontSize={10} className="fill-neutral-600 dark:fill-neutral-400">
                  {t('finance.sCurvePage.planned')}: {formatYAxis(hoverPoint.cumulativePlanned)}
                </text>
                <circle cx={tx + 8} cy={ty + 46} r={4} fill="#22c55e" />
                <text x={tx + 18} y={ty + 50} fontSize={10} className="fill-neutral-600 dark:fill-neutral-400">
                  {t('finance.sCurvePage.actual')}: {formatYAxis(hoverPoint.cumulativeActual)}
                </text>
              </g>
            );
          })()}
        </>
      )}

      {/* Axes border lines */}
      <line
        x1={PAD.left}
        y1={PAD.top}
        x2={PAD.left}
        y2={CHART_H - PAD.bottom}
        className="stroke-neutral-300 dark:stroke-neutral-600"
        strokeWidth={1}
      />
      <line
        x1={PAD.left}
        y1={CHART_H - PAD.bottom}
        x2={CHART_W - PAD.right}
        y2={CHART_H - PAD.bottom}
        className="stroke-neutral-300 dark:stroke-neutral-600"
        strokeWidth={1}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const SCurveCashFlowPage: React.FC = () => {
  const [mode, setMode] = useState<'real' | 'demo'>('real');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [totalBudget, setTotalBudget] = useState(150_000_000);
  const [input, setInput] = useState<SCurveInput | null>(null);

  // Real data selectors
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState('');

  // Fetch projects
  const { data: projectsPage } = useQuery({
    queryKey: ['projects-for-scurve'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });
  const projects = projectsPage?.content ?? [];

  // Fetch budgets when project is selected
  const { data: budgetsPage } = useQuery({
    queryKey: ['budgets-for-scurve', selectedProjectId],
    queryFn: () => financeApi.getBudgets({ projectId: selectedProjectId, size: 50 }),
    enabled: !!selectedProjectId,
  });
  const budgets = budgetsPage?.content ?? [];

  // Fetch monthly distribution when budget is selected
  const { data: distributionData, isLoading: distLoading } = useQuery({
    queryKey: ['monthly-distribution', selectedBudgetId],
    queryFn: () => financeApi.getMonthlyDistribution(selectedBudgetId),
    enabled: !!selectedBudgetId && mode === 'real',
  });

  // Auto-fill dates when project changes
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedBudgetId('');
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      if (proj.plannedStartDate) setStartDate(proj.plannedStartDate);
      if (proj.plannedEndDate) setEndDate(proj.plannedEndDate);
      if (proj.budget) setTotalBudget(proj.budget);
    }
  }, [projects]);

  // Convert distribution API response to SCurveInput and set it
  const handleLoadRealData = useCallback(() => {
    if (!distributionData || distributionData.length === 0) return;

    const monthlyPlanned: Record<string, number> = {};
    const monthlyActual: Record<string, number> = {};

    for (const entry of distributionData) {
      monthlyPlanned[entry.month] = entry.planned;
      monthlyActual[entry.month] = entry.actual;
    }

    const months = distributionData.map(d => d.month).sort();
    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];

    const budgetTotal = Object.values(monthlyPlanned).reduce((a, b) => a + b, 0);

    setStartDate(`${firstMonth}-01`);
    setEndDate(`${lastMonth}-28`);
    setTotalBudget(budgetTotal || totalBudget);

    setInput({
      startDate: `${firstMonth}-01`,
      endDate: `${lastMonth}-28`,
      totalBudget: budgetTotal || totalBudget,
      monthlyPlanned,
      monthlyActual,
    });
  }, [distributionData, totalBudget]);

  const handleGenerateDemo = useCallback(() => {
    const months = monthsBetween(startDate, endDate);
    const planned = generatePlannedDistribution(startDate, months, totalBudget);
    const completedMonths = Math.max(1, Math.floor(months * 0.6));
    const actual = generateActualDistribution(planned, completedMonths);

    setInput({
      startDate,
      endDate,
      totalBudget,
      monthlyPlanned: planned,
      monthlyActual: actual,
    });
  }, [startDate, endDate, totalBudget]);

  const data = useMemo<SCurveDataPoint[]>(() => {
    if (!input) return [];
    return computeSCurve(input);
  }, [input]);

  // Summary metrics
  const metrics = useMemo(() => {
    if (data.length === 0) return { totalPlanned: 0, totalActual: 0, variance: 0, variancePct: 0, cpi: 0 };
    const last = data[data.length - 1];
    const totalPlanned = last.cumulativePlanned;
    const totalActual = last.cumulativeActual;
    const variance = totalPlanned - totalActual;
    const variancePct = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
    const cpi = totalActual > 0 ? totalPlanned / totalActual : 0;
    return { totalPlanned, totalActual, variance, variancePct, cpi };
  }, [data]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.sCurvePage.title')}
        subtitle={t('finance.sCurvePage.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.sCurvePage.breadcrumbFinance'), href: '/cash-flow' },
          { label: t('finance.sCurvePage.breadcrumbSCurve') },
        ]}
      />

      {/* Mode toggle */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('real')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              mode === 'real'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            <Database size={14} className="inline mr-1.5 -mt-0.5" />
            {t('finance.sCurvePage.realDataMode')}
          </button>
          <button
            onClick={() => setMode('demo')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              mode === 'demo'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />
            {t('finance.sCurvePage.demoMode')}
          </button>
        </div>
      </div>

      {/* Real data selectors */}
      {mode === 'real' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('finance.sCurvePage.selectProject')}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">---</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('finance.sCurvePage.selectBudget')}
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                disabled={!selectedProjectId}
                className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 disabled:opacity-50"
              >
                <option value="">---</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Button
                variant="primary"
                iconLeft={<Database size={16} />}
                onClick={handleLoadRealData}
                disabled={!selectedBudgetId || distLoading || !distributionData?.length}
                className="w-full"
              >
                {distLoading ? '...' : t('finance.sCurvePage.loadData')}
              </Button>
              {selectedBudgetId && !distLoading && distributionData && distributionData.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t('finance.sCurvePage.noDistribution')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Demo configuration */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.sCurvePage.startDate')}
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.sCurvePage.endDate')}
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('finance.sCurvePage.totalBudget')}
            </label>
            <Input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
              min={0}
              step={1_000_000}
            />
          </div>
          <div>
            <Button
              variant="primary"
              iconLeft={<Sparkles size={16} />}
              onClick={handleGenerateDemo}
              className="w-full"
            >
              {t('finance.sCurvePage.generateDemo')}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Target size={18} />}
            label={t('finance.sCurvePage.metricTotalPlanned')}
            value={formatMoneyCompact(metrics.totalPlanned)}
          />
          <MetricCard
            icon={<TrendingUp size={18} />}
            label={t('finance.sCurvePage.metricTotalActual')}
            value={formatMoneyCompact(metrics.totalActual)}
          />
          <MetricCard
            icon={<TrendingDown size={18} />}
            label={t('finance.sCurvePage.metricVariance')}
            value={`${metrics.variancePct >= 0 ? '+' : ''}${metrics.variancePct.toFixed(1)}%`}
            trend={{
              direction: metrics.variancePct >= 0 ? 'up' : 'down',
              value: formatMoneyCompact(Math.abs(metrics.variance)),
            }}
          />
          <MetricCard
            icon={<Activity size={18} />}
            label={t('finance.sCurvePage.metricCpi')}
            value={metrics.cpi.toFixed(2)}
            trend={{
              direction: metrics.cpi >= 1 ? 'up' : 'down',
              value: metrics.cpi >= 1 ? 'OK' : 'Below 1.0',
            }}
          />
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          {t('finance.sCurvePage.chartTitle')}
        </h3>

        {data.length > 0 ? (
          <>
            <SCurveChart data={data} />

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-2.5 rounded bg-blue-500" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t('finance.sCurvePage.legendPlanned')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2.5 rounded bg-green-500" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t('finance.sCurvePage.legendActual')}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-neutral-400 dark:text-neutral-500">
            {t('finance.sCurvePage.noData')}
          </div>
        )}
      </div>

      {/* Data table */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('finance.sCurvePage.tableTitle')}
          </h3>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colMonth')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colPlanned')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colActual')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colCumPlanned')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colCumActual')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('finance.sCurvePage.colVariance')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => {
                  const variance = point.cumulativePlanned - point.cumulativeActual;
                  return (
                    <tr
                      key={point.month}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <td className="py-2 px-3 tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                        {point.month}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                        {formatMoney(point.planned)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                        {formatMoney(point.actual)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-blue-600 dark:text-blue-400 font-medium">
                        {formatMoney(point.cumulativePlanned)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-green-600 dark:text-green-400 font-medium">
                        {formatMoney(point.cumulativeActual)}
                      </td>
                      <td
                        className={cn(
                          'py-2 px-3 text-right tabular-nums font-medium',
                          variance >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400',
                        )}
                      >
                        {variance > 0 ? '+' : ''}
                        {formatMoney(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SCurveCashFlowPage;
