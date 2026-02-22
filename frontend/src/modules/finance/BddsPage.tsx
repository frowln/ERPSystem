/**
 * BddsPage — БДДС (Бюджет Движения Денежных Средств)
 *
 * Ежемесячный план/факт кассовых потоков по категориям.
 * Строки = статьи БДДС, столбцы = месяцы выбранного года.
 * Плановые значения редактируются вручную (хранятся в localStorage).
 * Фактические значения загружаются из API платежей.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ChevronDown, ChevronRight, Download, RefreshCw,
  TrendingUp, TrendingDown, Wallet, Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { projectsApi } from '@/api/projects';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatMoneyCompact, formatMoneyWhole } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  t('finance.bdds.monthJan'), t('finance.bdds.monthFeb'), t('finance.bdds.monthMar'), t('finance.bdds.monthApr'), t('finance.bdds.monthMay'), t('finance.bdds.monthJun'),
  t('finance.bdds.monthJul'), t('finance.bdds.monthAug'), t('finance.bdds.monthSep'), t('finance.bdds.monthOct'), t('finance.bdds.monthNov'), t('finance.bdds.monthDec'),
];

const MONTH_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// БДДС line items
interface BddsLine {
  id: string;
  label: string;
  group: 'income' | 'expense';
  sublabel?: string;
  highlight?: boolean;
}

const BDDS_LINES: BddsLine[] = [
  // ── Поступления ──
  { id: 'inc_customer',   label: t('finance.bdds.lineFromClient'),           group: 'income' },
  { id: 'inc_advance',    label: t('finance.bdds.lineAdvancesReceived'),            group: 'income' },
  { id: 'inc_other',      label: t('finance.bdds.lineOtherIncome'),           group: 'income' },
  // ── Выплаты ──
  { id: 'exp_subcontract',label: t('finance.bdds.lineSubcontractors'),                group: 'expense' },
  { id: 'exp_materials',  label: t('finance.bdds.lineMaterialsSupply'),         group: 'expense' },
  { id: 'exp_equipment',  label: t('finance.bdds.lineEquipmentRental'),          group: 'expense' },
  { id: 'exp_labor',      label: t('finance.bdds.linePayroll'),           group: 'expense' },
  { id: 'exp_overhead',   label: t('finance.bdds.lineOverhead'),            group: 'expense' },
  { id: 'exp_vat',        label: t('finance.bdds.lineVatBudget'),           group: 'expense', sublabel: t('finance.bdds.taxPayments') },
  { id: 'exp_other',      label: t('finance.bdds.lineOtherExpenses'),               group: 'expense' },
];

const INCOME_IDS = new Set(BDDS_LINES.filter((l) => l.group === 'income').map((l) => l.id));
const EXPENSE_IDS = new Set(BDDS_LINES.filter((l) => l.group === 'expense').map((l) => l.id));

// ─── Types ────────────────────────────────────────────────────────────────────

// plan[lineId][monthIdx (0-11)] = amount in roubles
type PlanMatrix = Record<string, number[]>;

const EMPTY_YEAR_PLAN = (): number[] => Array(12).fill(0);

const STORAGE_KEY = (projectId: string, year: number) =>
  `privod:bdds:plan:${projectId}:${year}`;

function loadPlan(projectId: string, year: number): PlanMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId, year));
    if (!raw) return {};
    return JSON.parse(raw) as PlanMatrix;
  } catch { return {}; }
}

function savePlan(projectId: string, year: number, plan: PlanMatrix) {
  try {
    localStorage.setItem(STORAGE_KEY(projectId, year), JSON.stringify(plan));
  } catch { /* quota */ }
}

function getPlanRow(plan: PlanMatrix, lineId: string): number[] {
  return plan[lineId] ?? EMPTY_YEAR_PLAN();
}

// ─── Editable cell ────────────────────────────────────────────────────────────

interface PlanCellProps {
  value: number;
  onChange: (v: number) => void;
  editable: boolean;
}

