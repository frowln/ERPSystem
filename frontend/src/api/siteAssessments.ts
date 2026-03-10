import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiteAssessment {
  id: string;
  projectId?: string;
  projectName?: string;
  assessmentDate: string;
  assessorName: string;
  siteAddress: string;
  accessRoads: boolean;
  powerSupplyAvailable: boolean;
  waterSupplyAvailable: boolean;
  sewageAvailable: boolean;
  groundConditionsOk: boolean;
  noEnvironmentalRestrictions: boolean;
  cranePlacementPossible: boolean;
  materialStorageArea: boolean;
  workersCampArea: boolean;
  neighboringBuildingsSafe: boolean;
  zoningCompliant: boolean;
  geodeticMarksPresent: boolean;
  score: number;
  recommendation: string;
  status: string;
  notes?: string;
  createdAt: string;
  // Geotechnical expansion
  soilTypeDetail?: string;
  groundwaterDepthM?: number;
  bearingCapacityKpa?: number;
  seismicZone?: string;
  // Environmental
  phase1Status?: string;
  phase2Status?: string;
  contaminationNotes?: string;
  // Utilities
  powerCapacityKw?: number;
  waterPressureBar?: number;
  gasAvailable?: boolean;
  telecomAvailable?: boolean;
  sewerAvailable?: boolean;
}

export interface CreateSiteAssessmentRequest {
  projectId?: string;
  siteAddress: string;
  assessorName: string;
  assessmentDate: string;
  accessRoads?: boolean;
  powerSupplyAvailable?: boolean;
  waterSupplyAvailable?: boolean;
  sewageAvailable?: boolean;
  groundConditionsOk?: boolean;
  noEnvironmentalRestrictions?: boolean;
  cranePlacementPossible?: boolean;
  materialStorageArea?: boolean;
  workersCampArea?: boolean;
  neighboringBuildingsSafe?: boolean;
  zoningCompliant?: boolean;
  geodeticMarksPresent?: boolean;
  notes?: string;
  // Geotechnical
  soilTypeDetail?: string;
  groundwaterDepthM?: number;
  bearingCapacityKpa?: number;
  seismicZone?: string;
  // Environmental
  phase1Status?: string;
  phase2Status?: string;
  contaminationNotes?: string;
  // Utilities
  powerCapacityKw?: number;
  waterPressureBar?: number;
  gasAvailable?: boolean;
  telecomAvailable?: boolean;
  sewerAvailable?: boolean;
}

export type UpdateSiteAssessmentRequest = CreateSiteAssessmentRequest;

export interface SiteAssessmentListParams {
  projectId?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const siteAssessmentsApi = {
  /** Get list of all site assessments, optionally filtered by params */
  getList: async (params?: SiteAssessmentListParams): Promise<SiteAssessment[]> => {
    const response = await apiClient.get<any>('/site-assessments', { params });
    const d = response.data;
    return Array.isArray(d) ? d : d?.content ?? [];
  },

  /** Get a single site assessment by ID */
  getById: async (id: string): Promise<SiteAssessment> => {
    const response = await apiClient.get<SiteAssessment>(`/site-assessments/${id}`);
    return response.data;
  },

  /** Create a new site assessment */
  create: async (data: CreateSiteAssessmentRequest): Promise<SiteAssessment> => {
    const response = await apiClient.post<SiteAssessment>('/site-assessments', data);
    return response.data;
  },

  /** Update an existing site assessment */
  update: async (id: string, data: UpdateSiteAssessmentRequest): Promise<SiteAssessment> => {
    const response = await apiClient.put<SiteAssessment>(`/site-assessments/${id}`, data);
    return response.data;
  },

  /** Get all site assessments for a specific project */
  getByProject: async (projectId: string): Promise<SiteAssessment[]> => {
    return siteAssessmentsApi.getList({ projectId });
  },
};
