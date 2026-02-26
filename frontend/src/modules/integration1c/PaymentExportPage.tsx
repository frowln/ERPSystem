import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CreditCard,
  Download,
  Loader2,
  FileText,
  Wallet,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDateTime, formatMoney } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type { PaymentOrder, ExportRecord } from './types';

type TabId = 'payments' | 'history';

const PaymentExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('payments');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: payments = [] } = useQuery({
    queryKey: ['1c-payment-orders'],
    queryFn: async () => {
      try {
        return await integration1cApi.getPaymentOrders();
      } catch {
        return [];
      }
    },
  });

  const { data: exportHistory = [] } = useQuery({
    queryKey: ['1c-payment-export-history'],
    queryFn: async () => {
      try {
        return (await integration1cApi.getExportHistory()).filter(
          (r) => r.type === 'payment',
        );
      } catch {
        return [];
      }
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => integration1cApi.exportPaymentOrders(selectedIds, 'xml'),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_export_${Date.now()}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('integration1c.exportSuccess'));
      setSelectedIds([]);
    },
    onError: () => toast.error(t('integration1c.exportError')),
  });

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === payments.length ? [] : payments.map((p) => p.id),
    );
  }, [payments]);

  // Calculate total selected amount
  const totalSelectedAmount = useMemo(() => {
    return payments
      .filter((p) => selectedIds.includes(p.id))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, selectedIds]);

  const paymentColumns = useMemo<ColumnDef<PaymentOrder, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={selectedIds.length === payments.length && payments.length > 0}
            onChange={handleSelectAll}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
        size: 40,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => handleToggle(row.original.id)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
      },
      {
        accessorKey: 'number',
        header: t('integration1c.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('integration1c.colDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'payee',
        header: t('integration1c.colPayee'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: t('integration1c.colPurpose'),
        size: 260,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate block max-w-[260px]">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('integration1c.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={{ approved: 'green', draft: 'gray', pending: 'yellow', rejected: 'red' }}
          />
        ),
      },
    ],
    [selectedIds, payments, handleSelectAll, handleToggle],
  );

  const historyColumns = useMemo<ColumnDef<ExportRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('integration1c.colFileName'),
        size: 200,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'recordsCount',
        header: t('integration1c.colRecords'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'format',
        header: t('integration1c.colFormat'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs uppercase text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 100,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={{ success: 'green', failed: 'red' }}
            label={getValue<string>() === 'success' ? t('integration1c.statusSuccess') : t('integration1c.statusFailed')}
          />
        ),
      },
      {
        accessorKey: 'exportDate',
        header: t('integration1c.colExportDate'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.paymentExportTitle')}
        subtitle={t('integration1c.paymentExportSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.paymentExportTitle') },
        ]}
        backTo="/settings/1c"
        tabs={[
          { id: 'payments', label: t('integration1c.tabPayments'), count: payments.length },
          { id: 'history', label: t('integration1c.tabHistory'), count: exportHistory.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<CreditCard size={16} />}
          label={t('integration1c.metricTotalPayments')}
          value={payments.length}
        />
        <MetricCard
          icon={<Wallet size={16} />}
          label={t('integration1c.metricSelectedAmount')}
          value={formatMoney(totalSelectedAmount)}
        />
        <MetricCard
          icon={<Calendar size={16} />}
          label={t('integration1c.metricLastExport')}
          value={exportHistory.length > 0 ? formatDateTime(exportHistory[0].exportDate) : '--'}
        />
      </div>

      {/* Export controls */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                XML (DirectBank)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 size={14} className="text-primary-500" />
              {t('integration1c.selectedCount', { count: String(selectedIds.length) })}
            </div>
            <div className="ml-auto">
              <Button
                iconLeft={exportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                onClick={() => exportMutation.mutate()}
                disabled={selectedIds.length === 0 || exportMutation.isPending}
              >
                {t('integration1c.exportToDirectBank')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tables */}
      {activeTab === 'payments' && (
        <DataTable<PaymentOrder>
          data={payments}
          columns={paymentColumns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={20}
          emptyTitle={t('integration1c.emptyPaymentsTitle')}
          emptyDescription={t('integration1c.emptyPaymentsDescription')}
        />
      )}

      {activeTab === 'history' && (
        <DataTable<ExportRecord>
          data={exportHistory}
          columns={historyColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integration1c.emptyHistoryTitle')}
          emptyDescription={t('integration1c.emptyHistoryDescription')}
        />
      )}
    </div>
  );
};

export default PaymentExportPage;
