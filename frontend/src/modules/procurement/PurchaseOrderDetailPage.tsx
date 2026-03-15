import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  Lock,
  MapPin,
  Package,
  Pencil,
  Percent,
  Plus,
  Send,
  Trash2,
  Truck,
  Warehouse,
  Copy,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  procurementApi,
  type PurchaseOrderItemPayload,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
} from '@/api/procurement';
import { formatDate, formatDateLong, formatMoney, formatNumber } from '@/lib/format';
import { t } from '@/i18n';

type OrderAction = 'send' | 'confirm' | 'invoice' | 'cancel' | 'close';

const getStatusLabels = (): Record<PurchaseOrderStatus, string> => ({
  DRAFT: t('procurement.orderStatus.draft'),
  SENT: t('procurement.orderStatus.sent'),
  CONFIRMED: t('procurement.orderStatus.confirmed'),
  PARTIALLY_DELIVERED: t('procurement.orderStatus.partiallyDelivered'),
  DELIVERED: t('procurement.orderStatus.delivered'),
  INVOICED: t('procurement.orderStatus.invoiced'),
  CLOSED: t('procurement.orderStatus.closed'),
  CANCELLED: t('procurement.orderStatus.cancelled'),
});

const statusColorMap: Record<PurchaseOrderStatus, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  CONFIRMED: 'cyan',
  PARTIALLY_DELIVERED: 'yellow',
  DELIVERED: 'green',
  INVOICED: 'purple',
  CLOSED: 'gray',
  CANCELLED: 'red',
};

const getActionLabelMap = (): Record<OrderAction, string> => ({
  send: t('procurement.orderAction.send'),
  confirm: t('procurement.orderAction.confirm'),
  invoice: t('procurement.orderAction.invoice'),
  cancel: t('procurement.orderAction.cancel'),
  close: t('procurement.orderAction.close'),
});

const getActionSuccessMap = (): Record<OrderAction, string> => ({
  send: t('procurement.orderAction.sendSuccess'),
  confirm: t('procurement.orderAction.confirmSuccess'),
  invoice: t('procurement.orderAction.invoiceSuccess'),
  cancel: t('procurement.orderAction.cancelSuccess'),
  close: t('procurement.orderAction.closeSuccess'),
});

