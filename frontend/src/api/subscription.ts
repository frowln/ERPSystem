import { apiClient } from './client';

export interface SubscriptionPlan {
  id: string;
  name: 'FREE' | 'PRO' | 'ENTERPRISE';
  displayName: string;
  price: number;
  currency: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  maxUsers: number;
  maxProjects: number;
  maxStorageGb: number;
  features: string[];
  isActive: boolean;
}

export interface TenantSubscription {
  id: string;
  organizationId: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  statusDisplayName: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  createdAt: string;
}

export interface QuotaInfo {
  quotaType: string;
  current: number;
  max: number;
  exceeded: boolean;
}

export interface UsageInfo {
  planName: string;
  planDisplayName: string;
  quotas: QuotaInfo[];
}

export type BillingType = 'SUBSCRIPTION' | 'UPGRADE' | 'DOWNGRADE' | 'ADDON' | 'REFUND';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export interface BillingRecord {
  id: string;
  planName: string;
  planDisplayName: string;
  amount: number;
  currency: string;
  billingType: BillingType;
  billingTypeDisplayName: string;
  paymentStatus: PaymentStatus;
  paymentStatusDisplayName: string;
  invoiceDate: string;
  paidDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  invoiceNumber: string | null;
  description: string | null;
}

export interface PaginatedBillingRecords {
  content: BillingRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get<SubscriptionPlan[]>('/subscriptions/plans');
    return response.data;
  },

  getCurrentSubscription: async (): Promise<TenantSubscription> => {
    const response = await apiClient.get<TenantSubscription>('/subscriptions/current');
    return response.data;
  },

  changePlan: async (planId: string): Promise<TenantSubscription> => {
    const response = await apiClient.post<TenantSubscription>('/subscriptions/change', { planId });
    return response.data;
  },

  getUsage: async (): Promise<UsageInfo> => {
    const response = await apiClient.get<UsageInfo>('/subscriptions/usage');
    return response.data;
  },

  checkFeature: async (featureKey: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>('/subscriptions/check-feature', {
      params: { featureKey },
    });
    return response.data;
  },

  checkQuota: async (quotaType: string): Promise<QuotaInfo> => {
    const response = await apiClient.get<QuotaInfo>('/subscriptions/check-quota', {
      params: { quotaType },
    });
    return response.data;
  },

  getBillingHistory: async (page = 0, size = 20): Promise<PaginatedBillingRecords> => {
    const response = await apiClient.get<PaginatedBillingRecords>('/subscriptions/billing-history', {
      params: { page, size },
    });
    return response.data;
  },
};
