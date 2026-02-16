import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  User,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  Edit,
  Trash2,
  Link2,
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
import toast from 'react-hot-toast';

interface MaterialUsage {
  id: string;
  materialName: string;
  planned: number;
  actual: number;
  unit: string;
}

interface WorkOrder {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectName: string;
  location: string;
  assignedToName: string;
  crewName: string;
  crewSize: number;
  estimatedHours: number;
  actualHours: number;
  progressPercent: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

const demoWorkOrder: WorkOrder = {
  id: '1',
  number: 'WO-2026-0078',
  title: 'Монтаж арматурного каркаса секции 3',
  description: 'Выполнить монтаж арматурного каркаса с соблюдением проектных отметок и контрольными замерами.',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  projectName: 'ЖК "Солнечный"',
  location: 'Секция 3, этаж 4',
  assignedToName: 'Сидоров М.Н.',
  crewName: 'Бригада N4',
  crewSize: 8,
  estimatedHours: 72,
  actualHours: 46,
  progressPercent: 64,
  plannedStartDate: '2026-02-10',
  plannedEndDate: '2026-02-18',
  actualStartDate: '2026-02-10',
  actualEndDate: null,
  createdByName: 'Иванов А.С.',
  createdAt: '2026-02-09',
  updatedAt: '2026-02-14',
};

const demoMaterials: MaterialUsage[] = [
  { id: 'mat-1', materialName: 'Арматура A500C d16', planned: 1200, actual: 760, unit: 'кг' },
  { id: 'mat-2', materialName: 'Проволока вязальная', planned: 60, actual: 38, unit: 'кг' },
  { id: 'mat-3', materialName: 'Фиксаторы защитного слоя', planned: 480, actual: 310, unit: 'шт' },
];

const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  planned: [{ label: t('operations.workOrderDetail.actionStart'), target: 'IN_PROGRESS' }],
  in_progress: [
    { label: t('operations.workOrderDetail.actionComplete'), target: 'COMPLETED' },
    { label: t('operations.workOrderDetail.actionPause'), target: 'ON_HOLD' },
  ],
  on_hold: [{ label: t('operations.workOrderDetail.actionResume'), target: 'IN_PROGRESS' }],
});

const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: workOrder } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => Promise.resolve(demoWorkOrder),
    enabled: !!id,
    placeholderData: demoWorkOrder,
  });

  const wo = workOrder ?? demoWorkOrder;
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? wo.status;
  const actions = useMemo(() => getStatusActions()[effectiveStatus] ?? [], [effectiveStatus]);
  const hoursVariance = wo.estimatedHours - wo.actualHours;

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(t('operations.workOrderDetail.statusChanged', { status: workOrderStatusLabels[targetStatus] ?? targetStatus }));
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('operations.workOrderDetail.deleteTitle'),
      description: t('operations.workOrderDetail.deleteDescription'),
      confirmLabel: t('operations.workOrderDetail.deleteConfirm'),
      cancelLabel: t('operations.workOrderDetail.deleteCancel'),
      items: [wo?.number ?? ''],
    });
    if (!isConfirmed) {
      return;
    }
    toast.success(t('operations.workOrderDetail.deleteSuccess'));
    navigate('/operations/work-orders');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={wo.number}
        subtitle={`${wo.projectName} / ${wo.title}`}
        backTo="/operations/work-orders"
        breadcrumbs={[
          { label: t('operations.workOrderDetail.breadcrumbHome'), href: '/' },
          { label: t('operations.workOrderDetail.breadcrumbWorkOrders'), href: '/operations/work-orders' },
          { label: wo.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={workOrderStatusColorMap} label={workOrderStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {wo.priority && <StatusBadge status={wo.priority} colorMap={workOrderPriorityColorMap} label={workOrderPriorityLabels[wo.priority] ?? wo.priority} size="md" />}
            {actions.map((a) => (
              <Button key={a.target} variant={a.target === 'COMPLETED' ? 'success' : 'secondary'} size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('operations.workOrderDetail.editAvailableInForm'));
                navigate('/operations/work-orders/new');
              }}
            >
              {t('operations.workOrderDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>{t('operations.workOrderDetail.delete')}</Button>
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
                <span className="text-sm font-bold text-primary-600">{formatPercent(wo.progressPercent)}</span>
              </div>
              <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${wo.progressPercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.workOrderDetail.plannedHours')}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{wo.estimatedHours}</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 text-center">
                <p className="text-xs text-primary-600 mb-1">{t('operations.workOrderDetail.actualHours')}</p>
                <p className="text-xl font-bold text-primary-700">{wo.actualHours}</p>
              </div>
              <div className={`p-4 rounded-lg border text-center ${hoursVariance >= 0 ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.workOrderDetail.remaining')}</p>
                <p className={`text-xl font-bold ${hoursVariance >= 0 ? 'text-success-700' : 'text-danger-700'}`}>{hoursVariance}</p>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary-500" />
              {t('operations.workOrderDetail.materials', { count: demoMaterials.length })}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.workOrderDetail.material')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.workOrderDetail.planned')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.workOrderDetail.actual')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.workOrderDetail.remainingMaterial')}</th>
                  </tr>
                </thead>
                <tbody>
                  {demoMaterials.map((mat) => (
                    <tr key={mat.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">{mat.materialName}</td>
                      <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300">{formatNumber(mat.planned)} {mat.unit}</td>
                      <td className="py-3 px-4 text-right text-primary-600">{formatNumber(mat.actual)} {mat.unit}</td>
                      <td className="py-3 pl-4 text-right font-medium text-success-600">{formatNumber(mat.planned - mat.actual)} {mat.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.workOrderDetail.assignment')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('operations.workOrderDetail.responsible')} value={wo.assignedToName} />
              <InfoItem icon={<User size={15} />} label={t('operations.workOrderDetail.crew')} value={wo.crewName} />
              <InfoItem icon={<User size={15} />} label={t('operations.workOrderDetail.crewSize')} value={`${wo.crewSize} ${t('operations.workOrderDetail.personAbbr')}`} />
              <InfoItem icon={<Building2 size={15} />} label={t('operations.workOrderDetail.location')} value={wo.location} />
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
