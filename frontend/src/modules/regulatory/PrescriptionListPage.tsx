import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, AlertTriangle, CheckCircle, Clock, FileWarning } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  prescriptionStatusColorMap,
  prescriptionStatusLabels,
  regulatoryBodyTypeColorMap,
  regulatoryBodyTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate, formatMoney } from '@/lib/format';
import type { Prescription, PrescriptionStatus, RegulatoryBodyType } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

type TabId = 'all' | 'ACTIVE' | 'COMPLETED' | 'APPEALED' | 'CLOSED';

const ACTIVE_STATUSES: PrescriptionStatus[] = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESPONSE_SUBMITTED', 'OVERDUE'];

const getBodyTypeFilterOptions = () => [
  { value: '', label: t('regulatory.bodyTypeFilterAll') },
  { value: 'GIT', label: t('regulatory.bodyTypeGit') },
  { value: 'ROSTEKHNADZOR', label: t('regulatory.bodyTypeRostekhnadzor') },
  { value: 'STROYNADZOR', label: t('regulatory.bodyTypeStroynadzor') },
  { value: 'MCHS', label: t('regulatory.bodyTypeMchs') },
  { value: 'ROSPOTREBNADZOR', label: t('regulatory.bodyTypeRospotrebnadzor') },
  { value: 'ENVIRONMENTAL', label: t('regulatory.bodyTypeEnvironmental') },
  { value: 'OTHER', label: t('regulatory.bodyTypeOther') },
];

function DeadlineCell({ prescription }: { prescription: Prescription }) {
  if (!prescription.deadline) return <span className="text-neutral-400">---</span>;

  const days = prescription.daysUntilDeadline ?? 0;
  const isOverdue = prescription.overdue;

  if (isOverdue) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={14} className="text-danger-500 shrink-0" />
        <div>
          <p className="text-danger-600 dark:text-danger-400 font-medium text-xs tabular-nums">
            {formatDate(prescription.deadline)}
          </p>
          <p className="text-danger-500 text-[11px]">
            {t('regulatory.daysOverdue', { days: String(Math.abs(days)) })}
          </p>
        </div>
      </div>
    );
  }

  if (days === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-warning-500 shrink-0" />
        <div>
          <p className="text-warning-600 dark:text-warning-400 font-medium text-xs tabular-nums">
            {formatDate(prescription.deadline)}
          </p>
          <p className="text-warning-500 text-[11px]">{t('regulatory.today')}</p>
        </div>
      </div>
    );
  }

  const urgency = days <= 7 ? 'text-warning-600 dark:text-warning-400' : 'text-neutral-700 dark:text-neutral-300';

  return (
    <div>
      <p className={`font-medium text-xs tabular-nums ${urgency}`}>{formatDate(prescription.deadline)}</p>
      <p className="text-neutral-500 text-[11px]">{t('regulatory.daysLeft', { days: String(days) })}</p>
    </div>
  );
}

const PrescriptionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [bodyTypeFilter, setBodyTypeFilter] = useState('');

  const { data: prescriptionData, isLoading } = useQuery<PaginatedResponse<Prescription>>({
    queryKey: ['prescriptions'],
    queryFn: () => regulatoryApi.getPrescriptions({ size: 200 }),
  });

  const prescriptions = prescriptionData?.content ?? [];

  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (activeTab === 'ACTIVE') filtered = filtered.filter((p) => ACTIVE_STATUSES.includes(p.status));
    else if (activeTab === 'COMPLETED') filtered = filtered.filter((p) => p.status === 'COMPLETED');
    else if (activeTab === 'APPEALED') filtered = filtered.filter((p) => p.status === 'APPEALED');
    else if (activeTab === 'CLOSED') filtered = filtered.filter((p) => p.status === 'CLOSED');
    if (bodyTypeFilter) filtered = filtered.filter((p) => p.regulatoryBodyType === bodyTypeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.number.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          (p.projectName ?? '').toLowerCase().includes(lower) ||
          (p.responsibleName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [prescriptions, activeTab, bodyTypeFilter, search]);

  const tabCounts = useMemo(
    () => ({
      all: prescriptions.length,
      active: prescriptions.filter((p) => ACTIVE_STATUSES.includes(p.status)).length,
      completed: prescriptions.filter((p) => p.status === 'COMPLETED').length,
      appealed: prescriptions.filter((p) => p.status === 'APPEALED').length,
      closed: prescriptions.filter((p) => p.status === 'CLOSED').length,
    }),
    [prescriptions],
  );

  const metrics = useMemo(() => {
    const active = prescriptions.filter((p) => ACTIVE_STATUSES.includes(p.status));
    const overdue = prescriptions.filter((p) => p.overdue);
    const completed = prescriptions.filter((p) => p.status === 'COMPLETED' || p.status === 'CLOSED');
    const totalFines = prescriptions.reduce((sum, p) => sum + (p.fineAmount ?? 0), 0);
    return { active: active.length, overdue: overdue.length, completed: completed.length, totalFines };
  }, [prescriptions]);

  const columns = useMemo<ColumnDef<Prescription, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('regulatory.colPrescriptionNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('regulatory.colPrescriptionDescription'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">
              {row.original.description}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.projectName ?? '---'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'regulatoryBodyType',
        header: t('regulatory.colPrescriptionBodyType'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? (
            <StatusBadge
              status={val}
              colorMap={regulatoryBodyTypeColorMap}
              label={regulatoryBodyTypeLabels[val] ?? val}
            />
          ) : (
            <span className="text-neutral-400">---</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('regulatory.colPrescriptionStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={prescriptionStatusColorMap}
            label={prescriptionStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'deadline',
        header: t('regulatory.colPrescriptionDeadline'),
        size: 150,
        cell: ({ row }) => <DeadlineCell prescription={row.original} />,
      },
      {
        accessorKey: 'fineAmount',
        header: t('regulatory.colPrescriptionFine'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return val ? (
            <span className="font-medium text-danger-600 dark:text-danger-400 tabular-nums text-xs">
              {formatMoney(val)}
            </span>
          ) : (
            <span className="text-neutral-400">---</span>
          );
        },
      },
      {
        accessorKey: 'responsibleName',
        header: t('regulatory.colPrescriptionResponsible'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">{getValue<string>() ?? '---'}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (prescription: Prescription) => navigate(`/regulatory/prescriptions/${prescription.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('regulatory.prescriptionsTitle')}
        subtitle={t('regulatory.prescriptionsSubtitle', { count: String(prescriptions.length) })}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory/dashboard' },
          { label: t('regulatory.breadcrumbPrescriptions') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/prescriptions/new')}>
            {t('regulatory.btnNewPrescription')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('regulatory.tabInProgress'), count: tabCounts.active },
          { id: 'COMPLETED', label: t('regulatory.tabCompleted'), count: tabCounts.completed },
          { id: 'APPEALED', label: t('regulatory.tabAppealed'), count: tabCounts.appealed },
          { id: 'CLOSED', label: t('regulatory.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileWarning size={18} />} label={t('regulatory.metricTotalActive')} value={metrics.active} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('regulatory.metricTotalOverdue')}
          value={metrics.overdue}
          trend={metrics.overdue > 0 ? { direction: 'down', value: t('regulatory.trendOverdue') } : undefined}
        />
        <MetricCard icon={<CheckCircle size={18} />} label={t('regulatory.metricTotalCompleted')} value={metrics.completed} />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('regulatory.metricTotalFines')}
          value={metrics.totalFines > 0 ? formatMoney(metrics.totalFines) : '0'}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('regulatory.prescriptionSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getBodyTypeFilterOptions()}
          value={bodyTypeFilter}
          onChange={(e) => setBodyTypeFilter(e.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<Prescription>
        data={filteredPrescriptions}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        enableSavedViews
        pageSize={20}
        emptyTitle={t('regulatory.prescriptionEmptyTitle')}
        emptyDescription={t('regulatory.prescriptionEmptyDesc')}
      />
    </div>
  );
};

export default PrescriptionListPage;
