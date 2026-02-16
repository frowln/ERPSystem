import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { selfEmployedApi } from './api';
import { formatMoney, formatDate } from '@/lib/format';
import type { SelfEmployedPayment, PaymentStatus } from './types';
import { t } from '@/i18n';

const statusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  PAID: 'green',
  CANCELLED: 'red',
  RECEIPT_ISSUED: 'blue',
};

const getStatusLabels = (): Record<PaymentStatus, string> => ({
  DRAFT: t('selfEmployed.payments.statusDraft'),
  PENDING: t('selfEmployed.payments.statusPending'),
  PAID: t('selfEmployed.payments.statusPaid'),
  CANCELLED: t('selfEmployed.payments.statusCancelled'),
  RECEIPT_ISSUED: t('selfEmployed.payments.statusReceiptIssued'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('selfEmployed.payments.statusAll') },
  { value: 'DRAFT', label: t('selfEmployed.payments.statusDraft') },
  { value: 'PENDING', label: t('selfEmployed.payments.statusPending') },
  { value: 'PAID', label: t('selfEmployed.payments.statusPaid') },
  { value: 'RECEIPT_ISSUED', label: t('selfEmployed.payments.statusReceiptIssued') },
  { value: 'CANCELLED', label: t('selfEmployed.payments.statusCancelled') },
];

const PaymentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['self-employed-payments'],
    queryFn: () => selfEmployedApi.getPayments(),
  });

  const payments = (paymentsData?.content && paymentsData.content.length > 0)
    ? paymentsData.content
    : [];

  const filtered = useMemo(() => {
    let result = payments;
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.contractorName.toLowerCase().includes(lower) ||
          p.serviceDescription.toLowerCase().includes(lower) ||
          p.receiptNumber?.includes(search),
      );
    }
    return result;
  }, [payments, statusFilter, search]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, p) => sum + p.amount, 0),
    [filtered],
  );

  const columns = useMemo<ColumnDef<SelfEmployedPayment, unknown>[]>(
    () => [
      {
        accessorKey: 'contractorName',
        header: t('selfEmployed.payments.colContractor'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.contractorName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">{row.original.contractorInn}</p>
          </div>
        ),
      },
      {
        accessorKey: 'serviceDescription',
        header: t('selfEmployed.payments.colService'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('selfEmployed.payments.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'serviceDate',
        header: t('selfEmployed.payments.colServiceDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('selfEmployed.payments.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<PaymentStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'receiptNumber',
        header: t('selfEmployed.payments.colReceiptNumber'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>() ?? '---'}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('selfEmployed.payments.title')}
        subtitle={t('selfEmployed.payments.subtitle', { count: String(payments.length) })}
        backTo="/self-employed"
        breadcrumbs={[
          { label: t('selfEmployed.payments.breadcrumbHome'), href: '/' },
          { label: t('selfEmployed.payments.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: t('selfEmployed.payments.breadcrumbPayments') },
        ]}
        actions={
          <Button onClick={() => navigate('/self-employed')}>
            {t('selfEmployed.payments.toContractors')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('selfEmployed.payments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<SelfEmployedPayment>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('selfEmployed.payments.emptyTitle')}
        emptyDescription={t('selfEmployed.payments.emptyDescription')}
      />

      {filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-end px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-2">{t('selfEmployed.payments.totalLabel')}</span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(totalAmount)}</span>
        </div>
      )}
    </div>
  );
};

export default PaymentListPage;
