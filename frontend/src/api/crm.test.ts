// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crmApi } from './crm';

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

describe('crmApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeads', () => {
    it('calls GET /v1/crm/leads without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await crmApi.getLeads();
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/leads', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /v1/crm/leads', async () => {
      const params = { status: 'NEW' as never, priority: 'HIGH' as never, search: 'test', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await crmApi.getLeads(params);
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/leads', { params });
    });
  });

  describe('getLead', () => {
    it('calls GET /v1/crm/leads/:id', async () => {
      const lead = { id: 'l1', companyName: 'Acme Corp' };
      mockGet.mockResolvedValue({ data: lead } as never);

      const result = await crmApi.getLead('l1');
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/leads/l1');
      expect(result).toEqual(lead);
    });
  });

  describe('createLead', () => {
    it('calls POST /v1/crm/leads with data', async () => {
      const data = { companyName: 'New Corp', contactName: 'John' };
      const created = { id: 'l2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await crmApi.createLead(data as never);
      expect(mockPost).toHaveBeenCalledWith('/v1/crm/leads', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateLead', () => {
    it('calls PUT /v1/crm/leads/:id with data', async () => {
      const data = { companyName: 'Updated Corp' };
      const updated = { id: 'l1', ...data };
      mockPut.mockResolvedValue({ data: updated } as never);

      const result = await crmApi.updateLead('l1', data as never);
      expect(mockPut).toHaveBeenCalledWith('/v1/crm/leads/l1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('moveLeadToStage', () => {
    it('calls PATCH /v1/crm/leads/:id/stage with stageId', async () => {
      const updated = { id: 'l1', stageId: 's2' };
      mockPatch.mockResolvedValue({ data: updated } as never);

      const result = await crmApi.moveLeadToStage('l1', 's2');
      expect(mockPatch).toHaveBeenCalledWith('/v1/crm/leads/l1/stage/s2');
      expect(result).toEqual(updated);
    });
  });

  describe('getStages', () => {
    it('calls GET /v1/crm/stages', async () => {
      const stages = [{ id: 's1', name: 'New' }, { id: 's2', name: 'Qualified' }];
      mockGet.mockResolvedValue({ data: stages } as never);

      const result = await crmApi.getStages();
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/stages');
      expect(result).toEqual(stages);
    });
  });

  describe('getTeams', () => {
    it('calls GET /v1/crm/teams', async () => {
      const teams = [{ id: 't1', name: 'Sales' }];
      mockGet.mockResolvedValue({ data: teams } as never);

      const result = await crmApi.getTeams();
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/teams');
      expect(result).toEqual(teams);
    });
  });

  describe('getActivities', () => {
    it('calls GET /v1/crm/leads/:id/activities', async () => {
      const activities = [{ id: 'a1', type: 'CALL', description: 'Follow-up' }];
      mockGet.mockResolvedValue({ data: activities } as never);

      const result = await crmApi.getActivities('l1');
      expect(mockGet).toHaveBeenCalledWith('/v1/crm/leads/l1/activities');
      expect(result).toEqual(activities);
    });
  });

  describe('createActivity', () => {
    it('calls POST /v1/crm/activities with data', async () => {
      const data: Record<string, unknown> = { leadId: 'l1', activityType: 'EMAIL', summary: 'Sent proposal' };
      const created = { id: 'a2', ...data };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await crmApi.createActivity(data);
      expect(mockPost).toHaveBeenCalledWith('/v1/crm/activities', data);
      expect(result).toEqual(created);
    });
  });

  describe('deleteLead', () => {
    it('calls DELETE /v1/crm/leads/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await crmApi.deleteLead('l1');
      expect(mockDelete).toHaveBeenCalledWith('/v1/crm/leads/l1');
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Unauthorized');
      mockGet.mockRejectedValue(error);

      await expect(crmApi.getLeads()).rejects.toThrow('Unauthorized');
    });

    it('propagates API errors from patch requests', async () => {
      const error = new Error('Invalid stage');
      mockPatch.mockRejectedValue(error);

      await expect(crmApi.moveLeadToStage('l1', 'bad')).rejects.toThrow('Invalid stage');
    });
  });
});
