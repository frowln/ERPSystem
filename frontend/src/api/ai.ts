import { apiClient } from './client';
import type { AiConversation, AiMessage } from '@/modules/ai/types';

export const aiApi = {
  getConversations: async (): Promise<AiConversation[]> => {
    const response = await apiClient.get<AiConversation[]>('/ai/conversations');
    return response.data;
  },

  getConversation: async (id: string): Promise<AiConversation> => {
    const response = await apiClient.get<AiConversation>(`/ai/conversations/${id}`);
    return response.data;
  },

  createConversation: async (title?: string): Promise<AiConversation> => {
    const response = await apiClient.post<AiConversation>('/ai/conversations', { title });
    return response.data;
  },

  updateConversationTitle: async (id: string, title: string): Promise<AiConversation> => {
    const response = await apiClient.patch<AiConversation>(`/ai/conversations/${id}`, { title });
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/conversations/${id}`);
  },

  getMessages: async (conversationId: string): Promise<AiMessage[]> => {
    const response = await apiClient.get<AiMessage[]>(`/ai/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<AiMessage> => {
    const response = await apiClient.post<AiMessage>(`/ai/conversations/${conversationId}/messages`, { content });
    return response.data;
  },
};
