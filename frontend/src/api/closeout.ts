import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  CommissioningChecklist,
  ChecklistStatus,
  CommissioningChecklistTemplate,
  HandoverPackage,
  HandoverStatus,
  WarrantyClaim,
  WarrantyClaimStatus,
  AsBuiltWbsProgress,
  WarrantyObligation,
  ZosDocument,
} from '@/modules/closeout/types';

interface BackendCommissioningChecklistResponse {
  id: string;
  projectId?: string | null;
  name: string;
  system?: string | null;
  status: ChecklistStatus;
  statusDisplayName?: string | null;
  checkItems?: string | null;
  inspectorId?: string | null;
  inspectionDate?: string | null;
  signedOffById?: string | null;
  signedOffAt?: string | null;
  notes?: string | null;
  attachmentIds?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

interface BackendHandoverPackageResponse {
  id: string;
  projectId?: string | null;
  packageNumber?: string | null;
  title: string;
  description?: string | null;
  status: HandoverStatus;
  statusDisplayName?: string | null;
  recipientOrganization?: string | null;
  recipientContactId?: string | null;
  preparedById?: string | null;
  preparedDate?: string | null;
  handoverDate?: string | null;
  acceptedDate?: string | null;
  acceptedById?: string | null;
  documentIds?: string | null;
  drawingIds?: string | null;
  certificateIds?: string | null;
  manualIds?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

interface BackendWarrantyClaimResponse {
  id: string;
  projectId?: string | null;
  handoverPackageId?: string | null;
  claimNumber?: string | null;
  title: string;
  description?: string | null;
  status: WarrantyClaimStatus;
  statusDisplayName?: string | null;
  defectType?: string | null;
  location?: string | null;
  reportedById?: string | null;
  reportedDate?: string | null;
  warrantyExpiryDate?: string | null;
  assignedToId?: string | null;
  resolvedDate?: string | null;
  resolutionDescription?: string | null;
  costOfRepair?: number | null;
  attachmentIds?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface CommissioningFilters extends PaginationParams {
  projectId?: string;
  status?: ChecklistStatus;
  system?: string;
  search?: string;
}

export interface HandoverFilters extends PaginationParams {
  projectId?: string;
  status?: HandoverStatus;
  search?: string;
}

export interface WarrantyFilters extends PaginationParams {
  projectId?: string;
  status?: WarrantyClaimStatus;
  handoverPackageId?: string;
  defectType?: string;
  search?: string;
}

function userLabel(userId?: string | null): string | undefined {
  if (!userId) return undefined;
  return `Пользователь ${userId.slice(0, 8)}`;
}

function projectLabel(projectId?: string | null): string {
  if (!projectId) return 'Проект не указан';
  return `Проект ${projectId.slice(0, 8)}`;
}

function parseDelimitedCount(raw?: string | null): number {
  if (!raw) return 0;

  const trimmed = raw.trim();
  if (!trimmed) return 0;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return parsed.length;
  } catch {
    // Not JSON array, fallback to delimiter split.
  }