const PlanCell: React.FC<PlanCellProps> = ({ value, onChange, editable }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (!editable) return;
    setDraft(value === 0 ? '' : String(Math.round(value / 1000)));
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft.replace(/\s/g, '').replace(',', '.')) || 0;
    onChange(num * 1000);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full text-xs text-right tabular-nums bg-primary-50 dark:bg-primary-900/30 border border-primary-300 rounded px-1 py-0.5 outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') commit(); if (e.key === 'Escape') setEditing(false); }}
        placeholder={t('finance.bdds.thousandRub')}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className={cn(
        'text-xs tabular-nums text-right px-1 py-0.5 rounded transition-colors',
        editable && 'cursor-text hover:bg-neutral-100 dark:hover:bg-neutral-700',
        value === 0 ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-200',
      )}
    >
      {value === 0 ? '—' : formatMoneyWhole(value)}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const BddsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [projectId, setProjectId] = useState('all');
  const [plan, setPlan] = useState<PlanMatrix>({});
  const [editMode, setEditMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ income: true, expense: true });
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  // Load plan from localStorage when project/year changes
  useEffect(() => {
    setPlan(loadPlan(projectId, year));
  }, [projectId, year]);

  // Save plan to localStorage on every change
  const updatePlan = useCallback((lineId: string, monthIdx: number, value: number) => {
    setPlan((prev) => {
      const row = [...(prev[lineId] ?? EMPTY_YEAR_PLAN())];
      row[monthIdx] = value;
      const next = { ...prev, [lineId]: row };
      savePlan(projectId, year, next);
      return next;
    });
  }, [projectId, year]);

  // ── Fetch actual payments ──────────────────────────────────────────────────

  const { data: paymentsPage, isLoading: paymentsLoading, refetch } = useQuery({
    queryKey: ['bdds-payments', projectId, year],
    queryFn: () => financeApi.getPayments({
      projectId: projectId !== 'all' ? projectId : undefined,
      size: 500,
      sort: 'paymentDate,asc',
    }),
  });

  const { data: projectsPage } = useQuery({
    queryKey: ['projects-for-bdds'],
    queryFn: () => projectsApi.getProjects({ size: 100 }),
    staleTime: 5 * 60_000,
  });

  const projects = projectsPage?.content ?? [];
  const payments = paymentsPage?.content ?? [];

  // ── Build fact matrix ──────────────────────────────────────────────────────

  const factMatrix = useMemo(() => {
    const mat: Record<string, number[]> = {};
    BDDS_LINES.forEach((line) => { mat[line.id] = EMPTY_YEAR_PLAN(); });

    payments.forEach((p) => {
      if (!p.paymentDate) return;
      const d = new Date(p.paymentDate);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth(); // 0-11
      const amt = p.totalAmount ?? p.amount ?? 0;

      if (p.paymentType === 'INCOMING') {
        mat['inc_customer'][m] += amt;
      } else {
        // Outgoing — try to categorize by purpose/notes
        const purpose = (p.purpose ?? '').toLowerCase();
        if (purpose.includes('субподряд') || purpose.includes('subcontract') || purpose.includes('субподрядчик')) {
          mat['exp_subcontract'][m] += amt;
        } else if (purpose.includes('материал') || purpose.includes('поставк') || purpose.includes('material')) {
          mat['exp_materials'][m] += amt;
        } else if (purpose.includes('зарплат') || purpose.includes('фот') || purpose.includes('оплат') || purpose.includes('salary')) {
          mat['exp_labor'][m] += amt;
        } else if (purpose.includes('ндс') || purpose.includes('налог') || purpose.includes('vat')) {
          mat['exp_vat'][m] += amt;
        } else if (purpose.includes('аренд') || purpose.includes('оборудов')) {
          mat['exp_equipment'][m] += amt;
        } else {
          mat['exp_other'][m] += amt;
        }
      }
    });

    return mat;
  }, [payments, year]);

  // ── Derived totals ─────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const planIncome = Array(12).fill(0);
    const planExpense = Array(12).fill(0);
    const factIncome = Array(12).fill(0);
    const factExpense = Array(12).fill(0);

    BDDS_LINES.forEach((line) => {
      const planRow = getPlanRow(plan, line.id);
      const factRow = factMatrix[line.id] ?? EMPTY_YEAR_PLAN();
      for (let m = 0; m < 12; m++) {
        if (line.group === 'income') {
          planIncome[m] += planRow[m];
          factIncome[m] += factRow[m];
        } else {
          planExpense[m] += planRow[m];
          factExpense[m] += factRow[m];
        }
      }
    });

    const planNet = planIncome.map((v, i) => v - planExpense[i]);
    const factNet = factIncome.map((v, i) => v - factExpense[i]);

    // Cumulative balance (opening balance = 0)
    const planBalance = planNet.reduce<number[]>((acc, v, i) => {
      acc.push((acc[i - 1] ?? 0) + v);
      return acc;
    }, []);
    const factBalance = factNet.reduce<number[]>((acc, v, i) => {
      acc.push((acc[i - 1] ?? 0) + v);
      return acc;
    }, []);

    return {
      planIncome, planExpense, planNet, planBalance,
      factIncome, factExpense, factNet, factBalance,
      totalPlanIncome: planIncome.reduce((s, v) => s + v, 0),
      totalPlanExpense: planExpense.reduce((s, v) => s + v, 0),
      totalFactIncome: factIncome.reduce((s, v) => s + v, 0),
      totalFactExpense: factExpense.reduce((s, v) => s + v, 0),
    };
  }, [plan, factMatrix]);

  const currentMonth = new Date().getMonth(); // for "до сегодня" styling

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = useMemo(() => MONTHS.map((label, i) => ({
    month: label,
    planIncome: Math.round(totals.planIncome[i] / 1000),
    factIncome: Math.round(totals.factIncome[i] / 1000),
    planExpense: Math.round(totals.planExpense[i] / 1000),
    factExpense: Math.round(totals.factExpense[i] / 1000),
    planBalance: Math.round(totals.planBalance[i] / 1000),
  })), [totals]);

  // ── Excel export ───────────────────────────────────────────────────────────

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const header = [t('finance.bdds.colItem'), t('finance.bdds.colType'), ...MONTHS, t('finance.bdds.colTotal')];

    const rows: (string | number)[][] = [
      [t('finance.bdds.excelTitle')],
      [`${t('finance.bdds.excelYear')}: ${year}`, '', `${t('finance.bdds.excelProject')}: ${projectId === 'all' ? t('finance.bdds.all') : projects.find((p) => p.id === projectId)?.name ?? projectId}`],
      [],
      header,
    ];

    BDDS_LINES.forEach((line) => {
      const planRow = getPlanRow(plan, line.id);
      const factRow = factMatrix[line.id] ?? EMPTY_YEAR_PLAN();
      const planTotal = planRow.reduce((s, v) => s + v, 0);
      const factTotal = factRow.reduce((s, v) => s + v, 0);
      rows.push([line.label, t('finance.bdds.plan'), ...planRow, planTotal]);
      rows.push([line.label, t('finance.bdds.fact'), ...factRow, factTotal]);
    });

    rows.push([]);
    rows.push([t('finance.bdds.totalIncome'), t('finance.bdds.plan'), ...totals.planIncome, totals.totalPlanIncome]);
    rows.push([t('finance.bdds.totalIncome'), t('finance.bdds.fact'), ...totals.factIncome, totals.totalFactIncome]);
    rows.push([t('finance.bdds.totalExpenses'), t('finance.bdds.plan'), ...totals.planExpense, totals.totalPlanExpense]);
    rows.push([t('finance.bdds.totalExpenses'), t('finance.bdds.fact'), ...totals.factExpense, totals.totalFactExpense]);
    rows.push([t('finance.bdds.netFlowPlan'), '', ...totals.planNet, totals.totalPlanIncome - totals.totalPlanExpense]);
    rows.push([t('finance.bdds.netFlowFact'), '', ...totals.factNet, totals.totalFactIncome - totals.totalFactExpense]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 8 }, ...MONTHS.map(() => ({ wch: 14 })), { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, t('finance.bdds.title'));
    XLSX.writeFile(wb, `${t('finance.bdds.title')}_${year}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const projectOptions = [
    { value: 'all', label: t('finance.bdds.allProjects') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const yearOptions = [2024, 2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) }));

  const cellCls = 'px-2 py-1.5 text-xs tabular-nums text-right whitespace-nowrap min-w-[88px]';
  const factStyle = (plan: number, fact: number) =>
    fact === 0 ? 'text-neutral-300' :
    fact >= plan * 0.95 ? 'text-green-600 font-medium' :
    'text-red-600 font-medium';

  const renderLineRows = (line: BddsLine) => {
    const planRow = getPlanRow(plan, line.id);
    const factRow = factMatrix[line.id] ?? EMPTY_YEAR_PLAN();
    const planTotal = planRow.reduce((s, v) => s + v, 0);
    const factTotal = factRow.reduce((s, v) => s + v, 0);

    return (
      <React.Fragment key={line.id}>
        {/* Plan row */}
        <tr className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
          <td className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 sticky left-0 bg-white dark:bg-neutral-900" rowSpan={2}>
            <div>{line.label}</div>
            {line.sublabel && <div className="text-neutral-400 text-[10px]">{line.sublabel}</div>}
          </td>
          <td className="px-2 py-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase">
              {t('finance.bdds.plan')}
            </span>
          </td>
          {MONTHS.map((_, i) => (
            <td key={i} className={cn(cellCls, i > currentMonth && year === currentYear ? 'opacity-60' : '')}>
              <PlanCell
                value={planRow[i]}
                onChange={(v) => updatePlan(line.id, i, v)}
                editable={editMode}
              />
            </td>
          ))}
          <td className={cn(cellCls, 'font-semibold text-blue-700 dark:text-blue-400 border-l border-neutral-200')}>
            {planTotal > 0 ? formatMoneyWhole(planTotal) : <span className="text-neutral-300">—</span>}
          </td>
        </tr>
        {/* Fact row */}
        <tr className="border-b border-neutral-200 dark:border-neutral-700">
          <td className="px-2 py-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">
              {t('finance.bdds.fact')}
            </span>
          </td>
          {MONTHS.map((_, i) => (
            <td key={i} className={cn(cellCls, factStyle(planRow[i], factRow[i]))}>
              {factRow[i] > 0 ? formatMoneyWhole(factRow[i]) : <span className="text-neutral-300">—</span>}
            </td>
          ))}
          <td className={cn(cellCls, 'font-semibold border-l border-neutral-200', factStyle(planTotal, factTotal))}>
            {factTotal > 0 ? formatMoneyWhole(factTotal) : <span className="text-neutral-300">—</span>}
          </td>
        </tr>
      </React.Fragment>
    );
  };

  const renderGroupHeader = (label: string, group: 'income' | 'expense', bg: string) => {
    const expanded = expandedGroups[group];
    return (
      <tr
        className={cn('cursor-pointer', bg)}
        onClick={() => setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
      >
        <td className="px-3 py-2 sticky left-0" style={{ background: 'inherit' }}>
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
          </div>
        </td>
        <td /><td colSpan={13} />
      </tr>
    );
  };

  const renderTotalRow = (
    label: string,
    planData: number[],
    factData: number[],
    style: { plan: string; fact: string; bg: string },
  ) => {
    const planTotal = planData.reduce((s, v) => s + v, 0);
    const factTotal = factData.reduce((s, v) => s + v, 0);
    return (
      <React.Fragment>
        <tr className={cn('border-b border-t-2', style.bg)}>
          <td className={cn('px-3 py-2 text-xs font-bold sticky left-0', style.bg)} rowSpan={2}>{label}</td>
          <td className="px-2 py-2">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{t('finance.bdds.plan')}</span>
          </td>
          {planData.map((v, i) => (
            <td key={i} className={cn(cellCls, 'font-semibold', style.plan)}>
              {v > 0 ? formatMoneyWhole(v) : <span className="text-neutral-400">—</span>}
            </td>
          ))}
          <td className={cn(cellCls, 'font-bold border-l border-neutral-300', style.plan)}>
            {formatMoneyWhole(planTotal)}
          </td>
        </tr>
        <tr className={cn('border-b-2', style.bg)}>
          <td className="px-2 py-2">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{t('finance.bdds.fact')}</span>
          </td>
          {factData.map((v, i) => (
            <td key={i} className={cn(cellCls, 'font-semibold', factStyle(planData[i], v))}>
              {v > 0 ? formatMoneyWhole(v) : <span className="text-neutral-400">—</span>}
            </td>
          ))}
          <td className={cn(cellCls, 'font-bold border-l border-neutral-300', factStyle(planTotal, factTotal))}>
            {factTotal > 0 ? formatMoneyWhole(factTotal) : <span className="text-neutral-400">—</span>}
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.bdds.title')}
        subtitle={t('finance.bdds.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.title') },
          { label: t('finance.bdds.title') },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {editMode ? (
              <Button variant="primary" size="sm" onClick={() => setEditMode(false)}>
                {t('finance.bdds.savePlan')}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                {t('finance.bdds.enterPlan')}
              </Button>
            )}
            <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={13} />} onClick={() => refetch()} loading={paymentsLoading}>
              {t('finance.bdds.refresh')}
            </Button>
            <Button variant="secondary" size="sm" iconLeft={<Download size={13} />} onClick={exportExcel}>
              Excel
            </Button>
          </div>
        }
        tabs={[
          { id: 'table', label: t('finance.bdds.tabTable') },
          { id: 'chart', label: t('finance.bdds.tabChart') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'table' | 'chart')}
      />

      <div className="space-y-5">
        {/* Filters + stats */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projectOptions}
            className="w-52"
          />
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            options={yearOptions}
            className="w-28"
          />
          {editMode && (
            <div className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg">
              <Info size={13} />
              <span>{t('finance.bdds.clickCellHint')}</span>
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<TrendingUp size={18} />} label={t('finance.bdds.planIncome')} value={formatMoneyCompact(totals.totalPlanIncome)} className="border-green-200" loading={paymentsLoading} />
          <MetricCard icon={<TrendingDown size={18} />} label={t('finance.bdds.factIncome')} value={formatMoneyCompact(totals.totalFactIncome)} loading={paymentsLoading} />
          <MetricCard icon={<TrendingDown size={18} />} label={t('finance.bdds.planExpenses')} value={formatMoneyCompact(totals.totalPlanExpense)} className="border-red-200" loading={paymentsLoading} />
          <MetricCard
            icon={<Wallet size={18} />}
            label={t('finance.bdds.netFlowPlan')}
            value={formatMoneyCompact(totals.totalPlanIncome - totals.totalPlanExpense)}
            trend={{
              direction: (totals.totalPlanIncome - totals.totalPlanExpense) >= 0 ? 'up' : 'down',
              value: formatMoneyCompact(Math.abs(totals.totalPlanIncome - totals.totalPlanExpense)),
            }}
            loading={paymentsLoading}
          />
        </div>

        {/* Main content */}
        {activeTab === 'table' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: 1200 }}>
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-500 sticky left-0 bg-neutral-50 dark:bg-neutral-800 min-w-[180px]">
                      {t('finance.bdds.colItem')}
                    </th>
                    <th className="px-2 py-3 text-xs font-semibold text-neutral-500 w-14">{t('finance.bdds.colType')}</th>
                    {MONTHS.map((m, i) => (
                      <th key={m} className={cn(
                        'px-2 py-3 text-xs font-semibold text-right min-w-[88px]',
                        i === currentMonth && year === currentYear ? 'text-primary-600 bg-primary-50/30' : 'text-neutral-500',
                      )}>
                        {m}
                        {i === currentMonth && year === currentYear && (
                          <div className="text-[9px] text-primary-500 font-normal">{t('finance.bdds.now')}</div>
                        )}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-xs font-semibold text-right text-neutral-600 border-l border-neutral-200 min-w-[100px]">
                      {t('finance.bdds.colTotal')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ── ПОСТУПЛЕНИЯ ── */}
                  {renderGroupHeader(t('finance.bdds.incomeFlow'), 'income', 'bg-green-50/40 dark:bg-green-900/10')}
                  {expandedGroups.income && BDDS_LINES.filter((l) => l.group === 'income').map(renderLineRows)}
                  {renderTotalRow(
                    t('finance.bdds.totalIncome'),
                    totals.planIncome,
                    totals.factIncome,
                    { plan: 'text-green-700', fact: '', bg: 'bg-green-50/60 dark:bg-green-900/20' },
                  )}

                  {/* Spacer */}
                  <tr><td colSpan={15} className="h-2 bg-neutral-50 dark:bg-neutral-800/20" /></tr>

                  {/* ── ВЫПЛАТЫ ── */}
                  {renderGroupHeader(t('finance.bdds.expenseFlow'), 'expense', 'bg-red-50/30 dark:bg-red-900/10')}
                  {expandedGroups.expense && BDDS_LINES.filter((l) => l.group === 'expense').map(renderLineRows)}
                  {renderTotalRow(
                    t('finance.bdds.totalExpenses'),
                    totals.planExpense,
                    totals.factExpense,
                    { plan: 'text-red-700', fact: '', bg: 'bg-red-50/40 dark:bg-red-900/10' },
                  )}

                  {/* ── NET FLOW ── */}
                  <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800">
                    <td className="px-3 py-3 text-xs font-bold sticky left-0 bg-neutral-100 dark:bg-neutral-800" rowSpan={2}>
                      {t('finance.bdds.netFlow')}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{t('finance.bdds.plan')}</span>
                    </td>
                    {totals.planNet.map((v, i) => (
                      <td key={i} className={cn(cellCls, 'font-bold', v >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {v !== 0 ? (v > 0 ? '+' : '') + formatMoneyWhole(v) : <span className="text-neutral-400">—</span>}
                      </td>
                    ))}
                    <td className={cn(cellCls, 'font-bold border-l border-neutral-300', (totals.totalPlanIncome - totals.totalPlanExpense) >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatMoneyWhole(totals.totalPlanIncome - totals.totalPlanExpense)}
                    </td>
                  </tr>
                  <tr className="bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-300">
                    <td className="px-2 py-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{t('finance.bdds.fact')}</span>
                    </td>
                    {totals.factNet.map((v, i) => (
                      <td key={i} className={cn(cellCls, 'font-bold', v >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {v !== 0 ? (v > 0 ? '+' : '') + formatMoneyWhole(v) : <span className="text-neutral-400">—</span>}
                      </td>
                    ))}
                    <td className={cn(cellCls, 'font-bold border-l border-neutral-300', (totals.totalFactIncome - totals.totalFactExpense) >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatMoneyWhole(totals.totalFactIncome - totals.totalFactExpense)}
                    </td>
                  </tr>

                  {/* ── CUMULATIVE BALANCE ── */}
                  <tr className="bg-primary-50/50 dark:bg-primary-900/10 border-t border-primary-100">
                    <td className="px-3 py-2 text-xs font-bold text-primary-700 dark:text-primary-400 sticky left-0 bg-primary-50/50 dark:bg-primary-900/10" rowSpan={2}>
                      {t('finance.bdds.cumulativeBalance')}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{t('finance.bdds.plan')}</span>
                    </td>
                    {totals.planBalance.map((v, i) => (
                      <td key={i} className={cn(cellCls, 'font-semibold', v >= 0 ? 'text-primary-700' : 'text-red-600')}>
                        {formatMoneyWhole(v)}
                      </td>
                    ))}
                    <td className={cn(cellCls, 'border-l border-neutral-200')} />
                  </tr>
                  <tr className="bg-primary-50/50 dark:bg-primary-900/10">
                    <td className="px-2 py-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{t('finance.bdds.fact')}</span>
                    </td>
                    {totals.factBalance.map((v, i) => (
                      <td key={i} className={cn(cellCls, 'font-semibold', v >= 0 ? 'text-green-700' : 'text-red-600')}>
                        {v !== 0 ? formatMoneyWhole(v) : <span className="text-neutral-400">—</span>}
                      </td>
                    ))}
                    <td className={cn(cellCls, 'border-l border-neutral-200')} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('finance.bdds.chartIncomeExpenses')}
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}K`} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ${t('finance.bdds.thousandRub')}`]}
                      contentStyle={{ borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="planIncome" name={t('finance.bdds.planIncomeLegend')} fill="#22c55e" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="factIncome" name={t('finance.bdds.factIncomeLegend')} fill="#16a34a" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="planExpense" name={t('finance.bdds.planExpenseLegend')} fill="#f87171" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="factExpense" name={t('finance.bdds.factExpenseLegend')} fill="#dc2626" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t('finance.bdds.chartNetFlowCumulative')}
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}K`} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString('ru-RU')} ${t('finance.bdds.thousandRub')}`]} contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="planBalance" name={t('finance.bdds.planBalanceLegend')} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BddsPage;
