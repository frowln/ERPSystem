import { describe, expect, it, beforeEach } from 'vitest';
import { useTaskBoardStore, getDefaultColumns, stagesToColumns } from './taskBoardStore';

describe('taskBoardStore', () => {
  beforeEach(() => {
    useTaskBoardStore.setState({
      viewMode: 'board',
      filterByAssignee: null,
      filterByPriority: null,
      filterByProject: null,
      searchQuery: '',
      draggedTaskId: null,
      selectedTaskId: null,
      columns: getDefaultColumns(),
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

  it('has 5 default columns with correct IDs', () => {
    const cols = useTaskBoardStore.getState().columns;
    expect(cols).toHaveLength(5);
    expect(cols.map((c) => c.id)).toEqual(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
  });

  it('default columns have statusFilter and dropStatus', () => {
    const cols = useTaskBoardStore.getState().columns;
    for (const col of cols) {
      expect(col.statusFilter).toBeDefined();
      expect(col.statusFilter.length).toBeGreaterThan(0);
      expect(col.dropStatus).toBeDefined();
    }
  });

  it('setColumns replaces columns', () => {
    const newCols = getDefaultColumns().slice(0, 3);
    useTaskBoardStore.getState().setColumns(newCols);
    expect(useTaskBoardStore.getState().columns).toHaveLength(3);
  });
});

describe('stagesToColumns', () => {
  it('returns default columns when no stages', () => {
    const cols = stagesToColumns([]);
    expect(cols).toHaveLength(5);
    expect(cols.map((c) => c.dropStatus)).toEqual(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
  });

  it('maps 3 open + 1 closed stages correctly', () => {
    const stages = [
      { id: 's1', name: 'Новое', sequence: 1, isClosed: false },
      { id: 's2', name: 'В работе', sequence: 2, isClosed: false },
      { id: 's3', name: 'Тестирование', sequence: 3, isClosed: false },
      { id: 's4', name: 'Готово', sequence: 4, isClosed: true },
    ];
    const cols = stagesToColumns(stages);
    expect(cols).toHaveLength(4);
    expect(cols[0].title).toBe('Новое');
    expect(cols[0].statusFilter).toContain('BACKLOG');
    expect(cols[3].title).toBe('Готово');
    expect(cols[3].statusFilter).toContain('DONE');
  });

  it('maps 2 open + 1 closed stages with distributed statuses', () => {
    const stages = [
      { id: 's1', name: 'Открыто', sequence: 0, isClosed: false },
      { id: 's2', name: 'В процессе', sequence: 1, isClosed: false },
      { id: 's3', name: 'Закрыто', sequence: 2, isClosed: true },
    ];
    const cols = stagesToColumns(stages);
    expect(cols).toHaveLength(3);
    // 4 open statuses distributed across 2 open stages: [BACKLOG, TODO], [IN_PROGRESS, IN_REVIEW]
    expect(cols[0].statusFilter).toHaveLength(2);
    expect(cols[1].statusFilter).toHaveLength(2);
    expect(cols[2].statusFilter).toContain('DONE');
  });

  it('adds default DONE column when no closed stage', () => {
    const stages = [
      { id: 's1', name: 'Бэклог', sequence: 0, isClosed: false },
    ];
    const cols = stagesToColumns(stages);
    expect(cols).toHaveLength(2); // 1 open + 1 default DONE
    expect(cols[1].dropStatus).toBe('DONE');
  });
});
