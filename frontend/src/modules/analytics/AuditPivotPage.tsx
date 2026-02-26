import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { PivotTable, type AggregationType } from '@/design-system/components/PivotTable';
import { analyticsApi, type AuditLogEntry } from '@/api/analytics';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

const getModules = () => [
  t('analytics.auditPivot.modProjects'),
  t('analytics.auditPivot.modContracts'),
  t('analytics.auditPivot.modEstimates'),
  t('analytics.auditPivot.modPayments'),
  t('analytics.auditPivot.modWarehouse'),
  t('analytics.auditPivot.modPersonnel'),
  t('analytics.auditPivot.modDocuments'),
  t('analytics.auditPivot.modQuality'),
  t('analytics.auditPivot.modProcurement'),
  t('analytics.auditPivot.modTasks'),
];

const getActionTypes = () => [
  t('analytics.auditPivot.actCreate'),
  t('analytics.auditPivot.actEdit'),
  t('analytics.auditPivot.actDelete'),
  t('analytics.auditPivot.actView'),
  t('analytics.auditPivot.actExport'),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuditPivotPage: React.FC = () => {
  const [aggregation, setAggregation] = useState<AggregationType>('count');
  const modules = getModules();
  const actionTypes = getActionTypes();

  const { data: auditResponse } = useQuery({
    queryKey: ['analytics-audit-log'],
    queryFn: () => analyticsApi.getAuditLog({ page: 0, size: 5000 }),
  });
  const auditData: AuditLogEntry[] = useMemo(() => auditResponse?.content ?? [], [auditResponse]);

  const totalActions = auditData.length;
  const mostActiveModule = modules.reduce((best, mod) => {
    const cnt = auditData.filter((d) => d.module === mod).length;
    return cnt > best.count ? { name: mod, count: cnt } : best;
  }, { name: '', count: 0 });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.auditPivot.title')}
        subtitle={t('analytics.auditPivot.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.dashboard.title'), href: '/analytics' },
          { label: t('analytics.auditPivot.breadcrumb') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalActions.toLocaleString('ru-RU')}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.auditPivot.totalActions')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{modules.length}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.auditPivot.modulesCount')}</p>
        </div>
        <div className="rounded-lg border bg-primary-50 border-primary-200 px-4 py-3">
          <p className="text-2xl font-bold text-primary-700">{mostActiveModule.name}</p>
          <p className="text-xs font-medium text-primary-600 mt-0.5">{t('analytics.auditPivot.mostActive')} ({mostActiveModule.count})</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{actionTypes.length}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('analytics.auditPivot.actionTypesCount')}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">{t('analytics.auditPivot.aggregation')}:</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {([
              ['count', t('analytics.auditPivot.aggCount')] as const,
              ['sum', t('analytics.auditPivot.aggSum')] as const,
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

      <PivotTable<AuditLogEntry>
        data={auditData}
        rowField="module"
        columnField="action_type"
        valueField="count"
        aggregation={aggregation}
        rowLabel={t('analytics.auditPivot.rowLabelModule')}
        rowOrder={modules}
        columnOrder={actionTypes}
        formatValue={(v) => String(Math.round(v))}
        title={t('analytics.auditPivot.pivotTitle')}
      />

      {/* Info note */}
      <div className="mt-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('analytics.auditPivot.infoNote')}
        </p>
      </div>
    </div>
  );
};

export default AuditPivotPage;
