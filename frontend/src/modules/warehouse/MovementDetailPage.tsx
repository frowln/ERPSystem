import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/i18n';
import {
  ArrowRight,
  Package,
  MapPin,
  User,
  Calendar,
  Clock,
  Link2,
  Edit,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  stockMovementStatusColorMap,
  stockMovementStatusLabels,
  stockMovementTypeColorMap,
  stockMovementTypeLabels,
} from '@/design-system/components/StatusBadge';
import { formatNumber, formatDateLong } from '@/lib/format';
import toast from 'react-hot-toast';
import { warehouseApi } from '@/api/warehouse';
import type { MovementDetail } from '@/api/warehouse';

const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: t('warehouse.movementDetail.confirm'), target: 'CONFIRMED' }],
  confirmed: [{ label: t('warehouse.movementDetail.execute'), target: 'DONE' }],
};

const MovementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const { data: movement } = useQuery<MovementDetail>({
    queryKey: ['movement', id],
    queryFn: () => warehouseApi.getMovement(id!),
    enabled: !!id,
  });

  const mov = movement;
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? mov?.status ?? '';
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);

  const statusMutation = useMutation({
    mutationFn: (targetStatus: string) => warehouseApi.updateMovementStatus(id!, targetStatus),
    onSuccess: (_data, targetStatus) => {
      setStatusOverride(targetStatus);
      queryClient.invalidateQueries({ queryKey: ['movement', id] });
      toast.success(t('warehouse.movementDetail.toastStatusChanged', { status: stockMovementStatusLabels[targetStatus] ?? targetStatus }));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => warehouseApi.deleteMovement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success(t('warehouse.movementDetail.toastDeleted'));
      navigate('/warehouse/movements');
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleStatusChange = (targetStatus: string) => {
    statusMutation.mutate(targetStatus);
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('warehouse.movementDetail.confirmTitle'),
      description: t('warehouse.movementDetail.confirmDescription'),
      confirmLabel: t('warehouse.movementDetail.confirmButton'),
      cancelLabel: t('warehouse.movementDetail.confirmCancel'),
      items: [mov?.number ?? ''],
    });
    if (!isConfirmed) return;

    deleteMutation.mutate();
  };

  if (!mov) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={mov.number}
        subtitle={`${mov.projectName} / ${mov.materialName}`}
        backTo="/warehouse/movements"
        breadcrumbs={[
          { label: t('warehouse.movementDetail.breadcrumbHome'), href: '/' },
          { label: t('warehouse.movementDetail.breadcrumbMovements'), href: '/warehouse/movements' },
          { label: mov.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={stockMovementStatusColorMap} label={stockMovementStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {mov.type && <StatusBadge status={mov.type} colorMap={stockMovementTypeColorMap} label={stockMovementTypeLabels[mov.type] ?? mov.type} size="md" />}
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('warehouse.movementDetail.toastEditRedirect'));
                navigate('/warehouse/movements');
              }}
            >
              {t('warehouse.movementDetail.edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              {t('warehouse.movementDetail.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Transfer visualization */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{t('warehouse.movementDetail.sectionDirection')}</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <MapPin size={24} className="mx-auto text-danger-500 mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.movementDetail.labelFrom')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{mov.fromLocationName}</p>
              </div>
              <ArrowRight size={24} className="text-primary-400 flex-shrink-0" />
              <div className="flex-1 p-4 bg-primary-50 rounded-lg border border-primary-200 text-center">
                <MapPin size={24} className="mx-auto text-success-500 mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.movementDetail.labelTo')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{mov.toLocationName}</p>
              </div>
            </div>
          </div>

          {/* Material & Quantity */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary-500" />
              {t('warehouse.movementDetail.sectionMaterial')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.movementDetail.labelMaterial')}</p>
                <p className="text-sm font-medium text-primary-600 cursor-pointer hover:text-primary-700" onClick={() => navigate(`/warehouse/materials/${mov.materialId}`)}>
                  {mov.materialName}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{mov.materialSku}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.movementDetail.labelQuantity')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(mov.quantity)} {mov.unit}</p>
              </div>
            </div>
            {mov.note && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.movementDetail.labelNote')}</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{mov.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('warehouse.movementDetail.sectionDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('warehouse.movementDetail.labelDate')} value={formatDateLong(mov.date)} />
              <InfoItem icon={<User size={15} />} label={t('warehouse.movementDetail.labelResponsible')} value={mov.responsibleName} />
              <InfoItem icon={<User size={15} />} label={t('warehouse.movementDetail.labelApprovedBy')} value={mov.approvedByName ?? '---'} />
              <InfoItem icon={<Clock size={15} />} label={t('warehouse.movementDetail.labelCreated')} value={formatDateLong(mov.createdAt)} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('warehouse.movementDetail.sectionRelatedDocs')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/warehouse/materials/${mov.materialId}`)}>
                <Package size={15} className="text-neutral-400" />
                <span className="text-sm text-primary-600">{mov.materialName}</span>
              </div>
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

export default MovementDetailPage;
