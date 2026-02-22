import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { BudgetItem } from '@/types';

interface BudgetWorksTabProps {
  items: BudgetItem[];
  sections: BudgetItem[];
  onEditItem: (item: BudgetItem) => void;
}

const BudgetWorksTab: React.FC<BudgetWorksTabProps> = ({ items, sections, onEditItem }) => {
  const workItems = useMemo(
    () => items.filter((i) => !i.section && i.itemType === 'WORKS'),
    [items],
  );

  const groupedBySection = useMemo(() => {
    const groups = new Map<string, { section: BudgetItem | null; items: BudgetItem[] }>();

    for (const item of workItems) {
      const key = item.parentId || 'root';
      if (!groups.has(key)) {
        const parentSection = sections.find((s) => s.id === item.parentId) || null;
        groups.set(key, { section: parentSection, items: [] });
      }
      groups.get(key)!.items.push(item);
    }

    return Array.from(groups.values());
  }, [workItems, sections]);

  const totals = useMemo(
    () => ({
      costTotal: workItems.reduce((s, i) => s + (i.costPrice || 0) * (i.quantity || 0), 0),
      estimateTotal: workItems.reduce((s, i) => s + (i.estimatePrice || 0) * (i.quantity || 0), 0),
      customerTotal: workItems.reduce((s, i) => s + (i.customerPrice || 0) * (i.quantity || 0), 0),
    }),
    [workItems],
  );

  if (workItems.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        {t('finance.budgetView.noWorks')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedBySection.map(({ section, items: sectionItems }, idx) => (
        <div
          key={section?.id || idx}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700"
        >
          {section && (
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-t-xl border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {section.disciplineMark && (
                  <span className="text-primary-600 dark:text-primary-400 mr-2">
                    {section.disciplineMark}
                  </span>
                )}
                {section.name}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {sectionItems.length} {t('common.positions')}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                  <th className="px-4 py-2 font-medium">{t('common.name')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.quantity')}</th>
                  <th className="px-3 py-2 font-medium">{t('finance.budgetView.unit')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.costPrice')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.estimatePrice')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.customerPrice')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.costTotal')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.customerTotalCol')}</th>
                  <th className="px-3 py-2 font-medium text-right">{t('finance.budgetView.margin')}</th>
                </tr>
              </thead>
              <tbody>
                {sectionItems.map((item) => {
                  const costTotal = (item.costPrice || 0) * (item.quantity || 0);
                  const customerTotal = (item.customerPrice || 0) * (item.quantity || 0);
                  const margin = item.marginPercent || 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onEditItem(item)}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">{item.name}</td>
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{item.unit}</td>
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                        {(item.costPrice || 0).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                        {(item.estimatePrice || 0).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                        {(item.customerPrice || 0).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {costTotal.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {customerTotal.toLocaleString('ru-RU')}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right font-medium',
                          margin > 0
                            ? 'text-success-600'
                            : margin < 0
                              ? 'text-danger-600'
                              : 'text-neutral-500',
                        )}
                      >
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {t('finance.budgetView.totalWorks')}
        </span>
        <div className="flex gap-8 text-sm">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400">
              {t('finance.budgetView.costPrice')}:
            </span>{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {totals.costTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400">
              {t('finance.budgetView.estimatePrice')}:
            </span>{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {totals.estimateTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400">
              {t('finance.budgetView.customerPrice')}:
            </span>{' '}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {totals.customerTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetWorksTab;
