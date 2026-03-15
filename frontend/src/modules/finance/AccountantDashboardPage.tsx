import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { financeApi } from '@/api/finance';
import { closingApi } from '@/api/closing';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

const invoiceStatusColorMap: Record<string, string> = {
  PAID: 'green',
  CLOSED: 'green',
  OVERDUE: 'red',
  REJECTED: 'red',
  CANCELLED: 'red',
  PARTIALLY_PAID: 'yellow',
  SENT: 'blue',
  APPROVED: 'blue',
  ON_APPROVAL: 'blue',
  NEW: 'gray',
  DRAFT: 'gray',
  UNDER_REVIEW: 'yellow',
};

const paymentStatusColorMap: Record<string, string> = {
  COMPLETED: 'green',
  CONFIRMED: 'green',
  PENDING: 'yellow',
  DRAFT: 'gray',
  REJECTED: 'red',
  FAILED: 'red',
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const AccountantDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: invoicesData, isLoading: invLoading, isError: invError } = useQuery({
    queryKey: ['invoices', 'accountant-dashboard'],
    queryFn: () => financeApi.getInvoices({ size: 500 }),
  });

  const { data: paymentsData, isLoading: payLoading, isError: payError } = useQuery({
    queryKey: ['payments', 'accountant-dashboard'],
    queryFn: () => financeApi.getPayments({ size: 200 }),
  });

  const { data: ks2Data } = useQuery({
    queryKey: ['ks2', 'accountant-dashboard'],
    queryFn: () => closingApi.getKs2Documents({ size: 500 }),
  });

  const { data: ks3Data } = useQuery({
    queryKey: ['ks3', 'accountant-dashboard'],
    queryFn: () => closingApi.getKs3Documents({ size: 500 }),
  });

  const invoices = invoicesData?.content ?? [];
  const payments = paymentsData?.content ?? [];
  const ks2List = ks2Data?.content ?? [];
  const ks3List = ks3Data?.content ?? [];

  const kpis = useMemo(() => {
    const today = new Date();
    const closedStatuses = ['CLOSED', 'PAID', 'CANCELLED'];

    const unpaid = invoices.filter((inv) => !closedStatuses.includes(inv.status)).length;

    const unmatchedPayments = payments.filter((p) => p.status === 'PENDING' || p.status === 'DRAFT').length;

    // KS-2 without KS-3: count KS-2 docs whose project+contract pair has no KS-3
    const ks3ProjectContracts = new Set(
      ks3List.map((ks3) => `${ks3.projectId}__${ks3.contractId}`),
    );
    const ks2WithoutKs3 = ks2List.filter(
      (ks2) => !ks3ProjectContracts.has(`${ks2.projectId}__${ks2.contractId}`),
    ).length;

    const overdue = invoices.filter((inv) => {
      if (!inv.dueDate || closedStatuses.includes(inv.status)) return false;
      return new Date(inv.dueDate) < today;
    }).length;

    return { unpaid, unmatchedPayments, ks2WithoutKs3, overdue };
  }, [invoices, payments, ks2List, ks3List]);

  const unpaidInvoices = useMemo(() => {
    const closedStatuses = ['CLOSED', 'PAID', 'CANCELLED'];
    return invoices
      .filter((inv) => !closedStatuses.includes(inv.status))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 20);
  }, [invoices]);

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 10);
  }, [payments]);

  if ((invLoading || payLoading) && invoices.length === 0 && payments.length === 0) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (invError && payError) {
    return (
      <>
        <PageHeader title={t('finance.accountantDashboard.title')} />
        <EmptyState variant="ERROR" title={t('errors.generic')} description={t('errors.serverErrorRetry')} />
      </>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.accountantDashboard.title')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.title'), href: '/budgets' },
          { label: t('finance.accountantDashboard.title') },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<Receipt size={18} />}
          label={t('finance.accountantDashboard.unpaidInvoices')}
          value={kpis.unpaid}
          trend={kpis.unpaid > 0 ? { direction: 'down', value: String(kpis.unpaid) } : undefined}
        />
        <MetricCard
          icon={<CreditCard size={18} />}
          label={t('finance.accountantDashboard.unmatchedPayments')}
          value={kpis.unmatchedPayments}
        />
        <MetricCard
          icon={<FileCheck size={18} />}
          label={t('finance.accountantDashboard.ks2WithoutKs3')}
          value={kpis.ks2WithoutKs3}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('finance.accountantDashboard.overdueInvoices')}
          value={kpis.overdue}
          trend={kpis.overdue > 0 ? { direction: 'down', value: String(kpis.overdue) } : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Unpaid Invoices Table */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('finance.accountantDashboard.unpaidInvoices')}
          </h2>
          {unpaidInvoices.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('finance.accountantDashboard.noUnpaidInvoices')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colNumber')}</th>
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colPartner')}</th>
                    <th className="text-right py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colAmount')}</th>
                    <th className="text-right py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colRemaining')}</th>
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colDueDate')}</th>
                    <th className="text-left py-2 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <td className="py-2 pr-3 text-primary-600 dark:text-primary-400 font-medium">{inv.number}</td>
                      <td className="py-2 pr-3 text-neutral-900 dark:text-neutral-100 truncate max-w-[160px]">{inv.partnerName}</td>
                      <td className="py-2 pr-3 text-right text-neutral-900 dark:text-neutral-100">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-2 pr-3 text-right text-neutral-900 dark:text-neutral-100">{formatCurrency(inv.remainingAmount)}</td>
                      <td className={cn('py-2 pr-3', inv.dueDate && new Date(inv.dueDate) < new Date() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-900 dark:text-neutral-100')}>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={inv.status} colorMap={invoiceStatusColorMap} label={inv.statusDisplayName ?? inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Payments Table */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('finance.accountantDashboard.recentPayments')}
          </h2>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('finance.accountantDashboard.noRecentPayments')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colNumber')}</th>
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colDate')}</th>
                    <th className="text-right py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colAmount')}</th>
                    <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colType')}</th>
                    <th className="text-left py-2 font-medium text-neutral-600 dark:text-neutral-400">{t('finance.accountantDashboard.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((pay) => (
                    <tr
                      key={pay.id}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <td className="py-2 pr-3 text-neutral-900 dark:text-neutral-100 font-medium">{pay.number}</td>
                      <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">{formatDate(pay.paymentDate)}</td>
                      <td className="py-2 pr-3 text-right text-neutral-900 dark:text-neutral-100">{formatCurrency(pay.totalAmount)}</td>
                      <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">{pay.paymentType}</td>
                      <td className="py-2">
                        <StatusBadge status={pay.status} colorMap={paymentStatusColorMap} label={pay.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('finance.accountantDashboard.quickActions')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/invoices/new')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('finance.accountantDashboard.createInvoice')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payments/new')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('finance.accountantDashboard.createPayment')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/russian-docs/ks2')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('finance.accountantDashboard.createKs2')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/russian-docs/ks3')}
          >
            <Plus size={16} className="mr-1.5" />
            {t('finance.accountantDashboard.createKs3')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AccountantDashboardPage;
