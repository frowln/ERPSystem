import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { financeApi, type CashFlowChartData } from '@/api/finance';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyData {
  month: string;
  monthShort: string;
  inflow: number;
  outflow: number;
}

const COLORS = {
  inflow: '#10b981',      // emerald-500
  inflowLight: '#d1fae5', // emerald-100
  outflow: '#ef4444',     // red-500
  outflowLight: '#fee2e2', // red-100
  line: '#3b82f6',        // blue-500
  lineArea: 'rgba(59, 130, 246, 0.1)',
  positive: '#10b981',
  negative: '#ef4444',
};

// ---------------------------------------------------------------------------
// Stacked Bar Chart Component
// ---------------------------------------------------------------------------

const StackedBarChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const maxVal = Math.max(...data.flatMap((d) => [d.inflow, d.outflow]));
  const roundedMax = Math.ceil(maxVal / 5000000) * 5000000;

  const chartW = 700;
  const chartH = 300;
  const padL = 70;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barGroupW = innerW / data.length;
  const barW = barGroupW * 0.3;
  const gap = 4;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" role="img" aria-label="Stacked bar chart: cash inflow vs outflow">
        {/* Grid lines & Y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padT + innerH - frac * innerH;
          return (
            <g key={frac}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[9px]">
                {formatMoneyCompact(roundedMax * frac)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = padL + i * barGroupW + barGroupW * 0.15;
          const inflowH = (item.inflow / roundedMax) * innerH;
          const outflowH = (item.outflow / roundedMax) * innerH;

          return (
            <g
              key={item.monthShort}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              {/* Inflow bar */}
              <rect
                x={x}
                y={padT + innerH - inflowH}
                width={barW}
                height={inflowH}
                fill={COLORS.inflow}
                rx={2}
                opacity={hovered === i ? 1 : 0.8}
              />
              {/* Outflow bar */}
              <rect
                x={x + barW + gap}
                y={padT + innerH - outflowH}
                width={barW}
                height={outflowH}
                fill={COLORS.outflow}
                rx={2}
                opacity={hovered === i ? 1 : 0.7}
              />
              {/* X label */}
              <text
                x={x + barW + gap / 2}
                y={chartH - 10}
                textAnchor="middle"
                className="fill-neutral-600 text-[10px] font-medium"
              >
                {item.monthShort}
              </text>

              {/* Tooltip */}
              {hovered === i && (
                <g>
                  <rect
                    x={x - 15}
                    y={padT + innerH - Math.max(inflowH, outflowH) - 50}
                    width={barW * 2 + gap + 30}
                    height={44}
                    fill="white"
                    stroke="#e5e7eb"
                    rx={4}
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
                  />
                  <text x={x + barW} y={padT + innerH - Math.max(inflowH, outflowH) - 34} textAnchor="middle" className="fill-emerald-600 text-[9px]">
                    +{formatMoneyCompact(item.inflow)}
                  </text>
                  <text x={x + barW} y={padT + innerH - Math.max(inflowH, outflowH) - 22} textAnchor="middle" className="fill-red-600 text-[9px]">
                    -{formatMoneyCompact(item.outflow)}
                  </text>
                  <text x={x + barW} y={padT + innerH - Math.max(inflowH, outflowH) - 10} textAnchor="middle" className={cn('text-[9px] font-semibold', item.inflow - item.outflow >= 0 ? 'fill-emerald-700' : 'fill-red-700')}>
                    = {formatMoneyCompact(item.inflow - item.outflow)}
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
// Cumulative Cash Position Line Chart
// ---------------------------------------------------------------------------

const CumulativeLineChart: React.FC<{ data: MonthlyData[]; startBalance: number }> = ({ data, startBalance }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const cumulativeValues = useMemo(() => {
    let balance = startBalance;
    return data.map((d) => {
      balance += d.inflow - d.outflow;
      return balance;
    });
  }, [data, startBalance]);

  const allValues = [startBalance, ...cumulativeValues];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padded = range * 0.1;

  const chartW = 700;
  const chartH = 260;
  const padL = 70;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const xStep = innerW / data.length;

  const scaleY = (val: number) => padT + innerH - ((val - minVal + padded) / (range + padded * 2)) * innerH;

  const startPoint = `${padL},${scaleY(startBalance)}`;
  const linePoints = [startPoint, ...cumulativeValues.map((v, i) => `${padL + (i + 1) * xStep},${scaleY(v)}`)].join(' ');

  // Area fill
  const areaPath = [
    `M ${padL},${scaleY(startBalance)}`,
    ...cumulativeValues.map((v, i) => `L ${padL + (i + 1) * xStep},${scaleY(v)}`),
    `L ${padL + data.length * xStep},${padT + innerH}`,
    `L ${padL},${padT + innerH}`,
    'Z',
  ].join(' ');

  // Y axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => minVal - padded + ((range + padded * 2) * i) / yTicks);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" role="img" aria-label="Line chart: cumulative cash position">
        {/* Grid */}
        {yLabels.map((val, i) => {
          const y = padT + innerH - (i / yTicks) * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-neutral-400 text-[9px]">
                {formatMoneyCompact(val)}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill={COLORS.lineArea} />

        {/* Line */}
        <polyline points={linePoints} fill="none" stroke={COLORS.line} strokeWidth={2.5} />

        {/* Zero line */}
        {minVal < 0 && (
          <line x1={padL} y1={scaleY(0)} x2={chartW - padR} y2={scaleY(0)} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
        )}

        {/* Start point */}
        <circle cx={padL} cy={scaleY(startBalance)} r={4} fill={COLORS.line} stroke="white" strokeWidth={1.5} />

        {/* Data points */}
        {cumulativeValues.map((v, i) => {
          const cx = padL + (i + 1) * xStep;
          const cy = scaleY(v);
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <circle cx={cx} cy={cy} r={hovered === i ? 6 : 4} fill={COLORS.line} stroke="white" strokeWidth={1.5} className="transition-all" />
              <text x={cx} y={chartH - 10} textAnchor="middle" className="fill-neutral-600 text-[10px] font-medium">
                {data[i].monthShort}
              </text>
              {hovered === i && (
                <g>
                  <rect x={cx - 50} y={cy - 30} width={100} height={22} fill="white" stroke="#e5e7eb" rx={4} />
                  <text x={cx} y={cy - 15} textAnchor="middle" className={cn('text-[10px] font-semibold', v >= 0 ? 'fill-blue-700' : 'fill-red-700')}>
                    {formatMoneyCompact(v)}
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
// Main Page Component
// ---------------------------------------------------------------------------

const CashFlowChartPage: React.FC = () => {
  const { data: chartData } = useQuery({
    queryKey: ['cash-flow-chart'],
    queryFn: () => financeApi.getCashFlowChart(),
  });

  const monthlyData = chartData?.monthlyData ?? [];
  const startBalance = chartData?.startBalance ?? 0;

  const totals = useMemo(() => {
    const totalInflow = monthlyData.reduce((s, d) => s + d.inflow, 0);
    const totalOutflow = monthlyData.reduce((s, d) => s + d.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;
    const endBalance = startBalance + netCashFlow;
    const avgMonthlyNet = monthlyData.length > 0 ? netCashFlow / monthlyData.length : 0;
    return { totalInflow, totalOutflow, netCashFlow, endBalance, avgMonthlyNet };
  }, [monthlyData, startBalance]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.cashFlowChart.title')}
        subtitle={t('finance.cashFlowChart.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.cashFlowChart.breadcrumbFinance'), href: '/cash-flow' },
          { label: t('finance.cashFlowChart.breadcrumbCharts') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="rounded-lg border bg-emerald-50 border-emerald-200 px-4 py-3">
          <p className="text-lg font-bold text-emerald-700">{formatMoneyCompact(totals.totalInflow)}</p>
          <p className="text-xs font-medium text-emerald-600 mt-0.5">{t('finance.cashFlowChart.inflow')}</p>
        </div>
        <div className="rounded-lg border bg-red-50 border-red-200 px-4 py-3">
          <p className="text-lg font-bold text-red-700">{formatMoneyCompact(totals.totalOutflow)}</p>
          <p className="text-xs font-medium text-red-600 mt-0.5">{t('finance.cashFlowChart.outflow')}</p>
        </div>
        <div className={cn('rounded-lg border px-4 py-3', totals.netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200')}>
          <p className={cn('text-lg font-bold', totals.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700')}>
            {totals.netCashFlow >= 0 ? '+' : ''}{formatMoneyCompact(totals.netCashFlow)}
          </p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('finance.cashFlowChart.netFlow')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(startBalance)}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('finance.cashFlowChart.startBalance')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(totals.endBalance)}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('finance.cashFlowChart.endBalance')}</p>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('finance.cashFlowChart.monthlyTitle')}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('finance.cashFlowChart.monthlySubtitle')}</p>
        </div>
        <div className="p-5">
          <StackedBarChart data={monthlyData} />
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.inflow }} />
              {t('finance.cashFlowChart.inflow')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.outflow }} />
              {t('finance.cashFlowChart.outflow')}
            </span>
          </div>
        </div>
      </div>

      {/* Cumulative line chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('finance.cashFlowChart.cumulativeTitle')}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('finance.cashFlowChart.cumulativeSubtitle', { balance: formatMoney(startBalance) })}</p>
        </div>
        <div className="p-5">
          <CumulativeLineChart data={monthlyData} startBalance={startBalance} />
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('finance.cashFlowChart.breakdownTitle')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">{t('finance.cashFlowChart.colMonth')}</th>
                <th className="px-4 py-3 text-right font-semibold text-emerald-700">{t('finance.cashFlowChart.inflow')}</th>
                <th className="px-4 py-3 text-right font-semibold text-red-700">{t('finance.cashFlowChart.outflow')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('finance.cashFlowChart.netFlow')}</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">{t('finance.cashFlowChart.colBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let balance = startBalance;
                return monthlyData.map((d, i) => {
                  const net = d.inflow - d.outflow;
                  balance += net;
                  const isNegNet = net < 0;
                  return (
                    <tr key={d.month} className={cn('border-b border-neutral-100', i % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800/50')}>
                      <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{d.month}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">+{formatMoney(d.inflow)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-red-600">-{formatMoney(d.outflow)}</td>
                      <td className={cn('px-4 py-2.5 text-right tabular-nums font-medium', isNegNet ? 'text-red-600' : 'text-emerald-700')}>
                        {isNegNet ? '' : '+'}{formatMoney(net)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(balance)}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
                <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">{t('finance.cashFlowChart.totalRow')}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">+{formatMoney(totals.totalInflow)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-red-600">-{formatMoney(totals.totalOutflow)}</td>
                <td className={cn('px-4 py-3 text-right tabular-nums font-bold', totals.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                  {totals.netCashFlow >= 0 ? '+' : ''}{formatMoney(totals.netCashFlow)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(totals.endBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChartPage;
