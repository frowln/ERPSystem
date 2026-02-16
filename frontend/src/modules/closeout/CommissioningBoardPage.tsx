import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, X, Plus, ChevronDown, ChevronRight, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ChecklistStatus, CommissioningChecklist } from './types';

type CmStatus = ChecklistStatus;

interface CmCard {
  id: string;
  code: string;
  title: string;
  status: CmStatus;
  systemName: string;
  projectName: string;
  assigneeName?: string;
  plannedDate: string;
  completionPercent: number;
}

interface BoardColumn {
  id: CmStatus;
  title: string;
  color: string;
  headerBg: string;
  collapsed: boolean;
}

const defaultColumns: BoardColumn[] = [
  { id: 'NOT_STARTED', title: 'Не начато', color: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', collapsed: false },
  { id: 'IN_PROGRESS', title: 'В процессе', color: 'bg-yellow-500', headerBg: 'bg-yellow-50', collapsed: false },
  { id: 'ON_HOLD', title: 'Пауза', color: 'bg-orange-500', headerBg: 'bg-orange-50', collapsed: false },
  { id: 'COMPLETED', title: 'Завершено', color: 'bg-blue-500', headerBg: 'bg-blue-50', collapsed: false },
  { id: 'FAILED', title: 'Не пройдено', color: 'bg-red-500', headerBg: 'bg-red-50', collapsed: false },
];

function toCard(checklist: CommissioningChecklist): CmCard {
  const completionPercent = checklist.totalItems > 0
    ? Math.round((checklist.completedItems / checklist.totalItems) * 100)
    : 0;

  return {
    id: checklist.id,
    code: checklist.checklistNumber,
    title: checklist.subsystem ?? checklist.systemName,
    status: checklist.status,
    systemName: checklist.systemName,
    projectName: checklist.projectName,
    assigneeName: checklist.inspectorName,
    plannedDate: checklist.inspectionDate,
    completionPercent,
  };
}

const CommissioningBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<CmCard[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>(defaultColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<CmStatus | null>(null);

  const {
    data: checklistPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['commissioning'],
    queryFn: () => closeoutApi.getCommissioningChecklists({ page: 0, size: 300 }),
  });

  useEffect(() => {
    if (!checklistPage) return;
    setItems(checklistPage.content.map(toCard));
  }, [checklistPage]);

  const statusMutation = useMutation({
    mutationFn: (payload: { checklistId: string; status: CmStatus }) => closeoutApi.updateCommissioningChecklist(payload.checklistId, {
      status: payload.status,
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commissioning'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-commissioning'] }),
      ]);
    },
    onError: () => {
      toast.error('Не удалось обновить статус чек-листа');
    },
  });

  const filtered = useMemo(() => {
    let result = items;

    if (filterStatus) {
      result = result.filter((item) => item.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => (
        item.title.toLowerCase().includes(query)
        || item.code.toLowerCase().includes(query)
        || item.systemName.toLowerCase().includes(query)
      ));
    }

    return result;
  }, [items, filterStatus, searchQuery]);

  const byColumn = useMemo(() => {
    const map: Record<string, CmCard[]> = {};
    for (const column of columns) {
      map[column.id] = filtered.filter((item) => item.status === column.id);
    }
    return map;
  }, [filtered, columns]);

  const hasFilters = Boolean(filterStatus || searchQuery);

  const onDragStart = useCallback((event: React.DragEvent, id: string) => {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  }, []);

  const onDrop = useCallback((event: React.DragEvent, nextStatus: CmStatus) => {
    event.preventDefault();
    if (!draggedId) return;

    const previousItems = items;
    const current = items.find((item) => item.id === draggedId);
    if (!current || current.status === nextStatus) {
      setDraggedId(null);
      setDragOverCol(null);
      return;
    }

    setItems((prev) => prev.map((item) => (
      item.id === draggedId ? { ...item, status: nextStatus } : item
    )));

    statusMutation.mutate(
      { checklistId: draggedId, status: nextStatus },
      {
        onError: () => {
          setItems(previousItems);
        },
      },
    );

    setDraggedId(null);
    setDragOverCol(null);
  }, [draggedId, items, statusMutation]);

  const onDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  const toggleColumn = useCallback((id: CmStatus) => {
    setColumns((prev) => prev.map((column) => (
      column.id === id ? { ...column, collapsed: !column.collapsed } : column
    )));
  }, []);

  return (
    <div className="animate-fade-in" onDragEnd={onDragEnd}>
      <PageHeader
        title="Пусконаладка - Доска"
        subtitle={`${items.length} объектов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Завершение', href: '/closeout/dashboard' },
          { label: 'Пусконаладка', href: '/closeout/commissioning' },
          { label: 'Доска' },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Filter size={14} />}
              onClick={() => setShowFilters(!showFilters)}
              className={hasFilters ? 'border-primary-300 text-primary-600' : ''}
            >
              Фильтры
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<List size={14} />}
              onClick={() => navigate('/closeout/commissioning')}
            >
              Список
            </Button>
            <Button iconLeft={<Plus size={16} />}>Новый объект</Button>
          </div>
        )}
      />

      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 animate-fade-in">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Поиск по коду, названию, системе..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Все статусы' },
              ...defaultColumns.map((column) => ({ value: column.id, label: column.title })),
            ]}
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="w-52"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<X size={14} />}
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
              }}
            >
              Сбросить
            </Button>
          )}
        </div>
      )}

      {isError && items.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить доску пусконаладки"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {columns.map((column) => {
            const columnItems = byColumn[column.id] ?? [];
            const isOver = dragOverCol === column.id;
            return (
              <div
                key={column.id}
                className={cn(
                  'flex flex-col min-w-[300px] w-[300px] rounded-xl border transition-all duration-200',
                  isOver ? 'border-primary-400 bg-primary-50/30 shadow-md' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50',
                  column.collapsed && 'min-w-[52px] w-[52px]',
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverCol(column.id);
                }}
                onDrop={(event) => onDrop(event, column.id)}
              >
                <div
                  className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer select-none', column.headerBg)}
                  onClick={() => toggleColumn(column.id)}
                >
                  {column.collapsed ? <ChevronRight size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  {!column.collapsed && (
                    <>
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', column.color)} />
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex-1 truncate">{column.title}</span>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-neutral-200 text-neutral-600">
                        {columnItems.length}
                      </span>
                    </>
                  )}
                </div>

                {!column.collapsed && (
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                    {columnItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs text-neutral-400">{isLoading ? 'Загрузка...' : 'Нет объектов'}</p>
                        {!isLoading && <p className="text-[10px] text-neutral-300 mt-0.5">Перетащите карточку сюда</p>}
                      </div>
                    ) : (
                      columnItems.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(event) => onDragStart(event, item.id)}
                          onClick={() => navigate(`/closeout/commissioning/${item.id}`)}
                          className={cn(
                            'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all',
                            draggedId === item.id && 'opacity-50 shadow-lg',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-neutral-400">{item.code}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                              {item.completionPercent}%
                            </span>
                          </div>

                          <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5 line-clamp-2">{item.title}</h4>

                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600">{item.systemName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{item.projectName}</span>
                          </div>

                          <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
                            <div
                              className={cn('h-1.5 rounded-full', item.completionPercent === 100 ? 'bg-green-500' : 'bg-primary-500')}
                              style={{ width: `${item.completionPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            {item.assigneeName ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                                  {item.assigneeName.charAt(0)}
                                </div>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]">{item.assigneeName}</span>
                              </div>
                            ) : (
                              <div />
                            )}
                            <span className="text-[10px] text-neutral-400">{formatRelativeTime(item.plannedDate)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {column.collapsed && (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <span
                      className="text-xs font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap"
                      style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                    >
                      {column.title} ({columnItems.length})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommissioningBoardPage;
