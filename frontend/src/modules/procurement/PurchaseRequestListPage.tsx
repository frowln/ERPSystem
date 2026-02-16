import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  purchaseRequestStatusColorMap,
  purchaseRequestStatusLabels,
  purchaseRequestPriorityColorMap,
  purchaseRequestPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { formatMoney, formatDate } from '@/lib/format';
import { guardDemoModeAction, isDemoMode } from '@/lib/demoMode';
import { t } from '@/i18n';
import type { PurchaseRequest } from '@/types';

type TabId = 'all' | 'my' | 'IN_APPROVAL' | 'IN_WORK' | 'DELIVERED';

const PurchaseRequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: prData, isLoading } = useQuery({
    queryKey: ['purchase-requests'],
    queryFn: () => procurementApi.getPurchaseRequests(),
  });

  const requests = useMemo(() => {
    const content = prData?.content ?? [];
    if (content.length > 0) return content;
    return [];
  }, [prData]);

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab === 'my') {
      filtered = filtered.filter((r) => r.requestedByName === 'Петрова М.И.');
    } else if (activeTab === 'IN_APPROVAL') {
      filtered = filtered.filter((r) => ['SUBMITTED', 'IN_APPROVAL'].includes(r.status));
    } else if (activeTab === 'IN_WORK') {
      filtered = filtered.filter((r) => ['APPROVED', 'ASSIGNED', 'ORDERED'].includes(r.status));
    } else if (activeTab === 'DELIVERED') {
      filtered = filtered.filter((r) => ['DELIVERED', 'CLOSED'].includes(r.status));
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          (r.projectName ?? '').toLowerCase().includes(lower) ||
          r.requestedByName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [requests, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    my: requests.filter((r) => r.requestedByName === 'Петрова М.И.').length,
    in_approval: requests.filter((r) => ['SUBMITTED', 'IN_APPROVAL'].includes(r.status)).length,
    in_work: requests.filter((r) => ['APPROVED', 'ASSIGNED', 'ORDERED'].includes(r.status)).length,
    delivered: requests.filter((r) => ['DELIVERED', 'CLOSED'].includes(r.status)).length,
  }), [requests]);

  const columns = useMemo<ColumnDef<PurchaseRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('procurement.requestList.colNumber'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.itemCount} {t('procurement.requestList.items')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'requestDate',
        header: t('procurement.requestList.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('procurement.requestList.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
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
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: t('procurement.requestList.colAssignedTo'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('procurement.requestList.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (pr: PurchaseRequest) => navigate(`/procurement/${pr.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('procurement.requestList.title')}
        subtitle={`${requests.length} ${t('procurement.requestList.subtitleRequests')}`}
        breadcrumbs={[
          { label: t('procurement.requestList.breadcrumbHome'), href: '/' },
          { label: t('procurement.requestList.breadcrumbPurchaseRequests') },
        ]}
        actions={
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
                if (guardDemoModeAction('Создание заявки')) return;
                navigate('/procurement/new');
              }}
            >
              {t('procurement.requestList.newRequest')}
            </Button>
          </div>
        }
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

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('procurement.requestList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<PurchaseRequest>
        data={filteredRequests}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('procurement.requestList.emptyTitle')}
        emptyDescription={t('procurement.requestList.emptyDescription')}
      />
    </div>
  );
};

export default PurchaseRequestListPage;
