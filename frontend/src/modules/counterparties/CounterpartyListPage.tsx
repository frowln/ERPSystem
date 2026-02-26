import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Building2, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { contractsApi } from '@/api/contracts';
import { t } from '@/i18n';

const CounterpartyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['counterparties', search],
    queryFn: () => contractsApi.getCounterparties({ search: search || undefined, size: 200 }),
  });

  const counterparties = data?.content ?? [];

  const getType = (c: { supplier: boolean; customer: boolean }) => {
    if (c.supplier && c.customer) return t('counterparties.typeBoth');
    if (c.supplier) return t('counterparties.typeSupplier');
    return t('counterparties.typeCustomer');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('counterparties.title')}
        subtitle={t('counterparties.subtitle')}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('counterparties.title') },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => navigate('/counterparties/new')}
          >
            {t('counterparties.createButton')}
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('counterparties.searchPlaceholder')}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 pl-9 pr-3 py-2 text-sm
            bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {t('common.loading')}
        </div>
      ) : isError ? (
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetch()}
        />
      ) : counterparties.length === 0 ? (
        <EmptyState
          variant="no-data"
          icon={<Building2 size={32} />}
          title={t('counterparties.emptyState')}
          description={t('counterparties.emptyStateDescription')}
          actionLabel={t('counterparties.createButton')}
          onAction={() => navigate('/counterparties/new')}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">{t('counterparties.colName')}</th>
                <th className="px-4 py-3 font-medium">{t('counterparties.colInn')}</th>
                <th className="px-4 py-3 font-medium">{t('counterparties.colOgrn')}</th>
                <th className="px-4 py-3 font-medium">{t('counterparties.colType')}</th>
                <th className="px-4 py-3 font-medium">{t('counterparties.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {counterparties.map((cp) => (
                <tr
                  key={cp.id}
                  onClick={() => navigate(`/counterparties/${cp.id}`)}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{cp.name}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cp.inn || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cp.ogrn || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {getType(cp)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={cp.active ? 'ACTIVE' : 'INACTIVE'}
                      colorMap={{ ACTIVE: 'green', INACTIVE: 'gray' }}
                      label={cp.active ? t('counterparties.statusActive') : t('counterparties.statusInactive')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CounterpartyListPage;
