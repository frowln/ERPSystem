import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  MapPin,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Edit,
  Trash2,
  Tag,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  materialCategoryColorMap,
  materialCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { formatNumber, formatMoney, formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { warehouseApi } from '@/api/warehouse';
import type { MaterialDetail, StockByLocation, RecentMovement } from '@/api/warehouse';

const getMovementTypeLabels = (): Record<string, string> => ({
  receipt: t('warehouse.materialDetail.movementTypeReceipt'),
  issue: t('warehouse.materialDetail.movementTypeIssue'),
  transfer: t('warehouse.materialDetail.movementTypeTransfer'),
});

const movementTypeColors: Record<string, string> = {
  receipt: 'text-success-600',
  issue: 'text-danger-600',
  transfer: 'text-primary-600',
};

const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const { data: material, isLoading } = useQuery({
    queryKey: ['MATERIAL', id],
    queryFn: () => warehouseApi.getMaterial(id!),
    enabled: !!id,
  });

  const { data: stockByLocation = [] } = useQuery({
    queryKey: ['MATERIAL_STOCK', id],
    queryFn: () => warehouseApi.getMaterialStock(id!),
    enabled: !!id,
  });

  const { data: recentMovements = [] } = useQuery({
    queryKey: ['MATERIAL_MOVEMENTS', id],
    queryFn: () => warehouseApi.getMaterialMovements(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => warehouseApi.deleteMaterial(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['MATERIALS'] });
      toast.success(t('warehouse.materialDetail.toastDeleted'));
      navigate('/warehouse/materials');
    },
  });

  const m = material;
  const needsReorder = (m?.totalStock ?? 0) <= (m?.minStock ?? 0);

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('warehouse.materialDetail.confirmTitle'),
      description: t('warehouse.materialDetail.confirmDescription'),
      confirmLabel: t('warehouse.materialDetail.confirmButton'),
      cancelLabel: t('warehouse.materialDetail.confirmCancel'),
      items: [m?.name ?? ''],
    });
    if (!isConfirmed) return;

    deleteMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={m?.name ?? ''}
        subtitle={`${m?.sku ?? ''} / ${m?.projectName ?? ''}`}
        backTo="/warehouse/materials"
        breadcrumbs={[
          { label: t('warehouse.materialDetail.breadcrumbHome'), href: '/' },
          { label: t('warehouse.materialDetail.breadcrumbMaterials'), href: '/warehouse/materials' },
          { label: m?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {m?.category && <StatusBadge status={m.category} colorMap={materialCategoryColorMap} label={materialCategoryLabels[m.category] ?? m.category} size="md" />}
            {needsReorder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-full bg-danger-50 text-danger-700">
                <AlertTriangle size={14} />
                {t('warehouse.materialDetail.needsReorder')}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('warehouse.materialDetail.toastEditRedirect'));
                navigate('/warehouse/materials');
              }}
            >
              {t('warehouse.materialDetail.editButton')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              {t('warehouse.materialDetail.deleteButton')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary-500" />
              {t('warehouse.materialDetail.sectionInfo')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelTotalStock')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(m?.totalStock ?? 0)} {m?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelMinStock')}</p>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatNumber(m?.minStock ?? 0)} {m?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelMaxStock')}</p>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatNumber(m?.maxStock ?? 0)} {m?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelAvgPrice')}</p>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatMoney(m?.avgPrice ?? 0)}/{m?.unit}</p>
              </div>
            </div>
          </div>

          {/* Stock by location */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-primary-500" />
              {t('warehouse.materialDetail.sectionStockByLocation')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('warehouse.materialDetail.tableWarehouse')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('warehouse.materialDetail.tableTotal')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('warehouse.materialDetail.tableReserved')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('warehouse.materialDetail.tableAvailable')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockByLocation.map((loc) => (
                    <tr key={loc.locationId} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">{loc.locationName}</td>
                      <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300">{formatNumber(loc.quantity)} {m?.unit}</td>
                      <td className="py-3 px-4 text-right text-warning-600">{formatNumber(loc.reserved)} {m?.unit}</td>
                      <td className="py-3 pl-4 text-right font-medium text-success-600">{formatNumber(loc.available)} {m?.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent movements */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <ArrowUpDown size={16} className="text-primary-500" />
              {t('warehouse.materialDetail.sectionRecentMovements')}
            </h3>
            <div className="space-y-3">
              {recentMovements.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/warehouse/movements/${mov.id}`)}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${movementTypeColors[mov.type]}`}>{getMovementTypeLabels()[mov.type]}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{mov.fromLocation} &rarr; {mov.toLocation}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(mov.quantity)} {m?.unit}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(mov.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('warehouse.materialDetail.sectionDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Tag size={15} />} label={t('warehouse.materialDetail.infoSku')} value={m?.sku ?? ''} />
              <InfoItem icon={<Package size={15} />} label={t('warehouse.materialDetail.infoUnit')} value={m?.unit ?? ''} />
              <InfoItem icon={<Calendar size={15} />} label={t('warehouse.materialDetail.infoLastReceipt')} value={formatDate(m?.lastReceiptDate ?? '')} />
              <InfoItem icon={<Calendar size={15} />} label={t('warehouse.materialDetail.infoCreatedAt')} value={formatDate(m?.createdAt ?? '')} />
            </div>
          </div>

          {/* Reorder info */}
          <div className={`rounded-xl border p-6 ${needsReorder ? 'bg-danger-50 border-danger-200' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'}`}>
            <h3 className={`text-sm font-semibold mb-4 ${needsReorder ? 'text-danger-800' : 'text-neutral-900 dark:text-neutral-100'}`}>{t('warehouse.materialDetail.sectionOrderInfo')}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelCurrentStock')}</p>
                <p className={`text-lg font-bold ${needsReorder ? 'text-danger-700' : 'text-neutral-900 dark:text-neutral-100'}`}>{formatNumber(m?.totalStock ?? 0)} {m?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('warehouse.materialDetail.labelReorderPoint')}</p>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{formatNumber(m?.minStock ?? 0)} {m?.unit}</p>
              </div>
              {needsReorder && (
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    toast.success(t('warehouse.materialDetail.toastProcurementOpened'));
                    navigate('/procurement/requests/new');
                  }}
                >
                  {t('warehouse.materialDetail.createProcurementRequest')}
                </Button>
              )}
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

export default MaterialDetailPage;
