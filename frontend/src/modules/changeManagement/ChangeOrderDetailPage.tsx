import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  changeOrderStatusColorMap,
  changeOrderStatusLabels,
  changeOrderTypeColorMap,
  changeOrderTypeLabels,
} from '@/design-system/components/StatusBadge';
import { changeManagementApi } from '@/api/changeManagement';
import { formatDateLong, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ChangeOrder, ChangeOrderLineItem } from './types';
import toast from 'react-hot-toast';

const getStatusFlow = () => [
  { status: 'DRAFT', label: t('changeManagement.orderDetail.statusDraft') },
  { status: 'SUBMITTED', label: t('changeManagement.orderDetail.statusSubmitted') },
  { status: 'UNDER_REVIEW', label: t('changeManagement.orderDetail.statusUnderReview') },
  { status: 'APPROVED', label: t('changeManagement.orderDetail.statusApproved') },
  { status: 'EXECUTED', label: t('changeManagement.orderDetail.statusExecuted') },
];

const ChangeOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery<ChangeOrder>({
    queryKey: ['change-order', id],
    queryFn: () => changeManagementApi.getChangeOrder(id!),
    enabled: !!id,
  });

  const { data: lineItems } = useQuery<ChangeOrderLineItem[]>({
    queryKey: ['change-order-line-items', id],
    queryFn: () => changeManagementApi.getChangeOrderLineItems(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      changeManagementApi.createChangeOrder({ id: orderId, status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', id] });
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading || !order) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }

  const o = order;
  const items = lineItems ?? [];

  const statusActions = useMemo(() => {
    switch (o.status) {
      case 'DRAFT': return [{ label: t('changeManagement.orderDetail.actionSubmit'), targetStatus: 'SUBMITTED' }];
      case 'SUBMITTED': return [{ label: t('changeManagement.orderDetail.actionAcceptReview'), targetStatus: 'UNDER_REVIEW' }];
      case 'UNDER_REVIEW': return [
        { label: t('changeManagement.orderDetail.actionApprove'), targetStatus: 'APPROVED' },
        { label: t('changeManagement.orderDetail.actionReject'), targetStatus: 'REJECTED' },
      ];
      case 'APPROVED': return [{ label: t('changeManagement.orderDetail.actionMarkExecuted'), targetStatus: 'EXECUTED' }];
      default: return [];
    }
  }, [o.status]);

  const statusFlow = getStatusFlow();
  const currentStepIndex = statusFlow.findIndex((s) => s.status === o.status);
  const changePercent = o.originalContractAmount > 0
    ? ((o.amount / o.originalContractAmount) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={o.title}
        subtitle={`${o.number} / ${o.contractName ?? o.projectName}`}
        backTo="/change-management/orders"
        breadcrumbs={[
          { label: t('changeManagement.orderDetail.breadcrumbHome'), href: '/' },
          { label: t('changeManagement.orderDetail.breadcrumbChangeManagement'), href: '/change-management/orders' },
          { label: o.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={o.status}
              colorMap={changeOrderStatusColorMap}
              label={changeOrderStatusLabels[o.status] ?? o.status}
              size="md"
            />
            <StatusBadge
              status={o.type}
              colorMap={changeOrderTypeColorMap}
              label={changeOrderTypeLabels[o.type] ?? o.type}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                onClick={() => statusMutation.mutate({ orderId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Status flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center gap-2">
          {statusFlow.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={step.status}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  {step.label}
                </div>
                {idx < statusFlow.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contract impact */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.orderDetail.contractImpact')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('changeManagement.orderDetail.originalAmount')}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(o.originalContractAmount)}</p>
              </div>
              <div className={cn('p-4 rounded-lg', o.amount >= 0 ? 'bg-danger-50' : 'bg-success-50')}>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('changeManagement.orderDetail.changeAmount')} ({changePercent}%)</p>
                <p className={cn('text-lg font-bold tabular-nums', o.amount >= 0 ? 'text-danger-700' : 'text-success-700')}>
                  {o.amount >= 0 ? '+' : ''}{formatMoney(o.amount)}
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('changeManagement.orderDetail.revisedAmount')}</p>
                <p className="text-lg font-bold text-primary-700 tabular-nums">{formatMoney(o.revisedContractAmount)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('changeManagement.orderDetail.description')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {o.description ?? t('changeManagement.orderDetail.noDescription')}
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('changeManagement.orderDetail.lineItems')} ({items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thNumber')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thDescription')}</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thQuantity')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thUnit')}</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thPrice')}</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thAmount')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('changeManagement.orderDetail.thCode')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100">{item.description}</td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">{item.unitOfMeasure}</td>
                      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 text-right tabular-nums">{formatMoney(item.amount)}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">{item.costCode ?? '---'}</td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
                    <td colSpan={5} className="px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 text-right">{t('changeManagement.orderDetail.total')}:</td>
                    <td className="px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
                      {formatMoney(items.reduce((s, i) => s + i.amount, 0))}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.orderDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('changeManagement.orderDetail.submittedBy')} value={o.submittedByName} />
              <InfoItem icon={<User size={15} />} label={t('changeManagement.orderDetail.approvedBy')} value={o.approvedByName ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('changeManagement.orderDetail.created')} value={formatDateLong(o.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label={t('changeManagement.orderDetail.approvedDate')} value={formatDateLong(o.approvedDate)} />
              <InfoItem icon={<FileText size={15} />} label={t('changeManagement.orderDetail.contract')} value={o.contractName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('changeManagement.orderDetail.project')} value={o.projectName ?? '---'} />
              <InfoItem icon={<DollarSign size={15} />} label={t('changeManagement.orderDetail.amount')} value={formatMoney(o.amount)} />
              <InfoItem icon={<Clock size={15} />} label={t('changeManagement.orderDetail.scheduleImpact')} value={o.scheduleImpactDays > 0 ? `+${o.scheduleImpactDays} ${t('changeManagement.orderDetail.days')}` : t('changeManagement.orderDetail.noChange')} />
            </div>
          </div>

          {/* Linked change events */}
          {o.changeEventIds.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Link2 size={15} />
                {t('changeManagement.orderDetail.linkedEvents')}
              </h3>
              <div className="space-y-2">
                {o.changeEventIds.map((ceId) => (
                  <div
                    key={ceId}
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border border-neutral-100"
                    onClick={() => navigate(`/change-management/events/${ceId}`)}
                  >
                    <FileText size={15} className="text-primary-500" />
                    <span className="text-sm text-primary-600 font-medium">CE-{ceId.padStart(3, '0')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.orderDetail.actions')}</h3>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/change-orders/${id}/export?format=pdf`, '_blank')}>
                {t('changeManagement.orderDetail.exportPdf')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.print()}>
                {t('changeManagement.orderDetail.print')}
              </Button>
            </div>
          </div>
        </div>
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

export default ChangeOrderDetailPage;
