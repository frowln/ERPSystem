import { create } from 'zustand';
import { t } from '@/i18n';
import type { TaskStatus, TaskPriority } from '@/types';

export type ViewMode = 'board' | 'list' | 'gantt' | 'calendar';

export interface KanbanColumn {
  id: TaskStatus;
  readonly title: string;
  wipLimit?: number;
  collapsed: boolean;
}

const columnTitleKeys: Record<string, string> = {
  BACKLOG: 'taskBoard.columnBacklog',
  TODO: 'taskBoard.columnTodo',
  IN_PROGRESS: 'taskBoard.columnInProgress',
  IN_REVIEW: 'taskBoard.columnInReview',
  DONE: 'taskBoard.columnDone',
};

function kanbanColumn(id: TaskStatus, opts?: { wipLimit?: number }): KanbanColumn {
  return {
    get title() { return t(columnTitleKeys[id] ?? id); },
    id,
    wipLimit: opts?.wipLimit,
    collapsed: false,
  };
}

interface TaskBoardState {
  /* Columns */
  columns: KanbanColumn[];

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
  toggleColumn: (columnId: TaskStatus) => void;

  /* Selected task for detail panel */
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export const useTaskBoardStore = create<TaskBoardState>((set) => ({
  columns: [
    kanbanColumn('BACKLOG'),
    kanbanColumn('TODO', { wipLimit: 10 }),
    kanbanColumn('IN_PROGRESS', { wipLimit: 5 }),
    kanbanColumn('IN_REVIEW', { wipLimit: 5 }),
    kanbanColumn('DONE'),
  ],

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
