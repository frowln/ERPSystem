import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calculator,
  Percent,
  DollarSign,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import type { FactoringCalcResult } from '@/modules/finance/types';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const FactoringCalculatorPage: React.FC = () => {
  const [factoringRate, setFactoringRate] = useState('12');
  const [commissionRate, setCommissionRate] = useState('1.5');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [results, setResults] = useState<FactoringCalcResult[]>([]);

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices-for-factoring'],
    queryFn: () => financeApi.getInvoices({ page: 0, size: 200 }),
  });

  const invoices = invoicesData?.content ?? [];

  const calculateMutation = useMutation({
    mutationFn: () =>
      financeApi.calculateFactoring(
        selectedInvoiceIds,
        parseFloat(factoringRate) || 0,
        parseFloat(commissionRate) || 0,
      ),
    onSuccess: (data) => {
      setResults(data);
      toast.success(
        t('finance.factoringCalculator.toastCalculated', { count: String(data.length) }),
      );
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleToggleInvoice = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId],
    );
  }, []);

  const totals = useMemo(() => {
    const totalFaceValue = results.reduce((s, r) => s + r.faceValue, 0);
    const totalDiscount = results.reduce((s, r) => s + r.discount, 0);
    const totalCommission = results.reduce((s, r) => s + r.commission, 0);
    const netProceeds = results.reduce((s, r) => s + r.netProceeds, 0);
    return { totalFaceValue, totalDiscount, totalCommission, netProceeds };
  }, [results]);

  const resultColumns = useMemo<ColumnDef<FactoringCalcResult, unknown>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: t('finance.factoringCalculator.colInvoice'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'faceValue',
        header: t('finance.factoringCalculator.colFaceValue'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'daysUntilPayment',
        header: t('finance.factoringCalculator.colDays'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'factoringRate',
        header: t('finance.factoringCalculator.colRate'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {getValue<number>().toFixed(1)}%
          </span>
        ),
      },
      {
        accessorKey: 'discount',
        header: t('finance.factoringCalculator.colDiscount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-danger-600">
            -{formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'commission',
        header: t('finance.factoringCalculator.colCommission'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-warning-600">
            -{formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'netProceeds',
        header: t('finance.factoringCalculator.colNetProceeds'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-right block text-success-600">
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
        title={t('finance.factoringCalculator.title')}
        subtitle={t('finance.factoringCalculator.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.factoringCalculator.breadcrumbFinance'), href: '/invoices' },
          { label: t('finance.factoringCalculator.breadcrumbFactoring') },
        ]}
      />

      {/* Parameters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('finance.factoringCalculator.parameters')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <FormField label={t('finance.factoringCalculator.factoringRate')}>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={factoringRate}
              onChange={(e) => setFactoringRate(e.target.value)}
            />
          </FormField>
          <FormField label={t('finance.factoringCalculator.commissionRate')}>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </FormField>
          <div className="flex items-end">
            <Button
              iconLeft={<Calculator size={16} />}
              onClick={() => calculateMutation.mutate()}
              loading={calculateMutation.isPending}
              disabled={selectedInvoiceIds.length === 0}
              fullWidth
            >
              {t('finance.factoringCalculator.calculate')}
            </Button>
          </div>
        </div>

        {/* Invoice selection */}
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          {t('finance.factoringCalculator.selectInvoices')}
        </h4>
        <div className="max-h-[240px] overflow-y-auto space-y-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2">
          {invoices.map((inv) => (
            <label
              key={inv.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                selectedInvoiceIds.includes(inv.id)
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                checked={selectedInvoiceIds.includes(inv.id)}
                onChange={() => handleToggleInvoice(inv.id)}
              />
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {inv.number}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 truncate flex-1">
                {inv.partnerName}
              </span>
              <span className="text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatMoney(inv.totalAmount)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Metrics */}
      {results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<DollarSign size={18} />}
              label={t('finance.factoringCalculator.totalFaceValue')}
              value={formatMoney(totals.totalFaceValue)}
            />
            <MetricCard
              icon={<TrendingDown size={18} />}
              label={t('finance.factoringCalculator.totalDiscount')}
              value={formatMoney(totals.totalDiscount)}
            />
            <MetricCard
              icon={<Percent size={18} />}
              label={t('finance.factoringCalculator.totalCommission')}
              value={formatMoney(totals.totalCommission)}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('finance.factoringCalculator.netProceeds')}
              value={formatMoney(totals.netProceeds)}
            />
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('finance.factoringCalculator.comparison')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* With factoring */}
              <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-4">
                <h4 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-3">
                  {t('finance.factoringCalculator.withFactoring')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t('finance.factoringCalculator.totalFaceValue')}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatMoney(totals.totalFaceValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t('finance.factoringCalculator.totalDiscount')}
                    </span>
                    <span className="font-medium text-danger-600 tabular-nums">
                      -{formatMoney(totals.totalDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t('finance.factoringCalculator.totalCommission')}
                    </span>
                    <span className="font-medium text-warning-600 tabular-nums">
                      -{formatMoney(totals.totalCommission)}
                    </span>
                  </div>
                  <div className="border-t border-primary-200 dark:border-primary-800 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {t('finance.factoringCalculator.netProceeds')}
                    </span>
                    <span className="font-bold text-success-600 tabular-nums">
                      {formatMoney(totals.netProceeds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Without factoring */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                  {t('finance.factoringCalculator.withoutFactoring')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t('finance.factoringCalculator.totalFaceValue')}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatMoney(totals.totalFaceValue)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {t('finance.factoringCalculator.netProceeds')}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatMoney(totals.totalFaceValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {t('finance.factoringCalculator.savings')}
                    </span>
                    <span className="font-medium text-danger-600 tabular-nums">
                      -{formatMoney(totals.totalDiscount + totals.totalCommission)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('finance.factoringCalculator.results')}
          </h3>
          <DataTable<FactoringCalcResult>
            data={results}
            columns={resultColumns}
            enableExport
            pageSize={20}
            emptyTitle={t('finance.factoringCalculator.emptyTitle')}
            emptyDescription={t('finance.factoringCalculator.emptyDescription')}
          />
        </>
      )}

      {results.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Calculator
            size={48}
            className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4"
          />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
            {t('finance.factoringCalculator.emptyTitle')}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('finance.factoringCalculator.emptyDescription')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FactoringCalculatorPage;
