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
  warehouseOrderStatusColorMap,
  warehouseOrderStatusLabels,
  warehouseOrderTypeColorMap,
  warehouseOrderTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { warehouseOrdersApi, type WarehouseOrder } from '@/api/warehouseOrders';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

type TabId = 'all' | 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

const WarehouseOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-orders'],
    queryFn: () => warehouseOrdersApi.getOrders({ size: 200 }),
  });

  const orders = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = orders;
    if (activeTab !== 'all') result = result.filter((o) => o.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: orders.length,
      draft: orders.filter((o) => o.status === 'DRAFT').length,
      confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    }),
    [orders],
  );

  const columns = useMemo<ColumnDef<WarehouseOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: t('warehouse.orders.columnNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'orderType',
        header: t('warehouse.orders.columnType'),
        size: 170,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={warehouseOrderTypeColorMap}
            label={warehouseOrderTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'orderDate',
        header: t('warehouse.orders.columnDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'totalQuantity',
        header: t('warehouse.orders.columnQuantity'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()?.toLocaleString('ru-RU')}</span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('warehouse.orders.columnAmount'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.orders.columnStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={warehouseOrderStatusColorMap}
            label={warehouseOrderStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (order: WarehouseOrder) => navigate(`/warehouse/orders/${order.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.orders.title')}
        subtitle={t('warehouse.orders.subtitle', { count: orders.length })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.orders.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/warehouse/orders/new')}>
            {t('warehouse.orders.newOrder')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.orders.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('warehouse.orders.tabDraft'), count: tabCounts.draft },
          { id: 'CONFIRMED', label: t('warehouse.orders.tabConfirmed'), count: tabCounts.confirmed },
          { id: 'CANCELLED', label: t('warehouse.orders.tabCancelled'), count: tabCounts.cancelled },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<WarehouseOrder>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.orders.emptyTitle')}
        emptyDescription={t('warehouse.orders.emptyDescription')}
      />
    </div>
  );
};

export default WarehouseOrderListPage;
