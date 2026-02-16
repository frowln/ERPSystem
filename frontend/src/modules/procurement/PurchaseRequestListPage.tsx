import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, X } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  purchaseRequestStatusColorMap,
  purchaseRequestStatusLabels,
  purchaseRequestPriorityColorMap,
  purchaseRequestPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { projectsApi } from '@/api/projects';
import { formatMoney, formatDate } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import type { PurchaseRequest, PurchaseRequestStatus } from '@/types';

type TabId = 'all' | 'my' | 'IN_APPROVAL' | 'IN_WORK' | 'DELIVERED';
type PurchaseRequestPriority = PurchaseRequest['priority'];

const TAB_STATUS_GROUPS: Record<Exclude<TabId, 'all' | 'my'>, PurchaseRequestStatus[]> = {
  IN_APPROVAL: ['SUBMITTED', 'IN_APPROVAL'],
  IN_WORK: ['APPROVED', 'ASSIGNED', 'ORDERED'],
  DELIVERED: ['DELIVERED', 'CLOSED'],
};

const PurchaseRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PurchaseRequestPriority | ''>('');

  const currentUserId = currentUser?.id;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'purchase-request-list'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 300, sort: 'name,asc' }),
  });
  const projects = projectsData?.content ?? [];

  const tabStatusFilter = useMemo<PurchaseRequestStatus[] | undefined>(() => {
    if (activeTab === 'IN_APPROVAL') return TAB_STATUS_GROUPS.IN_APPROVAL;
    if (activeTab === 'IN_WORK') return TAB_STATUS_GROUPS.IN_WORK;
    if (activeTab === 'DELIVERED') return TAB_STATUS_GROUPS.DELIVERED;
    return undefined;
  }, [activeTab]);
  const tabRequestedByFilter = activeTab === 'my' ? currentUserId : undefined;
  const listEnabled = activeTab !== 'my' || Boolean(currentUserId);

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['purchase-requests', 'list', activeTab, projectFilter, priorityFilter, debouncedSearch, currentUserId],
    queryFn: () =>
      procurementApi.getPurchaseRequests({
        page: 0,
        size: 400,
        sort: 'createdAt,desc',
        projectId: projectFilter || undefined,
        priority: priorityFilter || undefined,
        search: debouncedSearch || undefined,
        statuses: tabStatusFilter,
        requestedById: tabRequestedByFilter,
      }),
    enabled: listEnabled,
  });

  const {
    data: countersData,
    refetch: refetchCounters,
  } = useQuery({
    queryKey: ['purchase-requests', 'counters', projectFilter, priorityFilter, debouncedSearch, currentUserId],
    queryFn: () =>
      procurementApi.getPurchaseRequestCounters({
        projectId: projectFilter || undefined,
        priority: priorityFilter || undefined,
        search: debouncedSearch || undefined,
        requestedById: currentUserId || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const requests = listEnabled ? (requestsData?.content ?? []) : [];
  const currentListTotal = requestsData?.totalElements ?? requests.length;
  const tabCounts = {
    all: countersData?.all ?? (activeTab === 'all' ? currentListTotal : 0),
    my: countersData?.my ?? (activeTab === 'my' ? currentListTotal : 0),
    in_approval: countersData?.inApproval ?? (activeTab === 'IN_APPROVAL' ? currentListTotal : 0),
    in_work: countersData?.inWork ?? (activeTab === 'IN_WORK' ? currentListTotal : 0),
    delivered: countersData?.delivered ?? (activeTab === 'DELIVERED' ? currentListTotal : 0),
  };

  const allLabel = t('common.all');

  const projectOptions = useMemo(
    () => [
      { value: '', label: allLabel },
      ...projects.map((project) => ({ value: project.id, label: project.name })),
    ],
    [allLabel, projects],
  );

  const priorityOptions = useMemo(
    () => [
      { value: '', label: allLabel },
      { value: 'LOW', label: purchaseRequestPriorityLabels.LOW ?? 'LOW' },
      { value: 'MEDIUM', label: purchaseRequestPriorityLabels.MEDIUM ?? 'MEDIUM' },
      { value: 'HIGH', label: purchaseRequestPriorityLabels.HIGH ?? 'HIGH' },
      { value: 'CRITICAL', label: purchaseRequestPriorityLabels.CRITICAL ?? 'CRITICAL' },
    ],
    [allLabel],
  );

  const hasActiveFilters = Boolean(search.trim() || projectFilter || priorityFilter);
  const isLoading = listEnabled && isRequestsLoading;
  const isError = listEnabled && isRequestsError;
  const subtitleCount = listEnabled ? currentListTotal : 0;

  const columns = useMemo<ColumnDef<PurchaseRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('procurement.requestList.colNumber'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {row.original.itemCount ?? 0} {t('procurement.requestList.itemsSuffix')}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'requestDate',
        header: t('procurement.requestList.colDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'projectName',
        header: t('procurement.requestList.colProject'),
        size: 180,
        cell: ({ getValue }) => <span className="text-neutral-600">{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: t('procurement.requestList.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={purchaseRequestStatusColorMap}
            label={purchaseRequestStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('procurement.requestList.colPriority'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={purchaseRequestPriorityColorMap}
            label={purchaseRequestPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'requestedByName',
        header: t('procurement.requestList.colRequestedBy'),
        size: 160,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'assignedToName',
        header: t('procurement.requestList.colAssignedTo'),
        size: 150,
        cell: ({ getValue }) => <span className="text-neutral-600">{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.requestList.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="block text-right font-medium tabular-nums">{formatMoney(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (request: PurchaseRequest) => navigate(`/procurement/${request.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('procurement.requestList.title')}
        subtitle={`${subtitleCount} ${t('procurement.requestList.subtitleSuffix')}`}
        breadcrumbs={[
          { label: t('procurement.requestList.breadcrumbHome'), href: '/' },
          { label: t('procurement.requestList.breadcrumbProcurement') },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/procurement/purchase-orders')}
            >
              {t('procurement.purchaseOrders')}
            </Button>
            <Button
              iconLeft={<Plus size={16} />}
              onClick={() => {
                if (guardDemoModeAction(t('procurement.requestList.newRequest'))) return;
                navigate('/procurement/new');
              }}
            >
              {t('procurement.requestList.newRequest')}
            </Button>
          </div>
        )}
        tabs={[
          { id: 'all', label: t('procurement.requestList.tabAll'), count: tabCounts.all },
          { id: 'my', label: t('procurement.requestList.tabMy'), count: tabCounts.my },
          { id: 'IN_APPROVAL', label: t('procurement.requestList.tabInApproval'), count: tabCounts.in_approval },
          { id: 'IN_WORK', label: t('procurement.requestList.tabInWork'), count: tabCounts.in_work },
          { id: 'DELIVERED', label: t('procurement.requestList.tabDelivered'), count: tabCounts.delivered },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 md:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('procurement.requestList.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full min-w-[180px] sm:w-56">
          <Select
            options={projectOptions}
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          />
        </div>
        <div className="w-full min-w-[160px] sm:w-52">
          <Select
            options={priorityOptions}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as PurchaseRequestPriority | '')}
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            iconLeft={<X size={14} />}
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setProjectFilter('');
              setPriorityFilter('');
            }}
          >
            {t('common.reset')}
          </Button>
        )}
      </div>

      {isError ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50/30 dark:border-danger-900 dark:bg-danger-950/20">
          <EmptyState
            variant="ERROR"
            actionLabel={t('common.refresh')}
            onAction={() => {
              void refetchRequests();
              void refetchCounters();
            }}
          />
        </div>
      ) : (
        <DataTable<PurchaseRequest>
          data={requests}
          columns={columns}
          loading={isLoading}
          onRowClick={handleRowClick}
          enableRowSelection
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={hasActiveFilters ? t('empty.noResults') : t('procurement.requestList.emptyTitle')}
          emptyDescription={hasActiveFilters ? t('empty.noResultsDescription') : t('procurement.requestList.emptyDescription')}
        />
      )}
    </div>
  );
};

export default PurchaseRequestListPage;
