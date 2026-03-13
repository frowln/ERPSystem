import { apiClient } from './client';

export interface SelfEmployedWorker {
  id: string;
  fullName: string;
  inn: string;
  phone?: string;
  email?: string;
  npdStatus: 'ACTIVE' | 'INACTIVE' | 'NOT_REGISTERED' | 'UNKNOWN';
  npdVerifiedAt?: string;
  contractType: 'GPC' | 'SERVICE' | 'SUBCONTRACT';
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  specialization?: string;
  hourlyRate?: number;
  projectIds: string[];
  totalPaid: number;
  totalActsPending: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionAct {
  id: string;
  workerId: string;
  workerName: string;
  projectId: string;
  projectName: string;
  actNumber: string;
  description: string;
  amount: number;
  period: string;
  status: 'DRAFT' | 'SIGNED' | 'PAID' | 'CANCELLED';
  signedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export const selfEmployedCoreApi = {
  getWorkers: (params?: Record<string, string>) =>
    apiClient.get('/self-employed/workers', { params }).then(r => r.data),
  getWorker: (id: string) =>
    apiClient.get(`/self-employed/workers/${id}`).then(r => r.data),
  createWorker: (data: Partial<SelfEmployedWorker>) =>
    apiClient.post('/self-employed/workers', data).then(r => r.data),
  updateWorker: (id: string, data: Partial<SelfEmployedWorker>) =>
    apiClient.put(`/self-employed/workers/${id}`, data).then(r => r.data),
  deleteWorker: (id: string) =>
    apiClient.delete(`/self-employed/workers/${id}`).then(r => r.data),
  verifyNpd: (inn: string) =>
    apiClient.post('/self-employed/verify-npd', { inn }).then(r => r.data),
  getActs: (workerId?: string) =>
    apiClient.get('/self-employed/acts', { params: workerId ? { workerId } : {} }).then(r => r.data),
  createAct: (data: Partial<CompletionAct>) =>
    apiClient.post('/self-employed/acts', data).then(r => r.data),
  signAct: (actId: string) =>
    apiClient.patch(`/self-employed/acts/${actId}/sign`).then(r => r.data),
  payAct: (actId: string) =>
    apiClient.patch(`/self-employed/acts/${actId}/pay`).then(r => r.data),
};
