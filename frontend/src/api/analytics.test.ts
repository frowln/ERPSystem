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

  it('getDashboardData aggregates multiple analytics endpoints', async () => {
    const statusData = { byStatus: { IN_PROGRESS: 3, PLANNING: 2 }, totalProjects: 5 };
    const financialData = [{ month: '2026-01', revenue: 100, cost: 40, profit: 60 }];
    const safetyData: unknown[] = [];
    const taskData = { totalTasks: 10, byStatus: { DONE: 5, IN_PROGRESS: 3, TODO: 2 }, completionPercent: 50, overdueTasks: 1 };
    const procurementData: unknown[] = [];
    const warehouseData: unknown[] = [];

    mockGet
      .mockResolvedValueOnce({ data: statusData })        // /analytics/project-status
      .mockResolvedValueOnce({ data: financialData })      // /analytics/financial
      .mockResolvedValueOnce({ data: safetyData })         // /analytics/safety
      .mockResolvedValueOnce({ data: taskData })           // /analytics/task-progress
      .mockResolvedValueOnce({ data: procurementData })    // /analytics/procurement-spend
      .mockResolvedValueOnce({ data: warehouseData });     // /analytics/warehouse-stock

    const result = await analyticsApi.getDashboardData({
      projectId: 'p1',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    expect(mockGet).toHaveBeenCalledTimes(6);
    expect(result.projectStatusSummary).toHaveLength(2);
    expect(result.projectStatusSummary[0]).toMatchObject({ status: 'IN_PROGRESS', count: 3 });
    expect(result.financialBars).toEqual(financialData);
    expect(result.safetyMetrics).toEqual([]);
    expect(result.taskBurndown.length).toBeGreaterThan(0);
  });

  it('getDashboardData returns empty data on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const result = await analyticsApi.getDashboardData();

    expect(result.projectStatusSummary).toEqual([]);
    expect(result.financialBars).toEqual([]);
    expect(result.safetyMetrics).toEqual([]);
    expect(result.taskBurndown).toEqual([]);
    expect(result.procurementSpend).toEqual([]);
    expect(result.warehouseStockLevels).toEqual([]);
  });

  it('getProjectStatusSummary calls GET /analytics/project-status', async () => {
    const status = { status: 'IN_PROGRESS', label: 'In Progress', count: 3, color: '#3b82f6' };
    mockGet.mockResolvedValue({ data: status });

    const result = await analyticsApi.getProjectStatusSummary();

    expect(mockGet).toHaveBeenCalledWith('/analytics/project-status');
    // Backend returns single object, frontend wraps as array
    expect(result).toEqual([status]);
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

  it('getTaskBurndown calls GET /analytics/task-progress with projectId param', async () => {
    const taskProgress = { totalTasks: 100, completedTasks: 85 };
    mockGet.mockResolvedValue({ data: taskProgress });

    const result = await analyticsApi.getTaskBurndown('p1');

    expect(mockGet).toHaveBeenCalledWith('/analytics/task-progress', { params: { projectId: 'p1' } });
    // Backend returns TaskProgressSummary, frontend maps to burndown format
    expect(result).toHaveLength(1);
    expect(result[0].planned).toBe(100);
    expect(result[0].actual).toBe(85);
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
