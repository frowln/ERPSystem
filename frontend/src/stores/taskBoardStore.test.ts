import { describe, expect, it, beforeEach } from 'vitest';
import { useTaskBoardStore } from './taskBoardStore';

describe('taskBoardStore', () => {
  beforeEach(() => {
    // Reset to defaults
    useTaskBoardStore.setState({
      viewMode: 'board',
      filterByAssignee: null,
      filterByPriority: null,
      filterByProject: null,
      searchQuery: '',
      draggedTaskId: null,
      selectedTaskId: null,
      columns: [
        { id: 'BACKLOG', title: 'Бэклог', collapsed: false },
        { id: 'TODO', title: 'К выполнению', wipLimit: 10, collapsed: false },
        { id: 'IN_PROGRESS', title: 'В работе', wipLimit: 5, collapsed: false },
        { id: 'IN_REVIEW', title: 'На проверке', wipLimit: 5, collapsed: false },
        { id: 'DONE', title: 'Готово', collapsed: false },
      ],
    });
  });

  it('starts with board view mode', () => {
    expect(useTaskBoardStore.getState().viewMode).toBe('board');
  });

  it('setViewMode changes the view', () => {
    useTaskBoardStore.getState().setViewMode('list');
    expect(useTaskBoardStore.getState().viewMode).toBe('list');
  });

  it('setFilterByAssignee sets assignee filter', () => {
    useTaskBoardStore.getState().setFilterByAssignee('user-1');
    expect(useTaskBoardStore.getState().filterByAssignee).toBe('user-1');
  });

  it('setFilterByPriority sets priority filter', () => {
    useTaskBoardStore.getState().setFilterByPriority('HIGH');
    expect(useTaskBoardStore.getState().filterByPriority).toBe('HIGH');
  });

  it('setSearchQuery sets search', () => {
    useTaskBoardStore.getState().setSearchQuery('test query');
    expect(useTaskBoardStore.getState().searchQuery).toBe('test query');
  });

  it('clearFilters resets all filters', () => {
    const store = useTaskBoardStore.getState();
    store.setFilterByAssignee('user-1');
    store.setFilterByPriority('HIGH');
    store.setFilterByProject('proj-1');
    store.setSearchQuery('query');
    store.clearFilters();
    const state = useTaskBoardStore.getState();
    expect(state.filterByAssignee).toBeNull();
    expect(state.filterByPriority).toBeNull();
    expect(state.filterByProject).toBeNull();
    expect(state.searchQuery).toBe('');
  });

  it('toggleColumn toggles collapsed state', () => {
    useTaskBoardStore.getState().toggleColumn('BACKLOG');
    expect(useTaskBoardStore.getState().columns.find((c) => c.id === 'BACKLOG')?.collapsed).toBe(true);
    useTaskBoardStore.getState().toggleColumn('BACKLOG');
    expect(useTaskBoardStore.getState().columns.find((c) => c.id === 'BACKLOG')?.collapsed).toBe(false);
  });

  it('setDraggedTaskId and setSelectedTaskId work', () => {
    useTaskBoardStore.getState().setDraggedTaskId('task-5');
    expect(useTaskBoardStore.getState().draggedTaskId).toBe('task-5');
    useTaskBoardStore.getState().setSelectedTaskId('task-3');
    expect(useTaskBoardStore.getState().selectedTaskId).toBe('task-3');
  });

  it('has 5 columns with correct IDs', () => {
    const cols = useTaskBoardStore.getState().columns;
    expect(cols).toHaveLength(5);
    expect(cols.map((c) => c.id)).toEqual(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
  });
});
