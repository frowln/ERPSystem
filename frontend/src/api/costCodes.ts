import { apiClient } from './client';

export interface CostCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  standard: 'CUSTOM' | 'CSI' | 'GESN';
  isActive: boolean;
  children?: CostCode[];
  createdAt?: string;
}

export const costCodesApi = {
  getCostCodes: async (): Promise<CostCode[]> => {
    const { data } = await apiClient.get('/finance/cost-codes');
    return data.data ?? data;
  },
  getTree: async (): Promise<CostCode[]> => {
    const { data } = await apiClient.get('/finance/cost-codes/tree');
    return data.data ?? data;
  },
  getCostCode: async (id: string): Promise<CostCode> => {
    const { data } = await apiClient.get(`/cost-codes/${id}`);
    return data.data ?? data;
  },
  createCostCode: async (payload: Partial<CostCode>): Promise<CostCode> => {
    const { data } = await apiClient.post('/finance/cost-codes', payload);
    return data.data ?? data;
  },
  updateCostCode: async (id: string, payload: Partial<CostCode>): Promise<CostCode> => {
    const { data } = await apiClient.put(`/cost-codes/${id}`, payload);
    return data.data ?? data;
  },
  deleteCostCode: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-codes/${id}`);
  },
  seedStandard: async (standard: 'CSI' | 'GESN'): Promise<void> => {
    await apiClient.post(`/finance/cost-codes/seed/${standard}`);
  },
};
