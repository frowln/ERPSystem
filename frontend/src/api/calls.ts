import { apiClient } from './client';

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
};
