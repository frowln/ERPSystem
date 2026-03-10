// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hrApi } from './hr';

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

describe('hrApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('calls GET /employees without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await hrApi.getEmployees();
      expect(mockGet).toHaveBeenCalledWith('/employees', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /employees', async () => {
      const params = { status: 'ACTIVE', search: 'John', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await hrApi.getEmployees(params);
      expect(mockGet).toHaveBeenCalledWith('/employees', { params });
    });
  });

  describe('getEmployee', () => {
    it('calls GET /employees/:id', async () => {
      const employee = { id: 'e1', firstName: 'John', lastName: 'Doe' };
      mockGet.mockResolvedValue({ data: employee } as never);

      const result = await hrApi.getEmployee('e1');
      expect(mockGet).toHaveBeenCalledWith('/employees/e1');
      expect(result).toEqual(employee);
    });
  });

  describe('getTimesheets', () => {
    it('calls GET /timesheets without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await hrApi.getTimesheets();
      expect(mockGet).toHaveBeenCalledWith('/timesheets', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params to GET /timesheets', async () => {
      const params = { page: 1, size: 10 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await hrApi.getTimesheets(params);
      expect(mockGet).toHaveBeenCalledWith('/timesheets', { params });
    });
  });

  describe('createEmployee', () => {
    it('calls POST /employees with data', async () => {
      const employeeData = { firstName: 'Jane', lastName: 'Smith', position: 'Engineer' };
      const created = { id: 'e2', ...employeeData };
      mockPost.mockResolvedValue({ data: created } as never);

      const result = await hrApi.createEmployee(employeeData as never);
      expect(mockPost).toHaveBeenCalledWith('/employees', employeeData);
      expect(result).toEqual(created);
    });
  });

  describe('getTimesheet', () => {
    it('calls GET /timesheets/:id', async () => {
      const timesheet = { id: 't1', month: '2026-01', employeeId: 'e1' };
      mockGet.mockResolvedValue({ data: timesheet } as never);

      const result = await hrApi.getTimesheet('t1');
      expect(mockGet).toHaveBeenCalledWith('/timesheets/t1');
      expect(result).toEqual(timesheet);
    });
  });

  describe('getCrews', () => {
    it('calls GET /crew without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData } as never);

      const result = await hrApi.getCrews();
      expect(mockGet).toHaveBeenCalledWith('/crew', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params to GET /crew', async () => {
      const params = { page: 0, size: 50 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } } as never);

      await hrApi.getCrews(params);
      expect(mockGet).toHaveBeenCalledWith('/crew', { params });
    });
  });

  describe('error handling', () => {
    it('returns empty page on getEmployees API error (localStorage fallback)', async () => {
      const error = new Error('Server Error');
      mockGet.mockRejectedValue(error);

      const result = await hrApi.getEmployees();
      expect(result).toEqual({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(hrApi.createEmployee({} as never)).rejects.toThrow('Validation Error');
    });
  });
});
