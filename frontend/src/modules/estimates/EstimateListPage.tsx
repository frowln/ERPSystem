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
import type { Estimate, LocalEstimate } from '@/types';
import { t } from '@/i18n';

type TabId = 'all' | 'DRAFT' | 'IN_WORK' | 'ACTIVE' | 'LSR';

/* Unified row type for merged display */
interface UnifiedEstimateRow {
  id: string;
  name: string;
  projectName?: string;
  specificationName?: string;
  status: string;
  totalAmount: number;
  totalSpent: number;
  orderedAmount: number;
  variancePercent: number;
  createdAt: string;
  isLocal: boolean;
}

const localStatusColorMap: Record<string, string> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  APPROVED: 'success',
  ARCHIVED: 'warning',
};

const localStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  CALCULATED: 'Рассчитана',
  APPROVED: 'Утверждена',
  ARCHIVED: 'В архиве',
};

function mapEstimateToRow(e: Estimate): UnifiedEstimateRow {
  return {
    id: e.id,
    name: e.name,
    projectName: e.projectName,
    specificationName: e.specificationName,
    status: e.status,
    totalAmount: e.totalAmount,
    totalSpent: e.totalSpent,
    orderedAmount: e.orderedAmount,
    variancePercent: e.variancePercent,
    createdAt: e.createdAt,
    isLocal: false,
  };
}

function mapLocalEstimateToRow(le: LocalEstimate): UnifiedEstimateRow {
  return {
    id: le.id,
    name: le.name,
    projectName: le.objectName,
    specificationName: undefined,
    status: le.status,
    totalAmount: le.totalWithVat,
    totalSpent: 0,
    orderedAmount: 0,
    variancePercent: 0,
    createdAt: le.createdAt,
    isLocal: true,
  };
}

const EstimateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const { data: estimatesData, isLoading } = useQuery({
    queryKey: ['estimates', projectIdFilter],
    queryFn: () => estimatesApi.getEstimates({
      projectId: projectIdFilter || undefined,
      size: 500,
    }),
  });

  const { data: localEstimatesData, isLoading: isLoadingLocal } = useQuery({
    queryKey: ['local-estimates', projectIdFilter],
    queryFn: () => estimatesApi.getLocalEstimates({
      projectId: projectIdFilter || undefined,
      size: 500,
    }),
  });

  const regularEstimates = estimatesData?.content ?? [];
  const localEstimates = localEstimatesData?.content ?? [];

  const allRows = useMemo(() => {
    const regular = regularEstimates.map(mapEstimateToRow);
    const local = localEstimates.map(mapLocalEstimateToRow);
    return [...regular, ...local].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [regularEstimates, localEstimates]);

  const filteredRows = useMemo(() => {
    let filtered = allRows;

    if (activeTab === 'LSR') {
      filtered = filtered.filter((r) => r.isLocal);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          (r.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [allRows, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: allRows.length,
    draft: allRows.filter((r) => r.status === 'DRAFT').length,
    in_work: allRows.filter((r) => r.status === 'IN_WORK').length,
    active: allRows.filter((r) => r.status === 'ACTIVE').length,
    lsr: localEstimates.length,
  }), [allRows, localEstimates]);

  const columns = useMemo<ColumnDef<UnifiedEstimateRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('estimates.list.colName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
              {row.original.isLocal && (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  {t('estimates.list.badgeLsr')}
                </span>
              )}
            </div>
            {row.original.specificationName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specificationName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('estimates.list.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('estimates.list.colStatus'),
        size: 130,
        cell: ({ row }) => {
          const status = row.original.status;
          if (row.original.isLocal) {
            return (
              <StatusBadge
                status={status}
                colorMap={localStatusColorMap}
                label={localStatusLabels[status] ?? status}
              />
            );
          }
          return (
            <StatusBadge
              status={status}
              colorMap={estimateStatusColorMap}
              label={estimateStatusLabels[status] ?? status}
            />
          );
        },
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
          const ordered = row.original.orderedAmount ?? 0;
          const spent = row.original.totalSpent ?? 0;
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
      {
        accessorKey: 'createdAt',
        header: t('estimates.list.colCreatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (row: UnifiedEstimateRow) => {
      if (row.isLocal) {
        navigate(`/estimates/${row.id}/normative`);
      } else {
        navigate(`/estimates/${row.id}`);
      }
    },
    [navigate],
  );

  const loading = isLoading || isLoadingLocal;

  if (loading && allRows.length === 0) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.list.title')}
        subtitle={t('estimates.list.subtitle', { count: String(allRows.length) })}
        breadcrumbs={[
          { label: t('estimates.list.breadcrumbHome'), href: '/' },
          { label: t('estimates.list.breadcrumbEstimates') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<FileUp size={16} />}
              onClick={() => navigate(projectIdFilter ? `/estimates/import-lsr?projectId=${projectIdFilter}` : '/estimates/import-lsr')}
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
          { id: 'LSR', label: t('estimates.list.tabLsr'), count: tabCounts.lsr },
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
      <DataTable<UnifiedEstimateRow>
        data={filteredRows}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('estimates.list.emptyTitle')}
        emptyDescription={t('estimates.list.emptyDescription')}
      />

    </div>
  );
};

export default EstimateListPage;
