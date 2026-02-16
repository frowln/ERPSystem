import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  DollarSign, TrendingUp, BarChart3, FileText,
  ArrowRight, PieChart, Calendar,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { revenueRecognitionApi } from '@/api/revenueRecognition';
import { formatMoneyCompact, formatPercent, formatMoney } from '@/lib/format';
import type { RevenueContract } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  ACTIVE: 'green', COMPLETED: 'blue', SUSPENDED: 'yellow', TERMINATED: 'red',
};
const statusLabels: Record<string, string> = {
  ACTIVE: 'Активный', COMPLETED: 'Завершён', SUSPENDED: 'Приостановлен', TERMINATED: 'Расторгнут',
};
const RevenueDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: contractData } = useQuery({
    queryKey: ['revenue-dashboard-contracts'],
    queryFn: () => revenueRecognitionApi.getContracts(),
  });

  const contracts = contractData?.content ?? [];

  const metrics = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'ACTIVE');
    const totalRevenue = contracts.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalRecognized = contracts.reduce((sum, c) => sum + c.recognizedRevenue, 0);
    const totalCost = contracts.reduce((sum, c) => sum + c.totalCost, 0);
    const totalIncurred = contracts.reduce((sum, c) => sum + c.incurredCost, 0);
    const avgMargin = contracts.length > 0
      ? contracts.reduce((sum, c) => sum + c.grossMargin, 0) / contracts.length
      : 0;
    const unrecoRevenue = totalRevenue - totalRecognized;
    return { activeCount: active.length, totalRevenue, totalRecognized, totalCost, totalIncurred, avgMargin, unrecoRevenue };
  }, [contracts]);

  const contractColumns = useMemo<ColumnDef<RevenueContract, unknown>[]>(
    () => [
      { accessorKey: 'contractNumber', header: '\u2116', size: 90, cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span> },
      { accessorKey: 'contractName', header: 'Контракт', size: 220, cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.contractName}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.clientName}</p>
        </div>
      ) },
      { accessorKey: 'status', header: 'Статус', size: 120, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} /> },
      { accessorKey: 'totalRevenue', header: 'Общая выручка', size: 130, cell: ({ getValue }) => <span className="tabular-nums">{formatMoneyCompact(getValue<number>())}</span> },
      { accessorKey: 'recognizedRevenue', header: 'Признано', size: 130, cell: ({ getValue }) => <span className="tabular-nums text-green-600">{formatMoneyCompact(getValue<number>())}</span> },
      { accessorKey: 'percentComplete', header: '% выполн.', size: 100, cell: ({ getValue }) => {
        const pct = getValue<number>();
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums">{formatPercent(pct)}</span>
          </div>
        );
      } },
      { accessorKey: 'grossMargin', header: 'Маржа', size: 80, cell: ({ getValue }) => <span className="tabular-nums">{formatPercent(getValue<number>())}</span> },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Признание выручки"
        subtitle="Сводный обзор по стандартам МСФО 15 / РСБУ"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Признание выручки' },
        ]}
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Активных контрактов" value={metrics.activeCount} />
        <MetricCard icon={<DollarSign size={18} />} label="Общая выручка" value={formatMoneyCompact(metrics.totalRevenue)} />
        <MetricCard icon={<TrendingUp size={18} />} label="Признано" value={formatMoneyCompact(metrics.totalRecognized)} trend={{ direction: 'up', value: formatPercent((metrics.totalRecognized / Math.max(metrics.totalRevenue, 1)) * 100) }} />
        <MetricCard icon={<PieChart size={18} />} label="Ожидает признания" value={formatMoneyCompact(metrics.unrecoRevenue)} />
        <MetricCard icon={<BarChart3 size={18} />} label="Средняя маржа" value={formatPercent(metrics.avgMargin)} />
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => navigate('/revenue/contracts')} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <FileText size={20} className="text-primary-600" />
            <ArrowRight size={16} className="text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Контракты</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Управление контрактами и методами признания</p>
        </button>
        <button onClick={() => navigate('/revenue/periods')} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} className="text-primary-600" />
            <ArrowRight size={16} className="text-neutral-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Периоды</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Сводные данные признания по отчётным периодам</p>
        </button>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={20} className="text-primary-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Динамика по кварталам</h3>
          <div className="mt-2 space-y-1">
            {([] as any[]).slice(-3).map((ps) => (
              <div key={ps.period} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{ps.period}</span>
                <span className="tabular-nums font-medium text-green-600">{formatMoneyCompact(ps.recognized)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue vs Cost bar chart (simplified) */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Выручка и затраты по кварталам</h3>
        <div className="space-y-3">
          {([] as any[]).map((ps) => (
            <div key={ps.period} className="flex items-center gap-4">
              <span className="text-sm text-neutral-500 dark:text-neutral-400 w-24 flex-shrink-0">{ps.period}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-5 bg-neutral-50 dark:bg-neutral-800 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-green-400 rounded-l"
                    style={{ width: `${(ps.recognized / 350000000) * 100}%` }}
                    title={`Выручка: ${formatMoney(ps.recognized)}`}
                  />
                </div>
                <div className="flex-1 h-5 bg-neutral-50 dark:bg-neutral-800 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-blue-400 rounded-l"
                    style={{ width: `${(ps.cost / 350000000) * 100}%` }}
                    title={`Затраты: ${formatMoney(ps.cost)}`}
                  />
                </div>
              </div>
              <span className="text-sm tabular-nums font-medium w-28 text-right text-green-600">
                {formatMoneyCompact(ps.profit)}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="w-24"></span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded" />
                <span>Выручка</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded" />
                <span>Затраты</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Контракты</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/revenue/contracts')}>
            Все контракты
          </Button>
        </div>
        <DataTable<RevenueContract>
          data={contracts}
          columns={contractColumns}
          onRowClick={(c) => navigate(`/revenue/contracts/${c.id}`)}
          pageSize={10}
          emptyTitle="Нет контрактов"
          emptyDescription="Данные загружаются..."
        />
      </div>
    </div>
  );
};

export default RevenueDashboardPage;
