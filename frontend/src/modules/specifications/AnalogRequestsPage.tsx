import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { materialAnalogsApi } from '@/api/materialAnalogs';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { AnalogRequest } from './types';

const analogRequestStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  submitted: 'blue',
  under_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  implemented: 'purple',
};

const getAnalogRequestStatusLabels = (): Record<string, string> => ({
  draft: t('specifications.analogStatusDraft'),
  submitted: t('specifications.analogStatusSubmitted'),
  under_review: t('specifications.analogStatusUnderReview'),
  approved: t('specifications.analogStatusApproved'),
  rejected: t('specifications.analogStatusRejected'),
  implemented: t('specifications.analogStatusImplemented'),
});

type TabId = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

const AnalogRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['analog-requests'],
    queryFn: () => materialAnalogsApi.getRequests(),
  });

  const requests = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = requests;
    if (activeTab !== 'all') result = result.filter((r) => r.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.originalMaterialName.toLowerCase().includes(lower) ||
          r.projectName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [requests, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
    under_review: requests.filter((r) => r.status === 'UNDER_REVIEW').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests]);

  const metrics = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
    approved: requests.filter((r) => r.status === 'APPROVED' || r.status === 'IMPLEMENTED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests]);

  const columns = useMemo<ColumnDef<AnalogRequest, unknown>[]>(
    () => {
      const statusLabels = getAnalogRequestStatusLabels();
      return [
        {
          accessorKey: 'number',
          header: '\u2116',
          size: 130,
          cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
        },
        {
          accessorKey: 'originalMaterialName',
          header: t('specifications.analogColMaterial'),
          size: 220,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.originalMaterialName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
            </div>
          ),
        },
        {
          accessorKey: 'reason',
          header: t('specifications.analogColReason'),
          size: 260,
          cell: ({ getValue }) => (
            <p className="text-neutral-700 dark:text-neutral-300 truncate max-w-[240px]">{getValue<string>()}</p>
          ),
        },
        {
          accessorKey: 'status',
          header: t('specifications.analogColStatus'),
          size: 140,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={analogRequestStatusColorMap}
              label={statusLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'requestedByName',
          header: t('specifications.analogColInitiator'),
          size: 150,
          cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
        },
        {
          accessorKey: 'proposedAnalogCount',
          header: t('specifications.analogColAnalogCount'),
          size: 90,
          cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}</span>,
        },
        {
          accessorKey: 'dueDate',
          header: t('specifications.analogColDueDate'),
          size: 110,
          cell: ({ row }) => {
            const val = row.original.dueDate;
            if (!val) return <span className="text-neutral-400">---</span>;
            const isOverdue = new Date(val) < new Date() && !['APPROVED', 'REJECTED', 'IMPLEMENTED'].includes(row.original.status);
            return <span className={`tabular-nums ${isOverdue ? 'text-danger-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>{formatDate(val)}</span>;
          },
        },
        {
          accessorKey: 'selectedAnalogName',
          header: t('specifications.analogColSelectedAnalog'),
          size: 200,
          cell: ({ getValue }) => {
            const val = getValue<string>();
            return val ? <span className="text-neutral-700 dark:text-neutral-300 truncate">{val}</span> : <span className="text-neutral-400">---</span>;
          },
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('specifications.analogRequestsTitle')}
        subtitle={t('specifications.analogRequestsSubtitle', { count: String(requests.length) })}
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: t('specifications.analogRequestsBreadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/specifications/analog-requests/new')}>{t('specifications.analogNewRequest')}</Button>
        }
        tabs={[
          { id: 'all', label: t('specifications.analogTabAll'), count: tabCounts.all },
          { id: 'SUBMITTED', label: t('specifications.analogTabSubmitted'), count: tabCounts.submitted },
          { id: 'UNDER_REVIEW', label: t('specifications.analogTabUnderReview'), count: tabCounts.under_review },
          { id: 'APPROVED', label: t('specifications.analogTabApproved'), count: tabCounts.approved },
          { id: 'REJECTED', label: t('specifications.analogTabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('specifications.analogMetricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('specifications.analogMetricPending')} value={metrics.pending} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('specifications.analogMetricApproved')} value={metrics.approved} />
        <MetricCard icon={<XCircle size={18} />} label={t('specifications.analogMetricRejected')} value={metrics.rejected} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('specifications.analogSearchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<AnalogRequest>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('specifications.analogEmptyTitle')}
        emptyDescription={t('specifications.analogEmptyDescription')}
      />
    </div>
  );
};

export default AnalogRequestsPage;
