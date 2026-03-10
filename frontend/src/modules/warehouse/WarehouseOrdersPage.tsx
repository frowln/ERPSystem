import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { FormField } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { warehouseApi } from '@/api/warehouse';
import { formatNumber, formatDate, formatMoney } from '@/lib/format';
import type { WarehouseOrderAdvanced, WarehouseOrderType, WarehouseOrderStatus } from './types';

const orderTypeColorMap: Record<string, 'green' | 'red' | 'blue' | 'gray'> = {
  incoming: 'green',
  outgoing: 'red',
  transfer: 'blue',
  write_off: 'gray',
};

const orderTypeLabels: Record<string, string> = {
  get incoming() { return t('warehouse.warehouseOrders.typeIncoming'); },
  get outgoing() { return t('warehouse.warehouseOrders.typeOutgoing'); },
  get transfer() { return t('warehouse.warehouseOrders.typeTransfer'); },
  get write_off() { return t('warehouse.warehouseOrders.typeWriteOff'); },
};

const orderStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  draft: 'gray',
  approved: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const orderStatusLabels: Record<string, string> = {
  get draft() { return t('warehouse.warehouseOrders.statusDraft'); },
  get approved() { return t('warehouse.warehouseOrders.statusApproved'); },
  get completed() { return t('warehouse.warehouseOrders.statusCompleted'); },
  get cancelled() { return t('warehouse.warehouseOrders.statusCancelled'); },
};

const typeFilterOptions = [
  { value: '', label: '' },
  { value: 'incoming', label: '' },
  { value: 'outgoing', label: '' },
  { value: 'transfer', label: '' },
  { value: 'write_off', label: '' },
];

const statusFilterOptions = [
  { value: '', label: '' },
  { value: 'draft', label: '' },
  { value: 'approved', label: '' },
  { value: 'completed', label: '' },
  { value: 'cancelled', label: '' },
];

type TabId = 'all' | 'draft' | 'approved' | 'completed' | 'cancelled';

const WarehouseOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [formType, setFormType] = useState<WarehouseOrderType>('incoming');
  const [formDate, setFormDate] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formCounterparty, setFormCounterparty] = useState('');
  const [formItems, setFormItems] = useState<{ materialName: string; qty: string; unit: string; price: string }[]>([
    { materialName: '', qty: '', unit: '', price: '' },
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse-orders-advanced'],
    queryFn: () => warehouseApi.getWarehouseOrders({ size: 200 }),
  });

  const orders = data?.content ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createWarehouseOrder({
        type: formType,
        date: formDate,
        warehouseName: formWarehouse,
        counterparty: formCounterparty,
        items: formItems.filter((i) => i.materialName).map((i) => ({
          materialName: i.materialName,
          qty: Number(i.qty),
          unit: i.unit,
          price: Number(i.price),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-orders-advanced'] });
      toast.success(t('warehouse.warehouseOrders.createSuccess'));
      setCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resetForm = () => {
    setFormType('incoming');
    setFormDate('');
    setFormWarehouse('');
    setFormCounterparty('');
    setFormItems([{ materialName: '', qty: '', unit: '', price: '' }]);
  };

  const addItemRow = () => {
    setFormItems((prev) => [...prev, { materialName: '', qty: '', unit: '', price: '' }]);
  };

  const updateItemRow = (idx: number, field: string, value: string) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const removeItemRow = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const filtered = useMemo(() => {
    let result = orders;
    if (activeTab !== 'all') result = result.filter((o) => o.status === activeTab);
    if (typeFilter) result = result.filter((o) => o.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          o.warehouseName.toLowerCase().includes(q) ||
          o.counterparty.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, activeTab, typeFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: orders.length,
      draft: orders.filter((o) => o.status === 'draft').length,
      approved: orders.filter((o) => o.status === 'approved').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }),
    [orders],
  );

  const columns = useMemo<ColumnDef<WarehouseOrderAdvanced, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('warehouse.warehouseOrders.columnNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('warehouse.warehouseOrders.columnType'),
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={orderTypeColorMap}
            label={orderTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'date',
        header: t('warehouse.warehouseOrders.columnDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'warehouseName',
        header: t('warehouse.warehouseOrders.columnWarehouse'),
        size: 160,
      },
      {
        accessorKey: 'counterparty',
        header: t('warehouse.warehouseOrders.columnCounterparty'),
        size: 180,
      },
      {
        id: 'itemsCount',
        header: t('warehouse.warehouseOrders.columnItemsCount'),
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.items.length}</span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('warehouse.warehouseOrders.columnTotalAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.warehouseOrders.columnStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={orderStatusColorMap}
            label={orderStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  // Dynamically compute type filter option labels
  const typeFilterLabeled = useMemo(
    () =>
      typeFilterOptions.map((o) => ({
        value: o.value,
        label: o.value
          ? (orderTypeLabels[o.value] ?? o.label)
          : t('warehouse.warehouseOrders.filterAllTypes'),
      })),
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.warehouseOrders.title')}
        subtitle={t('warehouse.warehouseOrders.subtitle', { count: orders.length })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.warehouseOrders.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            {t('warehouse.warehouseOrders.newOrder')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.warehouseOrders.tabAll'), count: tabCounts.all },
          { id: 'draft', label: t('warehouse.warehouseOrders.tabDraft'), count: tabCounts.draft },
          { id: 'approved', label: t('warehouse.warehouseOrders.tabApproved'), count: tabCounts.approved },
          { id: 'completed', label: t('warehouse.warehouseOrders.tabCompleted'), count: tabCounts.completed },
          { id: 'cancelled', label: t('warehouse.warehouseOrders.tabCancelled'), count: tabCounts.cancelled },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.warehouseOrders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterLabeled}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<WarehouseOrderAdvanced>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.warehouseOrders.emptyTitle')}
        emptyDescription={t('warehouse.warehouseOrders.emptyDescription')}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); resetForm(); }}
        title={t('warehouse.warehouseOrders.createTitle')}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreateOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              disabled={!formDate || !formWarehouse}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('warehouse.warehouseOrders.formType')} required>
              <Select
                options={[
                  { value: 'incoming', label: t('warehouse.warehouseOrders.typeIncoming') },
                  { value: 'outgoing', label: t('warehouse.warehouseOrders.typeOutgoing') },
                  { value: 'transfer', label: t('warehouse.warehouseOrders.typeTransfer') },
                  { value: 'write_off', label: t('warehouse.warehouseOrders.typeWriteOff') },
                ]}
                value={formType}
                onChange={(e) => setFormType(e.target.value as WarehouseOrderType)}
              />
            </FormField>
            <FormField label={t('warehouse.warehouseOrders.formDate')} required>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('warehouse.warehouseOrders.formWarehouse')} required>
              <Input
                value={formWarehouse}
                onChange={(e) => setFormWarehouse(e.target.value)}
                placeholder={t('warehouse.warehouseOrders.formWarehousePlaceholder')}
              />
            </FormField>
            <FormField label={t('warehouse.warehouseOrders.formCounterparty')}>
              <Input
                value={formCounterparty}
                onChange={(e) => setFormCounterparty(e.target.value)}
                placeholder={t('warehouse.warehouseOrders.formCounterpartyPlaceholder')}
              />
            </FormField>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('warehouse.warehouseOrders.formItems')}
              </h4>
              <Button variant="ghost" size="xs" iconLeft={<Plus size={14} />} onClick={addItemRow}>
                {t('warehouse.warehouseOrders.formAddItem')}
              </Button>
            </div>
            <div className="space-y-2">
              {formItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.materialName}
                    onChange={(e) => updateItemRow(idx, 'materialName', e.target.value)}
                    placeholder={t('warehouse.warehouseOrders.formItemMaterial')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItemRow(idx, 'qty', e.target.value)}
                    placeholder={t('warehouse.warehouseOrders.formItemQty')}
                    className="w-24"
                  />
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItemRow(idx, 'unit', e.target.value)}
                    placeholder={t('warehouse.warehouseOrders.formItemUnit')}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItemRow(idx, 'price', e.target.value)}
                    placeholder={t('warehouse.warehouseOrders.formItemPrice')}
                    className="w-28"
                  />
                  {formItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      iconLeft={<Trash2 size={14} />}
                      onClick={() => removeItemRow(idx)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WarehouseOrdersPage;
