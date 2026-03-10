import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import {
  Brain, TrendingUp, TrendingDown, ShieldAlert, AlertTriangle,
  Info, Lightbulb, CheckCircle, Clock, DollarSign, HardHat, Bug,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { useThemeStore } from '@/hooks/useTheme';

const MONTHS_12 = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function generateBurndown() {
  let budgetActual = 120_000_000;
  let budgetPredicted = 120_000_000;
  const planned = 120_000_000;
  return MONTHS_12.map((m, i) => {
    const spendPlan = planned / 12;
    const spendActual = i < 8 ? spendPlan * (0.85 + Math.random() * 0.35) : 0;
    const spendPred = i >= 7 ? spendPlan * (1.02 + Math.random() * 0.12) : 0;
    budgetActual = Math.max(0, budgetActual - spendActual);
    budgetPredicted = Math.max(0, budgetPredicted - (i < 8 ? spendActual : spendPred));
    return {
      month: m,
      planned: Math.round(planned - spendPlan * (i + 1)),
      actual: i < 8 ? Math.round(budgetActual) : undefined,
      predicted: i >= 7 ? Math.round(budgetPredicted) : undefined,
    };
  });
}

const burndownData = generateBurndown();

const spiCpiData = MONTHS_12.map((m, i) => ({
  month: m,
  spi: +(0.92 + Math.sin(i * 0.5) * 0.08 + i * 0.005).toFixed(2),
  cpi: +(0.88 + Math.cos(i * 0.3) * 0.06 + i * 0.008).toFixed(2),
}));

// Risk heatmap data
interface Risk {
  id: string;
  index: number;
  name: string;
  probability: number; // 1-5
  impact: number; // 1-5
  description: string;
  mitigation: string;
}

const MOCK_RISKS: Risk[] = [
  { id: 'f1a2b3c4-0001-4000-8000-000000000001', index: 1, name: 'Задержка поставки стали', probability: 4, impact: 5, description: 'Основной поставщик задерживает отгрузку на 3 недели', mitigation: 'Подключить альтернативного поставщика' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000002', index: 2, name: 'Нехватка электриков', probability: 3, impact: 4, description: 'Дефицит квалифицированных электриков на рынке', mitigation: 'Заключить договор с кадровым агентством' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000003', index: 3, name: 'Погодные условия', probability: 3, impact: 3, description: 'Прогнозируются обильные осадки в октябре', mitigation: 'Перенести наружные работы на сентябрь' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000004', index: 4, name: 'Изменение нормативов', probability: 2, impact: 4, description: 'Возможные изменения в СНиП по теплоизоляции', mitigation: 'Мониторинг нормативных актов' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000005', index: 5, name: 'Рост цен на бетон', probability: 4, impact: 3, description: 'Прогнозируемый рост цен +12% к Q3', mitigation: 'Зафиксировать цену по контракту' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000006', index: 6, name: 'Аварийное ТО крана', probability: 2, impact: 5, description: 'Кран КБ-403 требует капремонта через 2 месяца', mitigation: 'Запланировать плановое ТО заранее' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000007', index: 7, name: 'Субподрядчик банкрот', probability: 1, impact: 5, description: 'Финансовая нестабильность ООО СтройМонтаж', mitigation: 'Банковская гарантия + мониторинг' },
  { id: 'f1a2b3c4-0001-4000-8000-000000000008', index: 8, name: 'Конфликт смежников', probability: 3, impact: 2, description: 'Пересечение графиков ОВ и ЭМ', mitigation: 'Координационное совещание еженедельно' },
];

// Trend cards data
const costTrendData = [
  { m: 'Окт', v: 8.2 }, { m: 'Ноя', v: 9.1 }, { m: 'Дек', v: 8.8 },
  { m: 'Янв', v: 10.3 }, { m: 'Фев', v: 11.0 }, { m: 'Мар', v: 10.5 },
  { m: 'Апр', v: 11.2 }, { m: 'Май', v: 12.0 }, { m: 'Июн', v: 12.5 },
];
const scheduleTrendData = [
  { m: 'Окт', plan: 15, fact: 14 }, { m: 'Ноя', plan: 22, fact: 20 },
  { m: 'Дек', plan: 30, fact: 27 }, { m: 'Янв', plan: 38, fact: 34 },
  { m: 'Фев', plan: 45, fact: 41 }, { m: 'Мар', plan: 52, fact: 48 },
  { m: 'Апр', plan: 60, fact: 55 }, { m: 'Май', plan: 67, fact: 62 },
  { m: 'Июн', plan: 75, fact: 69 },
];
const safetyTrendData = [
  { m: 'Окт', v: 3 }, { m: 'Ноя', v: 2 }, { m: 'Дек', v: 4 },
  { m: 'Янв', v: 2 }, { m: 'Фев', v: 1 }, { m: 'Мар', v: 1 },
  { m: 'Апр', v: 0 }, { m: 'Май', v: 1 }, { m: 'Июн', v: 0 },
];
const qualityTrendData = [
  { m: 'Окт', v: 5.2 }, { m: 'Ноя', v: 4.8 }, { m: 'Дек', v: 4.5 },
  { m: 'Янв', v: 3.9 }, { m: 'Фев', v: 3.5 }, { m: 'Мар', v: 3.2 },
  { m: 'Апр', v: 2.8 }, { m: 'Май', v: 2.5 }, { m: 'Июн', v: 2.2 },
];

// AI Insights
interface AiInsight {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action: string;
  confidence: number;
}

const MOCK_INSIGHTS: AiInsight[] = [
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000001', severity: 'critical',
    title: 'Перерасход бюджета вероятен в Q3',
    description: 'На основе текущей скорости расходования средств (+8% к плану) прогнозируется перерасход бюджета на 12-15 млн ₽ к сентябрю.',
    action: 'Провести ревизию закупок и оптимизировать расходы на материалы',
    confidence: 87,
  },
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000002', severity: 'warning',
    title: 'Задержка графика на 14 дней',
    description: 'SPI = 0.93 за последние 3 месяца. При сохранении тренда объект будет сдан на 14 дней позже планового срока.',
    action: 'Увеличить численность бригады на монолитных работах',
    confidence: 79,
  },
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000003', severity: 'warning',
    title: 'Риск дефицита арматуры A500C',
    description: 'Анализ складских остатков и темпов расхода показывает исчерпание запаса через 18 рабочих дней.',
    action: 'Разместить заказ на 45 тонн арматуры у резервного поставщика',
    confidence: 92,
  },
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000004', severity: 'info',
    title: 'Оптимизация логистики снизит затраты',
    description: 'Консолидация доставки с 3 складов в 1 хаб сократит транспортные расходы на ~340 тыс. ₽/мес.',
    action: 'Рассмотреть предложение ТК "ДелоТранс" по хабовой доставке',
    confidence: 71,
  },
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000005', severity: 'info',
    title: 'Производительность труда выше нормы',
    description: 'Бригады на отделочных работах показывают выработку 115% от плана за последние 4 недели.',
    action: 'Рассмотреть премирование и тиражирование методик',
    confidence: 95,
  },
  {
    id: 'f2a3b4c5-0001-4000-8000-000000000006', severity: 'critical',
    title: 'Безопасность: повторяющиеся нарушения на участке 3',
    description: '3 замечания по ТБ за последние 2 недели на одном участке. Паттерн указывает на системную проблему.',
    action: 'Внеплановый инструктаж + проверка ИТР участка',
    confidence: 84,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const WidgetCard: React.FC<{ title: string; children: React.ReactNode; className?: string; icon?: React.ReactNode }> = ({ title, children, className, icon }) => (
  <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5', className)}>
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>}
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
    </div>
    {children}
  </div>
);

