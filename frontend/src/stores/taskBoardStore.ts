import { create } from 'zustand';
import { t } from '@/i18n';
import type { TaskStatus, TaskPriority } from '@/types';
import type { TaskStage } from '@/api/tasks';

export type ViewMode = 'board' | 'list' | 'gantt' | 'calendar' | 'my';

export interface KanbanColumn {
  id: string;
  statusFilter: TaskStatus[];
  dropStatus: TaskStatus;
  readonly title: string;
  wipLimit?: number;
  collapsed: boolean;
  color?: string;
}

const columnTitleKeys: Record<string, string> = {
  BACKLOG: 'taskBoard.columnBacklog',
  TODO: 'taskBoard.columnTodo',
  IN_PROGRESS: 'taskBoard.columnInProgress',
  IN_REVIEW: 'taskBoard.columnInReview',
  DONE: 'taskBoard.columnDone',
};

function defaultColumn(status: TaskStatus, opts?: { wipLimit?: number }): KanbanColumn {
  return {
    id: status,
    statusFilter: [status],
    dropStatus: status,
    get title() { return t(columnTitleKeys[status] ?? status); },
    wipLimit: opts?.wipLimit,
    collapsed: false,
  };
}

export function getDefaultColumns(): KanbanColumn[] {
  return [
    defaultColumn('BACKLOG'),
    defaultColumn('TODO', { wipLimit: 10 }),
    defaultColumn('IN_PROGRESS', { wipLimit: 5 }),
    defaultColumn('IN_REVIEW', { wipLimit: 5 }),
    defaultColumn('DONE'),
  ];
}

/**
 * Convert project-specific stages into board columns.
 * Open stages map to BACKLOG/TODO/IN_PROGRESS/IN_REVIEW (distributed evenly).
 * Closed stages map to DONE/CANCELLED.
 */
export function stagesToColumns(stages: TaskStage[]): KanbanColumn[] {
  if (stages.length === 0) return getDefaultColumns();

  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);
  const openStatuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'];
  const openStages = sorted.filter((s) => !s.isClosed);
  const closedStages = sorted.filter((s) => s.isClosed);

  const columns: KanbanColumn[] = [];

  if (openStages.length > 0) {
    const baseSize = Math.floor(openStatuses.length / openStages.length);
    const remainder = openStatuses.length % openStages.length;
    let offset = 0;

    openStages.forEach((stage, idx) => {
      const size = Math.min(
        baseSize + (idx < remainder ? 1 : 0),
        openStatuses.length - offset,
      );
      const statuses = size > 0 ? openStatuses.slice(offset, offset + size) : [];
      offset += size;

      const name = stage.name;
      columns.push({
        id: stage.id,
        statusFilter: statuses,
        dropStatus: statuses[0] ?? 'TODO',
        get title() { return name; },
        color: stage.color,
        collapsed: false,
      });
    });
  }

  if (closedStages.length > 0) {
    const first = closedStages[0];
    const firstName = first.name;
    columns.push({
      id: first.id,
      statusFilter: ['DONE', 'CANCELLED'],
      dropStatus: 'DONE',
      get title() { return firstName; },
      color: first.color,
      collapsed: false,
    });
  } else {
    columns.push(defaultColumn('DONE'));
  }

  return columns;
}

interface TaskBoardState {
  /* Columns */
  columns: KanbanColumn[];
  setColumns: (columns: KanbanColumn[]) => void;

  /* View */
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  /* Filters */
  filterByAssignee: string | null;
  filterByPriority: TaskPriority | null;
  filterByProject: string | null;
  searchQuery: string;
  setFilterByAssignee: (value: string | null) => void;
  setFilterByPriority: (value: TaskPriority | null) => void;
  setFilterByProject: (value: string | null) => void;
  setSearchQuery: (value: string) => void;
  clearFilters: () => void;

  /* Drag and Drop */
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;

  /* Column actions */
  toggleColumn: (columnId: string) => void;

  /* Selected task for detail panel */
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export const useTaskBoardStore = create<TaskBoardState>((set) => ({
  columns: getDefaultColumns(),
  setColumns: (columns) => set({ columns }),

  viewMode: 'board',
  setViewMode: (mode) => set({ viewMode: mode }),

  filterByAssignee: null,
  filterByPriority: null,
  filterByProject: null,
  searchQuery: '',
  setFilterByAssignee: (value) => set({ filterByAssignee: value }),
  setFilterByPriority: (value) => set({ filterByPriority: value }),
  setFilterByProject: (value) => set({ filterByProject: value }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  clearFilters: () =>
    set({
      filterByAssignee: null,
      filterByPriority: null,
      filterByProject: null,
      searchQuery: '',
    }),

  draggedTaskId: null,
  setDraggedTaskId: (id) => set({ draggedTaskId: id }),

  toggleColumn: (columnId) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, collapsed: !col.collapsed } : col,
      ),
    })),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}));
