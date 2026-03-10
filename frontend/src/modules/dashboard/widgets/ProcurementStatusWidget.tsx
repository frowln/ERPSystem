import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';

const ProcurementStatusWidget: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['procurement', 'dashboard'],
    queryFn: () => procurementApi.getProcurementDashboard(),
    staleTime: 60_000,
  });

  const pending = data?.pendingApproval ?? 0;
  const approved = data?.inProgress ?? 0;
  const overdue = (data?.byStatus ?? []).find((s) => s.status === 'OVERDUE')?.count ?? 0;
  const total = data?.totalRequests ?? 0;

  const items = [
    { label: t('dashboard.wid.procPending'), count: pending, icon: Clock, color: 'text-warning-500' },
    { label: t('dashboard.wid.procApproved'), count: approved, icon: CheckCircle2, color: 'text-success-500' },
    { label: t('dashboard.wid.procOverdue'), count: overdue, icon: AlertTriangle, color: 'text-danger-500' },
  ];

  return (
    <div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 tabular-nums">
        {total}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon size={14} className={item.color} />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcurementStatusWidget;