const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}…` : '—');

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseQuantityInput = (raw: string): number | null => {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const getAvailableActions = (status: PurchaseOrderStatus): OrderAction[] => {
  switch (status) {
    case 'DRAFT':
      return ['send', 'cancel'];
    case 'SENT':
      return ['confirm', 'cancel'];
    case 'DELIVERED':
      return ['invoice', 'close'];
    case 'INVOICED':
      return ['close'];
    default:
      return [];
  }
};

const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, string>>({});
  const [draftItem, setDraftItem] = useState({
    materialId: '',
    materialName: '',
    unit: 'шт',
    quantity: '',
    unitPrice: '',
    vatRate: '20',
  });
  const [draftMeta, setDraftMeta] = useState({
    expectedDeliveryDate: '',
    paymentTerms: '',
    deliveryAddress: '',
    notes: '',
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemDraft, setEditingItemDraft] = useState({
    materialId: '',
    materialName: '',
    unit: 'шт',
    quantity: '',
    unitPrice: '',
    vatRate: '20',
  });
  const [pendingOrderAction, setPendingOrderAction] = useState<OrderAction | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);

  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => procurementApi.getPurchaseOrder(id!),
    enabled: !!id,
  });

  const {
    data: items = [],
    isLoading: isItemsLoading,
    isError: isItemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['purchase-order-items', id],
    queryFn: () => procurementApi.getPurchaseOrderItems(id!),
    enabled: !!id,
  });
  const { data: materials = [] } = useQuery({
    queryKey: ['procurement-materials'],
    queryFn: procurementApi.getMaterials,
  });
  const materialOptions = useMemo(
    () => materials.map((material) => ({ value: material.id, label: material.name })),
    [materials],
  );
  const materialSelectOptions = useMemo(
    () => [{ value: '', label: t('procurement.orderForm.selectMaterial') }, ...materialOptions],
    [materialOptions],
  );
  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const transitionMutation = useMutation({
    mutationFn: async ({ action, current }: { action: OrderAction; current: PurchaseOrder }) => {
      switch (action) {
        case 'send':
          return procurementApi.sendPurchaseOrder(current.id);
        case 'confirm':
          return procurementApi.confirmPurchaseOrder(current.id);
        case 'invoice':
          return procurementApi.invoicePurchaseOrder(current.id);
        case 'cancel':
          return procurementApi.cancelPurchaseOrder(current.id);
        case 'close':
          return procurementApi.closePurchaseOrder(current.id);
      }
      throw new Error(`Unsupported order action: ${action}`);
    },
    onMutate: ({ action }) => {
      setPendingOrderAction(action);
      toast.loading(`${getActionLabelMap()[action]}...`, { id: 'purchase-order-status' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.current.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.current.id] });
      toast.success(getActionSuccessMap()[variables.action], { id: 'purchase-order-status' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorStatusUpdate'), { id: 'purchase-order-status' });
    },
    onSettled: () => {
      setPendingOrderAction(null);
    },
  });

  const registerDeliveryMutation = useMutation({
    mutationFn: async (payload: { orderId: string; itemId: string; quantity: number }) => {
      return procurementApi.registerPurchaseOrderDelivery(payload.orderId, {
        itemId: payload.itemId,
        deliveredQuantity: payload.quantity,
      });
    },
    onMutate: ({ itemId }) => {
      setPendingItemId(itemId);
      toast.loading(t('procurement.orderDetail.toastRegisteringDelivery'), { id: 'purchase-order-delivery' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      setDeliveryDrafts((prev) => ({ ...prev, [variables.itemId]: '' }));
      toast.success(t('procurement.orderDetail.toastDeliveryRegistered'), { id: 'purchase-order-delivery' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorDeliveryFailed'), { id: 'purchase-order-delivery' });
    },
    onSettled: () => {
      setPendingItemId(null);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (payload: {
      orderId: string;
      data: {
        expectedDeliveryDate?: string;
        paymentTerms?: string;
        deliveryAddress?: string;
        notes?: string;
      };
    }) => {
      return procurementApi.updatePurchaseOrder(payload.orderId, payload.data);
    },
    onMutate: () => {
      toast.loading(t('procurement.orderDetail.toastSavingDetails'), { id: 'purchase-order-update' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('procurement.orderDetail.toastDetailsUpdated'), { id: 'purchase-order-update' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorDetailsUpdate'), { id: 'purchase-order-update' });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await procurementApi.deletePurchaseOrder(orderId);
      return orderId;
    },
    onMutate: () => {
      toast.loading(t('procurement.orderDetail.toastDeletingOrder'), { id: 'purchase-order-delete' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('procurement.orderDetail.toastOrderDeleted'), { id: 'purchase-order-delete' });
      navigate('/procurement/purchase-orders');
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorDeleteOrder'), { id: 'purchase-order-delete' });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (payload: { orderId: string; data: PurchaseOrderItemPayload }) => {
      return procurementApi.addPurchaseOrderItem(payload.orderId, payload.data);
    },
    onMutate: () => {
      toast.loading(t('procurement.orderDetail.toastAddingItem'), { id: 'purchase-order-add-item' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setDraftItem({
        materialId: '',
        materialName: '',
        unit: 'шт',
        quantity: '',
        unitPrice: '',
        vatRate: '20',
      });
      toast.success(t('procurement.orderDetail.toastItemAdded'), { id: 'purchase-order-add-item' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorAddItem'), { id: 'purchase-order-add-item' });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (payload: { orderId: string; itemId: string }) => {
      await procurementApi.deletePurchaseOrderItem(payload.orderId, payload.itemId);
      return payload;
    },
    onMutate: ({ itemId }) => {
      setPendingDeleteItemId(itemId);
      toast.loading(t('procurement.orderDetail.toastDeletingItem'), { id: 'purchase-order-delete-item' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(t('procurement.orderDetail.toastItemDeleted'), { id: 'purchase-order-delete-item' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorDeleteItem'), { id: 'purchase-order-delete-item' });
    },
    onSettled: () => {
      setPendingDeleteItemId(null);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (payload: {
      orderId: string;
      itemId: string;
      data: {
        materialId?: string;
        materialName?: string;
        unit?: string;
        quantity?: number;
        unitPrice?: number;
        vatRate?: number;
      };
    }) => {
      return procurementApi.updatePurchaseOrderItem(payload.orderId, payload.itemId, payload.data);
    },
    onMutate: () => {
      toast.loading(t('procurement.orderDetail.toastSavingItem'), { id: 'purchase-order-update-item' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setEditingItemId(null);
      toast.success(t('procurement.orderDetail.toastItemUpdated'), { id: 'purchase-order-update-item' });
    },
    onError: () => {
      toast.error(t('procurement.orderDetail.errorUpdateItem'), { id: 'purchase-order-update-item' });
    },
  });

  const totalOrderedQty = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
    [items],
  );
  const totalDeliveredQty = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.deliveredQuantity), 0),
    [items],
  );
  const deliveryPercent = totalOrderedQty > 0
    ? Math.min(100, (totalDeliveredQty / totalOrderedQty) * 100)
    : 0;

  useEffect(() => {
    if (!order) {
      return;
    }
    setDraftMeta({
      expectedDeliveryDate: order.expectedDeliveryDate ?? '',
      paymentTerms: order.paymentTerms ?? '',
      deliveryAddress: order.deliveryAddress ?? '',
      notes: order.notes ?? '',
    });
  }, [order]);

  useEffect(() => {
    if (!editingItemId) {
      return;
    }
    const exists = items.some((item) => item.id === editingItemId);
    if (!exists) {
      setEditingItemId(null);
    }
  }, [editingItemId, items]);

  const columns = useMemo<ColumnDef<PurchaseOrderItem, unknown>[]>(() => {
    const isDraft = order?.status === 'DRAFT';
    const canRegisterDelivery = order?.status === 'CONFIRMED' || order?.status === 'PARTIALLY_DELIVERED';
    const baseColumns: ColumnDef<PurchaseOrderItem, unknown>[] = [
      {
        accessorKey: 'materialName',
        header: t('procurement.orderDetail.colMaterial'),
        size: 260,
        cell: ({ row, getValue }) => (
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {getValue<string>() || `${t('procurement.orderDetail.colMaterial')} ${shortUuid(row.original.materialId)}`}
            </p>
            <p className="text-xs text-neutral-500">ID: {shortUuid(row.original.materialId)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('procurement.orderDetail.colUnit'),
        size: 70,
        cell: ({ getValue }) => <span>{getValue<string>() || '—'}</span>,
      },
      {
        id: 'quantity',
        header: t('procurement.orderDetail.colOrdered'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(toNumber(row.original.quantity))}
          </span>
        ),
      },
      {
        id: 'delivered',
        header: t('procurement.orderDetail.colDelivered'),
        size: 150,
        cell: ({ row }) => {
          const ordered = toNumber(row.original.quantity);
          const delivered = toNumber(row.original.deliveredQuantity);
          const rowPercent = ordered > 0 ? Math.min(100, (delivered / ordered) * 100) : 0;
          return (
            <div className="min-w-[140px]">
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span className="tabular-nums">{formatNumber(delivered)}</span>
                <span>{rowPercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${rowPercent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'remaining',
        header: t('procurement.orderDetail.colRemaining'),
        size: 120,
        cell: ({ row }) => {
          const ordered = toNumber(row.original.quantity);
          const delivered = toNumber(row.original.deliveredQuantity);
          const remaining = Math.max(0, ordered - delivered);
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatNumber(remaining)}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.orderDetail.colAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium block text-right">
            {formatMoney(toNumber(getValue<number>()))}
          </span>
        ),
      },
      {
        id: 'registerDelivery',
        header: t('procurement.orderDetail.colDelivery'),
        size: 240,
        cell: ({ row }) => {
          const item = row.original;
          const itemId = item.id;
          const ordered = toNumber(item.quantity);
          const delivered = toNumber(item.deliveredQuantity);
          const remaining = Math.max(0, ordered - delivered);
          const value = deliveryDrafts[itemId] ?? '';
          const isPending = registerDeliveryMutation.isPending && pendingItemId === itemId;

          if (!canRegisterDelivery || remaining <= 0 || !order) {
            return <span className="text-xs text-neutral-400">—</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(event) => {
                  setDeliveryDrafts((prev) => ({ ...prev, [itemId]: event.target.value }));
                }}
                placeholder={t('procurement.orderDetail.placeholderQty')}
                className="h-8 w-24"
                aria-label={`${t('procurement.orderDetail.ariaDeliveryQty')} ${item.materialName || item.materialId}`}
              />
              <Button
                variant="secondary"
                size="xs"
                iconLeft={<Truck size={12} />}
                loading={isPending}
                onClick={() => {
                  if (isPending || !order) {
                    return;
                  }
                  const parsed = parseQuantityInput(value);
                  if (!parsed) {
                    toast.error(t('procurement.orderDetail.errorInvalidDeliveryQty'));
                    return;
                  }
                  if (parsed > remaining) {
                    toast.error(`${t('procurement.orderDetail.errorExceedsRemaining')} (${formatNumber(remaining)})`);
                    return;
                  }
                  registerDeliveryMutation.mutate({
                    orderId: order.id,
                    itemId,
                    quantity: parsed,
                  });
                }}
              >
                {t('procurement.orderDetail.accept')}
              </Button>
            </div>
          );
        },
      },
    ];

    if (isDraft) {
      baseColumns.push({
        id: 'draftActions',
        header: t('procurement.orderDetail.colManagement'),
        size: 240,
        cell: ({ row }) => {
          const item = row.original;
          const isPending = deleteItemMutation.isPending && pendingDeleteItemId === item.id;
          const isEditing = editingItemId === item.id;
          if (!order) {
            return null;
          }
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant={isEditing ? 'primary' : 'secondary'}
                size="xs"
                iconLeft={<Pencil size={12} />}
                onClick={() => {
                  const resolvedMaterial = materialById.get(item.materialId);
                  setEditingItemId(item.id);
                  setEditingItemDraft({
                    materialId: item.materialId,
                    materialName: item.materialName || resolvedMaterial?.name || '',
                    unit: item.unit || resolvedMaterial?.unit || 'шт',
                    quantity: String(toNumber(item.quantity)),
                    unitPrice: String(toNumber(item.unitPrice)),
                    vatRate: String(toNumber(item.vatRate) || 20),
                  });
                }}
              >
                {isEditing ? t('procurement.orderDetail.selected') : t('procurement.orderDetail.edit')}
              </Button>
              <Button
                variant="danger"
                size="xs"
                iconLeft={<Trash2 size={12} />}
                loading={isPending}
                onClick={async () => {
                  if (isPending) {
                    return;
                  }
                  const isConfirmed = await confirm({
                    title: `${t('procurement.orderDetail.confirmDeleteItemTitle')} ${item.materialName || shortUuid(item.materialId)}?`,
                    description: t('procurement.orderDetail.confirmDeleteItemDescription'),
                    confirmLabel: t('procurement.orderDetail.confirmDeleteItemLabel'),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                  });
                  if (!isConfirmed) {
                    return;
                  }
                  deleteItemMutation.mutate({ orderId: order.id, itemId: item.id });
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [
    confirm,
    deleteItemMutation,
    deliveryDrafts,
    editingItemId,
    materialById,
    order,
    pendingDeleteItemId,
    pendingItemId,
    registerDeliveryMutation,
  ]);

  if (isOrderError && !order) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('procurement.orderDetail.title')}
          subtitle={t('procurement.orderDetail.subtitlePurchaseOrder')}
          backTo="/procurement/purchase-orders"
          breadcrumbs={[
            { label: t('procurement.orderDetail.breadcrumbHome'), href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: t('procurement.orderDetail.breadcrumbOrders'), href: '/procurement/purchase-orders' },
            { label: t('procurement.orderDetail.breadcrumbLoadError') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('procurement.orderDetail.errorLoadTitle')}
          description={t('procurement.orderDetail.errorLoadDescription')}
          actionLabel={t('common.refresh')}
          onAction={() => {
            void refetchOrder();
          }}
        />
      </div>
    );
  }

  if (!order && isOrderLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('procurement.orderDetail.loading')}
          backTo="/procurement/purchase-orders"
          breadcrumbs={[
            { label: t('procurement.orderDetail.breadcrumbHome'), href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: t('procurement.orderDetail.breadcrumbOrders'), href: '/procurement/purchase-orders' },
            { label: t('common.loading') },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label={t('procurement.orderDetail.metricAmount')} value="—" loading />
          <MetricCard label={t('procurement.orderDetail.metricItems')} value="—" loading />
          <MetricCard label={t('procurement.orderDetail.metricDelivered')} value="—" loading />
          <MetricCard label={t('procurement.orderDetail.metricDeliveryPlan')} value="—" loading />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const availableActions = getAvailableActions(order.status);
  const canChangeStatus = availableActions.length > 0;
  const hasItemsError = isItemsError && items.length === 0;
  const isDraft = order.status === 'DRAFT';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={order.orderNumber}
        subtitle={`${t('procurement.orderDetail.created')} ${formatDateLong(order.createdAt)} / ${t('procurement.orderDetail.supplier')} ${shortUuid(order.supplierId)}`}
        backTo="/procurement/purchase-orders"
        breadcrumbs={[
          { label: t('procurement.orderDetail.breadcrumbHome'), href: '/' },
          { label: t('procurement.title'), href: '/procurement' },
          { label: t('procurement.orderDetail.breadcrumbOrders'), href: '/procurement/purchase-orders' },
          { label: order.orderNumber },
        ]}
        actions={(
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusBadge
              status={order.status}
              colorMap={statusColorMap}
              label={getStatusLabels()[order.status] ?? order.status}
              size="md"
            />
            {canChangeStatus && availableActions.map((action) => {
              const icon =
                action === 'send' ? <Send size={14} /> :
                  action === 'confirm' ? <CheckCircle2 size={14} /> :
                    action === 'invoice' ? <FileText size={14} /> :
                    action === 'close' ? <Lock size={14} /> :
                      <XCircle size={14} />;
              const isPending = transitionMutation.isPending && pendingOrderAction === action;

              return (
                <Button
                  key={action}
                  size="sm"
                  variant={action === 'cancel' ? 'danger' : 'secondary'}
                  iconLeft={icon}
                  loading={isPending}
                  onClick={async () => {
                    if (isPending) {
                      return;
                    }
                    if (action === 'cancel') {
                      const isConfirmed = await confirm({
                        title: `${t('procurement.orderDetail.confirmCancelTitle')} ${order.orderNumber}?`,
                        description: t('procurement.orderDetail.confirmCancelDescription'),
                        confirmLabel: t('procurement.orderDetail.confirmCancelLabel'),
                        cancelLabel: t('common.cancel'),
                        confirmVariant: 'danger',
                        items: [order.orderNumber],
                      });
                      if (!isConfirmed) {
                        return;
                      }
                    }
                    transitionMutation.mutate({ action, current: order });
                  }}
                >
                  {getActionLabelMap()[action]}
                </Button>
              );
            })}
            {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_DELIVERED' || order.status === 'DELIVERED') && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Warehouse size={14} />}
                title={t('procurement.poReceiveGoodsHint')}
                onClick={() => {
                  const wParams = new URLSearchParams();
                  wParams.set('purchaseOrderId', order.id);
                  if (order.projectId) wParams.set('projectId', order.projectId);
                  navigate(`/warehouse/orders/new?${wParams.toString()}`);
                }}
              >
                {t('procurement.poReceiveGoods')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Copy size={14} />}
              title={t('procurement.repeatOrderHint')}
              onClick={() => {
                const repeatData = {
                  supplierId: order.supplierId,
                  projectId: order.projectId ?? '',
                  contractId: order.contractId ?? '',
                  purchaseRequestId: order.purchaseRequestId ?? '',
                  currency: order.currency,
                  paymentTerms: order.paymentTerms ?? '',
                  deliveryAddress: order.deliveryAddress ?? '',
                  notes: order.notes ?? '',
                  items: items.map((item) => ({
                    materialId: item.materialId,
                    materialName: item.materialName ?? '',
                    unit: item.unit ?? '',
                    quantity: String(item.quantity ?? ''),
                    unitPrice: String(item.unitPrice ?? ''),
                    vatRate: String(item.vatRate ?? '20'),
                  })),
                };
                try {
                  window.localStorage.setItem(
                    'procurement:purchase-order:repeat:v1',
                    JSON.stringify(repeatData),
                  );
                } catch { /* storage full */ }
                const rParams = new URLSearchParams();
                rParams.set('repeatFrom', order.id);
                if (order.supplierId) rParams.set('supplierId', order.supplierId);
                if (order.projectId) rParams.set('projectId', order.projectId);
                navigate(`/procurement/purchase-orders/new?${rParams.toString()}`);
              }}
            >
              {t('procurement.repeatOrder')}
            </Button>
            {isDraft && (
              <Button
                variant="danger"
                size="sm"
                loading={deleteOrderMutation.isPending}
                onClick={async () => {
                  if (deleteOrderMutation.isPending) {
                    return;
                  }
                  const isConfirmed = await confirm({
                    title: `${t('procurement.orderDetail.confirmDeleteTitle')} ${order.orderNumber}?`,
                    description: t('procurement.orderDetail.confirmDeleteDescription'),
                    confirmLabel: t('procurement.orderDetail.confirmDeleteLabel'),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                    items: [order.orderNumber],
                  });
                  if (!isConfirmed) {
                    return;
                  }
                  deleteOrderMutation.mutate(order.id);
                }}
              >
                {t('procurement.orderDetail.deleteOrder')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/procurement/purchase-orders')}
            >
              {t('procurement.orderDetail.toList')}
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={16} />}
          label={t('procurement.orderDetail.metricAmount')}
          value={formatMoney(order.totalAmount)}
        />
        <MetricCard
          icon={<Package size={16} />}
          label={t('procurement.orderDetail.metricItems')}
          value={String(items.length)}
          subtitle={`${formatNumber(totalOrderedQty)} ${t('procurement.orderDetail.unitsSuffix')}`}
        />
        <MetricCard
          icon={<Truck size={16} />}
          label={t('procurement.orderDetail.metricDelivered')}
          value={`${deliveryPercent.toFixed(0)}%`}
          subtitle={`${formatNumber(totalDeliveredQty)} ${t('procurement.orderDetail.outOf')} ${formatNumber(totalOrderedQty)}`}
        />
        <MetricCard
          icon={<Calendar size={16} />}
          label={t('procurement.orderDetail.metricDeliveryPlan')}
          value={formatDate(order.expectedDeliveryDate)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('procurement.orderDetail.deliveryExecution')}
          </h3>
          <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            <span>{formatNumber(totalDeliveredQty)} / {formatNumber(totalOrderedQty)} {t('procurement.orderDetail.unitsSuffix')}</span>
            <span>{deliveryPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${deliveryPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {t('procurement.orderDetail.deliveryHint')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('procurement.orderDetail.orderDetails')}
          </h3>
          <InfoRow icon={<FolderKanban size={15} />} label={t('procurement.orderDetail.infoProject')} value={shortUuid(order.projectId)} />
          <InfoRow icon={<Package size={15} />} label={t('procurement.orderDetail.infoPurchaseRequest')} value={shortUuid(order.purchaseRequestId)} />
          <InfoRow icon={<Calendar size={15} />} label={t('procurement.orderDetail.infoOrderDate')} value={formatDate(order.orderDate)} />
          <InfoRow icon={<Calendar size={15} />} label={t('procurement.orderDetail.infoActualDelivery')} value={formatDate(order.actualDeliveryDate)} />
          <InfoRow icon={<Percent size={15} />} label={t('procurement.orderDetail.infoVat')} value={formatMoney(order.vatAmount)} />
          <InfoRow icon={<MapPin size={15} />} label={t('procurement.orderDetail.infoDeliveryAddress')} value={order.deliveryAddress || '—'} />
        </div>
      </div>

      {isDraft && (
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('procurement.orderDetail.draftRequisites')}</p>
              <Input
                type="date"
                value={draftMeta.expectedDeliveryDate}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
              />
              <Input
                placeholder={t('procurement.orderDetail.placeholderPaymentTerms')}
                value={draftMeta.paymentTerms}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, paymentTerms: event.target.value }))}
              />
              <Input
                placeholder={t('procurement.orderDetail.placeholderDeliveryAddress')}
                value={draftMeta.deliveryAddress}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('procurement.orderDetail.draftNotes')}</p>
              <Textarea
                rows={5}
                placeholder={t('procurement.orderDetail.placeholderOrderNotes')}
                value={draftMeta.notes}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <Button
                variant="secondary"
                size="sm"
                loading={updateOrderMutation.isPending}
                onClick={() => {
                  updateOrderMutation.mutate({
                    orderId: order.id,
                    data: {
                      expectedDeliveryDate: draftMeta.expectedDeliveryDate || undefined,
                      paymentTerms: draftMeta.paymentTerms.trim() || undefined,
                      deliveryAddress: draftMeta.deliveryAddress.trim() || undefined,
                      notes: draftMeta.notes.trim() || undefined,
                    },
                  });
                }}
              >
                {t('procurement.orderDetail.saveRequisites')}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('procurement.orderDetail.addItemTitle')}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Plus size={14} />}
              loading={addItemMutation.isPending}
              onClick={() => {
                const quantity = parseQuantityInput(draftItem.quantity);
                const unitPrice = parseQuantityInput(draftItem.unitPrice);
                const vatRate = toNumber(draftItem.vatRate);
                if (!draftItem.materialId.trim()) {
                  toast.error(t('procurement.orderDetail.validationMaterialId'));
                  return;
                }
                if (!quantity) {
                  toast.error(t('procurement.orderDetail.validationQuantity'));
                  return;
                }
                if (!unitPrice) {
                  toast.error(t('procurement.orderDetail.validationPrice'));
                  return;
                }
                if (vatRate < 0 || vatRate > 100) {
                  toast.error(t('procurement.orderDetail.validationVatRange'));
                  return;
                }
                addItemMutation.mutate({
                  orderId: order.id,
                  data: {
                    materialId: draftItem.materialId.trim(),
                    materialName: draftItem.materialName.trim() || undefined,
                    unit: draftItem.unit.trim() || undefined,
                    quantity,
                    unitPrice,
                    vatRate,
                  },
                });
              }}
            >
              {t('procurement.orderDetail.addItemButton')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {materialOptions.length > 0 ? (
              <Select
                options={materialSelectOptions}
                value={draftItem.materialId}
                onChange={(event) => {
                  const materialId = event.target.value;
                  const material = materialById.get(materialId);
                  setDraftItem((prev) => ({
                    ...prev,
                    materialId,
                    materialName: material?.name || prev.materialName,
                    unit: material?.unit || prev.unit,
                  }));
                }}
              />
            ) : (
              <Input
                placeholder={t('procurement.orderDetail.placeholderMaterialId')}
                value={draftItem.materialId}
                onChange={(event) => setDraftItem((prev) => ({ ...prev, materialId: event.target.value }))}
              />
            )}
            <Input
              placeholder={t('procurement.orderDetail.placeholderMaterialName')}
              value={draftItem.materialName}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, materialName: event.target.value }))}
            />
            <Input
              placeholder={t('procurement.orderDetail.placeholderUnit')}
              value={draftItem.unit}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderQuantity')}
              value={draftItem.quantity}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderPrice')}
              value={draftItem.unitPrice}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderVatPercent')}
              value={draftItem.vatRate}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, vatRate: event.target.value }))}
            />
          </div>
        </section>
      )}

      {hasItemsError ? (
        <EmptyState
          variant="ERROR"
          title={t('procurement.orderDetail.itemsLoadError')}
          description={t('procurement.orderDetail.itemsLoadErrorDescription')}
          actionLabel={t('common.retry')}
          onAction={() => {
            void refetchItems();
          }}
        />
      ) : (
        <DataTable<PurchaseOrderItem>
          data={items}
          columns={columns}
          loading={isItemsLoading}
          enableDensityToggle
          enableExport
          enableColumnVisibility
          enableSavedViews
          savedViewsKey={`procurement-purchase-order-items-${order.id}`}
          pageSize={20}
          emptyTitle={t('procurement.orderDetail.itemsEmptyTitle')}
          emptyDescription={t('procurement.orderDetail.itemsEmptyDescription')}
        />
      )}

      {isDraft && editingItemId && (
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('procurement.orderDetail.editItemTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            {materialOptions.length > 0 ? (
              <Select
                options={materialSelectOptions}
                value={editingItemDraft.materialId}
                onChange={(event) => {
                  const materialId = event.target.value;
                  const material = materialById.get(materialId);
                  setEditingItemDraft((prev) => ({
                    ...prev,
                    materialId,
                    materialName: material?.name || prev.materialName,
                    unit: material?.unit || prev.unit,
                  }));
                }}
              />
            ) : (
              <Input
                placeholder={t('procurement.orderDetail.placeholderMaterialId')}
                value={editingItemDraft.materialId}
                onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialId: event.target.value }))}
              />
            )}
            <Input
              placeholder={t('procurement.orderDetail.placeholderMaterialName')}
              value={editingItemDraft.materialName}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialName: event.target.value }))}
            />
            <Input
              placeholder={t('procurement.orderDetail.placeholderUnit')}
              value={editingItemDraft.unit}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderQuantity')}
              value={editingItemDraft.quantity}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderPrice')}
              value={editingItemDraft.unitPrice}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t('procurement.orderDetail.placeholderVatPercent')}
              value={editingItemDraft.vatRate}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, vatRate: event.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              loading={updateItemMutation.isPending}
              onClick={() => {
                if (!order) {
                  return;
                }
                const quantity = parseQuantityInput(editingItemDraft.quantity);
                const unitPrice = parseQuantityInput(editingItemDraft.unitPrice);
                const vatRate = toNumber(editingItemDraft.vatRate);
                if (!editingItemDraft.materialId.trim()) {
                  toast.error(t('procurement.orderDetail.validationMaterialId'));
                  return;
                }
                if (!quantity) {
                  toast.error(t('procurement.orderDetail.validationQuantity'));
                  return;
                }
                if (!unitPrice) {
                  toast.error(t('procurement.orderDetail.validationPrice'));
                  return;
                }
                if (vatRate < 0 || vatRate > 100) {
                  toast.error(t('procurement.orderDetail.validationVatRange'));
                  return;
                }
                const itemId = editingItemId;
                if (!itemId) {
                  return;
                }
                updateItemMutation.mutate({
                  orderId: order.id,
                  itemId,
                  data: {
                    materialId: editingItemDraft.materialId.trim(),
                    materialName: editingItemDraft.materialName.trim() || undefined,
                    unit: editingItemDraft.unit.trim() || undefined,
                    quantity,
                    unitPrice,
                    vatRate,
                  },
                });
              }}
            >
              {t('procurement.orderDetail.saveItem')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingItemId(null)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 break-words">{value}</p>
    </div>
  </div>
);

export default PurchaseOrderDetailPage;
