import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileWarning, Plus, Search, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input, Select, Textarea } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import { formatDate, formatMoney } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ReclamationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DISPUTED' | 'RESOLVED';

interface Reclamation {
  id: string;
  number: string;
  contractId: string;
  contractNumber: string;
  counterpartyName: string;
  subject: string;
  amount: number;
  status: ReclamationStatus;
  createdDate: string;
  deadline: string;
}

// ---------------------------------------------------------------------------
// Status color map
// ---------------------------------------------------------------------------
const statusColorMap: Record<ReclamationStatus, string> = {
  DRAFT: 'gray',
  SENT: 'blue',
  ACCEPTED: 'green',
  DISPUTED: 'yellow',
  RESOLVED: 'cyan',
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function fetchReclamations(projectId?: string): Promise<Reclamation[]> {
  try {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get<{ content?: Reclamation[] } | Reclamation[]>('/reclamations', { params });
    if (Array.isArray(data)) return data;
    return data?.content ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Days remaining
// ---------------------------------------------------------------------------
const DaysRemainingBadge: React.FC<{ deadline: string }> = ({ deadline }) => {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
        <AlertTriangle size={12} />
        {t('reclamations.fields.overdue')}
      </span>
    );
  }

  const cls =
    days <= 7
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums', cls)}>
      <Clock size={12} />
      {t('reclamations.fields.daysRemaining')}: {days}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ReclamationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: reclamations = [], isLoading, isError } = useQuery({
    queryKey: ['reclamations'],
    queryFn: () => fetchReclamations(),
  });

  const filtered = useMemo(() => {
    let items = reclamations;
    if (statusFilter) items = items.filter((r) => r.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (r) =>
          r.number.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.counterpartyName.toLowerCase().includes(q) ||
          r.contractNumber.toLowerCase().includes(q),
      );
    }
    return items;
  }, [reclamations, statusFilter, searchQuery]);

  const statusOptions = [
    { value: '', label: t('counterparties.filterAll') },
    { value: 'DRAFT', label: t('reclamations.status.draft') },
    { value: 'SENT', label: t('reclamations.status.sent') },
    { value: 'ACCEPTED', label: t('reclamations.status.accepted') },
    { value: 'DISPUTED', label: t('reclamations.status.disputed') },
    { value: 'RESOLVED', label: t('reclamations.status.resolved') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('reclamations.title')}
        subtitle={t('reclamations.description')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('contracts.title'), href: '/contracts' },
          { label: t('reclamations.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            {t('reclamations.create')}
          </Button>
        }
      />

      {/* Civil Code note */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        {t('reclamations.civilCodeNote')}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
          <Input
            placeholder={t('contracts.list.searchPlaceholder')}
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
          icon={<FileWarning size={40} strokeWidth={1.5} />}
          title={t('reclamations.empty')}
          description={t('reclamations.emptyDescription')}
          actionLabel={t('reclamations.create')}
          onAction={() => setCreateOpen(true)}
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
                    {t('reclamations.fields.number')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('reclamations.fields.contract')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('reclamations.fields.counterparty')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('reclamations.fields.subject')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('reclamations.fields.amount')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('reclamations.fields.deadline')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {r.number}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary-600 dark:text-primary-400 whitespace-nowrap">
                      {r.contractNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {r.counterpartyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 max-w-[300px] truncate">
                      {r.subject}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right whitespace-nowrap tabular-nums">
                      {formatMoney(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge
                        status={r.status}
                        colorMap={statusColorMap}
                        label={t(`reclamations.status.${r.status.toLowerCase()}` as any)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(r.deadline)}</span>
                        <DaysRemainingBadge deadline={r.deadline} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('reclamations.create')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setCreateOpen(false)}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('reclamations.fields.contract')}
            </label>
            <Input placeholder={t('reclamations.fields.contractPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('reclamations.fields.counterparty')}
            </label>
            <Input placeholder={t('reclamations.fields.counterpartyPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('reclamations.fields.subject')}
            </label>
            <Input placeholder={t('reclamations.fields.subjectPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('reclamations.fields.amount')}
            </label>
            <Input type="number" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('reclamations.fields.description')}
            </label>
            <Textarea rows={4} placeholder={t('reclamations.fields.descriptionPlaceholder')} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReclamationsPage;
