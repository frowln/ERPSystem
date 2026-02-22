import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import type { BudgetItem, BudgetItemType } from '@/types';
import FmItemsTable from './budgetDetail/FmItemsTable';
import SnapshotPanel from './budgetDetail/SnapshotPanel';
import SnapshotCompareTable from './budgetDetail/SnapshotCompareTable';
import { Camera, Download, Settings } from 'lucide-react';

type FmTab = 'ALL' | 'WORKS' | 'MATERIALS' | 'CVR' | 'SNAPSHOTS';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(v);

export default function FmPage() {
  const { id: budgetId } = useParams<{ id: string }>();
  const [tab, setTab] = useState<FmTab>('ALL');
  const [compareSnapshotId, setCompareSnapshotId] = useState<string | null>(null);

  const { data: budget } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => financeApi.getBudget(budgetId!),
    enabled: !!budgetId,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: () => financeApi.getBudgetItems(budgetId!),
    enabled: !!budgetId,
  });

  // KPI calculations
  const kpis = useMemo(() => {
    const nonSection = items.filter((i: BudgetItem) => !i.section);
    const sum = (fn: (i: BudgetItem) => number) => nonSection.reduce((acc, i) => acc + fn(i), 0);
    const costTotal = sum((i) => (i.costPrice ?? 0) * (i.quantity ?? 1));
    const estimateTotal = sum((i) => (i.estimatePrice ?? 0) * (i.quantity ?? 1));
    const customerTotal = sum((i) => (i.customerPrice ?? 0) * (i.quantity ?? 1));
    const marginTotal = customerTotal - costTotal;
    const marginPct = customerTotal > 0 ? (marginTotal / customerTotal) * 100 : 0;
    return { costTotal, estimateTotal, customerTotal, marginTotal, marginPct };
  }, [items]);

  const marginPctColor = kpis.marginPct < 0
    ? 'text-red-600'
    : kpis.marginPct < 5
      ? 'text-orange-500'
      : kpis.marginPct < 15
        ? 'text-yellow-600'
        : 'text-green-600';

  const tabs: { key: FmTab; label: string }[] = [
    { key: 'ALL', label: t('fm.tabAll') },
    { key: 'WORKS', label: t('fm.tabWorks') },
    { key: 'MATERIALS', label: t('fm.tabMaterials') },
    { key: 'SNAPSHOTS', label: t('fm.tabSnapshots') },
  ];

  if (!budgetId) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb & header */}
      <div className="px-6 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          <Link to="/budgets" className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {t('finance.budgetDetail.breadcrumbFinance')}
          </Link>
          <span>/</span>
          <Link to="/budgets" className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {t('finance.budgetDetail.breadcrumbBudgets')}
          </Link>
          <span>/</span>
          <Link to={`/budgets/${budgetId}`} className="hover:text-neutral-700 dark:hover:text-neutral-200">
            {budget?.name ?? '...'}
          </Link>
          <span>/</span>
          <span className="text-neutral-700 dark:text-neutral-200">{t('fm.breadcrumbFm')}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('fm.title')}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{budget?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <Settings className="w-3.5 h-3.5" />
              {t('fm.manageSections')}
            </button>
            <button
              onClick={() => setTab('SNAPSHOTS')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('fm.createSnapshot')}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              <Download className="w-3.5 h-3.5" />
              {t('fm.exportFm')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 py-3 flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <KpiCard label={t('fm.kpiCostPrice')} value={fmtCurrency(kpis.costTotal)} />
        <KpiCard label={t('fm.kpiEstimatePrice')} value={fmtCurrency(kpis.estimateTotal)} />
        <KpiCard label={t('fm.kpiCustomerPrice')} value={fmtCurrency(kpis.customerTotal)} />
        <KpiCard label={t('fm.kpiMargin')} value={fmtCurrency(kpis.marginTotal)} valueClass={marginPctColor} />
        <KpiCard
          label={t('fm.kpiMarginPercent')}
          value={`${kpis.marginPct.toFixed(1)}%`}
          valueClass={marginPctColor}
        />
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-0">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => { setTab(tabItem.key); setCompareSnapshotId(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tabItem.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {tab === 'SNAPSHOTS' ? (
          compareSnapshotId ? (
            <div className="flex-1">
              <SnapshotCompareTable
                budgetId={budgetId}
                snapshotId={compareSnapshotId}
                onBack={() => setCompareSnapshotId(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex">
              <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                {t('fm.snapshot.noSnapshotsDesc')}
              </div>
              <SnapshotPanel budgetId={budgetId} onCompare={setCompareSnapshotId} />
            </div>
          )
        ) : (
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center text-neutral-500">...</div>
            ) : (
              <FmItemsTable
                budgetId={budgetId}
                items={items}
                branch={tab === 'ALL' ? 'ALL' : tab === 'WORKS' ? 'WORKS' : 'MATERIALS'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass = 'text-neutral-900 dark:text-neutral-100',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
