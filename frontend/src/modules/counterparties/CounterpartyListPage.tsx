import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Building2, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { contractsApi, type Counterparty } from '@/api/contracts';
import { t } from '@/i18n';

type TypeFilter = 'all' | 'customer' | 'supplier' | 'contractor' | 'subcontractor' | 'designer';
type StatusFilter = 'all' | 'active' | 'inactive';

const CounterpartyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['counterparties', search],
    queryFn: () => contractsApi.getCounterparties({ search: search || undefined, size: 200 }),
  });

  const counterparties = useMemo(() => {
    let list = data?.content ?? [];

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter((c) => {
        switch (typeFilter) {
          case 'customer': return c.customer;
          case 'supplier': return c.supplier;
          case 'contractor': return c.contractor;
          case 'subcontractor': return c.subcontractor;
          case 'designer': return c.designer;
          default: return true;
        }
      });
    }

    // Status filter
    if (statusFilter === 'active') list = list.filter((c) => c.active);
    else if (statusFilter === 'inactive') list = list.filter((c) => !c.active);

    return list;
  }, [data, typeFilter, statusFilter]);

  const getTypes = (c: Counterparty) => {
    const types: string[] = [];
    if (c.customer) types.push(t('counterparties.typeCustomer'));
    if (c.supplier) types.push(t('counterparties.typeSupplier'));
    if (c.contractor) types.push(t('counterparties.labelIsContractor'));
    if (c.subcontractor) types.push(t('counterparties.labelIsSubcontractor'));
    if (c.designer) types.push(t('counterparties.labelIsDesigner'));
    if (types.length === 0) types.push('—');
    return types;
  };

  const typeFilterButtons: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: t('counterparties.filterAll') },
    { key: 'customer', label: t('counterparties.filterCustomers') },
    { key: 'supplier', label: t('counterparties.filterSuppliers') },
    { key: 'contractor', label: t('counterparties.filterContractors') },
    { key: 'subcontractor', label: t('counterparties.filterSubcontractors') },
    { key: 'designer', label: t('counterparties.filterDesigners') },
  ];

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

      {/* Filters bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
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

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {s === 'all' ? t('counterparties.filterAll') : s === 'active' ? t('counterparties.filterActive') : t('counterparties.filterInactive')}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {typeFilterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              typeFilter === f.key
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {f.label}
          </button>
        ))}
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
                <th className="px-4 py-3 font-medium hidden lg:table-cell">{t('counterparties.colContact')}</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">{t('counterparties.colPhone')}</th>
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
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{cp.shortName || cp.name}</p>
                    {cp.shortName && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate max-w-[300px]">{cp.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cp.inn || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden lg:table-cell">
                    {cp.contactPerson || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                    {cp.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getTypes(cp).map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
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
