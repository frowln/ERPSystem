import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, FileText, Lock, Search, Send, ShoppingCart, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { projectsApi } from '@/api/projects';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

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

type OrderAction = 'send' | 'confirm' | 'invoice' | 'cancel' | 'close';

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

const getActionBulkSuccessMap = (): Record<OrderAction, string> => ({
  send: t('procurement.orderAction.bulkSendSuccess'),
  confirm: t('procurement.orderAction.bulkConfirmSuccess'),
  invoice: t('procurement.orderAction.bulkInvoiceSuccess'),
  cancel: t('procurement.orderAction.bulkCancelSuccess'),
  close: t('procurement.orderAction.bulkCloseSuccess'),
});

const actionBulkMap: Record<OrderAction, PurchaseOrderBulkTransitionAction> = {
  send: 'SEND',
  confirm: 'CONFIRM',
  invoice: 'INVOICE',
  cancel: 'CANCEL',
  close: 'CLOSE',
};

const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}…` : '—');
const isUuidLike = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

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

type BulkTransitionVariables = {
  action: OrderAction;
  eligibleOrders: PurchaseOrder[];
  skippedOrders: PurchaseOrder[];
};

const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const initialPurchaseRequestFilter = searchParams.get('purchaseRequestId')?.trim() ?? '';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [purchaseRequestFilter, setPurchaseRequestFilter] = useState(initialPurchaseRequestFilter);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const normalizedPurchaseRequestFilter = purchaseRequestFilter.trim();
  const purchaseRequestFilterParam = isUuidLike(normalizedPurchaseRequestFilter)
    ? normalizedPurchaseRequestFilter
    : undefined;
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const next = new URLSearchParams(searchParamsString);
    if (purchaseRequestFilterParam) {
      next.set('purchaseRequestId', purchaseRequestFilterParam);
    } else {
      next.delete('purchaseRequestId');
    }
    if (next.toString() !== searchParamsString) {
      setSearchParams(next, { replace: true });
    }
  }, [purchaseRequestFilterParam, searchParamsString, setSearchParams]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: procurementApi.getSuppliers,
  });

  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'purchase-order-list'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 300, sort: 'name,asc' }),
  });
  const projects = projectsResponse?.content ?? [];

  const supplierOptions = useMemo(
    () => [{ value: '', label: t('procurement.orderList.allSuppliers') }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))],
    [suppliers],
  );
  const projectOptions = useMemo(
    () => [{ value: '', label: t('procurement.orderList.allProjects') }, ...projects.map((project) => ({ value: project.id, label: project.name }))],
    [projects],
  );
  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );
  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['purchase-orders', statusFilter, supplierFilter, projectFilter, purchaseRequestFilterParam, debouncedSearch],
    queryFn: () =>
      procurementApi.getPurchaseOrders({
        page: 0,
        size: 300,
        sort: 'createdAt,desc',
        status: statusFilter || undefined,
        supplierId: supplierFilter || undefined,
        projectId: projectFilter || undefined,
        purchaseRequestId: purchaseRequestFilterParam,
        search: debouncedSearch || undefined,
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
        case 'invoice':
          return procurementApi.invoicePurchaseOrder(order.id);
        case 'cancel':
          return procurementApi.cancelPurchaseOrder(order.id);
        case 'close':
          return procurementApi.closePurchaseOrder(order.id);
      }
      throw new Error(`Unsupported action: ${action}`);
    },
    onMutate: ({ order, action }) => {
      setPendingOrderId(order.id);
      toast.loading(`${getActionLabelMap()[action]}...`, { id: 'purchase-order-transition' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(getActionSuccessMap()[variables.action], { id: 'purchase-order-transition' });
    },
    onError: () => {
      toast.error(t('procurement.orderList.errorStatusUpdate'), { id: 'purchase-order-transition' });
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
      toast.loading(`${getActionLabelMap()[action]} (${t('procurement.orderList.bulk')})...`, { id: 'purchase-order-bulk-transition' });
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });

      const skippedCount = variables.skippedOrders.length;
      const successParts = [`${getActionBulkSuccessMap()[variables.action]}: ${response.successCount}`];
      if (skippedCount > 0) {
        successParts.push(`${t('procurement.orderList.skipped')}: ${skippedCount}`);
      }
      toast.success(successParts.join(', '), { id: 'purchase-order-bulk-transition' });

      if (response.failedCount > 0) {
        const orderNumberById = new Map(variables.eligibleOrders.map((order) => [order.id, order.orderNumber]));
        const details = response.errors
          .slice(0, 3)
          .map((error) => `${orderNumberById.get(error.orderId) ?? shortUuid(error.orderId)}: ${error.message}`)
          .join(' | ');
        const overflow = response.failedCount > 3 ? ` (+${response.failedCount - 3})` : '';
        toast.error(`${t('procurement.orderList.errors')}: ${response.failedCount}. ${details}${overflow}`, {
          id: 'purchase-order-bulk-transition-errors',
        });
      }
    },
    onError: () => {
      toast.error(t('procurement.orderList.errorBulkAction'), { id: 'purchase-order-bulk-transition' });
    },
  });

  const handleBulkActionRequest = (action: OrderAction, selectedRows: PurchaseOrder[]) => {
    if (bulkTransitionMutation.isPending || transitionMutation.isPending || selectedRows.length === 0) {
      return;
    }

    const eligibleOrders = selectedRows.filter((order) => getAvailableActions(order.status).includes(action));
    if (eligibleOrders.length === 0) {
      toast.error(`${t('procurement.orderList.errorNoEligible')} "${getActionLabelMap()[action]}"`);
      return;
    }

    const eligibleIds = new Set(eligibleOrders.map((order) => order.id));
    const skippedOrders = selectedRows.filter((order) => !eligibleIds.has(order.id));

    const dialogMeta = action === 'send'
      ? {
        title: t('procurement.orderList.bulkSendTitle'),
        description: t('procurement.orderList.bulkSendDescription'),
        confirmLabel: t('procurement.orderAction.send'),
      }
      : action === 'confirm'
        ? {
          title: t('procurement.orderList.bulkConfirmTitle'),
          description: t('procurement.orderList.bulkConfirmDescription'),
          confirmLabel: t('procurement.orderAction.confirm'),
        }
        : action === 'invoice'
          ? {
            title: t('procurement.orderList.bulkInvoiceTitle'),
            description: t('procurement.orderList.bulkInvoiceDescription'),
            confirmLabel: t('procurement.orderList.bulkInvoiceConfirmLabel'),
          }
        : action === 'close'
          ? {
            title: t('procurement.orderList.bulkCloseTitle'),
            description: t('procurement.orderList.bulkCloseDescription'),
            confirmLabel: t('procurement.orderAction.close'),
          }
          : {
            title: t('procurement.orderList.bulkCancelTitle'),
            description: t('procurement.orderList.bulkCancelDescription'),
            confirmLabel: t('procurement.orderAction.cancel'),
            confirmVariant: 'danger' as const,
          };

    const description = skippedOrders.length > 0
      ? `${dialogMeta.description} ${t('procurement.orderList.skippedIneligible')}: ${skippedOrders.length}.`
      : dialogMeta.description;

    void (async () => {
      const statusLbls = getStatusLabels();
      const isConfirmed = await confirm({
        title: `${dialogMeta.title} (${eligibleOrders.length} ${t('procurement.orderList.outOf')} ${selectedRows.length})`,
        description,
        confirmLabel: dialogMeta.confirmLabel,
        cancelLabel: t('common.cancel'),
        confirmVariant: dialogMeta.confirmVariant,
        items: eligibleOrders.slice(0, 5).map((order) => `${order.orderNumber} — ${statusLbls[order.status]}`),
      });
      if (!isConfirmed) {
        return;
      }

      bulkTransitionMutation.mutate({ action, eligibleOrders, skippedOrders });
    })();
  };

  const columns = useMemo<ColumnDef<PurchaseOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: t('procurement.orderList.colOrderNumber'),
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
        header: t('procurement.orderList.colDate'),
        size: 120,
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        accessorKey: 'supplierId',
        header: t('procurement.orderList.colSupplier'),
        size: 180,
        cell: ({ getValue }) => {
          const supplierId = getValue<string>();
          const supplierName = supplierNameById.get(supplierId);
          return (
            <div className="leading-tight">
              <p className="text-sm text-neutral-800 dark:text-neutral-100">{supplierName ?? shortUuid(supplierId)}</p>
              {supplierName && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{shortUuid(supplierId)}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'projectId',
        header: t('procurement.orderList.colProject'),
        size: 150,
        cell: ({ getValue }) => {
          const projectId = getValue<string>() || '';
          if (!projectId) {
            return <span className="text-sm text-neutral-500">—</span>;
          }
          const projectName = projectNameById.get(projectId);
          return (
            <div className="leading-tight">
              <p className="text-sm text-neutral-800 dark:text-neutral-100">{projectName ?? shortUuid(projectId)}</p>
              {projectName && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{shortUuid(projectId)}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: t('procurement.orderList.colDeliveryPlan'),
        size: 140,
        cell: ({ getValue }) => formatDate((getValue<string | undefined>() ?? null)),
      },
      {
        accessorKey: 'status',
        header: t('procurement.orderList.colStatus'),
        size: 170,
        cell: ({ getValue }) => {
          const status = getValue<PurchaseOrderStatus>();
          const statusLbls = getStatusLabels();
          return (
            <StatusBadge
              status={status}
              colorMap={statusColorMap}
              label={statusLbls[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.orderList.colAmount'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('procurement.orderList.colActions'),
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
                      action === 'invoice' ? <FileText size={12} /> :
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
                          title: `${t('procurement.orderList.confirmCancelTitle')} ${order.orderNumber}?`,
                          description: t('procurement.orderList.confirmCancelDescription'),
                          confirmLabel: t('procurement.orderList.confirmCancelLabel'),
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
                    {getActionLabelMap()[action]}
                  </Button>
                );
              })}
            </div>
          );
        },
      },
    ],
    [bulkTransitionMutation, confirm, navigate, pendingOrderId, projectNameById, supplierNameById, transitionMutation],
  );

  const hasActiveFilters = Boolean(
    search.trim()
    || statusFilter
    || supplierFilter
    || projectFilter
    || normalizedPurchaseRequestFilter,
  );

  if (isError && orders.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('procurement.orderList.title')}
          subtitle={t('procurement.orderList.subtitlePurchaseOrders')}
          breadcrumbs={[
            { label: t('procurement.orderList.breadcrumbHome'), href: '/' },
            { label: t('procurement.title'), href: '/procurement' },
            { label: t('procurement.orderList.title') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('procurement.orderList.errorLoadTitle')}
          description={t('procurement.orderList.errorLoadDescription')}
          actionLabel={t('common.refresh')}
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
        title={t('procurement.orderList.title')}
        subtitle={hasActiveFilters
          ? `${t('procurement.orderList.found')}: ${data?.totalElements ?? orders.length}`
          : `${data?.totalElements ?? orders.length} ${t('procurement.orderList.ordersSuffix')}`}
        breadcrumbs={[
          { label: t('procurement.orderList.breadcrumbHome'), href: '/' },
          { label: t('procurement.title'), href: '/procurement' },
          { label: t('procurement.orderList.title') },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => navigate('/procurement/purchase-orders/new')}
            >
              {t('procurement.orderList.newOrder')}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<ShoppingCart size={16} />}
              onClick={() => navigate('/procurement')}
            >
              {t('procurement.orderList.purchaseRequests')}
            </Button>
          </div>
        )}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('procurement.orderList.searchPlaceholder')}
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
            { value: '', label: t('procurement.orderList.allStatuses') },
            ...Object.entries(getStatusLabels()).map(([value, label]) => ({ value, label })),
          ]}
        />

        <Select
          className="w-72"
          value={supplierFilter}
          onChange={(event) => setSupplierFilter(event.target.value)}
          options={supplierOptions}
        />

        <Select
          className="w-72"
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          options={projectOptions}
        />

        <Input
          className="w-72"
          placeholder={t('procurement.orderList.placeholderRequestId')}
          value={purchaseRequestFilter}
          onChange={(event) => setPurchaseRequestFilter(event.target.value)}
        />

        {hasActiveFilters && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setStatusFilter('');
              setSupplierFilter('');
              setProjectFilter('');
              setPurchaseRequestFilter('');
            }}
          >
            {t('common.reset')}
          </Button>
        )}
      </div>

      {normalizedPurchaseRequestFilter && !purchaseRequestFilterParam && (
        <p className="text-xs text-danger-600 mb-4">
          {t('procurement.orderList.uuidFilterWarning')}
        </p>
      )}

      {purchaseRequestFilterParam && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <StatusBadge
            status="REQUEST_FILTER"
            colorMap={{ REQUEST_FILTER: 'blue' }}
            label={`${t('procurement.orderList.request')}: ${shortUuid(purchaseRequestFilterParam)}`}
          />
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => navigate(`/procurement/${purchaseRequestFilterParam}`)}
          >
            {t('procurement.orderList.openRequest')}
          </Button>
        </div>
      )}

      <DataTable<PurchaseOrder>
        data={orders}
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
            label: t('procurement.orderAction.send'),
            icon: <Send size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('send', rows);
            },
          },
          {
            label: t('procurement.orderAction.confirm'),
            icon: <CheckCircle2 size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('confirm', rows);
            },
          },
          {
            label: t('procurement.orderAction.invoice'),
            icon: <FileText size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('invoice', rows);
            },
          },
          {
            label: t('procurement.orderAction.close'),
            icon: <Lock size={13} />,
            onClick: (rows) => {
              handleBulkActionRequest('close', rows);
            },
          },
          {
            label: t('procurement.orderAction.cancel'),
            icon: <XCircle size={13} />,
            variant: 'danger',
            onClick: (rows) => {
              handleBulkActionRequest('cancel', rows);
            },
          },
        ]}
        pageSize={20}
        emptyTitle={hasActiveFilters ? t('procurement.orderList.emptySearchTitle') : t('procurement.orderList.emptyTitle')}
        emptyDescription={hasActiveFilters
          ? t('procurement.orderList.emptySearchDescription')
          : t('procurement.orderList.emptyDescription')}
      />
    </div>
  );
};

export default PurchaseOrderListPage;
