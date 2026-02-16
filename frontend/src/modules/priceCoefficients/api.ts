import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { PriceCoefficient, PriceCoefficientCalculation } from './types';

export interface PriceCoefficientFilters extends PaginationParams {
  type?: string;
  status?: string;
  search?: string;
  projectId?: string;
}

export const priceCoefficientApi = {
  getAll: async (params?: PriceCoefficientFilters): Promise<PaginatedResponse<PriceCoefficient>> => {
    const response = await apiClient.get<PaginatedResponse<PriceCoefficient>>('/price-coefficients', { params });
    return response.data;
  },

  getById: async (id: string): Promise<PriceCoefficient> => {
    const response = await apiClient.get<PriceCoefficient>(`/price-coefficients/${id}`);
    return response.data;
  },

  create: async (data: Partial<PriceCoefficient>): Promise<PriceCoefficient> => {
    const response = await apiClient.post<PriceCoefficient>('/price-coefficients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PriceCoefficient>): Promise<PriceCoefficient> => {
    const response = await apiClient.put<PriceCoefficient>(`/price-coefficients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/price-coefficients/${id}`);
  },

  calculatePrice: async (basePrice: number, coefficientIds: string[]): Promise<PriceCoefficientCalculation> => {
    const response = await apiClient.post<PriceCoefficientCalculation>('/price-coefficients/calculate', {
      basePrice,
      coefficientIds,
    });
    return response.data;
  },
};
