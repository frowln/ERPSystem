import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { PivotTable, type AggregationType } from '@/design-system/components/PivotTable';
import { formatMoney } from '@/lib/format';
import { estimatesApi } from '@/api/estimates';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EstimateItem extends Record<string, unknown> {
  [key: string]: unknown;
  id: string;
  name: string;
  category: string;
  status: string;
  amount: number;
  projectName: string;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EstimatePivotPage: React.FC = () => {
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  const { data: estimatesData } = useQuery({
    queryKey: ['estimates', 'pivot'],
    queryFn: () => estimatesApi.getEstimates({ page: 0, size: 1000 }),
  });

  const statusLabels: Record<string, string> = {
    APPROVED: t('estimates.pivot.statusApproved'),
    IN_REVIEW: t('estimates.pivot.statusInReview'),
    DRAFT: t('estimates.pivot.statusDraft'),
  };

  const pivotData: EstimateItem[] = (estimatesData?.content ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    category: e.specificationName ?? t('estimates.pivot.categoryOther'),
    status: statusLabels[e.status] ?? e.status,
    amount: e.totalAmount,
    projectName: e.projectName ?? '',
  }));

  const categoryOrder = [
    t('estimates.pivot.catEarthworks'),
    t('estimates.pivot.catConcrete'),
    t('estimates.pivot.catMasonry'),
    t('estimates.pivot.catMetalStructures'),
    t('estimates.pivot.catRoofing'),
    t('estimates.pivot.catFacade'),
    t('estimates.pivot.catElectrical'),
    t('estimates.pivot.catPlumbing'),
    t('estimates.pivot.catFinishing'),
  ];

  const columnOrder = [t('estimates.pivot.statusApproved'), t('estimates.pivot.statusInReview'), t('estimates.pivot.statusDraft')];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.pivot.title')}
        subtitle={t('estimates.pivot.subtitle')}
        breadcrumbs={[
          { label: t('estimates.pivot.breadcrumbHome'), href: '/' },
          { label: t('estimates.pivot.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.pivot.breadcrumbPivot') },
        ]}
      />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">{t('estimates.pivot.aggregation')}:</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {([
              ['sum', t('estimates.pivot.aggSum')] as const,
              ['count', t('estimates.pivot.aggCount')] as const,
              ['average', t('estimates.pivot.aggAverage')] as const,
            ]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAggregation(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  aggregation === value
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PivotTable<EstimateItem>
        data={pivotData}
        rowField="category"
        columnField="status"
        valueField="amount"
        aggregation={aggregation}
        rowLabel={t('estimates.pivot.rowLabel')}
        rowOrder={categoryOrder}
        columnOrder={columnOrder}
        formatValue={aggregation === 'count' ? (v) => String(Math.round(v)) : (v) => formatMoney(v)}
        title={t('estimates.pivot.tableTitle')}
      />

      {/* Summary info */}
      <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('estimates.pivot.referenceInfo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.pivot.totalItems')}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{pivotData.length}</p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.pivot.totalAmount')}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {formatMoney(pivotData.reduce((s, d) => s + d.amount, 0))}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.pivot.totalCategories')}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{categoryOrder.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimatePivotPage;
