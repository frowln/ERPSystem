// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tasksApi } from './tasks';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('calls GET /tasks and maps content', async () => {
      const backendTask = {
        id: 't1',
        code: 'TSK-001',
        title: 'Foundation work',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        progress: 50,
        assigneeName: 'John',
      };
      mockGet.mockResolvedValue({ data: { content: [backendTask], totalElements: 1 } } as never);

      const result = await tasksApi.getTasks();
      expect(mockGet).toHaveBeenCalledWith('/tasks', { params: undefined });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].code).toBe('TSK-001');
      expect(result.content[0].progress).toBe(50);
    });

    it('passes filter params', async () => {
      const params = { status: 'TODO' as const, priority: 'HIGH' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await tasksApi.getTasks(params);
      expect(mockGet).toHaveBeenCalledWith('/tasks', { params });
    });

    it('clamps progress to 0-100 range', async () => {
      const backendTask = { id: 't1', code: 'TSK-001', title: 'Test', status: 'TODO', priority: 'NORMAL', progress: 150 };
      mockGet.mockResolvedValue({ data: { content: [backendTask], totalElements: 1 } } as never);

      const result = await tasksApi.getTasks();
      expect(result.content[0].progress).toBe(100);
    });

    it('defaults null progress to 0', async () => {
      const backendTask = { id: 't1', code: 'TSK-001', title: 'Test', status: 'TODO', priority: 'NORMAL', progress: null };
      mockGet.mockResolvedValue({ data: { content: [backendTask], totalElements: 1 } } as never);

      const result = await tasksApi.getTasks();
      expect(result.content[0].progress).toBe(0);
    });
  });

  describe('getTask', () => {
    it('calls GET /tasks/:id and maps detail', async () => {
      const backendTask = {
        id: 't1',
        code: 'TSK-001',
        title: 'Foundation work',
        description: 'Pour concrete',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        progress: 50,
        tags: 'foundation,concrete',
        comments: [{ id: 'cm1', taskId: 't1', authorName: 'John', content: 'Started', createdAt: '2026-02-01T00:00:00Z' }],
        dependencies: [{ id: 'd1', taskId: 't1', dependsOnTaskId: 't0', dependencyType: 'FINISH_TO_START' }],
        estimatedHours: '16.5',
      };
      mockGet.mockResolvedValue({ data: backendTask } as never);

      const result = await tasksApi.getTask('t1');
      expect(mockGet).toHaveBeenCalledWith('/tasks/t1');
      expect(result.description).toBe('Pour concrete');
      expect(result.tags).toEqual(['foundation', 'concrete']);
      expect(result.comments).toHaveLength(1);
      expect(result.dependencies[0].type).toBe('finish_to_start');
      expect(result.estimatedHours).toBe(16.5);
    });

    it('parses tags from semicolon-separated string', async () => {
      const backendTask = {
        id: 't1', code: 'TSK-001', title: 'Test', status: 'TODO', priority: 'NORMAL',
        progress: 0, tags: 'urgent;critical;', comments: [], dependencies: [],
      };
      mockGet.mockResolvedValue({ data: backendTask } as never);

      const result = await tasksApi.getTask('t1');
      expect(result.tags).toEqual(['urgent', 'critical']);
    });

    it('returns empty tags array for null tags', async () => {
      const backendTask = {
        id: 't1', code: 'TSK-001', title: 'Test', status: 'TODO', priority: 'NORMAL',
        progress: 0, tags: null, comments: [], dependencies: [],
      };
      mockGet.mockResolvedValue({ data: backendTask } as never);

      const result = await tasksApi.getTask('t1');
      expect(result.tags).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('calls POST /tasks with data', async () => {
      const data = { title: 'New Task', projectId: 'p1', priority: 'NORMAL' as const };
      const backendResp = { id: 't2', code: 'TSK-002', ...data, status: 'BACKLOG', progress: 0, tags: null, comments: [], dependencies: [] };
      mockPost.mockResolvedValue({ data: backendResp } as never);

      const result = await tasksApi.createTask(data);
      expect(mockPost).toHaveBeenCalledWith('/tasks', data);
      expect(result.id).toBe('t2');
    });
  });

  describe('changeStatus', () => {
    it('calls PATCH /tasks/:id/status', async () => {
      const resp = { id: 't1', code: 'TSK-001', title: 'Test', status: 'DONE', priority: 'NORMAL', progress: 100, tags: null, comments: [], dependencies: [] };
      mockPatch.mockResolvedValue({ data: resp } as never);

      const result = await tasksApi.changeStatus('t1', 'DONE');
      expect(mockPatch).toHaveBeenCalledWith('/tasks/t1/status', { status: 'DONE' });
      expect(result.status).toBe('DONE');
    });
  });

  describe('assignTask', () => {
    it('calls PATCH /tasks/:id/assign', async () => {
      const resp = { id: 't1', code: 'TSK-001', title: 'Test', status: 'TODO', priority: 'NORMAL', progress: 0, assigneeName: 'Jane', tags: null, comments: [], dependencies: [] };
      mockPatch.mockResolvedValue({ data: resp } as never);

      const result = await tasksApi.assignTask('t1', 'u1', 'Jane');
      expect(mockPatch).toHaveBeenCalledWith('/tasks/t1/assign', { assigneeId: 'u1', assigneeName: 'Jane' });
      expect(result.assigneeName).toBe('Jane');
    });
  });

  describe('addComment', () => {
    it('calls POST /tasks/:id/comments', async () => {
      const backendComment = { id: 'cm1', taskId: 't1', authorName: 'John', content: 'Good progress', createdAt: '2026-02-21T00:00:00Z' };
      mockPost.mockResolvedValue({ data: backendComment } as never);

      const result = await tasksApi.addComment('t1', 'Good progress');
      expect(mockPost).toHaveBeenCalledWith('/tasks/t1/comments', { content: 'Good progress', authorName: '' });
      expect(result.content).toBe('Good progress');
    });
  });

  describe('getProjectTaskSummary', () => {
    it('returns empty summary for undefined projectId', async () => {
      const result = await tasksApi.getProjectTaskSummary();
      expect(result.totalTasks).toBe(0);
      expect(result.byStatus).toEqual([]);
      expect(result.byPriority).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('fetches and maps summary for projectId', async () => {
      const summaryResp = { totalTasks: 10, statusCounts: { TODO: 3, IN_PROGRESS: 5, DONE: 2 }, priorityCounts: { HIGH: 4, NORMAL: 6 } };
      const overdueResp = [{ id: 't1' }, { id: 't2' }];
      mockGet
        .mockResolvedValueOnce({ data: summaryResp } as never)
        .mockResolvedValueOnce({ data: overdueResp } as never);

      const result = await tasksApi.getProjectTaskSummary('p1');
      expect(result.totalTasks).toBe(10);
      expect(result.overdue).toBe(2);
      expect(result.byStatus).toHaveLength(3);
      expect(result.byPriority).toHaveLength(2);
    });
  });

  describe('getMilestones', () => {
    it('calls GET /milestones and maps results', async () => {
      const backendMilestones = [{ id: 'm1', name: 'Phase 1 Complete', dueDate: '2026-06-01', status: 'PENDING', progress: null }];
      mockGet.mockResolvedValue({ data: { content: backendMilestones } } as never);

      const result = await tasksApi.getMilestones();
      expect(mockGet).toHaveBeenCalledWith('/milestones');
      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(0);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Forbidden');
      mockGet.mockRejectedValue(error);

      await expect(tasksApi.getTasks()).rejects.toThrow('Forbidden');
    });
  });
});
