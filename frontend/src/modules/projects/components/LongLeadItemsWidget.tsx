import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import { financeApi } from '@/api/finance';
import type { BudgetItem } from '@/types';

interface Props {
  projectId: string;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  NOT_ORDERED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
  ORDERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_TRANSIT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const LongLeadItemsWidget: React.FC<Props> = ({ projectId }) => {
  const { data: budgets } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: () => financeApi.getBudgets({ projectId }),
  });

  const budgetId = budgets?.content?.[0]?.id;

  const { data: itemsData } = useQuery({
    queryKey: ['budget-items', budgetId],
    queryFn: () => financeApi.getBudgetItems(budgetId!),
    enabled: !!budgetId,
  });

  const items: BudgetItem[] = itemsData ?? [];

  const longLeadItems = useMemo(() => {
    return items
      .filter((i) => i.isLongLead && !i.section)
      .sort((a, b) => {
        if (!a.orderDeadline) return 1;
        if (!b.orderDeadline) return -1;
        return a.orderDeadline.localeCompare(b.orderDeadline);
      });
  }, [items]);

  if (longLeadItems.length === 0) return null;

  const now = new Date();
  const urgentCount = longLeadItems.filter((i) => {
    if (!i.orderDeadline || i.orderStatus === 'DELIVERED') return false;
    const deadline = new Date(i.orderDeadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 14;
  }).length;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('finance.longLead.title')}
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            ({longLeadItems.length})
          </span>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertTriangle size={12} />
            {t('finance.longLead.urgentCount', { count: urgentCount })}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {longLeadItems.map((item) => {
          const deadline = item.orderDeadline ? new Date(item.orderDeadline) : null;
          const daysLeft = deadline
            ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const isOverdue = daysLeft != null && daysLeft < 0 && item.orderStatus !== 'DELIVERED';
          const isUrgent = daysLeft != null && daysLeft >= 0 && daysLeft <= 14 && item.orderStatus !== 'DELIVERED';
          const isDone = item.orderStatus === 'DELIVERED';

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
                isOverdue
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : isUrgent
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                    : isDone
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50',
              )}
            >
              {isDone ? (
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
              ) : isOverdue ? (
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              ) : (
                <Clock size={14} className={cn('flex-shrink-0', isUrgent ? 'text-amber-500' : 'text-neutral-400')} />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {item.leadTimeDays && (
                    <span>{t('finance.longLead.leadDays', { days: item.leadTimeDays })}</span>
                  )}
                  {deadline && (
                    <span className={cn(isOverdue && 'text-red-600 dark:text-red-400 font-medium', isUrgent && 'text-amber-600 dark:text-amber-400 font-medium')}>
                      {t('finance.longLead.deadline')}: {formatDate(item.orderDeadline!)}
                    </span>
                  )}
                  {daysLeft != null && !isDone && (
                    <span className={cn(isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-amber-600 font-medium' : '')}>
                      {isOverdue
                        ? t('finance.longLead.overdue', { days: Math.abs(daysLeft) })
                        : t('finance.longLead.daysLeft', { days: daysLeft })}
                    </span>
                  )}
                </div>
              </div>

              {item.orderStatus && (
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', ORDER_STATUS_STYLES[item.orderStatus] || ORDER_STATUS_STYLES.NOT_ORDERED)}>
                  {t(`finance.longLead.status.${item.orderStatus}`)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LongLeadItemsWidget;
