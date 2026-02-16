import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Lock, Search, Send, ShoppingCart, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  procurementApi,
  type PurchaseOrder,
  type PurchaseOrderBulkTransitionAction,
  type PurchaseOrderStatus,
} from '@/api/procurement';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

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

type OrderAction = 'send' | 'confirm' | 'cancel' | 'close';

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

const actionBulkSuccessMap: Record<OrderAction, string> = {
  send: 'Заказы отправлены поставщикам',
  confirm: 'Заказы подтверждены',
  cancel: 'Заказы отменены',
  close: 'Заказы закрыты',
};

const actionBulkMap: Record<OrderAction, PurchaseOrderBulkTransitionAction> = {
  send: 'SEND',
  confirm: 'CONFIRM',
  cancel: 'CANCEL',
  close: 'CLOSE',
};

const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}…` : '—');

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

type BulkTransitionVariables = {
  action: OrderAction;
  eligibleOrders: PurchaseOrder[];
  skippedOrders: PurchaseOrder[];
};

const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: () =>
      procurementApi.getPurchaseOrders({
        page: 0,
        size: 300,
        sort: 'createdAt,desc',
        status: statusFilter || undefined,
      }),
  });

  const orders = data?.content ?? [];

  const transitionMutation = useMutation({
    mutationFn: async ({ order, action }: { order: PurchaseOrder; action: OrderAction }) => {
      switch (action) {
        case 'send':
          return procurementApi.sendPurchaseOrder(order.id);
        case 'confirm':
          return procurementApi.confirmPurchaseOrder(order.id);
        case 'cancel':
          return procurementApi.cancelPurchaseOrder(order.id);
        case 'close':
          return procurementApi.closePurchaseOrder(order.id);
      }
      throw new Error(`Unsupported action: ${action}`);
    },
    onMutate: ({ order, action }) => {
      setPendingOrderId(order.id);
      toast.loading(`${actionLabelMap[action]}...`, { id: 'purchase-order-transition' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(actionSuccessMap[variables.action], { id: 'purchase-order-transition' });
    },
    onError: () => {
      toast.error('Не удалось обновить статус заказа', { id: 'purchase-order-transition' });
    },
    onSettled: () => {
      setPendingOrderId(null);
    },
  });

  const bulkTransitionMutation = useMutation({
    mutationFn: async (variables: BulkTransitionVariables) => {
      return procurementApi.bulkTransitionPurchaseOrders({
        action: actionBulkMap[variables.action],
        orderIds: variables.eligibleOrders.map((order) => order.id),
      });
    },
    onMutate: ({ action }) => {
      toast.loading(`${actionLabelMap[action]} (массово)...`, { id: 'purchase-order-bulk-transition' });
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });

      const skippedCount = variables.skippedOrders.length;
      const successParts = [`${actionBulkSuccessMap[variables.action]}: ${response.successCount}`];
      if (skippedCount > 0) {
        successParts.push(`пропущено: ${skippedCount}`);
      }
      toast.success(successParts.join(', '), { id: 'purchase-order-bulk-transition' });

      if (response.failedCount > 0) {
        const orderNumberById = new Map(variables.eligibleOrders.map((order) => [order.id, order.orderNumber]));
        const details = response.errors
          .slice(0, 3)
          .map((error) => `${orderNumberById.get(error.orderId) ?? shortUuid(error.orderId)}: ${error.message}`)
          .join(' | ');
        const overflow = response.failedCount > 3 ? ` (+${response.failedCount - 3})` : '';
        toast.error(`Ошибок: ${response.failedCount}. ${details}${overflow}`, {
          id: 'purchase-order-bulk-transition-errors',
        });
      }
    },
    onError: () => {
      toast.error('Не удалось выполнить массовое действие', { id: 'purchase-order-bulk-transition' });
    },
  });

  const handleBulkActionRequest = (action: OrderAction, selectedRows: PurchaseOrder[]) => {
    if (bulkTransitionMutation.isPending || transitionMutation.isPending || selectedRows.length === 0) {
      return;
    }

    const eligibleOrders = selectedRows.filter((order) => getAvailableActions(order.status).includes(action));
    if (eligibleOrders.length === 0) {
      toast.error(`Нет заказов в статусе, подходящем для действия "${actionLabelMap[action]}"`);
      return;
    }

    const eligibleIds = new Set(eligibleOrders.map((order) => order.id));
    const skippedOrders = selectedRows.filter((order) => !eligibleIds.has(order.id));

    const dialogMeta = action === 'send'
      ? {
        title: 'Отправить выбранные заказы?',
        description: 'Будут отправлены только заказы в статусе "Черновик".',
        confirmLabel: 'Отправить',
      }
      : action === 'confirm'
        ? {
          title: 'Подтвердить выбранные заказы?',
          description: 'Будут подтверждены только заказы в статусе "Отправлен".',
          confirmLabel: 'Подтвердить',
        }
        : action === 'close'
          ? {
            title: 'Закрыть выбранные заказы?',
            description: 'Будут закрыты только полностью доставленные или оплаченные заказы.',
            confirmLabel: 'Закрыть',
          }
          : {
            title: 'Отменить выбранные заказы?',
            description: 'Подходящие заказы будут переведены в статус "Отменён".',
            confirmLabel: 'Отменить',
            confirmVariant: 'danger' as const,
          };

    const description = skippedOrders.length > 0
      ? `${dialogMeta.description} Пропущено неподходящих: ${skippedOrders.length}.`
      : dialogMeta.description;

    void (async () => {
      const isConfirmed = await confirm({
        title: `${dialogMeta.title} (${eligibleOrders.length} из ${selectedRows.length})`,
        description,
        confirmLabel: dialogMeta.confirmLabel,
        cancelLabel: t('common.cancel'),
        confirmVariant: dialogMeta.confirmVariant,
        items: eligibleOrders.slice(0, 5).map((order) => `${order.orderNumber} — ${statusLabels[order.status]}`),
      });
      if (!isConfirmed) {
        return;
      }

      bulkTransitionMutation.mutate({ action, eligibleOrders, skippedOrders });
    })();
  };

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.supplierId,
        order.projectId ?? '',
        order.purchaseRequestId ?? '',
        order.status,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [orders, search]);

  const columns = useMemo<ColumnDef<PurchaseOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: '№ заказа',
        size: 170,
        cell: ({ row, getValue }) => (
          <button
            type="button"
            className="font-mono text-xs text-primary-700 hover:text-primary-800 hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/procurement/purchase-orders/${row.original.id}`);
            }}
          >
            {getValue<string>()}
          </button>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: 'Дата',
        size: 120,
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        accessorKey: 'supplierId',
        header: 'Поставщик',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{shortUuid(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'projectId',
        header: 'Проект',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{shortUuid(getValue<string>() || undefined)}</span>
        ),
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: 'План поставки',
        size: 140,
        cell: ({ getValue }) => formatDate((getValue<string | undefined>() ?? null)),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 170,
        cell: ({ getValue }) => {
          const status = getValue<PurchaseOrderStatus>();
          return (
            <StatusBadge
              status={status}
              colorMap={statusColorMap}
              label={statusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Сумма',
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Действия',
        size: 220,
        cell: ({ row }) => {
          const order = row.original;
          const actions = getAvailableActions(order.status);
          if (actions.length === 0) {
            return <span className="text-xs text-neutral-400">—</span>;
          }

          return (
            <div className="flex items-center gap-1.5">
              {actions.map((action) => {
                const isPending = transitionMutation.isPending && pendingOrderId === order.id;
                const isDisabled = isPending || bulkTransitionMutation.isPending;
                const icon =
                  action === 'send' ? <Send size={12} /> :
                    action === 'confirm' ? <CheckCircle2 size={12} /> :
                      action === 'close' ? <Lock size={12} /> :
                        <XCircle size={12} />;

                return (
                  <Button
                    key={`${order.id}-${action}`}
                    size="xs"
                    variant={action === 'cancel' ? 'danger' : 'secondary'}
                    iconLeft={icon}
                    loading={isPending}
                    disabled={bulkTransitionMutation.isPending}
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (isDisabled) {
                        return;
                      }

                      if (action === 'cancel') {
                        const isConfirmed = await confirm({
                          title: `Отменить заказ ${order.orderNumber}?`,
                          description: 'Статус будет изменён на "Отменён".',
                          confirmLabel: 'Отменить заказ',
                          cancelLabel: t('common.cancel'),
                          confirmVariant: 'danger',
                          items: [order.orderNumber],
                        });
                        if (!isConfirmed) {
                          return;
                        }
                      }

                      transitionMutation.mutate({ order, action });
                    }}
                  >
                    {actionLabelMap[action]}
                  </Button>
                );
              })}
            </div>
          );
        },
      },
    ],
    [bulkTransitionMutation, confirm, navigate, pendingOrderId, transitionMutation],
  );

  if (isError && orders.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Заказы поставщикам"
          subtitle="Purchase Orders"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: 'Заказы поставщикам' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить заказы поставщикам"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Заказы поставщикам"
        subtitle={`${orders.length} заказов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: t('procurement.title'), href: '/procurement' },
          { label: 'Заказы поставщикам' },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => navigate('/procurement/purchase-orders/new')}
            >
              Новый заказ
            </Button>
            <Button
              variant="secondary"
              iconLeft={<ShoppingCart size={16} />}
              onClick={() => navigate('/procurement')}
            >
              Заявки на закупку
            </Button>
          </div>
        )}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, проекту, поставщику..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          className="w-64"
          value={statusFilter}
          onChange={(event) => setStatusFilter((event.target.value as PurchaseOrderStatus) || '')}
          options={[
            { value: '', label: 'Все статусы' },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>

      <DataTable<PurchaseOrder>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={(order) => navigate(`/procurement/purchase-orders/${order.id}`)}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        enableSavedViews
        savedViewsKey="procurement-purchase-orders"
        bulkActions={[
          {
            label: 'Отправить',
            icon: <Send size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('send', rows);
            },
          },
          {
            label: 'Подтвердить',
            icon: <CheckCircle2 size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('confirm', rows);
            },
          },
          {
            label: 'Закрыть',
            icon: <Lock size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('close', rows);
            },
          },
          {
            label: 'Отменить',
            icon: <XCircle size={13} />,
            variant: 'danger',
            onClick: (rows) => {
              handleBulkActionRequest('cancel', rows);
            },
          },
        ]}
        pageSize={20}
        emptyTitle="Нет заказов поставщикам"
        emptyDescription="Заказы появятся после конвертации заявок на закупку"
      />
    </div>
  );
};

export default PurchaseOrderListPage;
