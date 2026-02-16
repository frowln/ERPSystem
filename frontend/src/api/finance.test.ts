// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeApi } from './finance';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe('financeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBudgets', () => {
    it('calls GET /budgets without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await financeApi.getBudgets();
      expect(mockGet).toHaveBeenCalledWith('/budgets', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes filter params to GET /budgets', async () => {
      const params = { status: 'ACTIVE', projectId: 'p1', page: 0, size: 20 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await financeApi.getBudgets(params);
      expect(mockGet).toHaveBeenCalledWith('/budgets', { params });
    });

    it('passes search filter', async () => {
      const params = { search: 'test' };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await financeApi.getBudgets(params);
      expect(mockGet).toHaveBeenCalledWith('/budgets', { params });
    });
  });

  describe('getBudget', () => {
    it('calls GET /budgets/:id', async () => {
      const mockBudget = { id: '123', name: 'Budget 1' };
      mockGet.mockResolvedValue({ data: mockBudget });

      const result = await financeApi.getBudget('123');
      expect(mockGet).toHaveBeenCalledWith('/budgets/123');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getBudgetItems', () => {
    it('calls GET /budgets/:id/items', async () => {
      const mockItems = [{ id: 'i1', name: 'Item 1' }];
      mockGet.mockResolvedValue({ data: mockItems });

      const result = await financeApi.getBudgetItems('b1');
      expect(mockGet).toHaveBeenCalledWith('/budgets/b1/items');
      expect(result).toEqual(mockItems);
    });
  });

  describe('getPayments', () => {
    it('calls GET /payments without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await financeApi.getPayments();
      expect(mockGet).toHaveBeenCalledWith('/payments', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params', async () => {
      const params = { page: 1, size: 10 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 0 } });

      await financeApi.getPayments(params);
      expect(mockGet).toHaveBeenCalledWith('/payments', { params });
    });
  });

  describe('getInvoices', () => {
    it('calls GET /invoices without params', async () => {
      const mockData = { content: [], totalElements: 0 };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await financeApi.getInvoices();
      expect(mockGet).toHaveBeenCalledWith('/invoices', { params: undefined });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params to invoices', async () => {
      const params = { page: 2, size: 25 };
      mockGet.mockResolvedValue({ data: { content: [], totalElements: 50 } });

      await financeApi.getInvoices(params);
      expect(mockGet).toHaveBeenCalledWith('/invoices', { params });
    });
  });

  describe('createBudget', () => {
    it('calls POST /budgets with data', async () => {
      const budgetData = { name: 'New Budget', projectId: 'p1' };
      const created = { id: 'b1', ...budgetData };
      mockPost.mockResolvedValue({ data: created });

      const result = await financeApi.createBudget(budgetData);
      expect(mockPost).toHaveBeenCalledWith('/budgets', budgetData);
      expect(result).toEqual(created);
    });
  });

  describe('createPayment', () => {
    it('calls POST /payments with data', async () => {
      const paymentData = { amount: 1000, description: 'Payment' };
      const created = { id: 'pay1', ...paymentData };
      mockPost.mockResolvedValue({ data: created });

      const result = await financeApi.createPayment(paymentData);
      expect(mockPost).toHaveBeenCalledWith('/payments', paymentData);
      expect(result).toEqual(created);
    });
  });

  describe('createInvoice', () => {
    it('calls POST /invoices with data', async () => {
      const invoiceData = { amount: 5000, number: 'INV-001' };
      const created = { id: 'inv1', ...invoiceData };
      mockPost.mockResolvedValue({ data: created });

      const result = await financeApi.createInvoice(invoiceData);
      expect(mockPost).toHaveBeenCalledWith('/invoices', invoiceData);
      expect(result).toEqual(created);
    });
  });

  describe('getInvoice', () => {
    it('calls GET /invoices/:id', async () => {
      const mockInvoice = { id: 'inv1', number: 'INV-001' };
      mockGet.mockResolvedValue({ data: mockInvoice });

      const result = await financeApi.getInvoice('inv1');
      expect(mockGet).toHaveBeenCalledWith('/invoices/inv1');
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('getPayment', () => {
    it('calls GET /payments/:id', async () => {
      const mockPayment = { id: 'pay1', amount: 1000 };
      mockGet.mockResolvedValue({ data: mockPayment });

      const result = await financeApi.getPayment('pay1');
      expect(mockGet).toHaveBeenCalledWith('/payments/pay1');
      expect(result).toEqual(mockPayment);
    });
  });

  describe('getCashFlow', () => {
    it('calls GET /cash-flow', async () => {
      const mockCashFlow = [{ id: '1', month: '2026-01', incoming: 100, outgoing: 50, net: 50 }];
      mockGet.mockResolvedValue({ data: mockCashFlow });

      const result = await financeApi.getCashFlow();
      expect(mockGet).toHaveBeenCalledWith('/cash-flow');
      expect(result).toEqual(mockCashFlow);
    });
  });

  describe('getCashFlowChart', () => {
    it('calls GET /cash-flow/chart', async () => {
      const mockChart = {
        startBalance: 10000,
        monthlyData: [{ month: 'January', monthShort: 'Jan', inflow: 5000, outflow: 3000 }],
      };
      mockGet.mockResolvedValue({ data: mockChart });

      const result = await financeApi.getCashFlowChart();
      expect(mockGet).toHaveBeenCalledWith('/cash-flow/chart');
      expect(result).toEqual(mockChart);
    });
  });

  describe('error propagation', () => {
    it('propagates API errors from get requests', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(financeApi.getBudgets()).rejects.toThrow('Network Error');
    });

    it('propagates API errors from post requests', async () => {
      const error = new Error('Validation Error');
      mockPost.mockRejectedValue(error);

      await expect(financeApi.createBudget({})).rejects.toThrow('Validation Error');
    });
  });
});
