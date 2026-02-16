import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ArrowUpDown, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { onecApi } from '@/api/onec';
import { formatDate } from '@/lib/format';
import type { OneCExchangeLog } from './types';
import type { PaginatedResponse } from '@/types';

const exchangeStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  pending: 'gray',
  in_progress: 'blue',
  completed: 'green',
  failed: 'red',
  partial: 'orange',
};

const exchangeStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'Выполняется',
  completed: 'Завершён',
  failed: 'Ошибка',
  partial: 'Частично',
};

const directionLabels: Record<string, string> = {
  import: 'Импорт',
  export: 'Экспорт',
  bidirectional: 'Двусторонний',
};

const entityTypeLabels: Record<string, string> = {
  contracts: 'Договоры',
  invoices: 'Счета',
  payments: 'Платежи',
  materials: 'Материалы',
  employees: 'Сотрудники',
  cost_items: 'Статьи затрат',
  organizations: 'Организации',
};

type TabId = 'all' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает' },
  { value: 'IN_PROGRESS', label: 'Выполняется' },
  { value: 'COMPLETED', label: 'Завершён' },
  { value: 'FAILED', label: 'Ошибка' },
  { value: 'PARTIAL', label: 'Частично' },
];


const OneCExchangeLogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<OneCExchangeLog>>({
    queryKey: ['onec-exchange-logs'],
    queryFn: () => onecApi.getExchangeLogs(),
  });

  const logs = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = logs;
    if (activeTab !== 'all') result = result.filter((l) => l.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (l) => l.configName.toLowerCase().includes(lower) || l.triggeredByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [logs, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: logs.length,
    completed: logs.filter((l) => l.status === 'COMPLETED').length,
    failed: logs.filter((l) => l.status === 'FAILED').length,
    partial: logs.filter((l) => l.status === 'PARTIAL').length,
  }), [logs]);

  const metrics = useMemo(() => {
    const totalRecords = logs.reduce((s, l) => s + l.totalRecords, 0);
    const totalErrors = logs.reduce((s, l) => s + l.errorCount, 0);
    const avgDuration = logs.length > 0 ? logs.reduce((s, l) => s + (l.duration ?? 0), 0) / logs.length : 0;
    return { total: logs.length, totalRecords, totalErrors, avgDuration };
  }, [logs]);

  const columns = useMemo<ColumnDef<OneCExchangeLog, unknown>[]>(
    () => [
      {
        accessorKey: 'startedAt',
        header: 'Время',
        size: 150,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'configName',
        header: 'Подключение',
        size: 200,
        cell: ({ getValue }) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={exchangeStatusColorMap}
            label={exchangeStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'direction',
        header: 'Направление',
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-600 text-xs">{directionLabels[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        accessorKey: 'entityType',
        header: 'Тип данных',
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-600">{entityTypeLabels[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        id: 'progress',
        header: 'Обработано',
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{row.original.processedRecords}/{row.original.totalRecords}</span>
        ),
      },
      {
        accessorKey: 'errorCount',
        header: 'Ошибки',
        size: 80,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-danger-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'duration',
        header: 'Время (сек)',
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return val ? <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{val} с</span> : <span className="text-neutral-400">---</span>;
        },
      },
      {
        accessorKey: 'triggeredByName',
        header: 'Инициатор',
        size: 140,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Журнал обмена 1С"
        subtitle={`${logs.length} записей`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обмен данными', href: '/data-exchange' },
          { label: 'Журнал обмена 1С' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'COMPLETED', label: 'Успешные', count: tabCounts.completed },
          { id: 'FAILED', label: 'Ошибки', count: tabCounts.failed },
          { id: 'PARTIAL', label: 'Частичные', count: tabCounts.partial },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ArrowUpDown size={18} />} label="Всего обменов" value={metrics.total} />
        <MetricCard icon={<Activity size={18} />} label="Записей обработано" value={metrics.totalRecords} />
        <MetricCard
          icon={<XCircle size={18} />}
          label="Ошибки"
          value={metrics.totalErrors}
          trend={{ direction: metrics.totalErrors > 0 ? 'down' : 'neutral', value: metrics.totalErrors > 0 ? 'Требуют внимания' : 'Нет ошибок' }}
        />
        <MetricCard icon={<Clock size={18} />} label="Среднее время" value={`${metrics.avgDuration.toFixed(0)} с`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по подключению, инициатору..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<OneCExchangeLog>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет записей обмена"
        emptyDescription="Записи появятся после первой синхронизации с 1С"
      />
    </div>
  );
};

export default OneCExchangeLogPage;
