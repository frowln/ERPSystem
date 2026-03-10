import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrganizationSetupRequest {
  name: string;
  inn?: string;
  address?: string;
  phone?: string;
  industry?: string;
}

export interface InviteMembersRequest {
  invitations: { email: string; role: string }[];
}

export interface CreateFirstProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const onboardingApi = {
  setupOrganization: async (data: OrganizationSetupRequest): Promise<void> => {
    await apiClient.post('/organizations/setup', data);
  },

  inviteMembers: async (data: InviteMembersRequest): Promise<void> => {
    await apiClient.post('/organizations/invite', data);
  },

  createFirstProject: async (data: CreateFirstProjectRequest): Promise<void> => {
    await apiClient.post('/projects', data);
  },
};
