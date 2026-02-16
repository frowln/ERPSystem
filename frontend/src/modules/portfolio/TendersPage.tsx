import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileSearch, DollarSign, Clock, Award } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BidPackage } from './types';

const bidStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  SHORTLISTED: 'cyan',
  AWARDED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'gray',
};

const bidStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Подан',
  UNDER_REVIEW: 'На рассмотрении',
  SHORTLISTED: 'В шорт-листе',
  AWARDED: 'Выигран',
  REJECTED: 'Отклонён',
  WITHDRAWN: 'Отозван',
};

type TabId = 'all' | 'ACTIVE' | 'AWARDED' | 'REJECTED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'SUBMITTED', label: 'Подан' },
  { value: 'UNDER_REVIEW', label: 'На рассмотрении' },
  { value: 'SHORTLISTED', label: 'В шорт-листе' },
  { value: 'AWARDED', label: 'Выигран' },
  { value: 'REJECTED', label: 'Отклонён' },
];

const TendersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: bidData, isLoading } = useQuery({
    queryKey: ['bid-packages'],
    queryFn: () => portfolioApi.getBidPackages(),
  });

  const bids = bidData?.content ?? [];

  const filtered = useMemo(() => {
    let result = bids;
    if (activeTab === 'ACTIVE') {
      result = result.filter((b) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status));
    } else if (activeTab === 'AWARDED') {
      result = result.filter((b) => b.status === 'AWARDED');
    } else if (activeTab === 'REJECTED') {
      result = result.filter((b) => ['REJECTED', 'WITHDRAWN'].includes(b.status));
    }
    if (statusFilter) {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bidNumber.toLowerCase().includes(lower) ||
          b.projectName.toLowerCase().includes(lower) ||
          b.clientName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [bids, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: bids.length,
    active: bids.filter((b) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status)).length,
    awarded: bids.filter((b) => b.status === 'AWARDED').length,
    rejected: bids.filter((b) => ['REJECTED', 'WITHDRAWN'].includes(b.status)).length,
  }), [bids]);

  const metrics = useMemo(() => {
    const totalAmount = bids.reduce((s, b) => s + b.amount, 0);
    const awardedAmount = bids.filter((b) => b.status === 'AWARDED').reduce((s, b) => s + b.amount, 0);
    const winRate = bids.filter((b) => ['AWARDED', 'REJECTED'].includes(b.status)).length > 0
      ? Math.round(
          (bids.filter((b) => b.status === 'AWARDED').length /
            bids.filter((b) => ['AWARDED', 'REJECTED'].includes(b.status)).length) *
            100,
        )
      : 0;
    const pendingCount = bids.filter((b) => ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status)).length;
    return { totalAmount, awardedAmount, winRate, pendingCount };
  }, [bids]);

  const columns = useMemo<ColumnDef<BidPackage, unknown>[]>(
    () => [
      {
        accessorKey: 'bidNumber',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: 'Проект',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.projectName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.clientName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={bidStatusColorMap}
            label={bidStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Сумма предложения',
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'evaluationScore',
        header: 'Оценка',
        size: 100,
        cell: ({ getValue }) => {
          const score = getValue<number | undefined>();
          if (!score) return <span className="text-neutral-400">---</span>;
          return (
            <span className={cn(
              'text-sm font-medium tabular-nums',
              score >= 80 ? 'text-success-600' : score >= 60 ? 'text-warning-600' : 'text-danger-600',
            )}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'responsibleName',
        header: 'Ответственный',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'submissionDeadline',
        header: 'Дедлайн',
        size: 120,
        cell: ({ row }) => {
          const deadline = row.original.submissionDeadline;
          const isOverdue = new Date(deadline) < new Date() && !['AWARDED', 'REJECTED', 'WITHDRAWN'].includes(row.original.status) && !row.original.submittedDate;
          return (
            <span className={cn(
              'tabular-nums text-xs',
              isOverdue ? 'text-danger-600 font-medium' : 'text-neutral-600',
            )}>
              {formatDate(deadline)}
            </span>
          );
        },
      },
      {
        accessorKey: 'submittedDate',
        header: 'Подан',
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return val ? (
            <span className="tabular-nums text-neutral-600 text-xs">{formatDate(val)}</span>
          ) : (
            <span className="text-neutral-400 text-xs">---</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Тендеры"
        subtitle={`${bids.length} тендерных предложений`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Портфель' },
          { label: 'Тендеры' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/portfolio/tenders/new')}>
            Новое предложение
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Активные', count: tabCounts.active },
          { id: 'AWARDED', label: 'Выигранные', count: tabCounts.awarded },
          { id: 'REJECTED', label: 'Отклонённые', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileSearch size={18} />} label="Всего тендеров" value={bids.length} />
        <MetricCard icon={<DollarSign size={18} />} label="Общий объём" value={formatMoneyCompact(metrics.totalAmount)} />
        <MetricCard icon={<Award size={18} />} label="Win Rate" value={`${metrics.winRate}%`} />
        <MetricCard icon={<Clock size={18} />} label="На рассмотрении" value={metrics.pendingCount} subtitle="тендеров" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, проекту, клиенту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<BidPackage>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет тендерных предложений"
        emptyDescription="Создайте первое тендерное предложение"
      />
    </div>
  );
};

export default TendersPage;
