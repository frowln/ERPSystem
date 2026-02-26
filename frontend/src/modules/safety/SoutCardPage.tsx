import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { SoutCard, SoutStatus } from './types';

const statusColorMap: Record<SoutStatus, 'green' | 'yellow' | 'red'> = {
  valid: 'green',
  expiring: 'yellow',
  expired: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  valid: t('safety.sout.statusValid'),
  expiring: t('safety.sout.statusExpiring'),
  expired: t('safety.sout.statusExpired'),
});

const getHazardClassLabels = (): Record<string, string> => ({
  '1': t('safety.sout.hazardClass1'),
  '2': t('safety.sout.hazardClass2'),
  '3': t('safety.sout.hazardClass3'),
  '3.1': t('safety.sout.hazardClass3_1'),
  '3.2': t('safety.sout.hazardClass3_2'),
  '3.3': t('safety.sout.hazardClass3_3'),
  '3.4': t('safety.sout.hazardClass3_4'),
  '4': t('safety.sout.hazardClass4'),
});

const hazardClassColorMap: Record<string, 'green' | 'blue' | 'yellow' | 'orange' | 'red'> = {
  '1': 'green',
  '2': 'blue',
  '3': 'orange',
  '3.1': 'yellow',
  '3.2': 'yellow',
  '3.3': 'orange',
  '3.4': 'orange',
  '4': 'red',
};

function getDisplayClass(card: SoutCard): string {
  if (card.hazardClass === 3 && card.hazardSubclass) {
    return card.hazardSubclass;
  }
  return String(card.hazardClass);
}

const SoutCardPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedCard, setSelectedCard] = useState<SoutCard | null>(null);

  const { data: cardsData, isLoading } = useQuery({
    queryKey: ['safety-sout-cards'],
    queryFn: () => safetyApi.getSoutCards(),
  });

  const cards = cardsData?.content ?? [];

  // Extract unique departments for filter
  const departments = useMemo(
    () => [...new Set(cards.map((c) => c.department))].sort(),
    [cards],
  );

  const metrics = useMemo(() => ({
    total: cards.length,
    valid: cards.filter((c) => c.status === 'valid').length,
    expiring: cards.filter((c) => c.status === 'expiring').length,
    expired: cards.filter((c) => c.status === 'expired').length,
  }), [cards]);

  const filteredCards = useMemo(() => {
    let filtered = cards;
    if (classFilter) {
      filtered = filtered.filter((c) => {
        const display = getDisplayClass(c);
        return display === classFilter || String(c.hazardClass) === classFilter;
      });
    }
    if (departmentFilter) filtered = filtered.filter((c) => c.department === departmentFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.position.toLowerCase().includes(lower) ||
          c.department.toLowerCase().includes(lower) ||
          c.workplaceId.toLowerCase().includes(lower) ||
          (c.certificateNumber?.toLowerCase().includes(lower) ?? false),
      );
    }
    return filtered;
  }, [cards, classFilter, departmentFilter, search]);

  const classFilterOptions = [
    { value: '', label: t('safety.sout.filterAllClasses') },
    { value: '1', label: t('safety.sout.hazardClass1') },
    { value: '2', label: t('safety.sout.hazardClass2') },
    { value: '3.1', label: t('safety.sout.hazardClass3_1') },
    { value: '3.2', label: t('safety.sout.hazardClass3_2') },
    { value: '3.3', label: t('safety.sout.hazardClass3_3') },
    { value: '3.4', label: t('safety.sout.hazardClass3_4') },
    { value: '4', label: t('safety.sout.hazardClass4') },
  ];

  const departmentFilterOptions = [
    { value: '', label: t('safety.sout.filterAllDepartments') },
    ...departments.map((d) => ({ value: d, label: d })),
  ];

  const columns = useMemo<ColumnDef<SoutCard, unknown>[]>(
    () => [
      {
        accessorKey: 'workplaceId',
        header: t('safety.sout.colWorkplaceId'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'position',
        header: t('safety.sout.colPosition'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'department',
        header: t('safety.sout.colDepartment'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'hazardClassDisplay',
        accessorFn: (row) => getDisplayClass(row),
        header: t('safety.sout.colHazardClass'),
        size: 160,
        cell: ({ row }) => {
          const cls = getDisplayClass(row.original);
          return (
            <StatusBadge
              status={cls}
              colorMap={hazardClassColorMap}
              label={getHazardClassLabels()[cls] ?? cls}
            />
          );
        },
      },
      {
        accessorKey: 'certificateNumber',
        header: t('safety.sout.colCertificate'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return (
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {val || '\u2014'}
            </span>
          );
        },
      },
      {
        accessorKey: 'assessmentDate',
        header: t('safety.sout.colAssessmentDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('safety.sout.colExpiryDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('safety.sout.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  // Detail view
  if (selectedCard) {
    const displayClass = getDisplayClass(selectedCard);
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={`${t('safety.sout.detailTitle')} \u2014 ${selectedCard.workplaceId}`}
          breadcrumbs={[
            { label: t('safety.sout.breadcrumbHome'), href: '/' },
            { label: t('safety.sout.breadcrumbSafety'), href: '/safety' },
            { label: t('safety.sout.breadcrumbSout'), href: '/safety/sout' },
            { label: selectedCard.workplaceId },
          ]}
          actions={
            <Button
              variant="outline"
              iconLeft={<ArrowLeft size={16} />}
              onClick={() => setSelectedCard(null)}
            >
              {t('safety.sout.btnBack')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workplace info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('safety.sout.detailWorkplaceInfo')}
            </h3>
            <div className="space-y-3">
              {[
                [t('safety.sout.labelWorkplaceId'), selectedCard.workplaceId],
                [t('safety.sout.labelPosition'), selectedCard.position],
                [t('safety.sout.labelDepartment'), selectedCard.department],
                [t('safety.sout.labelHazardClass'), getHazardClassLabels()[displayClass] ?? displayClass],
                [t('safety.sout.labelCertificate'), selectedCard.certificateNumber || '\u2014'],
                [t('safety.sout.labelAssessmentDate'), formatDate(selectedCard.assessmentDate)],
                [t('safety.sout.labelNextAssessmentDate'), selectedCard.nextAssessmentDate ? formatDate(selectedCard.nextAssessmentDate) : '\u2014'],
                [t('safety.sout.labelExpiryDate'), formatDate(selectedCard.expiryDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('safety.sout.colStatus')}</span>
                <StatusBadge
                  status={selectedCard.status}
                  colorMap={statusColorMap}
                  label={getStatusLabels()[selectedCard.status] ?? selectedCard.status}
                />
              </div>
            </div>
          </div>

          {/* Factors */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('safety.sout.detailFactors')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.sout.factorName')}</th>
                    <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.sout.factorMeasured')}</th>
                    <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.sout.factorLimit')}</th>
                    <th className="text-center py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.sout.factorUnit')}</th>
                    <th className="text-center py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.sout.factorStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCard.factors.map((f, idx) => {
                    const exceeded = f.measured > f.limit;
                    return (
                      <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="py-2 text-neutral-900 dark:text-neutral-100">{f.name}</td>
                        <td className={`py-2 text-right tabular-nums ${exceeded ? 'text-danger-600 font-semibold' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {f.measured}
                        </td>
                        <td className="py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">{f.limit}</td>
                        <td className="py-2 text-center text-neutral-500 dark:text-neutral-400">{f.unit}</td>
                        <td className="py-2 text-center">
                          {exceeded ? (
                            <span className="text-xs font-medium text-danger-600">{t('safety.sout.factorExceeded')}</span>
                          ) : (
                            <span className="text-xs font-medium text-success-600">{t('safety.sout.factorNormal')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.sout.title')}
        subtitle={t('safety.sout.subtitle')}
        breadcrumbs={[
          { label: t('safety.sout.breadcrumbHome'), href: '/' },
          { label: t('safety.sout.breadcrumbSafety'), href: '/safety' },
          { label: t('safety.sout.breadcrumbSout') },
        ]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('safety.sout.metricTotal')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('safety.sout.metricValid')} value={metrics.valid} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.sout.metricExpiring')}
          value={metrics.expiring}
          trend={metrics.expiring > 0 ? { direction: 'down', value: `${metrics.expiring}` } : undefined}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('safety.sout.metricExpired')}
          value={metrics.expired}
          trend={metrics.expired > 0 ? { direction: 'down', value: `${metrics.expired}` } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('safety.sout.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={classFilterOptions}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-52"
        />
        <Select
          options={departmentFilterOptions}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<SoutCard>
        data={filteredCards}
        columns={columns}
        loading={isLoading}
        onRowClick={(card) => setSelectedCard(card)}
        enableExport
        enableColumnVisibility
        pageSize={20}
        emptyTitle={t('safety.sout.emptyTitle')}
        emptyDescription={t('safety.sout.emptyDescription')}
      />
    </div>
  );
};

export default SoutCardPage;
