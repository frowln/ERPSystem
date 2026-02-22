// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from './analytics';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);

describe('analyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardData calls GET /analytics/dashboard with params', async () => {
    const dashboardData = {
      projectStatusSummary: [{ status: 'IN_PROGRESS', label: 'In Progress', count: 3, color: '#3b82f6' }],
      financialBars: [{ month: '2026-01', revenue: 100, cost: 40, profit: 60 }],
      safetyMetrics: [],
      taskBurndown: [],
      procurementSpend: [],
      warehouseStockLevels: [],
    };
    mockGet.mockResolvedValue({ data: dashboardData });

    const result = await analyticsApi.getDashboardData({
      projectId: 'p1',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    expect(mockGet).toHaveBeenCalledWith('/analytics/dashboard', {
      params: { projectId: 'p1', dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    });
    expect(result).toEqual(dashboardData);
  });

  it('getDashboardData calls GET /analytics/dashboard without params', async () => {
    const dashboardData = {
      projectStatusSummary: [],
      financialBars: [],
      safetyMetrics: [],
      taskBurndown: [],
      procurementSpend: [],
      warehouseStockLevels: [],
    };
    mockGet.mockResolvedValue({ data: dashboardData });

    const result = await analyticsApi.getDashboardData();

    expect(mockGet).toHaveBeenCalledWith('/analytics/dashboard', { params: undefined });
    expect(result).toEqual(dashboardData);
  });

  it('getProjectStatusSummary calls GET /analytics/project-status', async () => {
    const statuses = [
      { status: 'IN_PROGRESS', label: 'In Progress', count: 3, color: '#3b82f6' },
      { status: 'COMPLETED', label: 'Completed', count: 2, color: '#22c55e' },
    ];
    mockGet.mockResolvedValue({ data: statuses });

    const result = await analyticsApi.getProjectStatusSummary();

    expect(mockGet).toHaveBeenCalledWith('/analytics/project-status');
    expect(result).toEqual(statuses);
  });

  it('getFinancialBars calls GET /analytics/financial with params', async () => {
    const bars = [{ month: '2026-01', revenue: 100, cost: 40, profit: 60 }];
    mockGet.mockResolvedValue({ data: bars });

    const result = await analyticsApi.getFinancialBars({ projectId: 'p1' });

    expect(mockGet).toHaveBeenCalledWith('/analytics/financial', { params: { projectId: 'p1' } });
    expect(result).toEqual(bars);
  });

  it('getSafetyMetrics calls GET /analytics/safety with params', async () => {
    const metrics = [{ month: '2026-01', incidents: 1, nearMisses: 2, inspections: 7, daysWithoutIncident: 30 }];
    mockGet.mockResolvedValue({ data: metrics });

    const result = await analyticsApi.getSafetyMetrics({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });

    expect(mockGet).toHaveBeenCalledWith('/analytics/safety', {
      params: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    });
    expect(result).toEqual(metrics);
  });

  it('getTaskBurndown calls GET /analytics/task-burndown/:projectId', async () => {
    const burndown = [{ date: '2026-01-01', planned: 100, actual: 85, ideal: 100 }];
    mockGet.mockResolvedValue({ data: burndown });

    const result = await analyticsApi.getTaskBurndown('p1');

    expect(mockGet).toHaveBeenCalledWith('/analytics/task-burndown/p1');
    expect(result).toEqual(burndown);
  });

  it('getProcurementSpend calls GET /analytics/procurement-spend with params', async () => {
    const spend = [{ category: 'Materials', planned: 250, actual: 200 }];
    mockGet.mockResolvedValue({ data: spend });

    const result = await analyticsApi.getProcurementSpend({ projectId: 'p1' });

    expect(mockGet).toHaveBeenCalledWith('/analytics/procurement-spend', { params: { projectId: 'p1' } });
    expect(result).toEqual(spend);
  });

  it('getWarehouseStockLevels calls GET /analytics/warehouse-stock', async () => {
    const levels = [{ category: 'ALL', label: 'Materials', currentStock: 90, minStock: 30, maxStock: 100, value: 1500 }];
    mockGet.mockResolvedValue({ data: levels });

    const result = await analyticsApi.getWarehouseStockLevels();

    expect(mockGet).toHaveBeenCalledWith('/analytics/warehouse-stock');
    expect(result).toEqual(levels);
  });

  it('exportReport calls GET /analytics/export/:type with blob responseType', async () => {
    const blob = new Blob(['ok'], { type: 'application/pdf' });
    mockGet.mockResolvedValue({ data: blob });

    const result = await analyticsApi.exportReport('project-summary', { projectId: 'p1' });

    expect(result).toBe(blob);
    expect(mockGet).toHaveBeenCalledWith('/analytics/export/project-summary', {
      params: { projectId: 'p1' },
      responseType: 'blob',
    });
  });
});
