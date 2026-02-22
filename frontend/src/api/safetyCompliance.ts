import { apiClient } from './client';

export interface ComplianceDashboard {
  totalEmployees: number;
  compliantCount: number;
  nonCompliantCount: number;
  expiringSoonCount: number;
  briefingsScheduled: number;
  overdueBriefings: number;
  complianceRate: number;
}

export interface CertificateComplianceItem {
  certificateId: string;
  certificateName: string;
  employeeId: string;
  employeeName: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  daysUntilExpiry: number;
}

export interface CertificateComplianceResponse {
  employeeId: string;
  employeeName: string;
  isCompliant: boolean;
  certificates: CertificateComplianceItem[];
  expiredCount: number;
  expiringSoonCount: number;
}

export interface AccessComplianceResponse {
  employeeId: string;
  employeeName: string;
  accessAllowed: boolean;
  blockReasons: string[];
  activeBlockId?: string;
}

export interface AccessBlock {
  id: string;
  employeeId: string;
  employeeName?: string;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED';
  blockedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface PrescriptionTracker {
  id: string;
  prescriptionNumber: string;
  description: string;
  issuedBy: string;
  issuedAt: string;
  deadline: string;
  daysRemaining: number;
  status: 'ACTIVE' | 'OVERDUE' | 'RESOLVED';
  responsiblePerson?: string;
}

export interface BriefingRule {
  id: string;
  rolePattern: string;
  hazardType: string;
  briefingType: 'INITIAL' | 'REPEAT' | 'UNSCHEDULED' | 'TARGET';
  frequencyDays: number;
  description: string;
  createdAt: string;
}

export const safetyComplianceApi = {
  getDashboard: async (): Promise<ComplianceDashboard> => {
    const response = await apiClient.get<ComplianceDashboard>('/safety/compliance/dashboard');
    return response.data;
  },

  autoSchedule: async (): Promise<{ scheduledCount: number }> => {
    const response = await apiClient.post('/safety/compliance/auto-schedule');
    return response.data;
  },

  checkCertificates: async (employeeId: string): Promise<CertificateComplianceResponse> => {
    const response = await apiClient.get<CertificateComplianceResponse>(`/safety/compliance/certificate-check/${employeeId}`);
    return response.data;
  },

  checkAccess: async (employeeId: string): Promise<AccessComplianceResponse> => {
    const response = await apiClient.get<AccessComplianceResponse>(`/safety/compliance/access-check/${employeeId}`);
    return response.data;
  },

  getAccessBlocks: async (): Promise<AccessBlock[]> => {
    const response = await apiClient.get<AccessBlock[]>('/safety/compliance/access-blocks');
    return response.data;
  },

  resolveAccessBlock: async (employeeId: string): Promise<void> => {
    await apiClient.post(`/safety/compliance/access-blocks/${employeeId}/resolve`);
  },

  getPrescriptions: async (): Promise<PrescriptionTracker[]> => {
    const response = await apiClient.get<PrescriptionTracker[]>('/safety/compliance/prescriptions');
    return response.data;
  },
};
