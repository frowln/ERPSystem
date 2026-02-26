import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Link2,
  FileText,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import type { BankTransaction } from '@/modules/finance/types';
import { formatMoney, formatDate, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const bankTxStatusColorMap: Record<string, string> = {
  matched: 'blue',
  unmatched: 'yellow',
  confirmed: 'green',
  rejected: 'red',
};

const BankStatementMatchingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [manualMatchOpen, setManualMatchOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  const { data: invoices } = useQuery({
    queryKey: ['invoices-for-matching'],
    queryFn: () => financeApi.getInvoices({ page: 0, size: 200 }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => financeApi.uploadBankStatement(file),
    onSuccess: (data) => {
      setTransactions(data);
      toast.success(t('finance.bankStatementMatching.toastUploaded', { count: String(data.length) }));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ txId, invId }: { txId: string; invId: string }) =>
      financeApi.confirmMatch(txId, invId),
    onSuccess: (_data, variables) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === variables.txId ? { ...tx, status: 'confirmed' as const } : tx,
        ),
      );
      toast.success(t('finance.bankStatementMatching.toastConfirmed'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (txId: string) => financeApi.rejectMatch(txId),
    onSuccess: (_data, txId) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId ? { ...tx, status: 'rejected' as const } : tx,
        ),
      );
      toast.success(t('finance.bankStatementMatching.toastRejected'));
    },
  });

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadMutation.mutate(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadMutation],
  );

  const handleManualMatch = useCallback(
    (txId: string) => {
      setSelectedTxId(txId);
      setSelectedInvoiceId('');
      setManualMatchOpen(true);
    },
    [],
  );

  const handleConfirmManualMatch = useCallback(() => {
    if (!selectedTxId || !selectedInvoiceId) return;
    const invoice = invoices?.content.find((inv) => inv.id === selectedInvoiceId);
    confirmMutation.mutate({ txId: selectedTxId, invId: selectedInvoiceId });
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === selectedTxId
          ? {
              ...tx,
              matchedInvoiceId: selectedInvoiceId,
              matchedInvoiceNumber: invoice?.number ?? selectedInvoiceId,
              matchConfidence: 100,
              status: 'confirmed' as const,
            }
          : tx,
      ),
    );
    setManualMatchOpen(false);
    toast.success(t('finance.bankStatementMatching.toastManualMatched'));
  }, [selectedTxId, selectedInvoiceId, invoices, confirmMutation]);

  const metrics = useMemo(() => {
    const total = transactions.length;
    const autoMatched = transactions.filter(
      (tx) => tx.status === 'matched' || tx.status === 'confirmed',
    ).length;
    const unmatched = transactions.filter((tx) => tx.status === 'unmatched').length;
    const matchedAmount = transactions
      .filter((tx) => tx.status === 'matched' || tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { total, autoMatched, unmatched, matchedAmount };
  }, [transactions]);

  const columns = useMemo<ColumnDef<BankTransaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('finance.bankStatementMatching.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-neutral-900 dark:text-neutral-100">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'counterparty',
        header: t('finance.bankStatementMatching.colCounterparty'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('finance.bankStatementMatching.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: t('finance.bankStatementMatching.colPurpose'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[220px] block">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'matchedInvoiceNumber',
        header: t('finance.bankStatementMatching.colMatchedInvoice'),
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return val ? (
            <span className="text-primary-600 dark:text-primary-400 font-medium">{val}</span>
          ) : (
            <span className="text-neutral-400">--</span>
          );
        },
      },
      {
        accessorKey: 'matchConfidence',
        header: t('finance.bankStatementMatching.colConfidence'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<number | undefined>();
          if (val == null) return <span className="text-neutral-400">--</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    val >= 80
                      ? 'bg-success-500'
                      : val >= 50
                        ? 'bg-warning-500'
                        : 'bg-danger-500',
                  )}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
                {formatPercent(val)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('finance.bankStatementMatching.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const labels: Record<string, string> = {
            matched: t('finance.bankStatementMatching.statusMatched'),
            unmatched: t('finance.bankStatementMatching.statusUnmatched'),
            confirmed: t('finance.bankStatementMatching.statusConfirmed'),
            rejected: t('finance.bankStatementMatching.statusRejected'),
          };
          return (
            <StatusBadge
              status={status}
              colorMap={bankTxStatusColorMap}
              label={labels[status] ?? status}
            />
          );
        },
      },
      {
        id: 'actions',
        header: t('finance.bankStatementMatching.colActions'),
        size: 180,
        cell: ({ row }) => {
          const tx = row.original;
          if (tx.status === 'confirmed' || tx.status === 'rejected') return null;
          return (
            <div className="flex items-center gap-1">
              {tx.status === 'matched' && tx.matchedInvoiceId && (
                <>
                  <Button
                    size="xs"
                    variant="success"
                    iconLeft={<CheckCircle2 size={14} />}
                    onClick={() =>
                      confirmMutation.mutate({
                        txId: tx.id,
                        invId: tx.matchedInvoiceId!,
                      })
                    }
                  >
                    {t('finance.bankStatementMatching.actionConfirm')}
                  </Button>
                  <Button
                    size="xs"
                    variant="danger"
                    iconLeft={<XCircle size={14} />}
                    onClick={() => rejectMutation.mutate(tx.id)}
                  >
                    {t('finance.bankStatementMatching.actionReject')}
                  </Button>
                </>
              )}
              {tx.status === 'unmatched' && (
                <Button
                  size="xs"
                  variant="outline"
                  iconLeft={<Link2 size={14} />}
                  onClick={() => handleManualMatch(tx.id)}
                >
                  {t('finance.bankStatementMatching.actionManualMatch')}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [confirmMutation, rejectMutation, handleManualMatch],
  );

  const invoiceOptions = useMemo(() => {
    return (invoices?.content ?? []).map((inv) => ({
      value: inv.id,
      label: `${inv.number} -- ${inv.partnerName} -- ${formatMoney(inv.totalAmount)}`,
    }));
  }, [invoices]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.bankStatementMatching.title')}
        subtitle={t('finance.bankStatementMatching.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.bankStatementMatching.breadcrumbFinance'), href: '/invoices' },
          { label: t('finance.bankStatementMatching.breadcrumbMatching') },
        ]}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xml"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              iconLeft={<Upload size={16} />}
              loading={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('finance.bankStatementMatching.uploadFile')}
            </Button>
          </>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileText size={18} />}
          label={t('finance.bankStatementMatching.totalTransactions')}
          value={String(metrics.total)}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label={t('finance.bankStatementMatching.autoMatched')}
          value={String(metrics.autoMatched)}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('finance.bankStatementMatching.unmatched')}
          value={String(metrics.unmatched)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('finance.bankStatementMatching.matchedAmount')}
          value={formatMoney(metrics.matchedAmount)}
        />
      </div>

      {/* Table */}
      <DataTable<BankTransaction>
        data={transactions}
        columns={columns}
        loading={uploadMutation.isPending}
        enableExport
        pageSize={20}
        emptyTitle={t('finance.bankStatementMatching.emptyTitle')}
        emptyDescription={t('finance.bankStatementMatching.emptyDescription')}
      />

      {/* Manual Match Modal */}
      <Modal
        open={manualMatchOpen}
        onClose={() => setManualMatchOpen(false)}
        title={t('finance.bankStatementMatching.manualMatchTitle')}
        description={t('finance.bankStatementMatching.manualMatchDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualMatchOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmManualMatch}
              disabled={!selectedInvoiceId}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <FormField label={t('finance.bankStatementMatching.selectInvoice')} required>
          <Select
            options={invoiceOptions}
            placeholder={t('finance.bankStatementMatching.selectInvoice')}
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
          />
        </FormField>
      </Modal>
    </div>
  );
};

export default BankStatementMatchingPage;