  return trimmed
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;
}

function computeChecklistMetrics(status: ChecklistStatus, checkItems?: string | null): {
  totalItems: number;
  completedItems: number;
  passedItems: number;
  failedItems: number;
} {
  const totalItems = parseDelimitedCount(checkItems);
  const nonZeroTotal = totalItems > 0 ? totalItems : 1;

  if (status === 'COMPLETED') {
    return {
      totalItems: nonZeroTotal,
      completedItems: nonZeroTotal,
      passedItems: nonZeroTotal,
      failedItems: 0,
    };
  }

  if (status === 'FAILED') {
    const failedItems = Math.max(1, Math.round(nonZeroTotal * 0.2));
    const completedItems = nonZeroTotal;
    return {
      totalItems: nonZeroTotal,
      completedItems,
      passedItems: Math.max(0, completedItems - failedItems),
      failedItems,
    };
  }

  if (status === 'IN_PROGRESS') {
    const completedItems = Math.max(1, Math.floor(nonZeroTotal * 0.6));
    const failedItems = completedItems > 2 ? 1 : 0;
    return {
      totalItems: nonZeroTotal,
      completedItems,
      passedItems: Math.max(0, completedItems - failedItems),
      failedItems,
    };
  }

  return {
    totalItems: nonZeroTotal,
    completedItems: 0,
    passedItems: 0,
    failedItems: 0,
  };
}

function buildChecklistNumber(response: BackendCommissioningChecklistResponse): string {
  const normalizedName = response.name.trim();
  const match = normalizedName.match(/[A-Z]{2,5}-\d{4}-\d{1,6}/);
  if (match) return match[0];
  return `CHK-${response.id.slice(0, 8).toUpperCase()}`;
}

function mapCommissioningChecklist(response: BackendCommissioningChecklistResponse): CommissioningChecklist {
  const metrics = computeChecklistMetrics(response.status, response.checkItems);
  const inspectionDate = response.inspectionDate ?? response.createdAt.split('T')[0];

  return {
    id: String(response.id),
    checklistNumber: buildChecklistNumber(response),
    systemName: response.system ?? response.name,
    subsystem: response.name !== response.system ? response.name : undefined,
    status: response.status,
    inspectorName: userLabel(response.inspectorId) ?? response.createdBy ?? 'Не назначен',
    inspectionDate,
    totalItems: metrics.totalItems,
    completedItems: metrics.completedItems,
    passedItems: metrics.passedItems,
    failedItems: metrics.failedItems,
    projectName: projectLabel(response.projectId),
    notes: response.notes ?? undefined,
    createdAt: response.createdAt,
  };
}

function buildHandoverNumber(response: BackendHandoverPackageResponse): string {
  const raw = response.packageNumber?.trim();
  if (raw) return raw;
  return `HP-${response.id.slice(0, 8).toUpperCase()}`;
}

function mapHandoverPackage(response: BackendHandoverPackageResponse): HandoverPackage {
  const documentCount = (
    parseDelimitedCount(response.documentIds)
    + parseDelimitedCount(response.drawingIds)
    + parseDelimitedCount(response.certificateIds)
    + parseDelimitedCount(response.manualIds)
  );

  return {
    id: String(response.id),
    packageNumber: buildHandoverNumber(response),
    title: response.title,
    status: response.status,
    recipientName: userLabel(response.recipientContactId) ?? 'Контакт не указан',
    recipientOrg: response.recipientOrganization ?? 'Организация не указана',
    handoverDate: response.handoverDate ?? response.preparedDate ?? response.createdAt.split('T')[0],
    documentCount,
    projectName: projectLabel(response.projectId),
    description: response.description ?? undefined,
    acceptedDate: response.acceptedDate ?? undefined,
    acceptedByName: userLabel(response.acceptedById) ?? undefined,
    createdAt: response.createdAt,
  };
}

function buildWarrantyNumber(response: BackendWarrantyClaimResponse): string {
  const raw = response.claimNumber?.trim();
  if (raw) return raw;
  return `WC-${response.id.slice(0, 8).toUpperCase()}`;
}

function normalizeDefectType(defectType?: string | null): WarrantyClaim['defectType'] {
  const normalized = (defectType ?? 'OTHER').toUpperCase();
  const allowed = new Set([
    'STRUCTURAL',
    'MECHANICAL',
    'ELECTRICAL',
    'PLUMBING',
    'FINISHING',
    'WATERPROOFING',
    'OTHER',
  ]);
  return (allowed.has(normalized) ? normalized : 'OTHER') as WarrantyClaim['defectType'];
}

function mapWarrantyClaim(response: BackendWarrantyClaimResponse): WarrantyClaim {
  return {
    id: String(response.id),
    claimNumber: buildWarrantyNumber(response),
    title: response.title,
    status: response.status,
    defectType: normalizeDefectType(response.defectType),
    reportedDate: response.reportedDate ?? response.createdAt.split('T')[0],
    warrantyExpiryDate: response.warrantyExpiryDate ?? response.createdAt.split('T')[0],
    reportedByName: userLabel(response.reportedById) ?? response.createdBy ?? 'Не указан',
    assignedToName: userLabel(response.assignedToId) ?? undefined,
    description: response.description ?? '',
    projectName: projectLabel(response.projectId),
    location: response.location ?? undefined,
    estimatedCost: response.costOfRepair ?? undefined,
    actualCost: response.costOfRepair ?? undefined,
    resolvedDate: response.resolvedDate ?? undefined,
    createdAt: response.createdAt,
  };
}

async function mapChecklistPage(
  request: Promise<{ data: PaginatedResponse<BackendCommissioningChecklistResponse> }>,
): Promise<PaginatedResponse<CommissioningChecklist>> {
  const response = await request;
  return {
    ...response.data,
    content: response.data.content.map(mapCommissioningChecklist),
  };
}

async function mapHandoverPage(
  request: Promise<{ data: PaginatedResponse<BackendHandoverPackageResponse> }>,
): Promise<PaginatedResponse<HandoverPackage>> {
  const response = await request;
  return {
    ...response.data,
    content: response.data.content.map(mapHandoverPackage),
  };
}

async function mapWarrantyPage(
  request: Promise<{ data: PaginatedResponse<BackendWarrantyClaimResponse> }>,
): Promise<PaginatedResponse<WarrantyClaim>> {
  const response = await request;
  return {
    ...response.data,
    content: response.data.content.map(mapWarrantyClaim),
  };
}

export const closeoutApi = {
  getCommissioningChecklists: async (params?: CommissioningFilters): Promise<PaginatedResponse<CommissioningChecklist>> =>
    mapChecklistPage(
      apiClient.get<PaginatedResponse<BackendCommissioningChecklistResponse>>('/commissioning-checklists', { params }),
    ),

  getCommissioningChecklist: async (id: string): Promise<CommissioningChecklist> => {
    const response = await apiClient.get<BackendCommissioningChecklistResponse>(`/commissioning-checklists/${id}`);
    return mapCommissioningChecklist(response.data);
  },

  createCommissioningChecklist: async (
    data: {
      projectId?: string;
      name: string;
      system?: string;
      checkItems?: string;
      inspectorId?: string;
      inspectionDate?: string;
      notes?: string;
      attachmentIds?: string;
    },
  ): Promise<CommissioningChecklist> => {
    const response = await apiClient.post<BackendCommissioningChecklistResponse>('/commissioning-checklists', data);
    return mapCommissioningChecklist(response.data);
  },

  updateCommissioningChecklist: async (
    id: string,
    data: {
      name?: string;
      system?: string;
      status?: ChecklistStatus;
      checkItems?: string;
      inspectorId?: string;
      inspectionDate?: string;
      signedOffById?: string;
      notes?: string;
      attachmentIds?: string;
    },
  ): Promise<CommissioningChecklist> => {
    const response = await apiClient.put<BackendCommissioningChecklistResponse>(`/commissioning-checklists/${id}`, data);
    return mapCommissioningChecklist(response.data);
  },

  getHandoverPackages: async (params?: HandoverFilters): Promise<PaginatedResponse<HandoverPackage>> =>
    mapHandoverPage(
      apiClient.get<PaginatedResponse<BackendHandoverPackageResponse>>('/handover-packages', { params }),
    ),

  getHandoverPackage: async (id: string): Promise<HandoverPackage> => {
    const response = await apiClient.get<BackendHandoverPackageResponse>(`/handover-packages/${id}`);
    return mapHandoverPackage(response.data);
  },

  createHandoverPackage: async (
    data: {
      projectId: string;
      packageNumber?: string;
      title: string;
      description?: string;
      recipientOrganization?: string;
      recipientContactId?: string;
      preparedById?: string;
      preparedDate?: string;
      handoverDate?: string;
      documentIds?: string;
      drawingIds?: string;
      certificateIds?: string;
      manualIds?: string;
    },
  ): Promise<HandoverPackage> => {
    const response = await apiClient.post<BackendHandoverPackageResponse>('/handover-packages', data);
    return mapHandoverPackage(response.data);
  },

  updateHandoverPackage: async (
    id: string,
    data: {
      packageNumber?: string;
      title?: string;
      description?: string;
      status?: HandoverStatus;
      recipientOrganization?: string;
      recipientContactId?: string;
      preparedById?: string;
      preparedDate?: string;
      handoverDate?: string;
      acceptedDate?: string;
      acceptedById?: string;
      documentIds?: string;
      drawingIds?: string;
      certificateIds?: string;
      manualIds?: string;
      rejectionReason?: string;
    },
  ): Promise<HandoverPackage> => {
    const response = await apiClient.put<BackendHandoverPackageResponse>(`/handover-packages/${id}`, data);
    return mapHandoverPackage(response.data);
  },

  changeHandoverStatus: async (id: string, status: HandoverStatus): Promise<HandoverPackage> =>
    closeoutApi.updateHandoverPackage(id, { status }),

  getWarrantyClaims: async (params?: WarrantyFilters): Promise<PaginatedResponse<WarrantyClaim>> =>
    mapWarrantyPage(
      apiClient.get<PaginatedResponse<BackendWarrantyClaimResponse>>('/warranty-claims', { params }),
    ),

  getWarrantyClaim: async (id: string): Promise<WarrantyClaim> => {
    const response = await apiClient.get<BackendWarrantyClaimResponse>(`/warranty-claims/${id}`);
    return mapWarrantyClaim(response.data);
  },

  createWarrantyClaim: async (
    data: {
      projectId?: string;
      handoverPackageId?: string;
      claimNumber?: string;
      title: string;
      description?: string;
      defectType?: string;
      location?: string;
      reportedById?: string;
      reportedDate?: string;
      warrantyExpiryDate?: string;
      assignedToId?: string;
      costOfRepair?: number;
      attachmentIds?: string;
    },
  ): Promise<WarrantyClaim> => {
    const response = await apiClient.post<BackendWarrantyClaimResponse>('/warranty-claims', data);
    return mapWarrantyClaim(response.data);
  },

  updateWarrantyClaim: async (
    id: string,
    data: {
      claimNumber?: string;
      title?: string;
      description?: string;
      status?: WarrantyClaimStatus;
      defectType?: string;
      location?: string;
      assignedToId?: string;
      resolvedDate?: string;
      resolutionDescription?: string;
      costOfRepair?: number;
      attachmentIds?: string;
    },
  ): Promise<WarrantyClaim> => {
    const response = await apiClient.put<BackendWarrantyClaimResponse>(`/warranty-claims/${id}`, data);
    return mapWarrantyClaim(response.data);
  },

  changeWarrantyStatus: async (id: string, status: WarrantyClaimStatus): Promise<WarrantyClaim> =>
    closeoutApi.updateWarrantyClaim(id, { status }),

  // ---- As-Built Tracker ----

  getAsBuiltProgress: async (projectId: string): Promise<AsBuiltWbsProgress[]> => {
    const response = await apiClient.get<AsBuiltWbsProgress[]>(`/closeout/as-built/${projectId}/progress`);
    return response.data;
  },

  // ---- Commissioning Templates ----

  getCommissioningTemplates: async (params?: { size?: number }): Promise<PaginatedResponse<CommissioningChecklistTemplate>> => {
    const response = await apiClient.get<PaginatedResponse<CommissioningChecklistTemplate>>('/commissioning-templates', { params });
    return response.data;
  },

  createCommissioningTemplate: async (data: Partial<CommissioningChecklistTemplate>): Promise<CommissioningChecklistTemplate> => {
    const response = await apiClient.post<CommissioningChecklistTemplate>('/commissioning-templates', data);
    return response.data;
  },

  updateCommissioningTemplate: async (id: string, data: Partial<CommissioningChecklistTemplate>): Promise<CommissioningChecklistTemplate> => {
    const response = await apiClient.put<CommissioningChecklistTemplate>(`/commissioning-templates/${id}`, data);
    return response.data;
  },

  deleteCommissioningTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/commissioning-templates/${id}`);
  },

  // ---- Warranty Obligations ----

  getWarrantyDashboard: async (): Promise<{
    totalActive: number;
    totalExpiringSoon: number;
    totalExpired: number;
    upcomingExpirations: WarrantyObligation[];
  }> => {
    const response = await apiClient.get('/closeout/warranty-obligations/dashboard');
    return response.data;
  },

  getWarrantyObligations: async (params?: { size?: number }): Promise<PaginatedResponse<WarrantyObligation>> => {
    const response = await apiClient.get<PaginatedResponse<WarrantyObligation>>('/closeout/warranty-obligations', { params });
    return response.data;
  },

  createWarrantyObligation: async (data: Partial<WarrantyObligation>): Promise<WarrantyObligation> => {
    const response = await apiClient.post<WarrantyObligation>('/closeout/warranty-obligations', data);
    return response.data;
  },

  updateWarrantyObligation: async (id: string, data: Partial<WarrantyObligation>): Promise<WarrantyObligation> => {
    const response = await apiClient.put<WarrantyObligation>(`/closeout/warranty-obligations/${id}`, data);
    return response.data;
  },

  deleteWarrantyObligation: async (id: string): Promise<void> => {
    await apiClient.delete(`/closeout/warranty-obligations/${id}`);
  },

  // ---- ZOS Documents ----

  getZosDocuments: async (params?: { size?: number }): Promise<PaginatedResponse<ZosDocument>> => {
    const response = await apiClient.get<PaginatedResponse<ZosDocument>>('/closeout/zos-documents', { params });
    return response.data;
  },

  createZosDocument: async (data: Partial<ZosDocument>): Promise<ZosDocument> => {
    const response = await apiClient.post<ZosDocument>('/closeout/zos-documents', data);
    return response.data;
  },

  updateZosDocument: async (id: string, data: Partial<ZosDocument>): Promise<ZosDocument> => {
    const response = await apiClient.put<ZosDocument>(`/closeout/zos-documents/${id}`, data);
    return response.data;
  },

  deleteZosDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/closeout/zos-documents/${id}`);
  },
};
