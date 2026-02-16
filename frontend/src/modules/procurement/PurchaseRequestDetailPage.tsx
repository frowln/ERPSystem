import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  purchaseRequestStatusColorMap,
  purchaseRequestStatusLabels,
  purchaseRequestPriorityColorMap,
  purchaseRequestPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { procurementApi } from '@/api/procurement';
import { formatMoney, formatMoneyCompact, formatDateLong } from '@/lib/format';
import { t } from '@/i18n';
import type { PurchaseRequest } from '@/types';
import toast from 'react-hot-toast';

interface PurchaseRequestItem {
  id: string;
  name: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  amount: number;
}

const PurchaseRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request } = useQuery<PurchaseRequest>({
    queryKey: ['purchase-request', id],
    queryFn: () => procurementApi.getPurchaseRequest(id!),
    enabled: !!id,
  });

  const r = request;
  const [statusOverride, setStatusOverride] = useState<PurchaseRequest['status'] | null>(null);
  const items: PurchaseRequestItem[] = (r as any)?.items ?? [];

  if (!r) return null;

  const effectiveStatus = statusOverride ?? r.status;

  const statusActions = useMemo<Array<{ label: string; icon: React.ReactNode; targetStatus: PurchaseRequest['status'] }>>(() => {
    switch (effectiveStatus) {
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
  }, [effectiveStatus]);

  const handleStatusChange = (targetStatus: PurchaseRequest['status']) => {
    setStatusOverride(targetStatus);
    toast.success(`${t('procurement.requestDetail.toastStatusChanged')}: ${purchaseRequestStatusLabels[targetStatus] ?? targetStatus}`);
  };

  const columns = useMemo<ColumnDef<PurchaseRequestItem, unknown>[]>(
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
              status={effectiveStatus}
              colorMap={purchaseRequestStatusColorMap}
              label={purchaseRequestStatusLabels[effectiveStatus] ?? effectiveStatus}
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
                onClick={() => handleStatusChange(action.targetStatus)}
              >
                {action.label}
              </Button>
            ))}
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
          value={String(r.itemCount)}
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
          <InfoItem icon={<FileText size={15} />} label={t('procurement.requestDetail.infoStatus')} value={purchaseRequestStatusLabels[effectiveStatus] ?? effectiveStatus} />
          <InfoItem icon={<AlertTriangle size={15} />} label={t('procurement.requestDetail.infoPriority')} value={purchaseRequestPriorityLabels[r.priority] ?? r.priority} />
        </div>
      </div>

      {/* Items table */}
      <DataTable<PurchaseRequestItem>
        data={items}
        columns={columns}
        enableExport
        pageSize={20}
        emptyTitle={t('procurement.requestDetail.emptyTitle')}
        emptyDescription={t('procurement.requestDetail.emptyDescription')}
      />
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
