import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, LayoutGrid, List, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  issueStatusColorMap,
  issueStatusLabels,
  issueTypeColorMap,
  issueTypeLabels,
  issuePriorityColorMap,
  issuePriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { issuesApi } from '@/api/issues';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Issue, IssueStatus } from './types';
import toast from 'react-hot-toast';

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ViewMode = 'table' | 'kanban';

const getKanbanColumns = (): { status: IssueStatus; label: string; color: string }[] => [
  { status: 'OPEN', label: t('issues.list.kanbanOpen'), color: 'border-blue-400' },
  { status: 'IN_PROGRESS', label: t('issues.list.kanbanInProgress'), color: 'border-yellow-400' },
  { status: 'ON_HOLD', label: t('issues.list.kanbanOnHold'), color: 'border-orange-400' },
  { status: 'RESOLVED', label: t('issues.list.kanbanResolved'), color: 'border-green-400' },
  { status: 'CLOSED', label: t('issues.list.kanbanClosed'), color: 'border-purple-400' },
];

const IssueListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const deleteIssueMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await issuesApi.deleteIssue(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success(t('issues.list.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('issues.list.deleteError'));
    },
  });

  const { data: issueData, isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => issuesApi.getIssues(),
  });

  const issues = issueData?.content ?? [];

  const filteredIssues = useMemo(() => {
    let filtered = issues;

    if (activeTab === 'OPEN') {
      filtered = filtered.filter((i) => i.status === 'OPEN');
    } else if (activeTab === 'IN_PROGRESS') {
      filtered = filtered.filter((i) => [ 'IN_PROGRESS', 'ON_HOLD'].includes(i.status));
    } else if (activeTab === 'RESOLVED') {
      filtered = filtered.filter((i) => i.status === 'RESOLVED');
    } else if (activeTab === 'CLOSED') {
      filtered = filtered.filter((i) => i.status === 'CLOSED');
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.number.toLowerCase().includes(lower) ||
          i.title.toLowerCase().includes(lower) ||
          (i.assignedToName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [issues, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: issues.length,
    open: issues.filter((i) => i.status === 'OPEN').length,
    in_progress: issues.filter((i) => [ 'IN_PROGRESS', 'ON_HOLD'].includes(i.status)).length,
    resolved: issues.filter((i) => i.status === 'RESOLVED').length,
    closed: issues.filter((i) => i.status === 'CLOSED').length,
  }), [issues]);

  const columns = useMemo<ColumnDef<Issue, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('issues.list.colTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('issues.list.colType'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={issueTypeColorMap}
            label={issueTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('issues.list.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={issueStatusColorMap}
            label={issueStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('issues.list.colPriority'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={issuePriorityColorMap}
            label={issuePriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: 'Ответственный',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && ![ 'RESOLVED', 'CLOSED'].includes(row.original.status);
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(dueDate)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (issue: Issue) => navigate(`/issues/${issue.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Замечания и проблемы"
        subtitle={`${issues.length} замечаний в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Замечания' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'table' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                )}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'kanban' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <Button
              iconLeft={<Plus size={16} />}
              onClick={() => {
                toast('Создание замечания доступно в карточке PM / Issue');
                navigate('/pm/issues');
              }}
            >
              Новое замечание
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },
          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },
          { id: 'RESOLVED', label: 'Решённые', count: tabCounts.resolved },
          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable<Issue>
          data={filteredIssues}
          columns={columns}
          loading={isLoading}
          onRowClick={handleRowClick}
          enableRowSelection
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          bulkActions={[
            {
              label: 'Удалить',
              icon: <Trash2 size={13} />,
              variant: 'danger',
              onClick: async (rows) => {
                const ids = rows.map((r) => r.id);
                const isConfirmed = await confirm({
                  title: `Удалить ${ids.length} замечани(е/я)?`,
                  description: 'Операция необратима. Выбранные замечания будут удалены.',
                  confirmLabel: 'Удалить',
                  cancelLabel: 'Отмена',
                });
                if (!isConfirmed) return;
                deleteIssueMutation.mutate(ids);
              },
            },
          ]}
          emptyTitle="Нет замечаний"
          emptyDescription="Система замечаний пуста"
        />
      ) : (
        /* Kanban view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kanbanColumns.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.status);
            return (
              <div key={col.status} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                <div className={cn('flex items-center justify-between mb-3 pb-2 border-b-2', col.color)}>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{col.label}</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-200 px-1.5 py-0.5 rounded-full">
                    {colIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 hover:shadow-sm cursor-pointer transition-shadow"
                    >
                      <p className="text-xs font-mono text-neutral-400 mb-1">{issue.number}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">{issue.title}</p>
                      <div className="flex items-center justify-between">
                        <StatusBadge
                          status={issue.priority}
                          colorMap={issuePriorityColorMap}
                          label={issuePriorityLabels[issue.priority]}
                        />
                        {issue.assignedToName && (
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-semibold text-primary-700">
                            {issue.assignedToName.split(' ').map((n) => n[0]).join('')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueListPage;
