import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Users, Truck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MobilizationSchedule, MobilizationLine } from '@/modules/finance/types';

export default function MobilizationSchedulePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'personnel' | 'equipment'>('personnel');

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['mobilization', projectId],
    queryFn: () => financeApi.getMobilizationSchedules(projectId!),
    enabled: !!projectId,
  });

  const schedule = schedules[0];

  const { data: lines = [] } = useQuery({
    queryKey: ['mobilization-lines', schedule?.id],
    queryFn: () => financeApi.getMobilizationLines(schedule!.id),
    enabled: !!schedule?.id,
  });

  const generateMutation = useMutation({
    mutationFn: () => financeApi.generateMobilization(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobilization', projectId] });
      toast.success(t('planning.mobilization.generateSuccess'));
    },
  });

  const filtered = lines.filter((l) =>
    activeTab === 'personnel' ? l.resourceType === 'PERSONNEL' : l.resourceType === 'EQUIPMENT'
  );

  const fmtCurrency = (v?: number) => v != null ? v.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }) : '—';

  const columns = [
    { key: 'resourceName', header: t('planning.mobilization.colName'), render: (r: MobilizationLine) => r.resourceName },
    { key: 'quantity', header: t('common.quantity'), render: (r: MobilizationLine) => r.quantity },
    { key: 'rate', header: t('planning.mobilization.colRate'), render: (r: MobilizationLine) => fmtCurrency(r.rate) },
    { key: 'rateUnit', header: t('planning.mobilization.colRateUnit'), render: (r: MobilizationLine) => r.rateUnit },
    { key: 'startDate', header: t('common.startDate'), render: (r: MobilizationLine) => r.startDate || '—' },
    { key: 'endDate', header: t('common.endDate'), render: (r: MobilizationLine) => r.endDate || '—' },
    { key: 'totalCost', header: t('planning.mobilization.colTotal'), render: (r: MobilizationLine) => fmtCurrency(r.totalCost) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('planning.mobilization.title')}
        actions={
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            {t('planning.mobilization.generate')}
          </button>
        }
      />

      {schedule && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-sm text-neutral-500">{t('planning.mobilization.totalPersonnel')}</div>
            <div className="text-xl font-bold">{fmtCurrency(schedule.totalPersonnelCost)}</div>
          </div>
          <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <div className="text-sm text-neutral-500">{t('planning.mobilization.totalEquipment')}</div>
            <div className="text-xl font-bold">{fmtCurrency(schedule.totalEquipmentCost)}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setActiveTab('personnel')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'personnel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          {t('planning.mobilization.tabPersonnel')}
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'equipment' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          <Truck className="w-4 h-4 inline mr-1" />
          {t('planning.mobilization.tabEquipment')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p>{t('planning.mobilization.empty')}</p>
        </div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  );
}
