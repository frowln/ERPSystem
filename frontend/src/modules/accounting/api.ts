import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type AccountType = 'ACTIVE' | 'PASSIVE' | 'ACTIVE_PASSIVE';

export interface AccountPlan {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  balance: number;
  children?: AccountPlan[];
}

export interface AccountEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  debitAccountId: string;
  debitAccountCode: string;
  debitAccountName?: string;
  creditAccountId: string;
  creditAccountCode: string;
  creditAccountName?: string;
  amount: number;
  periodId?: string;
  journalId?: string;
  document?: string;
  projectId?: string;
  projectName?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
}

export interface AccountEntryFilters extends PaginationParams {
  periodId?: string;
  journalId?: string;
  accountCode?: string;
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  search?: string;
}

export interface AccountFilters extends PaginationParams {
  type?: AccountType;
}

export const accountingApi = {
  // Chart of Accounts
  getChartOfAccounts: async (params?: AccountFilters): Promise<PaginatedResponse<AccountPlan>> => {
    const response = await apiClient.get<PaginatedResponse<AccountPlan>>('/accounting/accounts', { params });
    return response.data;
  },

  getAccount: async (id: string): Promise<AccountPlan> => {
    const response = await apiClient.get<AccountPlan>(`/accounting/accounts/${id}`);
    return response.data;
  },

  // Periods
  openPeriod: async (year: number, month: number): Promise<void> => {
    await apiClient.post('/accounting/periods', null, {
      params: { year, month },
    });
  },

  closePeriod: async (id: string): Promise<void> => {
    await apiClient.post(`/accounting/periods/${id}/close`);
  },

  // Account Entries
  getEntries: async (params?: AccountEntryFilters): Promise<PaginatedResponse<AccountEntry>> => {
    const response = await apiClient.get<PaginatedResponse<AccountEntry>>('/accounting/entries', { params });
    return response.data;
  },

  getEntryById: async (id: string): Promise<AccountEntry> => {
    const response = await apiClient.get<AccountEntry>(`/accounting/entries/${id}`);
    return response.data;
  },

  create: async (data: Partial<AccountEntry>): Promise<AccountEntry> => {
    const response = await apiClient.post<AccountEntry>('/accounting/entries', data);
    return response.data;
  },

  update: async (id: string, data: Partial<AccountEntry>): Promise<AccountEntry> => {
    const response = await apiClient.put<AccountEntry>(`/accounting/entries/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounting/entries/${id}`);
  },
};