const ChartTooltip: React.FC<{ active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-600 dark:text-neutral-400">{entry.name}:</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{entry.value != null ? entry.value.toLocaleString() : '--'}</span>
        </div>
      ))}
    </div>
  );
};

// Traffic light indicator
const TrafficLight: React.FC<{ status: 'green' | 'yellow' | 'red'; label: string }> = ({ status, label }) => {
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  };
  const textColors = {
    green: 'text-emerald-700 dark:text-emerald-400',
    yellow: 'text-amber-700 dark:text-amber-400',
    red: 'text-red-700 dark:text-red-400',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-3 h-3 rounded-full shadow-sm', colors[status])} />
      <span className={cn('text-sm font-medium', textColors[status])}>{label}</span>
    </div>
  );
};

// Risk Heatmap
const HEATMAP_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 dark:bg-emerald-900/30',
  2: 'bg-emerald-200 dark:bg-emerald-800/40',
  3: 'bg-yellow-100 dark:bg-yellow-900/30',
  4: 'bg-amber-200 dark:bg-amber-800/40',
  5: 'bg-orange-200 dark:bg-orange-800/40',
  6: 'bg-amber-300 dark:bg-amber-700/50',
  8: 'bg-orange-300 dark:bg-orange-700/50',
  9: 'bg-red-200 dark:bg-red-800/40',
  10: 'bg-red-300 dark:bg-red-700/50',
  12: 'bg-red-400 dark:bg-red-600/60',
  15: 'bg-red-500 dark:bg-red-500/70',
  16: 'bg-red-500 dark:bg-red-500/70',
  20: 'bg-red-600 dark:bg-red-400/80',
  25: 'bg-red-700 dark:bg-red-300/90',
};

