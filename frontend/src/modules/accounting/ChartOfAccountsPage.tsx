import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Input } from '@/design-system/components/FormField';
import { EmptyState } from '@/design-system/components/EmptyState';
import { accountingApi, type Account } from '@/api/accounting';

const typeColors: Record<string, string> = {
  ACTIVE: 'text-blue-600 bg-blue-50',
  PASSIVE: 'text-purple-600 bg-purple-50',
  ACTIVE_PASSIVE: 'text-orange-600 bg-orange-50',
};

const AccountRow: React.FC<{ account: Account; level: number; search: string }> = ({
  account,
  level,
  search,
}) => {
  const [expanded, setExpanded] = useState(level === 0);
  const children = account.children ?? [];
  const hasChildren = children.length > 0;

  const normalizedSearch = search.trim().toLowerCase();

  const matchesSearch = normalizedSearch
    ? account.code.toLowerCase().includes(normalizedSearch) ||
      account.name.toLowerCase().includes(normalizedSearch)
    : true;

  const childMatches =
    normalizedSearch && hasChildren
      ? children.some(
          (child) =>
            child.code.toLowerCase().includes(normalizedSearch) ||
            child.name.toLowerCase().includes(normalizedSearch),
        )
      : false;

  if (normalizedSearch && !matchesSearch && !childMatches) {
    return null;
  }

  return (
    <>
      <tr className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
        <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + level * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => setExpanded((value) => !value)}
                className="p-0.5 text-neutral-400 hover:text-neutral-600"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">{account.code}</span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span className={`text-sm ${level === 0 ? 'font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {account.name}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              typeColors[account.type] ?? 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            {account.typeDisplayName}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              account.analytical ? 'text-success-700 bg-success-50' : 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            {account.analytical ? 'Аналитический' : 'Синтетический'}
          </span>
        </td>
      </tr>

      {expanded &&
        hasChildren &&
        children.map((child) => (
          <AccountRow key={child.id} account={child} level={level + 1} search={search} />
        ))}
    </>
  );
};

const ChartOfAccountsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingApi.getAllAccounts({ asTree: true }),
  });

  const hasData = (accounts?.length ?? 0) > 0;

  const summary = useMemo(() => {
    const flatten = (items: Account[]): Account[] =>
      items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])]);

    const flattened = flatten(accounts ?? []);

    return {
      total: flattened.length,
      active: flattened.filter((account) => account.type === 'ACTIVE').length,
      passive: flattened.filter((account) => account.type === 'PASSIVE').length,
      activePassive: flattened.filter((account) => account.type === 'ACTIVE_PASSIVE').length,
    };
  }, [accounts]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="План счетов"
        subtitle={`Всего счетов: ${summary.total}`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бухгалтерия', href: '/accounting' },
          { label: 'План счетов' },
        ]}
      />

      {isError && !hasData ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить план счетов"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => {
            void refetch();
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Активные</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.active}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Пассивные</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.passive}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Активно-пассивные</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.activePassive}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                placeholder="Поиск по коду или названию..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-44">
                    Код счёта
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-4 py-2.5">
                    Наименование
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-44">
                    Тип
                  </th>
                  <th className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-4 py-2.5 w-44">
                    Уровень
                  </th>
                </tr>
              </thead>
              <tbody>
                {(accounts ?? []).map((account) => (
                  <AccountRow key={account.id} account={account} level={0} search={search} />
                ))}
                {!isLoading && (accounts?.length ?? 0) === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400" colSpan={4}>
                      План счетов пуст.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;
