import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, FileUp, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  estimateStatusColorMap,
  estimateStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatDate, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { guardDemoModeAction } from '@/lib/demoMode';
import type { Estimate } from '@/types';
import { t } from '@/i18n';
import { EstimateImportWizard } from './EstimateImportWizard';

type TabId = 'all' | 'DRAFT' | 'IN_WORK' | 'ACTIVE';

const EstimateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const { data: estimatesData, isLoading } = useQuery({
    queryKey: ['estimates', projectIdFilter],
    queryFn: () => estimatesApi.getEstimates({
      projectId: projectIdFilter || undefined,
      size: 500,
    }),
  });

  const estimates = estimatesData?.content ?? [];

  const filteredEstimates = useMemo(() => {
    let filtered = estimates;

    if (activeTab !== 'all') {
      filtered = filtered.filter((e) => e.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          (e.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [estimates, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: estimates.length,
    draft: estimates.filter((e) => e.status === 'DRAFT').length,
    in_work: estimates.filter((e) => e.status === 'IN_WORK').length,
    active: estimates.filter((e) => e.status === 'ACTIVE').length,
  }), [estimates]);

  const columns = useMemo<ColumnDef<Estimate, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('estimates.list.colName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specificationName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('estimates.list.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'specificationName',
        header: t('estimates.list.colSpecification'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('estimates.list.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={estimateStatusColorMap}
            label={estimateStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('estimates.list.colPlan'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'totalSpent',
        header: t('estimates.list.colFact'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'variancePercent',
        header: t('estimates.list.colVariance'),
        size: 120,
        cell: ({ getValue, row }) => {
          const val = getValue<number>();
          const ordered = (row.original as any).orderedAmount ?? 0;
          const spent = (row.original as any).totalSpent ?? 0;
          // When nothing ordered/spent yet, show "—" instead of misleading "+100%"
          if (ordered === 0 && spent === 0) {
            return <span className="text-neutral-400 dark:text-neutral-500">—</span>;
          }
          if (val === 0) {
            return <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">0,0%</span>;
          }
          return (
            <span className={cn(
              'font-medium tabular-nums',
              val > 0 ? 'text-success-600' : 'text-danger-600',
            )}>
              {val > 0 ? '+' : ''}{formatPercent(val)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (estimate: Estimate) => navigate(`/estimates/${estimate.id}`),
    [navigate],
  );

  if (isLoading && estimates.length === 0) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.list.title')}
        subtitle={t('estimates.list.subtitle', { count: String(estimates.length) })}
        breadcrumbs={[
          { label: t('estimates.list.breadcrumbHome'), href: '/' },
          { label: t('estimates.list.breadcrumbEstimates') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<FileUp size={16} />}
              onClick={() => setImportWizardOpen(true)}
            >
              {t('estimates.list.importLsrButton')}
            </Button>
            <Button
              iconLeft={<Plus size={16} />}
              onClick={() => {
                if (guardDemoModeAction(t('estimates.list.demoCreate'))) return;
                navigate(projectIdFilter ? `/estimates/new?projectId=${projectIdFilter}` : '/estimates/new');
              }}
            >
              {t('estimates.list.createButton')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('estimates.list.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('estimates.list.tabDraft'), count: tabCounts.draft },
          { id: 'IN_WORK', label: t('estimates.list.tabInWork'), count: tabCounts.in_work },
          { id: 'ACTIVE', label: t('estimates.list.tabActive'), count: tabCounts.active },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('estimates.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Estimate>
        data={filteredEstimates}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('estimates.list.emptyTitle')}
        emptyDescription={t('estimates.list.emptyDescription')}
        emptyActionLabel={t('estimates.list.emptyActionLabel')}
        onEmptyAction={() => navigate('/estimates/new')}
      />

      <EstimateImportWizard open={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  );
};

export default EstimateListPage;