function getHeatmapColor(score: number): string {
  const keys = Object.keys(HEATMAP_COLORS).map(Number).sort((a, b) => a - b);
  let match = keys[0];
  for (const k of keys) {
    if (k <= score) match = k;
  }
  return HEATMAP_COLORS[match] || 'bg-neutral-100 dark:bg-neutral-800';
}

const RiskHeatmap: React.FC<{ risks: Risk[]; onRiskClick: (r: Risk) => void }> = ({ risks, onRiskClick }) => {
  const impactLabels = [t('analytics.predictive.impactVeryHigh'), t('analytics.predictive.impactHigh'), t('analytics.predictive.impactMedium'), t('analytics.predictive.impactLow'), t('analytics.predictive.impactVeryLow')];
  const probLabels = [t('analytics.predictive.probRare'), t('analytics.predictive.probUnlikely'), t('analytics.predictive.probPossible'), t('analytics.predictive.probLikely'), t('analytics.predictive.probAlmostCertain')];

  return (
    <div>
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center items-center w-8 mr-1">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 [writing-mode:vertical-lr] rotate-180">
            {t('analytics.predictive.impact')}
          </span>
        </div>
        <div className="flex-1">
          {/* Y-axis labels + grid */}
          <div className="flex flex-col gap-1">
            {[5, 4, 3, 2, 1].map((impact, yi) => (
              <div key={impact} className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 w-16 text-right pr-1 truncate">
                  {impactLabels[yi]}
                </span>
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4, 5].map((prob) => {
                    const score = prob * impact;
                    const cellRisks = risks.filter(r => r.probability === prob && r.impact === impact);
                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={cn(
                          'flex-1 aspect-square rounded-md flex items-center justify-center relative min-h-[36px]',
                          getHeatmapColor(score),
                        )}
                      >
                        {cellRisks.map((risk) => (
                          <button
                            key={risk.id}
                            onClick={() => onRiskClick(risk)}
                            className="w-5 h-5 rounded-full bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 text-[9px] font-bold flex items-center justify-center hover:scale-125 transition-transform shadow-sm cursor-pointer"
                            title={risk.name}
                          >
                            {risk.index}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* X-axis labels */}
          <div className="flex gap-1 ml-[68px] mt-1">
            {probLabels.map((label) => (
              <div key={label} className="flex-1 text-center">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate block">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center mt-1">{t('analytics.predictive.probability')}</p>
        </div>
      </div>
    </div>
  );
};

// Mini sparkline for trend cards
const Sparkline: React.FC<{ data: Array<{ m: string; v: number }>; color: string; height?: number }> = ({ data, color, height = 48 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// Insight severity config
const SEVERITY_CONFIG = {
  info: { icon: Info, bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', iconColor: 'text-blue-500', badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' },
  warning: { icon: AlertTriangle, bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', iconColor: 'text-amber-500', badge: 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300' },
  critical: { icon: ShieldAlert, bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', iconColor: 'text-red-500', badge: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' },
};

// What-If scenario calculator
const WhatIfPanel: React.FC = () => {
  const [workerDelta, setWorkerDelta] = useState(0);
  const baseWorkers = 120;
  const baseDuration = 365;
  const baseCost = 120_000_000;

  const adjustedWorkers = baseWorkers + workerDelta;
  const efficiencyFactor = Math.pow(baseWorkers / adjustedWorkers, 0.7);
  const adjustedDuration = Math.round(baseDuration * efficiencyFactor);
  const daysDelta = adjustedDuration - baseDuration;
  const costMultiplier = adjustedWorkers / baseWorkers;
  const adjustedCost = Math.round(baseCost * (0.6 + 0.4 * costMultiplier));
  const costDelta = adjustedCost - baseCost;

  return (
    <div className="space-y-5">
      {/* Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('analytics.predictive.whatIfWorkers')}
          </label>
          <span className={cn(
            'text-sm font-semibold',
            workerDelta > 0 ? 'text-emerald-600' : workerDelta < 0 ? 'text-red-600' : 'text-neutral-600 dark:text-neutral-400',
          )}>
            {adjustedWorkers} ({workerDelta > 0 ? '+' : ''}{workerDelta})
          </span>
        </div>
        <input
          type="range"
          min={-24}
          max={24}
          value={workerDelta}
          onChange={(e) => setWorkerDelta(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
          <span>{baseWorkers - 24}</span>
          <span>{baseWorkers}</span>
          <span>{baseWorkers + 24}</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.whatIfScheduleImpact')}</span>
          </div>
          <p className={cn(
            'text-lg font-semibold',
            daysDelta < 0 ? 'text-emerald-600' : daysDelta > 0 ? 'text-red-600' : 'text-neutral-700 dark:text-neutral-300',
          )}>
            {daysDelta > 0 ? '+' : ''}{daysDelta} {t('analytics.predictive.days')}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {adjustedDuration} {t('analytics.predictive.daysTotal')}
          </p>
        </div>
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={14} className="text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.whatIfCostImpact')}</span>
          </div>
          <p className={cn(
            'text-lg font-semibold',
            costDelta > 0 ? 'text-red-600' : costDelta < 0 ? 'text-emerald-600' : 'text-neutral-700 dark:text-neutral-300',
          )}>
            {costDelta > 0 ? '+' : ''}{(costDelta / 1_000_000).toFixed(1)} {t('analytics.predictive.millionShort')}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {(adjustedCost / 1_000_000).toFixed(1)} {t('analytics.predictive.millionTotal')}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
        {t('analytics.predictive.whatIfDisclaimer')}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PredictiveAnalyticsPage: React.FC = () => {
  const { options: projectOptions } = useProjectOptions();
  const [selectedProject, setSelectedProject] = useState('');
  const isDark = useThemeStore((s) => s.resolved === 'dark');
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const tickColor = isDark ? '#94a3b8' : '#94a3b8';
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const currentSpi = spiCpiData[spiCpiData.length - 1]?.spi ?? 1;
  const currentCpi = spiCpiData[spiCpiData.length - 1]?.cpi ?? 1;

  const scheduleStatus: 'green' | 'yellow' | 'red' = currentSpi >= 0.98 ? 'green' : currentSpi >= 0.90 ? 'yellow' : 'red';
  const budgetStatus: 'green' | 'yellow' | 'red' = currentCpi >= 0.98 ? 'green' : currentCpi >= 0.90 ? 'yellow' : 'red';

  const statusLabels = useMemo(() => ({
    green: t('analytics.predictive.statusOnTrack'),
    yellow: t('analytics.predictive.statusAtRisk'),
    red: t('analytics.predictive.statusOffTrack'),
  }), []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.predictive.title')}
        subtitle={t('analytics.predictive.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.title'), href: '/analytics' },
          { label: t('analytics.predictive.title') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={selectedProject || projectOptions[0]?.value || ''}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-52"
          />
        }
      />

      {/* ── Section 1: Project Health Forecast ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-primary-500" />
          {t('analytics.predictive.healthForecast')}
        </h2>

        {/* Traffic lights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricCard label="SPI" value={currentSpi.toFixed(2)} trend={{ direction: currentSpi >= 1 ? 'up' : 'down', value: `${((currentSpi - 1) * 100).toFixed(1)}%` }} />
          <MetricCard label="CPI" value={currentCpi.toFixed(2)} trend={{ direction: currentCpi >= 1 ? 'up' : 'down', value: `${((currentCpi - 1) * 100).toFixed(1)}%` }} />
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 flex flex-col justify-center">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t('analytics.predictive.scheduleOutlook')}</p>
            <TrafficLight status={scheduleStatus} label={statusLabels[scheduleStatus]} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 flex flex-col justify-center">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t('analytics.predictive.budgetOutlook')}</p>
            <TrafficLight status={budgetStatus} label={statusLabels[budgetStatus]} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget burndown */}
          <WidgetCard title={t('analytics.predictive.budgetBurndown')} icon={<DollarSign size={16} />}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)} ${t('analytics.predictive.millionShort')}`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
                <Line type="monotone" dataKey="planned" name={t('analytics.predictive.chartPlanned')} stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="actual" name={t('analytics.predictive.chartActual')} stroke="#3b82f6" strokeWidth={2} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" name={t('analytics.predictive.chartPredicted')} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </WidgetCard>

          {/* SPI/CPI trends */}
          <WidgetCard title={t('analytics.predictive.spiCpiTrend')} icon={<TrendingUp size={16} />}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spiCpiData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.7, 1.3]} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
                {/* Reference line at 1.0 */}
                <Line type="monotone" dataKey={() => 1} name={t('analytics.predictive.baseline')} stroke="#d1d5db" strokeDasharray="3 3" dot={false} strokeWidth={1} legendType="none" />
                <Line type="monotone" dataKey="spi" name="SPI" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="cpi" name="CPI" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </WidgetCard>
        </div>
      </section>

      {/* ── Section 2: Risk Heatmap ── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WidgetCard title={t('analytics.predictive.riskHeatmap')} icon={<ShieldAlert size={16} />} className="lg:col-span-2">
            <RiskHeatmap risks={MOCK_RISKS} onRiskClick={setSelectedRisk} />
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-3">
              {t('analytics.predictive.riskHeatmapHint')}
            </p>
          </WidgetCard>

          {/* Risk detail */}
          <WidgetCard title={t('analytics.predictive.riskDetail')}>
            {selectedRisk ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.riskName')}</span>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{selectedRisk.name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.probability')}</span>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{selectedRisk.probability}/5</p>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.impact')}</span>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{selectedRisk.impact}/5</p>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.riskScore')}</span>
                    <p className="text-sm font-bold text-red-600">{selectedRisk.probability * selectedRisk.impact}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.riskDescription')}</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedRisk.description}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('analytics.predictive.riskMitigation')}</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedRisk.mitigation}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-400 dark:text-neutral-500">
                <ShieldAlert size={32} className="mb-2" />
                <p className="text-sm">{t('analytics.predictive.riskSelectHint')}</p>
              </div>
            )}
          </WidgetCard>
        </div>
      </section>

      {/* ── Section 3: Trend Analysis Cards ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" />
          {t('analytics.predictive.trendAnalysis')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cost trend */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-blue-500" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('analytics.predictive.trendCost')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">10.5 {t('analytics.predictive.millionShort')}</p>
            <div className="flex items-center gap-1 text-xs text-red-500 mb-2">
              <TrendingUp size={12} /> +8.2%
            </div>
            <Sparkline data={costTrendData} color="#3b82f6" />
          </div>

          {/* Schedule trend */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-violet-500" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('analytics.predictive.trendSchedule')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">69% / 75%</p>
            <div className="flex items-center gap-1 text-xs text-amber-500 mb-2">
              <TrendingDown size={12} /> -6%
            </div>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scheduleTrendData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Area type="monotone" dataKey="plan" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.1} strokeWidth={1} dot={false} />
                  <Area type="monotone" dataKey="fact" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Safety trend */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <HardHat size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('analytics.predictive.trendSafety')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">0</p>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mb-2">
              <TrendingDown size={12} /> {t('analytics.predictive.trendDecreasing')}
            </div>
            <Sparkline data={safetyTrendData} color="#22c55e" />
          </div>

          {/* Quality trend */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bug size={14} className="text-orange-500" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('analytics.predictive.trendQuality')}</span>
            </div>
            <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">2.2%</p>
            <div className="flex items-center gap-1 text-xs text-emerald-500 mb-2">
              <TrendingDown size={12} /> -0.3%
            </div>
            <Sparkline data={qualityTrendData} color="#f97316" />
          </div>
        </div>
      </section>

      {/* ── Section 4: AI Insights ── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Brain size={20} className="text-violet-500" />
          {t('analytics.predictive.aiInsights')}
        </h2>
        <div className="space-y-3">
          {MOCK_INSIGHTS.map((insight) => {
            const cfg = SEVERITY_CONFIG[insight.severity];
            const Icon = cfg.icon;
            return (
              <div
                key={insight.id}
                className={cn('rounded-xl border p-4', cfg.bgClass)}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className={cn('flex-shrink-0 mt-0.5', cfg.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{insight.title}</h4>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', cfg.badge)}>
                        {t(`analytics.predictive.severity${insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}`)}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 ml-auto flex-shrink-0">
                        {t('analytics.predictive.confidence')}: {insight.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">{insight.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <Lightbulb size={12} className="text-amber-500 flex-shrink-0" />
                      <span className="font-medium">{t('analytics.predictive.recommendedAction')}:</span>
                      <span>{insight.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 5: What-If Scenarios ── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WidgetCard title={t('analytics.predictive.whatIfTitle')} icon={<Lightbulb size={16} />}>
            <WhatIfPanel />
          </WidgetCard>

          {/* Summary panel */}
          <WidgetCard title={t('analytics.predictive.forecastSummary')} icon={<CheckCircle size={16} />}>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{t('analytics.predictive.forecastOnTime')}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{t('analytics.predictive.forecastOnTimeDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{t('analytics.predictive.forecastBudget')}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{t('analytics.predictive.forecastBudgetDesc')}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={14} className="text-blue-500" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{t('analytics.predictive.forecastRisks')}</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{t('analytics.predictive.forecastRisksDesc')}</p>
              </div>
            </div>
          </WidgetCard>
        </div>
      </section>
    </div>
  );
};

export default PredictiveAnalyticsPage;
