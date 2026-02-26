import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { CalendarClock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProcurementScheduleItem } from '@/modules/finance/types';

export default function ProcurementSchedulePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['procurement-schedule', projectId],
    queryFn: () => financeApi.getProcurementSchedule(projectId!),
    enabled: !!projectId,
  });

  const generateMutation = useMutation({
    mutationFn: () => financeApi.generateProcurementSchedule(projectId!, '', new Date().toISOString().slice(0, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-schedule', projectId] });
      toast.success(t('planning.procurement.generateSuccess'));
    },
  });

  const statusMap: Record<string, string> = {
    PENDING: t('planning.procurement.statusPending'),
    ORDERED: t('planning.procurement.statusOrdered'),
    IN_TRANSIT: t('planning.procurement.statusInTransit'),
    DELIVERED: t('planning.procurement.statusDelivered'),
    CANCELLED: t('planning.procurement.statusCancelled'),
  };

  const statusVariant = (s: string) => {
    if (s === 'DELIVERED') return 'success';
    if (s === 'ORDERED' || s === 'IN_TRANSIT') return 'info';
    if (s === 'CANCELLED') return 'danger';
    return 'default';
  };

  const columns = [
    { key: 'itemName', header: t('planning.procurement.colItem'), render: (r: ProcurementScheduleItem) => r.itemName },
    { key: 'unit', header: t('common.unit'), render: (r: ProcurementScheduleItem) => r.unit || '—' },
    { key: 'quantity', header: t('common.quantity'), render: (r: ProcurementScheduleItem) => r.quantity?.toLocaleString() ?? '—' },
    { key: 'requiredByDate', header: t('planning.procurement.requiredBy'), render: (r: ProcurementScheduleItem) => r.requiredByDate || '—' },
    { key: 'leadTimeDays', header: t('planning.procurement.leadTime'), render: (r: ProcurementScheduleItem) => `${r.leadTimeDays} ${t('common.days')}` },
    { key: 'orderByDate', header: t('planning.procurement.orderBy'), render: (r: ProcurementScheduleItem) => r.orderByDate || '—' },
    { key: 'status', header: t('common.status'), render: (r: ProcurementScheduleItem) => (
      <StatusBadge status={statusVariant(r.status)} label={statusMap[r.status] || r.status} />
    )},
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('planning.procurement.title')}
        actions={
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            {t('planning.procurement.generate')}
          </button>
        }
      />

      {isLoading ? (
        <div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('planning.procurement.empty')}</p>
          <p className="text-sm mt-1">{t('planning.procurement.emptyHint')}</p>
        </div>
      ) : (
        <DataTable data={items} columns={columns} />
      )}
    </div>
  );
}
