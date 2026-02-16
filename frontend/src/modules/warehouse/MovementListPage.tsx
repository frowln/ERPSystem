import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  stockMovementStatusColorMap,
  stockMovementStatusLabels,
  stockMovementTypeColorMap,
  stockMovementTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { StockMovement } from '@/types';

type TabId = 'all' | 'DRAFT' | 'CONFIRMED' | 'DONE' | 'CANCELLED';

const MovementListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => warehouseApi.getMovements(),
  });

  const movements = movementsData?.content ?? [];

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    if (activeTab !== 'all') {
      filtered = filtered.filter((m) => m.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.number.toLowerCase().includes(lower) ||
          (m.projectName ?? '').toLowerCase().includes(lower) ||
          (m.sourceLocation ?? '').toLowerCase().includes(lower) ||
          (m.destinationLocation ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [movements, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: movements.length,
    draft: movements.filter((m) => m.status === 'DRAFT').length,
    confirmed: movements.filter((m) => m.status === 'CONFIRMED').length,
    done: movements.filter((m) => m.status === 'DONE').length,
    cancelled: movements.filter((m) => m.status === 'CANCELLED').length,
  }), [movements]);

  const columns = useMemo<ColumnDef<StockMovement, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('warehouse.movementList.columnNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'movementDate',
        header: t('warehouse.movementList.columnDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'movementType',
        header: t('warehouse.movementList.columnType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={stockMovementTypeColorMap}
            label={stockMovementTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'sourceLocation',
        header: t('warehouse.movementList.columnFrom'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'destinationLocation',
        header: t('warehouse.movementList.columnTo'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.movementList.columnStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={stockMovementStatusColorMap}
            label={stockMovementStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'lineCount',
        header: t('warehouse.movementList.columnLineCount'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block">{getValue<number>()}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (movement: StockMovement) => navigate(`/warehouse/movements/${movement.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.movementList.title')}
        subtitle={t('warehouse.movementList.subtitle', { count: movements.length })}
        breadcrumbs={[
          { label: t('warehouse.movementList.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse') },
          { label: t('warehouse.movementList.breadcrumbMovements') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/warehouse/movements/new')}>
            {t('warehouse.movementList.newOperation')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.movementList.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('warehouse.movementList.tabDraft'), count: tabCounts.draft },
          { id: 'CONFIRMED', label: t('warehouse.movementList.tabConfirmed'), count: tabCounts.confirmed },
          { id: 'DONE', label: t('warehouse.movementList.tabDone'), count: tabCounts.done },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.movementList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<StockMovement>
        data={filteredMovements}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.movementList.emptyTitle')}
        emptyDescription={t('warehouse.movementList.emptyDescription')}
      />
    </div>
  );
};

export default MovementListPage;
