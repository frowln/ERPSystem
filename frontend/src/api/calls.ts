import { apiClient } from './client';
import axios from 'axios';

export type CallType = 'AUDIO' | 'VIDEO';
export type CallStatus = 'RINGING' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'MISSED';

export interface CallParticipant {
  id: string;
  callSessionId: string;
  userId: string;
  userName?: string;
  status: 'INVITED' | 'JOINED' | 'LEFT' | 'DECLINED';
  joinedAt?: string;
  leftAt?: string;
  muted: boolean;
  videoEnabled: boolean;
}

export interface CallSession {
  id: string;
  title?: string;
  projectId?: string;
  channelId?: string;
  initiatorId: string;
  initiatorName?: string;
  callType: CallType;
  status: CallStatus;
  signalingKey: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  metadataJson?: string;
  inviteToken?: string;
  participants: CallParticipant[];
  createdAt: string;
}

export interface CreateCallRequest {
  title?: string;
  projectId?: string;
  channelId?: string;
  callType: CallType;
  initiatorId: string;
  initiatorName?: string;
  inviteeIds?: string[];
}

export const callsApi = {
  list: async (): Promise<CallSession[]> => {
    const response = await apiClient.get<CallSession[]>('/communication/calls');
    return response.data;
  },

  listActive: async (): Promise<CallSession[]> => {
    const response = await apiClient.get<CallSession[]>('/communication/calls/active');
    return response.data;
  },

  create: async (payload: CreateCallRequest): Promise<CallSession> => {
    const response = await apiClient.post<CallSession>('/communication/calls', payload);
    return response.data;
  },

  join: async (callId: string, payload: { userId: string; userName?: string; muted?: boolean; videoEnabled?: boolean }): Promise<CallSession> => {
    const response = await apiClient.post<CallSession>(`/communication/calls/${callId}/join`, payload);
    return response.data;
  },

  leave: async (callId: string, userId: string): Promise<CallSession> => {
    const response = await apiClient.post<CallSession>(`/communication/calls/${callId}/leave`, { userId });
    return response.data;
  },

  end: async (callId: string, endedByUserId: string): Promise<CallSession> => {
    const response = await apiClient.post<CallSession>(`/communication/calls/${callId}/end`, { endedByUserId });
    return response.data;
  },

  generateInviteLink: async (callId: string): Promise<CallSession> => {
    const response = await apiClient.post<CallSession>(`/communication/calls/${callId}/invite-link`);
    return response.data;
  },

  /** Public endpoint — no auth required */
  getByToken: async (token: string): Promise<CallSession> => {
    const response = await axios.get<{ success: boolean; data: CallSession }>(`/api/communication/calls/by-token/${token}`);
    return response.data?.data ?? response.data as unknown as CallSession;
  },

  /** Public endpoint — no auth required */
  joinByLink: async (token: string, guestName: string): Promise<CallSession> => {
    const response = await axios.post<{ success: boolean; data: CallSession }>(`/api/communication/calls/join-by-link/${token}`, { guestName });
    return response.data?.data ?? response.data as unknown as CallSession;
  },
};
