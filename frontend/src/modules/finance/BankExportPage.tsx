import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Download,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { FormField, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import type { BankExportRecord } from '@/modules/finance/types';
import type { Payment } from '@/types';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';
import { t } from '@/i18n';

const formatColorMap: Record<string, string> = {
  direct_bank: 'blue',
  csv: 'green',
  standard: 'purple',
};

const formatLabels: Record<string, string> = {
  direct_bank: '1C:DirectBank',
  csv: 'CSV',
  standard: 'Bank-Client',
};

const BankExportPage: React.FC = () => {
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState('direct_bank');
  const [activeTab, setActiveTab] = useState<'select' | 'history'>('select');

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-for-export'],
    queryFn: () => financeApi.getPayments({ page: 0, size: 200 }),
  });

  const { data: exportHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['bank-export-history'],
    queryFn: () => financeApi.getBankExportHistory(),
  });

  const payments = paymentsData?.content ?? [];
  const history = exportHistory ?? [];

  const exportMutation = useMutation({
    mutationFn: () =>
      financeApi.exportBankPayments(selectedPaymentIds, exportFormat),
    onSuccess: (blob) => {
      const ext = exportFormat === 'csv' ? 'csv' : 'xml';
      const fileName = `payment_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('finance.bankExport.toastExported', { fileName }));
      setSelectedPaymentIds([]);
    },
  });

  const handleTogglePayment = useCallback((paymentId: string) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPaymentIds.length === payments.length) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(payments.map((p) => p.id));
    }
  }, [selectedPaymentIds.length, payments]);

  const selectedTotal = useMemo(() => {
    return payments
      .filter((p) => selectedPaymentIds.includes(p.id))
      .reduce((s, p) => s + p.totalAmount, 0);
  }, [payments, selectedPaymentIds]);

  const formatOptions = useMemo(
    () => [
      { value: 'direct_bank', label: t('finance.bankExport.formatDirectBank') },
      { value: 'csv', label: t('finance.bankExport.formatCsv') },
      { value: 'standard', label: t('finance.bankExport.formatStandard') },
    ],
    [],
  );

  const tabs = useMemo(
    () => [
      { id: 'select' as const, label: t('finance.bankExport.selectPayments') },
      {
        id: 'history' as const,
        label: t('finance.bankExport.historyTitle'),
        count: history.length,
      },
    ],
    [history.length],
  );

  const paymentColumns = useMemo<ColumnDef<Payment, unknown>[]>(
    () => [
      {
        id: '__select',
        header: () => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            checked={
              payments.length > 0 && selectedPaymentIds.length === payments.length
            }
            onChange={handleSelectAll}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            checked={selectedPaymentIds.includes(row.original.id)}
            onChange={() => handleTogglePayment(row.original.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'number',
        header: t('finance.bankExport.colPaymentNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'paymentDate',
        header: t('finance.bankExport.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'partnerName',
        header: t('finance.bankExport.colCounterparty'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('finance.bankExport.colAmount'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: t('finance.bankExport.colPurpose'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[220px] block">
            {getValue<string>()}
          </span>
        ),
      },
    ],
    [payments.length, selectedPaymentIds, handleSelectAll, handleTogglePayment],
  );

  const historyColumns = useMemo<ColumnDef<BankExportRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('finance.bankExport.colFileName'),
        size: 250,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-neutral-400 flex-shrink-0" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'format',
        header: t('finance.bankExport.colFormat'),
        size: 140,
        cell: ({ getValue }) => {
          const format = getValue<string>();
          return (
            <StatusBadge
              status={format}
              colorMap={formatColorMap}
              label={formatLabels[format] ?? format}
            />
          );
        },
      },
      {
        accessorKey: 'exportDate',
        header: t('finance.bankExport.colExportDate'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'paymentsCount',
        header: t('finance.bankExport.colPaymentsCount'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('finance.bankExport.colTotalAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.bankExport.title')}
        subtitle={t('finance.bankExport.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.bankExport.breadcrumbFinance'), href: '/invoices' },
          { label: t('finance.bankExport.breadcrumbExport') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'select' | 'history')}
      />

      {activeTab === 'select' && (
        <>
          {/* Export controls */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <FormField label={t('finance.bankExport.exportFormat')}>
                  <Select
                    options={formatOptions}
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">
                    {t('finance.bankExport.selectedCount', {
                      count: String(selectedPaymentIds.length),
                    })}
                  </span>
                  {selectedPaymentIds.length > 0 && (
                    <span className="ml-2 text-neutral-900 dark:text-neutral-100 font-semibold tabular-nums">
                      {t('finance.bankExport.totalSelected', {
                        amount: formatMoney(selectedTotal),
                      })}
                    </span>
                  )}
                </div>
                <Button
                  iconLeft={<Download size={16} />}
                  onClick={() => exportMutation.mutate()}
                  loading={exportMutation.isPending}
                  disabled={selectedPaymentIds.length === 0}
                >
                  {t('finance.bankExport.exportButton')}
                </Button>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <DataTable<Payment>
            data={payments}
            columns={paymentColumns}
            loading={paymentsLoading}
            pageSize={20}
            emptyTitle={t('finance.bankExport.noPaymentsSelected')}
          />
        </>
      )}

      {activeTab === 'history' && (
        <DataTable<BankExportRecord>
          data={history}
          columns={historyColumns}
          loading={historyLoading}
          enableExport
          pageSize={20}
          emptyTitle={t('finance.bankExport.emptyHistory')}
          emptyDescription={t('finance.bankExport.emptyHistoryDescription')}
        />
      )}
    </div>
  );
};

export default BankExportPage;
