// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectsApi } from './projects';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('projectsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('calls GET /projects without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await projectsApi.getProjects();
      expect(mockGet).toHaveBeenCalledWith('/projects', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /projects', async () => {
      const params = { status: 'IN_PROGRESS' as const, page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await projectsApi.getProjects(params);
      expect(mockGet).toHaveBeenCalledWith('/projects', { params });
    });
  });

  describe('getProject', () => {
    it('calls GET /projects/:id', async () => {
      const mockProject = { id: 'p1', name: 'Project 1' };
      mockGet.mockResolvedValue({ data: mockProject } as never);

      const result = await projectsApi.getProject('p1');
      expect(mockGet).toHaveBeenCalledWith('/projects/p1');
      expect(result).toEqual(mockProject);
    });
  });

  describe('createProject', () => {
    it('calls POST /projects with data', async () => {
      const projectData = { name: 'New Project', description: 'Desc' };
      const created = { id: 'p1', ...projectData };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await projectsApi.createProject(projectData as never);
      expect(mockPost).toHaveBeenCalledWith('/projects', projectData);
      expect(result).toEqual(created);
    });
  });

  describe('updateProject', () => {
    it('calls PUT /projects/:id with data', async () => {
      const updateData = { name: 'Updated' };
      const updated = { id: 'p1', name: 'Updated' };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await projectsApi.updateProject('p1', updateData as never);
      expect(mockPut).toHaveBeenCalledWith('/projects/p1', updateData);
      expect(result).toEqual(updated);
    });
  });

  describe('changeStatus', () => {
    it('calls PATCH /projects/:id/status', async () => {
      const updated = { id: 'p1', status: 'COMPLETED' };
      mockPatch.mockResolvedValue({ data: updated } as never);

      const result = await projectsApi.changeStatus('p1', 'COMPLETED' as never);
      expect(mockPatch).toHaveBeenCalledWith('/projects/p1/status', { status: 'COMPLETED' });
      expect(result).toEqual(updated);
    });
  });

  describe('getProjectMembers', () => {
    it('calls GET /projects/:id/members', async () => {
      const members = [{ id: 'm1', userId: 'u1', role: 'LEAD' }];
      mockGet.mockResolvedValue({ data: members } as never);

      const result = await projectsApi.getProjectMembers('p1');
      expect(mockGet).toHaveBeenCalledWith('/projects/p1/members');
      expect(result).toEqual(members);
    });
  });

  describe('addMember', () => {
    it('calls POST /projects/:id/members with data', async () => {
      const memberData = { userId: 'u1', role: 'ENGINEER' };
      const created = { id: 'm1', ...memberData };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await projectsApi.addMember('p1', memberData);
      expect(mockPost).toHaveBeenCalledWith('/projects/p1/members', memberData);
      expect(result).toEqual(created);
    });
  });

  describe('removeMember', () => {
    it('calls DELETE /projects/:id/members/:memberId', async () => {
      mockDelete.mockResolvedValue({} as never);

      await projectsApi.removeMember('p1', 'm1');
      expect(mockDelete).toHaveBeenCalledWith('/projects/p1/members/m1');
    });
  });

  describe('getProjectFinancials', () => {
    it('calls GET /projects/:id/financials', async () => {
      const financials = { totalBudget: 100000, spent: 50000 };
      mockGet.mockResolvedValue({ data: financials } as never);

      const result = await projectsApi.getProjectFinancials('p1');
      expect(mockGet).toHaveBeenCalledWith('/projects/p1/financials');
      expect(result).toEqual(financials);
    });
  });

  describe('getDashboardSummary', () => {
    it('calls GET /projects/dashboard/summary', async () => {
      const summary = { totalProjects: 5, activeProjects: 3 };
      mockGet.mockResolvedValue({ data: summary } as never);

      const result = await projectsApi.getDashboardSummary();
      expect(mockGet).toHaveBeenCalledWith('/projects/dashboard/summary');
      expect(result).toEqual(summary);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(projectsApi.getProjects()).rejects.toThrow('Network Error');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(projectsApi.createProject({} as never)).rejects.toThrow('Validation Error');
    });
  });
});
