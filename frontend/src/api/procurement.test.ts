// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { procurementApi } from './procurement';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe('procurementApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPurchaseRequests calls GET /procurement/requests with params', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
    mockGet.mockResolvedValueOnce({ data: page });

    const result = await procurementApi.getPurchaseRequests({ page: 0, size: 20 });

    expect(result).toEqual(page);
    expect(mockGet).toHaveBeenCalledWith('/procurement/requests', {
      params: { page: 0, size: 20, statuses: undefined },
    });
  });

  it('getPurchaseRequests joins statuses into comma-separated string', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
    mockGet.mockResolvedValueOnce({ data: page });

    await procurementApi.getPurchaseRequests({ page: 0, size: 20, statuses: ['DRAFT', 'SUBMITTED'] as never });

    expect(mockGet).toHaveBeenCalledWith('/procurement/requests', {
      params: { page: 0, size: 20, statuses: 'DRAFT,SUBMITTED' },
    });
  });

  it('getPurchaseRequestCounters calls GET /procurement/requests/counters', async () => {
    const counters = { all: 10, my: 3, inApproval: 2, inWork: 4, delivered: 1 };
    mockGet.mockResolvedValueOnce({ data: counters });

    const result = await procurementApi.getPurchaseRequestCounters({ projectId: 'p1' });

    expect(result).toEqual(counters);
    expect(mockGet).toHaveBeenCalledWith('/procurement/requests/counters', {
      params: { projectId: 'p1' },
    });
  });

  it('getPurchaseRequest calls GET /procurement/requests/:id', async () => {
    const request = { id: 'pr1', status: 'DRAFT' };
    mockGet.mockResolvedValueOnce({ data: request });

    const result = await procurementApi.getPurchaseRequest('pr1');

    expect(result).toEqual(request);
    expect(mockGet).toHaveBeenCalledWith('/procurement/requests/pr1');
  });

  it('createPurchaseRequest calls POST /procurement/requests', async () => {
    const payload = { requestDate: '2026-02-17' };
    const created = { id: 'pr1', ...payload, status: 'DRAFT' };
    mockPost.mockResolvedValueOnce({ data: created });

    const result = await procurementApi.createPurchaseRequest(payload as never);

    expect(result).toEqual(created);
    expect(mockPost).toHaveBeenCalledWith('/procurement/requests', payload);
  });

  it('getProcurementDashboard calls GET /procurement/requests/dashboard with projectId', async () => {
    const dashboard = {
      totalRequests: 2,
      pendingApproval: 1,
      inProgress: 0,
      delivered: 0,
      totalAmount: 1000,
      byStatus: [{ status: 'DRAFT', count: 2 }],
      byPriority: [{ priority: 'MEDIUM', count: 2 }],
    };
    mockGet.mockResolvedValueOnce({ data: dashboard });

    const result = await procurementApi.getProcurementDashboard('p1');

    expect(result).toEqual(dashboard);
    expect(mockGet).toHaveBeenCalledWith('/procurement/requests/dashboard', {
      params: { projectId: 'p1' },
    });
  });

  it('getProcurementDashboard calls GET /procurement/requests/dashboard without projectId', async () => {
    const dashboard = {
      totalRequests: 0,
      pendingApproval: 0,
      inProgress: 0,
      delivered: 0,
      totalAmount: 0,
      byStatus: [],
      byPriority: [],
    };
    mockGet.mockResolvedValueOnce({ data: dashboard });

    const result = await procurementApi.getProcurementDashboard();

    expect(result).toEqual(dashboard);
    expect(mockGet).toHaveBeenCalledWith('/procurement/requests/dashboard', {
      params: undefined,
    });
  });

  it('submitPurchaseRequest calls POST /procurement/requests/:id/submit', async () => {
    const submitted = { id: 'pr1', status: 'SUBMITTED' };
    mockPost.mockResolvedValueOnce({ data: submitted });

    const result = await procurementApi.submitPurchaseRequest('pr1');

    expect(result).toEqual(submitted);
    expect(mockPost).toHaveBeenCalledWith('/procurement/requests/pr1/submit');
  });

  it('getMaterials calls GET /warehouse/materials and maps response', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        content: [
          { id: 'm1', name: 'Concrete', unitOfMeasure: 'm3' },
          { id: 'm2', name: 'Steel', unitOfMeasure: '' },
        ],
      },
    });

    const result = await procurementApi.getMaterials();

    expect(mockGet).toHaveBeenCalledWith('/warehouse/materials', {
      params: { page: 0, size: 500, sort: 'name,asc' },
    });
    expect(result).toEqual([
      { id: 'm1', name: 'Concrete', unit: 'm3' },
      { id: 'm2', name: 'Steel', unit: 'шт' },
    ]);
  });
});
