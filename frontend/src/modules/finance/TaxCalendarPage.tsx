import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Bell,
  BellOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Select } from '@/design-system/components/FormField';
import { Button } from '@/design-system/components/Button';
import { financeApi } from '@/api/finance';
import type { TaxDeadline } from '@/modules/finance/types';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const taxStatusColorMap: Record<string, string> = {
  upcoming: 'blue',
  overdue: 'red',
  paid: 'green',
};

const TaxCalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState('');

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['tax-deadlines'],
    queryFn: () => financeApi.getTaxDeadlines(),
  });

  const allDeadlines = deadlines ?? [];

  const toggleNotification = useMutation({
    mutationFn: ({ taxId, enabled }: { taxId: string; enabled: boolean }) =>
      financeApi.toggleTaxNotification(taxId, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tax-deadlines'] });
      const deadline = allDeadlines.find((d) => d.id === variables.taxId);
      if (variables.enabled) {
        toast.success(
          t('finance.taxCalendar.toastNotifyOn', { tax: deadline?.taxType ?? '' }),
        );
      } else {
        toast.success(
          t('finance.taxCalendar.toastNotifyOff', { tax: deadline?.taxType ?? '' }),
        );
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // Get unique tax types for filter
  const taxTypes = useMemo(() => {
    const types = new Set(allDeadlines.map((d) => d.taxType));
    return Array.from(types).sort();
  }, [allDeadlines]);

  const taxTypeOptions = useMemo(() => {
    return [
      { value: '', label: t('finance.taxCalendar.allTypes') },
      ...taxTypes.map((type) => ({ value: type, label: type })),
    ];
  }, [taxTypes]);

  // Filter deadlines
  const filteredDeadlines = useMemo(() => {
    let items = allDeadlines;
    if (activeTab !== 'all') {
      items = items.filter((d) => d.status === activeTab);
    }
    if (filterType) {
      items = items.filter((d) => d.taxType === filterType);
    }
    return items;
  }, [allDeadlines, activeTab, filterType]);

  // Metrics
  const metrics = useMemo(() => {
    const upcoming = allDeadlines.filter((d) => d.status === 'upcoming').length;
    const overdue = allDeadlines.filter((d) => d.status === 'overdue').length;
    const totalAmount = allDeadlines
      .filter((d) => d.status !== 'paid')
      .reduce((s, d) => s + d.amount, 0);

    const upcomingDeadlines = allDeadlines
      .filter((d) => d.status === 'upcoming')
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    const nextDeadline = upcomingDeadlines[0]?.deadline;

    return { upcoming, overdue, totalAmount, nextDeadline };
  }, [allDeadlines]);

  const tabs = useMemo(
    () => [
      {
        id: 'all',
        label: t('finance.taxCalendar.tabAll'),
        count: allDeadlines.length,
      },
      {
        id: 'upcoming',
        label: t('finance.taxCalendar.tabUpcoming'),
        count: allDeadlines.filter((d) => d.status === 'upcoming').length,
      },
      {
        id: 'overdue',
        label: t('finance.taxCalendar.tabOverdue'),
        count: allDeadlines.filter((d) => d.status === 'overdue').length,
      },
      {
        id: 'paid',
        label: t('finance.taxCalendar.tabPaid'),
        count: allDeadlines.filter((d) => d.status === 'paid').length,
      },
    ],
    [allDeadlines],
  );

  const statusLabels: Record<string, string> = {
    upcoming: t('finance.taxCalendar.statusUpcoming'),
    overdue: t('finance.taxCalendar.statusOverdue'),
    paid: t('finance.taxCalendar.statusPaid'),
  };

  const columns = useMemo<ColumnDef<TaxDeadline, unknown>[]>(
    () => [
      {
        accessorKey: 'taxType',
        header: t('finance.taxCalendar.colTaxType'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'deadline',
        header: t('finance.taxCalendar.colDeadline'),
        size: 130,
        cell: ({ getValue, row }) => {
          const val = getValue<string>();
          const isOverdue = row.original.status === 'overdue';
          return (
            <span
              className={cn(
                'font-medium',
                isOverdue ? 'text-danger-600' : 'text-neutral-900 dark:text-neutral-100',
              )}
            >
              {formatDate(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: t('finance.taxCalendar.colAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('finance.taxCalendar.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <StatusBadge
              status={status}
              colorMap={taxStatusColorMap}
              label={statusLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'description',
        header: t('finance.taxCalendar.colDescription'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[250px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'notify',
        header: t('finance.taxCalendar.colNotify'),
        size: 120,
        cell: ({ row }) => {
          const deadline = row.original;
          if (deadline.status === 'paid') return null;
          return (
            <button
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors',
                deadline.notifyEnabled
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                  : 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700',
              )}
              onClick={() =>
                toggleNotification.mutate({
                  taxId: deadline.id,
                  enabled: !deadline.notifyEnabled,
                })
              }
              title={
                deadline.notifyEnabled
                  ? t('finance.taxCalendar.notifyEnabled')
                  : t('finance.taxCalendar.notifyDisabled')
              }
            >
              {deadline.notifyEnabled ? <Bell size={14} /> : <BellOff size={14} />}
              {deadline.notifyEnabled
                ? t('finance.taxCalendar.notifyEnabled')
                : t('finance.taxCalendar.notifyDisabled')}
            </button>
          );
        },
      },
    ],
    [statusLabels, toggleNotification],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.taxCalendar.title')}
        subtitle={t('finance.taxCalendar.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.taxCalendar.breadcrumbFinance'), href: '/invoices' },
          { label: t('finance.taxCalendar.breadcrumbTax') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="w-48">
            <Select
              options={taxTypeOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder={t('finance.taxCalendar.filterByType')}
            />
          </div>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Clock size={18} />}
          label={t('finance.taxCalendar.upcomingTaxes')}
          value={String(metrics.upcoming)}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('finance.taxCalendar.overdueTaxes')}
          value={String(metrics.overdue)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('finance.taxCalendar.totalAmount')}
          value={formatMoney(metrics.totalAmount)}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('finance.taxCalendar.nextDeadline')}
          value={metrics.nextDeadline ? formatDate(metrics.nextDeadline) : '--'}
        />
      </div>

      {/* Table */}
      <DataTable<TaxDeadline>
        data={filteredDeadlines}
        columns={columns}
        loading={isLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('finance.taxCalendar.emptyTitle')}
        emptyDescription={t('finance.taxCalendar.emptyDescription')}
      />
    </div>
  );
};

export default TaxCalendarPage;
