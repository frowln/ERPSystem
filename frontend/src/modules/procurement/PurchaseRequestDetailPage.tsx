import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Wallet,
  Layers,
  AlertTriangle,
  Calendar,
  User,
  FolderKanban,
  FileText,
  CheckCircle2,
  Send,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  purchaseRequestStatusColorMap,
  purchaseRequestStatusLabels,
  purchaseRequestPriorityColorMap,
  purchaseRequestPriorityLabels,
} from '@/design-system/components/StatusBadge';
import {
  procurementApi,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '@/api/procurement';
import { formatDate, formatMoney, formatMoneyCompact, formatDateLong } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import type { PurchaseRequest, PurchaseRequestStatus } from '@/types';
import toast from 'react-hot-toast';
import { financeApi } from '@/api/finance';

const getPurchaseOrderStatusLabels = (): Record<PurchaseOrderStatus, string> => ({
  DRAFT: t('procurement.orderStatus.draft'),
  SENT: t('procurement.orderStatus.sent'),
  CONFIRMED: t('procurement.orderStatus.confirmed'),
  PARTIALLY_DELIVERED: t('procurement.orderStatus.partiallyDelivered'),
  DELIVERED: t('procurement.orderStatus.delivered'),
  INVOICED: t('procurement.orderStatus.invoiced'),
  CLOSED: t('procurement.orderStatus.closed'),
  CANCELLED: t('procurement.orderStatus.cancelled'),
});

const purchaseOrderStatusColorMap: Record<PurchaseOrderStatus, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  CONFIRMED: 'cyan',
  PARTIALLY_DELIVERED: 'yellow',
  DELIVERED: 'green',
  INVOICED: 'purple',
  CLOSED: 'gray',
  CANCELLED: 'red',
};

const shortUuid = (value?: string) => (value ? `${value.slice(0, 8)}…` : '—');

const PurchaseRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [pendingStatus, setPendingStatus] = useState<PurchaseRequestStatus | null>(null);

  const { data: request } = useQuery<PurchaseRequest>({
    queryKey: ['purchase-request', id],
    queryFn: () => procurementApi.getPurchaseRequest(id!),
    enabled: !!id,
  });
  const {
    data: relatedOrdersResponse,
    isLoading: isRelatedOrdersLoading,
  } = useQuery({
    queryKey: ['purchase-orders', 'purchase-request', request?.id],
    queryFn: () => procurementApi.getPurchaseOrders({
      page: 0,
      size: 50,
      sort: 'createdAt,desc',
      purchaseRequestId: request?.id,
    }),
    enabled: !!request?.id,
  });

  const r = request;
  const items = r?.items ?? [];
  const relatedOrders = relatedOrdersResponse?.content ?? [];

  if (!r) return null;

  const canCreatePurchaseOrder = ['APPROVED', 'ASSIGNED', 'ORDERED'].includes(r.status);
  const transitionMutation = useMutation({
    mutationFn: async ({ current, targetStatus }: { current: PurchaseRequest; targetStatus: PurchaseRequestStatus }) => {
      switch (targetStatus) {
        case 'SUBMITTED':
          return procurementApi.submitPurchaseRequest(current.id);
        case 'APPROVED':
          return procurementApi.approvePurchaseRequestStatus(current.id);
        case 'REJECTED':
          return procurementApi.rejectPurchaseRequest(current.id, t('procurement.requestDetail.rejectionReason'));
        case 'ASSIGNED': {
          const assignedToId = current.assignedToId ?? current.requestedById ?? currentUserId;
          if (!assignedToId) {
            throw new Error(t('procurement.requestDetail.errorNoAssignee'));
          }
          return procurementApi.assignPurchaseRequest(current.id, assignedToId);
        }
        case 'ORDERED':
          return procurementApi.markPurchaseRequestOrdered(current.id);
        case 'DELIVERED':
          return procurementApi.markPurchaseRequestDelivered(current.id);
        case 'CLOSED':
          return procurementApi.closePurchaseRequest(current.id);
        case 'CANCELLED':
          return procurementApi.cancelPurchaseRequest(current.id);
        default:
          throw new Error(`Unsupported status transition: ${targetStatus}`);
      }
    },
    onMutate: ({ targetStatus }) => {
      setPendingStatus(targetStatus);
      toast.loading(t('procurement.requestDetail.toastUpdatingStatus'), { id: 'purchase-request-status-transition' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-request', variables.current.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', 'purchase-request', variables.current.id] });
      toast.success(
        `${t('procurement.requestDetail.toastStatusChanged')}: ${purchaseRequestStatusLabels[variables.targetStatus] ?? variables.targetStatus}`,
        { id: 'purchase-request-status-transition' },
      );
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t('procurement.requestDetail.errorStatusUpdateFailed');
      toast.error(message, { id: 'purchase-request-status-transition' });
    },
    onSettled: () => {
      setPendingStatus(null);
    },
  });

  const createClMutation = useMutation({
    mutationFn: () => financeApi.createCompetitiveListFromPR(id!),
    onSuccess: (res) => {
      toast.success('Тендер (Конкурентный лист) создан');
      navigate(`/specifications/${res.specificationId}/competitive-list/${res.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка создания тендера');
    },
  });

  const statusActions = useMemo<Array<{ label: string; icon: React.ReactNode; targetStatus: PurchaseRequestStatus }>>(() => {
    switch (r.status) {
      case 'DRAFT': return [{ label: t('procurement.requestDetail.actionSubmit'), icon: <Send size={14} />, targetStatus: 'SUBMITTED' }];
      case 'SUBMITTED': return [
        { label: t('procurement.requestDetail.actionApprove'), icon: <CheckCircle2 size={14} />, targetStatus: 'APPROVED' },
        { label: t('procurement.requestDetail.actionReject'), icon: <AlertTriangle size={14} />, targetStatus: 'REJECTED' },
      ];
      case 'IN_APPROVAL': return [
        { label: t('procurement.requestDetail.actionApprove'), icon: <CheckCircle2 size={14} />, targetStatus: 'APPROVED' },
      ];
      case 'APPROVED': return [
        { label: t('procurement.requestDetail.actionAssign'), icon: <UserCheck size={14} />, targetStatus: 'ASSIGNED' },
      ];
      case 'ASSIGNED': return [
        { label: t('procurement.requestDetail.actionOrdered'), icon: <CheckCircle2 size={14} />, targetStatus: 'ORDERED' },
      ];
      case 'ORDERED': return [
        { label: t('procurement.requestDetail.actionDelivered'), icon: <CheckCircle2 size={14} />, targetStatus: 'DELIVERED' },
      ];
      default: return [];
    }
  }, [r.status]);

  const handleStatusChange = async (targetStatus: PurchaseRequestStatus) => {
    if (transitionMutation.isPending) {
      return;
    }

    if (targetStatus === 'REJECTED') {
      const isConfirmed = await confirm({
        title: `${t('procurement.requestDetail.confirmRejectTitle')} ${r.name}?`,
        description: t('procurement.requestDetail.confirmRejectDescription'),
        confirmLabel: t('common.reject'),
        cancelLabel: t('common.cancel'),
        confirmVariant: 'danger',
        items: [r.name],
      });
      if (!isConfirmed) {
        return;
      }
    }

    transitionMutation.mutate({ current: r, targetStatus });
  };

  const columns = useMemo<ColumnDef<NonNullable<PurchaseRequest['items']>[number], unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('procurement.requestDetail.colName'),
        size: 320,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('procurement.requestDetail.colQuantity'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {new Intl.NumberFormat('ru-RU').format(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'unitOfMeasure',
        header: t('procurement.requestDetail.colUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: t('procurement.requestDetail.colPrice'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('procurement.requestDetail.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  const relatedOrderColumns = useMemo<ColumnDef<PurchaseOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: t('procurement.requestDetail.relatedColOrderNumber'),
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
        header: t('procurement.requestDetail.relatedColDate'),
        size: 120,
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        accessorKey: 'status',
        header: t('procurement.requestDetail.relatedColStatus'),
        size: 170,
        cell: ({ getValue }) => {
          const status = getValue<PurchaseOrderStatus>();
          const poStatusLabels = getPurchaseOrderStatusLabels();
          return (
            <StatusBadge
              status={status}
              colorMap={purchaseOrderStatusColorMap}
              label={poStatusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'supplierId',
        header: t('procurement.requestDetail.relatedColSupplier'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{shortUuid(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.requestDetail.relatedColAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={r.name}
        subtitle={`${r.projectName ?? ''} / ${t('procurement.requestDetail.dateLabel')}: ${formatDateLong(r.requestDate)}`}
        backTo="/procurement"
        breadcrumbs={[
          { label: t('procurement.requestDetail.breadcrumbHome'), href: '/' },
          { label: t('procurement.requestDetail.breadcrumbPurchaseRequests'), href: '/procurement' },
          { label: r.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={r.status}
              colorMap={purchaseRequestStatusColorMap}
              label={purchaseRequestStatusLabels[r.status] ?? r.status}
              size="md"
            />
            <StatusBadge
              status={r.priority}
              colorMap={purchaseRequestPriorityColorMap}
              label={purchaseRequestPriorityLabels[r.priority] ?? r.priority}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                iconLeft={action.icon}
                loading={transitionMutation.isPending && pendingStatus === action.targetStatus}
                disabled={transitionMutation.isPending}
                onClick={() => {
                  void handleStatusChange(action.targetStatus);
                }}
              >
                {action.label}
              </Button>
            ))}
            {r.status === 'APPROVED' && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<FileText size={14} />}
                loading={createClMutation.isPending}
                onClick={() => createClMutation.mutate()}
              >
                Создать тендер (КЛ)
              </Button>
            )}
            {canCreatePurchaseOrder && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<ShoppingCart size={14} />}
                onClick={() => {
                  const params = new URLSearchParams({ purchaseRequestId: r.id });
                  if (r.projectId) {
                    params.set('projectId', r.projectId);
                  }
                  if (r.name) {
                    params.set('sourceRequestName', r.name);
                  }
                  navigate(`/procurement/purchase-orders/new?${params.toString()}`);
                }}
              >
                {t('procurement.requestDetail.createPurchaseOrder')}
              </Button>
            )}
          </div>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('procurement.requestDetail.metricAmount')}
          value={formatMoneyCompact(r.totalAmount)}
        />
        <MetricCard
          icon={<Layers size={18} />}
          label={t('procurement.requestDetail.metricItems')}
          value={String(r.itemCount ?? items.length)}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('procurement.requestDetail.metricPriority')}
          value={purchaseRequestPriorityLabels[r.priority] ?? r.priority}
        />
      </div>

      {/* Info section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('procurement.requestDetail.infoTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
          <InfoItem icon={<FolderKanban size={15} />} label={t('procurement.requestDetail.infoProject')} value={r.projectName ?? '---'} />
          <InfoItem icon={<User size={15} />} label={t('procurement.requestDetail.infoRequestedBy')} value={r.requestedByName} />
          <InfoItem icon={<UserCheck size={15} />} label={t('procurement.requestDetail.infoAssignedTo')} value={r.assignedToName ?? t('procurement.requestDetail.notAssigned')} />
          <InfoItem icon={<Calendar size={15} />} label={t('procurement.requestDetail.infoRequestDate')} value={formatDateLong(r.requestDate)} />
          <InfoItem icon={<FileText size={15} />} label={t('procurement.requestDetail.infoStatus')} value={purchaseRequestStatusLabels[r.status] ?? r.status} />
          <InfoItem icon={<AlertTriangle size={15} />} label={t('procurement.requestDetail.infoPriority')} value={purchaseRequestPriorityLabels[r.priority] ?? r.priority} />
        </div>
      </div>

      {/* Items table */}
      <DataTable<NonNullable<PurchaseRequest['items']>[number]>
        data={items}
        columns={columns}
        enableExport
        pageSize={20}
        emptyTitle={t('procurement.requestDetail.emptyTitle')}
        emptyDescription={t('procurement.requestDetail.emptyDescription')}
      />

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('procurement.requestDetail.relatedOrdersTitle')}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/procurement/purchase-orders?purchaseRequestId=${r.id}`)}
            >
              {t('procurement.requestDetail.openOrdersList')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<ShoppingCart size={14} />}
              onClick={() => {
                const params = new URLSearchParams({ purchaseRequestId: r.id });
                if (r.projectId) {
                  params.set('projectId', r.projectId);
                }
                if (r.name) {
                  params.set('sourceRequestName', r.name);
                }
                navigate(`/procurement/purchase-orders/new?${params.toString()}`);
              }}
            >
              {t('procurement.requestDetail.newOrderFromRequest')}
            </Button>
          </div>
        </div>
        <DataTable<PurchaseOrder>
          data={relatedOrders}
          columns={relatedOrderColumns}
          loading={isRelatedOrdersLoading}
          onRowClick={(orderItem) => navigate(`/procurement/purchase-orders/${orderItem.id}`)}
          pageSize={10}
          emptyTitle={t('procurement.requestDetail.relatedOrdersEmptyTitle')}
          emptyDescription={t('procurement.requestDetail.relatedOrdersEmptyDescription')}
        />
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default PurchaseRequestDetailPage;
