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
  invoiceStatusColorMap,
  invoiceStatusLabels,
  invoiceTypeColorMap,
  invoiceTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Invoice } from '@/types';

type TabId = 'all' | 'ISSUED' | 'RECEIVED' | 'OVERDUE';

const InvoiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['INVOICES'],
    queryFn: () => financeApi.getInvoices(),
  });

  const invoices = invoicesData?.content ?? [];

  const filteredInvoices = useMemo(() => {
    let filtered = invoices ?? [];

    if (activeTab === 'ISSUED') {
      filtered = filtered.filter((i) => i.invoiceType === 'ISSUED');
    } else if (activeTab === 'RECEIVED') {
      filtered = filtered.filter((i) => i.invoiceType === 'RECEIVED');
    } else if (activeTab === 'OVERDUE') {
      filtered = filtered.filter((i) => i.status === 'OVERDUE');
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.number.toLowerCase().includes(lower) ||
          i.partnerName.toLowerCase().includes(lower) ||
          (i.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [invoices, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: (invoices ?? []).length,
    issued: (invoices ?? []).filter((i) => i.invoiceType === 'ISSUED').length,
    received: (invoices ?? []).filter((i) => i.invoiceType === 'RECEIVED').length,
    overdue: (invoices ?? []).filter((i) => i.status === 'OVERDUE').length,
  }), [invoices]);

  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('finance.invoiceList.colNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'invoiceDate',
        header: t('finance.invoiceList.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'partnerName',
        header: t('finance.invoiceList.colPartner'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'invoiceType',
        header: t('finance.invoiceList.colType'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={invoiceTypeColorMap}
            label={invoiceTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('finance.invoiceList.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={invoiceStatusColorMap}
            label={invoiceStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('finance.invoiceList.colAmount'),
        size: 150,
        cell: ({ row }) => (
          <span className={cn(
            'font-medium tabular-nums text-right block',
            row.original.status === 'OVERDUE' && 'text-danger-600',
          )}>
            {formatMoney(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'paidAmount',
        header: t('finance.invoiceList.colPaid'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-success-600">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'remainingAmount',
        header: t('finance.invoiceList.colRemaining'),
        size: 150,
        cell: ({ row }) => (
          <span className={cn(
            'tabular-nums text-right block',
            row.original.status === 'OVERDUE' ? 'text-danger-600 font-medium' : 'text-neutral-600',
          )}>
            {formatMoney(row.original.remainingAmount)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (invoice: Invoice) => navigate(`/invoices/${invoice.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.invoiceList.title')}
        subtitle={t('finance.invoiceList.subtitle', { count: String((invoices ?? []).length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.invoiceList.breadcrumbFinance') },
          { label: t('finance.invoiceList.breadcrumbInvoices') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/invoices/new')}>
            {t('finance.invoiceList.newInvoice')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('finance.invoiceList.tabAll'), count: tabCounts.all },
          { id: 'ISSUED', label: t('finance.invoiceList.tabIssued'), count: tabCounts.issued },
          { id: 'RECEIVED', label: t('finance.invoiceList.tabReceived'), count: tabCounts.received },
          { id: 'OVERDUE', label: t('finance.invoiceList.tabOverdue'), count: tabCounts.overdue },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('finance.invoiceList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Invoice>
        data={filteredInvoices}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('finance.invoiceList.emptyTitle')}
        emptyDescription={t('finance.invoiceList.emptyDescription')}
      />
    </div>
  );
};

export default InvoiceListPage;
