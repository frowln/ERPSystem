import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, Settings, RefreshCw, Database, Link } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { onecApi } from '@/api/onec';
import { formatDate } from '@/lib/format';
import type { OneCConfig } from './types';

const configStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  active: 'green',
  inactive: 'gray',
};

const directionColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  import: 'blue',
  export: 'orange',
  bidirectional: 'purple',
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

const OneCConfigPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['onec-configs'],
    queryFn: () => onecApi.getConfigs(),
  });

  const filtered = useMemo(() => {
    if (!search) return configs;
    const lower = search.toLowerCase();
    return configs.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.databaseName.toLowerCase().includes(lower),
    );
  }, [configs, search]);

  const metrics = useMemo(() => ({
    total: configs.length,
    active: configs.filter((c) => c.isActive).length,
    autoSync: configs.filter((c) => c.autoSync).length,
    entityCount: new Set(configs.flatMap((c) => c.entityTypes)).size,
  }), [configs]);

  const columns = useMemo<ColumnDef<OneCConfig, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Подключение',
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.serverUrl}</p>
          </div>
        ),
      },
      {
        accessorKey: 'databaseName',
        header: 'База данных',
        size: 160,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-600">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<boolean>() ? 'ACTIVE' : 'INACTIVE'}
            colorMap={configStatusColorMap}
            label={getValue<boolean>() ? 'Активно' : 'Неактивно'}
          />
        ),
      },
      {
        accessorKey: 'exchangeDirection',
        header: 'Направление',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={directionColorMap}
            label={directionLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'entityTypes',
        header: 'Сущности',
        size: 200,
        cell: ({ getValue }) => {
          const types = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {types.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded">
                  {entityTypeLabels[t] ?? t}
                </span>
              ))}
              {types.length > 3 && (
                <span className="text-[10px] text-neutral-400">+{types.length - 3}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'syncInterval',
        header: 'Интервал',
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()} мин</span>,
      },
      {
        accessorKey: 'lastSyncAt',
        header: 'Последняя синхр.',
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(val)}</span> : <span className="text-neutral-400">---</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<RefreshCw size={14} />}
            disabled={!row.original.isActive}
          >
            Синхр.
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Интеграция с 1С"
        subtitle={`${configs.length} подключений`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обмен данными', href: '/data-exchange' },
          { label: 'Интеграция с 1С' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>Новое подключение</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Database size={18} />} label="Всего подключений" value={metrics.total} />
        <MetricCard icon={<Link size={18} />} label="Активные" value={metrics.active} />
        <MetricCard icon={<RefreshCw size={18} />} label="Авто-синхр." value={metrics.autoSync} />
        <MetricCard icon={<Settings size={18} />} label="Типов сущностей" value={metrics.entityCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию, базе данных..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<OneCConfig>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle="Нет подключений к 1С"
        emptyDescription="Настройте первое подключение к базе 1С"
      />
    </div>
  );
};

export default OneCConfigPage;
