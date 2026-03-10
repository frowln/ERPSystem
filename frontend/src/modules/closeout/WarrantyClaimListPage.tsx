import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ShieldAlert, Wrench, Clock, DollarSign } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { WarrantyClaim, WarrantyClaimStatus, DefectType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  OPEN: 'yellow',
  IN_REVIEW: 'blue',
  APPROVED: 'cyan',
  IN_REPAIR: 'orange',
  RESOLVED: 'green',
  REJECTED: 'red',
  CLOSED: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  OPEN: t('closeout.warrantyStatusOpen'),
  IN_REVIEW: t('closeout.warrantyStatusInReview'),
  APPROVED: t('closeout.warrantyStatusApproved'),
  IN_REPAIR: t('closeout.warrantyStatusInRepair'),
  RESOLVED: t('closeout.warrantyStatusResolved'),
  REJECTED: t('closeout.warrantyStatusRejected'),
  CLOSED: t('closeout.warrantyStatusClosed'),
});

const getDefectTypeLabels = (): Record<string, string> => ({
  STRUCTURAL: t('closeout.defectTypeStructural'),
  MECHANICAL: t('closeout.defectTypeMechanical'),
  ELECTRICAL: t('closeout.defectTypeElectrical'),
  PLUMBING: t('closeout.defectTypePlumbing'),
  FINISHING: t('closeout.defectTypeFinishing'),
  WATERPROOFING: t('closeout.defectTypeWaterproofing'),
  OTHER: t('closeout.defectTypeOther'),
});

type TabId = 'all' | 'OPEN' | 'IN_REPAIR' | 'RESOLVED';

const WarrantyClaimListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [defectFilter, setDefectFilter] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['warranty-claims'],
    queryFn: () => closeoutApi.getWarrantyClaims(),
  });

  const claims = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = claims;
    if (activeTab === 'OPEN') result = result.filter((c) => c.status === 'OPEN' || c.status === 'IN_REVIEW' || c.status === 'APPROVED');
    else if (activeTab === 'IN_REPAIR') result = result.filter((c) => c.status === 'IN_REPAIR');
    else if (activeTab === 'RESOLVED') result = result.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

    if (defectFilter) result = result.filter((c) => c.defectType === defectFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(lower) ||
          c.title.toLowerCase().includes(lower) ||
          c.reportedByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [claims, activeTab, defectFilter, search]);

  const counts = useMemo(() => ({
    all: claims.length,
    open: claims.filter((c) => ['OPEN', 'IN_REVIEW', 'APPROVED'].includes(c.status)).length,
    in_repair: claims.filter((c) => c.status === 'IN_REPAIR').length,
    resolved: claims.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
  }), [claims]);

  const totalEstimatedCost = useMemo(() => claims.reduce((sum, c) => sum + (c.estimatedCost ?? 0), 0), [claims]);

  const statusLabels = getStatusLabels();
  const defectTypeLabels = getDefectTypeLabels();

  const columns = useMemo<ColumnDef<WarrantyClaim, unknown>[]>(
    () => [
      {
        accessorKey: 'claimNumber',
        header: t('closeout.warrantyListColNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('closeout.warrantyListColDefect'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location ?? row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closeout.warrantyListColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'defectType',
        header: t('closeout.warrantyListColDefectType'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{defectTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'estimatedCost',
        header: t('closeout.warrantyListColEstimatedCost'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'reportedByName',
        header: t('closeout.warrantyListColReporter'),
        size: 150,
      },
      {
        accessorKey: 'warrantyExpiryDate',
        header: t('closeout.warrantyListColWarrantyExpiry'),
        size: 120,
        cell: ({ getValue }) => {
          const d = getValue<string>();
          const isExpiring = d && new Date(d) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          return <span className={`tabular-nums ${isExpiring ? 'text-warning-600 font-medium' : ''}`}>{formatDate(d)}</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/closeout/warranty/${row.original.id}`); }}
          >
            {t('closeout.openAction')}
          </Button>
        ),
      },
    ],
    [navigate, statusLabels, defectTypeLabels],
  );

  const handleRowClick = useCallback(
    (claim: WarrantyClaim) => navigate(`/closeout/warranty/${claim.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closeout.warrantyListTitle')}
        subtitle={t('closeout.warrantyListSubtitle', { count: String(claims.length) })}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout' },
          { label: t('closeout.breadcrumbWarranty') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/closeout/warranty/new')}>
            {t('closeout.warrantyListNewClaim')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('closeout.warrantyListTabAll'), count: counts.all },
          { id: 'OPEN', label: t('closeout.warrantyListTabOpen'), count: counts.open },
          { id: 'IN_REPAIR', label: t('closeout.warrantyListTabInRepair'), count: counts.in_repair },
          { id: 'RESOLVED', label: t('closeout.warrantyListTabResolved'), count: counts.resolved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && claims.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title={t('closeout.warrantyListErrorTitle')}
          description={t('closeout.checkConnection')}
          actionLabel={t('closeout.retryAction')}
          onAction={() => { void refetch(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<ShieldAlert size={18} />} label={t('closeout.warrantyListMetricTotal')} value={counts.all} />
            <MetricCard icon={<Clock size={18} />} label={t('closeout.warrantyListMetricOpen')} value={counts.open} trend={{ direction: counts.open > 2 ? 'up' : 'neutral', value: t('closeout.warrantyListPiecesUnit', { count: String(counts.open) }) }} />
            <MetricCard icon={<Wrench size={18} />} label={t('closeout.warrantyListMetricInRepair')} value={counts.in_repair} />
            <MetricCard icon={<DollarSign size={18} />} label={t('closeout.warrantyListMetricEstimate')} value={formatMoney(totalEstimatedCost)} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder={t('closeout.warrantyListSearchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select
              options={[
                { value: '', label: t('closeout.warrantyListAllDefectTypes') },
                ...Object.entries(defectTypeLabels).map(([value, label]) => ({ value, label })),
              ]}
              value={defectFilter}
              onChange={(e) => setDefectFilter(e.target.value)}
              className="w-52"
            />
          </div>

          <DataTable<WarrantyClaim>
            data={filtered ?? []}
            columns={columns}
            loading={isLoading}
            onRowClick={handleRowClick}
            enableRowSelection
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle={t('closeout.warrantyListEmptyTitle')}
            emptyDescription={t('closeout.warrantyListEmptyDescription')}
          />
        </>
      )}
    </div>
  );
};

export default WarrantyClaimListPage;
