import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/i18n';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import {
  StatusBadge,
  contractStatusColorMap,
  contractStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { contractsApi } from '@/api/contracts';
import { projectsApi } from '@/api/projects';
import { formatMoney, formatDate } from '@/lib/format';
import { guardDemoModeAction, isDemoMode } from '@/lib/demoMode';
import ContractDirectionTabs, { type ContractDirectionFilter } from './ContractDirectionTabs';
import type { Contract } from '@/types';

type TabId = 'all' | 'DRAFT' | 'ON_APPROVAL' | 'SIGNED' | 'ACTIVE' | 'CLOSED';

const contractTypeOptions = [
  { value: '', label: t('contracts.list.typeAll') },
  { value: 'Генподряд', label: t('contracts.list.typeGeneral') },
  { value: 'Субподряд', label: t('contracts.list.typeSubcontract') },
  { value: 'Поставка', label: t('contracts.list.typeSupply') },
  { value: 'Проектирование', label: t('contracts.list.typeDesign') },
  { value: 'Услуги', label: t('contracts.list.typeServices') },
];

const ContractListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [directionFilter, setDirectionFilter] = useState<ContractDirectionFilter>('ALL');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pendingCancellation, setPendingCancellation] = useState<{ ids: string[]; names: string[] } | null>(null);

  const deleteContractsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await contractsApi.changeContractStatus(id, 'CANCELLED');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['CONTRACTS'] });
    },
  });

  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['CONTRACTS'],
    queryFn: () => contractsApi.getContracts({ size: 500 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['PROJECTS', 'all'],
    queryFn: () => projectsApi.getProjects({ size: 500 }),
  });

  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of (projectsData?.content ?? [])) {
      map.set(p.id, p.name);
    }
    return map;
  }, [projectsData]);

  const contracts = useMemo(() => {
    const content = contractsData?.content ?? [];
    return content.map((c) => ({
      ...c,
      projectName: c.projectName ?? (c.projectId ? projectNameMap.get(c.projectId) : undefined),
    }));
  }, [contractsData, projectNameMap]);

  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    if (activeTab === 'DRAFT') {
      filtered = filtered.filter((c) => c.status === 'DRAFT');
    } else if (activeTab === 'ON_APPROVAL') {
      filtered = filtered.filter((c) => [ 'ON_APPROVAL', 'LAWYER_APPROVED', 'MANAGEMENT_APPROVED', 'FINANCE_APPROVED'].includes(c.status));
    } else if (activeTab === 'SIGNED') {
      filtered = filtered.filter((c) => c.status === 'SIGNED');
    } else if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((c) => c.status === 'ACTIVE');
    } else if (activeTab === 'CLOSED') {
      filtered = filtered.filter((c) => c.status === 'CLOSED');
    }

    if (directionFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.direction === directionFilter || c.contractDirection === directionFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((c) => c.typeName === typeFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.number.toLowerCase().includes(lower) ||
          c.partnerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [contracts, activeTab, directionFilter, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: contracts.length,
    draft: contracts.filter((c) => c.status === 'DRAFT').length,
    on_approval: contracts.filter((c) => [ 'ON_APPROVAL', 'LAWYER_APPROVED', 'MANAGEMENT_APPROVED', 'FINANCE_APPROVED'].includes(c.status)).length,
    signed: contracts.filter((c) => c.status === 'SIGNED').length,
    active: contracts.filter((c) => c.status === 'ACTIVE').length,
    closed: contracts.filter((c) => c.status === 'CLOSED').length,
  }), [contracts]);

  const totalAmount = useMemo(
    () => filteredContracts.reduce((sum, c) => sum + c.totalWithVat, 0),
    [filteredContracts],
  );

  const columns = useMemo<ColumnDef<Contract, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('contracts.list.colNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('contracts.list.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.partnerName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'partnerName',
        header: t('contracts.list.colPartner'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('contracts.list.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '\u2014'}</span>
        ),
      },
      {
        accessorKey: 'typeName',
        header: t('contracts.list.colType'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '\u2014'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('contracts.list.colStatus'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={contractStatusColorMap}
            label={contractStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalWithVat',
        header: t('contracts.list.colAmount'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'plannedEndDate',
        header: t('contracts.list.colEndDate'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (contract: Contract) => navigate(`/contracts/${contract.id}`),
    [navigate],
  );

  const handleBulkCancelRequest = useCallback((rows: Contract[]) => {
    setPendingCancellation({
      ids: rows.map((row) => row.id),
      names: rows.map((row) => row.name),
    });
  }, []);

  const handleConfirmBulkCancel = useCallback(() => {
    if (!pendingCancellation || pendingCancellation.ids.length === 0) return;
    if (guardDemoModeAction(t('contracts.list.demoCancelContracts'))) {
      setPendingCancellation(null);
      return;
    }

    deleteContractsMutation.mutate(pendingCancellation.ids, {
      onSettled: () => {
        setPendingCancellation(null);
      },
    });
  }, [deleteContractsMutation, pendingCancellation]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('contracts.title')}
        subtitle={t('contracts.list.subtitle', { count: String(contracts.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('contracts.title') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              if (guardDemoModeAction(t('contracts.list.demoCreateContract'))) return;
              navigate('/contracts/new');
            }}
          >
            {t('contracts.list.newContract')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('contracts.list.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('contracts.list.tabDraft'), count: tabCounts.draft },
          { id: 'ON_APPROVAL', label: t('contracts.list.tabOnApproval'), count: tabCounts.on_approval },
          { id: 'SIGNED', label: t('contracts.list.tabSigned'), count: tabCounts.signed },
          { id: 'ACTIVE', label: t('contracts.list.tabActive'), count: tabCounts.active },
          { id: 'CLOSED', label: t('contracts.list.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Direction + Filters */}
      <div className="flex items-center gap-3 mb-4">
        <ContractDirectionTabs value={directionFilter} onChange={setDirectionFilter} />
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('contracts.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={contractTypeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<Contract>
        data={filteredContracts}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('contracts.list.bulkCancel'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: (rows) => {
              handleBulkCancelRequest(rows);
            },
          },
        ]}
        emptyTitle={t('contracts.list.emptyTitle')}
        emptyDescription={t('contracts.list.emptyDescription')}
      />

      {/* Footer summary */}
      {filteredContracts.length > 0 && (
        <div className="mt-3 flex items-center justify-end px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-2">{t('contracts.list.footerTotal')}</span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(totalAmount)}</span>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingCancellation}
        onClose={() => {
          if (deleteContractsMutation.isPending) return;
          setPendingCancellation(null);
        }}
        onConfirm={handleConfirmBulkCancel}
        title={t('contracts.list.confirmCancelTitle')}
        description={t('contracts.list.confirmCancelDesc', { count: String(pendingCancellation?.ids.length ?? 0) })}
        confirmLabel={t('contracts.list.confirmCancelButton')}
        cancelLabel={t('contracts.list.confirmCancelCancel')}
        loading={deleteContractsMutation.isPending}
        items={pendingCancellation?.names}
      />
    </div>
  );
};

export default ContractListPage;
