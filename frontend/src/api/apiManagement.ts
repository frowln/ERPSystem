import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { ApiKey, WebhookConfig, WebhookDelivery, ApiKeyStatus, WebhookStatus } from '@/modules/apiManagement/types';

export interface ApiKeyFilters extends PaginationParams {
  status?: ApiKeyStatus;
  search?: string;
}

export interface WebhookFilters extends PaginationParams {
  status?: WebhookStatus;
  search?: string;
}

export interface WebhookDeliveryFilters extends PaginationParams {
  webhookId?: string;
  status?: string;
}

export const apiManagementApi = {
  getApiKeys: async (params?: ApiKeyFilters): Promise<PaginatedResponse<ApiKey>> => {
    const response = await apiClient.get<PaginatedResponse<ApiKey>>('/api-keys', { params });
    return response.data;
  },

  getApiKey: async (id: string): Promise<ApiKey> => {
    const response = await apiClient.get<ApiKey>(`/api-keys/${id}`);
    return response.data;
  },

  createApiKey: async (data: Partial<ApiKey>): Promise<ApiKey & { fullKey: string }> => {
    const response = await apiClient.post<ApiKey & { fullKey: string }>('/api-keys', data);
    return response.data;
  },

  revokeApiKey: async (id: string): Promise<ApiKey> => {
    const response = await apiClient.patch<ApiKey>(`/api-keys/${id}/revoke`);
    return response.data;
  },

  getWebhooks: async (params?: WebhookFilters): Promise<PaginatedResponse<WebhookConfig>> => {
    const response = await apiClient.get<PaginatedResponse<WebhookConfig>>('/api-keys/webhooks', { params });
    return response.data;
  },

  getWebhook: async (id: string): Promise<WebhookConfig> => {
    const response = await apiClient.get<WebhookConfig>(`/api-keys/webhooks/${id}`);
    return response.data;
  },

  createWebhook: async (data: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const response = await apiClient.post<WebhookConfig>('/api-keys/webhooks', data);
    return response.data;
  },

  updateWebhook: async (id: string, data: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const response = await apiClient.put<WebhookConfig>(`/api-keys/webhooks/${id}`, data);
    return response.data;
  },

  deleteWebhook: async (id: string): Promise<void> => {
    await apiClient.delete(`/api-keys/webhooks/${id}`);
  },

  testWebhook: async (id: string): Promise<WebhookDelivery> => {
    const response = await apiClient.post<WebhookDelivery>(`/api-keys/webhooks/${id}/test`);
    return response.data;
  },

  getDeliveries: async (params?: WebhookDeliveryFilters): Promise<PaginatedResponse<WebhookDelivery>> => {
    const response = await apiClient.get<PaginatedResponse<WebhookDelivery>>('/api-keys/deliveries', { params });
    return response.data;
  },

  retryDelivery: async (id: string): Promise<WebhookDelivery> => {
    const response = await apiClient.post<WebhookDelivery>(`/api-keys/deliveries/${id}/retry`);
    return response.data;
  },
};
