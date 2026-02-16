import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Scale, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  legalCaseStatusColorMap,
  legalCaseStatusLabels,
  legalCaseTypeColorMap,
  legalCaseTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { legalApi } from '@/api/legal';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import type { LegalCase } from './types';
import type { PaginatedResponse } from '@/types';

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'OPEN', label: 'Открыто' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'ON_HOLD', label: 'Приостановлено' },
  { value: 'RESOLVED', label: 'Решено' },
  { value: 'CLOSED', label: 'Закрыто' },
  { value: 'APPEAL', label: 'Апелляция' },
];

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'LITIGATION', label: 'Судебное' },
  { value: 'ARBITRATION', label: 'Арбитраж' },
  { value: 'CLAIM', label: 'Претензия' },
  { value: 'CONSULTATION', label: 'Консультация' },
  { value: 'CONTRACT_DISPUTE', label: 'Договорной спор' },
  { value: 'REGULATORY', label: 'Регуляторное' },
];


const LegalCaseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: caseData, isLoading } = useQuery<PaginatedResponse<LegalCase>>({
    queryKey: ['legal-cases'],
    queryFn: () => legalApi.getCases(),
  });

  const cases = caseData?.content ?? [];

  const filteredCases = useMemo(() => {
    let filtered = cases;
    if (activeTab !== 'all') {
      filtered = filtered.filter((c) => c.status === activeTab);
    }
    if (typeFilter) {
      filtered = filtered.filter((c) => c.caseType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.number.toLowerCase().includes(lower) ||
          c.title.toLowerCase().includes(lower) ||
          (c.opposingParty ?? '').toLowerCase().includes(lower) ||
          (c.assignedLawyerName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [cases, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: cases.length,
    open: cases.filter((c) => c.status === 'OPEN').length,
    in_progress: cases.filter((c) => c.status === 'IN_PROGRESS').length,
    resolved: cases.filter((c) => c.status === 'RESOLVED').length,
    closed: cases.filter((c) => c.status === 'CLOSED').length,
  }), [cases]);

  const metrics = useMemo(() => {
    const active = cases.filter((c) => [ 'OPEN', 'IN_PROGRESS', 'APPEAL'].includes(c.status)).length;
    const totalClaimAmount = cases.reduce((s, c) => s + (c.claimAmount ?? 0), 0);
    const totalResolved = cases.reduce((s, c) => s + (c.resolvedAmount ?? 0), 0);
    return { total: cases.length, active, totalClaimAmount, totalResolved };
  }, [cases]);

  const columns = useMemo<ColumnDef<LegalCase, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Дело',
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.title}</p>
            {row.original.opposingParty && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Сторона: {row.original.opposingParty}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalCaseStatusColorMap}
            label={legalCaseStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'caseType',
        header: 'Тип',
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalCaseTypeColorMap}
            label={legalCaseTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'claimAmount',
        header: 'Сумма иска',
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={`tabular-nums text-sm font-medium ${val ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {val ? formatMoneyCompact(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedLawyerName',
        header: 'Юрист',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'hearingDate',
        header: 'Заседание',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Создано',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (legalCase: LegalCase) => navigate(`/legal/cases/${legalCase.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Юридические дела"
        subtitle={`${cases.length} дел`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Юридический отдел' },
          { label: 'Дела' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/legal/cases/new')}>
            Новое дело
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },
          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },
          { id: 'RESOLVED', label: 'Решённые', count: tabCounts.resolved },
          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Scale size={18} />} label="Всего дел" value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label="Активные" value={metrics.active} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Сумма исков" value={formatMoneyCompact(metrics.totalClaimAmount)} />
        <MetricCard icon={<DollarSign size={18} />} label="Урегулировано" value={formatMoneyCompact(metrics.totalResolved)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, названию, стороне..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<LegalCase>
        data={filteredCases}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет юридических дел"
        emptyDescription="Создайте первое дело для начала работы"
      />
    </div>
  );
};

export default LegalCaseListPage;
