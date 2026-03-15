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

export interface CreatePaymentResponse {
  billingRecordId: string;
  confirmationUrl: string | null;
  yookassaPaymentId: string | null;
  status: string;
}

export interface BankInvoiceResponse {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  buyerName: string;
  buyerInn: string;
  buyerKpp: string | null;
  buyerAddress: string | null;
  sellerName: string;
  sellerInn: string;
  sellerKpp: string | null;
  sellerBankAccount: string;
  sellerBankBik: string;
  sellerBankName: string;
  createdAt: string | null;
  paidAt: string | null;
}

export interface CreateBankInvoiceRequest {
  planId: string;
  buyerName: string;
  buyerInn: string;
  buyerKpp?: string;
  buyerAddress?: string;
}

const EMPTY_BILLING: PaginatedBillingRecords = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
};

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/subscriptions/plans', { _silentErrors: true } as never);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  getCurrentSubscription: async (): Promise<TenantSubscription | null> => {
    try {
      const response = await apiClient.get<TenantSubscription>('/subscriptions/current', { _silentErrors: true } as never);
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  changePlan: async (planId: string): Promise<TenantSubscription> => {
    const response = await apiClient.post<TenantSubscription>('/subscriptions/change', { planId });
    return response.data;
  },

  getUsage: async (): Promise<UsageInfo> => {
    try {
      const response = await apiClient.get<UsageInfo>('/subscriptions/usage', { _silentErrors: true } as never);
      return response.data ?? { planName: '', planDisplayName: '', quotas: [] };
    } catch {
      return { planName: '', planDisplayName: '', quotas: [] };
    }
  },

  checkFeature: async (featureKey: string): Promise<boolean> => {
    try {
      const response = await apiClient.get<boolean>('/subscriptions/check-feature', {
        params: { featureKey },
        _silentErrors: true,
      } as never);
      return response.data ?? false;
    } catch {
      return false;
    }
  },

  checkQuota: async (quotaType: string): Promise<QuotaInfo> => {
    try {
      const response = await apiClient.get<QuotaInfo>('/subscriptions/check-quota', {
        params: { quotaType },
        _silentErrors: true,
      } as never);
      return response.data ?? { quotaType, current: 0, max: 0, exceeded: false };
    } catch {
      return { quotaType, current: 0, max: 0, exceeded: false };
    }
  },

  getBillingHistory: async (page = 0, size = 20): Promise<PaginatedBillingRecords> => {
    try {
      const response = await apiClient.get<PaginatedBillingRecords>('/subscriptions/billing-history', {
        params: { page, size },
        _silentErrors: true,
      } as never);
      return response.data ?? EMPTY_BILLING;
    } catch {
      return EMPTY_BILLING;
    }
  },

  createPayment: async (planId: string): Promise<CreatePaymentResponse> => {
    const response = await apiClient.post<{ data: CreatePaymentResponse }>('/payments/create', { planId });
    return response.data.data;
  },

  createBankInvoice: async (data: CreateBankInvoiceRequest): Promise<BankInvoiceResponse> => {
    const response = await apiClient.post<{ data: BankInvoiceResponse }>('/payments/bank-invoice', data);
    return response.data.data;
  },

  listBankInvoices: async (): Promise<BankInvoiceResponse[]> => {
    try {
      const response = await apiClient.get<{ data: BankInvoiceResponse[] }>('/payments/bank-invoices', { _silentErrors: true } as never);
      return response.data.data ?? [];
    } catch {
      return [];
    }
  },
};
