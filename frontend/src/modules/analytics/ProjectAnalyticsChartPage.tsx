import React, { useState } from 'react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface ProjectBudget {
  name: string;
  budget: number;
  actual: number;
}

const projectBudgets: ProjectBudget[] = [
  { name: 'ЖК "Солнечный"', budget: 85000000, actual: 72000000 },
  { name: 'БЦ "Горизонт"', budget: 42000000, actual: 38500000 },
  { name: 'Мост р. Вятка', budget: 120000000, actual: 95000000 },
  { name: 'Школа N15', budget: 35000000, actual: 32000000 },
  { name: 'ТЦ "Простор"', budget: 55000000, actual: 61000000 },
];

interface ProgressPoint {
  month: string;
  planned: number;
  actual: number;
}

const progressData: ProgressPoint[] = [
  { month: 'Сен', planned: 5,  actual: 4 },
  { month: 'Окт', planned: 15, actual: 12 },
  { month: 'Ноя', planned: 28, actual: 24 },
  { month: 'Дек', planned: 40, actual: 36 },
  { month: 'Янв', planned: 52, actual: 48 },
  { month: 'Фев', planned: 62, actual: 57 },
  { month: 'Мар', planned: 72, actual: 0 },
  { month: 'Апр', planned: 80, actual: 0 },
  { month: 'Май', planned: 88, actual: 0 },
  { month: 'Июн', planned: 95, actual: 0 },
  { month: 'Июл', planned: 100, actual: 0 },
];

interface BudgetCategory {
  name: string;
  amount: number;
  color: string;
}

const getBudgetCategories = (): BudgetCategory[] => [
  { name: t('analytics.projectChart.catMaterials'), amount: 120000000, color: '#3b82f6' },
  { name: t('analytics.projectChart.catWorks'), amount: 95000000, color: '#10b981' },
  { name: t('analytics.projectChart.catEquipment'), amount: 42000000, color: '#f59e0b' },
  { name: t('analytics.projectChart.catPayroll'), amount: 55000000, color: '#8b5cf6' },
  { name: t('analytics.projectChart.catOverhead'), amount: 25000000, color: '#ef4444' },
];

// ---------------------------------------------------------------------------
// SVG Chart helpers
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  budget: '#93c5fd',   // blue-300
  actual: '#3b82f6',   // blue-500
  overBudget: '#ef4444', // red-500
  planned: '#d1d5db',  // gray-300
  actualLine: '#3b82f6',
};

// ---------------------------------------------------------------------------
// Bar Chart Component
// ---------------------------------------------------------------------------

