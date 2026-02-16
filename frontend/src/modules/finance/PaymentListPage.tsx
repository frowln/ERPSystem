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
  paymentStatusLowerColorMap,
  paymentStatusLowerLabels,
  paymentTypeColorMap,
  paymentTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Payment } from '@/types';

type TabId = 'all' | 'INCOMING' | 'OUTGOING' | 'PENDING';

const PaymentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['PAYMENTS'],
    queryFn: () => financeApi.getPayments(),
  });

  const payments = paymentsData?.content ?? [];

  const filteredPayments = useMemo(() => {
    let filtered = payments ?? [];

    if (activeTab === 'INCOMING') {
      filtered = filtered.filter((p) => p.paymentType === 'INCOMING');
    } else if (activeTab === 'OUTGOING') {
      filtered = filtered.filter((p) => p.paymentType === 'OUTGOING');
    } else if (activeTab === 'PENDING') {
      filtered = filtered.filter((p) => [ 'DRAFT', 'PENDING', 'APPROVED'].includes(p.status));
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.number.toLowerCase().includes(lower) ||
          (p.partnerName ?? '').toLowerCase().includes(lower) ||
          (p.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [payments, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: (payments ?? []).length,
    incoming: (payments ?? []).filter((p) => p.paymentType === 'INCOMING').length,
    outgoing: (payments ?? []).filter((p) => p.paymentType === 'OUTGOING').length,
    pending: (payments ?? []).filter((p) => [ 'DRAFT', 'PENDING', 'APPROVED'].includes(p.status)).length,
  }), [payments]);

  const totalAmount = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    [filteredPayments],
  );

  const columns = useMemo<ColumnDef<Payment, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('finance.paymentList.colNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'paymentDate',
        header: t('finance.paymentList.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('finance.paymentList.colProject'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'partnerName',
        header: t('finance.paymentList.colPartner'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'paymentType',
        header: t('finance.paymentList.colType'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={paymentTypeColorMap}
            label={paymentTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('finance.paymentList.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={paymentStatusLowerColorMap}
            label={paymentStatusLowerLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('finance.paymentList.colAmount'),
        size: 160,
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
    (payment: Payment) => navigate(`/payments/${payment.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.paymentList.title')}
        subtitle={t('finance.paymentList.subtitle', { count: String((payments ?? []).length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.paymentList.breadcrumbFinance') },
          { label: t('finance.paymentList.breadcrumbPayments') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/payments/new')}>
            {t('finance.paymentList.newPayment')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('finance.paymentList.tabAll'), count: tabCounts.all },
          { id: 'INCOMING', label: t('finance.paymentList.tabIncoming'), count: tabCounts.incoming },
          { id: 'OUTGOING', label: t('finance.paymentList.tabOutgoing'), count: tabCounts.outgoing },
          { id: 'PENDING', label: t('finance.paymentList.tabPending'), count: tabCounts.pending },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('finance.paymentList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Payment>
        data={filteredPayments}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('finance.paymentList.emptyTitle')}
        emptyDescription={t('finance.paymentList.emptyDescription')}
      />

      {/* Footer summary */}
      {filteredPayments.length > 0 && (
        <div className="mt-3 flex items-center justify-end px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-2">{t('finance.paymentList.footerTotal')}</span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(totalAmount)}</span>
        </div>
      )}
    </div>
  );
};

export default PaymentListPage;
