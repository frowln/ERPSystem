import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { Combobox } from '@/design-system/components/Combobox';
import {
  StatusBadge,
  warehouseOrderStatusColorMap,
  warehouseOrderStatusLabels,
  warehouseOrderTypeColorMap,
  warehouseOrderTypeLabels,
} from '@/design-system/components/StatusBadge';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { warehouseOrdersApi, type WarehouseOrderItem } from '@/api/warehouseOrders';
import { useMaterialOptions } from '@/hooks/useSelectOptions';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { AuditFooter } from '@/design-system/components/AuditFooter';

const WarehouseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({ materialId: '', unit: '', quantity: '', unitPrice: '', lotNumber: '', certificateNumber: '' });

  const { options: materialOptions } = useMaterialOptions();

  const { data: order, isLoading } = useQuery({
    queryKey: ['warehouse-order', id],
    queryFn: () => warehouseOrdersApi.getOrder(id!),
    enabled: !!id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['warehouse-order-items', id],
    queryFn: () => warehouseOrdersApi.getOrderItems(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse-order', id] });
    queryClient.invalidateQueries({ queryKey: ['warehouse-order-items', id] });
    queryClient.invalidateQueries({ queryKey: ['warehouse-orders'] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => warehouseOrdersApi.confirmOrder(id!),
    onSuccess: () => {
      invalidate();
      setConfirmOpen(false);
      toast.success(t('warehouse.orders.toastConfirmed', { number: order?.orderNumber ?? '' }));
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const cancelMutation = useMutation({
    mutationFn: () => warehouseOrdersApi.cancelOrder(id!),
    onSuccess: () => {
      invalidate();
      setCancelOpen(false);
      toast.success(t('warehouse.orders.toastCancelled', { number: order?.orderNumber ?? '' }));
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => warehouseOrdersApi.deleteOrder(id!),
    onSuccess: () => {
      toast.success(t('warehouse.orders.toastDeleted', { number: order?.orderNumber ?? '' }));
      navigate('/warehouse/orders');
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      warehouseOrdersApi.addItem(id!, {
        materialId: newItem.materialId,
        unit: newItem.unit || undefined,
        quantity: Number(newItem.quantity),
        unitPrice: newItem.unitPrice ? Number(newItem.unitPrice) : undefined,
        lotNumber: newItem.lotNumber || undefined,
        certificateNumber: newItem.certificateNumber || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setAddItemOpen(false);
      setNewItem({ materialId: '', unit: '', quantity: '', unitPrice: '', lotNumber: '', certificateNumber: '' });
      toast.success(t('warehouse.orders.toastItemAdded'));
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const itemColumns = useMemo<ColumnDef<WarehouseOrderItem, unknown>[]>(
    () => [
      {
        accessorKey: 'materialName',
        header: t('warehouse.orders.itemColumnMaterial'),
        size: 200,
      },
      {
        accessorKey: 'unit',
        header: t('warehouse.orders.itemColumnUnit'),
        size: 70,
      },
      {
        accessorKey: 'quantity',
        header: t('warehouse.orders.itemColumnQuantity'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()?.toLocaleString('ru-RU')}</span>,
      },
      {
        accessorKey: 'unitPrice',
        header: t('warehouse.orders.itemColumnPrice'),
        size: 120,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: t('warehouse.orders.itemColumnTotal'),
        size: 120,
        cell: ({ getValue }) => <span className="tabular-nums font-medium">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'lotNumber',
        header: t('warehouse.orders.itemColumnLot'),
        size: 120,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400">{getValue<string>() ?? '—'}</span>,
      },
    ],
    [],
  );

  if (isLoading || !order) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  const isDraft = order.status === 'DRAFT';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.orders.detailTitle', { number: order.orderNumber })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.orders.breadcrumb'), href: '/warehouse/orders' },
          { label: order.orderNumber },
        ]}
        backTo="/warehouse/orders"
        actions={
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <Button variant="primary" size="sm" iconLeft={<CheckCircle size={14} />} onClick={() => setConfirmOpen(true)}>
                  {t('warehouse.orders.actionConfirm')}
                </Button>
                <Button variant="secondary" size="sm" iconLeft={<Edit2 size={14} />} onClick={() => navigate(`/warehouse/orders/${id}/edit`)}>
                  {t('warehouse.orders.actionEdit')}
                </Button>
              </>
            )}
            {order.status !== 'CANCELLED' && (
              <Button variant="secondary" size="sm" iconLeft={<XCircle size={14} />} onClick={() => setCancelOpen(true)}>
                {t('warehouse.orders.actionCancel')}
              </Button>
            )}
            {isDraft && (
              <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
                {t('warehouse.orders.actionDelete')}
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-5xl space-y-6">
        {/* Header info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge
              status={order.orderType}
              colorMap={warehouseOrderTypeColorMap}
              label={warehouseOrderTypeLabels[order.orderType] ?? order.orderType}
            />
            <StatusBadge
              status={order.status}
              colorMap={warehouseOrderStatusColorMap}
              label={warehouseOrderStatusLabels[order.status] ?? order.status}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.orders.detailDate')}</p>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.orders.detailTotalQuantity')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{order.totalQuantity.toLocaleString('ru-RU')}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.orders.detailTotalAmount')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(order.totalAmount)}</p>
            </div>
            {order.notes && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.orders.detailNotes')}</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Items table */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('warehouse.orders.detailItems')} ({items.length})
            </h2>
            {isDraft && (
              <Button size="sm" variant="secondary" iconLeft={<Plus size={14} />} onClick={() => setAddItemOpen(true)}>
                {t('warehouse.orders.addItem')}
              </Button>
            )}
          </div>
          <DataTable<WarehouseOrderItem>
            data={items}
            columns={itemColumns}
            pageSize={50}
            emptyTitle={t('warehouse.orders.emptyTitle')}
            enableExport
          />
        </section>
      </div>

      {/* Add item modal */}      <AuditFooter data={order} />

<Modal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        title={t('warehouse.orders.addItemTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddItemOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => addItemMutation.mutate()}
              loading={addItemMutation.isPending}
              disabled={!newItem.materialId || !newItem.quantity || Number(newItem.quantity) <= 0}
            >
              {t('warehouse.orders.addItem')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('warehouse.orders.itemColumnMaterial')} required>
            <Combobox
              options={materialOptions}
              value={newItem.materialId}
              onChange={(v) => setNewItem((p) => ({ ...p, materialId: v }))}
            />
          </FormField>
          <FormField label={t('warehouse.orders.itemColumnUnit')}>
            <Input value={newItem.unit} onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))} />
          </FormField>
          <FormField label={t('warehouse.orders.itemColumnQuantity')} required>
            <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))} />
          </FormField>
          <FormField label={t('warehouse.orders.itemColumnPrice')}>
            <Input type="number" value={newItem.unitPrice} onChange={(e) => setNewItem((p) => ({ ...p, unitPrice: e.target.value }))} />
          </FormField>
          <FormField label={t('warehouse.orders.itemColumnLot')}>
            <Input value={newItem.lotNumber} onChange={(e) => setNewItem((p) => ({ ...p, lotNumber: e.target.value }))} />
          </FormField>
          <FormField label={t('warehouse.orders.itemColumnCertificate')}>
            <Input value={newItem.certificateNumber} onChange={(e) => setNewItem((p) => ({ ...p, certificateNumber: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => confirmMutation.mutate()}
        loading={confirmMutation.isPending}
        title={t('warehouse.orders.confirmTitle')}
        description={t('warehouse.orders.confirmMessage', { number: order.orderNumber })}
      />

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
        title={t('warehouse.orders.cancelTitle')}
        description={t('warehouse.orders.cancelMessage', { number: order.orderNumber })}
        confirmVariant="danger"
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title={t('warehouse.orders.deleteTitle')}
        description={t('warehouse.orders.deleteMessage', { number: order.orderNumber })}
        confirmVariant="danger"
      />
    </div>
  );
};

export default WarehouseOrderDetailPage;
