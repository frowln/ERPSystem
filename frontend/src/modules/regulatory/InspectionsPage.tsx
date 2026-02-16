import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardCheck, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  inspectionStatusColorMap,
  inspectionStatusLabels,
  inspectionTypeColorMap,
  inspectionTypeLabels,
  complianceResultColorMap,
  complianceResultLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type { Inspection } from './types';
import { t } from '@/i18n';

type TabId = 'all' | 'SCHEDULED' | 'PASSED' | 'FAILED';

const getTypeFilterOptions = () => [
  { value: '', label: t('regulatory.inspTypeFilterAll') },
  { value: 'ROSTECHNADZOR', label: t('regulatory.inspTypeRostechnadzor') },
  { value: 'FIRE_INSPECTION', label: t('regulatory.inspTypeFireInspection') },
  { value: 'SANITARY', label: t('regulatory.inspTypeSanitary') },
  { value: 'ENVIRONMENTAL', label: t('regulatory.inspTypeEnvironmental') },
  { value: 'INTERNAL_AUDIT', label: t('regulatory.inspTypeInternalAudit') },
  { value: 'CUSTOMER_INSPECTION', label: t('regulatory.inspTypeCustomerInspection') },
];

const InspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: inspData, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => regulatoryApi.getInspections(),
  });

  const inspections = inspData?.content ?? [];

  const filteredInspections = useMemo(() => {
    let filtered = inspections;
    if (activeTab === 'SCHEDULED') filtered = filtered.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));
    else if (activeTab === 'PASSED') filtered = filtered.filter((i) => i.status === 'PASSED');
    else if (activeTab === 'FAILED') filtered = filtered.filter((i) => i.status === 'FAILED');
    if (typeFilter) filtered = filtered.filter((i) => i.inspectionType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.number.toLowerCase().includes(lower) ||
          i.name.toLowerCase().includes(lower) ||
          (i.projectName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [inspections, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: inspections.length,
    scheduled: inspections.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length,
    passed: inspections.filter((i) => i.status === 'PASSED').length,
    failed: inspections.filter((i) => i.status === 'FAILED').length,
  }), [inspections]);

  const columns = useMemo<ColumnDef<Inspection, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('regulatory.colNumber'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('regulatory.colInspection'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'inspectionType',
        header: t('regulatory.colType'),
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspectionTypeColorMap}
            label={inspectionTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('regulatory.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspectionStatusColorMap}
            label={inspectionStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'result',
        header: t('regulatory.colResult'),
        size: 130,
        cell: ({ getValue }) => {
          const result = getValue<string | undefined>();
          if (!result) return <span className="text-neutral-400">---</span>;
          return (
            <StatusBadge
              status={result}
              colorMap={complianceResultColorMap}
              label={complianceResultLabels[result] ?? result}
            />
          );
        },
      },
      {
        accessorKey: 'scheduledDate',
        header: t('regulatory.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'inspectorOrganization',
        header: t('regulatory.colOrganization'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-xs">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (inspection: Inspection) => navigate(`/regulatory/inspections/${inspection.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.inspectionsTitle')}
        subtitle={t('regulatory.inspectionsSubtitle', { count: String(inspections.length) })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },
          { label: t('regulatory.btnInspections') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/inspections/new')}>
            {t('regulatory.btnScheduleInspection')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          { id: 'SCHEDULED', label: t('regulatory.tabScheduled'), count: tabCounts.scheduled },
          { id: 'PASSED', label: t('regulatory.tabPassed'), count: tabCounts.passed },
          { id: 'FAILED', label: t('regulatory.tabFailed'), count: tabCounts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('regulatory.metricTotalInspections')} value={inspections.length} />
        <MetricCard icon={<Calendar size={18} />} label={t('regulatory.metricScheduledCount')} value={tabCounts.scheduled} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('regulatory.metricPassedCount')} value={tabCounts.passed} />
        <MetricCard icon={<XCircle size={18} />} label={t('regulatory.metricFailedCount')} value={tabCounts.failed}
          trend={tabCounts.failed > 0 ? { direction: 'down', value: t('regulatory.trendNeedCorrective') } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('regulatory.searchInspectionPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-56" />
      </div>

      <DataTable<Inspection>
        data={filteredInspections ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('regulatory.emptyInspections')}
        emptyDescription={t('regulatory.emptyInspectionsDesc')}
      />
    </div>
  );
};

export default InspectionsPage;