const BarChart: React.FC<{ data: ProjectBudget[] }> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.flatMap((d) => [d.budget, d.actual]));
  const chartH = 280;
  const chartW = 600;
  const barGroupW = chartW / data.length;
  const barW = barGroupW * 0.3;
  const gap = 6;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW + 80} ${chartH + 60}`} className="w-full max-w-[700px] mx-auto" role="img" aria-label="Bar chart: budget vs actual">
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = chartH - frac * chartH + 20;
          return (
            <g key={frac}>
              <line x1={60} y1={y} x2={chartW + 60} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={55} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[10px]">
                {formatMoneyCompact(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = 60 + i * barGroupW + barGroupW * 0.15;
          const budgetH = (item.budget / maxVal) * chartH;
          const actualH = (item.actual / maxVal) * chartH;
          const isOver = item.actual > item.budget;

          return (
            <g
              key={item.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              {/* Budget bar */}
              <rect
                x={x}
                y={chartH - budgetH + 20}
                width={barW}
                height={budgetH}
                fill={CHART_COLORS.budget}
                rx={3}
                opacity={hovered === i ? 1 : 0.85}
              />
              {/* Actual bar */}
              <rect
                x={x + barW + gap}
                y={chartH - actualH + 20}
                width={barW}
                height={actualH}
                fill={isOver ? CHART_COLORS.overBudget : CHART_COLORS.actual}
                rx={3}
                opacity={hovered === i ? 1 : 0.85}
              />
              {/* X label */}
              <text
                x={x + barW + gap / 2}
                y={chartH + 38}
                textAnchor="middle"
                className="fill-neutral-600 text-[10px] font-medium"
              >
                {item.name}
              </text>

              {/* Tooltip */}
              {hovered === i && (
                <g>
                  <rect
                    x={x - 10}
                    y={chartH - Math.max(budgetH, actualH) + 20 - 40}
                    width={barW * 2 + gap + 20}
                    height={34}
                    fill="white"
                    stroke="#e5e7eb"
                    rx={4}
                  />
                  <text x={x + barW} y={chartH - Math.max(budgetH, actualH) + 20 - 24} textAnchor="middle" className="fill-neutral-600 text-[9px]">
                    {t('analytics.projectChart.budget')}: {formatMoneyCompact(item.budget)}
                  </text>
                  <text x={x + barW} y={chartH - Math.max(budgetH, actualH) + 20 - 12} textAnchor="middle" className={cn('text-[9px]', isOver ? 'fill-red-600' : 'fill-blue-600')}>
                    {t('analytics.projectChart.fact')}: {formatMoneyCompact(item.actual)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Line Chart Component
// ---------------------------------------------------------------------------

const LineChart: React.FC<{ data: ProgressPoint[] }> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const chartW = 600;
  const chartH = 240;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxY = 100;
  const xStep = innerW / (data.length - 1);

  const plannedPoints = data.map((p, i) => `${padL + i * xStep},${padT + innerH - (p.planned / maxY) * innerH}`);
  const actualPoints = data.filter((p) => p.actual > 0).map((p, i) => `${padL + i * xStep},${padT + innerH - (p.actual / maxY) * innerH}`);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[700px] mx-auto" role="img" aria-label="Line chart: cumulative progress">
        {/* Grid */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padT + innerH - (val / maxY) * innerH;
          return (
            <g key={val}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[10px]">
                {val}%
              </text>
            </g>
          );
        })}

        {/* Planned line */}
        <polyline
          points={plannedPoints.join(' ')}
          fill="none"
          stroke={CHART_COLORS.planned}
          strokeWidth={2}
          strokeDasharray="6 3"
        />

        {/* Actual line */}
        <polyline
          points={actualPoints.join(' ')}
          fill="none"
          stroke={CHART_COLORS.actualLine}
          strokeWidth={2.5}
        />

        {/* Data points */}
        {data.map((p, i) => {
          const cx = padL + i * xStep;
          return (
            <g key={p.month} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {/* Planned dot */}
              <circle cx={cx} cy={padT + innerH - (p.planned / maxY) * innerH} r={3} fill={CHART_COLORS.planned} />
              {/* Actual dot */}
              {p.actual > 0 && (
                <circle cx={cx} cy={padT + innerH - (p.actual / maxY) * innerH} r={4} fill={CHART_COLORS.actualLine} stroke="white" strokeWidth={1.5} />
              )}
              {/* X label */}
              <text x={cx} y={chartH - 4} textAnchor="middle" className="fill-neutral-500 text-[10px]">
                {p.month}
              </text>
              {/* Tooltip */}
              {hovered === i && (
                <g>
                  <rect x={cx - 45} y={padT + innerH - (p.planned / maxY) * innerH - 36} width={90} height={30} fill="white" stroke="#e5e7eb" rx={4} />
                  <text x={cx} y={padT + innerH - (p.planned / maxY) * innerH - 22} textAnchor="middle" className="fill-neutral-500 text-[9px]">
                    {t('analytics.projectChart.plan')}: {p.planned}%
                  </text>
                  <text x={cx} y={padT + innerH - (p.planned / maxY) * innerH - 10} textAnchor="middle" className="fill-blue-600 text-[9px] font-medium">
                    {t('analytics.projectChart.fact')}: {p.actual > 0 ? `${p.actual}%` : '—'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pie Chart Component
// ---------------------------------------------------------------------------

const PieChart: React.FC<{ data: BudgetCategory[] }> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const cx = 140;
  const cy = 140;
  const r = 110;
  const innerR = 60;

  let cumAngle = -Math.PI / 2;

  const slices = data.map((cat, i) => {
    const angle = (cat.amount / total) * Math.PI * 2;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    // Label position
    const midAngle = startAngle + angle / 2;
    const labelR = r + 16;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { path, color: cat.color, lx, ly, name: cat.name, pct: ((cat.amount / total) * 100).toFixed(1), isHovered: hovered === i, index: i };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 360 280" className="w-full max-w-[400px] mx-auto" role="img" aria-label="Pie chart: budget allocation">
        {slices.map((s) => (
          <g key={s.name} onMouseEnter={() => setHovered(s.index)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
            <path
              d={s.path}
              fill={s.color}
              opacity={s.isHovered ? 1 : 0.85}
              stroke="white"
              strokeWidth={2}
              transform={s.isHovered ? `translate(${(s.lx - cx) * 0.03}, ${(s.ly - cy) * 0.03})` : ''}
            />
          </g>
        ))}

        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-neutral-500 text-[10px]">{t('analytics.projectChart.total')}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-neutral-900 text-[13px] font-bold">{formatMoneyCompact(total)}</text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((cat, i) => (
          <div
            key={cat.name}
            className={cn('flex items-center gap-1.5 text-xs cursor-pointer', hovered === i && 'font-semibold')}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-neutral-600">{cat.name}</span>
            <span className="text-neutral-400">({((cat.amount / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const ProjectAnalyticsChartPage: React.FC = () => {
  const budgetCategories = getBudgetCategories();
  const totalBudget = projectBudgets.reduce((s, p) => s + p.budget, 0);
  const totalActual = projectBudgets.reduce((s, p) => s + p.actual, 0);
  const utilization = ((totalActual / totalBudget) * 100).toFixed(1);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.projectChart.title')}
        subtitle={t('analytics.projectChart.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.dashboard.title'), href: '/analytics' },
          { label: t('analytics.projectChart.breadcrumb') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{projectBudgets.length}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.projects')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(totalBudget)}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.totalBudget')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(totalActual)}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.utilized')}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 border-blue-200 px-4 py-3">
          <p className="text-2xl font-bold text-blue-700">{utilization}%</p>
          <p className="text-xs font-medium text-blue-600 mt-0.5">{t('analytics.projectChart.utilization')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('analytics.projectChart.budgetVsActual')}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.budgetVsActualDesc')}</p>
          </div>
          <div className="p-5">
            <BarChart data={projectBudgets} />
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.budget }} />
                {t('analytics.projectChart.budget')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.actual }} />
                {t('analytics.projectChart.fact')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.overBudget }} />
                {t('analytics.projectChart.overBudget')}
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('analytics.projectChart.budgetByCategory')}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.budgetByCategoryDesc')}</p>
          </div>
          <div className="p-5">
            <PieChart data={budgetCategories} />
          </div>
        </div>

        {/* Line Chart - full width */}
        <div className="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('analytics.projectChart.cumulativeProgress')}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.projectChart.cumulativeProgressDesc')}</p>
          </div>
          <div className="p-5">
            <LineChart data={progressData} />
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-dashed border-gray-300" />
                {t('analytics.projectChart.plan')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-blue-500" />
                {t('analytics.projectChart.fact')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget details table */}
      <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('analytics.projectChart.projectDetails')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">{t('analytics.projectChart.colProject')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('analytics.projectChart.budget')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('analytics.projectChart.fact')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('analytics.projectChart.variance')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('analytics.projectChart.completionPct')}</th>
              </tr>
            </thead>
            <tbody>
              {projectBudgets.map((p) => {
                const diff = p.actual - p.budget;
                const pct = ((p.actual / p.budget) * 100).toFixed(1);
                const isOver = diff > 0;
                return (
                  <tr key={p.name} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{p.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(p.budget)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(p.actual)}</td>
                    <td className={cn('px-4 py-2.5 text-right tabular-nums font-medium', isOver ? 'text-red-600' : 'text-green-600')}>
                      {isOver ? '+' : ''}{formatMoney(diff)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalyticsChartPage;
