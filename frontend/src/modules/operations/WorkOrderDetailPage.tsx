import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  User,
  Calendar,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  workOrderStatusColorMap,
  workOrderStatusLabels,
  workOrderPriorityColorMap,
  workOrderPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { formatNumber, formatDateLong, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import { operationsApi } from '@/api/operations';
import type { WorkOrder, WorkOrderStatus } from './types';
import toast from 'react-hot-toast';

const getStatusActions = (): Record<string, { label: string; target: WorkOrderStatus }[]> => ({
  PLANNED: [{ label: t('operations.workOrderDetail.actionStart'), target: 'IN_PROGRESS' }],
  IN_PROGRESS: [
    { label: t('operations.workOrderDetail.actionComplete'), target: 'COMPLETED' },
    { label: t('operations.workOrderDetail.actionPause'), target: 'ON_HOLD' },
  ],
  ON_HOLD: [{ label: t('operations.workOrderDetail.actionResume'), target: 'IN_PROGRESS' }],
});

const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const { data: wo, isLoading } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => operationsApi.getWorkOrder(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (targetStatus: WorkOrderStatus) => operationsApi.changeWorkOrderStatus(id!, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      toast.success(t('operations.workOrderDetail.statusChanged', { status: '' }));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => operationsApi.deleteWorkOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success(t('operations.workOrderDetail.deleteSuccess'));
      navigate('/operations/work-orders');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const actions = useMemo(() => getStatusActions()[wo?.status ?? ''] ?? [], [wo?.status]);
  const hoursVariance = (wo?.estimatedHours ?? 0) - (wo?.actualHours ?? 0);

  const handleStatusChange = (targetStatus: WorkOrderStatus) => {
    statusMutation.mutate(targetStatus);
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('operations.workOrderDetail.deleteTitle'),
      description: t('operations.workOrderDetail.deleteDescription'),
      confirmLabel: t('operations.workOrderDetail.deleteConfirm'),
      cancelLabel: t('operations.workOrderDetail.deleteCancel'),
      items: [wo?.number ?? ''],
    });
    if (!isConfirmed) return;
    deleteMutation.mutate();
  };

  if (isLoading || !wo) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={wo.number}
        subtitle={`${wo.projectName ?? ''} / ${wo.title}`}
        backTo="/operations/work-orders"
        breadcrumbs={[
          { label: t('operations.workOrderDetail.breadcrumbHome'), href: '/' },
          { label: t('operations.workOrderDetail.breadcrumbWorkOrders'), href: '/operations/work-orders' },
          { label: wo.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={wo.status} colorMap={workOrderStatusColorMap} label={workOrderStatusLabels[wo.status] ?? wo.status} size="md" />
            {wo.priority && <StatusBadge status={wo.priority} colorMap={workOrderPriorityColorMap} label={workOrderPriorityLabels[wo.priority] ?? wo.priority} size="md" />}
            {actions.map((a) => (
              <Button key={a.target} variant={a.target === 'COMPLETED' ? 'success' : 'secondary'} size="sm" onClick={() => handleStatusChange(a.target)} loading={statusMutation.isPending}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => navigate(`/operations/work-orders/${id}/edit`)}
            >
              {t('operations.workOrderDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete} loading={deleteMutation.isPending}>{t('operations.workOrderDetail.delete')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <Wrench size={16} className="text-primary-500" />
              {t('operations.workOrderDetail.workDescription')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{wo.description}</p>
          </div>

          {/* Progress & Hours */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-500" />
              {t('operations.workOrderDetail.progressAndLabor')}
            </h3>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('operations.workOrderDetail.completion')}</span>
                <span className="text-sm font-bold text-primary-600">{formatPercent(wo.percentComplete)}</span>
              </div>
              <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${wo.percentComplete}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.workOrderDetail.plannedHours')}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{wo.estimatedHours}</p>
              </div>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700 text-center">
                <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">{t('operations.workOrderDetail.actualHours')}</p>
                <p className="text-xl font-bold text-primary-700 dark:text-primary-300">{wo.actualHours}</p>
              </div>
              <div className={`p-4 rounded-lg border text-center ${hoursVariance >= 0 ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700' : 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700'}`}>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.workOrderDetail.remaining')}</p>
                <p className={`text-xl font-bold ${hoursVariance >= 0 ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'}`}>{hoursVariance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.workOrderDetail.assignment')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('operations.workOrderDetail.responsible')} value={wo.assignedToName} />
              <InfoItem icon={<Building2 size={15} />} label={t('operations.workOrderDetail.location')} value={wo.workArea} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.workOrderDetail.dates')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('operations.workOrderDetail.plannedStart')} value={formatDateLong(wo.plannedStartDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('operations.workOrderDetail.plannedEnd')} value={formatDateLong(wo.plannedEndDate)} />
              <InfoItem icon={<Clock size={15} />} label={t('operations.workOrderDetail.actualStart')} value={wo.actualStartDate ? formatDateLong(wo.actualStartDate) : '---'} />
              <InfoItem icon={<Clock size={15} />} label={t('operations.workOrderDetail.actualEnd')} value={wo.actualEndDate ? formatDateLong(wo.actualEndDate) : '---'} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.workOrderDetail.creation')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('operations.workOrderDetail.createdBy')} value={wo.createdByName} />
              <InfoItem icon={<Calendar size={15} />} label={t('operations.workOrderDetail.created')} value={formatDateLong(wo.createdAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default WorkOrderDetailPage;
