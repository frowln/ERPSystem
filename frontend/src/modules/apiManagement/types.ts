// API Management module types

export type ApiKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  scopes: string[];
  createdById: string;
  createdByName: string;
  expiresAt?: string;
  lastUsedAt?: string;
  requestCount: number;
  rateLimit: number;
  ipWhitelist: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookStatus = 'ACTIVE' | 'INACTIVE' | 'FAILED';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  status: WebhookStatus;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
  successCount: number;
  failureCount: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookDeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: WebhookDeliveryStatus;
  url: string;
  requestBody?: string;
  responseStatus?: number;
  responseBody?: string;
  duration?: number;
  attempt: number;
  maxAttempts: number;
  errorMessage?: string;
  deliveredAt?: string;
  createdAt: string;
}
