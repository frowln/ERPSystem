/**
 * Unified issues page combining:
 * - Defects (/defects)
 * - Punch list items (/punchlist)
 * - Quality non-conformances (/quality)
 *
 * This provides a single view with type filters, addressing audit item M14.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ChevronDown, Bug, ListChecks, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { TableSkeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { defectsApi, type Defect } from '@/api/defects';
import { qualityApi, type NonConformance } from '@/api/quality';
import { punchlistApi } from '@/api/punchlist';
import type { PunchItem } from '@/modules/punchlist/types';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Unified row type
// ---------------------------------------------------------------------------

type IssueType = 'DEFECT' | 'PUNCH' | 'NCR';

interface UnifiedIssue {
  id: string;
  type: IssueType;
  code: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  assignee: string;
  date: string;
  dueDate: string;
  project: string;
}

// ---------------------------------------------------------------------------
// Type badge config
// ---------------------------------------------------------------------------

const typeColorMap: Record<IssueType, 'red' | 'yellow' | 'purple'> = {
  DEFECT: 'red',
  PUNCH: 'yellow',
  NCR: 'purple',
};

const getTypeLabels = (): Record<IssueType, string> => ({
  DEFECT: t('issues.hub.types.defect'),
  PUNCH: t('issues.hub.types.punchlist'),
  NCR: t('issues.hub.types.ncr'),
});

// ---------------------------------------------------------------------------
// Status color helper
// ---------------------------------------------------------------------------

const statusColor = (s: string): 'yellow' | 'blue' | 'green' | 'gray' | 'red' => {
  const upper = s.toUpperCase();
  if (['OPEN', 'PLANNED'].includes(upper)) return 'yellow';
  if (['IN_PROGRESS', 'READY_FOR_REVIEW'].includes(upper)) return 'blue';
  if (['FIXED', 'VERIFIED', 'RESOLVED', 'CLOSED', 'APPROVED', 'COMPLETED'].includes(upper)) return 'green';
  if (['REJECTED'].includes(upper)) return 'red';
  return 'gray';
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = 'all' | 'DEFECT' | 'PUNCH' | 'NCR';

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeDefect(d: Defect): UnifiedIssue {
  return {
    id: d.id,
    type: 'DEFECT',
    code: d.code,
    description: d.title,
    location: d.location ?? '',
    priority: d.severity,
    status: d.status,
    assignee: d.assignedToId ?? '—',
    date: d.createdAt,
    dueDate: d.fixDeadline ?? '',
    project: d.projectId ?? '',
  };
}

function normalizePunchItem(p: PunchItem): UnifiedIssue {
  return {
    id: p.id,
    type: 'PUNCH',
    code: p.number,
    description: p.title,
    location: p.location ?? '',
    priority: p.priority,
    status: p.status,
    assignee: p.assignedToName ?? '—',
    date: p.createdAt,
    dueDate: p.dueDate ?? '',
    project: p.projectName ?? '',
  };
}

function normalizeNCR(n: NonConformance): UnifiedIssue {
  return {
    id: n.id,
    type: 'NCR',
    code: n.number,
    description: n.description,
    location: '',
    priority: n.severity,
    status: n.status,
    assignee: n.assignedTo ?? '—',
    date: n.createdAt,
    dueDate: n.dueDate ?? '',
    project: n.qualityCheckId ?? '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UnifiedIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // ---- Data fetching ----
  const { data: defectsData, isLoading: loadingDefects } = useQuery({
    queryKey: ['unified-issues-defects'],
    queryFn: () => defectsApi.getDefects({ size: 200 }),
  });

  const { data: punchListsData } = useQuery({
    queryKey: ['unified-issues-punch-lists'],
    queryFn: () => punchlistApi.getPunchLists({ size: 50 }),
  });
  const firstPunchListId = punchListsData?.content?.[0]?.id ?? '';

  const { data: punchItems, isLoading: loadingPunch } = useQuery<PunchItem[]>({
    queryKey: ['unified-issues-punch-items', firstPunchListId],
    queryFn: () => punchlistApi.getPunchItems(firstPunchListId),
    enabled: !!firstPunchListId,
  });

  const { data: ncrData, isLoading: loadingNcr } = useQuery({
    queryKey: ['unified-issues-ncr'],
    queryFn: () => qualityApi.getNonConformances({ size: 200 }),
  });

  const isLoading = loadingDefects || loadingPunch || loadingNcr;

  // ---- Unified items ----
  const allItems = useMemo<UnifiedIssue[]>(() => {
    const defects = (defectsData?.content ?? []).map(normalizeDefect);
    const punches = (punchItems ?? []).map(normalizePunchItem);
    const ncrs = (ncrData?.content ?? []).map(normalizeNCR);
    return [...defects, ...punches, ...ncrs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [defectsData, punchItems, ncrData]);

  // ---- Filtering ----
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((i) => i.type === activeTab);
    if (filterStatus) items = items.filter((i) => i.status === filterStatus);
    if (filterSeverity) items = items.filter((i) => i.priority.toUpperCase() === filterSeverity);
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.code.toLowerCase().includes(lower) ||
          i.description.toLowerCase().includes(lower) ||
          i.assignee.toLowerCase().includes(lower) ||
          i.location.toLowerCase().includes(lower) ||
          i.project.toLowerCase().includes(lower),
      );
    }
    return items;
  }, [allItems, activeTab, filterStatus, filterSeverity, search]);

  // ---- Unique statuses & severities for filter dropdowns ----
  const uniqueStatuses = useMemo(() => [...new Set(allItems.map((i) => i.status))].sort(), [allItems]);
  const uniqueSeverities = useMemo(() => [...new Set(allItems.map((i) => i.priority.toUpperCase()))].sort(), [allItems]);

  // ---- Tab counts ----
  const tabCounts = useMemo(
    () => ({
      all: allItems.length,
      defects: allItems.filter((i) => i.type === 'DEFECT').length,
      punch: allItems.filter((i) => i.type === 'PUNCH').length,
      ncr: allItems.filter((i) => i.type === 'NCR').length,
    }),
    [allItems],
  );

  // ---- Columns ----
  const columns = useMemo<ColumnDef<UnifiedIssue, unknown>[]>(() => {
    const typeLabels = getTypeLabels();
    return [
      {
        accessorKey: 'code',
        header: t('issues.hub.colNumber'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('issues.hub.colType'),
        size: 140,
        cell: ({ getValue }) => {
          const tp = getValue<IssueType>();
          return (
            <StatusBadge
              status={tp}
              colorMap={typeColorMap}
              label={typeLabels[tp]}
            />
          );
        },
      },
      {
        accessorKey: 'description',
        header: t('issues.hub.colTitle'),
        size: 280,
        cell: ({ getValue }) => (
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">
            {getValue<string>()}
          </p>
        ),
      },
      {
        accessorKey: 'location',
        header: t('issues.hub.colLocation'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm truncate max-w-[130px]">
            {getValue<string>() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: t('issues.hub.colSeverity'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const upper = val.toUpperCase();
          const colorMap: Record<string, 'gray' | 'yellow' | 'red'> = {
            LOW: 'gray',
            MINOR: 'gray',
            MEDIUM: 'yellow',
            MAJOR: 'yellow',
            HIGH: 'red',
            CRITICAL: 'red',
          };
          return (
            <StatusBadge
              status={upper}
              colorMap={colorMap}
              label={val}
            />
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('issues.hub.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <StatusBadge
              status={val}
              colorMap={{ [val]: statusColor(val) }}
              label={val}
            />
          );
        },
      },
      {
        accessorKey: 'assignee',
        header: t('issues.hub.colAssignee'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('issues.hub.colCreated'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('issues.hub.colDue'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <span className="tabular-nums text-xs text-neutral-600 dark:text-neutral-400">
              {val ? formatDate(val) : '—'}
            </span>
          );
        },
      },
    ];
  }, []);

  // ---- Row click ----
  const handleRowClick = useCallback(
    (row: UnifiedIssue) => {
      switch (row.type) {
        case 'DEFECT':
          navigate(`/defects/${row.id}`);
          break;
        case 'PUNCH':
          navigate(`/punchlist/items/${row.id}`);
          break;
        case 'NCR':
          navigate(`/quality`);
          break;
      }
    },
    [navigate],
  );

  // ---- Loading ----
  if (isLoading && allItems.length === 0) {
    return (
      <>
        <PageHeader title={t('issues.hub.title')} />
        <TableSkeleton rows={8} />
      </>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('issues.hub.title')}
        subtitle={t('issues.hub.mergedCount', { count: String(allItems.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.title'), href: '/quality' },
          { label: t('issues.hub.title') },
        ]}
        actions={
          <div className="flex gap-2">
            {/* Create dropdown */}
            <div className="relative">
              <Button
                iconLeft={<Plus size={16} />}
                onClick={() => setCreateOpen(!createOpen)}
              >
                {t('common.create')}
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {createOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg py-1 animate-fade-in">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/defects/new');
                    }}
                  >
                    <Bug size={14} className="text-red-500" />
                    {t('issues.hub.types.defect')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/punchlist/items/new');
                    }}
                  >
                    <ListChecks size={14} className="text-amber-500" />
                    {t('issues.hub.types.punchlist')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/quality/new');
                    }}
                  >
                    <ShieldAlert size={14} className="text-purple-500" />
                    {t('issues.hub.types.ncr')}
                  </button>
                </div>
              )}
            </div>
          </div>
        }
        tabs={[
          { id: 'all', label: t('issues.hub.allIssues'), count: tabCounts.all },
          { id: 'DEFECT', label: t('issues.hub.types.defect'), count: tabCounts.defects },
          { id: 'PUNCH', label: t('issues.hub.types.punchlist'), count: tabCounts.punch },
          { id: 'NCR', label: t('issues.hub.types.ncr'), count: tabCounts.ncr },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-40">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            placeholder={t('issues.hub.filterStatus')}
            options={[
              { value: '', label: t('issues.hub.filterStatus') },
              ...uniqueStatuses.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            placeholder={t('issues.hub.filterSeverity')}
            options={[
              { value: '', label: t('issues.hub.filterSeverity') },
              ...uniqueSeverities.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<Bug size={18} className="text-red-500" />}
          label={t('issues.hub.types.defect')}
          count={tabCounts.defects}
          color="red"
        />
        <SummaryCard
          icon={<ListChecks size={18} className="text-amber-500" />}
          label={t('issues.hub.types.punchlist')}
          count={tabCounts.punch}
          color="amber"
        />
        <SummaryCard
          icon={<ShieldAlert size={18} className="text-purple-500" />}
          label={t('issues.hub.types.ncr')}
          count={tabCounts.ncr}
          color="purple"
        />
      </div>

      {/* Table */}
      <DataTable<UnifiedIssue>
        data={filteredItems}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        onRowClick={handleRowClick}
        emptyTitle={t('issues.hub.emptyTitle')}
        emptyDescription={t('issues.hub.emptyDescription')}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Summary card mini component
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'red' | 'amber' | 'purple';
}

const colorBg: Record<string, string> = {
  red: 'bg-red-50 dark:bg-red-950/30',
  amber: 'bg-amber-50 dark:bg-amber-950/30',
  purple: 'bg-purple-50 dark:bg-purple-950/30',
};

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, count, color }) => (
  <div
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700',
      colorBg[color],
    )}
  >
    {icon}
    <div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="text-xl font-semibold text-neutral-900 dark:text-white">{count}</p>
    </div>
  </div>
);

export default UnifiedIssuesPage;
