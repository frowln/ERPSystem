import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
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

type OrderAction = 'send' | 'confirm' | 'cancel' | 'close';

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  CONFIRMED: 'Подтверждён',
  PARTIALLY_DELIVERED: 'Частично доставлен',
  DELIVERED: 'Доставлен',
  INVOICED: 'Оплачен',
  CLOSED: 'Закрыт',
  CANCELLED: 'Отменён',
};

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

const actionLabelMap: Record<OrderAction, string> = {
  send: 'Отправить',
  confirm: 'Подтвердить',
  cancel: 'Отменить',
  close: 'Закрыть',
};

const actionSuccessMap: Record<OrderAction, string> = {
  send: 'Заказ отправлен поставщику',
  confirm: 'Заказ подтверждён',
  cancel: 'Заказ отменён',
  close: 'Заказ закрыт',
};

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
    () => [{ value: '', label: 'Выберите материал' }, ...materialOptions],
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
        case 'cancel':
          return procurementApi.cancelPurchaseOrder(current.id);
        case 'close':
          return procurementApi.closePurchaseOrder(current.id);
      }
      throw new Error(`Unsupported order action: ${action}`);
    },
    onMutate: ({ action }) => {
      setPendingOrderAction(action);
      toast.loading(`${actionLabelMap[action]}...`, { id: 'purchase-order-status' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.current.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.current.id] });
      toast.success(actionSuccessMap[variables.action], { id: 'purchase-order-status' });
    },
    onError: () => {
      toast.error('Не удалось обновить статус заказа', { id: 'purchase-order-status' });
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
      toast.loading('Регистрируем поставку...', { id: 'purchase-order-delivery' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      setDeliveryDrafts((prev) => ({ ...prev, [variables.itemId]: '' }));
      toast.success('Поставка зарегистрирована', { id: 'purchase-order-delivery' });
    },
    onError: () => {
      toast.error('Не удалось зарегистрировать поставку', { id: 'purchase-order-delivery' });
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
      toast.loading('Сохраняем реквизиты заказа...', { id: 'purchase-order-update' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Реквизиты заказа обновлены', { id: 'purchase-order-update' });
    },
    onError: () => {
      toast.error('Не удалось обновить реквизиты заказа', { id: 'purchase-order-update' });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await procurementApi.deletePurchaseOrder(orderId);
      return orderId;
    },
    onMutate: () => {
      toast.loading('Удаляем заказ...', { id: 'purchase-order-delete' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Заказ удалён', { id: 'purchase-order-delete' });
      navigate('/procurement/purchase-orders');
    },
    onError: () => {
      toast.error('Не удалось удалить заказ', { id: 'purchase-order-delete' });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (payload: { orderId: string; data: PurchaseOrderItemPayload }) => {
      return procurementApi.addPurchaseOrderItem(payload.orderId, payload.data);
    },
    onMutate: () => {
      toast.loading('Добавляем позицию...', { id: 'purchase-order-add-item' });
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
      toast.success('Позиция добавлена', { id: 'purchase-order-add-item' });
    },
    onError: () => {
      toast.error('Не удалось добавить позицию', { id: 'purchase-order-add-item' });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (payload: { orderId: string; itemId: string }) => {
      await procurementApi.deletePurchaseOrderItem(payload.orderId, payload.itemId);
      return payload;
    },
    onMutate: ({ itemId }) => {
      setPendingDeleteItemId(itemId);
      toast.loading('Удаляем позицию...', { id: 'purchase-order-delete-item' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Позиция удалена', { id: 'purchase-order-delete-item' });
    },
    onError: () => {
      toast.error('Не удалось удалить позицию', { id: 'purchase-order-delete-item' });
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
      toast.loading('Сохраняем позицию...', { id: 'purchase-order-update-item' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setEditingItemId(null);
      toast.success('Позиция обновлена', { id: 'purchase-order-update-item' });
    },
    onError: () => {
      toast.error('Не удалось обновить позицию', { id: 'purchase-order-update-item' });
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
        header: 'Материал',
        size: 260,
        cell: ({ row, getValue }) => (
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {getValue<string>() || `Материал ${shortUuid(row.original.materialId)}`}
            </p>
            <p className="text-xs text-neutral-500">ID: {shortUuid(row.original.materialId)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Ед.',
        size: 70,
        cell: ({ getValue }) => <span>{getValue<string>() || '—'}</span>,
      },
      {
        id: 'quantity',
        header: 'Заказано',
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(toNumber(row.original.quantity))}
          </span>
        ),
      },
      {
        id: 'delivered',
        header: 'Доставлено',
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
        header: 'Остаток',
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
        header: 'Сумма',
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium block text-right">
            {formatMoney(toNumber(getValue<number>()))}
          </span>
        ),
      },
      {
        id: 'registerDelivery',
        header: 'Поставка',
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
                placeholder="Кол-во"
                className="h-8 w-24"
                aria-label={`Количество поставки по ${item.materialName || item.materialId}`}
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
                    toast.error('Введите корректное количество поставки');
                    return;
                  }
                  if (parsed > remaining) {
                    toast.error(`Нельзя поставить больше остатка (${formatNumber(remaining)})`);
                    return;
                  }
                  registerDeliveryMutation.mutate({
                    orderId: order.id,
                    itemId,
                    quantity: parsed,
                  });
                }}
              >
                Принять
              </Button>
            </div>
          );
        },
      },
    ];

    if (isDraft) {
      baseColumns.push({
        id: 'draftActions',
        header: 'Управление',
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
                {isEditing ? 'Выбрано' : 'Редакт.'}
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
                    title: `Удалить позицию ${item.materialName || shortUuid(item.materialId)}?`,
                    description: 'Позиция будет исключена из заказа.',
                    confirmLabel: 'Удалить позицию',
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                  });
                  if (!isConfirmed) {
                    return;
                  }
                  deleteItemMutation.mutate({ orderId: order.id, itemId: item.id });
                }}
              >
                Удалить
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
          title="Заказ поставщику"
          subtitle="Purchase Order"
          backTo="/procurement/purchase-orders"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: 'Заказы поставщикам', href: '/procurement/purchase-orders' },
            { label: 'Ошибка загрузки' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить заказ"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
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
          title="Загрузка заказа..."
          backTo="/procurement/purchase-orders"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: 'Заказы поставщикам', href: '/procurement/purchase-orders' },
            { label: 'Загрузка' },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Сумма заказа" value="—" loading />
          <MetricCard label="Позиции" value="—" loading />
          <MetricCard label="Доставлено" value="—" loading />
          <MetricCard label="План поставки" value="—" loading />
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
        subtitle={`Создан ${formatDateLong(order.createdAt)} / Поставщик ${shortUuid(order.supplierId)}`}
        backTo="/procurement/purchase-orders"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: t('procurement.title'), href: '/procurement' },
          { label: 'Заказы поставщикам', href: '/procurement/purchase-orders' },
          { label: order.orderNumber },
        ]}
        actions={(
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <StatusBadge
              status={order.status}
              colorMap={statusColorMap}
              label={statusLabels[order.status] ?? order.status}
              size="md"
            />
            {canChangeStatus && availableActions.map((action) => {
              const icon =
                action === 'send' ? <Send size={14} /> :
                  action === 'confirm' ? <CheckCircle2 size={14} /> :
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
                        title: `Отменить заказ ${order.orderNumber}?`,
                        description: 'Заказ будет недоступен для дальнейшей поставки.',
                        confirmLabel: 'Отменить заказ',
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
                  {actionLabelMap[action]}
                </Button>
              );
            })}
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
                    title: `Удалить заказ ${order.orderNumber}?`,
                    description: 'Удалить можно только черновик. Действие необратимо.',
                    confirmLabel: 'Удалить заказ',
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
                Удалить заказ
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/procurement/purchase-orders')}
            >
              К списку
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardList size={16} />}
          label="Сумма заказа"
          value={formatMoney(order.totalAmount)}
        />
        <MetricCard
          icon={<Package size={16} />}
          label="Позиции"
          value={String(items.length)}
          subtitle={`${formatNumber(totalOrderedQty)} ед.`}
        />
        <MetricCard
          icon={<Truck size={16} />}
          label="Доставлено"
          value={`${deliveryPercent.toFixed(0)}%`}
          subtitle={`${formatNumber(totalDeliveredQty)} из ${formatNumber(totalOrderedQty)}`}
        />
        <MetricCard
          icon={<Calendar size={16} />}
          label="План поставки"
          value={formatDate(order.expectedDeliveryDate)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Исполнение поставки
          </h3>
          <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            <span>{formatNumber(totalDeliveredQty)} / {formatNumber(totalOrderedQty)} ед.</span>
            <span>{deliveryPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${deliveryPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            После подтверждения заказа фиксируйте поставки по каждой позиции в таблице ниже.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Реквизиты заказа
          </h3>
          <InfoRow icon={<FolderKanban size={15} />} label="Проект" value={shortUuid(order.projectId)} />
          <InfoRow icon={<Package size={15} />} label="Заявка на закупку" value={shortUuid(order.purchaseRequestId)} />
          <InfoRow icon={<Calendar size={15} />} label="Дата заказа" value={formatDate(order.orderDate)} />
          <InfoRow icon={<Calendar size={15} />} label="Факт поставки" value={formatDate(order.actualDeliveryDate)} />
          <InfoRow icon={<Percent size={15} />} label="НДС" value={formatMoney(order.vatAmount)} />
          <InfoRow icon={<MapPin size={15} />} label="Адрес поставки" value={order.deliveryAddress || '—'} />
        </div>
      </div>

      {isDraft && (
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Реквизиты черновика</p>
              <Input
                type="date"
                value={draftMeta.expectedDeliveryDate}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
              />
              <Input
                placeholder="Условия оплаты"
                value={draftMeta.paymentTerms}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, paymentTerms: event.target.value }))}
              />
              <Input
                placeholder="Адрес поставки"
                value={draftMeta.deliveryAddress}
                onChange={(event) => setDraftMeta((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Комментарий</p>
              <Textarea
                rows={5}
                placeholder="Комментарий к заказу"
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
                Сохранить реквизиты
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Добавить позицию в заказ
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
                  toast.error('Укажите ID материала');
                  return;
                }
                if (!quantity) {
                  toast.error('Введите корректное количество');
                  return;
                }
                if (!unitPrice) {
                  toast.error('Введите корректную цену');
                  return;
                }
                if (vatRate < 0 || vatRate > 100) {
                  toast.error('НДС должен быть в диапазоне 0-100');
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
              Добавить позицию
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
                placeholder="ID материала"
                value={draftItem.materialId}
                onChange={(event) => setDraftItem((prev) => ({ ...prev, materialId: event.target.value }))}
              />
            )}
            <Input
              placeholder="Наименование"
              value={draftItem.materialName}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, materialName: event.target.value }))}
            />
            <Input
              placeholder="Ед."
              value={draftItem.unit}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Кол-во"
              value={draftItem.quantity}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Цена"
              value={draftItem.unitPrice}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="НДС %"
              value={draftItem.vatRate}
              onChange={(event) => setDraftItem((prev) => ({ ...prev, vatRate: event.target.value }))}
            />
          </div>
        </section>
      )}

      {hasItemsError ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить позиции заказа"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
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
          emptyTitle="В заказе нет позиций"
          emptyDescription="Добавьте позиции в заказ, чтобы зарегистрировать поставки."
        />
      )}

      {isDraft && editingItemId && (
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Редактирование позиции
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
                placeholder="ID материала"
                value={editingItemDraft.materialId}
                onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialId: event.target.value }))}
              />
            )}
            <Input
              placeholder="Наименование"
              value={editingItemDraft.materialName}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, materialName: event.target.value }))}
            />
            <Input
              placeholder="Ед."
              value={editingItemDraft.unit}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unit: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Кол-во"
              value={editingItemDraft.quantity}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Цена"
              value={editingItemDraft.unitPrice}
              onChange={(event) => setEditingItemDraft((prev) => ({ ...prev, unitPrice: event.target.value }))}
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="НДС %"
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
                  toast.error('Укажите ID материала');
                  return;
                }
                if (!quantity) {
                  toast.error('Введите корректное количество');
                  return;
                }
                if (!unitPrice) {
                  toast.error('Введите корректную цену');
                  return;
                }
                if (vatRate < 0 || vatRate > 100) {
                  toast.error('НДС должен быть в диапазоне 0-100');
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
              Сохранить позицию
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingItemId(null)}
            >
              Отмена
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
