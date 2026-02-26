import { apiClient } from './client';
import type {
  Contract,
  ContractStatus,
  ContractApproval,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface ContractFilters extends PaginationParams {
  status?: ContractStatus;
  projectId?: string;
  typeId?: string;
  search?: string;
}

export interface ContractDashboard {
  totalContracts: number;
  activeContracts: number;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  byStatus: { status: string; count: number; amount: number }[];
}

export interface Counterparty {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  actualAddress: string;
  bankAccount: string;
  bik: string;
  correspondentAccount: string;
  supplier: boolean;
  customer: boolean;
  active: boolean;
  createdAt: string;
}

export const contractsApi = {
  getContracts: async (params?: ContractFilters): Promise<PaginatedResponse<Contract>> => {
    const response = await apiClient.get<PaginatedResponse<Contract>>('/contracts', { params });
    return response.data;
  },

  getContract: async (id: string): Promise<Contract> => {
    const response = await apiClient.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  createContract: async (data: Partial<Contract>): Promise<Contract> => {
    const response = await apiClient.post<Contract>('/contracts', data);
    return response.data;
  },

  updateContract: async (id: string, data: Partial<Contract>): Promise<Contract> => {
    const response = await apiClient.put<Contract>(`/contracts/${id}`, data);
    return response.data;
  },

  changeContractStatus: async (id: string, status: ContractStatus): Promise<Contract> => {
    const response = await apiClient.patch<Contract>(`/contracts/${id}/status`, { status });
    return response.data;
  },

  getContractApprovals: async (id: string): Promise<ContractApproval[]> => {
    const response = await apiClient.get<ContractApproval[]>(`/contracts/${id}/approvals`);
    return response.data;
  },

  getContractDashboard: async (projectId?: string): Promise<ContractDashboard> => {
    const response = await apiClient.get<ContractDashboard>('/contracts/dashboard', {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },

  getCounterparties: async (params?: { search?: string; size?: number }): Promise<PaginatedResponse<Counterparty>> => {
    const response = await apiClient.get<PaginatedResponse<Counterparty>>('/counterparties', { params });
    return response.data;
  },

  getCounterparty: async (id: string): Promise<Counterparty> => {
    const response = await apiClient.get<Counterparty>(`/counterparties/${id}`);
    return response.data;
  },

  createCounterparty: async (data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await apiClient.post<Counterparty>('/counterparties', data);
    return response.data;
  },

  updateCounterparty: async (id: string, data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await apiClient.put<Counterparty>(`/counterparties/${id}`, data);
    return response.data;
  },

  deleteCounterparty: async (id: string): Promise<void> => {
    await apiClient.delete(`/counterparties/${id}`);
  },
};
