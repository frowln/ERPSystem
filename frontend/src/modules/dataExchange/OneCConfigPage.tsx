import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { t } from '@/i18n';
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

const getDirectionLabels = (): Record<string, string> => ({
  import: t('dataExchange.directionImport'),
  export: t('dataExchange.directionExport'),
  bidirectional: t('dataExchange.directionBidirectional'),
});

const getEntityTypeLabels = (): Record<string, string> => ({
  contracts: t('dataExchange.onecEntityContracts'),
  invoices: t('dataExchange.onecEntityInvoices'),
  payments: t('dataExchange.onecEntityPayments'),
  materials: t('dataExchange.onecEntityMaterials'),
  employees: t('dataExchange.onecEntityEmployees'),
  cost_items: t('dataExchange.onecEntityCostItems'),
  organizations: t('dataExchange.onecEntityOrganizations'),
});

const OneCConfigPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
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
        header: t('dataExchange.colConnection'),
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
        header: t('dataExchange.colDatabase'),
        size: 160,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-600">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'isActive',
        header: t('dataExchange.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<boolean>() ? 'ACTIVE' : 'INACTIVE'}
            colorMap={configStatusColorMap}
            label={getValue<boolean>() ? t('dataExchange.statusActive') : t('dataExchange.statusInactive')}
          />
        ),
      },
      {
        accessorKey: 'exchangeDirection',
        header: t('dataExchange.colDirection'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={directionColorMap}
            label={getDirectionLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'entityTypes',
        header: t('dataExchange.colEntities'),
        size: 200,
        cell: ({ getValue }) => {
          const types = getValue<string[]>();
          const entityLabels = getEntityTypeLabels();
          return (
            <div className="flex flex-wrap gap-1">
              {types.slice(0, 3).map((tp) => (
                <span key={tp} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded">
                  {entityLabels[tp] ?? tp}
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
        header: t('dataExchange.colInterval'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()} {t('dataExchange.minuteAbbrev')}</span>,
      },
      {
        accessorKey: 'lastSyncAt',
        header: t('dataExchange.colLastSync'),
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
            {t('dataExchange.syncButton')}
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dataExchange.onecTitle')}
        subtitle={t('dataExchange.onecSubtitle', { count: String(configs.length) })}
        breadcrumbs={[
          { label: t('dataExchange.breadcrumbHome'), href: '/' },
          { label: t('dataExchange.breadcrumbDataExchange'), href: '/data-exchange' },
          { label: t('dataExchange.breadcrumbOnec') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/data-exchange/1c/new')}>{t('dataExchange.newConnection')}</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Database size={18} />} label={t('dataExchange.metricTotalConnections')} value={metrics.total} />
        <MetricCard icon={<Link size={18} />} label={t('dataExchange.metricActive')} value={metrics.active} />
        <MetricCard icon={<RefreshCw size={18} />} label={t('dataExchange.metricAutoSync')} value={metrics.autoSync} />
        <MetricCard icon={<Settings size={18} />} label={t('dataExchange.metricEntityTypes')} value={metrics.entityCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('dataExchange.searchOnecPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<OneCConfig>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('dataExchange.emptyOnecTitle')}
        emptyDescription={t('dataExchange.emptyOnecDescription')}
      />
    </div>
  );
};

export default OneCConfigPage;
