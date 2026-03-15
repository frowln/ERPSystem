import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import { formatDate, formatMoney, formatMoneyCompact } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type GuaranteeStatus = 'ACTIVE' | 'EXPIRED' | 'RETURNED' | 'CLAIMED';

interface BankGuarantee {
  id: string;
  number: string;
  bankName: string;
  contractId: string;
  contractNumber: string;
  amount: number;
  currency: string;
  issueDate: string;
  expiryDate: string;
  status: GuaranteeStatus;
}

// ---------------------------------------------------------------------------
// Status color map
// ---------------------------------------------------------------------------
const statusColorMap: Record<GuaranteeStatus, string> = {
  ACTIVE: 'green',
  EXPIRED: 'gray',
  RETURNED: 'blue',
  CLAIMED: 'red',
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function fetchBankGuarantees(projectId?: string): Promise<BankGuarantee[]> {
  try {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get<{ content?: BankGuarantee[] } | BankGuarantee[]>('/bank-guarantees', { params });
    if (Array.isArray(data)) return data;
    return data?.content ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Expiry countdown
// ---------------------------------------------------------------------------
const ExpiryCountdown: React.FC<{ expiryDate: string; status: GuaranteeStatus }> = ({ expiryDate, status }) => {
  if (status !== 'ACTIVE') return null;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
        <AlertTriangle size={12} />
        {t('bankGuarantees.fields.expired')}
      </span>
    );
  }

  const cls =
    days < 30
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      : days < 90
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums', cls)}>
      <Clock size={12} />
      {t('bankGuarantees.fields.daysLeft')}: {days}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const BankGuaranteesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: guarantees = [], isLoading, isError } = useQuery({
    queryKey: ['bank-guarantees'],
    queryFn: () => fetchBankGuarantees(),
  });

  const filtered = useMemo(() => {
    let items = guarantees;
    if (statusFilter) items = items.filter((g) => g.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (g) =>
          g.number.toLowerCase().includes(q) ||
          g.bankName.toLowerCase().includes(q) ||
          g.contractNumber.toLowerCase().includes(q),
      );
    }
    return items;
  }, [guarantees, statusFilter, searchQuery]);

  // Summary metrics
  const summary = useMemo(() => {
    const active = guarantees.filter((g) => g.status === 'ACTIVE');
    const totalAmount = active.reduce((sum, g) => sum + g.amount, 0);
    const now = new Date();
    const expiringSoon = active.filter((g) => {
      const diff = new Date(g.expiryDate).getTime() - now.getTime();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    }).length;
    return {
      activeCount: active.length,
      totalAmount,
      expiringSoon,
    };
  }, [guarantees]);

  const statusOptions = [
    { value: '', label: t('counterparties.filterAll') },
    { value: 'ACTIVE', label: t('bankGuarantees.status.active') },
    { value: 'EXPIRED', label: t('bankGuarantees.status.expired') },
    { value: 'RETURNED', label: t('bankGuarantees.status.returned') },
    { value: 'CLAIMED', label: t('bankGuarantees.status.claimed') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bankGuarantees.title')}
        subtitle={t('bankGuarantees.description')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('contracts.title'), href: '/contracts' },
          { label: t('bankGuarantees.title') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Shield size={16} />}
          label={t('bankGuarantees.summary.activeCount')}
          value={summary.activeCount}
          loading={isLoading}
        />
        <MetricCard
          icon={<Shield size={16} />}
          label={t('bankGuarantees.summary.totalAmount')}
          value={formatMoneyCompact(summary.totalAmount)}
          loading={isLoading}
        />
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label={t('bankGuarantees.summary.expiringSoon')}
          value={summary.expiringSoon}
          loading={isLoading}
          subtitle={t('bankGuarantees.summary.within30days')}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
          <Input
            placeholder={t('bankGuarantees.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <EmptyState variant="ERROR" title={t('errors.generic')} description={t('errors.serverErrorRetry')} />
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Shield size={40} strokeWidth={1.5} />}
          title={t('bankGuarantees.empty')}
          description={t('bankGuarantees.emptyDescription')}
        />
      )}

      {/* Table */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.number')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.bank')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.contract')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.issueDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.expiryDate')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('bankGuarantees.fields.expiry')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {g.number}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {g.bankName}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary-600 dark:text-primary-400 whitespace-nowrap">
                      {g.contractNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right whitespace-nowrap tabular-nums">
                      {formatMoney(g.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatDate(g.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatDate(g.expiryDate)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge
                        status={g.status}
                        colorMap={statusColorMap}
                        label={t(`bankGuarantees.status.${g.status.toLowerCase()}` as any)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ExpiryCountdown expiryDate={g.expiryDate} status={g.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankGuaranteesPage;
