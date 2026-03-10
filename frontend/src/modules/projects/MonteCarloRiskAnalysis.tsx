import React, { useState, useCallback, useMemo } from 'react';
import { Dice5, Plus, Trash2, BarChart3, Activity, TrendingUp, Target } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import {
  runMonteCarloSimulation,
  type TriangularInput,
  type MonteCarloResult,
} from '@/lib/monteCarlo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const DEFAULT_ITEMS: TriangularInput[] = [
  { name: '', min: 100_000, most_likely: 150_000, max: 220_000 },
  { name: '', min: 50_000, most_likely: 80_000, max: 130_000 },
  { name: '', min: 30_000, most_likely: 40_000, max: 70_000 },
];

// ---------------------------------------------------------------------------
// SVG Histogram
// ---------------------------------------------------------------------------

const Histogram: React.FC<{ result: MonteCarloResult }> = ({ result }) => {
  const { histogram, confidenceInterval } = result;
  const maxCount = Math.max(...histogram.map((b) => b.count));
  const chartW = 600;
  const chartH = 260;
  const padL = 60;
  const padR = 20;
  const padT = 16;
  const padB = 50;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barW = innerW / histogram.length;

  const [ciLow, ciHigh] = confidenceInterval;
  const xMin = histogram[0].binStart;
  const xMax = histogram[histogram.length - 1].binEnd;
  const xScale = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * innerW;

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      className="w-full max-w-[700px]"
      role="img"
      aria-label={t('monteCarloRisk.histogram')}
    >
      {/* Y grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padT + innerH * (1 - frac);
        return (
          <g key={frac}>
            <line
              x1={padL}
              x2={chartW - padR}
              y1={y}
              y2={y}
              className="stroke-neutral-200 dark:stroke-neutral-700"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-neutral-400 dark:fill-neutral-500"
              fontSize={10}
            >
              {Math.round(maxCount * frac)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {histogram.map((bin, i) => {
        const h = maxCount === 0 ? 0 : (bin.count / maxCount) * innerH;
        const x = padL + i * barW;
        const y = padT + innerH - h;
        const ratio = i / (histogram.length - 1);
        // green → amber → red gradient
        const r = Math.round(34 + ratio * 200);
        const g = Math.round(197 - ratio * 150);
        const b_ = Math.round(94 - ratio * 60);
        return (
          <rect
            key={i}
            x={x + 1}
            y={y}
            width={Math.max(barW - 2, 1)}
            height={h}
            fill={`rgb(${r},${g},${b_})`}
            opacity={0.85}
            rx={2}
          >
            <title>
              {fmt(bin.binStart)} – {fmt(bin.binEnd)}: {bin.count}
            </title>
          </rect>
        );
      })}

      {/* 90 % CI band */}
      <rect
        x={xScale(ciLow)}
        y={padT}
        width={Math.max(xScale(ciHigh) - xScale(ciLow), 0)}
        height={innerH}
        className="fill-primary-400/15 dark:fill-primary-500/10"
      />
      <line
        x1={xScale(ciLow)}
        x2={xScale(ciLow)}
        y1={padT}
        y2={padT + innerH}
        className="stroke-primary-500 dark:stroke-primary-400"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <line
        x1={xScale(ciHigh)}
        x2={xScale(ciHigh)}
        y1={padT}
        y2={padT + innerH}
        className="stroke-primary-500 dark:stroke-primary-400"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* X-axis labels (5 ticks) */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const val = xMin + frac * (xMax - xMin);
        const x = padL + frac * innerW;
        return (
          <text
            key={frac}
            x={x}
            y={chartH - 8}
            textAnchor="middle"
            className="fill-neutral-500 dark:fill-neutral-400"
            fontSize={10}
          >
            {fmt(val)}
          </text>
        );
      })}

      {/* Axes */}
      <line
        x1={padL}
        x2={chartW - padR}
        y1={padT + innerH}
        y2={padT + innerH}
        className="stroke-neutral-300 dark:stroke-neutral-600"
      />
      <line
        x1={padL}
        x2={padL}
        y1={padT}
        y2={padT + innerH}
        className="stroke-neutral-300 dark:stroke-neutral-600"
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const MonteCarloRiskAnalysis: React.FC = () => {
  const [items, setItems] = useState<TriangularInput[]>(() =>
    DEFAULT_ITEMS.map((d, i) => ({
      ...d,
      name:
        i === 0
          ? t('monteCarloRisk.exampleMaterials')
          : i === 1
            ? t('monteCarloRisk.exampleLabor')
            : t('monteCarloRisk.exampleEquipment'),
    })),
  );
  const [iterations, setIterations] = useState(10_000);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);

  // ---- Item CRUD -----------------------------------------------------------
  const updateItem = useCallback(
    (idx: number, field: keyof TriangularInput, value: string | number) => {
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
      );
    },
    [],
  );

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { name: '', min: 0, most_likely: 0, max: 0 },
    ]);
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ---- Run simulation ------------------------------------------------------
  const canRun = useMemo(
    () =>
      items.length > 0 &&
      items.every((it) => it.min <= it.most_likely && it.most_likely <= it.max && it.max > 0),
    [items],
  );

  const handleRun = useCallback(() => {
    if (!canRun) return;
    setRunning(true);
    // defer to next tick so the UI updates with the loading state
    requestAnimationFrame(() => {
      const res = runMonteCarloSimulation(items, iterations);
      setResult(res);
      setRunning(false);
    });
  }, [items, iterations, canRun]);

  // ---- Percentile data for table -------------------------------------------
  const percentileRows = useMemo(() => {
    if (!result) return [];
    return [
      { label: t('monteCarloRisk.p10'), value: result.p10 },
      { label: t('monteCarloRisk.p25'), value: result.p25 },
      { label: t('monteCarloRisk.p50'), value: result.p50 },
      { label: t('monteCarloRisk.p75'), value: result.p75 },
      { label: t('monteCarloRisk.p90'), value: result.p90 },
    ];
  }, [result]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('monteCarloRisk.title')}
        subtitle={t('monteCarloRisk.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('monteCarloRisk.breadcrumb') },
        ]}
      />

      {/* ---- Input Section ------------------------------------------------ */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('monteCarloRisk.inputSection')}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={addItem}
          >
            {t('monteCarloRisk.addItem')}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[30%]">
                  {t('monteCarloRisk.name')}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('monteCarloRisk.min')}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('monteCarloRisk.mostLikely')}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('monteCarloRisk.max')}
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  <td className="px-4 py-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder={t('monteCarloRisk.name')}
                      className="w-full"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.min}
                      onChange={(e) =>
                        updateItem(idx, 'min', Number(e.target.value))
                      }
                      className="w-full text-right tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.most_likely}
                      onChange={(e) =>
                        updateItem(idx, 'most_likely', Number(e.target.value))
                      }
                      className="w-full text-right tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={item.max}
                      onChange={(e) =>
                        updateItem(idx, 'max', Number(e.target.value))
                      }
                      className="w-full text-right tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      aria-label={t('monteCarloRisk.removeItem')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Controls ----------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <label
            htmlFor="mc-iterations"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t('monteCarloRisk.iterations')}:
          </label>
          <Input
            id="mc-iterations"
            type="number"
            min={1000}
            max={100_000}
            step={1000}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-32 text-right tabular-nums"
          />
        </div>
        <Button
          iconLeft={<Dice5 size={16} />}
          onClick={handleRun}
          disabled={!canRun}
          loading={running}
        >
          {t('monteCarloRisk.runSimulation')}
        </Button>
      </div>

      {/* ---- Results ------------------------------------------------------ */}
      {result ? (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('monteCarloRisk.results')}
          </h2>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={<BarChart3 size={18} />}
              label={t('monteCarloRisk.mean')}
              value={fmt(result.mean)}
            />
            <MetricCard
              icon={<Activity size={18} />}
              label={t('monteCarloRisk.stdDev')}
              value={fmt(result.stdDev)}
            />
            <MetricCard
              icon={<Target size={18} />}
              label={t('monteCarloRisk.p10')}
              value={fmt(result.p10)}
            />
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('monteCarloRisk.p50')}
              value={fmt(result.p50)}
            />
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('monteCarloRisk.p90')}
              value={fmt(result.p90)}
            />
          </div>

          {/* Histogram */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('monteCarloRisk.histogram')}
            </h3>
            <Histogram result={result} />
          </div>

          {/* Percentile table + CI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Percentile table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('monteCarloRisk.percentileTable')}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('monteCarloRisk.percentile')}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('monteCarloRisk.value')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {percentileRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 font-medium text-neutral-700 dark:text-neutral-300">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-neutral-900 dark:text-neutral-100 font-semibold">
                        {fmt(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 90 % Confidence interval */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                {t('monteCarloRisk.confidenceInterval')}
              </h3>
              <p className="text-3xl font-bold tabular-nums text-primary-600 dark:text-primary-400">
                {t('monteCarloRisk.ciRange', {
                  low: fmt(result.confidenceInterval[0]),
                  high: fmt(result.confidenceInterval[1]),
                })}
              </p>

              {/* Visual bar */}
              <div className="mt-6 relative h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                {(() => {
                  const totalRange = result.p90 - result.p10 || 1;
                  const leftPct =
                    ((result.confidenceInterval[0] - result.p10) / totalRange) * 100;
                  const widthPct =
                    ((result.confidenceInterval[1] - result.confidenceInterval[0]) / totalRange) *
                    100;
                  return (
                    <div
                      className="absolute top-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                      style={{
                        left: `${Math.max(0, leftPct)}%`,
                        width: `${Math.min(100, widthPct)}%`,
                      }}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                <span>{fmt(result.confidenceInterval[0])}</span>
                <span>{fmt(result.confidenceInterval[1])}</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="text-center py-16 text-neutral-400 dark:text-neutral-500">
          <Dice5 size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t('monteCarloRisk.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default MonteCarloRiskAnalysis;
